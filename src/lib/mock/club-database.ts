// Base mock de clubes conhecidos — simula a "IA consultando" liga e país atuais do clube.
// Em produção isso seria uma chamada real (ex: busca na web ou API de dados esportivos).

export type ClubInfo = {
  name: string
  league: string
  country: string
  aliases?: string[]
}

export const CLUB_DATABASE: ClubInfo[] = [
  // Premier League
  { name: 'Manchester United', league: 'Premier League', country: 'Inglaterra', aliases: ['man united', 'man utd'] },
  { name: 'Manchester City', league: 'Premier League', country: 'Inglaterra', aliases: ['man city'] },
  { name: 'Liverpool', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Arsenal', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Chelsea', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Tottenham Hotspur', league: 'Premier League', country: 'Inglaterra', aliases: ['tottenham', 'spurs'] },
  { name: 'Newcastle United', league: 'Premier League', country: 'Inglaterra', aliases: ['newcastle'] },
  { name: 'Aston Villa', league: 'Premier League', country: 'Inglaterra' },
  { name: 'West Ham United', league: 'Premier League', country: 'Inglaterra', aliases: ['west ham'] },
  { name: 'Brighton & Hove Albion', league: 'Premier League', country: 'Inglaterra', aliases: ['brighton'] },
  { name: 'Everton', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Fulham', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Brentford', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Crystal Palace', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Wolverhampton Wanderers', league: 'Premier League', country: 'Inglaterra', aliases: ['wolves'] },
  { name: 'Bournemouth', league: 'Premier League', country: 'Inglaterra' },
  { name: 'Nottingham Forest', league: 'Premier League', country: 'Inglaterra' },

  // Championship
  { name: 'Leeds United', league: 'Championship', country: 'Inglaterra', aliases: ['leeds'] },
  { name: 'Leicester City', league: 'Championship', country: 'Inglaterra', aliases: ['leicester'] },
  { name: 'Southampton', league: 'Championship', country: 'Inglaterra' },
  { name: 'Norwich City', league: 'Championship', country: 'Inglaterra', aliases: ['norwich'] },
  { name: 'West Bromwich Albion', league: 'Championship', country: 'Inglaterra', aliases: ['west brom'] },
  { name: 'Sunderland', league: 'Championship', country: 'Inglaterra' },
  { name: 'Middlesbrough', league: 'Championship', country: 'Inglaterra' },
  { name: 'Sheffield United', league: 'Championship', country: 'Inglaterra' },

  // La Liga
  { name: 'Real Madrid', league: 'La Liga', country: 'Espanha' },
  { name: 'Barcelona', league: 'La Liga', country: 'Espanha', aliases: ['fc barcelona', 'barça'] },
  { name: 'Atlético de Madrid', league: 'La Liga', country: 'Espanha', aliases: ['atletico madrid', 'atlético madrid'] },
  { name: 'Sevilla', league: 'La Liga', country: 'Espanha' },
  { name: 'Real Sociedad', league: 'La Liga', country: 'Espanha' },
  { name: 'Athletic Bilbao', league: 'La Liga', country: 'Espanha' },
  { name: 'Real Betis', league: 'La Liga', country: 'Espanha', aliases: ['betis'] },
  { name: 'Valencia', league: 'La Liga', country: 'Espanha' },
  { name: 'Villarreal', league: 'La Liga', country: 'Espanha' },
  { name: 'Girona', league: 'La Liga', country: 'Espanha' },

  // Serie A
  { name: 'Juventus', league: 'Serie A', country: 'Itália' },
  { name: 'Inter de Milão', league: 'Serie A', country: 'Itália', aliases: ['inter milan', 'internazionale', 'inter'] },
  { name: 'Milan', league: 'Serie A', country: 'Itália', aliases: ['ac milan'] },
  { name: 'Napoli', league: 'Serie A', country: 'Itália' },
  { name: 'Roma', league: 'Serie A', country: 'Itália', aliases: ['as roma'] },
  { name: 'Lazio', league: 'Serie A', country: 'Itália' },
  { name: 'Atalanta', league: 'Serie A', country: 'Itália' },
  { name: 'Fiorentina', league: 'Serie A', country: 'Itália' },
  { name: 'Torino', league: 'Serie A', country: 'Itália' },
  { name: 'Bologna', league: 'Serie A', country: 'Itália' },

  // Bundesliga
  { name: 'Bayern de Munique', league: 'Bundesliga', country: 'Alemanha', aliases: ['bayern munich', 'bayern munique', 'bayern'] },
  { name: 'Borussia Dortmund', league: 'Bundesliga', country: 'Alemanha', aliases: ['dortmund', 'bvb'] },
  { name: 'RB Leipzig', league: 'Bundesliga', country: 'Alemanha', aliases: ['leipzig'] },
  { name: 'Bayer Leverkusen', league: 'Bundesliga', country: 'Alemanha', aliases: ['leverkusen'] },
  { name: 'Eintracht Frankfurt', league: 'Bundesliga', country: 'Alemanha', aliases: ['frankfurt'] },
  { name: 'Borussia Mönchengladbach', league: 'Bundesliga', country: 'Alemanha', aliases: ['monchengladbach', 'gladbach'] },
  { name: 'VfB Stuttgart', league: 'Bundesliga', country: 'Alemanha', aliases: ['stuttgart'] },
  { name: 'Werder Bremen', league: 'Bundesliga', country: 'Alemanha', aliases: ['bremen'] },

  // Ligue 1
  { name: 'Paris Saint-Germain', league: 'Ligue 1', country: 'França', aliases: ['psg', 'paris sg'] },
  { name: 'Olympique de Marselha', league: 'Ligue 1', country: 'França', aliases: ['marseille', 'marselha'] },
  { name: 'Olympique Lyonnais', league: 'Ligue 1', country: 'França', aliases: ['lyon'] },
  { name: 'Monaco', league: 'Ligue 1', country: 'França', aliases: ['as monaco'] },
  { name: 'Lille', league: 'Ligue 1', country: 'França' },
  { name: 'Rennes', league: 'Ligue 1', country: 'França' },
  { name: 'Nice', league: 'Ligue 1', country: 'França' },

  // Liga Portugal
  { name: 'Benfica', league: 'Liga Portugal', country: 'Portugal', aliases: ['sl benfica'] },
  { name: 'Porto', league: 'Liga Portugal', country: 'Portugal', aliases: ['fc porto'] },
  { name: 'Sporting CP', league: 'Liga Portugal', country: 'Portugal', aliases: ['sporting', 'sporting lisboa'] },
  { name: 'Braga', league: 'Liga Portugal', country: 'Portugal', aliases: ['sc braga'] },

  // Eredivisie
  { name: 'Ajax', league: 'Eredivisie', country: 'Holanda', aliases: ['afc ajax'] },
  { name: 'PSV Eindhoven', league: 'Eredivisie', country: 'Holanda', aliases: ['psv'] },
  { name: 'Feyenoord', league: 'Eredivisie', country: 'Holanda' },

  // Brasileirão Série A
  { name: 'Flamengo', league: 'Brasileirão Série A', country: 'Brasil', aliases: ['cr flamengo'] },
  { name: 'Palmeiras', league: 'Brasileirão Série A', country: 'Brasil' },
  { name: 'São Paulo', league: 'Brasileirão Série A', country: 'Brasil', aliases: ['sao paulo', 'spfc'] },
  { name: 'Corinthians', league: 'Brasileirão Série A', country: 'Brasil' },
  { name: 'Grêmio', league: 'Brasileirão Série A', country: 'Brasil', aliases: ['gremio'] },
  { name: 'Internacional', league: 'Brasileirão Série A', country: 'Brasil' },
  { name: 'Atlético Mineiro', league: 'Brasileirão Série A', country: 'Brasil', aliases: ['atletico mineiro', 'galo'] },
  { name: 'Cruzeiro', league: 'Brasileirão Série A', country: 'Brasil' },
  { name: 'Fluminense', league: 'Brasileirão Série A', country: 'Brasil' },
  { name: 'Botafogo', league: 'Brasileirão Série A', country: 'Brasil' },
  { name: 'Vasco da Gama', league: 'Brasileirão Série A', country: 'Brasil', aliases: ['vasco'] },
  { name: 'Bahia', league: 'Brasileirão Série A', country: 'Brasil' },

  // Escócia / outros
  { name: 'Celtic', league: 'Scottish Premiership', country: 'Escócia' },
  { name: 'Rangers', league: 'Scottish Premiership', country: 'Escócia' },

  // Seleções (para carreiras de seleção nacional)
  { name: 'Seleção Brasileira', league: 'Seleções Nacionais', country: 'Brasil', aliases: ['brasil', 'selecao brasileira'] },
  { name: 'Seleção Argentina', league: 'Seleções Nacionais', country: 'Argentina', aliases: ['argentina'] },
  { name: 'Seleção Inglesa', league: 'Seleções Nacionais', country: 'Inglaterra', aliases: ['inglaterra'] },
]

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Procura por qualquer clube da base mencionado dentro de um texto livre (ex: relato de partida),
// ignorando o próprio clube do usuário. Usado para identificar o adversário de um resultado.
export function findClubMentioned(text: string, excludeName?: string): string | null {
  const normalizedText = normalize(text)
  const excludeNormalized = excludeName ? normalize(excludeName) : null

  for (const club of CLUB_DATABASE) {
    if (excludeNormalized && normalize(club.name) === excludeNormalized) continue
    const candidates = [club.name, ...(club.aliases ?? [])]
    if (candidates.some((c) => normalizedText.includes(normalize(c)))) {
      return club.name
    }
  }
  return null
}

export function lookupClub(query: string): ClubInfo | null {
  const q = normalize(query)
  if (q.length < 3) return null

  for (const club of CLUB_DATABASE) {
    if (normalize(club.name) === q) return club
    if (club.aliases?.some((a) => normalize(a) === q)) return club
  }

  const partial = CLUB_DATABASE.filter(
    (club) => normalize(club.name).includes(q) || club.aliases?.some((a) => normalize(a).includes(q))
  )
  if (partial.length === 1) return partial[0]

  return null
}
