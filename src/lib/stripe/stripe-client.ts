import 'server-only'
import Stripe from 'stripe'

// Uso exclusivo server-side (Route Handlers) — nunca importar em componentes client.
export function getStripeClient(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) return null
  return new Stripe(apiKey)
}

export function getConfiguredPriceId(): string | null {
  return process.env.STRIPE_PRICE_ID || null
}
