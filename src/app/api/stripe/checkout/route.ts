import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient, getConfiguredPriceId } from '@/lib/stripe/stripe-client'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const stripe = getStripeClient()
  const priceId = getConfiguredPriceId()
  if (!stripe || !priceId) {
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

  const origin = req.nextUrl.origin

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // client_reference_id é como o webhook descobre QUAL usuário Supabase upgradear —
      // o evento do Stripe não carrega nosso auth.uid() por conta própria.
      client_reference_id: user.id,
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      success_url: `${origin}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?canceled=true`,
    })

    if (!session.url) throw new Error('Sessão sem URL de checkout')

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[/api/stripe/checkout]', error)
    return NextResponse.json({ error: 'CHECKOUT_FAILED' }, { status: 502 })
  }
}
