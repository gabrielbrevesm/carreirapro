import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe/stripe-client'
import { createAdminClient } from '@/lib/supabase/admin'

// Endpoint para o Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
// ou para o webhook configurado no dashboard. Fonte da verdade para profiles.plan — nenhum
// outro caminho no código escreve 'pro' nessa coluna (ver migration 0002, que revoga UPDATE
// direto do client autenticado).
export async function POST(req: NextRequest) {
  const stripe = getStripeClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error('[/api/stripe/webhook] Assinatura inválida', error)
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    console.error('[/api/stripe/webhook] admin client indisponível — SUPABASE_SERVICE_ROLE_KEY ausente')
    return NextResponse.json({ received: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      if (!userId) {
        console.error('[/api/stripe/webhook] checkout.session.completed sem client_reference_id', session.id)
        break
      }
      const { error } = await admin
        .from('profiles')
        .update({
          plan: 'pro',
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
        })
        .eq('id', userId)
      if (error) console.error('[/api/stripe/webhook] falha ao ativar plano pro', error)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
      if (!customerId) break
      const { error } = await admin
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('stripe_customer_id', customerId)
      if (error) console.error('[/api/stripe/webhook] falha ao rebaixar plano', error)
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
