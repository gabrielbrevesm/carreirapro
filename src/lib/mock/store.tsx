'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  Article,
  Career,
  CareerEvent,
  CareerManagerType,
  CareerMemory,
  CharacterId,
  CharacterMessage,
  ClubTier,
  InitialObjective,
  Profile,
  SquadAnalysis,
  UsageTracking,
  UserPlan,
} from '@/types'
import { randomId, slugify } from '@/lib/utils'
import { generateMockArticle, generateHiringAnnouncementArticle, extractMockMemoryUpdates, newShareToken } from '@/lib/mock/article-generator'
import { generateMockArticleImage } from '@/lib/mock/image-generator'
import { analyzeMockSquad } from '@/lib/mock/squad-analyzer'
import { classifyEventType, extractCompetition } from '@/lib/mock/event-classifier'
import { isAllowed, remainingFor, type UsageField } from '@/lib/freemium'
import {
  tryGenerateArticleWithAI,
  tryGenerateImageWithAI,
  tryGenerateSpeechWithAI,
  tryGenerateCharacterMessageWithAI,
  tryGenerateCharacterReplyWithAI,
} from '@/lib/ai/client-api'
import { detectCharacterTriggers } from '@/lib/characters/triggers'
import { generateMockCharacterMessage, generateMockCharacterReply } from '@/lib/mock/character-mock'
import { createClient } from '@/lib/supabase/client'
import { QuotaExceededError } from '@/lib/ai/client-api'
import {
  fetchAllUserData,
  careerToRow,
  memoryToRow,
  eventToRow,
  articleToRow,
  characterMessageToRow,
  squadAnalysisToRow,
} from '@/lib/supabase/queries'

const ALL_CHARACTER_IDS: CharacterId[] = ['diretor_esportivo', 'presidente', 'auxiliar_tecnico', 'departamento_medico', 'capitao']

type State = {
  isAuthenticated: boolean
  profile: Profile | null
  plan: UserPlan
  usage: UsageTracking
  careers: Career[]
  careerMemories: Record<string, CareerMemory>
  events: CareerEvent[]
  articles: Article[]
  squadAnalyses: SquadAnalysis[]
  characterMessages: CharacterMessage[]
  // Última fala de personagem gerada, ainda não exibida como notificação — a UI observa
  // este campo, mostra o toast e limpa (clearLatestCharacterNotification) para liberar o próximo.
  latestCharacterNotification: CharacterMessage | null
}

function emptyMemory(careerId: string): CareerMemory {
  return {
    careerId,
    establishedFacts: [],
    recurringCharacters: [],
    activeNarratives: [],
    rivalries: [],
    playerHighlights: {},
    recentResults: [],
    keySignings: [],
    captainName: null,
    viceCaptainName: null,
    updatedAt: new Date().toISOString(),
  }
}

function defaultState(): State {
  return {
    isAuthenticated: false,
    profile: null,
    plan: 'free',
    usage: { articlesGenerated: 0, imagesGenerated: 0, squadAnalyses: 0 },
    careers: [],
    careerMemories: {},
    events: [],
    articles: [],
    squadAnalyses: [],
    characterMessages: [],
    latestCharacterNotification: null,
  }
}

export type NewCareerInput = {
  managerType: CareerManagerType
  managerName: string
  managerBio?: string | null
  managerOrigin?: string | null
  managerPhotoUrl?: string | null
  clubName: string
  clubLeague: string
  clubCountry: string
  clubTier?: ClubTier | null
  seasonStart: string
  initialObjective?: InitialObjective | null
}

export type GenerateArticleInput = {
  rawInput: string
  attachmentUrl?: string | null
}

type GenerateArticleResult =
  | { ok: true; article: Article; event: CareerEvent; usageRemaining: number | null }
  | { ok: false; paywall: true }

type GenerateImageResult = { ok: true; imageUrl: string } | { ok: false; paywall: true }

type AnalyzeSquadResult = { ok: true; analysis: SquadAnalysis } | { ok: false; paywall: true }

