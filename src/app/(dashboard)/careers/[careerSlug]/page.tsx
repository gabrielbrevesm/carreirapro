'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArticleFeedCard } from '@/components/article/ArticleFeedCard'
import { RecapSummary } from '@/components/career/RecapSummary'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trophy, History, Users, Send, Paperclip, Mic, Square, X, Loader2, User } from 'lucide-react'
import { buildRecapSummary } from '@/lib/mock/recap'
import { GoalKickLoader } from '@/components/shared/GoalKickLoader'
import { tryTranscribeAudio } from '@/lib/ai/client-api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function CareerHubPage({ params }: { params: Promise<{ careerSlug: string }> }) {
  const { careerSlug } = use(params)
  const router = useRouter()
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { getArticlesForCareer, generateArticleForCareer } = useMockData()
  const [rawInput, setRawInput] = useState('')
  const [sending, setSending] = useState(false)
  const latestArticleRef = useRef<HTMLDivElement>(null)
  const feedBottomRef = useRef<HTMLDivElement>(null)

  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const articles = career ? getArticlesForCareer(career.id).slice().reverse() : []
  const recapLines = buildRecapSummary(articles)

  useEffect(() => {
    // Rola até o TOPO da matéria mais recente — nunca até o fim da página, senão o
    // usuário só vê o resumo/composer e perde a matéria que acabou de ser gerada.
    latestArticleRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [articles.length])

  useEffect(() => {
    // Assim que o envio começa, rola até o indicador de "Escrevendo a matéria..." — sem isso,
    // se o usuário estava com o scroll lá em cima (ex: olhando a imagem de uma matéria antiga),
    // ele não via nenhuma confirmação de que o envio funcionou.
    if (sending) {
      feedBottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }, [sending])

  // Solta o microfone se o usuário sair da página no meio de uma gravação.
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  if (isLoading) return <LoadingSpinner label="Carregando carreira..." />
  if (notFound || !career) {
    return (
      <EmptyState
        icon={Trophy}
        title="Carreira não encontrada"
        description="Ela pode ter sido removida ou o link está incorreto."
        action={
          <Button asChild>
            <Link href="/careers">Voltar para carreiras</Link>
          </Button>
        }
      />
    )
  }

  const clearAttachment = () => {
    setAttachmentUrl(null)
    setAttachmentPreview(null)
  }

  const handleImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setAttachmentPreview(dataUrl)
      setUploadingImage(true)
      try {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, category: 'images' }),
        })
        if (!res.ok) throw new Error('upload failed')
        const data = (await res.json()) as { url: string }
        setAttachmentUrl(data.url)
      } catch {
        toast.error('Não foi possível enviar a imagem. Tente de novo.')
        setAttachmentPreview(null)
      } finally {
        setUploadingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setTranscribing(true)
        const text = await tryTranscribeAudio(blob)
        setTranscribing(false)
        if (text) {
          setRawInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
        } else {
          toast.error('Não foi possível transcrever o áudio. Tente de novo.')
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      toast.error('Não foi possível acessar o microfone.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const handleSend = async () => {
    const text = rawInput.trim()
    if ((!text && !attachmentUrl) || sending) return
    setSending(true)

    const result = await generateArticleForCareer(career.id, {
      rawInput: text || 'Fatos do jogo enviados pela imagem anexada — considere apenas o que está nela.',
      attachmentUrl,
    })
    setSending(false)

    if (!result.ok) {
      router.push('/settings?paywall=articles')
      return
    }

    setRawInput('')
    clearAttachment()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-lg leading-tight truncate">{career.managerName}</h1>
            <Badge variant={career.managerType === 'real' ? 'default' : 'secondary'} className="shrink-0">
              {career.managerType === 'real' ? 'Real' : 'Fictício'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {career.clubName} · {career.clubLeague}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/careers/${career.slug}/timeline`} title="Timeline">
              <History className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/careers/${career.slug}/squad`} title="Análise de elenco">
              <Users className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Link
        href={`/careers/${career.slug}/staff`}
        className="inline-flex w-fit items-center gap-2 self-start rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-1.5 pr-4 pl-2 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-500 hover:to-fuchsia-500"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <User className="w-3.5 h-3.5" />
        </span>
        Editar perfil do técnico
      </Link>

      <div className="flex flex-col gap-3">
        {articles.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Sua carreira está começando"
            description="Digite abaixo o próximo acontecimento e acompanhe a cobertura ganhar vida."
          />
        ) : (
          articles.map((article, i) => {
            const isLatest = i === articles.length - 1
            return (
              <div key={article.id} ref={isLatest ? latestArticleRef : undefined}>
                <ArticleFeedCard article={article} defaultExpanded={isLatest} />
              </div>
            )
          })
        )}

        {!sending && articles.length > 0 && <RecapSummary lines={recapLines} />}

        {sending && (
          <div className="rounded-3xl border bg-muted/50 px-4 py-3">
            <GoalKickLoader label="Escrevendo a matéria..." className="scale-90 -my-2" />
          </div>
        )}

        <div ref={feedBottomRef} />
      </div>

      <div className="sticky bottom-20 md:bottom-4 z-10 space-y-2">
        {attachmentPreview && (
          <div className="flex items-center gap-2.5 rounded-2xl border bg-card px-3 py-2 shadow-lg">
            <img src={attachmentPreview} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            <p className="flex-1 truncate text-xs text-muted-foreground">
              {uploadingImage ? 'Enviando imagem...' : 'Print anexado — a IA vai ler os fatos direto dele'}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={clearAttachment}
              disabled={uploadingImage}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <div className="rounded-3xl border bg-card shadow-lg p-2 flex items-end gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageFile(file)
              e.target.value = ''
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingImage || recording}
            title="Anexar print ou foto do save"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('shrink-0', recording && 'text-red-500')}
            onClick={recording ? stopRecording : startRecording}
            disabled={sending || transcribing}
            title={recording ? 'Parar gravação' : 'Gravar áudio em vez de digitar'}
          >
            {transcribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : recording ? (
              <Square className="w-4 h-4 fill-current animate-pulse" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Textarea
            placeholder={recording ? 'Gravando... toque no quadrado pra parar' : 'O que aconteceu? Ex: vencemos o rival por 2x1 fora de casa...'}
            rows={1}
            className="resize-none min-h-0 border-0 shadow-none focus-visible:ring-0 py-2"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={sending || recording}
          />
          <Button
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={(!rawInput.trim() && !attachmentUrl) || sending || uploadingImage || recording}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
