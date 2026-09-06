import { NextRequest, NextResponse } from 'next/server'
import { fetchManagerPhotoUrl } from '@/lib/managers/wikipedia-photo'

// Busca best-effort a foto de um comentarista/jornalista real na Wikipédia — os nomes usados em
// "Debate na Imprensa" (Jamie Carragher, Alan Shearer, Fabrizio Romano, Vampeta...) são sempre
// figuras públicas reais, então a mesma busca usada pra técnicos reais serve aqui.
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 })

  try {
    const photoUrl = await fetchManagerPhotoUrl(name)
    if (!photoUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('[/api/pundits/photo]', error)
    return NextResponse.json({ error: 'LOOKUP_FAILED' }, { status: 502 })
  }
}
