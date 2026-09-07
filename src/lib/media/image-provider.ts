// Sem `import 'server-only'` de propósito — ver nota em image-registry.ts (este módulo também
// roda no script de sync via tsx, fora do Next.js).
import type { ImageSourceType, JournalistImage } from './types'

// User-Agent descritivo exigido pela política de acesso da Wikimedia — identifica o app, não o
// usuário (nunca inclui dado pessoal). Sem isso (ou repetindo rápido demais), a API passa a
// devolver 429 "too many requests" — foi exatamente o que aconteceu na primeira tentativa de
// sync em lote desta sessão.
const WIKIMEDIA_USER_AGENT = 'CarreiraPRO/1.0 (https://modocarreirapro.com.br; contato via o site)'

// Provider desacoplado da lógica editorial (§59) — hoje só Wikipedia/Wikimedia Commons, mas a
// interface permite trocar/adicionar fontes no futuro sem tocar no motor de seleção.
export interface JournalistImageProvider {
  searchPerson(identity: PersonIdentity): Promise<PersonSearchResult[]>
  resolvePerson(candidate: PersonSearchResult, identity: PersonIdentity): Promise<ResolvedPerson | null>
  getPrimaryImage(person: ResolvedPerson): Promise<ImageCandidate | null>
  getLicenseMetadata(image: ImageCandidate): Promise<ImageLicenseMetadata | null>
  download(image: ImageCandidate): Promise<DownloadedImage | null>
}

export type PersonIdentity = {
  name: string
  aliases?: string[]
  country?: string
  profession?: string
  affiliations?: string[]
}

export type PersonSearchResult = { title: string; lang: 'pt' | 'en' }

export type ResolvedPerson = {
  title: string
  lang: 'pt' | 'en'
  description: string | null
  extract: string | null
  confidence: number
  pageUrl: string
}

export type ImageCandidate = {
  imageUrl: string
  pageUrl: string
  commonsFileTitle: string | null
}

export type ImageLicenseMetadata = {
  license: string | null
  licenseUrl: string | null
  author: string | null
  attributionText: string | null
  acceptable: boolean
}

export type DownloadedImage = { buffer: Buffer; contentType: string }

type WikiSummary = {
  type?: string
  title?: string
  description?: string
  extract?: string
  thumbnail?: { source: string }
  originalimage?: { source: string }
  content_urls?: { desktop?: { page?: string } }
}

const OCCUPATION_KEYWORDS = [
  'journalist', 'jornalista', 'pundit', 'commentator', 'comentarista', 'broadcaster', 'presenter',
  'apresentador', 'sports presenter', 'football', 'futebol', 'soccer', 'analyst', 'analista',
  'reporter', 'repórter', 'columnist', 'colunista', 'former footballer', 'ex-futebolista', 'ex-jogador',
]

// Wikipedia costuma descrever a nacionalidade como gentílico ("English pundit"), não o nome do
// país ("England") — sem isso o countryMatch nunca bateria pra ninguém.
const COUNTRY_DEMONYMS: Record<string, string[]> = {
  england: ['english', 'inglês', 'ingles', 'britânico', 'britanico', 'british'],
  brazil: ['brazilian', 'brasileiro'],
  italy: ['italian', 'italiano'],
  spain: ['spanish', 'espanhol'],
  germany: ['german', 'alemão', 'alemao'],
  france: ['french', 'francês', 'frances'],
  argentina: ['argentine', 'argentinian', 'argentino'],
  portugal: ['portuguese', 'português', 'portugues'],
  turkey: ['turkish', 'turco'],
  usa: ['american', 'americano'],
  saudi_arabia: ['saudi', 'saudita'],
}

