import { MEDIA_CONFIG } from './config'
import type { Journalist, JournalistSpecialty, MediaEvent, MarketCountry, ScoreBreakdown } from './types'

const IMPORTANCE_RANK = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3, GLOBAL: 4 } as const

// Traduz características do evento em especialidades relevantes — é isso que conecta "o que
// aconteceu" a "quem tem motivo editorial pra falar disso" sem precisar de if/else por evento.
function relevantSpecialties(event: MediaEvent): JournalistSpecialty[] {
  const specialties: JournalistSpecialty[] = []

  if (event.type.startsWith('TRANSFER') || event.type === 'PLAYER_SALE' || event.type === 'PLAYER_LOAN') {
    specialties.push('transfers', 'contracts')
  }
  if (event.type === 'CONTRACT_RENEWAL' || event.type === 'CONTRACT_BREAKDOWN') specialties.push('contracts')
  if (event.tacticalContext || event.type === 'TACTICAL_CHANGE' || event.type === 'LINEUP_CHANGE') specialties.push('tactics')
  if (event.type === 'MANAGER_PRESSURE' || event.type === 'MANAGER_PRAISE') specialties.push('coaching', 'club_management')
  if (event.type === 'BOARD_DECISION' || event.type === 'CLUB_CRISIS' || event.type === 'FINANCIAL_DECISION') {
    specialties.push('club_management', 'ownership', 'finance')
  }
  if (event.type === 'REFEREE_CONTROVERSY') specialties.push('refereeing')
  if (event.type === 'PLAYER_BREAKOUT' || event.type === 'PLAYER_FORM' || event.type === 'PLAYER_CRISIS') specialties.push('players', 'youth')
  if (event.type === 'HISTORIC_RESULT' || event.type === 'RECORD_BROKEN') specialties.push('history')
  if (event.player && (event.type === 'TRANSFER_RUMOR' || event.type === 'TRANSFER_NEGOTIATION')) specialties.push('scouting')
  if (event.competitionScope === 'CONTINENTAL') specialties.push('international_football')
  if (!specialties.length) specialties.push('domestic_league')

  return specialties
}

function leagueAffinityScore(journalist: Journalist, event: MediaEvent): number {
  const target = [event.competition, event.clubLeague].filter((v): v is string => !!v)
  if (target.some((t) => journalist.primaryLeagues.includes(t))) return 1
  if (target.some((t) => journalist.secondaryLeagues.includes(t))) return 0.5
  return 0
}

function countryAffinityScore(journalist: Journalist, markets: MarketCountry[]): number {
  if (!markets.includes(journalist.country)) return 0
  // Mercado doméstico (o próprio país do clube) pesa mais que um mercado secundário aberto pelo evento.
  return markets[0] === journalist.country ? 1 : 0.7
}

function clubAffinityScore(journalist: Journalist, event: MediaEvent): number {
  const targets = [event.club, event.opponent].filter((v): v is string => !!v)
  let best = 0
  for (const affinity of journalist.clubAffinities) {
    if (!targets.includes(affinity.clubName)) continue
    const value = affinity.level === 'HIGH' ? 1 : affinity.level === 'MEDIUM' ? 0.6 : affinity.level === 'LOW' ? 0.3 : 0
    best = Math.max(best, value)
  }
  return best
}

function eventTypeAffinityScore(journalist: Journalist, event: MediaEvent): number {
  return journalist.eventTypes.includes(event.type) ? 1 : 0
}

function specialtyAffinityScore(journalist: Journalist, event: MediaEvent): number {
  const wanted = relevantSpecialties(event)
  const hits = journalist.specialties.filter((s) => wanted.includes(s)).length
  return Math.min(1, hits / Math.max(1, wanted.length))
}

function competitionAffinityScore(journalist: Journalist, event: MediaEvent): number {
  if (!event.competition) return 0
  return journalist.competitions.includes(event.competition) ? 1 : 0
}

function playerAffinityScore(journalist: Journalist, event: MediaEvent): number {
  if (!event.player) return 0
  return journalist.specialties.includes('players') || journalist.specialties.includes('scouting') ? 1 : 0
}

function internationalImportanceScore(journalist: Journalist, event: MediaEvent): number {
  const scopeMultiplier = { LOCAL: 0, DOMESTIC: 0.2, BILATERAL: 0.6, CONTINENTAL: 0.75, INTERNATIONAL: 0.9, GLOBAL: 1 }
  return journalist.internationalReach * (scopeMultiplier[event.competitionScope] ?? 0.3)
}

function irrelevancePenaltyScore(journalist: Journalist, event: MediaEvent, markets: MarketCountry[]): number {
  const inMarket = markets.includes(journalist.country)
  const hasClubTie = clubAffinityScore(journalist, event) > 0
  if (inMarket || hasClubTie) return 0
  // Jornalista puramente doméstico de um país que não tem nada a ver com o evento: penaliza forte.
  return journalist.domesticReach * (1 - journalist.internationalReach)
}

export function scoreJournalist(params: {
  journalist: Journalist
  event: MediaEvent
  markets: MarketCountry[]
  continuityBonus: number
  overusePenalty: number
}): { score: number; breakdown: ScoreBreakdown } {
  const { journalist, event, markets, continuityBonus, overusePenalty } = params
  const w = MEDIA_CONFIG.weights

  const breakdown: ScoreBreakdown = {
    leagueAffinity: leagueAffinityScore(journalist, event) * w.leagueAffinity,
    countryAffinity: countryAffinityScore(journalist, markets) * w.countryAffinity,
    clubAffinity: clubAffinityScore(journalist, event) * w.clubAffinity,
    eventTypeAffinity: eventTypeAffinityScore(journalist, event) * w.eventTypeAffinity,
    specialtyAffinity: specialtyAffinityScore(journalist, event) * w.specialtyAffinity,
    competitionAffinity: competitionAffinityScore(journalist, event) * w.competitionAffinity,
    playerAffinity: playerAffinityScore(journalist, event) * w.playerAffinity,
    internationalImportance: internationalImportanceScore(journalist, event) * w.internationalImportance,
    continuityBonus: continuityBonus * w.continuityBonus,
    userClubBonus: event.isUserClub && (countryAffinityScore(journalist, markets) > 0 || clubAffinityScore(journalist, event) > 0) ? w.userClubBonus : 0,
    irrelevancePenalty: -irrelevancePenaltyScore(journalist, event, markets) * w.irrelevancePenalty,
    overusePenalty: -overusePenalty * w.overusePenalty,
  }

  // defaultWeight funciona como um leve viés editorial de base (jornalistas mais "centrais"
  // partem de uma vantagem pequena), não domina o score.
  breakdown.baseWeight = journalist.defaultWeight * 0.05

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0)
  return { score: Math.max(0, Math.min(1, score)), breakdown }
}

export { IMPORTANCE_RANK }
