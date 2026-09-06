// Configuração central do motor editorial — pesos, thresholds e limites em UM lugar (nunca
// espalhados em ifs pelo código). Ajustar comportamento do motor = editar este arquivo.

export const MEDIA_CONFIG = {
  // Pesos usados no score de relevância contextual (ver scoring.ts)
  weights: {
    leagueAffinity: 0.22,
    countryAffinity: 0.18,
    clubAffinity: 0.2,
    eventTypeAffinity: 0.16,
    specialtyAffinity: 0.14,
    competitionAffinity: 0.1,
    playerAffinity: 0.08,
    internationalImportance: 0.12,
    continuityBonus: 0.1,
    userClubBonus: 0.05,
    irrelevancePenalty: 0.4,
    overusePenalty: 0.3,
    wrongEventTypePenalty: 0.5,
  },

  // Abaixo disso o candidato nem entra na lista final, mesmo que sobrem vagas.
  minSelectionScore: 0.18,

  // Quantos jornalistas por nível de importância (seção 37 do brief) — min/max editoriais.
  journalistCountByImportance: {
    LOW: { min: 0, max: 1 },
    MEDIUM: { min: 1, max: 2 },
    HIGH: { min: 2, max: 3 },
    VERY_HIGH: { min: 3, max: 5 },
    GLOBAL: { min: 4, max: 7 },
  } as const,

  // Overuse: penaliza reaparecer nas últimas N matérias da mesma carreira.
  overuse: {
    windowSize: 4, // olha as últimas N aparições registradas na memória da carreira
    penaltyPerRecentUse: 0.15, // multiplicado pelo nº de usos dentro da janela
    continuityBonusMaxUses: 2, // acima disso o bônus de continuidade vira penalidade de overuse
    continuityDecayDays: 21, // continuidade "esfria" depois de tanto tempo sem o assunto voltar
  },

  // A partir de qual importância um evento passa a considerar mercado do adversário/jogador.
  internationalThresholds: {
    opponentMarketMinImportance: 'HIGH' as const,
    playerNationalityMarketMinImportance: 'HIGH' as const,
  },

  // Sequências de resultado — vira "forma recente" relevante pro importance classifier.
  streaks: {
    lossesForAttention: 2,
    lossesForPressure: 3,
    lossesForCrisis: 5,
    winsForGoodMoment: 3,
    winsForStrongRun: 5,
    winsForHistoric: 8,
  },
} as const

export type MediaConfig = typeof MEDIA_CONFIG
