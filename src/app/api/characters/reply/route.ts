import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient, getConfiguredModel } from '@/lib/ai/openai-client'
import { CHARACTER_REPLY_SYSTEM_PROMPTS, buildCharacterReplyUserMessage } from '@/lib/ai/character-prompts'
import type { Article, Career, CareerMemory, CharacterId } from '@/types'

const VALID_CHARACTER_IDS: CharacterId[] = ['diretor_esportivo', 'presidente', 'auxiliar_tecnico', 'departamento_medico', 'capitao']

export async function POST(req: NextRequest) {
  const client = getOpenAIClient()
  if (!client) {
    // Sem chave configurada — sinaliza ao cliente para usar a resposta mock local.
    return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 })
  }

  let body: {
    characterId: CharacterId
    career: Career
    memory: CareerMemory
    article: Article
    originalMessage: { headline: string; body: string }
    userReply: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (
    !body.characterId ||
    !VALID_CHARACTER_IDS.includes(body.characterId) ||
    !body.career ||
    !body.memory ||
    !body.article ||
    !body.originalMessage ||
    typeof body.userReply !== 'string'
  ) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const model = getConfiguredModel()
  const startTime = Date.now()

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: CHARACTER_REPLY_SYSTEM_PROMPTS[body.characterId] },
        { role: 'user', content: buildCharacterReplyUserMessage(body) },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Resposta vazia do modelo')

    const parsed = JSON.parse(content) as { body: string }
    if (!parsed.body) throw new Error('Resposta em formato inesperado')

    return NextResponse.json({
      body: parsed.body,
      modelUsed: model,
      tokensUsed: completion.usage?.total_tokens ?? 0,
      generationTimeMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[/api/characters/reply]', error)
    return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 502 })
  }
}
