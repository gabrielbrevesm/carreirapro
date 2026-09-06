import type {
  Career,
  CareerMemory,
  ArticleSections,
  EventType,
  PunditQuoteBlock,
  SocialPost,
  ResultDisplayEntry,
  FixturePreview,
  ResultRecord,
} from '@/types'
import { randomId } from '@/lib/utils'
import { parseMatchResult, KNOWN_COMPETITIONS, type ParsedMatchResult } from '@/lib/mock/event-classifier'
import { CLUB_DATABASE, findClubMentioned } from '@/lib/mock/club-database'

// ─── Utilitários de aleatoriedade ────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Extrai possíveis nomes próprios do texto do usuário (heurística simples).
// Ignora a primeira palavra de cada frase (maiúscula só por estar no início, não por ser nome).
export function extractProperNouns(text: string): string[] {
  const blacklist = new Set([
    'Ex', 'Eu', 'Na', 'No', 'Ao', 'Do', 'Da', 'Em', 'Um', 'Uma', 'Para', 'Depois', 'Vale', 'Segue',
    'Reconstruir', 'Sobreviver', 'Dominar', 'Conquistar', 'Vencer', 'Brigar', 'Manter', 'Buscar', 'Objetivo', 'Declarado',
  ])
  const names = new Set<string>()

  const segments = text.split(/[.!?:]+\s*/)
  for (const segment of segments) {
    const words = segment.trim().split(/\s+/)
    let i = 1
    while (i < words.length) {
      const word = words[i]?.replace(/[^\wÀ-ÿ]/g, '') ?? ''
      if (/^[A-ZÀ-Ý][a-zà-ÿ]{2,}$/.test(word) && !blacklist.has(word)) {
        let name = word
        const next = words[i + 1]?.replace(/[^\wÀ-ÿ]/g, '') ?? ''
        if (/^[A-ZÀ-Ý][a-zà-ÿ]{2,}$/.test(next) && !blacklist.has(next)) {
          name = `${word} ${next}`
          i++
        }
        names.add(name)
      }
      i++
    }
  }

  return Array.from(names)
}

// Remove da lista qualquer "nome" que na verdade seja um clube ou competição conhecida
// (o extrator de nomes próprios não distingue isso sozinho).
export function filterPlayerNames(names: string[], career: Career): string[] {
  const blocked = new Set<string>([career.clubName.toLowerCase(), ...KNOWN_COMPETITIONS.map((c) => c.toLowerCase())])
  for (const club of CLUB_DATABASE) {
    blocked.add(club.name.toLowerCase())
    club.aliases?.forEach((a) => blocked.add(a.toLowerCase()))
  }
  return names.filter((n) => !blocked.has(n.toLowerCase()))
}

const COUNTRY_CODES = ['BR', 'AR', 'PT', 'FR', 'DE', 'ES', 'IT', 'NL', 'EN', 'BE', 'UY', 'HR']

// ─── Pools de conteúdo ────────────────────────────────────────

const OUTLETS = ['Sky Sports', 'BBC Sport', 'Cazé TV', 'ESPN', 'The Athletic', 'GE Globo Esporte', 'Marca', "L'Équipe", 'TNT Sports', 'The Guardian']
const NATIONAL_COMMENTATORS = ['Vampeta', 'Neto', 'Craque Neto', 'Cléber Machado', 'Galvão Bueno Jr.']
const INTL_PUNDITS = ['Jamie Carragher', 'Rio Ferdinand', 'Alan Shearer', 'Micah Richards', 'Gary Neville', 'Roy Keane', 'Martin Tyler']
const SA_COMMENTATORS = ['Fernando Kanapkis', 'Mauro Cezar', 'Ricardo Sá Pinto']
const RUMOR_JOURNALISTS = ['Fabrizio Romano', 'David Ornstein', 'Gianluca Di Marzio']

const FAN_HANDLES = ['@torcedor_raiz', '@ultras_oficial', '@fiel_do_clube', '@nacaocarente']
const HUMOR_HANDLES = ['@futmemes', '@zoeirafutebol', '@resenhaesportiva', '@varzeaoficial']
const STATS_HANDLES = ['@fbref_data', '@statsdofutebol', '@xg_analytics']
const CLUB_LEGEND_NAMES = ['Ícone do Clube', 'Ex-Capitão Lendário', 'Ídolo da Torcida']

