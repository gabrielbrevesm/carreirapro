'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Mostra a foto real do jogador (via busca best-effort no Transfermarkt) quando encontrada;
// cai silenciosamente para o avatar de iniciais em qualquer falha, igual ao padrão de
// fallback do resto do app (nunca trava a UI esperando o scraping).
export function PlayerAvatar({ name, className }: { name: string; className?: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPhotoUrl(null)

    fetch(`/api/players/photo?name=${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { photoUrl?: string } | null) => {
        if (!cancelled && data?.photoUrl) setPhotoUrl(data.photoUrl)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [name])

  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={cn('rounded-full object-cover shrink-0', className)} />
  }

  return (
    <div className={cn('rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0', className)}>
      {name[0]}
    </div>
  )
}
