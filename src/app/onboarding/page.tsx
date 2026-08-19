'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Newspaper, Loader2, Send, ArrowRight, ArrowLeft, Search, BookOpen, Camera, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useMockData, type NewCareerInput } from '@/lib/mock/store'
import { lookupClub } from '@/lib/mock/club-database'
import { lookupManagerContext, genericManagerContext } from '@/lib/mock/manager-database'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { GoalKickLoader } from '@/components/shared/GoalKickLoader'
import type { Article, CareerManagerType } from '@/types'

function computeCurrentSeason(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`
}

type Step =
  | 'intro'
  | 'manager_type'
  | 'manager_name'
  | 'manager_absorb'
  | 'manager_photo'
  | 'club_name'
  | 'club_fallback'
  | 'manager_origin'
  | 'objective'
  | 'generating'
  | 'result'

type Turn = { question: string; answer: string }

const INTRO_MESSAGES = ['Preparando sua redação...', 'Toda grande cobertura começa com uma boa história.', 'Vamos entender quem você é nessa carreira.']

function Bubble({ from, children }: { from: 'bot' | 'user'; children: React.ReactNode }) {
  return (
    <div className={`flex ${from === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
          from === 'user'
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
            : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { state, isHydrated, createCareerAndFirstArticle, canCreateNewCareer, getMostRecentCareer } = useMockData()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<Step>('intro')
  const [introMessageIndex, setIntroMessageIndex] = useState(0)
  const [history, setHistory] = useState<Turn[]>([])
  const [textValue, setTextValue] = useState('')
  const [leagueValue, setLeagueValue] = useState('')
  const [countryValue, setCountryValue] = useState('')
  const [clubChecking, setClubChecking] = useState(false)
  const [clubFoundNote, setClubFoundNote] = useState<string | null>(null)
  const [managerAbsorbNote, setManagerAbsorbNote] = useState<string | null>(null)

  const [managerType, setManagerType] = useState<CareerManagerType | null>(null)
  const [managerName, setManagerName] = useState('')
  const [managerBio, setManagerBio] = useState<string | null>(null)
  const [managerPhotoUrl, setManagerPhotoUrl] = useState<string | null>(null)
  const [managerPhotoPreview, setManagerPhotoPreview] = useState<string | null>(null)
  const [managerPhotoUploading, setManagerPhotoUploading] = useState(false)
  const [clubName, setClubName] = useState('')
  const [clubLeague, setClubLeague] = useState('')
  const [clubCountry, setClubCountry] = useState('')
  const [managerOrigin, setManagerOrigin] = useState('')

  const [resultArticle, setResultArticle] = useState<Article | null>(null)
  const [resultSlug, setResultSlug] = useState<string | null>(null)

  useEffect(() => {
    if (isHydrated && !state.isAuthenticated) router.replace('/login')
  }, [isHydrated, state.isAuthenticated, router])

  const eligibilityCheckedRef = useRef(false)
  useEffect(() => {
    // Só verifica uma vez, na hidratação inicial — evita competir com a criação
    // da carreira que acontece mais adiante neste mesmo fluxo.
    if (!isHydrated || eligibilityCheckedRef.current) return
    eligibilityCheckedRef.current = true
    if (!canCreateNewCareer()) router.replace('/settings?paywall=new_career')
  }, [isHydrated, canCreateNewCareer, router])

  // Intro com microinterações: alterna mensagens antes de começar as perguntas
  useEffect(() => {
    if (step !== 'intro') return
    if (introMessageIndex >= INTRO_MESSAGES.length - 1) {
      const timer = setTimeout(() => setStep('manager_type'), 1100)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setIntroMessageIndex((i) => i + 1), 900)
    return () => clearTimeout(timer)
  }, [step, introMessageIndex])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, step, clubChecking, clubFoundNote, managerAbsorbNote])

  const pushTurn = (question: string, answer: string) => {
    setHistory((h) => [...h, { question, answer }])
  }

  const handleBack = () => {
    const recent = getMostRecentCareer()
    router.push(recent ? `/careers/${recent.slug}` : '/careers')
  }

  const handleManagerType = (type: CareerManagerType) => {
    setManagerType(type)
    pushTurn('Você vai comandar um técnico real ou fictício?', type === 'real' ? 'Técnico real' : 'Técnico fictício')
    setStep('manager_name')
  }

  const handleManagerName = () => {
    if (!textValue.trim()) return
    const name = textValue.trim()
    setManagerName(name)
    pushTurn('Qual o nome do seu técnico?', name)
    setTextValue('')

    if (managerType === 'real') {
      // Busca best-effort a foto do técnico na Wikipédia, em paralelo — usada depois como
      // referência visual (images.edit) para manter a mesma aparência dele nas imagens da carreira.
      fetch(`/api/managers/photo?name=${encodeURIComponent(name)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { photoUrl?: string } | null) => {
          if (data?.photoUrl) setManagerPhotoUrl(data.photoUrl)
        })
        .catch(() => {})

      setStep('manager_absorb')
      setTimeout(() => {
        const found = lookupManagerContext(name)
        const context = found ?? genericManagerContext(name)
        setManagerBio(context)
        setManagerAbsorbNote(`📎 Encontramos: ${name} é ${context}`)
        setTimeout(() => {
          setManagerAbsorbNote(null)
          setStep('club_name')
        }, 1300)
      }, 900)
    } else {
      setStep('manager_photo')
    }
  }

  const handleManagerPhotoFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setManagerPhotoPreview(dataUrl)
      setManagerPhotoUploading(true)
      try {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, category: 'managers' }),
        })
        if (res.ok) {
          const data = (await res.json()) as { url: string }
          setManagerPhotoUrl(data.url)
        }
      } catch {
        // sem storage disponível — segue sem foto de referência, não bloqueia o fluxo
      } finally {
        setManagerPhotoUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleManagerPhotoContinue = () => {
    pushTurn('Quer enviar uma foto de referência para o seu técnico?', managerPhotoUrl ? 'Foto enviada' : 'Sem foto por agora')
    setStep('club_name')
  }

  const handleClubNameSubmit = () => {
    const name = textValue.trim()
    if (!name) return
    setClubName(name)
    setTextValue('')
    setClubChecking(true)
    setClubFoundNote(null)

    setTimeout(() => {
      const found = lookupClub(name)
      setClubChecking(false)
      if (found) {
        setClubLeague(found.league)
        setClubCountry(found.country)
        setClubFoundNote(`📍 Identificamos: ${found.league} · ${found.country}`)
        setTimeout(() => {
          pushTurn('Qual clube você vai comandar?', name)
          setClubFoundNote(null)
          setStep('manager_origin')
        }, 900)
      } else {
        pushTurn('Qual clube você vai comandar?', name)
        setStep('club_fallback')
      }
    }, 700)
  }

  const handleClubFallbackSubmit = () => {
    if (!leagueValue.trim() || !countryValue.trim()) return
    setClubLeague(leagueValue.trim())
    setClubCountry(countryValue.trim())
    pushTurn('Em que liga e país esse clube está?', `${leagueValue.trim()} · ${countryValue.trim()}`)
    setLeagueValue('')
    setCountryValue('')
    setStep('manager_origin')
  }

  const handleManagerOriginSubmit = () => {
    const origin = textValue.trim()
    if (!origin) return
    setManagerOrigin(origin)
    pushTurn(`Como ${managerName} chegou até o ${clubName}? Por que foi contratado?`, origin)
    setTextValue('')
    setStep('objective')
  }

  const handleObjectiveSubmit = async () => {
    const objective = textValue.trim()
    if (!objective) return
    pushTurn('Qual é o objetivo dessa passagem?', objective)
    setTextValue('')
    setStep('generating')

    const input: NewCareerInput = {
      managerType: managerType ?? 'fictional',
      managerName,
      managerBio,
      managerOrigin,
      managerPhotoUrl,
      clubName,
      clubLeague,
      clubCountry,
      seasonStart: computeCurrentSeason(),
      initialObjective: objective,
    }

    const { career, article } = await createCareerAndFirstArticle(input)
    setResultArticle(article)
    setResultSlug(career.slug)
    setStep('result')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-2 px-4 py-4 border-b shrink-0">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
          <Newspaper className="w-4 h-4" />
        </div>
        <span className="font-bold tracking-tight">CarreiraPRO</span>
      </header>

      {step === 'intro' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground max-w-xs transition-opacity duration-300">{INTRO_MESSAGES[introMessageIndex]}</p>
          <p className="text-sm text-muted-foreground/70 max-w-xs">
            Para escrever do jeito certo, precisamos conhecer a história que você quer viver.
          </p>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-lg w-full mx-auto">
            <Bubble from="bot">
              Vamos criar sua carreira. Só preciso de algumas respostas rápidas antes de escrever sua primeira matéria. ⚽📰
            </Bubble>

            {history.map((turn, i) => (
              <div key={i} className="space-y-3">
                <Bubble from="bot">{turn.question}</Bubble>
                <Bubble from="user">{turn.answer}</Bubble>
              </div>
            ))}

            {step === 'manager_type' && <Bubble from="bot">Você vai comandar um técnico real ou fictício?</Bubble>}
            {step === 'manager_name' && <Bubble from="bot">Qual o nome do seu técnico?</Bubble>}
            {step === 'manager_absorb' && !managerAbsorbNote && (
              <Bubble from="bot">
                <span className="inline-flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 animate-pulse" /> Buscando informações recentes sobre {managerName}...
                </span>
              </Bubble>
            )}
            {managerAbsorbNote && <Bubble from="bot">{managerAbsorbNote}</Bubble>}
            {step === 'manager_photo' && (
              <Bubble from="bot">
                Como {managerName} é um técnico fictício, você pode enviar uma foto de referência para ele — vamos usar para manter a
                aparência consistente nas imagens geradas ao longo da carreira. É opcional.
              </Bubble>
            )}
            {step === 'club_name' && <Bubble from="bot">Qual clube você vai comandar?</Bubble>}
            {clubChecking && <Bubble from="bot">🔎 Verificando o clube...</Bubble>}
            {clubFoundNote && <Bubble from="bot">{clubFoundNote}</Bubble>}
            {step === 'club_fallback' && <Bubble from="bot">Não encontrei esse clube na nossa base agora. Em que liga e país ele está?</Bubble>}
            {step === 'manager_origin' && (
              <Bubble from="bot">Como {managerName} chegou até o {clubName}? Por que foi contratado?</Bubble>
            )}
            {step === 'objective' && <Bubble from="bot">Qual é o objetivo dessa passagem no {clubName}?</Bubble>}
            {step === 'generating' && (
              <div className="py-4">
                <GoalKickLoader label="Escrevendo sua primeira matéria..." />
              </div>
            )}

            {step === 'result' && resultArticle && (
              <div className="pt-2 space-y-4">
                <Bubble from="bot">Pronto! Aqui está a primeira matéria da sua carreira:</Bubble>
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <ArticleRenderer article={resultArticle} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-card px-4 py-3 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="max-w-lg mx-auto">
              {step === 'manager_type' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button size="lg" variant="outline" className="h-auto py-3" onClick={() => handleManagerType('real')}>
                    Técnico real
                  </Button>
                  <Button size="lg" className="h-auto py-3" onClick={() => handleManagerType('fictional')}>
                    Técnico fictício
                  </Button>
                </div>
              )}

              {step === 'manager_name' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleManagerName()
                  }}
                  className="flex gap-2"
                >
                  <Input autoFocus placeholder="Ex: Marcelo Andrade" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
                  <Button type="submit" size="icon" disabled={!textValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {step === 'manager_photo' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {managerPhotoPreview ? (
                        <img src={managerPhotoPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleManagerPhotoFile(file)
                        }}
                      />
                      <span className="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                        <Camera className="w-4 h-4" />
                        {managerPhotoUploading ? 'Enviando...' : managerPhotoUrl ? 'Trocar foto' : 'Escolher foto'}
                      </span>
                    </label>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleManagerPhotoContinue} disabled={managerPhotoUploading}>
                    {managerPhotoUrl ? 'Continuar' : 'Pular por agora'} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {step === 'club_name' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleClubNameSubmit()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    autoFocus
                    placeholder="Ex: Leeds United"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    disabled={clubChecking}
                  />
                  <Button type="submit" size="icon" disabled={!textValue.trim() || clubChecking}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {step === 'club_fallback' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleClubFallbackSubmit()
                  }}
                  className="flex gap-2"
                >
                  <Input autoFocus placeholder="Liga" value={leagueValue} onChange={(e) => setLeagueValue(e.target.value)} />
                  <Input placeholder="País" value={countryValue} onChange={(e) => setCountryValue(e.target.value)} />
                  <Button type="submit" size="icon" disabled={!leagueValue.trim() || !countryValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {step === 'manager_origin' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleManagerOriginSubmit()
                  }}
                  className="flex gap-2 items-end"
                >
                  <Textarea
                    autoFocus
                    placeholder="Ex: foi promovido do time sub-23 após a saída do técnico anterior"
                    rows={2}
                    className="resize-none"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                  />
                  <Button type="submit" size="icon" disabled={!textValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {step === 'objective' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleObjectiveSubmit()
                  }}
                  className="flex gap-2 items-end"
                >
                  <Textarea
                    autoFocus
                    placeholder="Ex: sobreviver na primeira temporada e consolidar a base do time"
                    rows={2}
                    className="resize-none"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                  />
                  <Button type="submit" size="icon" disabled={!textValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {step === 'generating' && (
                <Button disabled className="w-full" size="lg">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...
                </Button>
              )}

              {step === 'result' && resultSlug && (
                <Button className="w-full" size="lg" onClick={() => router.push(`/careers/${resultSlug}`)}>
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
