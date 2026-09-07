'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { LandingPage } from '@/components/marketing/LandingPage'
import { LandingPageV2 } from '@/components/marketing/LandingPageV2'

// Landing em teste (conceito "central de comando" escuro) — pra voltar pra versão anterior,
// troque só esta linha pra 'v1' e reimplante. A v1 continua 100% intacta em LandingPage.tsx.
const ACTIVE_LANDING: 'v1' | 'v2' = 'v2'

export default function RootPage() {
  const router = useRouter()
  const { state, isHydrated, getMostRecentCareer } = useMockData()

  useEffect(() => {
    if (!isHydrated || !state.isAuthenticated) return
    const recent = getMostRecentCareer()
    router.replace(recent ? `/careers/${recent.slug}` : '/onboarding')
  }, [isHydrated, state.isAuthenticated, router, getMostRecentCareer])

  if (!isHydrated || state.isAuthenticated) {
    return <LoadingSpinner label="Carregando..." className="min-h-screen" />
  }

  return ACTIVE_LANDING === 'v2' ? <LandingPageV2 /> : <LandingPage />
}
