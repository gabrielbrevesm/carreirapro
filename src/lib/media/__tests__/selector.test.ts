import { describe, it, expect } from 'vitest'
import { selectMediaCoverage } from '../selector'
import { classifyImportance } from '../importance'
import { classifyScope, resolveMarkets } from '../scope'
import type { MediaEvent, JournalistMemoryEntry } from '../types'

function baseEvent(overrides: Partial<MediaEvent> = {}): MediaEvent {
  return {
    type: 'MATCH_RESULT',
    subtype: null,
    club: 'Roma',
    clubCountry: 'italy',
    clubLeague: 'Serie A',
    clubReputation: 'LARGE',
    opponent: null,
    opponentCountry: null,
    opponentLeague: null,
    competition: 'Serie A',
    competitionCountry: 'italy',
    competitionScope: 'DOMESTIC',
    player: null,
    playerNationality: null,
    playerCurrentClub: null,
    playerPreviousClub: null,
    transferOriginClub: null,
    transferOriginCountry: null,
    transferDestinationClub: null,
    transferDestinationCountry: null,
    score: '2-0',
    outcome: 'win',
    importance: 'LOW',
    rivalry: false,
    knockoutStage: false,
    titleImpact: false,
    relegationImpact: false,
    manager: 'Mister Fictício',
    managerNationality: null,
    recentForm: { wins: 1, draws: 0, losses: 0, streak: 'win', streakLength: 1 },
    historicalContext: null,
    controversy: false,
    tacticalContext: false,
    narrativeArcs: [],
    isUserClub: true,
    timestamp: new Date('2026-01-10T12:00:00Z').toISOString(),
    ...overrides,
  }
}

describe('Regra 1 — mercado doméstico primeiro (Caso A: Roma 2x0 Lecce)', () => {
  it('não seleciona jornalistas estrangeiros pra uma partida doméstica comum', () => {
    const event = baseEvent({ opponent: 'Lecce' })
    const result = selectMediaCoverage({ event, journalistMemory: {} })

    const foreignIds = ['gary-neville', 'david-ornstein', 'florian-plettenberg', 'tom-bogert']
    for (const id of foreignIds) {
      expect(result.selectedJournalists.some((j) => j.journalistId === id)).toBe(false)
    }
  })
})

