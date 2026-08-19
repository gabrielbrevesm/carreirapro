import type { UsageTracking, UserPlan } from '@/types'

// A cobrança só passa a valer ao tentar abrir uma 2ª carreira (ver canCreateCareer).
// Dentro da 1ª carreira, o plano gratuito é ilimitado para matérias e imagens —
// só a análise de elenco continua sendo um recurso exclusivo do Pro.
export const FREE_LIMITS = {
  articlesGenerated: Infinity,
  imagesGenerated: Infinity,
  squadAnalyses: 0,
} as const

export type UsageField = keyof typeof FREE_LIMITS

export function isAllowed(plan: UserPlan, usage: UsageTracking, field: UsageField): boolean {
  if (plan === 'pro') return true
  return usage[field] < FREE_LIMITS[field]
}

export function remainingFor(plan: UserPlan, usage: UsageTracking, field: UsageField): number | null {
  if (plan === 'pro') return null
  const limit = FREE_LIMITS[field]
  if (!Number.isFinite(limit)) return null
  return Math.max(limit - usage[field], 0)
}

// Apenas a primeira carreira é gratuita — a partir da segunda, exige o plano Pro
export function canCreateCareer(plan: UserPlan, existingCareersCount: number): boolean {
  if (plan === 'pro') return true
  return existingCareersCount === 0
}
