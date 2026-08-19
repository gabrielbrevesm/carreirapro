import type { EventType, MatchOutcome } from '@/types'

// Paleta por tipo de evento — usada para gerar uma imagem editorial via SVG (sem custo de IA no protótipo)
const EVENT_GRADIENTS: Record<EventType, [string, string]> = {
  match_result: ['#0f172a', '#1e3a8a'],
  signing: ['#052e16', '#166534'],
  departure: ['#1c1917', '#44403c'],
  squad_update: ['#111827', '#374151'],
  season_start: ['#082f49', '#0369a1'],
  title_won: ['#451a03', '#b45309'],
  dismissal_risk: ['#450a0a', '#991b1b'],
  press_conference: ['#1e1b4b', '#4338ca'],
  custom: ['#18181b', '#3f3f46'],
}

const EVENT_EMOJI: Record<EventType, string> = {
  match_result: '⚽',
  signing: '🤝',
  departure: '✈️',
  squad_update: '📋',
  season_start: '🏁',
  title_won: '🏆',
  dismissal_risk: '🔥',
  press_conference: '🎤',
  custom: '📰',
}

const OUTCOME_BADGE: Record<MatchOutcome, { label: string; color: string }> = {
  win: { label: 'VITÓRIA', color: '#16a34a' },
  loss: { label: 'DERROTA', color: '#dc2626' },
  draw: { label: 'EMPATE', color: '#ca8a04' },
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      lines.push(current.trim())
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3)
}

// Gera uma imagem editorial "de mentira" (SVG data URI) — substitui a chamada real de geração de imagem no protótipo.
// Ainda assim reflete o contexto específico do evento (tipo, placar/resultado, adversário) para parecer conectada à matéria.
export function generateMockArticleImage(params: {
  headline: string
  clubName: string
  eventType: EventType
  outcome?: MatchOutcome | null
  score?: string | null
  opponent?: string | null
}): string {
  const [from, to] = EVENT_GRADIENTS[params.eventType] ?? EVENT_GRADIENTS.custom
  const lines = wrapText(params.headline, 28)
  const lineHeight = 54
  const emoji = EVENT_EMOJI[params.eventType] ?? '📰'
  const badge = params.outcome ? OUTCOME_BADGE[params.outcome] : null

  const svg = `
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)" />
  <g opacity="0.08">
    ${Array.from({ length: 6 })
      .map((_, i) => `<rect x="${-200 + i * 220}" y="0" width="90" height="675" fill="white" transform="skewX(-18)" />`)
      .join('\n    ')}
  </g>
  <rect x="0" y="0" width="1200" height="8" fill="rgba(255,255,255,0.85)" />
  <text x="60" y="70" font-family="Georgia, serif" font-size="26" fill="rgba(255,255,255,0.75)" letter-spacing="4">${escapeXml(params.clubName.toUpperCase())}</text>
  <text x="1140" y="90" font-size="72" text-anchor="end">${emoji}</text>
  ${
    badge && params.score
      ? `<g>
    <rect x="60" y="120" width="220" height="56" rx="12" fill="${badge.color}" />
    <text x="80" y="157" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="white">${escapeXml(badge.label)} · ${escapeXml(params.score)}</text>
  </g>`
      : ''
  }
  ${
    params.opponent
      ? `<text x="60" y="${badge ? 205 : 165}" font-family="Georgia, serif" font-size="22" fill="rgba(255,255,255,0.65)">vs ${escapeXml(params.opponent)}</text>`
      : ''
  }
  ${lines
    .map(
      (line, i) =>
        `<text x="60" y="${420 + i * lineHeight}" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="white">${escapeXml(line)}</text>`
    )
    .join('\n  ')}
  <rect x="0" y="627" width="1200" height="48" fill="rgba(0,0,0,0.35)" />
  <text x="60" y="658" font-family="Georgia, serif" font-size="20" fill="rgba(255,255,255,0.8)">CarreiraPRO · Cobertura Editorial</text>
</svg>`.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