// Exige o sobrenome (última palavra "de verdade" do nome buscado, ignorando apelidos entre
// aspas) presente como palavra inteira no título resolvido, E que a maioria das palavras do
// nome buscado apareça no título — rejeita corretamente "David Beckham" pra uma busca por
// "David Ornstein" (só a palavra "David" bateria) mantendo casos legítimos como apelidos
// entre aspas ("Julio Maldonado \"Maldini\"" -> título "Julio Maldonado").
function nameMatchesTitle(identityName: string, title: string): boolean {
  const cleanedIdentity = identityName.replace(/["“”].*?["“”]/g, ' ')
  const identityWords = normalizeForMatch(cleanedIdentity)
    .split(/\s+/)
    .filter((w) => w.length > 1)
  if (identityWords.length === 0) return false

  const titleWords = new Set(normalizeForMatch(title).split(/\s+/))
  const firstName = identityWords[0]
  const surname = identityWords[identityWords.length - 1]

  // Sobrenome sozinho não basta — outro caso real pego nesta sessão: "Gianluca Di Marzio"
  // resolvia pra "Gianni Di Marzio" (pai dele, também jornalista/dirigente real, mesmo
  // sobrenome). Exige o primeiro nome E o sobrenome como palavras inteiras no título.
  const firstNameMatches = identityWords.length === 1 || titleWords.has(firstName)
  const surnameMatches = titleWords.has(surname)

  const overlap = identityWords.filter((w) => titleWords.has(w)).length / identityWords.length
  return firstNameMatches && surnameMatches && overlap >= 0.5
}

function normalizeForMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': WIKIMEDIA_USER_AGENT, ...headers }, signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function fetchSummary(lang: 'pt' | 'en', title: string): Promise<WikiSummary | null> {
  const data = await fetchJson<WikiSummary>(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
  if (!data || data.type === 'disambiguation') return null
  return data
}

