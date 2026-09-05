import 'server-only'
import { saveDataUrlToStorage } from '@/lib/storage/local-storage'

type WikiSummary = {
  type?: string
  thumbnail?: { source: string }
  originalimage?: { source: string }
}

const cache = new Map<string, string | null>()

async function fetchSummary(lang: 'pt' | 'en', title: string): Promise<WikiSummary | null> {
  try {
    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { 'User-Agent': 'CarreiraPRO/1.0 (app pessoal)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as WikiSummary
    if (data.type === 'disambiguation') return null
    return data
  } catch {
    return null
  }
}

async function searchTitle(lang: 'pt' | 'en', query: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'CarreiraPRO/1.0 (app pessoal)' }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = (await res.json()) as { query?: { search?: Array<{ title: string }> } }
    return data.query?.search?.[0]?.title ?? null
  } catch {
    return null
  }
}

async function findSummary(lang: 'pt' | 'en', name: string): Promise<WikiSummary | null> {
  const direct = await fetchSummary(lang, name)
  if (direct?.thumbnail?.source) return direct

  const foundTitle = await searchTitle(lang, `${name} futebol clube`)
  if (!foundTitle) return null

  return fetchSummary(lang, foundTitle)
}

// Busca best-effort o escudo de um clube na Wikipédia (a imagem do infobox de um clube de
// futebol quase sempre É o escudo) — mesmo padrão de fallback do resto do app: falha em
// silêncio (null) pra UI cair pro ícone genérico, nunca trava esperando o scraping.
export async function fetchClubCrestUrl(clubName: string): Promise<string | null> {
  const key = clubName.trim().toLowerCase()
  if (!key) return null
  if (cache.has(key)) return cache.get(key)!

  try {
    const summary = (await findSummary('pt', clubName)) ?? (await findSummary('en', clubName))
    const imageUrl = summary?.originalimage?.source ?? summary?.thumbnail?.source
    if (!imageUrl) {
      cache.set(key, null)
      return null
    }

    const imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) })
    if (!imageRes.ok) {
      cache.set(key, null)
      return null
    }

    const contentType = imageRes.headers.get('content-type') ?? 'image/png'
    const buffer = Buffer.from(await imageRes.arrayBuffer())
    const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`

    const savedUrl = await saveDataUrlToStorage(dataUrl, 'clubs')
    cache.set(key, savedUrl)
    return savedUrl
  } catch (error) {
    console.error('[wikipedia-crest]', error)
    cache.set(key, null)
    return null
  }
}
