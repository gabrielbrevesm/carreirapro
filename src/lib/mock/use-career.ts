'use client'

import { useMockData } from '@/lib/mock/store'

export function useCareer(slug: string) {
  const { getCareerBySlug, isHydrated } = useMockData()
  const career = isHydrated ? getCareerBySlug(slug) : undefined
  return { career, isLoading: !isHydrated, notFound: isHydrated && !career }
}
