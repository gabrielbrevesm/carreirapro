'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useMockData } from '@/lib/mock/store'
import { cn } from '@/lib/utils'

export function NewCareerButton({ label = 'Nova carreira', className }: { label?: string; className?: string }) {
  const router = useRouter()
  const { canCreateNewCareer } = useMockData()

  const handleClick = () => {
    if (canCreateNewCareer()) {
      router.push('/onboarding')
    } else {
      router.push('/settings?paywall=new_career')
    }
  }

  return (
    <Button onClick={handleClick} className={cn(className)}>
      <Plus className="w-4 h-4 mr-2" /> {label}
    </Button>
  )
}
