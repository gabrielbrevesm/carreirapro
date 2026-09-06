// Sem `import 'server-only'` de propósito — ver nota em image-registry.ts.
import type { Journalist, JournalistImage } from './types'
import { WikipediaWikimediaImageProvider, classifyIdentityConfidence, type JournalistImageProvider } from './image-provider'
import { saveJournalistImageFile } from './image-registry'

export type SyncOptions = {
  force?: boolean
  dryRun?: boolean
}

export type SyncOutcome = { journalistId: string; status: JournalistImage['status']; detail: string }

// Núcleo do sync — separado do CLI (scripts/sync-journalist-images.ts) pra ser testável com um
// provider mockado (§65) e reutilizável se algum dia precisarmos rodar isso fora de um script.
export async function syncJournalistImage(
  journalist: Journalist,
  options: SyncOptions = {},
  provider: JournalistImageProvider = new WikipediaWikimediaImageProvider()
): Promise<{ image: JournalistImage; outcome: SyncOutcome }> {
  if (journalist.image?.status === 'available' && !options.force) {
    return { image: journalist.image, outcome: { journalistId: journalist.id, status: 'available', detail: 'já sincronizado (use --force pra refazer)' } }
  }

  const candidates = await provider.searchPerson({
    name: journalist.name,
    country: journalist.country,
    profession: 'football journalist pundit',
  })

  let best: { person: Awaited<ReturnType<JournalistImageProvider['resolvePerson']>>; } | null = null
  for (const candidate of candidates) {
    const resolved = await provider.resolvePerson(candidate, { name: journalist.name, country: journalist.country })
    if (resolved && (!best?.person || resolved.confidence > best.person.confidence)) {
      best = { person: resolved }
    }
  }

  if (!best?.person) {
    const image: JournalistImage = { status: 'not_found', fetchedAt: new Date().toISOString() }
    return { image, outcome: { journalistId: journalist.id, status: 'not_found', detail: 'nenhuma página da Wikipédia encontrada' } }
  }

  const status = classifyIdentityConfidence(best.person.confidence)
  if (status !== 'available') {
    const image: JournalistImage = {
      status,
      sourcePageUrl: best.person.pageUrl,
      identityConfidence: best.person.confidence,
      fetchedAt: new Date().toISOString(),
    }
    return { image, outcome: { journalistId: journalist.id, status, detail: `confiança de identidade ${best.person.confidence.toFixed(2)}` } }
  }

  const imageCandidate = await provider.getPrimaryImage(best.person)
  if (!imageCandidate) {
    const image: JournalistImage = {
      status: 'not_found',
      sourcePageUrl: best.person.pageUrl,
      identityConfidence: best.person.confidence,
      fetchedAt: new Date().toISOString(),
    }
    return { image, outcome: { journalistId: journalist.id, status: 'not_found', detail: 'pessoa encontrada, sem imagem na página' } }
  }

  const license = await provider.getLicenseMetadata(imageCandidate)
  if (license && !license.acceptable) {
    const image: JournalistImage = {
      status: 'manual_review',
      sourcePageUrl: best.person.pageUrl,
      sourceUrl: imageCandidate.imageUrl,
      identityConfidence: best.person.confidence,
      license: license.license ?? undefined,
      fetchedAt: new Date().toISOString(),
    }
    return { image, outcome: { journalistId: journalist.id, status: 'manual_review', detail: `licença "${license.license}" exige revisão manual` } }
  }

  if (options.dryRun) {
    const image: JournalistImage = {
      status: 'available',
      sourcePageUrl: best.person.pageUrl,
      sourceUrl: imageCandidate.imageUrl,
      sourceType: imageCandidate.commonsFileTitle ? 'wikimedia_commons' : 'wikipedia',
      identityConfidence: best.person.confidence,
      license: license?.license ?? undefined,
      author: license?.author ?? undefined,
      attributionText: license?.attributionText ?? undefined,
      fetchedAt: new Date().toISOString(),
    }
    return { image, outcome: { journalistId: journalist.id, status: 'available', detail: '[dry-run] encontrado, não baixado' } }
  }

  const downloaded = await provider.download(imageCandidate)
  if (!downloaded) {
    const image: JournalistImage = {
      status: 'failed',
      sourcePageUrl: best.person.pageUrl,
      sourceUrl: imageCandidate.imageUrl,
      identityConfidence: best.person.confidence,
      fetchedAt: new Date().toISOString(),
    }
    return { image, outcome: { journalistId: journalist.id, status: 'failed', detail: 'falha ao baixar o arquivo' } }
  }

  const localPath = await saveJournalistImageFile({
    journalistId: journalist.id,
    country: journalist.country,
    buffer: downloaded.buffer,
    contentType: downloaded.contentType,
  })

  const image: JournalistImage = {
    status: 'available',
    localPath,
    sourcePageUrl: best.person.pageUrl,
    sourceUrl: imageCandidate.imageUrl,
    sourceType: imageCandidate.commonsFileTitle ? 'wikimedia_commons' : 'wikipedia',
    identityConfidence: best.person.confidence,
    license: license?.license ?? undefined,
    licenseUrl: license?.licenseUrl ?? undefined,
    author: license?.author ?? undefined,
    attributionText: license?.attributionText ?? undefined,
    fetchedAt: new Date().toISOString(),
  }

  return { image, outcome: { journalistId: journalist.id, status: 'available', detail: license?.license ?? 'licença não identificada' } }
}
