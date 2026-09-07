import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient, getConfiguredModel } from '@/lib/ai/openai-client'
import { BOLEIRO_INSIGHTS_SYSTEM_PROMPT, buildBoleiroInsightsUserMessage } from '@/lib/ai/insights-prompt'
import { createClient } from '@/lib/supabase/server'
import type { Career, CareerMemory, Article } from '@/types'

type BoleiroInsights = { tips: string[]; newCareerSuggestions: string[] }

export async function POST(req: NextRequest) {
  const client = getOpenAIClient()
  if (!client) return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  let body: { careers: Career[]; memories: Record<string, CareerMemory>; articles: Article[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (!Array.isArray(body.careers) || body.careers.length === 0) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const model = getConfiguredModel()

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: BOLEIRO_INSIGHTS_SYSTEM_PROMPT },
        { role: 'user', content: buildBoleiroInsightsUserMessage(body) },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Resposta vazia do modelo')

    const parsed = JSON.parse(content) as BoleiroInsights
    if (!Array.isArray(parsed.tips) || parsed.tips.length === 0) {
      throw new Error('Resposta em formato inesperado')
    }

    return NextResponse.json({
      tips: parsed.tips,
      newCareerSuggestions: Array.isArray(parsed.newCareerSuggestions) ? parsed.newCareerSuggestions : [],
    })
  } catch (error) {
    console.error('[/api/insights/generate]', error)
    return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 502 })
  }
}
