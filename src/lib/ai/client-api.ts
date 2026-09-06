'use client'

import type { Article, Career, CareerMemory, CharacterId } from '@/types'
import type { AiArticleResponse } from '@/lib/ai/types'

export type AiArticleResult = AiArticleResponse & {
  modelUsed: string
  tokensUsed: number
  generationTimeMs: number
}

export type AiCharacterResult = {
  headline: string
  body: string
  modelUsed: string
  tokensUsed: number
  generationTimeMs: number
}

export type AiCharacterReplyResult = {
  body: string
  modelUsed: string
  tokensUsed: number
  generationTimeMs: number
}

export type AiImageResult = {
  imageUrl: string
  brief: string
  imagePrompt: string
  tokensUsed: number
  generationTimeMs: number
}

export type AiSpeechResult = {
  audioUrl: string
}

export type AiBoleiroInsightsResult = {
  tips: string[]
  newCareerSuggestions: string[]
}

// Transcreve um áudio gravado no composer de matéria (o usuário fala em vez de digitar).
// Retorna null em qualquer falha — quem chama mantém o botão de microfone, sem fallback mock
// (não existe "transcrição falsa" que faça sentido).
export async function tryTranscribeAudio(audioBlob: Blob): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'gravacao.webm')
    const res = await fetch('/api/articles/transcribe', { method: 'POST', body: formData })
    if (!res.ok) return null

    const data = (await res.json()) as { text?: string }
    return data.text?.trim() || null
  } catch {
    return null
  }
}

// Sinaliza que o SERVIDOR recusou por cota esgotada (verificação real no banco, não a
// pré-checagem local que já roda antes desta chamada) — isso NUNCA deve cair no fallback mock,
// senão um usuário sem cota continuaria gerando conteúdo "grátis" indefinidamente.
export class QuotaExceededError extends Error {
  constructor() {
    super('QUOTA_EXCEEDED')
    this.name = 'QuotaExceededError'
  }
}

// Chama a rota real de geração de matéria. Retorna null em falhas recuperáveis (sem chave
// configurada, erro de rede, resposta inválida) para permitir fallback silencioso ao mock.
// Lança QuotaExceededError se o servidor recusar por cota — isso deve virar paywall, não mock.
export async function tryGenerateArticleWithAI(params: {
  career: Career
  memory: CareerMemory
  rawInput: string
  isFirstEvent: boolean
  attachmentUrl?: string | null
}): Promise<AiArticleResult | null> {
  try {
    const res = await fetch('/api/articles/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.status === 402) throw new QuotaExceededError()
    if (!res.ok) return null

    const data = (await res.json()) as AiArticleResult
    if (!data.headline || !data.body) return null

    return data
  } catch (error) {
    if (error instanceof QuotaExceededError) throw error
    return null
  }
}

// Chama o pipeline real de imagem (Motor Narrativo → Brief Editorial → Diretor de Arte → DALL-E 3).
// Mesma regra: falha recuperável vira null (mock), cota esgotada lança QuotaExceededError (paywall).
export async function tryGenerateImageWithAI(params: { career: Career; article: Article }): Promise<AiImageResult | null> {
  try {
    const res = await fetch('/api/articles/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.status === 402) throw new QuotaExceededError()
    if (!res.ok) return null

    const data = (await res.json()) as AiImageResult
    if (!data.imageUrl) return null

    return data
  } catch (error) {
    if (error instanceof QuotaExceededError) throw error
    return null
  }
}

// Narração em áudio da matéria ("Ouvir matéria"). Retorna null em qualquer falha — sem
// fallback mock aqui, já que não há um "áudio mock" que faça sentido; o botão só reflete
// indisponibilidade.
export async function tryGenerateSpeechWithAI(params: { article: Article }): Promise<AiSpeechResult | null> {
  try {
    const res = await fetch('/api/articles/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return null

    const data = (await res.json()) as AiSpeechResult
    if (!data.audioUrl) return null

    return data
  } catch {
    return null
  }
}

// Gera as dicas do "Dica de Boleiro" no dashboard. Retorna null em qualquer falha — o
// componente simplesmente esconde o painel nesse caso, sem fallback mock (não faz sentido
// inventar dicas genéricas sem IA real).
export async function tryGenerateBoleiroInsights(params: {
  careers: Career[]
  memories: Record<string, CareerMemory>
  articles: Article[]
}): Promise<AiBoleiroInsightsResult | null> {
  try {
    const res = await fetch('/api/insights/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return null

    const data = (await res.json()) as AiBoleiroInsightsResult
    if (!Array.isArray(data.tips) || data.tips.length === 0) return null

    return data
  } catch {
    return null
  }
}

// Chama o motor siloed de um personagem paralelo (Diretor Esportivo, Presidente, etc).
// Retorna null em qualquer falha para permitir fallback silencioso à fala mock do personagem.
export async function tryGenerateCharacterMessageWithAI(params: {
  characterId: CharacterId
  career: Career
  memory: CareerMemory
  article: Article
}): Promise<AiCharacterResult | null> {
  try {
    const res = await fetch('/api/characters/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return null

    const data = (await res.json()) as AiCharacterResult
    if (!data.headline || !data.body) return null

    return data
  } catch {
    return null
  }
}

// Chama o motor siloed do personagem para responder à réplica do usuário (uma troca só por
// mensagem espontânea). Retorna null em qualquer falha para permitir fallback à resposta mock.
export async function tryGenerateCharacterReplyWithAI(params: {
  characterId: CharacterId
  career: Career
  memory: CareerMemory
  article: Article
  originalMessage: { headline: string; body: string }
  userReply: string
}): Promise<AiCharacterReplyResult | null> {
  try {
    const res = await fetch('/api/characters/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return null

    const data = (await res.json()) as AiCharacterReplyResult
    if (!data.body) return null

    return data
  } catch {
    return null
  }
}
