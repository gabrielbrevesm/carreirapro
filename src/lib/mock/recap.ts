import type { Article, EventType } from '@/types'

const EVENT_TYPE_ICON: Record<EventType, string> = {
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

// Resume as 3 matérias mais recentes (manchete + linha fina) para lembrar o usuário
// do que já aconteceu antes de ele digitar o próximo acontecimento. Baseado nas matérias
// de verdade (não só em campos estruturados de memória, que não cobrem todo tipo de evento).
export function buildRecapSummary(articles: Article[]): string[] {
  const recent = [...articles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .reverse()

  return recent.map((article) => {
    const icon = EVENT_TYPE_ICON[article.eventType ?? 'custom'] ?? '📰'
    return article.subheadline ? `${icon} ${article.headline} — ${article.subheadline}` : `${icon} ${article.headline}`
  })
}
