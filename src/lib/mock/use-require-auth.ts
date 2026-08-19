'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockData } from '@/lib/mock/store'

export function useRequireAuth() {
  const router = useRouter()
  const { state, isHydrated } = useMockData()

  useEffect(() => {
    if (isHydrated && !state.isAuthenticated) {
      router.replace('/login')
    }
  }, [isHydrated, state.isAuthenticated, router])

  return { isReady: isHydrated && state.isAuthenticated, profile: state.profile }
}
