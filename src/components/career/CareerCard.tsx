'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Newspaper, MapPin, ArrowRight } from 'lucide-react'
import type { Career } from '@/types'

export function CareerCard({ career }: { career: Career }) {
  const router = useRouter()

  return (
    <Card
      className="h-full cursor-pointer transition-colors hover:ring-foreground/20"
      onClick={() => router.push(`/careers/${career.slug}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-tight">{career.managerName}</p>
            <p className="text-sm text-muted-foreground">{career.clubName}</p>
          </div>
          <Badge variant={career.managerType === 'real' ? 'default' : 'secondary'}>
            {career.managerType === 'real' ? 'Real' : 'Fictício'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {career.clubLeague} · {career.clubCountry}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Newspaper className="w-3.5 h-3.5" />
            {career.eventsCount} {career.eventsCount === 1 ? 'matéria' : 'matérias'}
          </span>
          {career.initialObjective && (
            <Badge variant="outline" className="text-xs truncate max-w-[140px]">
              {career.initialObjective}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Temporada {career.currentSeason ?? career.seasonStart}</p>

        <Button asChild size="sm" className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500">
          <Link href={`/careers/${career.slug}`} onClick={(e) => e.stopPropagation()}>
            Continuar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
