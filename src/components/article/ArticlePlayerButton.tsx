'use client'

import { useEffect, useRef, useState } from 'react'
import type { Article } from '@/types'
import { Button } from '@/components/ui/button'
import { Volume2, Pause, Loader2 } from 'lucide-react'
import { useMockData } from '@/lib/mock/store'
import { toast } from 'sonner'

// Botão "Ouvir matéria" — narra a matéria em áudio (TTS via OpenAI). Gera sob demanda no
// primeiro clique e cacheia (article.audioUrl), então cliques seguintes só tocam de novo.
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
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : playing ? (
        <Pause className="w-4 h-4 mr-2" />
      ) : (
        <Volume2 className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Gerando áudio...' : playing ? 'Pausar' : 'Ouvir matéria'}
    </Button>
  )
}