const COMPETITION_ICON: Record<string, string> = {
  'Champions League': '🏆',
  'Premier League': '🏴',
  Championship: '🏴',
  'FA Cup': '🏆',
  'Carabao Cup': '🏆',
  'Europa League': '🇪🇺',
  'Conference League': '🇪🇺',
  'La Liga': '🇪🇸',
  'Serie A': '🇮🇹',
  Bundesliga: '🇩🇪',
  'Ligue 1': '🇫🇷',
  Brasileirão: '🇧🇷',
  'Copa do Brasil': '🏆',
  Libertadores: '🏆',
}

function competitionIcon(competition: string): string {
  return COMPETITION_ICON[competition] ?? '⚽'
}

function fillTemplate(template: string, career: Career): string {
  return template.replace(/\{club\}/g, career.clubName).replace(/\{manager\}/g, career.managerName)
}

// ─── Redes sociais ────────────────────────────────────────────

function buildSocialMedia(career: Career, playerNames: string[], mode: 'hiring' | 'ongoing'): SocialPost[] {
  const count = randomInt(9, 14)
  const posts: SocialPost[] = []
  const namePool = playerNames.length > 0 ? playerNames : ['Jogador Destaque']

  for (let i = 0; i < count; i++) {
    const roll = Math.random()
    let post: SocialPost

    if (mode === 'ongoing' && roll < 0.15) {
      post = {
        platform: 'twitter',
        accountType: 'stats',
        handle: pick(STATS_HANDLES),
        displayName: 'Stats & Analytics',
        content: `${career.clubName}: posse de bola ${randomInt(42, 63)}%, ${randomInt(6, 19)} finalizações, xG ${(Math.random() * 2.5).toFixed(2)}.`,
        likes: randomInt(50, 3000),
        retweets: randomInt(10, 900),
      }
    } else if (roll < 0.3) {
      post = {
        platform: 'twitter',
        accountType: 'humor',
        handle: pick(HUMOR_HANDLES),
        displayName: 'Página de Humor',
        content:
          mode === 'hiring'
            ? pick([`${career.managerName} chegando pro primeiro treino:`, `a diretoria do ${career.clubName} depois do anúncio 😮‍💨`])
            : pick([`${career.clubName} decidiu jogar no modo difícil de novo 💀`, 'a zaga hoje: 🕳️🕳️🕳️', 'quando o var demora mais que o próprio jogo:']),
        likes: randomInt(200, 47000),
        retweets: randomInt(20, 5000),
      }
    } else if (roll < 0.48) {
      const playerName = pick(namePool)
      post = {
        platform: 'twitter',
        accountType: 'player',
        handle: `@${playerName.toLowerCase().replace(/\s+/g, '')}`,
        displayName: playerName,
        countryCode: pick(COUNTRY_CODES),
        content: pick(
          mode === 'hiring'
            ? ['Bem-vindo, mister! Vamos trabalhar duro juntos. 💪', 'Ansioso para começar essa nova fase. 🔥']
            : ['Trabalho duro sempre! 💪', 'Grato pelo apoio de todos! 🙏', 'Seguimos juntos.', '🔥⚽']
        ),
        emojiOnly: Math.random() < 0.15,
        likes: randomInt(500, 40000),
        retweets: randomInt(50, 6000),
      }
    } else if (roll < 0.62) {
      post = {
        platform: 'instagram',
        accountType: 'fan',
        handle: pick(FAN_HANDLES),
        displayName: 'Torcedor(a)',
        content: fillTemplate(
          pick(
            mode === 'hiring'
              ? ['Confio no trabalho, vamos com tudo {manager}!', 'Esperava outro nome, mas vamos dar o benefício da dúvida.']
              : ['Isso sim é o {club} que eu conheço! 🔥', 'Alguém explica essa escalação pra mim? 😩', '{manager} precisa rever algumas coisas urgente.']
          ),
          career
        ),
        likes: randomInt(30, 8000),
      }
    } else if (roll < 0.74) {
      post = {
        platform: 'twitter',
        accountType: 'journalist',
        handle: `@jornalista_${randomInt(1, 99)}`,
        displayName: pick([...INTL_PUNDITS, ...NATIONAL_COMMENTATORS]),
        content:
          mode === 'hiring'
            ? `Movimentação relevante no mercado de treinadores. ${career.clubName} aposta em ${career.managerName} para a nova fase.`
            : `Acompanhando de perto o momento do ${career.clubName}. Segue movimentação interessante nos bastidores.`,
        likes: randomInt(100, 12000),
        retweets: randomInt(20, 2000),
      }
    } else if (roll < 0.84) {
      post = {
        platform: 'twitter',
        accountType: 'rival',
        handle: '@treinador_rival',
        displayName: 'Técnico Rival',
        content: pick(['Boa sorte pro resto da temporada, vai precisar 😉', 'Respeito ao trabalho, mas ainda temos contas a acertar.']),
        likes: randomInt(200, 15000),
        retweets: randomInt(30, 3000),
      }
    } else if (roll < 0.92) {
      post = {
        platform: 'instagram',
        accountType: 'club',
        handle: `@${career.clubName.toLowerCase().replace(/\s+/g, '')}oficial`,
        displayName: career.clubName,
        content: mode === 'hiring' ? `Sejam bem-vindos, ${career.managerName}! 🤝` : `Mais um capítulo da nossa temporada. Seguimos juntos! 🔴⚪`,
        likes: randomInt(2000, 46000),
      }
    } else {
      post = {
        platform: 'twitter',
        accountType: 'humor',
        handle: '@idolo_do_clube',
        displayName: pick(CLUB_LEGEND_NAMES),
        content: mode === 'hiring' ? 'Já vi vários chegarem com discurso bonito. Espero que esse entregue.' : 'Já vi isso antes nesse clube. Confio no processo.',
        likes: randomInt(300, 20000),
        retweets: randomInt(20, 4000),
      }
    }

    posts.push(post)
  }

  if (posts.length > 2) {
    posts[posts.length - 1] = { ...posts[posts.length - 1], replyTo: posts[0].handle }
  }

  return posts
}

