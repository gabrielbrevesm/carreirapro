import type { CharacterTriggers, EventType, MatchOutcome } from '@/types'

export type AiResultToAdd = {
  competition: string
  opponent: string
  isHome: boolean
  score: string
  outcome: MatchOutcome
}

export type AiSigningToAdd = {
  playerName: string
  fromClub: string
  context: string
}

// Envelope mínimo em torno da matéria em markdown livre — a IA escreve o corpo completo
// seguindo o prompt mestre; só extraímos aqui o essencial para o app funcionar
// (listagens, ícones, continuidade de memória).
export type AiArticleResponse = {
  headline: string
  subheadline: string
  eventType: EventType
  competition: string | null
  body: string
  memoryUpdates: {
    newFacts: string[]
    resultToAdd: AiResultToAdd | null
    signingToAdd: AiSigningToAdd | null
  }
  // Sinalização de quais personagens paralelos devem se manifestar a partir deste acontecimento
  // (a IA principal tem o contexto completo do evento, então julga isso melhor que uma heurística local).
  characterTriggers?: Partial<CharacterTriggers>
}
