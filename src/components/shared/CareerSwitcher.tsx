'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronsUpDown, Trophy, ListTree, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useMockData } from '@/lib/mock/store'
import { cn } from '@/lib/utils'

export function CareerSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, getCareerBySlug } = useMockData()
  const isPro = state.plan === 'pro'

  const activeSlug = pathname.match(/^\/careers\/([^/]+)/)?.[1]
  const activeCareer = activeSlug ? getCareerBySlug(activeSlug) : undefined

  const goTo = (path: string) => {
    router.push(path)
    onNavigate?.()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-foreground/5"
        >
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              isPro ? 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-amber-950' : 'bg-primary text-primary-foreground'
            )}
          >
            <Trophy className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate text-sm font-semibold leading-tight',
                isPro && 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
              )}
            >
              {activeCareer ? activeCareer.managerName : 'CarreiraPRO'}
            </p>
            <p className="truncate text-xs text-muted-foreground leading-tight">
              {activeCareer ? activeCareer.clubName : 'Selecionar carreira'}
            </p>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Suas carreiras</DropdownMenuLabel>
        {state.careers.length === 0 ? (
          <p className="px-1.5 py-1 text-sm text-muted-foreground">Nenhuma carreira ainda</p>
        ) : (
          state.careers.map((career) => (
            <DropdownMenuItem key={career.id} onClick={() => goTo(`/careers/${career.slug}`)}>
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">
                {career.managerName} · {career.clubName}
              </span>
              {career.slug === activeSlug && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => goTo('/careers')}>
          <ListTree className="h-4 w-4" />
          Minhas carreiras
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
