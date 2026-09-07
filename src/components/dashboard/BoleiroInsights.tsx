'use client'

import { useEffect, useState, useCallback } from 'react'
import { useMockData } from '@/lib/mock/store'
import { tryGenerateBoleiroInsights } from '@/lib/ai/client-api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, RefreshCw, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BoleiroInsights() {
  const { state } = useMockData()
  const [tips, setTips] = useState<string[]>([])
  const [newCareerSuggestions, setNewCareerSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    const result = await tryGenerateBoleiroInsights({
      careers: state.careers,
      memories: state.careerMemories,
      articles: state.articles,
    })
    if (result) {
      setTips(result.tips)
      setNewCareerSuggestions(result.newCareerSuggestions)
    } else {
      setFailed(true)
    }
    setLoading(false)
    setLoadedOnce(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.careers.length > 0 && !loadedOnce && !loading) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.careers.length])

  if (state.careers.length === 0) return null

  return (
    <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base">Dica de Boleiro</CardTitle>
              <CardDescription>Sugestões da IA para suas próximas matérias</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={load}
            disabled={loading}
            aria-label="Atualizar dicas"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !loadedOnce ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 rounded bg-muted animate-pulse" style={{ width: `${85 - i * 12}%` }} />
            ))}
          </div>
        ) : failed ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível gerar dicas agora. Tente novamente em instantes.
          </p>
        ) : (
          <>
            <ul className="space-y-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 leading-snug">{tip}</span>
                </li>
              ))}
            </ul>

            {newCareerSuggestions.length > 0 && (
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Compass className="w-3.5 h-3.5" />
                  Novas carreiras pra considerar
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {newCareerSuggestions.map((suggestion, i) => (
                    <span
                      key={i}
                      className="text-xs rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-foreground/80"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