async function searchTitle(lang: 'pt' | 'en', query: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`
  const data = await fetchJson<{ query?: { search?: Array<{ title: string }> } }>(url)
  return data?.query?.search?.[0]?.title ?? null
}

function extractCommonsFileTitle(imageUrl: string): string | null {
  // URLs de thumb: .../commons/thumb/a/ab/Nome_do_Arquivo.jpg/500px-Nome_do_Arquivo.jpg
  // URLs diretas:  .../commons/a/ab/Nome_do_Arquivo.jpg
  const match = imageUrl.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+?)(?:\/\d+px-.*)?$/i)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export class WikipediaWikimediaImageProvider implements JournalistImageProvider {
  async searchPerson(identity: PersonIdentity): Promise<PersonSearchResult[]> {
    const results: PersonSearchResult[] = []
    // Query com desambiguador (§58, etapa 1) — reduz colisão com homônimos.
    const qualifiedQuery = identity.profession ? `${identity.name} ${identity.profession}` : identity.name

    for (const lang of ['pt', 'en'] as const) {
      const direct = await fetchSummary(lang, identity.name)
      if (direct) {
        results.push({ title: direct.title ?? identity.name, lang })
        continue
      }
      const found = await searchTitle(lang, qualifiedQuery)
      if (found) results.push({ title: found, lang })
    }

    return results
  }

  async resolvePerson(candidate: PersonSearchResult, identity: PersonIdentity): Promise<ResolvedPerson | null> {
    const summary = await fetchSummary(candidate.lang, candidate.title)
    if (!summary) return null

    const haystack = normalizeForMatch(`${summary.description ?? ''} ${summary.extract ?? ''}`)

    // §58/§60: nunca aceitar "nome parecido" como a pessoa certa. Um match só pelo primeiro
    // nome (ex: "David" bater em "David Beckham" quando procurávamos "David Ornstein") já
    // causou um caso real de foto trocada nesta base — por isso exige o SOBRENOME (mais
    // distintivo) presente no título, mais uma sobreposição forte de palavras entre o nome
    // buscado e o título resolvido.
    const nameMatch = nameMatchesTitle(identity.name, summary.title ?? '')
    const occupationMatch = OCCUPATION_KEYWORDS.some((kw) => haystack.includes(kw))
    const demonyms = identity.country ? (COUNTRY_DEMONYMS[identity.country] ?? [identity.country]) : []
    const countryMatch = identity.country ? haystack.includes(normalizeForMatch(identity.country)) || demonyms.some((d) => haystack.includes(d)) : false

    // Sem o sobrenome batendo, não é a mesma pessoa — nunca pode chegar em "automatic",
    // independente de quantos outros sinais (ocupação, país) coincidirem por acaso.
    if (!nameMatch) {
      return {
        title: summary.title ?? candidate.title,
        lang: candidate.lang,
        description: summary.description ?? null,
        extract: summary.extract ?? null,
        confidence: 0,
        pageUrl: summary.content_urls?.desktop?.page ?? `https://${candidate.lang}.wikipedia.org/wiki/${encodeURIComponent(summary.title ?? candidate.title)}`,
      }
    }

    let confidence = 0.4
    if (occupationMatch) confidence += 0.4
    if (countryMatch) confidence += 0.2
    if (!occupationMatch && !countryMatch) confidence = Math.min(confidence, 0.5) // sem nenhum sinal de contexto, nunca alta confiança

    return {
      title: summary.title ?? candidate.title,
      lang: candidate.lang,
      description: summary.description ?? null,
      extract: summary.extract ?? null,
      confidence,
      pageUrl: summary.content_urls?.desktop?.page ?? `https://${candidate.lang}.wikipedia.org/wiki/${encodeURIComponent(summary.title ?? candidate.title)}`,
    }
  }

  async getPrimaryImage(person: ResolvedPerson): Promise<ImageCandidate | null> {
    const summary = await fetchSummary(person.lang, person.title)
    const imageUrl = summary?.originalimage?.source ?? summary?.thumbnail?.source
    if (!imageUrl) return null

    return { imageUrl, pageUrl: person.pageUrl, commonsFileTitle: extractCommonsFileTitle(imageUrl) }
  }

  async getLicenseMetadata(image: ImageCandidate): Promise<ImageLicenseMetadata | null> {
    if (!image.commonsFileTitle) return null

    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      `File:${image.commonsFileTitle}`
    )}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`

    type CommonsResponse = {
      query?: { pages?: Record<string, { imageinfo?: Array<{ extmetadata?: Record<string, { value?: string }> }> }> }
    }
    const data = await fetchJson<CommonsResponse>(url)
    const pages = data?.query?.pages
    const page = pages ? Object.values(pages)[0] : null
    const meta = page?.imageinfo?.[0]?.extmetadata
    if (!meta) return null

    const stripHtml = (v?: string) => (v ? v.replace(/<[^>]+>/g, '').trim() : null)
    const license = meta.LicenseShortName?.value ?? meta.License?.value ?? null
    const author = stripHtml(meta.Artist?.value) ?? stripHtml(meta.Credit?.value)
    const attributionRequired = normalizeForMatch(meta.AttributionRequired?.value ?? '') === 'true'

    const ACCEPTABLE_LICENSES = ['cc-by', 'cc0', 'public domain', 'pd']
    const acceptable = license ? ACCEPTABLE_LICENSES.some((l) => normalizeForMatch(license).includes(l)) : false

    return {
      license,
      licenseUrl: license ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(image.commonsFileTitle)}` : null,
      author,
      attributionText: attributionRequired && author ? `Foto: ${author} (Wikimedia Commons, ${license})` : author ? `Foto: ${author}` : null,
      acceptable,
    }
  }

  async download(image: ImageCandidate): Promise<DownloadedImage | null> {
    try {
      const res = await fetch(image.imageUrl, { headers: { 'User-Agent': WIKIMEDIA_USER_AGENT }, signal: AbortSignal.timeout(10000) })
      if (!res.ok) return null
      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      const buffer = Buffer.from(await res.arrayBuffer())
      return { buffer, contentType }
    } catch {
      return null
    }
  }
}

// Thresholds de identidade (§60) — nunca baixa automaticamente abaixo de "automatic".
export const IDENTITY_THRESHOLDS = { automatic: 0.85, manualReview: 0.5 }

export function classifyIdentityConfidence(confidence: number): JournalistImage['status'] {
  if (confidence >= IDENTITY_THRESHOLDS.automatic) return 'available'
  if (confidence >= IDENTITY_THRESHOLDS.manualReview) return 'manual_review'
  return 'not_found'
}

export type { ImageSourceType }
