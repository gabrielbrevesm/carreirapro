'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Newspaper } from 'lucide-react'
import { useMockData } from '@/lib/mock/store'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { state, isHydrated, getMostRecentCareer } = useMockData()

  useEffect(() => {
    // Reage a QUALQUER mudança de isAuthenticated — login/cadastro com senha ativam a sessão
    // direto nesta página (sem o redirect server-side que o magic link e o OAuth do Google têm
    // via /auth/callback), então precisa redirecionar assim que o auth state mudar, não só uma
    // vez na hidratação inicial.
    if (!isHydrated || !state.isAuthenticated) return
    const recent = getMostRecentCareer()
    router.replace(recent ? `/careers/${recent.slug}` : '/onboarding')
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
