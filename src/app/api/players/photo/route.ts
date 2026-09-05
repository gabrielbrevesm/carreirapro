import { NextRequest, NextResponse } from 'next/server'
import { findPlayerPhotoUrl } from '@/lib/players/transfermarkt-photo'

// Busca best-effort a foto de perfil de um jogador real no Transfermarkt via scraping da página
// de busca rápida — usada pelo avatar de iniciais no client. Sempre retorna erro (nunca lança)
// pra cair graciosamente no fallback, já que é scraping de terceiro sem API oficial.
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 })

  const photoUrl = await findPlayerPhotoUrl(name)
  if (!photoUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ photoUrl })
}
