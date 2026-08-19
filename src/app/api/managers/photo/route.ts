import { NextRequest, NextResponse } from 'next/server'
import { fetchManagerPhotoUrl } from '@/lib/managers/wikipedia-photo'

// Busca best-effort a foto de um técnico real na Wikipédia, usada como referência visual
// (via images.edit) para manter a mesma aparência dele em todas as imagens da carreira.
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 })

  try {
    const photoUrl = await fetchManagerPhotoUrl(name)
    if (!photoUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('[/api/managers/photo]', error)
    return NextResponse.json({ error: 'LOOKUP_FAILED' }, { status: 502 })
  }
}
