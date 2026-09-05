import { NextRequest, NextResponse } from 'next/server'
import { fetchClubCrestUrl } from '@/lib/clubs/wikipedia-crest'

// Busca best-effort o escudo de um clube real na Wikipédia, usado nos ícones de
// clube da interface (ex: próximos jogos).
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 })

  try {
    const logoUrl = await fetchClubCrestUrl(name)
    if (!logoUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error('[/api/clubs/logo]', error)
    return NextResponse.json({ error: 'LOOKUP_FAILED' }, { status: 502 })
  }
}
