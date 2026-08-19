import 'server-only'
import { saveDataUrlToStorage } from '@/lib/storage/local-storage'

type WikiSummary = {
  type?: string
  thumbnail?: { source: string }
  originalimage?: { source: string }
}

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

  const foundTitle = await searchTitle(lang, name)
  if (!foundTitle) return null

  return fetchSummary(lang, foundTitle)
}

// Busca best-effort a foto de perfil de um técnico real na Wikipédia (PT, com fallback EN),
// baixa a imagem e salva no storage próprio. Retorna null em qualquer falha (nome não
// encontrado, página sem foto, erro de rede) para o fluxo seguir sem foto de referência.
export async function fetchManagerPhotoUrl(name: string): Promise<string | null> {
  const summary = (await findSummary('pt', name)) ?? (await findSummary('en', name))
  const imageUrl = summary?.originalimage?.source ?? summary?.thumbnail?.source
  if (!imageUrl) return null

  try {
    const imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) })
    if (!imageRes.ok) return null

    const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg'
    const buffer = Buffer.from(await imageRes.arrayBuffer())
    const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`

    return await saveDataUrlToStorage(dataUrl, 'managers')
  } catch {
    return null
  }
}
