import 'server-only'
import OpenAI from 'openai'

// Uso exclusivo server-side (Route Handlers) — nunca importar em componentes client.
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

export function getConfiguredModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o'
}