// ─── Debate da imprensa (múltiplas citações por comentarista) ─

const HIRING_QUOTES_POSITIVE = [
  ['Faz sentido essa escolha.', 'Tem estilo de jogo definido, pode dar certo rápido.'],
  ['Aposta interessante da diretoria.', 'É o tipo de nome que sabe lidar com pressão.'],
]
const HIRING_QUOTES_SKEPTICAL = [
  ['Esperava um nome com mais experiência nesse nível.', 'Vamos ver como reage sob pressão real.'],
  ['A cobrança vai ser imediata.', 'Não vai ter lua de mel longa nesse clube.'],
]

function buildHiringDebate(career: Career): PunditQuoteBlock[] {
  const pool = [
    ...OUTLETS.map((o) => ({ outlet: o, name: pick(INTL_PUNDITS) })),
    ...NATIONAL_COMMENTATORS.map((c) => ({ outlet: 'Cazé TV', name: c })),
  ]
  const chosen = pickMany(pool, randomInt(4, 6))

  return chosen.map((entry, i) => {
    const quotes = (i % 2 === 0 ? pick(HIRING_QUOTES_POSITIVE) : pick(HIRING_QUOTES_SKEPTICAL)).map((q) =>
      fillTemplate(q, career)
    )
    return { name: entry.name, outlet: entry.outlet, quotes }
  })
}

const ONGOING_QUOTES_POSITIVE = [
  ['{manager} está entendendo rápido o que este elenco precisa.', 'Foi uma exibição sólida do início ao fim.'],
  ['O {club} mostrou personalidade num momento que exigia exatamente isso.', 'Mérito direto da comissão técnica.'],
]
const ONGOING_QUOTES_NEGATIVE = [
  ['Ainda tem muito trabalho pela frente para {manager}.', 'O discurso precisa virar resultado dentro de campo.'],
  ['A torcida está impaciente, e é compreensível.', 'Falta um plano de jogo mais claro em momentos decisivos.'],
]
const ONGOING_QUOTES_NEUTRAL = [
  ['Cedo para tirar conclusões definitivas sobre o projeto de {manager}.', 'O calendário ainda vai testar bastante essa equipe.'],
]

