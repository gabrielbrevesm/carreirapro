import type { MediaOutlet, MarketCountry } from './types'

// Veículos por mercado (seção 42 do brief). Extensível: adicionar um mercado novo é só
// adicionar uma entrada aqui + em markets.ts + em journalists/<pais>.ts.
export const MEDIA_OUTLETS: MediaOutlet[] = [
  // Brasil
  { id: 'globo', name: 'Globo', country: 'brazil' },
  { id: 'sportv', name: 'SporTV', country: 'brazil' },
  { id: 'espn_brasil', name: 'ESPN Brasil', country: 'brazil' },
  { id: 'tnt_sports_br', name: 'TNT Sports', country: 'brazil' },
  { id: 'ge', name: 'GE', country: 'brazil' },
  { id: 'uol', name: 'UOL', country: 'brazil' },

  // Inglaterra
  { id: 'sky_sports', name: 'Sky Sports', country: 'england' },
  { id: 'bbc_sport', name: 'BBC Sport', country: 'england' },
  { id: 'the_athletic', name: 'The Athletic', country: 'england' },
  { id: 'the_guardian', name: 'The Guardian', country: 'england' },

  // Itália
  { id: 'sky_italia', name: 'Sky Italia', country: 'italy' },
  { id: 'gazzetta', name: 'La Gazzetta dello Sport', country: 'italy' },
  { id: 'corriere_dello_sport', name: 'Corriere dello Sport', country: 'italy' },
  { id: 'dazn_italia', name: 'DAZN', country: 'italy' },

  // Espanha
  { id: 'as', name: 'AS', country: 'spain' },
  { id: 'marca', name: 'Marca', country: 'spain' },
  { id: 'mundo_deportivo', name: 'Mundo Deportivo', country: 'spain' },
  { id: 'relevo', name: 'Relevo', country: 'spain' },

  // Alemanha
  { id: 'sky_deutschland', name: 'Sky Deutschland', country: 'germany' },
  { id: 'kicker', name: 'Kicker', country: 'germany' },
  { id: 'bild', name: 'Bild', country: 'germany' },

  // Argentina
  { id: 'espn_argentina', name: 'ESPN Argentina', country: 'argentina' },
  { id: 'tyc_sports', name: 'TyC Sports', country: 'argentina' },
  { id: 'ole', name: 'Olé', country: 'argentina' },

  // Portugal
  { id: 'a_bola', name: 'A Bola', country: 'portugal' },
  { id: 'record', name: 'Record', country: 'portugal' },
  { id: 'o_jogo', name: 'O Jogo', country: 'portugal' },
  { id: 'rtp', name: 'RTP', country: 'portugal' },

  // França
  { id: 'lequipe', name: "L'Équipe", country: 'france' },
  { id: 'rmc_sport', name: 'RMC Sport', country: 'france' },
  { id: 'tf1', name: 'TF1', country: 'france' },

  // Estados Unidos
  { id: 'the_athletic_us', name: 'The Athletic', country: 'usa' },
  { id: 'espn_us', name: 'ESPN', country: 'usa' },
  { id: 'mls_media', name: 'MLS', country: 'usa' },

  // Turquia
  { id: 'sports_digitale', name: 'Sports Digitale', country: 'turkey' },
  { id: 'trt_spor', name: 'TRT Spor', country: 'turkey' },
  { id: 'bein_turkiye', name: 'beIN Sports Türkiye', country: 'turkey' },

  // Arábia Saudita — veículos locais configuráveis, começando com um genérico.
  { id: 'ksa_sports', name: 'Saudi Sports', country: 'saudi_arabia' },
]

export function getOutlet(id: string): MediaOutlet | null {
  return MEDIA_OUTLETS.find((o) => o.id === id) ?? null
}

export function outletsForCountry(country: MarketCountry): MediaOutlet[] {
  return MEDIA_OUTLETS.filter((o) => o.country === country)
}
