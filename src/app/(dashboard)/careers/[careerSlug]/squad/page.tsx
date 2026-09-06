'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Paywall } from '@/components/shared/Paywall'
import { SquadUploader } from '@/components/squad/SquadUploader'
import { TransferSuggestionCard } from '@/components/squad/TransferSuggestionCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Users } from 'lucide-react'
import type { SquadAnalysis } from '@/types'

export default function SquadAnalysisPage({ params }: { params: Promise<{ careerSlug: string }> }) {
  const { careerSlug } = use(params)
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { getSquadAnalysesForCareer, isFeatureAllowed } = useMockData()
  const [justAnalyzed, setJustAnalyzed] = useState<SquadAnalysis | null>(null)

  if (isLoading) return <LoadingSpinner label="Carregando..." />
  if (notFound || !career) {
    return (
      <EmptyState
        icon={Trophy}
        title="Carreira não encontrada"
        action={
          <Button asChild>
            <Link href="/careers">Voltar para carreiras</Link>
          </Button>
        }
      />
    )
  }

  const canAnalyze = isFeatureAllowed('squadAnalyses')
  const analyses = getSquadAnalysesForCareer(career.id)
  const latest = justAnalyzed ?? analyses[analyses.length - 1]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-2 shrink-0">
          <Link href={`/careers/${career.slug}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Análise de Elenco</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {career.managerName} · {career.clubName}
          </p>
        </div>
      </div>

      {!canAnalyze ? (
        <Paywall feature="squad_analysis" />
      ) : (
        <>
          <SquadUploader careerId={career.id} onAnalyzed={setJustAnalyzed} />

          {latest ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" /> Posições carentes identificadas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {latest.identifiedGaps.map((gap) => (
                    <Badge key={gap} variant="secondary">
                      {gap}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-semibold">Sugestões de contratação</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {latest.suggestions.map((s, i) => (
                    <TransferSuggestionCard key={`${s.playerName}-${i}`} suggestion={s} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhuma análise ainda"
              description="Envie uma foto do elenco para receber sugestões de contratação contextualizadas."
            />
          )}
        </>
      )}
    </div>
  )
}