const TRANSFER_QUOTES = [
  ['Understand the deal is now progressing well, here we go soon.', 'Sources close to the player confirm negotiations are in a positive direction.'],
  ['Movimentação que já vinha sendo monitorada de perto pelos bastidores do mercado.', 'Detalhes contratuais ainda em conversa, mas o acordo está encaminhado.'],
]

function buildOngoingDebate(career: Career, sentimentBias: 'positive' | 'negative' | 'mixed', eventType: EventType): PunditQuoteBlock[] {
  const pool = [
    ...OUTLETS.map((o) => ({ outlet: o, name: pick(INTL_PUNDITS) })),
    ...NATIONAL_COMMENTATORS.map((c) => ({ outlet: 'Cazé TV', name: c })),
    ...SA_COMMENTATORS.map((c) => ({ outlet: 'ESPN', name: c })),
  ]
  const chosen = pickMany(pool, randomInt(4, 5))

  const blocks: PunditQuoteBlock[] = chosen.map((entry, i) => {
    let bank = ONGOING_QUOTES_NEUTRAL
    if (sentimentBias === 'positive') bank = i % 3 === 0 ? ONGOING_QUOTES_NEUTRAL : ONGOING_QUOTES_POSITIVE
    else if (sentimentBias === 'negative') bank = i % 3 === 0 ? ONGOING_QUOTES_NEUTRAL : ONGOING_QUOTES_NEGATIVE
    else bank = pick([ONGOING_QUOTES_POSITIVE, ONGOING_QUOTES_NEGATIVE, ONGOING_QUOTES_NEUTRAL])

    const quotes = pick(bank).map((q) => fillTemplate(q, career))
    return { name: entry.name, outlet: entry.outlet, quotes }
  })

  // Fabrizio Romano entra quando faz sentido: contratações e saídas
  if (eventType === 'signing' || eventType === 'departure') {
    blocks.push({ name: pick(RUMOR_JOURNALISTS), quotes: pick(TRANSFER_QUOTES) })
  }

  return blocks
}

// ─── Próximos jogos (só quando o usuário realmente informou o adversário) ──

const NEXT_MATCH_KEYWORDS = [
  'próximo jogo', 'próxima partida', 'próxima rodada', 'próximo compromisso',
  'vamos enfrentar', 'vamos encarar', 'jogo contra', 'partida contra', 'jogamos contra',
  'na próxima', 'daqui a', 'semana que vem enfrentamos',
]

// Nunca inventa adversários futuros — só preenche quando o relato do usuário
// explicitamente menciona o próximo jogo e cita um clube real da base.
function buildUpcomingFixtures(career: Career, rawInput: string): FixturePreview[] {
  const normalizedInput = rawInput.toLowerCase()
  const mentionsUpcoming = NEXT_MATCH_KEYWORDS.some((k) => normalizedInput.includes(k))
  if (!mentionsUpcoming) return []

  const opponent = findClubMentioned(rawInput, career.clubName)
  if (!opponent) return []

  return [{ opponent, note: 'Mencionado no seu relato como o próximo compromisso.', dot: 'gray' }]
}

// ─── Resultados recentes (agrupados) ─────────────────────────

function buildRecentResultsDisplay(career: Career, memory: CareerMemory, current: ResultRecord | null): ResultDisplayEntry[] {
  const all = current ? [...memory.recentResults, current] : memory.recentResults
  return all.slice(-6).map((r) => ({
    competition: r.competition,
    competitionIcon: competitionIcon(r.competition),
    // Convenção: "score" é sempre nosso time - adversário, independente de mando de campo.
    description: `${career.clubName} ${r.score} ${r.opponent}${r.isHome ? '' : ' (fora)'}`,
    outcome: r.outcome,
  }))
}

// ─── Matéria de anúncio de contratação (1º evento da carreira) ─

