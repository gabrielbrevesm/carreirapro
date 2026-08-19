'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useMockData } from '@/lib/mock/store'
import { CHARACTER_META } from '@/lib/ai/character-prompts'

// Observa novas falas de personagens paralelos (Diretor Esportivo, Presidente, etc.) geradas em
// segundo plano após uma matéria, e notifica o usuário com um toast que leva à tela dedicada.
export function CharacterNotificationWatcher() {
  const router = useRouter()
  const { state, clearLatestCharacterNotification } = useMockData()
  const message = state.latestCharacterNotification

  useEffect(() => {
    if (!message) return

    const career = state.careers.find((c) => c.id === message.careerId)
    if (!career) {
      clearLatestCharacterNotification()
      return
    }

    const meta = CHARACTER_META[message.characterId]
    toast(`${meta.icon} ${meta.label}`, {
      description: message.headline,
      action: {
        label: 'Ver',
        onClick: () => router.push(`/contacts/${career.slug}/${message.characterId}`),
      },
      duration: 8000,
    })

    clearLatestCharacterNotification()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  return null
}
