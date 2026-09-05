'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Article, Career, CareerEvent, CareerMemory, CharacterMessage, SquadAnalysis } from '@/types'

// Conversores entre o formato das tabelas (snake_case) e os tipos do app (camelCase).
// Mantidos num só lugar para que o resto do store.tsx continue trabalhando com os mesmos
// tipos de sempre — só a origem dos dados (Supabase em vez de localStorage) muda.

type CareerRow = {
  id: string
  user_id: string
  slug: string
  manager_type: string
  manager_name: string
  manager_bio: string | null
  manager_origin: string | null
  manager_photo_url: string | null
  club_name: string
  club_league: string
  club_country: string
  club_tier: string | null
  season_start: string
  initial_objective: string | null
  current_season: string | null
  events_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function rowToCareer(row: CareerRow): Career {
  return {
    id: row.id,
    slug: row.slug,
    managerType: row.manager_type as Career['managerType'],
    managerName: row.manager_name,
    managerBio: row.manager_bio,
    managerOrigin: row.manager_origin,
    managerPhotoUrl: row.manager_photo_url,
    clubName: row.club_name,
    clubLeague: row.club_league,
    clubCountry: row.club_country,
    clubTier: row.club_tier as Career['clubTier'],
    seasonStart: row.season_start,
    initialObjective: row.initial_objective,
    currentSeason: row.current_season,
    eventsCount: row.events_count,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function careerToRow(userId: string, career: Career): CareerRow {
  return {
    id: career.id,
    user_id: userId,
    slug: career.slug,
    manager_type: career.managerType,
    manager_name: career.managerName,
    manager_bio: career.managerBio,
    manager_origin: career.managerOrigin,
    manager_photo_url: career.managerPhotoUrl,
    club_name: career.clubName,
    club_league: career.clubLeague,
    club_country: career.clubCountry,
    club_tier: career.clubTier,
    season_start: career.seasonStart,
    initial_objective: career.initialObjective,
    current_season: career.currentSeason,
    events_count: career.eventsCount,
    is_active: career.isActive,
    created_at: career.createdAt,
    updated_at: career.updatedAt,
  }
}

type MemoryRow = {
  career_id: string
  established_facts: CareerMemory['establishedFacts']
  recurring_characters: CareerMemory['recurringCharacters']
  active_narratives: CareerMemory['activeNarratives']
  rivalries: CareerMemory['rivalries']
  player_highlights: CareerMemory['playerHighlights']
  recent_results: CareerMemory['recentResults']
  key_signings: CareerMemory['keySignings']
  captain_name: string | null
  vice_captain_name: string | null
  updated_at: string
}

export function rowToMemory(row: MemoryRow): CareerMemory {
  return {
    careerId: row.career_id,
    establishedFacts: row.established_facts ?? [],
    recurringCharacters: row.recurring_characters ?? [],
    activeNarratives: row.active_narratives ?? [],
    rivalries: row.rivalries ?? [],
    playerHighlights: row.player_highlights ?? {},
    recentResults: row.recent_results ?? [],
    keySignings: row.key_signings ?? [],
    captainName: row.captain_name,
    viceCaptainName: row.vice_captain_name,
    updatedAt: row.updated_at,
  }
}

export function memoryToRow(memory: CareerMemory): MemoryRow {
  return {
    career_id: memory.careerId,
    established_facts: memory.establishedFacts,
    recurring_characters: memory.recurringCharacters,
    active_narratives: memory.activeNarratives,
    rivalries: memory.rivalries,
    player_highlights: memory.playerHighlights,
    recent_results: memory.recentResults,
    key_signings: memory.keySignings,
    captain_name: memory.captainName,
    vice_captain_name: memory.viceCaptainName,
    updated_at: memory.updatedAt,
  }
}

type EventRow = {
  id: string
  career_id: string
  event_type: string
  raw_input: string
  season: string | null
  competition: string | null
  match_week: number | null
  has_image_attachment: boolean
  attachment_url: string | null
  event_order: number
  created_at: string
}

export function rowToEvent(row: EventRow): CareerEvent {
  return {
    id: row.id,
    careerId: row.career_id,
    eventType: row.event_type as CareerEvent['eventType'],
    rawInput: row.raw_input,
    season: row.season,
    competition: row.competition,
    matchWeek: row.match_week,
    hasImageAttachment: row.has_image_attachment,
    attachmentUrl: row.attachment_url,
    eventOrder: row.event_order,
    createdAt: row.created_at,
  }
}

export function eventToRow(event: CareerEvent): EventRow {
  return {
    id: event.id,
    career_id: event.careerId,
    event_type: event.eventType,
    raw_input: event.rawInput,
    season: event.season,
    competition: event.competition,
    match_week: event.matchWeek,
    has_image_attachment: event.hasImageAttachment,
    attachment_url: event.attachmentUrl,
    event_order: event.eventOrder,
    created_at: event.createdAt,
  }
}

type ArticleRow = {
  id: string
  career_id: string
  event_id: string | null
  headline: string
  subheadline: string | null
  body: string
  sections: Article['sections']
  season: string | null
  competition: string | null
  event_type: string | null
  model_used: string
  tokens_used: number
  generation_time_ms: number
  image_url: string | null
  image_prompt: string | null
  image_status: string
  audio_url: string | null
  share_token: string
  created_at: string
}

export function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    careerId: row.career_id,
    eventId: row.event_id,
    headline: row.headline,
    subheadline: row.subheadline,
    body: row.body,
    sections: row.sections,
    season: row.season,
    competition: row.competition,
    eventType: row.event_type as Article['eventType'],
    modelUsed: row.model_used,
    tokensUsed: row.tokens_used,
    generationTimeMs: row.generation_time_ms,
    imageUrl: row.image_url,
    imagePrompt: row.image_prompt,
    imageStatus: row.image_status as Article['imageStatus'],
    audioUrl: row.audio_url,
    shareToken: row.share_token,
    createdAt: row.created_at,
  }
}

export function articleToRow(article: Article): ArticleRow {
  return {
    id: article.id,
    career_id: article.careerId,
    event_id: article.eventId,
    headline: article.headline,
    subheadline: article.subheadline,
    body: article.body,
    sections: article.sections,
    season: article.season,
    competition: article.competition,
    event_type: article.eventType,
    model_used: article.modelUsed,
    tokens_used: article.tokensUsed,
    generation_time_ms: article.generationTimeMs,
    image_url: article.imageUrl,
    image_prompt: article.imagePrompt,
    image_status: article.imageStatus,
    audio_url: article.audioUrl,
    share_token: article.shareToken,
    created_at: article.createdAt,
  }
}

type CharacterMessageRow = {
  id: string
  career_id: string
  article_id: string
  character_id: string
  headline: string
  body: string
  model_used: string
  tokens_used: number
  generation_time_ms: number
  read: boolean
  created_at: string
  user_reply: string | null
  user_reply_at: string | null
  character_response: string | null
  character_response_at: string | null
}

export function rowToCharacterMessage(row: CharacterMessageRow): CharacterMessage {
  return {
    id: row.id,
    careerId: row.career_id,
    articleId: row.article_id,
    characterId: row.character_id as CharacterMessage['characterId'],
    headline: row.headline,
    body: row.body,
    modelUsed: row.model_used,
    tokensUsed: row.tokens_used,
    generationTimeMs: row.generation_time_ms,
    read: row.read,
    createdAt: row.created_at,
    userReply: row.user_reply,
    userReplyAt: row.user_reply_at,
    characterResponse: row.character_response,
    characterResponseAt: row.character_response_at,
  }
}

export function characterMessageToRow(message: CharacterMessage): CharacterMessageRow {
  return {
    id: message.id,
    career_id: message.careerId,
    article_id: message.articleId,
    character_id: message.characterId,
    headline: message.headline,
    body: message.body,
    model_used: message.modelUsed,
    tokens_used: message.tokensUsed,
    generation_time_ms: message.generationTimeMs,
    read: message.read,
    created_at: message.createdAt,
    user_reply: message.userReply,
    user_reply_at: message.userReplyAt,
    character_response: message.characterResponse,
    character_response_at: message.characterResponseAt,
  }
}

type SquadAnalysisRow = {
  id: string
  career_id: string
  photo_url: string
  financial_budget: string | null
  user_context: string | null
  identified_gaps: SquadAnalysis['identifiedGaps']
  suggestions: SquadAnalysis['suggestions']
  created_at: string
}

export function rowToSquadAnalysis(row: SquadAnalysisRow): SquadAnalysis {
  return {
    id: row.id,
    careerId: row.career_id,
    photoUrl: row.photo_url,
    financialBudget: row.financial_budget,
    userContext: row.user_context,
    identifiedGaps: row.identified_gaps ?? [],
    suggestions: row.suggestions ?? [],
    createdAt: row.created_at,
  }
}

export function squadAnalysisToRow(analysis: SquadAnalysis): SquadAnalysisRow {
  return {
    id: analysis.id,
    career_id: analysis.careerId,
    photo_url: analysis.photoUrl,
    financial_budget: analysis.financialBudget,
    user_context: analysis.userContext,
    identified_gaps: analysis.identifiedGaps,
    suggestions: analysis.suggestions,
    created_at: analysis.createdAt,
  }
}

// Carrega tudo que pertence ao usuário logado de uma vez (RLS já garante que só vêm as
// próprias linhas dele) — vira o cache local em memória que o resto do app já sabe consumir.
export async function fetchAllUserData(supabase: SupabaseClient) {
  const [careersRes, memoriesRes, eventsRes, articlesRes, messagesRes, squadRes] = await Promise.all([
    supabase.from('careers').select('*'),
    supabase.from('career_memories').select('*'),
    supabase.from('career_events').select('*'),
    supabase.from('articles').select('*'),
    supabase.from('character_messages').select('*'),
    supabase.from('squad_analyses').select('*'),
  ])

  const careers = ((careersRes.data as CareerRow[] | null) ?? []).map(rowToCareer)
  const careerMemories: Record<string, CareerMemory> = {}
  for (const row of (memoriesRes.data as MemoryRow[] | null) ?? []) {
    careerMemories[row.career_id] = rowToMemory(row)
  }
  const events = ((eventsRes.data as EventRow[] | null) ?? []).map(rowToEvent)
  const articles = ((articlesRes.data as ArticleRow[] | null) ?? []).map(rowToArticle)
  const characterMessages = ((messagesRes.data as CharacterMessageRow[] | null) ?? []).map(rowToCharacterMessage)
  const squadAnalyses = ((squadRes.data as SquadAnalysisRow[] | null) ?? []).map(rowToSquadAnalysis)

  return { careers, careerMemories, events, articles, characterMessages, squadAnalyses }
}
