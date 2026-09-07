import { MEDIA_CONFIG } from './config'
import { isContinentalCompetition } from './markets'
import type { ImportanceLevel, MediaEvent, MediaScope, MarketCountry } from './types'

const IMPORTANCE_RANK: Record<ImportanceLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3, GLOBAL: 4 }
const RANK_OF: Record<ImportanceLevel, number> = IMPORTANCE_RANK

// Determina o escopo de repercussão (seção 19) ANTES de resolver jornalistas — escopo maior
// abre mais mercados, mas nunca obriga cobertura internacional sozinho (ver Regra 1/2, §21).
export function classifyScope(event: MediaEvent): MediaScope {
  if (event.type === 'CUP_FINAL' && isContinentalCompetition(event.competition)) return 'GLOBAL'
  if (event.importance === 'GLOBAL') return 'GLOBAL'

  const hasSecondCountry = !!event.opponentCountry && event.opponentCountry !== event.clubCountry
  const isContinental = isContinentalCompetition(event.competition)

  if (isContinental && RANK_OF[event.importance] >= RANK_OF.HIGH) return 'CONTINENTAL'
  if (event.type.startsWith('TRANSFER') || event.type === 'PLAYER_SALE' || event.type === 'PLAYER_LOAN') {
    if (hasSecondCountry) return 'BILATERAL'
  }
  if (hasSecondCountry && RANK_OF[event.importance] >= RANK_OF.HIGH) return 'BILATERAL'
  if (RANK_OF[event.importance] >= RANK_OF.VERY_HIGH) return 'INTERNATIONAL'

  if (RANK_OF[event.importance] >= RANK_OF.MEDIUM) return 'DOMESTIC'
  return 'LOCAL'
}

// Resolve QUAIS mercados de mídia (países) devem ser considerados — a decisão central da Regra 1
// (doméstico primeiro) e Regra 2/3 (adversário/transferência trazem um segundo mercado).
export function resolveMarkets(event: MediaEvent): MarketCountry[] {
  const markets = new Set<MarketCountry>()
  const { internationalThresholds } = MEDIA_CONFIG
  const importanceRank = RANK_OF[event.importance]

  if (event.clubCountry) markets.add(event.clubCountry)

  const opponentThresholdMet = importanceRank >= RANK_OF[internationalThresholds.opponentMarketMinImportance]
  if (event.opponentCountry && (opponentThresholdMet || event.type.startsWith('TRANSFER') || event.type === 'PLAYER_SALE' || event.type === 'PLAYER_LOAN')) {
    markets.add(event.opponentCountry)
  }

  // Nacionalidade do jogador pode abrir um terceiro mercado — só se o jogador for relevante
  // o bastante (evento pelo menos HIGH) e o próprio jogador for o centro do evento (seção 23).
  const playerMarketMet = importanceRank >= RANK_OF[internationalThresholds.playerNationalityMarketMinImportance]
  if (event.playerNationality && playerMarketMet && event.player) {
    markets.add(event.playerNationality)
  }

  return Array.from(markets)
}