export function generateHiringAnnouncementArticle(params: { career: Career }): {
  headline: string
  subheadline: string
  sections: ArticleSections
  tokensUsed: number
  generationTimeMs: number
} {
  const { career } = params
  const outlet = pick(OUTLETS)

  const headline = `${career.clubName} anuncia ${career.managerName} como novo treinador`
  const subheadline = `Temporada ${career.seasonStart} · ${career.clubLeague}`

  const mainParagraphs: string[] = []
  mainParagraphs.push(
    `O ${career.clubName} confirmou oficialmente ${career.managerName} como o novo comandante da equipe para a temporada ${career.seasonStart}.`
  )
  if (career.managerOrigin) {
    mainParagraphs.push(career.managerOrigin.trim())
  }
  if (career.managerBio) {
    mainParagraphs.push(`${career.managerName} ${career.managerBio}`)
  }
  mainParagraphs.push(
    `A diretoria do ${career.clubName} espera que a chegada traga uma nova identidade ao time, com o desafio já definido: ${
      career.initialObjective ?? 'reconstruir o projeto esportivo do clube'
    }.`
  )
  mainParagraphs.push(
    `Ainda sem uma partida sequer sob o comando de ${career.managerName}, o que existe por enquanto são expectativas — e a atenção da torcida do ${career.clubName} para os primeiros passos do novo ciclo.`
  )

  const sections: ArticleSections = {
    outletLabel: outlet,
    main: mainParagraphs.join('\n\n'),
    recentResults: [],
    standingsContext: '',
    playerAnalysis: '',
    upcomingFixtures: [],
    pressDebate: buildHiringDebate(career),
    socialMedia: buildSocialMedia(career, [], 'hiring'),
    backstage: `Bastidores apurados por esta redação indicam que o nome de ${career.managerName} já vinha sendo discutido internamente pela diretoria do ${career.clubName} havia algumas semanas, mas a confirmação só saiu agora.`,
    editorial: {
      authorName: pick(INTL_PUNDITS),
      quotes: [
        `Todo início de ciclo é uma folha em branco.`,
        `${career.managerName} chega com um desafio claro pela frente: ${career.initialObjective ?? 'reconstruir o projeto'}.`,
      ],
      closingQuestion: `A pergunta que fica: quanto tempo o ${career.clubName} vai dar para ver esse projeto amadurecer?`,
    },
  }

  return {
    headline,
    subheadline,
    sections,
    tokensUsed: randomInt(1800, 2600),
    generationTimeMs: randomInt(2000, 4200),
  }
}

// ─── Matéria de cobertura contínua (demais eventos) ──────────

const EVENT_HEADLINE_TEMPLATES: Record<EventType, string[]> = {
  match_result: ['{club} responde dentro de campo em noite de muita pressão', 'Sob o comando de {manager}, {club} entrega a resposta que a torcida pedia'],
  signing: ['{club} confirma reforço para a sequência da temporada', 'Mercado: {club} fecha nova contratação'],
  departure: ['{club} perde peça importante do elenco em meio à temporada', 'Saída movimenta os bastidores do {club}'],
  squad_update: ['{club} remodela peças de olho na sequência da temporada'],
  season_start: ['{club} inicia nova temporada sob o comando de {manager}'],
  title_won: ['{club} é campeão!', 'Consagração: {manager} entra para a história do {club}'],
  dismissal_risk: ['Pressão aumenta sobre {manager} no comando do {club}'],
  press_conference: ['{manager} fala à imprensa e rebate críticas ao trabalho no {club}'],
  custom: ['Bastidores do {club} ganham novo capítulo na era {manager}'],
}

