'use client'

import { use } from 'react'
import Link from 'next/link'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { CareerTimeline } from '@/components/career/CareerTimeline'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function CareerTimelinePage({ params }: { params: Promise<{ careerSlug: string }> }) {
  const { careerSlug } = use(params)
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { getEventsForCareer, getArticlesForCareer } = useMockData()

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

  const events = getEventsForCareer(career.id)
  const articles = getArticlesForCareer(career.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-2 shrink-0">
          <Link href={`/careers/${career.slug}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {career.managerName} · {career.clubName}
          </p>
        </div>
      </div>
      <CareerTimeline events={events} articles={articles} careerSlug={career.slug} />
    </div>
  )
}
