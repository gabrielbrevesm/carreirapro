// Base mock de treinadores reais conhecidos — simula a "IA" absorvendo contexto recente do técnico.
// Em produção isso seria uma busca real (notícias recentes, resultados, reputação atual).

export type ManagerInfo = {
  name: string
  aliases?: string[]
  recentContext: string
}

const MANAGER_DATABASE: ManagerInfo[] = [
  {
    name: 'Pep Guardiola',
    recentContext:
      'reconhecido pelo domínio tático e pela obsessão por posse de bola, mas vem sendo questionado sobre até quando sustentará esse nível de exigência.',
  },
  {
    name: 'Jürgen Klopp',
    aliases: ['jurgen klopp'],
    recentContext: 'símbolo de um futebol intenso e emocional, com forte conexão com torcidas por onde passou.',
  },
  {
    name: 'Carlo Ancelotti',
    recentContext: 'valorizado pela gestão de elencos estrelados e pela tranquilidade em momentos de pressão.',
  },
  {
    name: 'Xabi Alonso',
    recentContext: 'visto como uma das maiores promessas da nova geração de treinadores europeus.',
  },
  {
    name: 'Thomas Tuchel',
    recentContext: 'conhecido por ajustes táticos rápidos, mas também por relações desgastadas com diretorias.',
  },
  {
    name: 'Mikel Arteta',
    recentContext: 'tem construído reputação por reconstruir projetos a partir de trabalho de base e disciplina tática.',
  },
  {
    name: 'Unai Emery',
    recentContext: 'ganhou respeito recente por transformar equipes médias em competidoras diretas por vagas europeias.',
  },
  {
    name: 'Erik ten Hag',
    recentContext: 'segue sob pressão para provar que consegue repetir em grandes clubes o sucesso que teve anteriormente.',
  },
  {
    name: 'Roberto De Zerbi',
    recentContext: 'admirado pelo estilo ofensivo arriscado, ainda que irregular em resultados.',
  },
  {
    name: 'Diego Simeone',
    aliases: ['cholo simeone'],
    recentContext: 'símbolo de identidade e intensidade defensiva, com um dos elencos mais fiéis ao seu estilo na Europa.',
  },
  {
    name: 'Zinedine Zidane',
    recentContext: 'carrega o peso de decisões rápidas e da expectativa de resultados imediatos onde quer que assuma.',
  },
  {
    name: 'Julian Nagelsmann',
    recentContext: 'considerado um dos nomes mais tecnicamente avançados da nova geração de treinadores.',
  },
  {
    name: 'Vincenzo Italiano',
    recentContext: 'reconhecido por um futebol propositivo, mesmo enfrentando dificuldades para sustentar campanhas longas.',
  },
  {
    name: 'Fernando Diniz',
    recentContext: 'associado a um estilo de posse e trocas de posição que divide opiniões entre analistas.',
  },
  {
    name: 'Abel Ferreira',
    recentContext: 'valorizado pela gestão de grupo e pelo histórico recente em competições decisivas.',
  },
]

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function lookupManagerContext(name: string): string | null {
  const q = normalize(name)
  if (q.length < 3) return null

  const found = MANAGER_DATABASE.find((m) => normalize(m.name) === q || m.aliases?.some((a) => normalize(a) === q))
  if (found) return found.recentContext

  const partial = MANAGER_DATABASE.filter((m) => normalize(m.name).includes(q) || q.includes(normalize(m.name)))
  if (partial.length === 1) return partial[0].recentContext

  return null
}

export function genericManagerContext(name: string): string {
  return `vem sendo acompanhado de perto pela imprensa esportiva, com expectativa dividida sobre os próximos passos da carreira de ${name}.`
}