function buildMainNarrative(career: Career, memory: CareerMemory, rawInput: string, eventType: EventType, parsed: ParsedMatchResult | null): string {
  const paragraphs: string[] = []

  const opener: Record<EventType, string> = {
    match_result: `${career.clubName} entrou em campo sabendo que precisava de uma resposta, e foi exatamente isso que ${career.managerName} conseguiu tirar do grupo.`,
    signing: `O mercado voltou a mexer com o dia a dia do ${career.clubName}. A confirmação chega em um momento estratégico do planejamento de ${career.managerName}.`,
    departure: `Nem toda notícia precisa ser ruim para mexer com o vestiário. A saída confirmada nesta semana muda parte do planejamento de ${career.managerName}.`,
    squad_update: `${career.managerName} decidiu antecipar ajustes no elenco do ${career.clubName}, de olho no que vem pela frente na temporada.`,
    season_start: `Começa mais um ciclo para ${career.managerName} à frente do ${career.clubName}.`,
    title_won: `Existem noites que resumem um trabalho inteiro. Para ${career.managerName} e o ${career.clubName}, essa é uma delas.`,
    dismissal_risk: `O clima nos bastidores do ${career.clubName} azedou nos últimos dias, e o nome de ${career.managerName} virou o centro das atenções internamente.`,
    press_conference: `${career.managerName} escolheu a entrevista coletiva para colocar um ponto final nos rumores que circulavam sobre o momento do ${career.clubName}.`,
    custom: `Mais um episódio se soma à trajetória de ${career.managerName} à frente do ${career.clubName}.`,
  }

  paragraphs.push(opener[eventType])
  paragraphs.push(rawInput.trim())

  if (parsed) {
    const resultPhrase =
      parsed.outcome === 'win'
        ? `Com o resultado, o ${career.clubName} soma mais um capítulo positivo na ${parsed.competition}.`
        : parsed.outcome === 'loss'
        ? `O tropeço na ${parsed.competition} reacende questionamentos sobre a sequência de ${career.managerName} no cargo.`
        : `O empate na ${parsed.competition} deixa sensação de oportunidade perdida para o ${career.clubName}.`
    paragraphs.push(resultPhrase)
  }

  if (memory.keySignings.length > 0 && Math.random() < 0.5) {
    const s = pick(memory.keySignings)
    paragraphs.push(
      `Peça importante nesse momento é ${s.playerName}, contratado junto ao ${s.fromClub} e tratado como decisivo no planejamento de ${career.managerName}.`
    )
  }

  if (memory.establishedFacts.length > 0) {
    const fact = pick(memory.establishedFacts)
    paragraphs.push(`Um detalhe que ajuda a entender o quadro completo: ${fact.toLowerCase()}`)
  }

  paragraphs.push(
    `Para ${career.managerName}, cada capítulo como este vai além do resultado isolado — molda a narrativa de uma passagem que a torcida do ${career.clubName} acompanha de perto.`
  )

  return paragraphs.join('\n\n')
}

function buildStandingsContext(career: Career, memory: CareerMemory, current: ResultRecord | null): string {
  const all = current ? [...memory.recentResults, current] : memory.recentResults
  if (all.length < 3) return ''

  const wins = all.filter((r) => r.outcome === 'win').length
  const draws = all.filter((r) => r.outcome === 'draw').length
  const losses = all.filter((r) => r.outcome === 'loss').length

  const paragraphs: string[] = ['A classificação não conta toda a história.']
  paragraphs.push(`Nos últimos ${all.length} compromissos, o ${career.clubName} somou ${wins} vitória(s), ${draws} empate(s) e ${losses} derrota(s).`)
  if (draws >= 2) {
    paragraphs.push(
      `Os empates chamam atenção: se apenas metade deles tivesse sido convertida em vitórias, o cenário do ${career.clubName} na tabela seria bem diferente.`
    )
  }
  return paragraphs.join('\n\n')
}

function buildPlayerAnalysis(career: Career, memory: CareerMemory, playerNames: string[]): string {
  const names = playerNames.length > 0 ? playerNames : Object.keys(memory.playerHighlights)
  if (names.length === 0) {
    return `O elenco do ${career.clubName} segue em processo de adaptação às ideias de ${career.managerName}, sem um nome que se destaque isoladamente até aqui.`
  }

  const paragraphs: string[] = ['Nomes que ajudam a explicar o momento:']
  pickMany(names, Math.min(3, names.length)).forEach((name) => {
    paragraphs.push(
      pick([
        `${name} alterna boas atuações com momentos discretos, mas segue sendo peça importante nas ideias de ${career.managerName}.`,
        `${name} cresce de rendimento e já é tratado como referência técnica do elenco.`,
        `${name} ainda busca ritmo, mas a comissão técnica mantém confiança no potencial.`,
      ])
    )
  })

  return paragraphs.join('\n\n')
}

