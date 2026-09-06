import type { MediaSelectionResult } from './types'

const ROLE_LABEL: Record<string, string> = {
  BREAKING_NEWS: 'notícia de última hora',
  TRANSFER_UPDATE: 'atualização de mercado',
  TACTICAL_ANALYSIS: 'análise tática',
  POST_MATCH_REACTION: 'reação pós-jogo',
  CRITICISM: 'crítica',
  PRAISE: 'elogio',
  HISTORICAL_CONTEXT: 'contexto histórico',
  CLUB_MANAGEMENT: 'gestão de clube',
  SCOUTING_ANALYSIS: 'análise de scouting',
  PLAYER_ANALYSIS: 'análise de jogador',
  INTERNATIONAL_REACTION: 'repercussão internacional',
  LOCAL_REACTION: 'repercussão local',
  CONTROVERSY_ANALYSIS: 'análise de polêmica',
  REFEREE_ANALYSIS: 'análise de arbitragem',
}

const SENTIMENT_LABEL: Record<string, string> = {
  VERY_NEGATIVE: 'muito negativo',
  NEGATIVE: 'negativo',
  NEUTRAL: 'neutro',
  POSITIVE: 'positivo',
  VERY_POSITIVE: 'muito positivo',
  MIXED: 'misto/ambíguo',
}

// Camada 2 → Camada 3 do brief (§82): o motor já decidiu QUEM fala e SOBRE O QUÊ; isto vira o
// bloco de instrução que o LLM recebe pra decidir só COMO escrever — nunca quem citar.
export function buildMediaCoverageBrief(result: MediaSelectionResult): string {
  if (result.selectedJournalists.length === 0) {
    return [
      'REPERCUSSÃO DA IMPRENSA PARA ESTA MATÉRIA:',
      'Nenhum jornalista foi selecionado pelo motor editorial para este acontecimento — não é',
      'relevante o suficiente para gerar repercussão externa. NÃO inclua uma seção de "Debate na',
      'Imprensa" ou cite comentaristas nomeados nesta matéria.',
    ].join('\n')
  }

  const lines: string[] = [
    'JORNALISTAS AUTORIZADOS PARA ESTA MATÉRIA (decidido pelo motor editorial — REGRA OBRIGATÓRIA):',
    '',
    'Use exclusivamente estes jornalistas/comentaristas na seção de repercussão da imprensa',
    '("Debate na [Veículo]" ou equivalente). NUNCA invente ou use outro nome de jornalista real',
    'além dos listados abaixo. Cada um deve comentar apenas sob a perspectiva indicada — não',
    'repita a mesma opinião entre eles.',
    '',
  ]

  for (const j of result.selectedJournalists) {
    lines.push(`- ${j.name}${j.outlet ? ` (${j.outlet})` : ''}`)
    lines.push(`  Papel: ${ROLE_LABEL[j.roleInStory] ?? j.roleInStory}`)
    lines.push(`  Deve comentar especificamente: ${j.perspective}`)
    lines.push(`  Tom de voz esperado: ${j.tone}`)
    lines.push(`  Sentimento esperado: ${SENTIMENT_LABEL[j.suggestedSentiment] ?? j.suggestedSentiment}`)
    lines.push('')
  }

  lines.push(
    'IMPORTANTE: toda fala gerada é FICTÍCIA — nunca apresente como declaração real que essa',
    'pessoa disse. É uma reação plausível dentro do universo simulado do modo carreira, coerente',
    'com o perfil editorial dela, não uma citação real.'
  )

  return lines.join('\n')
}
