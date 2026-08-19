import { NextRequest, NextResponse } from 'next/server'

// Busca best-effort a foto de perfil de um jogador real no Transfermarkt via scraping da página
// de busca rápida. Como é scraping de um site de terceiros (sem API oficial pública), pode falhar
// a qualquer momento por mudança de layout ou bloqueio — por isso sempre retorna erro (nunca lança)
// para que o client caia graciosamente no avatar de iniciais, igual ao resto do app.
const cache = new Map<string, string | null>()

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 })

  const key = name.toLowerCase()
  if (cache.has(key)) {
    const cached = cache.get(key)!
    return cached ? NextResponse.json({ photoUrl: cached }) : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`Busca no Transfermarkt falhou (${res.status})`)

    const html = await res.text()
    const match = html.match(/data-src="(https:\/\/img\.a\.transfermarkt\.technology\/portrait\/[^"]+)"/)
    const photoUrl = match ? match[1] : null

    cache.set(key, photoUrl)
    if (!photoUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('[/api/players/photo]', error)
    cache.set(key, null)
    return NextResponse.json({ error: 'LOOKUP_FAILED' }, { status: 502 })
  }
}
