import type { EventType, MatchOutcome } from '@/types'
import { findClubMentioned } from '@/lib/mock/club-database'

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

type Rule = { type: EventType; keywords: string[] }

// Ordem importa: regras mais específicas primeiro (simula a IA priorizando o sinal mais forte do texto)
const RULES: Rule[] = [
  {
    type: 'title_won',
    keywords: ['campeao', 'campeões', 'campeoes', 'titulo', 'título', 'taca', 'taça', 'trofeu', 'troféu', 'conquistamos', 'levantamos a taca'],
  },
  {
    type: 'dismissal_risk',
    keywords: ['demissao', 'demitido', 'demitida', 'pressao da diretoria', 'cargo em risco', 'posso ser demitido', 'cobranca da torcida'],
  },
  {
    type: 'signing',
    keywords: ['contrat', 'reforc', 'assinou com', 'comprei o', 'comprei a', 'chegou por', 'anunciamos a chegada'],
  },
  {
    type: 'departure',
    keywords: ['vendi', 'vendemos', 'rescis', 'se despediu', 'deixou o clube', 'emprestei', 'emprestamos', 'saida do', 'saída do', 'foi liberado', 'negociado com'],
  },
  {
    type: 'press_conference',
    keywords: ['coletiva', 'entrevista coletiva', 'disse a imprensa', 'disse à imprensa', 'declarou em entrevista', 'em coletiva'],
  },
  {
    type: 'season_start',
    keywords: ['pre-temporada', 'pré-temporada', 'inicio da temporada', 'início da temporada', 'primeira rodada', 'nova temporada comecou', 'comeco da temporada'],
  },
  {
    type: 'squad_update',
    keywords: ['reformulacao do elenco', 'reformulação do elenco', 'mudancas no time', 'mudanças no time', 'promovi da base', 'atualizacao do elenco'],
  },
]

const MATCH_RESULT_KEYWORDS = ['venc', 'perd', 'empat', 'vitoria', 'vitória', 'derrota', 'gols', 'golaço', 'golaco', 'placar']
const SCORE_PATTERN = /\b\d{1,2}\s*[xX-]\s*\d{1,2}\b/

export const KNOWN_COMPETITIONS = [
  'Champions League',
  'Premier League',
  'Championship',
  'FA Cup',
  'Carabao Cup',
  'Europa League',
  'Conference League',
  'La Liga',
  'Copa del Rey',
  'Serie A',
  'Coppa Italia',
  'Bundesliga',
  'DFB-Pokal',
  'Ligue 1',
  'Copa da França',
  'Brasileirão',
  'Copa do Brasil',
  'Libertadores',
  'Copa Sul-Americana',
  'Copa América',
  'Mundial de Clubes',
]

export function classifyEventType(rawInput: string): EventType {
  const text = normalize(rawInput)

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(normalize(kw)))) {
      return rule.type
    }
  }

  if (SCORE_PATTERN.test(rawInput) || MATCH_RESULT_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'match_result'
  }

  return 'custom'
}

export function extractCompetition(rawInput: string): string | null {
  const text = normalize(rawInput)
  const found = KNOWN_COMPETITIONS.find((comp) => text.includes(normalize(comp)))
  return found ?? null
}

const TACTICAL_KEYWORDS = [
  'tatica',
  'tática',
  'esquema',
  'formacao',
  'formação',
  'sistema de jogo',
  'pressao alta',
  'pressão alta',
  'marcacao',
  'marcação',
  'linha de fundo',
  'construcao de jogada',
  'construção de jogada',
  '4-3-3',
  '4-4-2',
  '3-5-2',
  '3-4-3',
  '4-2-3-1',
]

export function hasTacticalContext(rawInput: string): boolean {
  const text = normalize(rawInput)
  return TACTICAL_KEYWORDS.some((kw) => text.includes(normalize(kw)))
}

const WIN_KEYWORDS = ['venc', 'vitoria', 'vitória', 'ganh']
const LOSS_KEYWORDS = ['perd', 'derrota']
const DRAW_KEYWORDS = ['empat']
const AWAY_KEYWORDS = ['fora de casa', 'como visitante', ' fora ']

export type ParsedMatchResult = {
  competition: string
  opponent: string
  isHome: boolean
  score: string
  outcome: MatchOutcome
}

// Tenta extrair um resultado estruturado de um relato em texto livre.
// Retorna null quando não há sinal confiável o suficiente (ex: falta placar e resultado explícito).
export function parseMatchResult(rawInput: string, clubName: string, clubLeague: string): ParsedMatchResult | null {
  const text = normalize(rawInput)

  let outcome: MatchOutcome | null = null
  if (WIN_KEYWORDS.some((k) => text.includes(k))) outcome = 'win'
  else if (LOSS_KEYWORDS.some((k) => text.includes(k))) outcome = 'loss'
  else if (DRAW_KEYWORDS.some((k) => text.includes(k))) outcome = 'draw'

  const scoreMatch = rawInput.match(SCORE_PATTERN)
  let score = scoreMatch ? scoreMatch[0].replace(/\s*[xX]\s*/, '-').replace(/\s*-\s*/, '-') : null

  if (!outcome && score) {
    const [a, b] = score.split('-').map((n) => parseInt(n, 10))
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      outcome = a > b ? 'win' : a < b ? 'loss' : 'draw'
    }
  }

  if (!outcome) return null

  // Convenção do app: "score" é sempre nosso time - adversário. Se o placar extraído do texto
  // contradiz o resultado detectado por palavra-chave (ex: "perdemos" com "3-1"), inverte os dígitos.
  if (score && outcome !== 'draw') {
    const [a, b] = score.split('-').map((n) => parseInt(n, 10))
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      const impliesWin = a > b
      if ((outcome === 'win' && !impliesWin) || (outcome === 'loss' && impliesWin)) {
        score = `${b}-${a}`
      }
    }
  }

  const competition = extractCompetition(rawInput) ?? clubLeague
  const opponent = findClubMentioned(rawInput, clubName) ?? 'Adversário'
  const isHome = !AWAY_KEYWORDS.some((k) => text.includes(k))

  return {
    competition,
    opponent,
    isHome,
    score: score ?? '—',
    outcome,
  }
}