describe('Regra 2 — Champions League entre países diferentes (Caso B: Roma 4x0 Liverpool)', () => {
  it('seleciona mídia dos dois mercados envolvidos', () => {
    const event = baseEvent({
      type: 'CHAMPIONS_LEAGUE_EVENT',
      opponent: 'Liverpool',
      opponentCountry: 'england',
      competition: 'Champions League',
      competitionScope: 'CONTINENTAL',
      score: '4-0',
      historicalContext: 'goleada',
      knockoutStage: true,
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    const countries = new Set(result.markets)

    expect(countries.has('italy')).toBe(true)
    expect(countries.has('england')).toBe(true)
    expect(result.selectedJournalists.length).toBeGreaterThan(0)
  })
})

describe('Regra 3 — transferência envolve origem + destino', () => {
  it('inclui mercados inglês e italiano numa venda United -> Juventus', () => {
    const event = baseEvent({
      type: 'TRANSFER_COMPLETED',
      club: 'Manchester United',
      clubCountry: 'england',
      clubLeague: 'Premier League',
      opponent: 'Juventus',
      opponentCountry: 'italy',
      competition: null,
      competitionScope: 'DOMESTIC',
      importance: 'HIGH',
    })
    const markets = resolveMarkets({ ...event, importance: classifyImportance(event) })
    expect(markets).toContain('england')
    expect(markets).toContain('italy')
  })
})

describe('Regra 4 — Fabrizio Romano não comenta partida comum', () => {
  it('Romano não é selecionado para uma vitória doméstica sem contexto de mercado', () => {
    const event = baseEvent({ club: 'Roma', opponent: 'Lecce', importance: 'MEDIUM' })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    expect(result.selectedJournalists.some((j) => j.journalistId === 'fabrizio-romano')).toBe(false)
  })

  it('Romano é elegível (não excluído) para uma transferência internacional relevante', () => {
    const event = baseEvent({
      type: 'TRANSFER_NEGOTIATION',
      club: 'Roma',
      opponent: 'Bayern de Munique',
      opponentCountry: 'germany',
      competition: null,
      importance: 'VERY_HIGH',
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    const romano = result.candidates.find((c) => c.journalistId === 'fabrizio-romano')
    expect(romano).toBeDefined()
    expect(romano!.score).toBeGreaterThan(0)
  })
})

describe('Regra 5 — analista tático não vira fonte de breaking news', () => {
  it('Rafael Oliveira nunca recebe o papel TRANSFER_UPDATE (está na lista de exclusão)', () => {
    const event = baseEvent({
      type: 'TRANSFER_COMPLETED',
      club: 'Flamengo',
      clubCountry: 'brazil',
      clubLeague: 'Brasileirão',
      competition: 'Brasileirão',
      importance: 'HIGH',
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    const oliveira = result.selectedJournalists.find((j) => j.journalistId === 'rafael-oliveira')
    if (oliveira) expect(oliveira.roleInStory).not.toBe('TRANSFER_UPDATE')
  })
})

describe('Teste 6 — Ornstein tem prioridade em transferência relevante da Premier League', () => {
  it('Ornstein aparece entre os candidatos com score alto', () => {
    const event = baseEvent({
      type: 'TRANSFER_NEGOTIATION',
      club: 'Arsenal',
      clubCountry: 'england',
      clubLeague: 'Premier League',
      competition: null,
      importance: 'HIGH',
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    const ornstein = result.candidates.find((c) => c.journalistId === 'david-ornstein')
    expect(ornstein).toBeDefined()
    expect(ornstein!.score).toBeGreaterThan(0.3)
  })
})

describe('Teste 7 — Plettenberg tem prioridade em transferência do Bayern/Bundesliga', () => {
  it('Plettenberg pontua bem numa negociação envolvendo o Bayern', () => {
    const event = baseEvent({
      type: 'TRANSFER_NEGOTIATION',
      club: 'Bayern de Munique',
      clubCountry: 'germany',
      clubLeague: 'Bundesliga',
      competition: null,
      importance: 'HIGH',
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    const plettenberg = result.candidates.find((c) => c.journalistId === 'florian-plettenberg')
    expect(plettenberg).toBeDefined()
    expect(plettenberg!.score).toBeGreaterThan(0.3)
  })
})

describe('Teste 8 — Tom Bogert tem prioridade em movimentações da MLS', () => {
  it('Bogert pontua bem numa transferência do Inter Miami', () => {
    const event = baseEvent({
      type: 'TRANSFER_COMPLETED',
      club: 'Inter Miami',
      clubCountry: 'usa',
      clubLeague: 'MLS',
      competition: null,
      importance: 'HIGH',
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    const bogert = result.candidates.find((c) => c.journalistId === 'tom-bogert')
    expect(bogert).toBeDefined()
    expect(bogert!.score).toBeGreaterThan(0.3)
  })
})

describe('Teste 9 — Mauro Cezar ganha relevância em crise esportiva brasileira', () => {
  it('score de Mauro Cezar sobe quando o evento é uma crise/pressão sobre o treinador', () => {
    const pressureEvent = baseEvent({
      type: 'MANAGER_PRESSURE',
      club: 'Flamengo',
      clubCountry: 'brazil',
      clubLeague: 'Brasileirão',
      competition: 'Brasileirão',
      outcome: 'loss',
      recentForm: { wins: 0, draws: 0, losses: 4, streak: 'loss', streakLength: 4 },
      importance: 'HIGH',
    })
    const normalEvent = baseEvent({
      club: 'Flamengo',
      clubCountry: 'brazil',
      clubLeague: 'Brasileirão',
      competition: 'Brasileirão',
      importance: 'LOW',
    })

    const pressureResult = selectMediaCoverage({ event: pressureEvent, journalistMemory: {} })
    const normalResult = selectMediaCoverage({ event: { ...normalEvent, importance: 'LOW' }, journalistMemory: {} })

    const scoreInPressure = pressureResult.candidates.find((c) => c.journalistId === 'mauro-cezar-pereira')?.score ?? 0
    const scoreInNormal = normalResult.candidates.find((c) => c.journalistId === 'mauro-cezar-pereira')?.score ?? 0

    expect(scoreInPressure).toBeGreaterThan(scoreInNormal)
  })
})

describe('Teste 10/28 — sequência de derrotas aumenta a importância', () => {
  it('4 derrotas seguidas classifica como HIGH ou mais', () => {
    const event = baseEvent({
      outcome: 'loss',
      score: '0-1',
      recentForm: { wins: 0, draws: 0, losses: 4, streak: 'loss', streakLength: 4 },
    })
    const importance = classifyImportance(event)
    expect(['HIGH', 'VERY_HIGH', 'GLOBAL']).toContain(importance)
  })

  it('1 derrota isolada não gera importância alta', () => {
    const event = baseEvent({ outcome: 'loss', score: '0-1', recentForm: { wins: 3, draws: 1, losses: 1, streak: 'loss', streakLength: 1 } })
    const importance = classifyImportance(event)
    expect(['LOW', 'MEDIUM']).toContain(importance)
  })
})

describe('Caso E/Teste 11 — derby aumenta cobertura doméstica, não necessariamente internacional', () => {
  it('Roma x Lazio não convoca Gary Neville', () => {
    const event = baseEvent({ opponent: 'Lazio', rivalry: true })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    expect(result.selectedJournalists.some((j) => j.journalistId === 'gary-neville')).toBe(false)
    expect(result.selectedJournalists.length).toBeGreaterThan(0)
  })
})

describe('Teste 12 — final de Champions recebe escopo GLOBAL ou INTERNATIONAL alto', () => {
  it('classifica CUP_FINAL continental como GLOBAL', () => {
    const event = baseEvent({
      type: 'CUP_FINAL',
      opponent: 'Manchester City',
      opponentCountry: 'england',
      competition: 'Champions League',
      competitionScope: 'CONTINENTAL',
      knockoutStage: true,
      titleImpact: true,
    })
    const scope = classifyScope({ ...event, importance: classifyImportance(event) })
    expect(scope).toBe('GLOBAL')
  })
})

describe('Teste 14 — jogador pouco relevante não cria mercado automático pela nacionalidade', () => {
  it('sem nome de jogador definido, nacionalidade não abre um terceiro mercado', () => {
    const event = baseEvent({
      type: 'TRANSFER_COMPLETED',
      opponent: 'Real Madrid',
      opponentCountry: 'spain',
      playerNationality: 'brazil',
      player: null,
      importance: 'HIGH',
    })
    const markets = resolveMarkets(event)
    expect(markets).not.toContain('brazil')
  })
})

describe('Teste 15 — overuse reduz repetição de jornalista', () => {
  it('score cai quando o jornalista já apareceu demais recentemente', () => {
    const overusedMemory: Record<string, JournalistMemoryEntry> = {
      'mauro-cezar-pereira': {
        journalistId: 'mauro-cezar-pereira',
        lastUsedAt: new Date('2026-01-09T12:00:00Z').toISOString(),
        usageCount: 5,
        previousPositions: ['crítica', 'crítica', 'crítica'],
        sentimentHistory: ['NEGATIVE', 'NEGATIVE', 'NEGATIVE'],
      },
    }
    const fresh = selectMediaCoverage({ event: baseEvent({ club: 'Flamengo', clubCountry: 'brazil', clubLeague: 'Brasileirão', type: 'MANAGER_PRESSURE', importance: 'HIGH' }), journalistMemory: {} })
    const overused = selectMediaCoverage({ event: baseEvent({ club: 'Flamengo', clubCountry: 'brazil', clubLeague: 'Brasileirão', type: 'MANAGER_PRESSURE', importance: 'HIGH' }), journalistMemory: overusedMemory })

    const freshScore = fresh.candidates.find((c) => c.journalistId === 'mauro-cezar-pereira')?.score ?? 0
    const overusedScore = overused.candidates.find((c) => c.journalistId === 'mauro-cezar-pereira')?.score ?? 0
    expect(overusedScore).toBeLessThan(freshScore)
  })
})

describe('Teste 16 — continuity bonus favorece reutilização recente e "morna"', () => {
  it('um único uso recente aumenta o score em vez de penalizar', () => {
    const event = baseEvent({ club: 'Flamengo', clubCountry: 'brazil', clubLeague: 'Brasileirão', type: 'MANAGER_PRESSURE', importance: 'HIGH' })
    const recentMemory: Record<string, JournalistMemoryEntry> = {
      'mauro-cezar-pereira': {
        journalistId: 'mauro-cezar-pereira',
        lastUsedAt: new Date('2026-01-09T12:00:00Z').toISOString(),
        usageCount: 1,
        previousPositions: ['crítica'],
        sentimentHistory: ['NEGATIVE'],
      },
    }
    const noHistory = selectMediaCoverage({ event, journalistMemory: {} })
    const withHistory = selectMediaCoverage({ event, journalistMemory: recentMemory })

    const noHistoryScore = noHistory.candidates.find((c) => c.journalistId === 'mauro-cezar-pereira')?.score ?? 0
    const withHistoryScore = withHistory.candidates.find((c) => c.journalistId === 'mauro-cezar-pereira')?.score ?? 0
    expect(withHistoryScore).toBeGreaterThan(noHistoryScore)
  })
})

describe('Teste 17/18 — papéis incompatíveis nunca são atribuídos', () => {
  it('Ornstein nunca recebe POST_MATCH_REACTION nem TACTICAL_ANALYSIS', () => {
    const event = baseEvent({
      type: 'TRANSFER_NEGOTIATION',
      club: 'Arsenal',
      clubCountry: 'england',
      clubLeague: 'Premier League',
      competition: null,
      importance: 'HIGH',
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    const ornstein = result.selectedJournalists.find((j) => j.journalistId === 'david-ornstein')
    if (ornstein) {
      expect(['POST_MATCH_REACTION', 'TACTICAL_ANALYSIS']).not.toContain(ornstein.roleInStory)
    }
  })
})

describe('Teste 19/20 — fallback e eventos LOW podem retornar zero jornalistas', () => {
  it('evento LOW comum pode não selecionar ninguém', () => {
    const event = baseEvent({ importance: 'LOW', type: 'GENERIC', competition: null })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    expect(result.selectedJournalists.length).toBeGreaterThanOrEqual(0)
    expect(result.selectedJournalists.length).toBeLessThanOrEqual(1)
  })

  it('mercado sem nenhum jornalista cadastrado cai no fallback sem quebrar', () => {
    const event = baseEvent({ club: 'Clube Fictício', clubCountry: null, clubLeague: 'Liga Inexistente', competition: null, importance: 'MEDIUM' })
    expect(() => selectMediaCoverage({ event, journalistMemory: {} })).not.toThrow()
  })
})

describe('Diversidade de perspectiva em eventos importantes (§79/§80)', () => {
  it('Roma 4x0 Liverpool (Champions, VERY_HIGH) não faz dois jornalistas repetirem a mesma perspectiva', () => {
    const event = baseEvent({
      type: 'CHAMPIONS_LEAGUE_EVENT',
      opponent: 'Liverpool',
      opponentCountry: 'england',
      competition: 'Champions League',
      competitionScope: 'CONTINENTAL',
      score: '4-0',
      historicalContext: 'goleada',
      knockoutStage: true,
    })
    const result = selectMediaCoverage({ event, journalistMemory: {} })
    expect(result.selectedJournalists.length).toBeGreaterThanOrEqual(2)

    const perspectives = result.selectedJournalists.map((j) => j.perspective)
    expect(new Set(perspectives).size).toBe(perspectives.length)
  })
})
