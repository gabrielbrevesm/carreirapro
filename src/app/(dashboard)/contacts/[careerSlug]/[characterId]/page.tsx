'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { CHARACTER_META } from '@/lib/ai/character-prompts'
import type { CharacterId } from '@/types'

const VALID_CHARACTER_IDS: CharacterId[] = ['diretor_esportivo', 'presidente', 'auxiliar_tecnico', 'departamento_medico', 'capitao']

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function ChatBubble({ from, children, time }: { from: 'character' | 'user'; children: React.ReactNode; time: string }) {
  return (
    <div className={`flex ${from === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-3.5 py-2 text-sm leading-relaxed space-y-1 ${
          from === 'user'
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
            : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">{children}</p>
        <p className={`text-[10px] ${from === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{time}</p>
      </div>
    </div>
  )
}

export default function CharacterChatPage({ params }: { params: Promise<{ careerSlug: string; characterId: string }> }) {
  const { careerSlug, characterId } = use(params)
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { getCharacterThread, markCharacterMessageRead, replyToCharacterMessage } = useMockData()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isValidCharacter = VALID_CHARACTER_IDS.includes(characterId as CharacterId)
  const thread = career && isValidCharacter ? getCharacterThread(career.id, characterId as CharacterId) : []

  useEffect(() => {
    thread.forEach((m) => {
      if (!m.read) markCharacterMessageRead(m.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, thread.at(-1)?.characterResponse])

  if (isLoading) return <LoadingSpinner label="Carregando..." />
  if (notFound || !career || !isValidCharacter || thread.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Conversa não encontrada"
        action={
          <Button asChild>
            <Link href={career ? `/contacts/${career.slug}` : '/contacts'}>Voltar</Link>
          </Button>
        }
      />
    )
  }

  const meta = CHARACTER_META[characterId as CharacterId]
  const lastMessage = thread.at(-1)!
  const canReply = lastMessage.userReply === null
  const awaitingResponse = lastMessage.userReply !== null && lastMessage.characterResponse === null

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || sending || !canReply) return
    setSending(true)
    setDraft('')
    await replyToCharacterMessage(lastMessage.id, text)
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] max-w-2xl mx-auto -mt-4 md:-mt-8">
      <div className="flex items-center gap-3 border-b pb-3 mb-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/contacts/${career.slug}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <img src={meta.avatarUrl} alt={meta.label} className="w-9 h-9 rounded-full object-cover shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{meta.label}</p>
          <p className="text-xs text-muted-foreground truncate">{career.clubName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {thread.map((message) => (
          <div key={message.id} className="space-y-3">
            <ChatBubble from="character" time={formatTime(message.createdAt)}>
              {message.body}
            </ChatBubble>
            {message.userReply && message.userReplyAt && (
              <ChatBubble from="user" time={formatTime(message.userReplyAt)}>
                {message.userReply}
              </ChatBubble>
            )}
            {message.characterResponse && message.characterResponseAt && (
              <ChatBubble from="character" time={formatTime(message.characterResponseAt)}>
                {message.characterResponse}
              </ChatBubble>
            )}
          </div>
        ))}

        {awaitingResponse && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-muted-foreground">digitando...</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t pt-3 mt-3 shrink-0">
        {canReply ? (
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="Responder..."
              rows={1}
              className="resize-none min-h-0 py-2"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={sending}
            />
            <Button size="icon" className="shrink-0" onClick={handleSend} disabled={!draft.trim() || sending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            {awaitingResponse
              ? `${meta.shortLabel} está respondendo...`
              : `Aguardando novidades da carreira para continuar essa conversa com ${meta.shortLabel}.`}
          </p>
        )}
      </div>
    </div>
  )
}
