import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/ai/openai-client'
import { stripMarkdownForSpeech } from '@/lib/ai/strip-markdown-for-speech'
import { saveDataUrlToStorage } from '@/lib/storage/local-storage'
import { createClient } from '@/lib/supabase/server'
import type { Article } from '@/types'

// Narração da matéria em áudio (botão "Ouvir matéria"). Usa a mesma chave da OpenAI já
// configurada — sem provedor novo — e cacheia o resultado (audio_url na matéria) pra nunca
// gerar duas vezes a mesma narração.
export async function POST(req: NextRequest) {
  const client = getOpenAIClient()
  if (!client) {
    return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  let body: { article: Article }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (!body.article) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  // A matéria pertence mesmo a este usuário? RLS garante isso na leitura — se não achar,
  // não é dele (ou não existe) e a narração não deve ser gerada nem salva.
  const { data: owned } = await supabase.from('articles').select('id').eq('id', body.article.id).maybeSingle()
  if (!owned) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    const text = [body.article.headline, body.article.subheadline, stripMarkdownForSpeech(body.article.body)]
      .filter(Boolean)
      .join('. ')
      .slice(0, 4000)

    const speech = await client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'onyx',
      input: text,
      instructions:
        'Leia como um locutor de jornalismo esportivo brasileiro experiente: tom natural, envolvente e profissional, com ritmo variado — nunca robótico ou monótono.',
    })

    const buffer = Buffer.from(await speech.arrayBuffer())
    const audioUrl = await saveDataUrlToStorage(`data:audio/mpeg;base64,${buffer.toString('base64')}`, 'audio')

    await supabase.from('articles').update({ audio_url: audioUrl }).eq('id', body.article.id)

    return NextResponse.json({ audioUrl })
  } catch (error) {
    console.error('[/api/articles/speech]', error)
    return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 502 })
  }
}
