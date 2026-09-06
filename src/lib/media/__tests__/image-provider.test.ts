import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { classifyIdentityConfidence } from '../image-provider'

// Testes da integração de imagens SEM depender da internet (§65) — mocka o fetch global.
describe('classifyIdentityConfidence', () => {
  it('confiança alta -> available', () => {
    expect(classifyIdentityConfidence(0.9)).toBe('available')
  })
  it('confiança média -> manual_review', () => {
    expect(classifyIdentityConfidence(0.6)).toBe('manual_review')
  })
  it('confiança baixa -> not_found', () => {
    expect(classifyIdentityConfidence(0.2)).toBe('not_found')
  })
})

describe('WikipediaWikimediaImageProvider (fetch mockado)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('IMAGE-1: página correta + descrição de futebol -> alta confiança', async () => {
    global.fetch = vi.fn(async (url: string | URL) => {
      const u = url.toString()
      if (u.includes('/page/summary/')) {
        return new Response(
          JSON.stringify({
            title: 'Gary Neville',
            description: 'English football pundit and former footballer',
            extract: 'Gary Neville is an English football pundit...',
            thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Gary_Neville.jpg/500px-Gary_Neville.jpg' },
            content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Gary_Neville' } },
          }),
          { status: 200 }
        )
      }
      return new Response('{}', { status: 404 })
    }) as unknown as typeof fetch

    const { WikipediaWikimediaImageProvider } = await import('../image-provider')
    const provider = new WikipediaWikimediaImageProvider()
    const candidates = await provider.searchPerson({ name: 'Gary Neville', country: 'england', profession: 'football pundit' })
    expect(candidates.length).toBeGreaterThan(0)

    const resolved = await provider.resolvePerson(candidates[0], { name: 'Gary Neville', country: 'england' })
    expect(resolved).not.toBeNull()
    expect(resolved!.confidence).toBeGreaterThanOrEqual(0.85)
  })

  it('IMAGE-3: pessoa encontrada sem imagem -> getPrimaryImage retorna null', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ title: 'Alguém Qualquer', description: 'football journalist', extract: 'texto' }),
        { status: 200 }
      )
    ) as unknown as typeof fetch

    const { WikipediaWikimediaImageProvider } = await import('../image-provider')
    const provider = new WikipediaWikimediaImageProvider()
    const image = await provider.getPrimaryImage({
      title: 'Alguém Qualquer',
      lang: 'en',
      description: 'football journalist',
      extract: 'texto',
      confidence: 0.9,
      pageUrl: 'https://en.wikipedia.org/wiki/Alguem',
    })
    expect(image).toBeNull()
  })

  it('IMAGE-2 (regressão real): "David Ornstein" nunca resolve pra "David Beckham" só pelo primeiro nome bater', async () => {
    // Caso real capturado nesta sessão: a busca fuzzy por "David Ornstein football journalist
    // pundit" devolveu "David Beckham" como resultado (Wikipedia CirrusSearch é por palavra, não
    // frase) — e o match antigo (só o primeiro nome) aceitou isso com confiança 1.0. O sobrenome
    // TEM que ser exigido.
    global.fetch = vi.fn(async (url: string | URL) => {
      const u = url.toString()
      if (u.includes('/page/summary/')) {
        return new Response(
          JSON.stringify({
            title: 'David Beckham',
            description: 'English footballer',
            extract: 'David Beckham is an English former professional footballer...',
            thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/David_Beckham.jpg/500px-David_Beckham.jpg' },
            content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/David_Beckham' } },
          }),
          { status: 200 }
        )
      }
      return new Response('{}', { status: 404 })
    }) as unknown as typeof fetch

    const { WikipediaWikimediaImageProvider } = await import('../image-provider')
    const provider = new WikipediaWikimediaImageProvider()
    const resolved = await provider.resolvePerson(
      { title: 'David Beckham', lang: 'en' },
      { name: 'David Ornstein', country: 'england', profession: 'football journalist pundit' }
    )
    expect(resolved).not.toBeNull()
    expect(resolved!.confidence).toBeLessThan(0.65) // nunca pode chegar em manual_review/automatic
  })

  it('IMAGE-2 (regressão real): "Gianluca Di Marzio" não resolve pro pai "Gianni Di Marzio" (mesmo sobrenome, pessoa diferente)', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          title: 'Gianni Di Marzio',
          description: 'Italian football manager and agent',
          extract: 'Gianni Di Marzio is an Italian former football manager...',
          content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Gianni_Di_Marzio' } },
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch

    const { WikipediaWikimediaImageProvider } = await import('../image-provider')
    const provider = new WikipediaWikimediaImageProvider()
    const resolved = await provider.resolvePerson(
      { title: 'Gianni Di Marzio', lang: 'en' },
      { name: 'Gianluca Di Marzio', country: 'italy', profession: 'football journalist pundit' }
    )
    expect(resolved).not.toBeNull()
    expect(resolved!.confidence).toBeLessThan(0.65)
  })

  it('nome com apelido entre aspas ("Julio Maldonado \\"Maldini\\"") ainda bate com o título real da pessoa', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          title: 'Julio Maldonado',
          description: 'Spanish football journalist',
          extract: 'Julio Maldonado, known as Maldini, is a Spanish football journalist...',
          content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Julio_Maldonado' } },
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch

    const { WikipediaWikimediaImageProvider } = await import('../image-provider')
    const provider = new WikipediaWikimediaImageProvider()
    const resolved = await provider.resolvePerson(
      { title: 'Julio Maldonado', lang: 'en' },
      { name: 'Julio Maldonado "Maldini"', country: 'spain', profession: 'football journalist pundit' }
    )
    expect(resolved).not.toBeNull()
    expect(resolved!.confidence).toBeGreaterThanOrEqual(0.85)
  })

  it('IMAGE-8: erro de rede não lança exceção, só retorna null/vazio', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch

    const { WikipediaWikimediaImageProvider } = await import('../image-provider')
    const provider = new WikipediaWikimediaImageProvider()
    const candidates = await provider.searchPerson({ name: 'Qualquer Nome' })
    expect(candidates).toEqual([])
  })
})
