import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Article } from '@/types'
import { ImageIcon } from 'lucide-react'

const EVENT_TYPE_ICONS: Record<string, string> = {
  match_result: '⚽',
  signing: '🤝',
  departure: '✈️',
  squad_update: '📋',
  season_start: '🏁',
  title_won: '🏆',
  dismissal_risk: '🔥',
  press_conference: '🎤',
  custom: '📰',
}

export function ArticleCard({ article, careerSlug }: { article: Article; careerSlug: string }) {
  return (
    <Link href={`/careers/${careerSlug}/article/${article.id}`}>
      <Card className="transition-colors hover:ring-foreground/20">
        <CardContent className="pt-6 flex gap-4">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {article.imageStatus === 'ready' && article.imageUrl ? (
              <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{EVENT_TYPE_ICONS[article.eventType ?? 'custom']}</span>
              <span>{new Date(article.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'medium' })}</span>
              {article.competition && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {article.competition}
                </Badge>
              )}
            </div>
            <p className="font-semibold leading-tight truncate">{article.headline}</p>
            {article.subheadline && <p className="text-sm text-muted-foreground truncate">{article.subheadline}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
