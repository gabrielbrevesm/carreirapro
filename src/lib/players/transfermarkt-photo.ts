import 'server-only'

// Busca best-effort a foto de perfil de um jogador real no Transfermarkt via scraping da página
// de busca rápida. Como é scraping de um site de terceiros (sem API oficial pública), pode falhar
// a qualquer momento por mudança de layout ou bloqueio — por isso sempre retorna null (nunca
// lança) para quem chamar cair graciosamente no fallback (avatar de iniciais, ou geração sem
// referência facial).
const cache = new Map<string, string | null>()

export async function findPlayerPhotoUrl(name: string): Promise<string | null> {
  const key = name.trim().toLowerCase()
  if (!key) return null
  if (cache.has(key)) return cache.get(key)!

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
    return photoUrl
  } catch (error) {
    console.error('[transfermarkt-photo]', error)
    cache.set(key, null)
    return null
  }
}
