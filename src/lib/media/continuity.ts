import { MEDIA_CONFIG } from './config'
import type { JournalistMemoryEntry, Sentiment } from './types'

// Continuidade/overuse (seções 34–36 do brief): reaparecer é bom quando há uma narrativa pendente
// (continuidade), ruim quando é sempre o mesmo nome sem motivo (overuse). O MESMO número de usos
// recentes alimenta os dois lados — o saldo depende de quão recente foi o último uso.
export function computeContinuityAndOveruse(
  entry: JournalistMemoryEntry | undefined,
  nowIso: string
): { continuityBonus: number; overusePenalty: number } {
  if (!entry || entry.usageCount === 0) return { continuityBonus: 0, overusePenalty: 0 }

  const { overuse } = MEDIA_CONFIG
  const daysSinceLastUse = (new Date(nowIso).getTime() - new Date(entry.lastUsedAt).getTime()) / 86_400_000

  // Dentro da janela de decaimento: ainda "quente" o suficiente pra continuidade valer a pena.
  const isWarm = daysSinceLastUse <= overuse.continuityDecayDays

  if (entry.usageCount <= overuse.continuityBonusMaxUses && isWarm) {
    return { continuityBonus: 1 - daysSinceLastUse / overuse.continuityDecayDays, overusePenalty: 0 }
  }

  // Passou do limite de reaparições "saudáveis" — vira penalidade de overuse, proporcional a
  // quantas vezes apareceu recentemente.
  const overusePenalty = Math.min(1, (entry.usageCount - overuse.continuityBonusMaxUses) * overuse.penaltyPerRecentUse)
  return { continuityBonus: 0, overusePenalty }
}

// Atualiza a entrada de memória de um jornalista depois que ele É selecionado pra uma matéria.
export function recordJournalistUsage(
  existing: JournalistMemoryEntry | undefined,
  params: { journalistId: string; nowIso: string; position: string; sentiment: Sentiment }
): JournalistMemoryEntry {
  const previousPositions = [...(existing?.previousPositions ?? []), params.position].slice(-5)
  const sentimentHistory = [...(existing?.sentimentHistory ?? []), params.sentiment].slice(-5)
  return {
    journalistId: params.journalistId,
    lastUsedAt: params.nowIso,
    usageCount: (existing?.usageCount ?? 0) + 1,
    previousPositions,
    sentimentHistory,
  }
}
