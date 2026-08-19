'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { LandingPage } from '@/components/marketing/LandingPage'

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

  return <LandingPage />
}
