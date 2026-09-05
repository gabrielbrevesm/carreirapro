'use client'

import { useEffect, useState } from 'react'
import type { Article } from '@/types'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { ArticleShareButton } from '@/components/article/ArticleShareButton'
import { ArticlePlayerButton } from '@/components/article/ArticlePlayerButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react'
import { useMockData } from '@/lib/mock/store'

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

export function ArticleFeedCard({ article, defaultExpanded }: { article: Article; defaultExpanded?: boolean }) {
  const { generateImageForArticle } = useMockData()
  const [expanded, setExpanded] = useState(!!defaultExpanded)

  useEffect(() => {
    if (article.imageStatus !== 'pending') return
    const timer = setTimeout(() => {
      generateImageForArticle(article.id)
    }, 1200)
    return () => clearTimeout(timer)
  }, [article, generateImageForArticle])

  return (
    <div className="rounded-3xl border bg-card overflow-hidden">
      {!expanded ? (
        <button className="w-full text-left p-4 flex gap-3 items-start" onClick={() => setExpanded(true)}>
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {article.imageStatus === 'ready' && article.imageUrl ? (
              <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>{EVENT_TYPE_ICONS[article.eventType ?? 'custom']}</span>
              <span>{new Date(article.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'medium' })}</span>
              {article.competition && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {article.competition}
                </Badge>
              )}
            </div>
            <p className="font-semibold leading-tight">{article.headline}</p>
            {article.subheadline && <p className="text-sm text-muted-foreground line-clamp-1">{article.subheadline}</p>}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <ArticleShareButton shareToken={article.shareToken} />
              <ArticlePlayerButton article={article} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              Recolher <ChevronUp className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="p-4">
            <ArticleRenderer article={article} />
          </div>
        </div>
      )}
    </div>
  )
}
