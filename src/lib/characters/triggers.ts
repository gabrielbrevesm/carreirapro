import type { CareerMemory, CharacterTriggers, EventType, MatchOutcome } from '@/types'

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(normalize(kw)))
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce((count, kw) => (text.includes(normalize(kw)) ? count + 1 : count), 0)
}

// Considera uma "sequência" quando os últimos N resultados registrados na memória (já
// atualizada com o resultado mais recente) tiverem todos o mesmo desfecho.
function hasStreak(results: CareerMemory['recentResults'], outcome: MatchOutcome, length = 4): boolean {
  if (results.length < length) return false
  return results.slice(-length).every((r) => r.outcome === outcome)
}

const RENEWAL_KEYWORDS = ['renov']
const RUMOR_KEYWORDS = ['rumor', 'sondagem', 'especula', 'interesse em', 'monitorando']
const LONG_INJURY_KEYWORDS = ['meses de recuperacao', 'meses fora', 'lesao grave', 'lesão grave', 'ficara meses', 'ficará meses']
const UNHAPPY_PLAYER_KEYWORDS = ['insatisfeito', 'insatisfacao', 'insatisfação', 'quer sair', 'pediu para sair', 'quer deixar o clube']
const YOUNG_TALENT_KEYWORDS = ['jovem', 'da base', 'sub-20', 'sub-23', 'sub20', 'sub23', 'promessa', 'categoria de base']
const SQUAD_NEED_KEYWORDS = ['carencia', 'carência', 'falta um', 'faltando um', 'precisamos de um', 'necessidade de reforco', 'necessidade de reforço']
const ELIMINATION_KEYWORDS = ['eliminad', 'eliminacao', 'eliminação', 'fomos eliminados']
const CRISIS_KEYWORDS = ['crise']
const BIG_MONEY_KEYWORDS = ['milhoes', 'milhões', 'milhao', 'milhão', 'm€', 'recorde do clube', 'maior contratacao', 'maior contratação', 'maior venda']
const NEW_COACH_KEYWORDS = ['novo tecnico', 'novo técnico', 'troca de tecnico', 'troca de técnico']
const INJURY_KEYWORDS = ['lesao', 'lesão', 'machuc', 'contundiu', 'se lesionou']
const PROGNOSIS_KEYWORDS = ['semana', 'mes', 'mês', 'dias de recuperacao', 'dias de recuperação', 'previsao', 'previsão', 'prognostico', 'prognóstico', 'retorno previsto', 'reavaliacao', 'reavaliação']
const STAT_KEYWORDS = [
  'posse de bola',
  'finalizac',
  'finaliz',
  'escanteio',
  'assistenc',
  'assistênc',
  'cartao',
  'cartão',
  'xg',
  'escalac',
  'escalaç',
  'substitui',
  'mapa de calor',
  'passes certos',
  'aproveitamento de passe',
]

// Heurística usada apenas quando a IA real não está disponível (fallback mock) ou não
// devolveu characterTriggers. Quando há IA real, a própria matéria já sinaliza isso —
// ela tem contexto completo do evento e julga melhor que regex.
export function detectCharacterTriggers(params: {
  rawInput: string
  eventType: EventType
  memory: CareerMemory
}): CharacterTriggers {
  const { rawInput, eventType, memory } = params
  const text = normalize(rawInput)

  const streakWin = hasStreak(memory.recentResults, 'win')
  const streakLoss = hasStreak(memory.recentResults, 'loss')
  const bigMoney = includesAny(text, BIG_MONEY_KEYWORDS)

  const diretorEsportivo =
    eventType === 'signing' ||
    eventType === 'departure' ||
    includesAny(text, RENEWAL_KEYWORDS) ||
    includesAny(text, RUMOR_KEYWORDS) ||
    includesAny(text, LONG_INJURY_KEYWORDS) ||
    includesAny(text, UNHAPPY_PLAYER_KEYWORDS) ||
    streakWin ||
    streakLoss ||
    includesAny(text, YOUNG_TALENT_KEYWORDS) ||
    includesAny(text, SQUAD_NEED_KEYWORDS)

  const presidente =
    streakWin ||
    streakLoss ||
    eventType === 'title_won' ||
    eventType === 'dismissal_risk' ||
    includesAny(text, ELIMINATION_KEYWORDS) ||
    includesAny(text, CRISIS_KEYWORDS) ||
    ((eventType === 'signing' || eventType === 'departure') && bigMoney)

  const auxiliarTecnico = countMatches(text, STAT_KEYWORDS) >= 2

  const departamentoMedico = includesAny(text, INJURY_KEYWORDS) && includesAny(text, PROGNOSIS_KEYWORDS)

  const capitao =
    !!memory.captainName &&
    (streakWin ||
      streakLoss ||
      eventType === 'title_won' ||
      eventType === 'dismissal_risk' ||
      includesAny(text, CRISIS_KEYWORDS) ||
      includesAny(text, NEW_COACH_KEYWORDS) ||
      ((eventType === 'signing' || eventType === 'departure') && bigMoney))

  return {
    diretor_esportivo: diretorEsportivo,
    presidente,
    auxiliar_tecnico: auxiliarTecnico,
    departamento_medico: departamentoMedico,
    capitao,
  }
}
