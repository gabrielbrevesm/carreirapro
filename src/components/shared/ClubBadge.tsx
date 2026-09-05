'use client'

import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mostra o escudo real do clube (via busca best-effort na Wikipédia) quando encontrado;
// cai silenciosamente para um ícone genérico em qualquer falha — mesmo padrão do PlayerAvatar.
export function ClubBadge({ name, className }: { name: string; className?: string }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLogoUrl(null)

    fetch(`/api/clubs/logo?name=${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { logoUrl?: string } | null) => {
        if (!cancelled && data?.logoUrl) setLogoUrl(data.logoUrl)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [name])

  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={cn('object-contain shrink-0', className)} />
  }

  return (
    <div className={cn('rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0', className)}>
      <Shield className="h-[55%] w-[55%]" />
    </div>
  )
}
