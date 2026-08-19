'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown, Check, MessageCircle, Trophy } from 'lucide-react'
import { CHARACTER_META } from '@/lib/ai/character-prompts'
import type { CharacterId } from '@/types'

function ContactsCareerSwitcher({ activeSlug }: { activeSlug: string }) {
  const router = useRouter()
  const { state } = useMockData()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Trophy className="w-4 h-4" />
          Trocar carreira
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Suas carreiras</DropdownMenuLabel>
        {state.careers.map((career) => (
          <DropdownMenuItem key={career.id} onClick={() => router.push(`/contacts/${career.slug}`)}>
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              {career.managerName} · {career.clubName}
            </span>
            {career.slug === activeSlug && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ContactsListPage({ params }: { params: Promise<{ careerSlug: string }> }) {
  const { careerSlug } = use(params)
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { getCharacterMessagesForCareer } = useMockData()

  if (isLoading) return <LoadingSpinner label="Carregando..." />
  if (notFound || !career) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Carreira não encontrada"
        action={
          <Button asChild>
            <Link href="/contacts">Voltar</Link>
          </Button>
        }
      />
    )
  }

  const messages = getCharacterMessagesForCareer(career.id)

  const contacts = (Object.keys(CHARACTER_META) as CharacterId[])
    .map((characterId) => {
      const thread = messages.filter((m) => m.characterId === characterId)
      const last = thread[0] // getCharacterMessagesForCareer já ordena por mais recente primeiro
      const unreadCount = thread.filter((m) => !m.read).length
      return last ? { characterId, last, unreadCount } : null
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => new Date(b.last.createdAt).getTime() - new Date(a.last.createdAt).getTime())

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-lg leading-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground truncate">
            {career.managerName} · {career.clubName}
          </p>
        </div>
        <ContactsCareerSwitcher activeSlug={career.slug} />
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma conversa ainda"
          description="Diretor esportivo, presidente, análise técnica, departamento médico e capitão aparecem aqui quando a situação pedir, conforme sua carreira evolui."
        />
      ) : (
        <div className="space-y-1.5">
          {contacts.map(({ characterId, last, unreadCount }) => {
            const meta = CHARACTER_META[characterId]
            const preview = last.characterResponse ?? last.userReply ?? last.body
            return (
              <Link
                key={characterId}
                href={`/contacts/${career.slug}/${characterId}`}
                className="flex items-center gap-3 rounded-2xl border bg-card px-3 py-3 transition-colors hover:ring-1 hover:ring-foreground/20"
              >
                <img src={meta.avatarUrl} alt={meta.label} className="w-12 h-12 rounded-full object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{meta.label}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(last.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{preview}</p>
                </div>
                {unreadCount > 0 && <Badge className="shrink-0">{unreadCount}</Badge>}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
