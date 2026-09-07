import { NextRequest, NextResponse } from 'next/server'
import type OpenAI from 'openai'
import { getOpenAIClient, getConfiguredModel } from '@/lib/ai/openai-client'
import { MASTER_SYSTEM_PROMPT, buildUserMessage } from '@/lib/ai/article-prompt'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndReserveQuota } from '@/lib/supabase/quota'
import { classifyEventType } from '@/lib/mock/event-classifier'
import { computeMediaCoverage } from '@/lib/media'
import type { Career, CareerMemory } from '@/types'
import type { AiArticleResponse } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  const client = getOpenAIClient()
  if (!client) {
    // Sem chave configurada — sinaliza ao cliente para usar o gerador mock local.
    return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 })
  }

  let body: { career: Career; memory: CareerMemory; rawInput: string; isFirstEvent: boolean; attachmentUrl?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (!body.career || !body.memory || typeof body.rawInput !== 'string') {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  // Cota real, verificada no banco (nunca confia no plano que o client alega) — protege o
  // gasto com a OpenAI. A matéria de boas-vindas (isFirstEvent) não consome cota.
  if (!body.isFirstEvent) {
    const admin = createAdminClient()
    if (admin) {
      const supabaseServer = await createClient()
      const quota = await checkAndReserveQuota(supabaseServer, admin, 'articlesGenerated')
      if (!quota.ok) return NextResponse.json({ error: quota.error }, { status: quota.status })
    }
  }

  const model = getConfiguredModel()
  const startTime = Date.now()

  try {
    // Motor de "media intelligence" (src/lib/media): decide QUEM comenta e por quê, ANTES da IA
    // escrever — a IA só decide COMO escrever, nunca escolhe os jornalistas sozinha (ver §82 do
    // pedido do usuário). A classificação de evento aqui é só pra alimentar o motor; o eventType
    // que efetivamente vai pro artigo continua vindo da resposta da IA (parsed.eventType).
    const appEventType = classifyEventType(body.rawInput)
    const mediaCoverage = computeMediaCoverage({ career: body.career, memory: body.memory, rawInput: body.rawInput, appEventType })

    const userText = buildUserMessage({ ...body, hasAttachment: !!body.attachmentUrl, mediaBrief: mediaCoverage.brief })

    // Print/foto do save anexado (calendário, resultados, elenco...) — o modelo já é
    // multimodal (gpt-4o), então mandamos a imagem como parte da própria mensagem em vez de
    // pedir uma descrição textual antes: assim ele lê os fatos direto da imagem.
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: 'text', text: userText }]
    if (body.attachmentUrl) {
      userContent.push({ type: 'image_url', image_url: { url: body.attachmentUrl } })
    }

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: MASTER_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.9,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Resposta vazia do modelo')

    const parsed = JSON.parse(content) as AiArticleResponse

    if (!parsed.headline || !parsed.body) {
      throw new Error('Resposta em formato inesperado')
    }

    return NextResponse.json({
      ...parsed,
      modelUsed: model,
      tokensUsed: completion.usage?.total_tokens ?? 0,
      generationTimeMs: Date.now() - startTime,
      mediaSelection: mediaCoverage.selection,
    })
  } catch (error) {
    console.error('[/api/articles/generate]', error)
    return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 502 })
  }
}
