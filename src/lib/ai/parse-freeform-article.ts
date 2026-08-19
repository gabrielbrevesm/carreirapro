// Faz o parse do markdown livre escrito pela IA (seguindo o prompt mestre) em blocos tipados,
// para que cada fase da matéria (abertura, seções, debate, redes sociais, editorial) vire um
// componente visual distinto — em vez de um único bloco de texto corrido.

export type FreeformQuoteEntry = {
  name: string
  quotes: string[]
}

export type FreeformBlock =
  | { type: 'intro'; content: string }
  | { type: 'debate'; heading: string; entries: FreeformQuoteEntry[] }
  | { type: 'social'; heading: string; entries: FreeformQuoteEntry[] }
  | { type: 'editorial'; heading: string; author: string | null; content: string }
  | { type: 'section'; heading: string; content: string }

export type ParsedFreeformArticle = {
  outletLabel: string | null
  blocks: FreeformBlock[]
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function stripQuoteMarks(text: string): string {
  return text.trim().replace(/^["""]/, '').replace(/["""]$/, '').trim()
}

// Extrai {name, quotes} de sub-blocos "### Nome" dentro de uma seção (debate/redes sociais)
function parseSubEntries(sectionBody: string): FreeformQuoteEntry[] {
  const lines = sectionBody.split('\n')
  const entries: FreeformQuoteEntry[] = []
  let current: FreeformQuoteEntry | null = null
  let pendingParagraph = ''

  const flushParagraphAsQuote = () => {
    if (current && !current.quotes.length && pendingParagraph.trim()) {
      current.quotes.push(stripQuoteMarks(pendingParagraph.trim()))
    }
    pendingParagraph = ''
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const headingMatch = line.match(/^###\s+(.*)$/)
    if (headingMatch) {
      flushParagraphAsQuote()
      if (current) entries.push(current)
      current = { name: headingMatch[1].trim(), quotes: [] }
      continue
    }
    const quoteMatch = line.match(/^>\s?(.*)$/)
    if (quoteMatch && current) {
      current.quotes.push(stripQuoteMarks(quoteMatch[1]))
      continue
    }
    if (line && current) {
      pendingParagraph += `${line} `
    }
  }
  flushParagraphAsQuote()
  if (current) entries.push(current)

  return entries.filter((e) => e.quotes.length > 0)
}

export function parseFreeformArticle(body: string): ParsedFreeformArticle {
  const normalizedBody = body.replace(/\r\n/g, '\n').trim()
  const lines = normalizedBody.split('\n')

  let outletLabel: string | null = null
  let startIndex = 0

  if (lines[0]?.match(/^#\s+/)) {
    const h1Content = lines[0].replace(/^#\s+/, '').trim()
    const pipeIndex = h1Content.indexOf('|')
    if (pipeIndex !== -1) {
      outletLabel = h1Content.slice(0, pipeIndex).trim()
    }
    startIndex = 1
  }

  const remaining = lines.slice(startIndex).join('\n')

  // Divide em blocos por títulos H2 (##). O conteúdo antes do primeiro H2 é a introdução.
  const h2Regex = /^##\s+(.*)$/gm
  const matches = Array.from(remaining.matchAll(h2Regex))

  const blocks: FreeformBlock[] = []

  const introContent = matches.length > 0 ? remaining.slice(0, matches[0].index).trim() : remaining.trim()
  if (introContent) {
    blocks.push({ type: 'intro', content: introContent })
  }

  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i][1].trim()
    const contentStart = (matches[i].index ?? 0) + matches[i][0].length
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index : remaining.length
    const sectionBody = remaining.slice(contentStart, contentEnd).trim()

    const normalizedHeading = normalize(heading)
    const isSocialHeading = normalizedHeading.includes('redes sociais') || normalizedHeading.includes('social')

    // A IA varia o texto dos subtítulos (ex: "Debate na Sky Sports", "Repercussão de comentaristas",
    // "O que dizem os especialistas"...). Em vez de depender do texto exato do título, detectamos
    // pela ESTRUTURA: se a seção tem sub-blocos "### Nome" com citações, é um painel de falas —
    // só decidimos se é "social" (rede social) ou "debate" (imprensa/comentaristas) pelo título.
    const subEntries = parseSubEntries(sectionBody)

    if (normalizedHeading.startsWith('editorial')) {
      const dashMatch = heading.match(/editorial\s*[—-]\s*(.+)/i)
      blocks.push({ type: 'editorial', heading, author: dashMatch ? dashMatch[1].trim() : null, content: sectionBody })
    } else if (subEntries.length > 0 && isSocialHeading) {
      blocks.push({ type: 'social', heading, entries: subEntries })
    } else if (subEntries.length > 0) {
      blocks.push({ type: 'debate', heading, entries: subEntries })
    } else {
      blocks.push({ type: 'section', heading, content: sectionBody })
    }
  }

  return { outletLabel, blocks }
}
