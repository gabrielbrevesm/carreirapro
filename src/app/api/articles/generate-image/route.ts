import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getOpenAIClient, getConfiguredModel } from '@/lib/ai/openai-client'
import { generateImageWithGemini, isGeminiConfigured } from '@/lib/ai/gemini-client'
import { findPlayerPhotoUrl } from '@/lib/players/transfermarkt-photo'
import { BRIEF_EDITORIAL_SYSTEM_PROMPT, buildBriefEditorialUserMessage } from '@/lib/ai/image-brief-prompt'
import { ART_DIRECTOR_SYSTEM_PROMPT, buildArtDirectorUserMessage } from '@/lib/ai/art-director-prompt'
import { saveDataUrlToStorage } from '@/lib/storage/local-storage'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndReserveQuota } from '@/lib/supabase/quota'
import type { Article, Career } from '@/types'

type ReferenceImage = { mimeType: string; data: string }

const GENERIC_PHOTO_LABELS = new Set([
  'Esquerda', 'Centro', 'Direita', 'Ao', 'Fundo', 'Torcida', 'Torcedores', 'Diretoria', 'Jogadores',
  'Imagem', 'Técnico', 'Jovens', 'Jornalistas', 'Comissão', 'Elenco',
])

function extFromUrl(url: string): 'png' | 'jpeg' {
  return /\.jpe?g/i.test(url) ? 'jpeg' : 'png'
}

// O Brief Editorial lista quem aparece em "## PERSONAGENS NA FOTO". O formato varia (o modelo
// às vezes escreve só o nome numa linha, às vezes "Nome Sobrenome (jogador de futebol
// profissional)" — a instrução pede esse qualificador explicitamente pra evitar confundir
// apelidos com personagens fictícios) — por isso extrai qualquer sequência de palavras
// capitalizadas de CADA linha, em vez de exigir que a linha inteira seja só o nome.
function extractPersonNamesFromBrief(brief: string): string[] {
  const match = brief.match(/##\s*PERSONAGENS NA FOTO([\s\S]*?)(?:\n---|\n##\s|$)/i)
  const section = match?.[1] ?? ''
  if (!section) return []

  const names = new Set<string>()
  const nameRun = /\b[A-ZÀ-Ý][a-zà-ÿ'-]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ'-]+){0,3}\b/g
  for (const rawLine of section.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    for (const found of line.matchAll(nameRun)) {
      const candidate = found[0].trim()
      const firstWord = candidate.split(/\s+/)[0]
      if (!GENERIC_PHOTO_LABELS.has(firstWord)) names.add(candidate)
    }
  }
  return Array.from(names)
}

// A foto de referência do técnico vem do Supabase Storage (URL remota, http/https) desde a
// migração de storage — mas pode ser um caminho local antigo (/uploads/...) em registros
// anteriores a essa migração. Cobre os dois casos.
async function loadImageBuffer(url: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`Falha ao baixar imagem de referência (${res.status}): ${url}`)
    return Buffer.from(await res.arrayBuffer())
  }
  const filePath = path.join(process.cwd(), 'public', url.replace(/^\//, ''))
  return readFile(filePath)
}

// Monta as fotos de referência das pessoas que realmente aparecem NESTA imagem — o técnico
// (só quando ele é o protagonista da foto, senão o rosto dele vaza pra cenas erradas) e
// jogadores reais mencionados, buscados no Transfermarkt. Best-effort: um nome sem foto
// encontrada é simplesmente ignorado, sem travar a geração.
async function buildReferenceImages(
  brief: string,
  career: Career
): Promise<{ images: ReferenceImage[]; primaryUrl: string | null }> {
  const names = extractPersonNamesFromBrief(brief)
  const images: ReferenceImage[] = []
  let primaryUrl: string | null = null

  const managerLastName = career.managerName.trim().split(/\s+/).pop() ?? career.managerName
  const managerInPhoto = names.some((n) => n.toLowerCase().includes(managerLastName.toLowerCase()))

  if (managerInPhoto && career.managerPhotoUrl) {
    try {
      const buffer = await loadImageBuffer(career.managerPhotoUrl)
      images.push({ mimeType: `image/${extFromUrl(career.managerPhotoUrl)}`, data: buffer.toString('base64') })
      primaryUrl = career.managerPhotoUrl
    } catch (error) {
      console.error('[/api/articles/generate-image] falha ao carregar foto do técnico', error)
    }
  }

  const playerNames = names.filter((n) => !n.toLowerCase().includes(managerLastName.toLowerCase()))
  for (const name of playerNames.slice(0, 3)) {
    const photoUrl = await findPlayerPhotoUrl(name)
    if (!photoUrl) continue
    try {
      const buffer = await loadImageBuffer(photoUrl)
      images.push({ mimeType: `image/${extFromUrl(photoUrl)}`, data: buffer.toString('base64') })
      primaryUrl ??= photoUrl
    } catch (error) {
      console.error(`[/api/articles/generate-image] falha ao carregar foto de ${name}`, error)
    }
  }

  return { images, primaryUrl }
}

// Motor principal: Gemini, que preserva muito melhor a semelhança facial de pessoas reais a
// partir de fotos de referência do que o gpt-image-1. Retorna null em qualquer falha para o
// chamador cair no motor de fallback.
async function tryGenerateWithGemini(referenceImages: ReferenceImage[], prompt: string): Promise<string | null> {
  if (!isGeminiConfigured()) return null
  try {
    return await generateImageWithGemini({ prompt, referenceImages: referenceImages.length ? referenceImages : undefined })
  } catch (error) {
    console.error('[/api/articles/generate-image] Gemini falhou, usando gpt-image-1 como fallback', error)
    return null
  }
}

// Fallback: OpenAI gpt-image-1 (usado só se o Gemini não estiver configurado ou falhar). O
// endpoint de edit só aceita uma imagem de referência, então usa apenas a principal.
async function tryEditWithReferencePhoto(
  client: NonNullable<ReturnType<typeof getOpenAIClient>>,
  referencePhotoUrl: string,
  prompt: string
): Promise<string | null> {
  try {
    const { toFile } = await import('openai')
    const buffer = await loadImageBuffer(referencePhotoUrl)
    const image = await toFile(buffer, 'reference.png', { type: 'image/png' })

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
    console.error('[/api/articles/generate-image] edit com foto de referência falhou, usando generate padrão', error)
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

    // Referências faciais das pessoas reais que aparecem NESTA imagem específica — técnico
    // (só quando é o protagonista da foto) e jogadores reais mencionados, via Transfermarkt.
    const { images: referenceImages, primaryUrl } = await buildReferenceImages(brief, body.career)

    let b64: string | null = await tryGenerateWithGemini(referenceImages, imagePrompt.slice(0, 4000))

    if (!b64 && primaryUrl) {
      b64 = await tryEditWithReferencePhoto(client, primaryUrl, imagePrompt.slice(0, 32000))
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
