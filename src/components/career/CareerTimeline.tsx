import Link from 'next/link'
import type { Article, CareerEvent, EventType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { History } from 'lucide-react'

const EVENT_TYPE_META: Record<EventType, { icon: string; label: string }> = {
  match_result: { icon: '⚽', label: 'Resultado' },
  signing: { icon: '🤝', label: 'Contratação' },
  departure: { icon: '✈️', label: 'Saída' },
  squad_update: { icon: '📋', label: 'Elenco' },
  season_start: { icon: '🏁', label: 'Nova Temporada' },
  title_won: { icon: '🏆', label: 'Título' },
  dismissal_risk: { icon: '🔥', label: 'Risco de Demissão' },
  press_conference: { icon: '🎤', label: 'Coletiva' },
  custom: { icon: '📰', label: 'Acontecimento' },
}

type Props = {
  events: CareerEvent[]
  articles: Article[]
  careerSlug: string
}

export function CareerTimeline({ events, articles, careerSlug }: Props) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sua timeline está vazia"
        description="Assim que você gerar matérias, elas vão aparecer aqui em ordem cronológica."
      />
    )
  }

  const sorted = [...events].sort((a, b) => b.eventOrder - a.eventOrder)

  return (
    <ol className="relative border-s ps-6 space-y-8">
      {sorted.map((event) => {
        const article = articles.find((a) => a.eventId === event.id)
        const meta = EVENT_TYPE_META[event.eventType]

        return (
          <li key={event.id} className="relative">
            <span className="absolute -start-[calc(1.5rem+5px)] top-0.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>{meta.icon}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {meta.label}
              </Badge>
              <span>{new Date(event.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'medium' })}</span>
              {event.competition && <span>· {event.competition}</span>}
            </div>
            {article ? (
              <Link href={`/careers/${careerSlug}/article/${article.id}`} className="font-semibold hover:underline">
                {article.headline}
              </Link>
            ) : (
              <p className="font-semibold">{event.rawInput.slice(0, 80)}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.rawInput}</p>
          </li>
        )
      })}
    </ol>
  )
}
