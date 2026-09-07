import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/ai/openai-client'
import { createClient } from '@/lib/supabase/server'

// Transcreve um áudio gravado pelo usuário (relatando o que aconteceu de viva voz, em vez de
// digitar) via Whisper. Devolve só o texto — quem chama decide o que fazer com ele (aqui,
// preenche o campo de texto do composer pro usuário revisar antes de enviar).
export async function POST(req: NextRequest) {
  const client = getOpenAIClient()
  if (!client) return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const audio = formData.get('audio')
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  try {
    const transcription = await client.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'pt',
    })
    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('[/api/articles/transcribe]', error)
    return NextResponse.json({ error: 'TRANSCRIPTION_FAILED' }, { status: 502 })
  }
}
