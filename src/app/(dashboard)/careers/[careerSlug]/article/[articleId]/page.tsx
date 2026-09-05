'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { ArticleShareButton } from '@/components/article/ArticleShareButton'
import { ArticlePlayerButton } from '@/components/article/ArticlePlayerButton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Newspaper, Sparkles } from 'lucide-react'

export default function ArticlePage({ params }: { params: Promise<{ careerSlug: string; articleId: string }> }) {
  const { careerSlug, articleId } = use(params)
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { getArticleById, generateImageForArticle } = useMockData()
  const [imageBlocked, setImageBlocked] = useState(false)

  const article = getArticleById(articleId)

  useEffect(() => {
    if (!article || article.imageStatus !== 'pending') return

    const timer = setTimeout(() => {
      generateImageForArticle(article.id).then((result) => {
        if (!result.ok) setImageBlocked(true)
      })
    }, 1200)

    return () => clearTimeout(timer)
  }, [article, generateImageForArticle])

  if (isLoading) return <LoadingSpinner label="Carregando..." />

  if (notFound || !career || !article) {
    return (
      <EmptyState
        icon={Newspaper}
        title="Matéria não encontrada"
        action={
          <Button asChild>
            <Link href={career ? `/careers/${career.slug}` : '/careers'}>Voltar</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <Button variant="ghost" asChild>
          <Link href={`/careers/${career.slug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à carreira
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ArticleShareButton shareToken={article.shareToken} />
          <ArticlePlayerButton article={article} />
        </div>
      </div>

      {imageBlocked && (
        <Alert className="max-w-3xl mx-auto">
          <Sparkles className="w-4 h-4" />
          <AlertTitle>Imagem editorial é exclusiva do plano Pro</AlertTitle>
          <AlertDescription>
            Você já usou sua imagem gratuita.{' '}
            <Link href="/settings?paywall=images" className="underline font-medium">
              Assine o Pro
            </Link>{' '}
            para gerar imagens ilimitadas.
          </AlertDescription>
        </Alert>
      )}

      <ArticleRenderer article={article} />
    </div>
  )
}
