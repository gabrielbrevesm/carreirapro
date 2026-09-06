import { MEDIA_CONFIG } from './config'
import { activeJournalists, getJournalist } from './journalists'
import { classifyImportance } from './importance'
import { classifyScope, resolveMarkets } from './scope'
import { scoreJournalist } from './scoring'
import { computeContinuityAndOveruse } from './continuity'
import type {
  ExcludedJournalist,
  Journalist,
  JournalistCandidate,
  JournalistMemoryEntry,
  MediaEvent,
  MediaSelectionResult,
  RoleInStory,
  SelectedJournalist,
  Sentiment,
} from './types'

const IMPORTANCE_RANK = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3, GLOBAL: 4 } as const

// Papel editorial que este jornalista assumiria NESTE evento — decidido pelo motor, nunca pelo LLM (§82).
function assignRoleInStory(journalist: Journalist, event: MediaEvent): RoleInStory {
  if (journalist.roles.includes('transfer_reporter')) return 'TRANSFER_UPDATE'
  if (event.type === 'REFEREE_CONTROVERSY') return 'REFEREE_ANALYSIS'
  if (event.controversy) return 'CONTROVERSY_ANALYSIS'
  if (event.type === 'HISTORIC_RESULT' || event.type === 'RECORD_BROKEN') return 'HISTORICAL_CONTEXT'
  if (event.type === 'BOARD_DECISION' || event.type === 'CLUB_CRISIS' || event.type === 'FINANCIAL_DECISION') return 'CLUB_MANAGEMENT'
  if (journalist.roles.includes('tactical_analyst') && event.tacticalContext) return 'TACTICAL_ANALYSIS'
  if (event.type === 'PLAYER_BREAKOUT' || event.type === 'PLAYER_FORM' || event.type === 'PLAYER_CRISIS') return 'PLAYER_ANALYSIS'
  if (event.type === 'TRANSFER_RUMOR' || event.type === 'TRANSFER_NEGOTIATION') {
    return journalist.specialties.includes('scouting') ? 'SCOUTING_ANALYSIS' : 'TRANSFER_UPDATE'
  }
  if (journalist.controversyLevel >= 0.6 && (event.type === 'MANAGER_PRESSURE' || event.recentForm.streak === 'loss')) return 'CRITICISM'
  if (event.type === 'MANAGER_PRAISE' || (event.recentForm.streak === 'win' && event.recentForm.streakLength >= 3)) return 'PRAISE'
  if (event.opponentCountry && event.opponentCountry !== event.clubCountry && journalist.country === event.opponentCountry) {
    return 'INTERNATIONAL_REACTION'
  }
  if (journalist.domesticReach >= 0.7 && journalist.internationalReach < 0.3) return 'LOCAL_REACTION'
  return 'POST_MATCH_REACTION'
}

// Sentimento derivado do contexto, nunca sorteado (§39) — resultado, forma recente e o quão
// crítico o jornalista costuma ser.
function assignSentiment(journalist: Journalist, event: MediaEvent, role: RoleInStory): Sentiment {
  if (role === 'CRITICISM') return journalist.controversyLevel >= 0.75 ? 'VERY_NEGATIVE' : 'NEGATIVE'
  if (role === 'PRAISE') return 'POSITIVE'
  if (role === 'TRANSFER_UPDATE' || role === 'HISTORICAL_CONTEXT' || role === 'SCOUTING_ANALYSIS') return 'NEUTRAL'

  if (event.outcome === 'win') {
    if (event.recentForm.streak === 'win' && event.recentForm.streakLength >= 5) return 'VERY_POSITIVE'
    return journalist.controversyLevel >= 0.6 ? 'MIXED' : 'POSITIVE'
  }
  if (event.outcome === 'loss') {
    if (event.recentForm.streak === 'loss' && event.recentForm.streakLength >= 3) return journalist.controversyLevel >= 0.5 ? 'VERY_NEGATIVE' : 'NEGATIVE'
    return journalist.controversyLevel >= 0.6 ? 'NEGATIVE' : 'MIXED'
  }
  if (event.outcome === 'draw') return 'MIXED'
  return 'NEUTRAL'
}

const SPECIALTY_LABEL: Record<string, string> = {
  tactics: 'o encaixe tático',
  transfers: 'os bastidores da movimentação de mercado',
  club_management: 'a gestão do clube',
  coaching: 'o trabalho do treinador',
  scouting: 'o potencial e o histórico do jogador',
  players: 'a atuação individual dos jogadores',
  finance: 'o impacto financeiro',
  history: 'o contexto histórico',
  refereeing: 'a decisão da arbitragem',
  youth: 'o desenvolvimento de jovens',
  national_team: 'a repercussão para a seleção',
  domestic_league: 'o impacto no campeonato nacional',
  international_football: 'a repercussão internacional',
  locker_room: 'o clima nos bastidores do vestiário',
  contracts: 'os termos contratuais',
  ownership: 'a gestão da diretoria/proprietários',
}

// Perspectiva curta e ESPECÍFICA — o que garante que dois jornalistas selecionados não digam a
// mesma coisa (§80). Prioriza a especialidade dominante do jornalista, mas evita repetir uma
// perspectiva já usada por outro selecionado nesta mesma matéria, se ele tiver uma alternativa.
function buildPerspective(journalist: Journalist, usedPerspectives: Set<string>): string {
  for (const specialty of journalist.specialties) {
    const label = SPECIALTY_LABEL[specialty]
    if (label && !usedPerspectives.has(label)) return label
  }
  return SPECIALTY_LABEL[journalist.specialties[0]] ?? 'a repercussão geral do acontecimento'
}

