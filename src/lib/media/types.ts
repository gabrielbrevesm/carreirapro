// Camada de domínio "media intelligence": decide QUEM comenta um acontecimento da carreira e
// POR QUÊ, de forma contextual e auditável — nunca aleatória, nunca deixada livre pro LLM.
// Ver o pipeline completo em src/lib/media/index.ts.

export type MarketCountry =
  | 'brazil'
  | 'england'
  | 'france'
  | 'italy'
  | 'portugal'
  | 'saudi_arabia'
  | 'argentina'
  | 'usa'
  | 'spain'
  | 'turkey'
  | 'germany'

export type JournalistRole =
  | 'reporter'
  | 'commentator'
  | 'analyst'
  | 'transfer_reporter'
  | 'tactical_analyst'
  | 'presenter'
  | 'former_player'
  | 'columnist'

export type JournalistSpecialty =
  | 'tactics'
  | 'transfers'
  | 'club_management'
  | 'coaching'
  | 'scouting'
  | 'players'
  | 'finance'
  | 'history'
  | 'refereeing'
  | 'youth'
  | 'national_team'
  | 'domestic_league'
  | 'international_football'
  | 'locker_room'
  | 'contracts'
  | 'ownership'

export type JournalistTone =
  | 'analytical'
  | 'critical'
  | 'measured'
  | 'provocative'
  | 'factual'
  | 'emotional'
  | 'institutional'
  | 'technical'
  | 'sophisticated'

export type ReliabilityTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'OPINION'

export type AffinityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export type ImageStatus = 'available' | 'not_found' | 'manual_review' | 'failed' | 'pending'

export type ImageSourceType = 'wikipedia' | 'wikimedia_commons'

export type JournalistImage = {
  localPath?: string
  sourceUrl?: string
  sourcePageUrl?: string
  sourceType?: ImageSourceType
  author?: string
  license?: string
  licenseUrl?: string
  attributionText?: string
  fetchedAt?: string
  status: ImageStatus
  identityConfidence?: number
}

// Afinidade com um clube específico — não é torcida, é proximidade editorial (ex: Carragher e
// o Liverpool). Usado para dar boost de score, não pra travar a seleção.
export type ClubAffinity = { clubName: string; level: AffinityLevel }

export type Journalist = {
  id: string
  name: string
  country: MarketCountry
  mediaOutlets: string[]
  primaryLeagues: string[]
  secondaryLeagues: string[]
  clubAffinities: ClubAffinity[]
  competitions: string[]
  roles: JournalistRole[]
  specialties: JournalistSpecialty[]
  eventTypes: MediaEventType[]
  tone: JournalistTone
  controversyLevel: number // 0 (nunca crítico) a 1 (sempre incisivo)
  tacticalDepth: number // 0 a 1
  transferReliability: ReliabilityTier
  internationalReach: number // 0 (só doméstico) a 1 (alcance global)
  domesticReach: number // 0 a 1
  clubSpecificity: number // 0 (generalista) a 1 (extremamente ligado a um clube só)
  defaultWeight: number // peso editorial de base, 0 a 1
  active: boolean
  image?: JournalistImage
  /** Papéis em que este jornalista NUNCA deve ser usado (ex: Ornstein nunca vira comentarista de pós-jogo genérico). */
  excludedRoleInStory?: RoleInStory[]
}

export type MediaOutlet = {
  id: string
  name: string
  country: MarketCountry
}

// ─── Eventos ──────────────────────────────────────────────────

export type MediaEventType =
  | 'MATCH_RESULT'
  | 'TRANSFER_RUMOR'
  | 'TRANSFER_NEGOTIATION'
  | 'TRANSFER_COMPLETED'
  | 'PLAYER_SALE'
  | 'PLAYER_LOAN'
  | 'CONTRACT_RENEWAL'
  | 'CONTRACT_BREAKDOWN'
  | 'PLAYER_INJURY'
  | 'PLAYER_RETURN'
  | 'PLAYER_FORM'
  | 'PLAYER_BREAKOUT'
  | 'PLAYER_CRISIS'
  | 'PLAYER_DISCIPLINE'
  | 'MANAGER_PRESSURE'
  | 'MANAGER_PRAISE'
  | 'TACTICAL_CHANGE'
  | 'LINEUP_CHANGE'
  | 'CAPTAINCY_CHANGE'
  | 'BOARD_DECISION'
  | 'FINANCIAL_DECISION'
  | 'CLUB_CRISIS'
  | 'WINNING_STREAK'
  | 'LOSING_STREAK'
  | 'UNBEATEN_STREAK'
  | 'TITLE_RACE'
  | 'RELEGATION_BATTLE'
  | 'DERBY'
  | 'RIVALRY_MATCH'
  | 'CUP_FINAL'
  | 'CUP_ELIMINATION'
  | 'CHAMPIONS_LEAGUE_EVENT'
  | 'EUROPA_EVENT'
  | 'LIBERTADORES_EVENT'
  | 'CLUB_WORLD_CUP_EVENT'
  | 'RECORD_BROKEN'
  | 'HISTORIC_RESULT'
  | 'CONTROVERSY'
  | 'REFEREE_CONTROVERSY'
  | 'SEASON_START'
  | 'GENERIC'

