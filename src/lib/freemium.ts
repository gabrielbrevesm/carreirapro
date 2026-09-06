import type { UsageTracking, UserPlan } from '@/types'

// Cobrança baseada em VOLUME DE MATÉRIAS, não em número de carreiras: o usuário pode criar
// quantas carreiras quiser, todas gratuitas, até a 5ª matéria gerada (somando todas as
// carreiras). A partir daí, precisa do Pro para continuar gerando — em qualquer carreira,
// existente ou nova. Imagens seguem ilimitadas no Free (a matéria já é o gargalo); análise de
// elenco continua exclusiva do Pro.
export const FREE_LIMITS = {
  articlesGenerated: 5,
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
