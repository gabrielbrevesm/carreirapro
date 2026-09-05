'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { rowToArticle } from '@/lib/supabase/queries'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { Button } from '@/components/ui/button'
import { Newspaper } from 'lucide-react'
import type { Article } from '@/types'

export default function SharedArticlePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  // Link público — precisa funcionar pra QUALQUER visitante, não só pro dono logado. Por isso
  // busca direto via RPC (get_article_by_share_token, SECURITY DEFINER liberado pra anon/
  // authenticated) em vez do estado local do usuário, que só existe pra quem tá logado como
  // dono da matéria.
  const [article, setArticle] = useState<Article | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase
      .rpc('get_article_by_share_token', { token })
      .then(({ data }) => {
        if (!active) return
        const row = Array.isArray(data) ? data[0] : null
        setArticle(row ? rowToArticle(row) : null)
      })
    return () => {
      active = false
    }
  }, [token])

  if (article === undefined) return <LoadingSpinner label="Carregando..." className="min-h-screen" />

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
