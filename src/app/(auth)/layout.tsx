'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Newspaper } from 'lucide-react'
import { useMockData } from '@/lib/mock/store'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { state, isHydrated, getMostRecentCareer } = useMockData()
  const checkedRef = useRef(false)

  useEffect(() => {
    // Só verifica uma vez, na hidratação inicial — evita competir com o redirect
    // explícito que login/signup disparam após autenticar nesta própria página.
    if (!isHydrated || checkedRef.current) return
    checkedRef.current = true
    if (state.isAuthenticated) {
      const recent = getMostRecentCareer()
      router.replace(recent ? `/careers/${recent.slug}` : '/onboarding')
    }
  }, [isHydrated, state.isAuthenticated, router, getMostRecentCareer])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-muted/30">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
          <Newspaper className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight">CarreiraPRO</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
