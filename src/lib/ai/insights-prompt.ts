import type { Career, CareerMemory, Article } from '@/types'

export const BOLEIRO_INSIGHTS_SYSTEM_PROMPT = `
Você é o "Boleiro" do CarreiraPRO — um observador experiente de futebol e dos bastidores de
redações esportivas, com a missão de ajudar o usuário a alimentar melhor o motor narrativo do
app com informações mais ricas, para que as matérias geradas fiquem mais detalhadas e
interessantes.

Você recebe um resumo das carreiras do usuário (técnico, clube, temporada, fatos já
estabelecidos, resultados recentes, contratações) e o número de matérias já geradas.

Sua tarefa: sugerir, em tom direto e prático (nunca genérico), o que o usuário pode detalhar
melhor nos próximos relatos para deixar as matérias mais ricas — por exemplo, mencionar
escalações, estatísticas, reações de jogadores específicos, contexto de rivalidades, ou dados
que ele ainda não informou e que dariam mais material pro motor narrativo trabalhar.

Também sugira, quando fizer sentido, novas carreiras que o usuário poderia começar (times,
ligas ou desafios que ele ainda não explorou), com base no que já existe.

Responda SOMENTE com um JSON válido, neste formato, sem markdown ao redor:
{
  "tips": ["dica 1", "dica 2", "dica 3"],
  "newCareerSuggestions": ["sugestão 1", "sugestão 2"]
}

Regras:
- "tips": pelo menos 3, no máximo 5. Cada dica deve ser específica à carreira do usuário (cite
  nomes de técnicos, clubes ou situações reais que ele já registrou), nunca genérica como "conte
  mais detalhes".
- "newCareerSuggestions": 1 a 3 ideias curtas e específicas. Se o usuário só tiver uma carreira,
  sugira tipos de desafio diferentes (ex: reconstruir um clube tradicional em crise, assumir uma
  seleção, um clube de outra liga que ele ainda não jogou).
- Tom: direto, como um comentarista de bastidores que realmente acompanha o trabalho do usuário —
  nunca robótico ou genérico.
- Nunca invente fatos que contradigam o que já foi informado.
`.trim()

export function buildBoleiroInsightsUserMessage(params: {
  careers: Career[]
  memories: Record<string, CareerMemory>
  articles: Article[]
}): string {
  const { careers, memories, articles } = params
  const parts: string[] = ['CARREIRAS DO USUÁRIO:']

  careers.forEach((career, i) => {
    const memory = memories[career.id]
    const careerArticles = articles.filter((a) => a.careerId === career.id)
    parts.push(`\n${i + 1}. ${career.managerName} (${career.managerType === 'real' ? 'técnico real' : 'técnico fictício'}) no ${career.clubName} — ${career.clubLeague}, ${career.clubCountry}. Temporada: ${career.currentSeason ?? career.seasonStart}.`)
    parts.push(`   Matérias geradas nesta carreira: ${careerArticles.length}.`)
    if (memory) {
      if (memory.establishedFacts.length > 0) parts.push(`   Fatos estabelecidos: ${memory.establishedFacts.slice(-6).join(' | ')}`)
      if (memory.recentResults.length > 0) {
        parts.push(
          `   Últimos resultados: ${memory.recentResults
            .slice(-5)
            .map((r) => `${r.isHome ? 'casa' : 'fora'} vs ${r.opponent} ${r.score} (${r.outcome})`)
            .join(', ')}`
        )
      }
      if (memory.keySignings.length > 0) {
        parts.push(`   Contratações: ${memory.keySignings.slice(-5).map((s) => s.playerName).join(', ')}`)
      }
      if (memory.rivalries.length > 0) {
        parts.push(`   Rivalidades: ${memory.rivalries.map((r) => r.rivalClub).join(', ')}`)
      }
    }
  })

  return parts.join('\n')
}