export type ImportanceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'GLOBAL'

export type MediaScope = 'LOCAL' | 'DOMESTIC' | 'BILATERAL' | 'CONTINENTAL' | 'INTERNATIONAL' | 'GLOBAL'

export type NarrativeArc =
  | 'MANAGER_UNDER_PRESSURE'
  | 'PLAYER_BREAKOUT'
  | 'PLAYER_DECLINE'
  | 'TRANSFER_SAGA'
  | 'TACTICAL_REVOLUTION'
  | 'TITLE_CHARGE'
  | 'RELEGATION_CRISIS'
  | 'UNBEATEN_RUN'
  | 'DEFENSIVE_CRISIS'
  | 'SCORING_PROBLEM'
  | 'YOUTH_EMERGENCE'
  | 'BOARD_CONFLICT'
  | 'SQUAD_DISCONTENT'
  | 'COMEBACK_STORY'

export type ClubReputation = 'LOCAL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ELITE' | 'GLOBAL'

export type MediaEvent = {
  type: MediaEventType
  subtype: string | null

  club: string
  clubCountry: MarketCountry | null
  clubLeague: string | null
  clubReputation: ClubReputation

  opponent: string | null
  opponentCountry: MarketCountry | null
  opponentLeague: string | null

  competition: string | null
  competitionCountry: MarketCountry | null
  competitionScope: MediaScope

  player: string | null
  playerNationality: MarketCountry | null
  playerCurrentClub: string | null
  playerPreviousClub: string | null

  transferOriginClub: string | null
  transferOriginCountry: MarketCountry | null
  transferDestinationClub: string | null
  transferDestinationCountry: MarketCountry | null

  score: string | null
  outcome: 'win' | 'loss' | 'draw' | null
  importance: ImportanceLevel
  rivalry: boolean
  knockoutStage: boolean
  titleImpact: boolean
  relegationImpact: boolean

  manager: string | null
  managerNationality: MarketCountry | null

  recentForm: { wins: number; draws: number; losses: number; streak: 'win' | 'loss' | 'none' | null; streakLength: number }
  historicalContext: string | null

  controversy: boolean
  tacticalContext: boolean

  narrativeArcs: NarrativeArc[]
  isUserClub: boolean

  timestamp: string
}

// ─── Seleção ──────────────────────────────────────────────────

export type RoleInStory =
  | 'BREAKING_NEWS'
  | 'TRANSFER_UPDATE'
  | 'TACTICAL_ANALYSIS'
  | 'POST_MATCH_REACTION'
  | 'CRITICISM'
  | 'PRAISE'
  | 'HISTORICAL_CONTEXT'
  | 'CLUB_MANAGEMENT'
  | 'SCOUTING_ANALYSIS'
  | 'PLAYER_ANALYSIS'
  | 'INTERNATIONAL_REACTION'
  | 'LOCAL_REACTION'
  | 'CONTROVERSY_ANALYSIS'
  | 'REFEREE_ANALYSIS'

export type Sentiment = 'VERY_NEGATIVE' | 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE' | 'VERY_POSITIVE' | 'MIXED'

export type ScoreBreakdown = Record<string, number>

export type JournalistCandidate = {
  journalistId: string
  score: number
  breakdown: ScoreBreakdown
}

export type SelectedJournalist = {
  journalistId: string
  name: string
  outlet: string | null
  relevanceScore: number
  reason: string
  roleInStory: RoleInStory
  suggestedSentiment: Sentiment
  perspective: string
  tone: JournalistTone
}

export type ExcludedJournalist = { journalistId: string; reason: string }

export type MediaSelectionResult = {
  eventId: string
  scope: MediaScope
  importance: ImportanceLevel
  markets: MarketCountry[]
  selectedJournalists: SelectedJournalist[]
  excludedJournalists: ExcludedJournalist[]
  candidates: JournalistCandidate[]
}

// ─── Continuidade / overuse ───────────────────────────────────

export type JournalistMemoryEntry = {
  journalistId: string
  lastUsedAt: string
  usageCount: number
  previousPositions: string[] // curtas notas do "lado" que ele tomou, pra evitar contradição
  sentimentHistory: string[] // valores de Sentiment, mas guardado solto pra casar com o storage genérico do CareerMemory
}