type MockDataContextValue = {
  state: State
  isHydrated: boolean

  sendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>
  signUpWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signInWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>

  createCareerAndFirstArticle: (input: NewCareerInput) => Promise<{ career: Career; article: Article }>
  getCareerBySlug: (slug: string) => Career | undefined
  getMostRecentCareer: () => Career | undefined
  getCareerMemory: (careerId: string) => CareerMemory

  generateArticleForCareer: (careerId: string, input: GenerateArticleInput) => Promise<GenerateArticleResult>
  generateImageForArticle: (articleId: string) => Promise<GenerateImageResult>
  generateSpeechForArticle: (articleId: string) => Promise<{ ok: boolean; audioUrl?: string }>
  getEventsForCareer: (careerId: string) => CareerEvent[]
  getArticlesForCareer: (careerId: string) => Article[]
  getArticleById: (articleId: string) => Article | undefined
  getArticleByShareToken: (token: string) => Article | undefined

  analyzeSquad: (careerId: string, photoUrl: string, financialBudget?: string, userContext?: string) => Promise<AnalyzeSquadResult>
  getSquadAnalysesForCareer: (careerId: string) => SquadAnalysis[]

  setCaptainInfo: (careerId: string, captainName: string | null, viceCaptainName: string | null) => void
  getCharacterMessagesForCareer: (careerId: string) => CharacterMessage[]
  getCharacterThread: (careerId: string, characterId: CharacterId) => CharacterMessage[]
  getCharacterMessageById: (messageId: string) => CharacterMessage | undefined
  markCharacterMessageRead: (messageId: string) => Promise<void>
  replyToCharacterMessage: (messageId: string, userReply: string) => Promise<void>
  clearLatestCharacterNotification: () => void

  usageRemaining: (field: UsageField) => number | null
  isFeatureAllowed: (field: UsageField) => boolean
  refreshProfile: () => Promise<UserPlan>
}

