'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Os comentaristas citados em "Debate na Imprensa" são sempre figuras públicas reais (Jamie
// Carragher, Alan Shearer, Fabrizio Romano, Vampeta...), então buscamos a foto real deles na
// Wikipédia — mesmo padrão de fallback do resto do app: iniciais coloridas quando não encontra.
const PALETTE = [
  'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  'bg-orange-500/15 text-orange-700 dark:text-orange-400',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export function PunditAvatar({ name, className }: { name: string; className?: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPhotoUrl(null)

    fetch(`/api/pundits/photo?name=${encodeURIComponent(name)}`)
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
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        colorForName(name),
        className
      )}
    >
      {initialsForName(name)}
    </div>
  )
}
