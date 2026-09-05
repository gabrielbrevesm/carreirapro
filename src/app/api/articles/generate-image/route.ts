import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getOpenAIClient, getConfiguredModel } from '@/lib/ai/openai-client'
import { generateImageWithGemini, isGeminiConfigured } from '@/lib/ai/gemini-client'
import { BRIEF_EDITORIAL_SYSTEM_PROMPT, buildBriefEditorialUserMessage } from '@/lib/ai/image-brief-prompt'
import { ART_DIRECTOR_SYSTEM_PROMPT, buildArtDirectorUserMessage } from '@/lib/ai/art-director-prompt'
import { saveDataUrlToStorage } from '@/lib/storage/local-storage'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndReserveQuota } from '@/lib/supabase/quota'
import type { Article, Career } from '@/types'

function extFromPath(url: string): 'png' | 'jpeg' {
  return /\.jpe?g$/i.test(url) ? 'jpeg' : 'png'
}

// A foto de referência do técnico vem do Supabase Storage (URL remota, http/https) desde a
// migração de storage — mas pode ser um caminho local antigo (/uploads/...) em registros
// anteriores a essa migração. Cobre os dois casos.
async function loadImageBuffer(url: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Falha ao baixar imagem de referência (${res.status}): ${url}`)
    return Buffer.from(await res.arrayBuffer())
  }
  const filePath = path.join(process.cwd(), 'public', url.replace(/^\//, ''))
  return readFile(filePath)
}

// Gera a imagem via Gemini, usando a foto de referência do técnico (quando existe) para manter
// a semelhança facial dele nas imagens geradas ao longo da carreira. Retorna null em qualquer
// falha para o chamador cair no motor de fallback (gpt-image-1).
async function tryGenerateWithGemini(managerPhotoUrl: string | null | undefined, prompt: string): Promise<string | null> {
  if (!isGeminiConfigured()) return null
  try {
    let referenceImages: { mimeType: string; data: string }[] | undefined
    if (managerPhotoUrl) {
      const buffer = await loadImageBuffer(managerPhotoUrl)
      referenceImages = [{ mimeType: `image/${extFromPath(managerPhotoUrl)}`, data: buffer.toString('base64') }]
    }
    return await generateImageWithGemini({ prompt, referenceImages })
  } catch (error) {
    console.error('[/api/articles/generate-image] Gemini falhou, usando gpt-image-1 como fallback', error)
    return null
  }
}

// Fallback: OpenAI gpt-image-1 (usado só se o Gemini não estiver configurado ou falhar).
async function tryEditWithManagerPhoto(
  client: NonNullable<ReturnType<typeof getOpenAIClient>>,
  managerPhotoUrl: string,
  prompt: string
): Promise<string | null> {
  try {
    const { toFile } = await import('openai')
    const buffer = await loadImageBuffer(managerPhotoUrl)
    const image = await toFile(buffer, 'manager-reference.png', { type: 'image/png' })

    const editResponse = await client.images.edit({
      model: 'gpt-image-1',
      image,
      prompt,
      size: '1024x1536',
      quality: 'high',
      input_fidelity: 'high',
    })

    return editResponse.data?.[0]?.b64_json ?? null
  } catch (error) {
    console.error('[/api/articles/generate-image] edit com foto do técnico falhou, usando generate padrão', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  const client = getOpenAIClient()
  if (!client) {
    // Sem chave da OpenAI — o Brief Editorial e o Diretor de Arte (motores 2 e 3) dependem dela
    // mesmo quando o Gemini está configurado para a etapa final de renderização da imagem.
    return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 })
  }

  let body: { career: Career; article: Article }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (!body.career || !body.article) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  // Cota real, verificada no banco — protege o gasto com a OpenAI (Brief + Diretor de Arte +
  // gpt-image-1, o passo mais caro do pipeline).
  const admin = createAdminClient()
  if (admin) {
    const supabaseServer = await createClient()
    const quota = await checkAndReserveQuota(supabaseServer, admin, 'imagesGenerated')
    if (!quota.ok) return NextResponse.json({ error: quota.error }, { status: quota.status })
  }

  const model = getConfiguredModel()
  const startTime = Date.now()

  try {
    // MOTOR 2 — Brief Editorial: traduz a matéria em uma especificação de pauta de arte.
    const briefCompletion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: BRIEF_EDITORIAL_SYSTEM_PROMPT },
        { role: 'user', content: buildBriefEditorialUserMessage(body) },
      ],
      temperature: 0.4,
    })
    const brief = briefCompletion.choices[0]?.message?.content
    if (!brief) throw new Error('Brief editorial vazio')

    // MOTOR 3 — Diretor de Arte: transforma o brief em um prompt de imagem detalhado.
    const artCompletion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: ART_DIRECTOR_SYSTEM_PROMPT },
        { role: 'user', content: buildArtDirectorUserMessage(brief) },
      ],
      temperature: 0.6,
    })
    const imagePrompt = artCompletion.choices[0]?.message?.content
    if (!imagePrompt) throw new Error('Prompt de imagem vazio')

    // Motor de renderização: Gemini primeiro (bem melhor pra preservar a semelhança facial de uma
    // pessoa real a partir da foto de referência do técnico), com fallback pro gpt-image-1.
    let b64: string | null = await tryGenerateWithGemini(body.career.managerPhotoUrl, imagePrompt.slice(0, 4000))

    if (!b64 && body.career.managerPhotoUrl) {
      b64 = await tryEditWithManagerPhoto(client, body.career.managerPhotoUrl, imagePrompt.slice(0, 32000))
    }

    if (!b64) {
      // Modelo de imagem — formato vertical 4:5 (mais próximo disponível: 1024x1536).
      // gpt-image-1 sempre retorna base64 (sem response_format).
      const imageResponse = await client.images.generate({
        model: 'gpt-image-1',
        prompt: imagePrompt.slice(0, 4000),
        n: 1,
        size: '1024x1536',
        quality: 'medium',
      })
      b64 = imageResponse.data?.[0]?.b64_json ?? null
    }
    if (!b64) throw new Error('Modelo de imagem não retornou dados')

    // Storage próprio: persiste em disco em vez de devolver um data URL base64 gigante
    // (o antigo esquema inchava o localStorage e não sobrevivia a uma migração de backend).
    const imageUrl = await saveDataUrlToStorage(`data:image/png;base64,${b64}`, 'images')

    return NextResponse.json({
      imageUrl,
      brief,
      imagePrompt,
      tokensUsed: (briefCompletion.usage?.total_tokens ?? 0) + (artCompletion.usage?.total_tokens ?? 0),
      generationTimeMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[/api/articles/generate-image]', error)
    return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 502 })
  }
}
