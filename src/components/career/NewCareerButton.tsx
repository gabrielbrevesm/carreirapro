'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Criar carreira é sempre livre (a cobrança é por volume de matérias geradas, não por
// quantidade de carreiras) — ver FREE_LIMITS.articlesGenerated em src/lib/freemium.ts.
export function NewCareerButton({ label = 'Nova carreira', className }: { label?: string; className?: string }) {
  const router = useRouter()

  return (
    <Button onClick={() => router.push('/onboarding')} className={cn(className)}>
      <Plus className="w-4 h-4 mr-2" /> {label}
    </Button>
  )
}
