'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function ArticleShareButton({ shareToken }: { shareToken: string }) {
  const handleShare = async () => {
    const url = `${window.location.origin}/share/${shareToken}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link público copiado para a área de transferência')
    } catch {
      toast.message('Link público', { description: url })
    }
  }

  return (
    <Button variant="outline" onClick={handleShare}>
      <Share2 className="w-4 h-4 mr-2" /> Compartilhar
    </Button>
  )
}
