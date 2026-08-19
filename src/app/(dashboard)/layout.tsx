'use client'

import { SidebarNav } from '@/components/shared/Sidebar'
import { Topbar } from '@/components/shared/Topbar'
import { BottomNav } from '@/components/shared/BottomNav'
import { useRequireAuth } from '@/lib/mock/use-require-auth'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { CharacterNotificationWatcher } from '@/components/shared/CharacterNotificationWatcher'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useRequireAuth()

  if (!isReady) {
    return <LoadingSpinner label="Carregando..." className="min-h-screen" />
  }

  return (
    <div className="flex min-h-screen">
      <CharacterNotificationWatcher />
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar text-sidebar-foreground shrink-0 sticky top-0 h-screen self-start">
        <SidebarNav />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
