import type { Career, CareerMemory, EventType } from '@/types'
import { parseMatchResult, extractCompetition, hasTacticalContext, KNOWN_COMPETITIONS } from '@/lib/mock/event-classifier'
import { findClubMentioned, CLUB_DATABASE, lookupClub } from '@/lib/mock/club-database'
import { extractProperNouns, filterPlayerNames } from '@/lib/mock/article-generator'
import { marketForCountryName, marketForLeague, isContinentalCompetition } from './markets'
import type { MediaEvent, MediaEventType, ClubReputation, NarrativeArc, MarketCountry } from './types'

const APP_EVENT_TYPE_TO_MEDIA: Record<EventType, MediaEventType> = {
  match_result: 'MATCH_RESULT',
  signing: 'TRANSFER_COMPLETED',
  departure: 'PLAYER_SALE',
  squad_update: 'LINEUP_CHANGE',
  season_start: 'SEASON_START',
  title_won: 'HISTORIC_RESULT',
  dismissal_risk: 'MANAGER_PRESSURE',
  press_conference: 'GENERIC',
  custom: 'GENERIC',
}

const KEYWORD_TYPE_OVERRIDES: Array<{ type: MediaEventType; keywords: string[] }> = [
  { type: 'CUP_FINAL', keywords: ['final da', 'a final', 'decisão do título', 'jogo da final'] },
  { type: 'CUP_ELIMINATION', keywords: ['eliminad', 'caiu n', 'fora da copa', 'fora da champions', 'fora da libertadores'] },
  { type: 'RELEGATION_BATTLE', keywords: ['rebaixamento', 'zona de rebaixamento', 'z4', 'lut contra o descenso'] },
  { type: 'TITLE_RACE', keywords: ['briga pelo título', 'disputa pelo título', 'corrida pelo título', 'lidera o campeonato'] },
  { type: 'PLAYER_INJURY', keywords: ['lesão', 'lesionou', 'lesionado', 'se machucou', 'departamento médico'] },
  { type: 'PLAYER_DISCIPLINE', keywords: ['expulso', 'suspenso', 'cartão vermelho', 'suspensão'] },
  { type: 'CONTRACT_RENEWAL', keywords: ['renovou', 'renovação de contrato', 'estendeu o contrato'] },
  { type: 'CONTRACT_BREAKDOWN', keywords: ['rescis', 'rompimento de contrato'] },
  { type: 'PLAYER_LOAN', keywords: ['emprestei', 'emprestamos', 'por empréstimo', 'foi emprestado'] },
  { type: 'BOARD_DECISION', keywords: ['diretoria decidiu', 'diretoria anunciou', 'presidente do clube anunciou'] },
  { type: 'REFEREE_CONTROVERSY', keywords: ['arbitragem', 'árbitro', 'pênalti não marcado', 'var'] },
  { type: 'CAPTAINCY_CHANGE', keywords: ['novo capitão', 'braçadeira', 'capitão do time'] },
]

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function detectRivalry(opponent: string | null, memory: CareerMemory): boolean {
  if (!opponent) return false
  return memory.rivalries.some((r) => normalize(r.rivalClub) === normalize(opponent))
}

function detectRecentForm(memory: CareerMemory): MediaEvent['recentForm'] {
  const last = memory.recentResults.slice(-8)
  const wins = last.filter((r) => r.outcome === 'win').length
  const draws = last.filter((r) => r.outcome === 'draw').length
  const losses = last.filter((r) => r.outcome === 'loss').length

  let streak: 'win' | 'loss' | 'none' | null = null
  let streakLength = 0
  for (let i = last.length - 1; i >= 0; i--) {
    const outcome = last[i].outcome
    if (outcome === 'draw') break
    if (streak === null) {
      streak = outcome
      streakLength = 1
    } else if (outcome === streak) {
      streakLength++
    } else {
      break
    }
  }

  return { wins, draws, losses, streak: streak ?? 'none', streakLength }
}

function resolveClubReputation(career: Career): ClubReputation {
  switch (career.clubTier) {
    case 'top':
      return 'ELITE'
    case 'mid':
      return 'MEDIUM'
    case 'lower':
      return 'SMALL'
    case 'national':
      return 'LARGE'
    default:
      return 'MEDIUM'
  }
}

function resolveNarrativeArcs(event: Partial<MediaEvent>): NarrativeArc[] {
  const arcs: NarrativeArc[] = []
  const form = event.recentForm
  if (form?.streak === 'loss' && form.streakLength >= 3) arcs.push('MANAGER_UNDER_PRESSURE')
  if (form?.streak === 'loss' && form.streakLength >= 5) arcs.push('RELEGATION_CRISIS')
  if (form?.streak === 'win' && form.streakLength >= 5) arcs.push('TITLE_CHARGE')
  if (form?.streak === 'win' && form.streakLength >= 8) arcs.push('UNBEATEN_RUN')
  if (event.type === 'TRANSFER_NEGOTIATION' || event.type === 'TRANSFER_RUMOR') arcs.push('TRANSFER_SAGA')
  if (event.type === 'TACTICAL_CHANGE') arcs.push('TACTICAL_REVOLUTION')
  if (event.type === 'PLAYER_BREAKOUT') arcs.push('PLAYER_BREAKOUT')
  if (event.type === 'BOARD_DECISION' || event.type === 'CLUB_CRISIS') arcs.push('BOARD_CONFLICT')
  return arcs
}

