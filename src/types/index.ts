// ─── Perfil e assinatura ────────────────────────────────────

export type UserPlan = 'free' | 'pro'

export type Profile = {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
}

export type UsageTracking = {
  articlesGenerated: number
  imagesGenerated: number
  squadAnalyses: number
}

// ─── Carreira ────────────────────────────────────────────────

export type CareerManagerType = 'real' | 'fictional'
export type ClubTier = 'top' | 'mid' | 'lower' | 'national'
// Texto livre digitado pelo próprio usuário (ex: "Sobreviver na primeira temporada")
export type InitialObjective = string

export type Career = {
  id: string
  slug: string
  managerType: CareerManagerType
  managerName: string
  managerBio: string | null
  managerOrigin: string | null
  // Foto de referência do técnico fictício (armazenada no storage próprio), usada para
  // manter consistência visual quando geramos imagens dele ao longo da carreira.
  managerPhotoUrl: string | null
  clubName: string
  clubLeague: string
  clubCountry: string
  clubTier: ClubTier | null
  seasonStart: string
  initialObjective: InitialObjective | null
  currentSeason: string | null
  eventsCount: number
  isActive: boolean
  // Perfil pessoal do técnico — tudo opcional, preenchido na tela "Técnico" da carreira.
  // Quando presente, a IA usa como contexto extra ao escrever as matérias.
  playingStyle: string | null
  preferredFormation: string | null
  personalTastes: string | null
  careerMilestones: string | null
  createdAt: string
  updatedAt: string
}

export type MatchOutcome = 'win' | 'loss' | 'draw'

export type ResultRecord = {
  competition: string
  opponent: string
  isHome: boolean
  score: string
  outcome: MatchOutcome
  date: string
}

export type CareerMemory = {
  careerId: string
  establishedFacts: string[]
  recurringCharacters: Array<{ name: string; role: string; relationship: string }>
  activeNarratives: Array<{ title: string; description: string; startedAt: string }>
  rivalries: Array<{ rivalClub: string; description: string }>
  playerHighlights: Record<string, string>
  recentResults: ResultRecord[]
  keySignings: Array<{ playerName: string; fromClub: string; season: string; context: string }>
  // Só o usuário pode definir isso (não é inferido pela IA) — sem capitão definido,
  // o personagem paralelo "Capitão" nunca se manifesta.
  captainName: string | null
  viceCaptainName: string | null
  // Continuidade/overuse do motor de mídia (src/lib/media) — quais jornalistas já apareceram
  // nesta carreira, quando e com que posição/sentimento, pra decidir reaparições com contexto
  // em vez de repetir os mesmos nomes sem motivo.
  recentJournalists: Array<{
    journalistId: string
    lastUsedAt: string
    usageCount: number
    previousPositions: string[]
    sentimentHistory: string[]
  }>
  updatedAt: string
}

// ─── Personagens paralelos (motores siloed) ─────────────────

export type CharacterId = 'diretor_esportivo' | 'presidente' | 'auxiliar_tecnico' | 'departamento_medico' | 'capitao'

export type CharacterTriggers = Record<CharacterId, boolean>

export type CharacterMessage = {
  id: string
  careerId: string
  articleId: string
  characterId: CharacterId
  headline: string
  body: string
  modelUsed: string
  tokensUsed: number
  generationTimeMs: number
  read: boolean
  createdAt: string
  // Troca única permitida por mensagem espontânea do personagem: o usuário responde uma vez,
  // o personagem responde de volta uma vez, depois trava até a próxima mensagem espontânea.
  userReply: string | null
  userReplyAt: string | null
  characterResponse: string | null
  characterResponseAt: string | null
}

export type EventType =
  | 'match_result'
  | 'signing'
  | 'departure'
  | 'squad_update'
  | 'season_start'
  | 'title_won'
  | 'dismissal_risk'
  | 'press_conference'
  | 'custom'

export type CareerEvent = {
  id: string
  careerId: string
  eventType: EventType
  rawInput: string
  season: string | null
  competition: string | null
  matchWeek: number | null
  hasImageAttachment: boolean
  attachmentUrl: string | null
  eventOrder: number
  createdAt: string
}

// ─── Artigo ──────────────────────────────────────────────────

export type SocialPost = {
  platform: 'twitter' | 'instagram'
  accountType: 'player' | 'journalist' | 'fan' | 'club' | 'stats' | 'rival' | 'humor'
  handle: string
  displayName: string
  countryCode?: string | null
  content: string
  emojiOnly?: boolean
  replyTo?: string | null
  likes?: number
  retweets?: number
}

export type ResultDisplayEntry = {
  competition: string
  competitionIcon: string
  description: string
  outcome: MatchOutcome
  note?: string
}

export type FixturePreview = {
  opponent: string
  note: string
  dot: 'red' | 'gray' | 'green'
}

export type PunditQuoteBlock = {
  name: string
  outlet?: string
  quotes: string[]
}

export type EditorialClosing = {
  authorName: string
  quotes: string[]
  closingQuestion?: string
}

export type ArticleSections = {
  outletLabel: string
  main: string
  recentResults: ResultDisplayEntry[]
  standingsContext: string
  playerAnalysis: string
  upcomingFixtures: FixturePreview[]
  pressDebate: PunditQuoteBlock[]
  socialMedia: SocialPost[]
  backstage: string
  editorial: EditorialClosing
}

export type ImageStatus = 'pending' | 'generating' | 'ready' | 'failed'

export type Article = {
  id: string
  careerId: string
  eventId: string | null
  headline: string
  subheadline: string | null
  body: string
  // null quando a matéria foi escrita em formato livre pela IA real (article.body já contém o markdown completo).
  // Preenchido apenas para matérias geradas pelo mock local (layout em cards estruturados).
  sections: ArticleSections | null
  season: string | null
  competition: string | null
  eventType: EventType | null
  modelUsed: string
  tokensUsed: number
  generationTimeMs: number
  imageUrl: string | null
  imagePrompt: string | null
  imageStatus: ImageStatus
  audioUrl: string | null
  shareToken: string
  createdAt: string
}

// ─── Elenco / sugestões de contratação ──────────────────────

export type TransferSuggestion = {
  playerName: string
  age: number
  position: string
  currentClub: string
  nationality: string
  estimatedValue: string
  transferFeeEstimate: string
  viabilityScore: number
  narrativeJustification: string
  financialJustification: string
  personalJustification: string
  marketContext: string
  realLifeDataAvailable: boolean
}

export type SquadAnalysis = {
  id: string
  careerId: string
  photoUrl: string
  financialBudget: string | null
  userContext: string | null
  identifiedGaps: string[]
  suggestions: TransferSuggestion[]
  createdAt: string
}
