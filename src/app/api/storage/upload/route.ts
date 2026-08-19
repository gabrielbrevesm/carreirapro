import { NextRequest, NextResponse } from 'next/server'
import { saveDataUrlToStorage, type UploadCategory } from '@/lib/storage/local-storage'

const VALID_CATEGORIES: UploadCategory[] = ['images', 'managers', 'players']

// Recebe um data URL (foto tirada/selecionada no client) e persiste no storage próprio do app,
// retornando um path curto para ser salvo no lugar do base64 gigante.
export async function POST(req: NextRequest) {
  let body: { dataUrl?: string; category?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (!body.dataUrl || !body.category || !VALID_CATEGORIES.includes(body.category as UploadCategory)) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  try {
    const url = await saveDataUrlToStorage(body.dataUrl, body.category as UploadCategory)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('[/api/storage/upload]', error)
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 502 })
  }
}
