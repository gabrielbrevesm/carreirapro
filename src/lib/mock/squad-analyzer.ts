import type { Career, TransferSuggestion } from '@/types'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const GAP_POOL = [
  'Lateral-direito com mais capacidade ofensiva',
  'Zagueiro canhoto de qualidade',
  'Volante box-to-box',
  'Ponta esquerda com velocidade',
  'Centroavante de referência',
  'Meia criativo entre linhas',
  'Goleiro com mais reflexo em bola aérea',
]

const PLAYER_POOL: Array<Omit<TransferSuggestion, 'narrativeJustification' | 'financialJustification' | 'personalJustification' | 'marketContext' | 'viabilityScore'>> = [
  { playerName: 'Bruno Guimarães Jr.', age: 24, position: 'Volante', currentClub: 'Clube Europeu B', nationality: 'Brasileira', estimatedValue: '€35M', transferFeeEstimate: '€30M - €40M', realLifeDataAvailable: true },
  { playerName: 'Kaan Yildiz', age: 21, position: 'Ponta Esquerda', currentClub: 'Clube Turco', nationality: 'Turca', estimatedValue: '€22M', transferFeeEstimate: '€18M - €25M', realLifeDataAvailable: true },
  { playerName: 'Mateus Cardoso', age: 26, position: 'Zagueiro', currentClub: 'Clube Português', nationality: 'Brasileira', estimatedValue: '€18M', transferFeeEstimate: '€15M - €20M', realLifeDataAvailable: true },
  { playerName: 'Andreas Lindqvist', age: 23, position: 'Lateral-Direito', currentClub: 'Clube Escandinavo', nationality: 'Sueca', estimatedValue: '€14M', transferFeeEstimate: '€10M - €16M', realLifeDataAvailable: true },
  { playerName: 'Diego Salcedo', age: 28, position: 'Centroavante', currentClub: 'Clube Espanhol', nationality: 'Argentina', estimatedValue: '€26M', transferFeeEstimate: '€22M - €30M', realLifeDataAvailable: true },
  { playerName: 'Youssef El Amrani', age: 22, position: 'Meia Ofensivo', currentClub: 'Clube Francês', nationality: 'Marroquina', estimatedValue: '€19M', transferFeeEstimate: '€16M - €22M', realLifeDataAvailable: true },
  { playerName: 'Tomás Ferreira', age: 25, position: 'Goleiro', currentClub: 'Clube Português', nationality: 'Portuguesa', estimatedValue: '€12M', transferFeeEstimate: '€9M - €14M', realLifeDataAvailable: true },
]

export function analyzeMockSquad(params: { career: Career; financialBudget?: string; userContext?: string }): {
  gaps: string[]
  suggestions: TransferSuggestion[]
} {
  const { career } = params
  const gapCount = randomInt(2, 3)
  const gaps = [...GAP_POOL].sort(() => Math.random() - 0.5).slice(0, gapCount)
  const suggestionCount = randomInt(5, 8)
  const chosenPlayers = [...PLAYER_POOL].sort(() => Math.random() - 0.5).slice(0, suggestionCount)

  const suggestions: TransferSuggestion[] = chosenPlayers.map((player) => ({
    ...player,
    viabilityScore: randomInt(6, 10),
    narrativeJustification: `Encaixa no momento do ${career.clubName} sob ${career.managerName}: perfil que reforça exatamente ${pick(gaps).toLowerCase()}.`,
    financialJustification: params.financialBudget
      ? `Dentro do orçamento informado (${params.financialBudget}), considerando o valor de mercado estimado.`
      : `Compatível com o poder financeiro esperado para um clube do nível de ${career.clubLeague}.`,
    personalJustification: pick([
      'Busca mais minutos em campo e vê oportunidade real de titularidade.',
      'Momento de carreira ideal para um novo desafio em liga mais competitiva.',
      'Conexão pessoal com o país/liga facilita a adaptação.',
      'Insatisfeito com o papel atual no elenco, deseja protagonismo.',
    ]),
    marketContext: pick([
      'Contrato perto do fim, o que reduz o valor de negociação.',
      'Já foi ligado a outros clubes nesta janela, mas nada avançou.',
      'Clube atual sinalizou abertura para negociar em caso de proposta razoável.',
    ]),
  }))

  return { gaps, suggestions }
}
