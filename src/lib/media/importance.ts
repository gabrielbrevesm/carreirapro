import { MEDIA_CONFIG } from './config'
import { isContinentalCompetition } from './markets'
import type { ImportanceLevel, MediaEvent } from './types'

const IMPORTANCE_RANK: Record<ImportanceLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3, GLOBAL: 4 }

function bump(level: ImportanceLevel, steps: number): ImportanceLevel {
  const order: ImportanceLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'GLOBAL']
  const idx = Math.min(order.length - 1, Math.max(0, order.indexOf(level) + steps))
  return order[idx]
}

// Classifica a importância editorial do evento (seção 18 do brief) — nunca em valor absoluto:
// considera o tamanho relativo do clube, a competição, a sequência recente e o tipo de evento.
export function classifyImportance(event: MediaEvent): ImportanceLevel {
  let level: ImportanceLevel = 'LOW'

  // Base pelo tipo de evento
  const HIGH_BASE_TYPES: MediaEvent['type'][] = [
    'DERBY', 'RIVALRY_MATCH', 'CUP_ELIMINATION', 'CONTROVERSY', 'REFEREE_CONTROVERSY',
    'MANAGER_PRESSURE', 'CLUB_CRISIS', 'RELEGATION_BATTLE',
  ]
  const VERY_HIGH_BASE_TYPES: MediaEvent['type'][] = [
    'CUP_FINAL', 'TITLE_RACE', 'HISTORIC_RESULT', 'RECORD_BROKEN', 'CHAMPIONS_LEAGUE_EVENT',
    'LIBERTADORES_EVENT', 'CLUB_WORLD_CUP_EVENT',
  ]
  if (VERY_HIGH_BASE_TYPES.includes(event.type)) level = 'VERY_HIGH'
  else if (HIGH_BASE_TYPES.includes(event.type)) level = 'HIGH'
  else if (event.type.startsWith('TRANSFER') || event.type === 'PLAYER_SALE' || event.type === 'PLAYER_LOAN') level = 'MEDIUM'
  else if (event.type === 'CONTRACT_RENEWAL' || event.type === 'CAPTAINCY_CHANGE') level = 'LOW'
  else level = 'LOW'

  // Sequências de resultado (seção 29)
  const { streaks } = MEDIA_CONFIG
  if (event.recentForm.streak === 'loss') {
    if (event.recentForm.streakLength >= streaks.lossesForCrisis) level = bump(level, 3)
    else if (event.recentForm.streakLength >= streaks.lossesForPressure) level = bump(level, 2)
    else if (event.recentForm.streakLength >= streaks.lossesForAttention) level = bump(level, 1)
  }
  if (event.recentForm.streak === 'win') {
    if (event.recentForm.streakLength >= streaks.winsForHistoric) level = bump(level, 2)
    else if (event.recentForm.streakLength >= streaks.winsForStrongRun) level = bump(level, 1)
  }

  // Goleada/resultado histórico
  if (event.historicalContext === 'goleada') level = bump(level, 1)

  // Rivalidade e mata-mata aumentam
  if (event.rivalry) level = bump(level, 1)
  if (event.knockoutStage) level = bump(level, 1)
  if (event.titleImpact) level = bump(level, 1)
  if (event.relegationImpact) level = bump(level, 1)

  // Competição continental empurra pra cima
  if (isContinentalCompetition(event.competition)) level = bump(level, 1)

  // Importância relativa do clube (seção 48): clube pequeno com evento grande pesa mais;
  // clube de elite "absorve" eventos medianos como normais.
  if (event.clubReputation === 'LOCAL' || event.clubReputation === 'SMALL') {
    if (IMPORTANCE_RANK[level] >= IMPORTANCE_RANK.MEDIUM) level = bump(level, 1)
  }
  if (event.clubReputation === 'GLOBAL' || event.clubReputation === 'ELITE') {
    if (level === 'MEDIUM' && event.type === 'TRANSFER_COMPLETED') level = 'LOW'
  }

  // Final de grande competição continental = repercussão global
  if (event.type === 'CUP_FINAL' && isContinentalCompetition(event.competition)) level = 'GLOBAL'

  // Prioridade editorial do clube do usuário (seção 49) — nunca ao ponto de virar GLOBAL sozinho.
  if (event.isUserClub && level === 'LOW' && (event.rivalry || event.knockoutStage)) level = 'MEDIUM'

  return level
}