// Converte o evento cru da carreira (relato do usuário + contexto) num MediaEvent normalizado —
// a ÚNICA entrada aceita pelo restante do motor editorial. Reaproveita os classificadores/
// extratores que já existiam no gerador mock em vez de duplicar heurísticas.
export function normalizeMediaEvent(params: {
  career: Career
  memory: CareerMemory
  rawInput: string
  appEventType: EventType
  isUserClub?: boolean
}): MediaEvent {
  const { career, memory, rawInput, appEventType } = params
  const normalizedInput = normalize(rawInput)

  let type: MediaEventType = APP_EVENT_TYPE_TO_MEDIA[appEventType] ?? 'GENERIC'
  for (const override of KEYWORD_TYPE_OVERRIDES) {
    if (override.keywords.some((kw) => normalizedInput.includes(normalize(kw)))) {
      type = override.type
      break
    }
  }

  const parsedResult = appEventType === 'match_result' ? parseMatchResult(rawInput, career.clubName, career.clubLeague) : null
  const competition = extractCompetition(rawInput) ?? (parsedResult?.competition ?? null) ?? (appEventType === 'match_result' ? career.clubLeague : null)

  const opponentName = parsedResult?.opponent ?? findClubMentioned(rawInput, career.clubName)
  const opponentClub = opponentName ? (CLUB_DATABASE.find((c) => c.name === opponentName) ?? lookupClub(opponentName)) : null

  const clubCountry = marketForCountryName(career.clubCountry)
  const clubLeagueMarket = marketForLeague(career.clubLeague)
  const opponentCountry = opponentClub ? marketForCountryName(opponentClub.country) : null

  const isKnockoutKeyword = ['mata-mata', 'oitavas', 'quartas', 'semifinal', 'final', 'playoff', 'repescagem'].some((kw) =>
    normalizedInput.includes(kw)
  )
  const isChampionsLeague = competition?.toLowerCase().includes('champions') ?? false
  const isEuropa = competition?.toLowerCase().includes('europa league') ?? false
  const isLibertadores = competition?.toLowerCase().includes('libertadores') ?? false
  if (isChampionsLeague) type = type === 'MATCH_RESULT' || type === 'GENERIC' ? 'CHAMPIONS_LEAGUE_EVENT' : type
  if (isEuropa) type = type === 'MATCH_RESULT' || type === 'GENERIC' ? 'EUROPA_EVENT' : type
  if (isLibertadores) type = type === 'MATCH_RESULT' || type === 'GENERIC' ? 'LIBERTADORES_EVENT' : type

  const rivalry = detectRivalry(opponentName, memory)
  if (rivalry && (type === 'MATCH_RESULT' || type === 'GENERIC')) type = 'DERBY'

  const recentForm = detectRecentForm(memory)

  // Jogador citado no relato — se houver, tenta achar clube atual/anterior via fatos já
  // estabelecidos (contratações registradas na memória da carreira).
  const mentionedNames = filterPlayerNames(extractProperNouns(rawInput), career)
  const player = mentionedNames[0] ?? null
  const signing = player ? memory.keySignings.find((s) => normalize(s.playerName) === normalize(player)) : undefined

  const importantScoreDiff = parsedResult?.score
    ? (() => {
        const [a, b] = parsedResult.score.split('-').map((n) => parseInt(n, 10))
        return Number.isNaN(a) || Number.isNaN(b) ? 0 : Math.abs(a - b)
      })()
    : 0

  const event: MediaEvent = {
    type,
    subtype: null,
    club: career.clubName,
    clubCountry: clubCountry ?? clubLeagueMarket,
    clubLeague: career.clubLeague,
    clubReputation: resolveClubReputation(career),
    opponent: opponentName,
    opponentCountry,
    opponentLeague: opponentClub?.league ?? null,
    competition,
    competitionCountry: clubCountry ?? clubLeagueMarket,
    competitionScope: isContinentalCompetition(competition) ? 'CONTINENTAL' : 'DOMESTIC',
    player,
    playerNationality: null,
    playerCurrentClub: signing ? career.clubName : null,
    playerPreviousClub: signing?.fromClub ?? null,
    transferOriginClub: type.startsWith('TRANSFER') || type === 'PLAYER_SALE' ? (appEventType === 'departure' ? career.clubName : signing?.fromClub ?? null) : null,
    transferOriginCountry: null,
    transferDestinationClub: type.startsWith('TRANSFER') && appEventType === 'signing' ? career.clubName : null,
    transferDestinationCountry: null,
    score: parsedResult?.score ?? null,
    outcome: parsedResult?.outcome ?? null,
    importance: 'LOW', // preenchido pelo importance-classifier em seguida
    rivalry,
    knockoutStage: isKnockoutKeyword || isContinentalCompetition(competition),
    titleImpact: normalizedInput.includes('titulo') || normalizedInput.includes('título') || type === 'TITLE_RACE',
    relegationImpact: type === 'RELEGATION_BATTLE',
    manager: career.managerName,
    managerNationality: null,
    recentForm,
    historicalContext: importantScoreDiff >= 4 ? 'goleada' : null,
    controversy: type === 'CONTROVERSY' || type === 'REFEREE_CONTROVERSY',
    tacticalContext: hasTacticalContext(rawInput) || type === 'TACTICAL_CHANGE',
    narrativeArcs: [],
    isUserClub: params.isUserClub ?? true,
    timestamp: new Date().toISOString(),
  }

  event.narrativeArcs = resolveNarrativeArcs(event)

  return event
}

export { KNOWN_COMPETITIONS }
export type { MarketCountry }
