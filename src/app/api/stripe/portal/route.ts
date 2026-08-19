import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe/stripe-client'
import { createClient } from '@/lib/supabase/server'

// Abre o Portal de Cobrança do Stripe (cancelamento, troca de cartão, histórico de faturas)
// para o assinante autenticado — cancelamento real, gerenciado pelo Stripe, não um toggle local.
export async function POST(req: NextRequest) {
  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'NO_SUBSCRIPTION' }, { status: 404 })
  }

  const origin = req.nextUrl.origin

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[/api/stripe/portal]', error)
    return NextResponse.json({ error: 'PORTAL_FAILED' }, { status: 502 })
  }
}
