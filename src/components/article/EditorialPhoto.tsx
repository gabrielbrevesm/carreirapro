'use client'

import { useEffect, useState } from 'react'
import type { Article } from '@/types'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ImageIcon, ZoomIn, ImageOff } from 'lucide-react'
import { GoalKickLoader } from '@/components/shared/GoalKickLoader'

// Mensagens refletem os 3 estágios reais do pipeline (Brief Editorial → Diretor de Arte →
// Geração da imagem) — não mudam o tempo real (~20-40s, 3 chamadas de IA em sequência), só a
// percepção de progresso enquanto o usuário espera.
const STAGE_MESSAGES = [
  'Redação está definindo o enquadramento da capa...',
  'Diretor de arte compondo a cena...',
  'Revelando a fotografia editorial...',
]

function useStageMessage(active: boolean): string {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active) {
      setIndex(0)
      return
    }
    const timer = setInterval(() => {
      setIndex((i) => Math.min(i + 1, STAGE_MESSAGES.length - 1))
    }, 8000)
    return () => clearInterval(timer)
  }, [active])

  return STAGE_MESSAGES[index]
}

export function EditorialPhoto({ article }: { article: Article }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const stageMessage = useStageMessage(article.imageStatus === 'generating')

  if (article.imageStatus === 'ready' && article.imageUrl) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block w-full aspect-[2/3] overflow-hidden rounded-sm border-4 border-background ring-1 ring-border shadow-md text-left"
        >
          <img src={article.imageUrl} alt={article.headline} className="w-full h-full object-cover" />

          {/* A imagem gerada é sempre uma fotografia pura (sem texto) — a manchete real do
              artigo é sobreposta aqui em HTML, garantindo que o texto exibido seja exato. */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-10 pb-3 px-3.5">
            <p className="text-white font-bold leading-tight text-base drop-shadow-sm">{article.headline}</p>
            {article.subheadline && <p className="text-white/85 text-xs leading-snug mt-1">{article.subheadline}</p>}
          </div>

          <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4 text-white" />
          </span>
        </button>

        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-3xl w-full p-2 bg-transparent border-none ring-0 shadow-none sm:max-w-3xl" showCloseButton>
            <DialogTitle className="sr-only">{article.headline}</DialogTitle>
            <img src={article.imageUrl} alt={article.headline} className="w-full h-auto rounded-lg" />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (article.imageStatus === 'generating') {
    return (
      <div className="w-full aspect-[2/3] rounded-sm border-4 border-background ring-1 ring-border shadow-md bg-muted/50 flex items-center justify-center p-6">
        <GoalKickLoader label={stageMessage} />
      </div>
    )
  }

  if (article.imageStatus === 'failed') {
    return (
      <div className="w-full aspect-[2/3] rounded-sm border-4 border-background ring-1 ring-border shadow-md bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
        <ImageOff className="w-6 h-6" />
        Não foi possível gerar a imagem
      </div>
    )
  }

  return (
    <div className="w-full aspect-[2/3] rounded-sm border-4 border-background ring-1 ring-border shadow-md bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
      <ImageIcon className="w-6 h-6" />
      Sem imagem
    </div>
  )
}
