'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronsUpDown, LogOut, Settings, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/shared/nav-items'
import { CareerSwitcher } from '@/components/shared/CareerSwitcher'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useMockData } from '@/lib/mock/store'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, logout } = useMockData()

  const initials = state.profile?.fullName
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const hasUnreadContacts = state.characterMessages.some((m) => !m.read)

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <CareerSwitcher onNavigate={onNavigate} />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-foreground/5 text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              )}
            >
              <span className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {item.href === '/contacts' && hasUnreadContacts && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-foreground/5"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{initials ?? <User className="w-3.5 h-3.5" />}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{state.profile?.fullName}</p>
                <p className="truncate text-xs text-muted-foreground leading-tight">{state.profile?.email}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between gap-2">
                <span>Plano atual</span>
                {state.plan === 'pro' ? (
                  <Badge className="gap-1">
                    <Sparkles className="w-3 h-3" /> Pro
                  </Badge>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">Gratuito</span>
                )}
              </div>
            </DropdownMenuLabel>
            {state.plan !== 'pro' && (
              <DropdownMenuItem
                onClick={() => {
                  router.push('/settings')
                  onNavigate?.()
                }}
              >
                <Sparkles className="h-4 w-4" />
                Assinar Pro
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push('/settings')
                onNavigate?.()
              }}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await logout()
                router.push('/login')
                onNavigate?.()
              }}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
