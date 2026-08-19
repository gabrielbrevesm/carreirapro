'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

export default function ContactsIndexPage() {
  const router = useRouter()
  const { isHydrated, getMostRecentCareer } = useMockData()
  const career = isHydrated ? getMostRecentCareer() : undefined

  useEffect(() => {
    if (career) router.replace(`/contacts/${career.slug}`)
  }, [career, router])

  if (!isHydrated || career) return <LoadingSpinner label="Carregando..." />

  return (
    <EmptyState
      icon={MessageCircle}
      title="Nenhuma carreira ainda"
      description="Crie uma carreira para começar a interagir com os personagens do seu clube."
      action={
        <Button asChild>
          <Link href="/onboarding">Criar carreira</Link>
        </Button>
      }
    />
  )
}
