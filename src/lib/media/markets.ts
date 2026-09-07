import type { MarketCountry } from './types'

// Mercados de mídia suportados (seção 3 do brief) — estrutura pensada pra ser extensível:
// adicionar um país novo não muda a lógica central, só soma uma entrada aqui e os jornalistas dele.
export const SUPPORTED_MARKETS: Record<MarketCountry, { label: string; leagues: string[]; countryAliases: string[] }> = {
  brazil: { label: 'Brasil', leagues: ['Brasileirão', 'Copa do Brasil', 'Libertadores', 'Copa Sul-Americana'], countryAliases: ['brasil', 'brazil'] },
  england: { label: 'Inglaterra', leagues: ['Premier League', 'Championship', 'FA Cup', 'Carabao Cup'], countryAliases: ['inglaterra', 'england'] },
  france: { label: 'França', leagues: ['Ligue 1', 'Copa da França'], countryAliases: ['frança', 'france'] },
  italy: { label: 'Itália', leagues: ['Serie A', 'Coppa Italia'], countryAliases: ['itália', 'italy', 'italia'] },
  portugal: { label: 'Portugal', leagues: ['Liga Portugal', 'Taça de Portugal'], countryAliases: ['portugal'] },
  saudi_arabia: { label: 'Arábia Saudita', leagues: ['Saudi Pro League'], countryAliases: ['arábia saudita', 'saudi arabia', 'arabia saudita'] },
  argentina: { label: 'Argentina', leagues: ['Liga Profesional Argentina', 'Copa Argentina'], countryAliases: ['argentina'] },
  usa: { label: 'Estados Unidos', leagues: ['MLS'], countryAliases: ['estados unidos', 'usa', 'eua', 'united states'] },
  spain: { label: 'Espanha', leagues: ['La Liga', 'Copa del Rey'], countryAliases: ['espanha', 'spain'] },
  turkey: { label: 'Turquia', leagues: ['Süper Lig'], countryAliases: ['turquia', 'turkey'] },
  germany: { label: 'Alemanha', leagues: ['Bundesliga', 'DFB-Pokal'], countryAliases: ['alemanha', 'germany'] },
}

const CONTINENTAL_COMPETITIONS = ['Champions League', 'Europa League', 'Conference League', 'Libertadores', 'Copa Sul-Americana', 'Mundial de Clubes', 'Copa América']

export function isContinentalCompetition(competition: string | null): boolean {
  if (!competition) return false
  return CONTINENTAL_COMPETITIONS.some((c) => competition.toLowerCase().includes(c.toLowerCase()))
}

// Resolve o mercado de mídia a partir do nome de uma liga (ex: "Premier League" -> england).
export function marketForLeague(league: string | null): MarketCountry | null {
  if (!league) return null
  const normalized = league.trim().toLowerCase()
  for (const [country, info] of Object.entries(SUPPORTED_MARKETS) as [MarketCountry, (typeof SUPPORTED_MARKETS)[MarketCountry]][]) {
    if (info.leagues.some((l) => l.toLowerCase() === normalized)) return country
  }
  return null
}

// Resolve o mercado a partir do nome (em PT) do país do clube (ex: "Inglaterra" -> england).
export function marketForCountryName(countryName: string | null): MarketCountry | null {
  if (!countryName) return null
  const normalized = countryName.trim().toLowerCase()
  for (const [country, info] of Object.entries(SUPPORTED_MARKETS) as [MarketCountry, (typeof SUPPORTED_MARKETS)[MarketCountry]][]) {
    if (info.countryAliases.includes(normalized)) return country
  }
  return null
}
