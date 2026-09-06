// Ponto de entrada público da camada de "media intelligence". Pipeline (§53):
//
//   Raw Career Event
//     -> Event Normalizer        (event-normalizer.ts)
//     -> Importance Classifier   (importance.ts, chamado dentro do selector)
//     -> Media Scope Classifier  (scope.ts)
//     -> Relevant Markets        (scope.ts)
//     -> Journalist Candidates   (journalists/*)
//     -> Contextual Scoring      (scoring.ts)
//     -> Continuity/Overuse      (continuity.ts)
//     -> Journalist Selection    (selector.ts)
//     -> Perspective Assignment  (selector.ts)
//     -> Narrative Brief         (narrative-brief.ts) -> texto pro LLM
//
// Camada 1 (este módulo) decide QUEM fala. O LLM (camada 3, no gerador narrativo) só decide COMO
// escrever a partir do brief — nunca escolhe os nomes sozinho (§82/83).

import type { Career, CareerMemory, EventType } from '@/types'
import type { JournalistMemoryEntry, MediaSelectionResult } from './types'
import { normalizeMediaEvent } from './event-normalizer'
import { selectMediaCoverage } from './selector'
import { buildMediaCoverageBrief } from './narrative-brief'
import { recordJournalistUsage } from './continuity'

export type MediaCoverageResult = {
  selection: MediaSelectionResult
  brief: string
}

// Roda o pipeline inteiro pra um evento de carreira. Retorna a seleção (auditável) + o texto já
// pronto pra entrar no prompt do gerador narrativo.
export function computeMediaCoverage(params: {
  career: Career
  memory: CareerMemory
  rawInput: string
  appEventType: EventType
}): MediaCoverageResult {
  const event = normalizeMediaEvent(params)
  const journalistMemory: Record<string, JournalistMemoryEntry> = {}
  for (const entry of params.memory.recentJournalists ?? []) {
    journalistMemory[entry.journalistId] = entry
  }

  const selection = selectMediaCoverage({ event, journalistMemory })
  const brief = buildMediaCoverageBrief(selection)

  return { selection, brief }
}

// Atualiza a memória de continuidade da carreira depois que a matéria foi de fato gerada —
// chamar só quando a seleção realmente foi usada (evita registrar "uso" de uma tentativa que falhou).
export function applyMediaCoverageToMemory(
  memory: CareerMemory,
  selection: MediaSelectionResult,
  nowIso: string = new Date().toISOString()
): CareerMemory['recentJournalists'] {
  const byId = new Map((memory.recentJournalists ?? []).map((e) => [e.journalistId, e]))

  for (const j of selection.selectedJournalists) {
    const updated = recordJournalistUsage(byId.get(j.journalistId), {
      journalistId: j.journalistId,
      nowIso,
      position: `${j.roleInStory}: ${j.perspective}`,
      sentiment: j.suggestedSentiment,
    })
    byId.set(j.journalistId, updated)
  }

  return Array.from(byId.values()).slice(-40)
}

export function explainSelection(selection: MediaSelectionResult): string {
  const lines: string[] = [
    `Media event selection`,
    `importance: ${selection.importance}`,
    `scope: ${selection.scope}`,
    `markets: ${selection.markets.join(', ') || '(nenhum)'}`,
    '',
    'Candidates:',
  ]
  for (const c of selection.candidates.slice(0, 10)) {
    lines.push(`${c.journalistId}: ${c.score.toFixed(2)}`)
    for (const [k, v] of Object.entries(c.breakdown)) {
      if (Math.abs(v) > 0.001) lines.push(`  - ${k} ${v >= 0 ? '+' : ''}${v.toFixed(2)}`)
    }
  }
  lines.push('', 'Selected:', ...selection.selectedJournalists.map((j) => `${j.name} (${j.roleInStory})`))
  if (selection.excludedJournalists.length) {
    lines.push('', 'Excluded:', ...selection.excludedJournalists.map((e) => `${e.journalistId}: ${e.reason}`))
  }
  return lines.join('\n')
}

export * from './types'
export { MEDIA_CONFIG } from './config'
export { JOURNALISTS, getJournalist, activeJournalists } from './journalists'
export { getOutlet, outletsForCountry } from './outlets'
