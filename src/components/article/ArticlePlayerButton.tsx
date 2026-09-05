'use client'

import { useEffect, useRef, useState } from 'react'
import type { Article } from '@/types'
import { Volume2, Pause, Loader2 } from 'lucide-react'
import { useMockData } from '@/lib/mock/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Botão "Ouvir matéria" — narra a matéria em áudio (TTS via OpenAI). Gera sob demanda no
// primeiro clique e cacheia (article.audioUrl), então cliques seguintes só tocam de novo.
// Estilo próprio (não o Button padrão) pra se destacar como um player, não como mais uma
// ação secundária do bloco.
export function ArticlePlayerButton({ article }: { article: Article }) {
  const { generateSpeechForArticle } = useMockData()
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const handleClick = async () => {
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }

    if (audioRef.current) {
      audioRef.current.play()
      setPlaying(true)
      return
    }

    let url = article.audioUrl
    if (!url) {
      setLoading(true)
      const result = await generateSpeechForArticle(article.id)
      setLoading(false)
      if (!result.ok || !result.audioUrl) {
        toast.error('Não foi possível gerar o áudio agora. Tente de novo em instantes.')
        return
      }
      url = result.audioUrl
    }

    const audio = new Audio(url)
    audio.addEventListener('ended', () => setPlaying(false))
    audioRef.current = audio
    void audio.play()
    setPlaying(true)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-full pl-2 pr-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all',
        'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        playing && 'shadow-violet-500/30 shadow-md'
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full bg-white/20',
          playing && 'animate-pulse'
        )}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : playing ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </span>
      {loading ? 'Gerando áudio...' : playing ? 'Tocando...' : 'Ouvir matéria'}
    </button>
  )
}
