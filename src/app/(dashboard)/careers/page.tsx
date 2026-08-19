'use client'

import { useMockData } from '@/lib/mock/store'
import { CareerCard } from '@/components/career/CareerCard'
import { NewCareerButton } from '@/components/career/NewCareerButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { Trophy } from 'lucide-react'

export default function CareersPage() {
  const { state } = useMockData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas carreiras</h1>
          <p className="text-muted-foreground text-sm mt-1">Todas as suas carreiras salvas.</p>
        </div>
        <NewCareerButton />
      </div>

      {state.careers.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhuma carreira ainda"
          description="Crie sua primeira carreira e comece a gerar matérias sobre sua trajetória no EA FC."
          action={<NewCareerButton label="Criar carreira" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.careers.map((career) => (
            <CareerCard key={career.id} career={career} />
          ))}
        </div>
      )}
    </div>
  )
}