function buildReason(journalist: Journalist, event: MediaEvent, markets: string[]): string {
  const parts: string[] = []
  if (markets[0] === journalist.country) parts.push(`é do mercado doméstico do ${event.club}`)
  else if (markets.includes(journalist.country)) parts.push('representa o mercado do outro lado do acontecimento')
  if (journalist.clubAffinities.some((a) => a.clubName === event.club || a.clubName === event.opponent)) {
    parts.push('tem proximidade editorial direta com um dos clubes envolvidos')
  }
  if (journalist.eventTypes.includes(event.type)) parts.push(`é especialista no tipo de acontecimento (${event.type})`)
  if (!parts.length) parts.push('tem alcance internacional relevante para a magnitude do evento')
  return parts.join('; ')
}

function diversityScore(selected: SelectedJournalist[], candidateRole: RoleInStory): number {
  return selected.some((s) => s.roleInStory === candidateRole) ? -0.5 : 0
}

export function selectMediaCoverage(params: {
  event: MediaEvent
  journalistMemory: Record<string, JournalistMemoryEntry>
  pool?: Journalist[]
}): MediaSelectionResult {
  const { event, journalistMemory } = params
  const importance = classifyImportance(event)
  event.importance = importance
  const scope = classifyScope(event)
  const markets = resolveMarkets(event)

  const pool = (params.pool ?? activeJournalists()).filter((j) => markets.includes(j.country) || j.internationalReach >= 0.4)

  const candidates: JournalistCandidate[] = pool.map((journalist) => {
    const { continuityBonus, overusePenalty } = computeContinuityAndOveruse(journalistMemory[journalist.id], event.timestamp)
    const { score, breakdown } = scoreJournalist({ journalist, event, markets, continuityBonus, overusePenalty })
    return { journalistId: journalist.id, score, breakdown }
  })
  candidates.sort((a, b) => b.score - a.score)

  const countRange = MEDIA_CONFIG.journalistCountByImportance[importance]
  const excluded: ExcludedJournalist[] = []
  const selected: SelectedJournalist[] = []
  const usedPerspectives = new Set<string>()

  for (const candidate of candidates) {
    if (selected.length >= countRange.max) break

    const journalist = getJournalist(candidate.journalistId)
    if (!journalist) continue

    if (candidate.score < MEDIA_CONFIG.minSelectionScore) {
      if (selected.length < countRange.min) {
        excluded.push({ journalistId: journalist.id, reason: 'Score abaixo do mínimo editorial, mas nenhum candidato melhor disponível para o mínimo exigido.' })
      }
      continue
    }

    const role = assignRoleInStory(journalist, event)

    // Regra 4/5/6 do brief: jornalista de mercado não vira comentarista de jogo, analista
    // tático não vira fonte de breaking news, etc. — regra determinística, não sugestão.
    if (journalist.excludedRoleInStory?.includes(role)) {
      excluded.push({ journalistId: journalist.id, reason: `Papel "${role}" é incompatível com o perfil editorial deste jornalista.` })
      continue
    }

    // Diversidade de função (§79): em eventos HIGH+ evita repetir o mesmo papel sem necessidade.
    if (IMPORTANCE_RANK[importance] >= IMPORTANCE_RANK.HIGH && selected.length > 0) {
      const penalty = diversityScore(selected, role)
      if (penalty < 0 && candidate.score + penalty < MEDIA_CONFIG.minSelectionScore && selected.length >= countRange.min) {
        excluded.push({ journalistId: journalist.id, reason: 'Papel redundante com outro jornalista já selecionado (diversidade de função).' })
        continue
      }
    }

    const sentiment = assignSentiment(journalist, event, role)
    const perspective = buildPerspective(journalist, usedPerspectives)
    usedPerspectives.add(perspective)
    selected.push({
      journalistId: journalist.id,
      name: journalist.name,
      outlet: journalist.mediaOutlets[0] ?? null,
      relevanceScore: candidate.score,
      reason: buildReason(journalist, event, markets),
      roleInStory: role,
      suggestedSentiment: sentiment,
      perspective,
      tone: journalist.tone,
    })
  }

  // Fallback (§56): sem ninguém adequado o bastante, mas o evento exige um mínimo — tenta um
  // generalista do mercado doméstico antes de desistir de vez.
  if (selected.length < countRange.min && markets.length > 0) {
    const domesticGeneralists = pool
      .filter((j) => j.country === markets[0] && !selected.some((s) => s.journalistId === j.id))
      .sort((a, b) => b.defaultWeight - a.defaultWeight)

    for (const journalist of domesticGeneralists) {
      if (selected.length >= countRange.min) break
      const role = assignRoleInStory(journalist, event)
      if (journalist.excludedRoleInStory?.includes(role)) continue
      const perspective = buildPerspective(journalist, usedPerspectives)
      usedPerspectives.add(perspective)
      selected.push({
        journalistId: journalist.id,
        name: journalist.name,
        outlet: journalist.mediaOutlets[0] ?? null,
        relevanceScore: MEDIA_CONFIG.minSelectionScore,
        reason: 'Fallback: generalista do mercado doméstico, nenhum especialista mais específico atingiu o score mínimo.',
        roleInStory: role,
        suggestedSentiment: assignSentiment(journalist, event, role),
        perspective,
        tone: journalist.tone,
      })
    }
  }

  return {
    eventId: `${event.type}-${event.timestamp}`,
    scope,
    importance,
    markets,
    selectedJournalists: selected,
    excludedJournalists: excluded,
    candidates,
  }
}
