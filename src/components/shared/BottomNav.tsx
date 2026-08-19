'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/shared/nav-items'
import { useMockData } from '@/lib/mock/store'

export function BottomNav() {
  const pathname = usePathname()
  const { state } = useMockData()
  const hasUnreadContacts = state.characterMessages.some((m) => !m.read)

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t rounded-t-3xl px-2 pt-2 flex items-center justify-around"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[11px] font-medium transition-colors min-w-[64px]',
              isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            )}
          >
            <span className="relative">
              <Icon className="w-5 h-5" />
              {item.href === '/contacts' && hasUnreadContacts && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