export function generateMockArticle(params: {
  career: Career
  memory: CareerMemory
  rawInput: string
  eventType: EventType
  season?: string | null
  competition?: string | null
}): { headline: string; subheadline: string; sections: ArticleSections; tokensUsed: number; generationTimeMs: number; parsedResult: ParsedMatchResult | null } {
  const { career, memory, rawInput, eventType } = params

  const headlineTemplate = pick(EVENT_HEADLINE_TEMPLATES[eventType])
  const headline = fillTemplate(headlineTemplate, career)
  const subheadline = params.competition
    ? `${params.competition}${params.season ? ` · ${params.season}` : ''}`
    : `Temporada ${params.season ?? career.currentSeason ?? career.seasonStart}`

  const sentimentBias = eventType === 'title_won' || eventType === 'signing'
    ? 'positive'
    : eventType === 'dismissal_risk' || eventType === 'departure'
    ? 'negative'
    : 'mixed'

  const playerNames = filterPlayerNames(extractProperNouns(rawInput), career)
  const parsedResult = eventType === 'match_result' ? parseMatchResult(rawInput, career.clubName, career.clubLeague) : null
  const currentResultRecord: ResultRecord | null = parsedResult
    ? { ...parsedResult, date: new Date().toISOString().split('T')[0] }
    : null

  const sections: ArticleSections = {
    outletLabel: pick(OUTLETS),
    main: buildMainNarrative(career, memory, rawInput, eventType, parsedResult),
    recentResults: eventType === 'match_result' ? buildRecentResultsDisplay(career, memory, currentResultRecord) : [],
    standingsContext: eventType === 'match_result' ? buildStandingsContext(career, memory, currentResultRecord) : '',
    playerAnalysis: buildPlayerAnalysis(career, memory, playerNames),
    upcomingFixtures: buildUpcomingFixtures(career, rawInput),
    pressDebate: buildOngoingDebate(career, sentimentBias, eventType),
    socialMedia: buildSocialMedia(career, playerNames, 'ongoing'),
    backstage: `Nos bastidores do ${career.clubName}, fontes próximas ao elenco indicam que o vestiário segue unido em torno do trabalho de ${career.managerName}, mesmo com a pressão externa crescendo a cada rodada.`,
    editorial: {
      authorName: pick(INTL_PUNDITS),
      quotes: [
        `Esses próximos compromissos vão definir boa parte do discurso sobre essa temporada do ${career.clubName}.`,
        `${career.managerName} segue tendo a chance de provar que o projeto está no caminho certo.`,
      ],
      closingQuestion: `Resta saber: o ${career.clubName} está apenas competitivo, ou pronto para brigar por algo maior?`,
    },
  }

  return {
    headline,
    subheadline,
    sections,
    tokensUsed: randomInt(2600, 4200),
    generationTimeMs: randomInt(2200, 5800),
    parsedResult,
  }
}

// ─── Extrator de atualizações de memória (mock) ──────────────

export function extractMockMemoryUpdates(params: {
  rawInput: string
  eventType: EventType
  career: Career
  parsedResult: ParsedMatchResult | null
}): {
  newFacts: string[]
  resultToAdd: ResultRecord | null
  signingToAdd: CareerMemory['keySignings'][number] | null
} {
  const { rawInput, eventType, career, parsedResult } = params
  const newFacts: string[] = []

  if (eventType === 'title_won') {
    newFacts.push(`${career.clubName} conquistou um título sob o comando de ${career.managerName}: "${rawInput.slice(0, 80)}${rawInput.length > 80 ? '…' : ''}"`)
  }

  return {
    newFacts,
    resultToAdd: parsedResult ? { ...parsedResult, date: new Date().toISOString().split('T')[0] } : null,
    signingToAdd:
      eventType === 'signing'
        ? {
            playerName: filterPlayerNames(extractProperNouns(rawInput), career)[0] ?? 'Novo Reforço',
            fromClub: findClubMentioned(rawInput, career.clubName) ?? 'Clube de Origem',
            season: career.currentSeason ?? career.seasonStart,
            context: rawInput.slice(0, 100),
          }
        : null,
  }
}

export function newShareToken(): string {
  return randomId().replace(/-/g, '').slice(0, 24)
}
