'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArticleFeedCard } from '@/components/article/ArticleFeedCard'
import { RecapSummary } from '@/components/career/RecapSummary'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trophy, History, Users, Send } from 'lucide-react'
import { buildRecapSummary } from '@/lib/mock/recap'
import { GoalKickLoader } from '@/components/shared/GoalKickLoader'

export default function CareerHubPage({ params }: { params: Promise<{ careerSlug: string }> }) {
  const { careerSlug } = use(params)
  const router = useRouter()
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { getArticlesForCareer, generateArticleForCareer } = useMockData()
  const [rawInput, setRawInput] = useState('')
  const [sending, setSending] = useState(false)
  const latestArticleRef = useRef<HTMLDivElement>(null)
  const feedBottomRef = useRef<HTMLDivElement>(null)

  const articles = career ? getArticlesForCareer(career.id).slice().reverse() : []
  const recapLines = buildRecapSummary(articles)

  useEffect(() => {
    // Rola até o TOPO da matéria mais recente — nunca até o fim da página, senão o
    // usuário só vê o resumo/composer e perde a matéria que acabou de ser gerada.
    latestArticleRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [articles.length])

  useEffect(() => {
    // Assim que o envio começa, rola até o indicador de "Escrevendo a matéria..." — sem isso,
    // se o usuário estava com o scroll lá em cima (ex: olhando a imagem de uma matéria antiga),
    // ele não via nenhuma confirmação de que o envio funcionou.
    if (sending) {
      feedBottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }, [sending])

  if (isLoading) return <LoadingSpinner label="Carregando carreira..." />
  if (notFound || !career) {
    return (
      <EmptyState
        icon={Trophy}
        title="Carreira não encontrada"
        description="Ela pode ter sido removida ou o link está incorreto."
        action={
          <Button asChild>
            <Link href="/careers">Voltar para carreiras</Link>
          </Button>
        }
      />
    )
  }

  const handleSend = async () => {
    const text = rawInput.trim()
    if (!text || sending) return
    setSending(true)

    const result = await generateArticleForCareer(career.id, { rawInput: text })
    setSending(false)

    if (!result.ok) {
      router.push('/settings?paywall=articles')
      return
    }

    setRawInput('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-lg leading-tight truncate">{career.managerName}</h1>
            <Badge variant={career.managerType === 'real' ? 'default' : 'secondary'} className="shrink-0">
              {career.managerType === 'real' ? 'Real' : 'Fictício'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {career.clubName} · {career.clubLeague}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/careers/${career.slug}/timeline`} title="Timeline">
              <History className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/careers/${career.slug}/squad`} title="Análise de elenco">
              <Users className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {articles.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Sua carreira está começando"
            description="Digite abaixo o próximo acontecimento e acompanhe a cobertura ganhar vida."
          />
        ) : (
          articles.map((article, i) => {
            const isLatest = i === articles.length - 1
            return (
              <div key={article.id} ref={isLatest ? latestArticleRef : undefined}>
                <ArticleFeedCard article={article} defaultExpanded={isLatest} />
              </div>
            )
          })
        )}

        {!sending && articles.length > 0 && <RecapSummary lines={recapLines} />}

        {sending && (
          <div className="rounded-3xl border bg-muted/50 px-4 py-3">
            <GoalKickLoader label="Escrevendo a matéria..." className="scale-90 -my-2" />
          </div>
        )}

        <div ref={feedBottomRef} />
      </div>

      <div className="sticky bottom-20 md:bottom-4 z-10">
        <div className="rounded-3xl border bg-card shadow-lg p-2 flex items-end gap-2">
          <Textarea
            placeholder="O que aconteceu? Ex: vencemos o rival por 2x1 fora de casa..."
            rows={1}
            className="resize-none min-h-0 border-0 shadow-none focus-visible:ring-0 py-2"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={sending}
          />
          <Button size="icon" className="shrink-0" onClick={handleSend} disabled={!rawInput.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
