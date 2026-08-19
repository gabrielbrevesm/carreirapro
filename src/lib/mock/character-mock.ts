import type { Article, Career, CareerMemory, CharacterId } from '@/types'

export type MockCharacterMessage = { headline: string; body: string }

// Falas-template usadas apenas quando não há IA configurada (mesmo padrão de fallback
// do restante do app: sem chave, sem custo, mas ainda assim algo plausível na tela).
// Tom: mensagem particular pro técnico (tipo WhatsApp), nunca declaração de imprensa.
export function generateMockCharacterMessage(
  characterId: CharacterId,
  params: { career: Career; memory: CareerMemory; article: Article }
): MockCharacterMessage {
  const { memory, article } = params

  switch (characterId) {
    case 'diretor_esportivo':
      return {
        headline: 'Diretor esportivo quer conversar sobre o elenco',
        body: `Vi o que rolou em "${article.headline}". Antes de qualquer decisão, bora olhar com calma o encaixe e o histórico de valores que já negociamos — não quero decidir isso no calor do momento.`,
      }
    case 'presidente':
      return {
        headline: 'Presidente mandou uma mensagem',
        body: `Vi a repercussão de "${article.headline}". Só pra você saber: tô de olho, confio no trabalho que você tá fazendo. Qualquer coisa mais séria, te chamo pra conversar direito.`,
      }
    case 'auxiliar_tecnico': {
      const last = memory.recentResults.at(-1)
      return {
        headline: 'Auxiliar técnico mandou os números',
        body: `Dei uma olhada nos dados${last ? ` do jogo contra o ${last.opponent}` : ' do último jogo'}. Tem uns pontos pra ajustar no treino da semana — te mostro com mais calma quando puder.`,
      }
    }
    case 'departamento_medico':
      return {
        headline: 'Departamento médico deu um retorno',
        body: `Falando rápido sobre o jogador: segue tudo dentro do prazo que já te passei, sem novidade fora do esperado. Qualquer mudança eu te aviso na hora.`,
      }
    case 'capitao':
      return {
        headline: `${memory.captainName ?? 'Capitão'} te chamou`,
        body: `E aí, vi "${article.headline}" agora. O grupo tá ligado e focado, pode contar com a gente — só me diz o que você precisa que a gente ajusta.`,
      }
  }
}

// Resposta mock à réplica do usuário — usada só quando não há IA configurada.
export function generateMockCharacterReply(characterId: CharacterId): string {
  switch (characterId) {
    case 'diretor_esportivo':
      return 'Beleza, vou levar isso em conta antes de mexer em qualquer coisa.'
    case 'presidente':
      return 'Entendido. Qualquer novidade te chamo.'
    case 'auxiliar_tecnico':
      return 'Fechado, vou cruzar isso com os dados do próximo jogo.'
    case 'departamento_medico':
      return 'Certo, te aviso se mudar alguma coisa.'
    case 'capitao':
      return 'Show, vou passar pro grupo. Seguimos!'
  }
}
