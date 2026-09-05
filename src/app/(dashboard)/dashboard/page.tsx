'use client'

import Link from 'next/link'
import { useMockData } from '@/lib/mock/store'
import { CareerCard } from '@/components/career/CareerCard'
import { NewCareerButton } from '@/components/career/NewCareerButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { BoleiroInsights } from '@/components/dashboard/BoleiroInsights'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Newspaper, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { state } = useMockData()
  const { careers, articles, profile, plan } = { ...state }

  const totalArticles = articles.length
  const activeCareers = careers.filter((c) => c.isActive).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {profile?.fullName?.split(' ')[0] ?? 'treinador'}</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral de todas as suas carreiras.</p>
        </div>
        <NewCareerButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{activeCareers}</p>
              <p className="text-xs text-muted-foreground mt-1">Carreiras ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{totalArticles}</p>
              <p className="text-xs text-muted-foreground mt-1">Matérias publicadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                plan === 'pro' ? 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600' : 'bg-primary/10'
              )}
            >
              <Sparkles className={cn('w-5 h-5', plan === 'pro' ? 'text-amber-950' : 'text-primary')} />
            </div>
            <div>
              <p
                className={cn(
                  'text-2xl font-bold leading-none capitalize',
                  plan === 'pro' && 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
                )}
              >
                {plan === 'pro' ? 'Pro' : 'Gratuito'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Plano atual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BoleiroInsights />

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
    </div>
  )
}