const MockDataContext = createContext<MockDataContextValue | null>(null)

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState)
  const [authChecked, setAuthChecked] = useState(false)
  const [domainLoaded, setDomainLoaded] = useState(false)
  const isHydrated = authChecked && domainLoaded
  const [supabase] = useState(() => createClient())

  // Autenticação real via Supabase Auth (magic link) — e, uma vez logado, carrega tudo que é
  // do usuário (carreiras, matérias, memória...) direto do Postgres (RLS garante que só vêm
  // as próprias linhas dele). onAuthStateChange já dispara uma vez com a sessão atual ao
  // inscrever, então não precisa de uma chamada getSession() separada.
  useEffect(() => {
    let active = true

    const syncFromSession = async (userId: string | null, email: string | null | undefined) => {
      if (!userId) {
        if (!active) return
        setState(() => ({ ...defaultState(), isAuthenticated: false, profile: null }))
        setDomainLoaded(true)
        setAuthChecked(true)
        return
      }

      const [profileRes, domainData] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url, plan, articles_generated, images_generated, squad_analyses_used')
          .eq('id', userId)
          .maybeSingle(),
        fetchAllUserData(supabase),
      ])
      if (!active) return

      setState((s) => ({
        ...s,
        isAuthenticated: true,
        profile: {
          id: userId,
          fullName: profileRes.data?.full_name || email?.split('@')[0] || '',
          email: email ?? '',
          avatarUrl: profileRes.data?.avatar_url ?? null,
        },
        // Plano e uso vêm do banco (a única fonte confiável — ver migration 0002, que impede o
        // client de escrever essas colunas diretamente).
        plan: (profileRes.data?.plan as UserPlan) ?? 'free',
        usage: {
          articlesGenerated: profileRes.data?.articles_generated ?? 0,
          imagesGenerated: profileRes.data?.images_generated ?? 0,
          squadAnalyses: profileRes.data?.squad_analyses_used ?? 0,
        },
        ...domainData,
      }))
      setDomainLoaded(true)
      setAuthChecked(true)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED dispara periodicamente (e também quando a aba volta a ficar visível)
      // sem trocar de usuário — refazer o fetch completo aqui sobrescreve o estado local com uma
      // cópia potencialmente desatualizada do banco, apagando updates otimistas ainda em voo
      // (ex: markCharacterMessageRead). Só refaz o sync em transições reais de sessão.
      if (event === 'TOKEN_REFRESHED') return
      setDomainLoaded(false)
      syncFromSession(session?.user.id ?? null, session?.user.email)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const sendMagicLink = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
    [supabase]
  )

  // Cadastro com e-mail e senha — confirmação de e-mail desativada no projeto (ver Supabase
  // Auth settings), então a sessão já vem ativa na resposta do signUp, sem depender de e-mail.
  const signUpWithPassword = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
    [supabase]
  )

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    // Cada tentativa de OAuth (mesmo abandonada, ex: usuário fecha o popup do Google e tenta de
    // novo) cria um novo cookie "sb-...-code-verifier" sem limpar os anteriores. Acumulados,
    // eles inflam o header Cookie o suficiente pra corromper a troca do código na volta (erro
    // "Cannot convert argument to a ByteString..." no /auth/callback). Limpa antes de cada
    // tentativa nova pra nunca deixar mais de um pendente.
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0]?.trim()
      if (name?.startsWith('sb-') && name.includes('code-verifier')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    })

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }, [supabase])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  // Cria a carreira e já publica uma matéria de boas-vindas — não consome a cota gratuita
  // (é uma demonstração da experiência, não um "acontecimento" real do usuário).
  // Tenta gerar via IA real; se não houver chave configurada ou a chamada falhar, usa o mock local.
  const createCareerAndFirstArticle = useCallback(
    async (input: NewCareerInput): Promise<{ career: Career; article: Article }> => {
      const userId = state.profile?.id
      if (!userId) throw new Error('Usuário não autenticado')

      const baseSlug = slugify(`${input.managerName}-${input.clubName}`)
      let slug = baseSlug
      let suffix = 2
      while (state.careers.some((c) => c.slug === slug)) {
        slug = `${baseSlug}-${suffix}`
        suffix += 1
      }

      const career: Career = {
        id: randomId(),
        slug,
        managerType: input.managerType,
        managerName: input.managerName,
        managerBio: input.managerBio ?? null,
        managerOrigin: input.managerOrigin ?? null,
        managerPhotoUrl: input.managerPhotoUrl ?? null,
        clubName: input.clubName,
        clubLeague: input.clubLeague,
        clubCountry: input.clubCountry,
        clubTier: input.clubTier ?? null,
        seasonStart: input.seasonStart,
        initialObjective: input.initialObjective ?? null,
        currentSeason: input.seasonStart,
        eventsCount: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const memory = emptyMemory(career.id)
      const rawInput = `${career.clubName} anuncia ${career.managerName} como novo treinador para a temporada ${career.seasonStart}.`

      const aiResult = await tryGenerateArticleWithAI({ career, memory, rawInput, isFirstEvent: true })
      const modelUsed = aiResult ? aiResult.modelUsed : 'mock-gpt-4o'

      const event: CareerEvent = {
        id: randomId(),
        careerId: career.id,
        eventType: 'season_start',
        rawInput,
        season: career.seasonStart,
        competition: null,
        matchWeek: null,
        hasImageAttachment: false,
        attachmentUrl: null,
        eventOrder: 1,
        createdAt: new Date().toISOString(),
      }

      let headline: string
      let subheadline: string | null
      let bodyText: string
      let sections: Article['sections']
      let tokensUsed: number
      let generationTimeMs: number

      if (aiResult) {
        headline = aiResult.headline
        subheadline = aiResult.subheadline
        bodyText = aiResult.body
        sections = null
        tokensUsed = aiResult.tokensUsed
        generationTimeMs = aiResult.generationTimeMs
      } else {
        const mockGenerated = generateHiringAnnouncementArticle({ career })
        headline = mockGenerated.headline
        subheadline = mockGenerated.subheadline
        bodyText = [`# ${mockGenerated.headline}`, mockGenerated.subheadline ? `*${mockGenerated.subheadline}*` : '', '', mockGenerated.sections.main]
          .filter(Boolean)
          .join('\n')
        sections = mockGenerated.sections
        tokensUsed = mockGenerated.tokensUsed
        generationTimeMs = mockGenerated.generationTimeMs
      }

      const article: Article = {
        id: randomId(),
        careerId: career.id,
        eventId: event.id,
        headline,
        subheadline,
        body: bodyText,
        sections,
        season: career.seasonStart,
        competition: null,
        eventType: 'season_start',
        modelUsed,
        tokensUsed,
        generationTimeMs,
        // Assim como qualquer outra matéria: fica "pending" e quem exibe a matéria dispara a
        // geração real da imagem (ver useEffect no onboarding) — antes isso ficava travado num
        // placeholder mock que nunca virava imagem de verdade.
        imageUrl: null,
        imagePrompt: null,
        imageStatus: 'pending',
        audioUrl: null,
        shareToken: newShareToken(),
        createdAt: new Date().toISOString(),
      }

      const { error: careerError } = await supabase.from('careers').insert(careerToRow(userId, career))
      if (careerError) throw new Error(`Falha ao criar carreira: ${careerError.message}`)

      const [memoryRes, eventRes] = await Promise.all([
        supabase.from('career_memories').insert(memoryToRow(memory)),
        supabase.from('career_events').insert(eventToRow(event)),
      ])
      if (memoryRes.error) throw new Error(`Falha ao criar memória: ${memoryRes.error.message}`)
      if (eventRes.error) throw new Error(`Falha ao criar evento: ${eventRes.error.message}`)

      const { error: articleError } = await supabase.from('articles').insert(articleToRow(article))
      if (articleError) throw new Error(`Falha ao criar matéria: ${articleError.message}`)

      setState((s) => ({
        ...s,
        careers: [...s.careers, career],
        careerMemories: { ...s.careerMemories, [career.id]: memory },
        events: [...s.events, event],
        articles: [...s.articles, article],
      }))

      return { career, article }
    },
    [state.careers, state.profile, supabase]
  )

  const getCareerBySlug = useCallback((slug: string) => state.careers.find((c) => c.slug === slug), [state.careers])

  const getMostRecentCareer = useCallback((): Career | undefined => {
    if (state.careers.length === 0) return undefined
    return [...state.careers].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  }, [state.careers])

  const getCareerMemory = useCallback(
    (careerId: string) => state.careerMemories[careerId] ?? emptyMemory(careerId),
    [state.careerMemories]
  )

  const generateArticleForCareer = useCallback(
    async (careerId: string, input: GenerateArticleInput): Promise<GenerateArticleResult> => {
      const career = state.careers.find((c) => c.id === careerId)
      if (!career) return { ok: false, paywall: true }

      if (!isAllowed(state.plan, state.usage, 'articlesGenerated')) {
        return { ok: false, paywall: true }
      }

      const memory = state.careerMemories[careerId] ?? emptyMemory(careerId)
      const season = career.currentSeason ?? career.seasonStart

      let aiResult: Awaited<ReturnType<typeof tryGenerateArticleWithAI>>
      try {
        aiResult = await tryGenerateArticleWithAI({ career, memory, rawInput: input.rawInput, isFirstEvent: false })
      } catch (error) {
        // Cota esgotada de verdade (verificada no servidor) — nunca cai pro mock aqui, senão o
        // usuário continuaria gerando conteúdo "grátis" pra sempre.
        if (error instanceof QuotaExceededError) return { ok: false, paywall: true }
        throw error
      }

      const eventType = aiResult?.eventType ?? classifyEventType(input.rawInput)
      const competition = aiResult?.competition ?? extractCompetition(input.rawInput)
      const modelUsed = aiResult ? aiResult.modelUsed : 'mock-gpt-4o'

      let headline: string
      let subheadline: string | null
      let bodyText: string
      let sections: Article['sections']
      let tokensUsed: number
      let generationTimeMs: number
      let memoryUpdates: {
        newFacts: string[]
        resultToAdd: CareerMemory['recentResults'][number] | null
        signingToAdd: CareerMemory['keySignings'][number] | null
      }

      if (aiResult) {
        headline = aiResult.headline
        subheadline = aiResult.subheadline
        bodyText = aiResult.body
        sections = null
        tokensUsed = aiResult.tokensUsed
        generationTimeMs = aiResult.generationTimeMs
        memoryUpdates = {
          newFacts: aiResult.memoryUpdates.newFacts,
          resultToAdd: aiResult.memoryUpdates.resultToAdd
            ? { ...aiResult.memoryUpdates.resultToAdd, date: new Date().toISOString().split('T')[0] }
            : null,
          signingToAdd: aiResult.memoryUpdates.signingToAdd ? { ...aiResult.memoryUpdates.signingToAdd, season } : null,
        }
      } else {
        const mockGenerated = generateMockArticle({ career, memory, rawInput: input.rawInput, eventType, season, competition })
        headline = mockGenerated.headline
        subheadline = mockGenerated.subheadline
        bodyText = [`# ${mockGenerated.headline}`, mockGenerated.subheadline ? `*${mockGenerated.subheadline}*` : '', '', mockGenerated.sections.main]
          .filter(Boolean)
          .join('\n')
        sections = mockGenerated.sections
        tokensUsed = mockGenerated.tokensUsed
        generationTimeMs = mockGenerated.generationTimeMs
        memoryUpdates = extractMockMemoryUpdates({
          rawInput: input.rawInput,
          eventType,
          career,
          parsedResult: mockGenerated.parsedResult,
        })
      }

      const event: CareerEvent = {
        id: randomId(),
        careerId,
        eventType,
        rawInput: input.rawInput,
        season,
        competition,
        matchWeek: null,
        hasImageAttachment: !!input.attachmentUrl,
        attachmentUrl: input.attachmentUrl ?? null,
        eventOrder: career.eventsCount + 1,
        createdAt: new Date().toISOString(),
      }

      const article: Article = {
        id: randomId(),
        careerId,
        eventId: event.id,
        headline,
        subheadline,
        body: bodyText,
        sections,
        season,
        competition,
        eventType,
        modelUsed,
        tokensUsed,
        generationTimeMs,
        imageUrl: null,
        imagePrompt: null,
        imageStatus: 'pending',
        audioUrl: null,
        shareToken: newShareToken(),
        createdAt: new Date().toISOString(),
      }

      const updatedMemory: CareerMemory = {
        ...memory,
        establishedFacts: [...memory.establishedFacts, ...memoryUpdates.newFacts].slice(-50),
        recentResults: memoryUpdates.resultToAdd ? [...memory.recentResults, memoryUpdates.resultToAdd].slice(-10) : memory.recentResults,
        keySignings: memoryUpdates.signingToAdd ? [...memory.keySignings, memoryUpdates.signingToAdd].slice(-20) : memory.keySignings,
        updatedAt: new Date().toISOString(),
      }

      const updatedCareerFields = { eventsCount: career.eventsCount + 1, updatedAt: new Date().toISOString() }

      // Persiste no Postgres antes de atualizar o cache local — o evento precisa existir
      // primeiro (a matéria referencia ele por FK).
      const { error: eventError } = await supabase.from('career_events').insert(eventToRow(event))
      if (eventError) console.error('[generateArticleForCareer] falha ao salvar evento', eventError)

      await Promise.all([
        supabase.from('articles').insert(articleToRow(article)),
        supabase.from('career_memories').update(memoryToRow(updatedMemory)).eq('career_id', careerId),
        supabase.from('careers').update({ events_count: updatedCareerFields.eventsCount, updated_at: updatedCareerFields.updatedAt }).eq('id', careerId),
      ])

      const newUsage: UsageTracking = { ...state.usage, articlesGenerated: state.usage.articlesGenerated + 1 }
      const result: GenerateArticleResult = {
        ok: true,
        article,
        event,
        usageRemaining: remainingFor(state.plan, newUsage, 'articlesGenerated'),
      }

      setState((s) => ({
        ...s,
        usage: { ...s.usage, articlesGenerated: s.usage.articlesGenerated + 1 },
        events: [...s.events, event],
        articles: [...s.articles, article],
        careerMemories: { ...s.careerMemories, [careerId]: updatedMemory },
        careers: s.careers.map((c) => (c.id === careerId ? { ...c, ...updatedCareerFields } : c)),
      }))

      // Personagens paralelos: quem se manifesta é decidido pela própria IA principal (que tem
      // contexto completo do acontecimento) quando disponível; sem IA, cai numa heurística local.
      // Roda em segundo plano — não atrasa o retorno da matéria, que é o fluxo principal.
      const heuristicTriggers = detectCharacterTriggers({ rawInput: input.rawInput, eventType, memory: updatedMemory })
      const triggeredIds = ALL_CHARACTER_IDS.filter((id) => aiResult?.characterTriggers?.[id] ?? heuristicTriggers[id])

      triggeredIds.forEach((characterId) => {
        void (async () => {
          const aiMessage = await tryGenerateCharacterMessageWithAI({ characterId, career, memory: updatedMemory, article })
          const generated =
            aiMessage ?? {
              ...generateMockCharacterMessage(characterId, { career, memory: updatedMemory, article }),
              modelUsed: 'mock-gpt-4o',
              tokensUsed: 0,
              generationTimeMs: 0,
            }

          const message: CharacterMessage = {
            id: randomId(),
            careerId,
            articleId: article.id,
            characterId,
            headline: generated.headline,
            body: generated.body,
            modelUsed: generated.modelUsed,
            tokensUsed: generated.tokensUsed,
            generationTimeMs: generated.generationTimeMs,
            read: false,
            createdAt: new Date().toISOString(),
            userReply: null,
            userReplyAt: null,
            characterResponse: null,
            characterResponseAt: null,
          }

          const { error } = await supabase.from('character_messages').insert(characterMessageToRow(message))
          if (error) {
            console.error('[generateArticleForCareer] falha ao salvar fala de personagem', error)
            return
          }

          setState((s) => ({
            ...s,
            characterMessages: [...s.characterMessages, message],
            latestCharacterNotification: message,
          }))
        })()
      })

      return result
    },
    [state.careers, state.plan, state.usage, state.careerMemories, supabase]
  )

  const generateImageForArticle = useCallback(
    async (articleId: string): Promise<GenerateImageResult> => {
      const article = state.articles.find((a) => a.id === articleId)
      if (!article) return { ok: false, paywall: true }

      if (!isAllowed(state.plan, state.usage, 'imagesGenerated')) {
        return { ok: false, paywall: true }
      }

      const career = state.careers.find((c) => c.id === article.careerId)

      // Mostra o estado de "gerando" imediatamente — o pipeline real (matéria → brief → arte → imagem) leva bem mais tempo que o mock.
      setState((s) => ({
        ...s,
        articles: s.articles.map((a) => (a.id === articleId ? { ...a, imageStatus: 'generating' } : a)),
      }))
      void supabase.from('articles').update({ image_status: 'generating' }).eq('id', articleId)

      let aiResult: Awaited<ReturnType<typeof tryGenerateImageWithAI>>
      try {
        aiResult = career ? await tryGenerateImageWithAI({ career, article }) : null
      } catch (error) {
        if (error instanceof QuotaExceededError) {
          setState((s) => ({
            ...s,
            articles: s.articles.map((a) => (a.id === articleId ? { ...a, imageStatus: 'failed' } : a)),
          }))
          void supabase.from('articles').update({ image_status: 'failed' }).eq('id', articleId)
          return { ok: false, paywall: true }
        }
        throw error
      }

      let imageUrl: string
      let imagePrompt: string
      if (aiResult) {
        imageUrl = aiResult.imageUrl
        imagePrompt = aiResult.imagePrompt
      } else {
        const lastResult = state.careerMemories[article.careerId]?.recentResults.at(-1)
        imageUrl = generateMockArticleImage({
          headline: article.headline,
          clubName: career?.clubName ?? '',
          eventType: article.eventType ?? 'custom',
          outcome: lastResult?.outcome ?? null,
          score: lastResult?.score ?? null,
        })
        imagePrompt = `mock-prompt:${article.headline}`
      }

      const result: GenerateImageResult = { ok: true, imageUrl }

      await supabase.from('articles').update({ image_url: imageUrl, image_status: 'ready', image_prompt: imagePrompt }).eq('id', articleId)

      setState((s) => ({
        ...s,
        usage: { ...s.usage, imagesGenerated: s.usage.imagesGenerated + 1 },
        articles: s.articles.map((a) => (a.id === articleId ? { ...a, imageUrl, imageStatus: 'ready', imagePrompt } : a)),
      }))

      return result
    },
    [state.articles, state.careers, state.careerMemories, state.plan, state.usage, supabase]
  )

  const generateSpeechForArticle = useCallback(
    async (articleId: string): Promise<{ ok: boolean; audioUrl?: string }> => {
      const article = state.articles.find((a) => a.id === articleId)
      if (!article) return { ok: false }
      // Já narrada antes — reaproveita em vez de gastar de novo com a OpenAI.
      if (article.audioUrl) return { ok: true, audioUrl: article.audioUrl }

      const result = await tryGenerateSpeechWithAI({ article })
      if (!result) return { ok: false }

      setState((s) => ({
        ...s,
        articles: s.articles.map((a) => (a.id === articleId ? { ...a, audioUrl: result.audioUrl } : a)),
      }))

      return { ok: true, audioUrl: result.audioUrl }
    },
    [state.articles]
  )

  const getEventsForCareer = useCallback(
    (careerId: string) =>
      state.events.filter((e) => e.careerId === careerId).sort((a, b) => a.eventOrder - b.eventOrder),
    [state.events]
  )

  const getArticlesForCareer = useCallback(
    (careerId: string) =>
      state.articles
        .filter((a) => a.careerId === careerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.articles]
  )

  const getArticleById = useCallback((articleId: string) => state.articles.find((a) => a.id === articleId), [state.articles])

  const getArticleByShareToken = useCallback(
    (token: string) => state.articles.find((a) => a.shareToken === token),
    [state.articles]
  )

  const analyzeSquad = useCallback(
    async (careerId: string, photoUrl: string, financialBudget?: string, userContext?: string): Promise<AnalyzeSquadResult> => {
      const career = state.careers.find((c) => c.id === careerId)
      if (!career) return { ok: false, paywall: true }

      if (!isAllowed(state.plan, state.usage, 'squadAnalyses')) {
        return { ok: false, paywall: true }
      }

      const { gaps, suggestions } = analyzeMockSquad({ career, financialBudget, userContext })
      const analysis: SquadAnalysis = {
        id: randomId(),
        careerId,
        photoUrl,
        financialBudget: financialBudget ?? null,
        userContext: userContext ?? null,
        identifiedGaps: gaps,
        suggestions,
        createdAt: new Date().toISOString(),
      }

      const { error } = await supabase.from('squad_analyses').insert(squadAnalysisToRow(analysis))
      if (error) {
        console.error('[analyzeSquad] falha ao salvar análise', error)
        return { ok: false, paywall: true }
      }

      setState((s) => ({
        ...s,
        usage: { ...s.usage, squadAnalyses: s.usage.squadAnalyses + 1 },
        squadAnalyses: [...s.squadAnalyses, analysis],
      }))

      return { ok: true, analysis }
    },
    [state.careers, state.plan, state.usage, supabase]
  )

  const getSquadAnalysesForCareer = useCallback(
    (careerId: string) => state.squadAnalyses.filter((a) => a.careerId === careerId),
    [state.squadAnalyses]
  )

  // Só o usuário define quem é o capitão — sem isso, o personagem "Capitão" nunca aparece.
  const setCaptainInfo = useCallback(
    (careerId: string, captainName: string | null, viceCaptainName: string | null) => {
      const updatedAt = new Date().toISOString()
      setState((s) => {
        const memory = s.careerMemories[careerId] ?? emptyMemory(careerId)
        return {
          ...s,
          careerMemories: {
            ...s.careerMemories,
            [careerId]: { ...memory, captainName, viceCaptainName, updatedAt },
          },
        }
      })
      void supabase.from('career_memories').update({ captain_name: captainName, vice_captain_name: viceCaptainName, updated_at: updatedAt }).eq('career_id', careerId)
    },
    [supabase]
  )

  const getCharacterMessagesForCareer = useCallback(
    (careerId: string) =>
      state.characterMessages
        .filter((m) => m.careerId === careerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.characterMessages]
  )

  const getCharacterThread = useCallback(
    (careerId: string, characterId: CharacterId) =>
      state.characterMessages
        .filter((m) => m.careerId === careerId && m.characterId === characterId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [state.characterMessages]
  )

  const getCharacterMessageById = useCallback(
    (messageId: string) => state.characterMessages.find((m) => m.id === messageId),
    [state.characterMessages]
  )

  const markCharacterMessageRead = useCallback(
    async (messageId: string) => {
      setState((s) => ({
        ...s,
        characterMessages: s.characterMessages.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
      }))
      // Antes era fire-and-forget (void ...) — qualquer erro (sessão expirada, rede) ficava
      // completamente silencioso, e a marcação de "lido" nunca chegava a persistir sem que
      // ninguém percebesse. Agora aguarda e loga falhas.
      const { error } = await supabase.from('character_messages').update({ read: true }).eq('id', messageId)
      if (error) console.error('[markCharacterMessageRead] falha ao persistir leitura', error)
    },
    [supabase]
  )

  // Uma troca só por mensagem espontânea: se já houve resposta do usuário para esta
  // mensagem, ignora (o composer da UI também trava, isto é defesa adicional).
  const replyToCharacterMessage = useCallback(
    async (messageId: string, userReply: string) => {
      const message = state.characterMessages.find((m) => m.id === messageId)
      if (!message || message.userReply !== null) return

      const trimmed = userReply.trim()
      if (!trimmed) return

      const userReplyAt = new Date().toISOString()
      setState((s) => ({
        ...s,
        characterMessages: s.characterMessages.map((m) => (m.id === messageId ? { ...m, userReply: trimmed, userReplyAt } : m)),
      }))
      await supabase.from('character_messages').update({ user_reply: trimmed, user_reply_at: userReplyAt }).eq('id', messageId)

      const career = state.careers.find((c) => c.id === message.careerId)
      const memory = state.careerMemories[message.careerId] ?? emptyMemory(message.careerId)
      const article = state.articles.find((a) => a.id === message.articleId)
      if (!career || !article) return

      const aiResult = await tryGenerateCharacterReplyWithAI({
        characterId: message.characterId,
        career,
        memory,
        article,
        originalMessage: { headline: message.headline, body: message.body },
        userReply: trimmed,
      })

      const responseBody = aiResult?.body ?? generateMockCharacterReply(message.characterId)
      const characterResponseAt = new Date().toISOString()

      await supabase.from('character_messages').update({ character_response: responseBody, character_response_at: characterResponseAt }).eq('id', messageId)

      setState((s) => ({
        ...s,
        characterMessages: s.characterMessages.map((m) =>
          m.id === messageId ? { ...m, characterResponse: responseBody, characterResponseAt } : m
        ),
      }))
    },
    [state.characterMessages, state.careers, state.careerMemories, state.articles, supabase]
  )

  const clearLatestCharacterNotification = useCallback(() => {
    setState((s) => ({ ...s, latestCharacterNotification: null }))
  }, [])

  const usageRemaining = useCallback((field: UsageField) => remainingFor(state.plan, state.usage, field), [state.plan, state.usage])
  const isFeatureAllowed = useCallback((field: UsageField) => isAllowed(state.plan, state.usage, field), [state.plan, state.usage])

  // Rebusca plano/uso reais do banco — chamado depois de voltar do checkout do Stripe (o
  // webhook já deve ter persistido o plano 'pro' a essa altura) em vez de fingir localmente
  // que a assinatura foi ativada.
  const refreshProfile = useCallback(async (): Promise<UserPlan> => {
    const userId = state.profile?.id
    if (!userId) return state.plan

    const { data } = await supabase
      .from('profiles')
      .select('plan, articles_generated, images_generated, squad_analyses_used')
      .eq('id', userId)
      .maybeSingle()
    if (!data) return state.plan

    const plan = data.plan as UserPlan
    setState((s) => ({
      ...s,
      plan,
      usage: {
        articlesGenerated: data.articles_generated,
        imagesGenerated: data.images_generated,
        squadAnalyses: data.squad_analyses_used,
      },
    }))
    return plan
  }, [state.profile, state.plan, supabase])

  const value: MockDataContextValue = {
    state,
    isHydrated,
    sendMagicLink,
    signUpWithPassword,
    signInWithPassword,
    signInWithGoogle,
    logout,
    createCareerAndFirstArticle,
    getCareerBySlug,
    getMostRecentCareer,
    getCareerMemory,
    generateArticleForCareer,
    generateImageForArticle,
    generateSpeechForArticle,
    getEventsForCareer,
    getArticlesForCareer,
    getArticleById,
    getArticleByShareToken,
    analyzeSquad,
    getSquadAnalysesForCareer,
    setCaptainInfo,
    getCharacterMessagesForCareer,
    getCharacterThread,
    getCharacterMessageById,
    markCharacterMessageRead,
    replyToCharacterMessage,
    clearLatestCharacterNotification,
    usageRemaining,
    isFeatureAllowed,
    refreshProfile,
  }

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData deve ser usado dentro de MockDataProvider')
  return ctx
}
