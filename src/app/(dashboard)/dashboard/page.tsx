'use client'

import Link from 'next/link'
import { useMockData } from '@/lib/mock/store'
import { CareerCard } from '@/components/career/CareerCard'
import { NewCareerButton } from '@/components/career/NewCareerButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { BoleiroInsights } from '@/components/dashboard/BoleiroInsights'
import { cn } from '@/lib/utils'
import { Trophy, Newspaper, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { state } = useMockData()
  const { careers, articles, profile, plan } = { ...state }

  const totalArticles = articles.length
  const activeCareers = careers.filter((c) => c.isActive).length

  const stats = [
    { icon: Trophy, value: String(activeCareers), label: 'Carreiras ativas' },
    { icon: Newspaper, value: String(totalArticles), label: 'Matérias publicadas' },
    { icon: Sparkles, value: plan === 'pro' ? 'Pro' : 'Gratuito', label: 'Plano atual', gold: plan === 'pro' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {profile?.fullName?.split(' ')[0] ?? 'treinador'}</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral de todas as suas carreiras.</p>
        </div>
        <NewCareerButton />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Suas carreiras</h2>
          {careers.length > 0 && (
            <Link href="/careers" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          )}
        </div>

        {careers.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Nenhuma carreira ainda"
            description="Crie sua primeira carreira e comece a gerar matérias sobre sua trajetória no EA FC."
            action={<NewCareerButton label="Criar carreira" />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careers.slice(0, 6).map((career) => (
              <CareerCard key={career.id} career={career} />
            ))}
          </div>
        )}
      </div>

      <BoleiroInsights />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-2 py-2 sm:gap-0 sm:divide-x">
        {stats.map(({ icon: Icon, value, label, gold }) => (
          <div key={label} className="flex flex-1 items-center gap-2.5 px-2.5 py-1 sm:px-4">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                gold ? 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600' : 'bg-primary/10'
              )}
            >
              <Icon className={cn('h-4 w-4', gold ? 'text-amber-950' : 'text-primary')} />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  'text-base font-bold leading-none capitalize',
                  gold && 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
                )}
              >
                {value}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground leading-none">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
