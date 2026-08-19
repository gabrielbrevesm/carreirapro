'use client'

import { use } from 'react'
import Link from 'next/link'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { Button } from '@/components/ui/button'
import { Newspaper } from 'lucide-react'

export default function SharedArticlePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const { getArticleByShareToken, isHydrated } = useMockData()

  if (!isHydrated) return <LoadingSpinner label="Carregando..." className="min-h-screen" />

  const article = getArticleByShareToken(token)

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <EmptyState
          icon={Newspaper}
          title="Matéria não encontrada"
          description="Este link pode estar incorreto ou a matéria não existe mais."
          action={
            <Button asChild>
              <Link href="/">Ir para o CarreiraPRO</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-tight">CarreiraPRO</span>
        </Link>
      </header>
      <main className="p-4 md:p-10">
        <ArticleRenderer article={article} />
      </main>
    </div>
  )
}
