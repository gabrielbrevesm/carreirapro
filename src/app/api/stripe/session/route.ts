import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe/stripe-client'

export async function GET(req: NextRequest) {
  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 })
  }

  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'MISSING_SESSION_ID' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return NextResponse.json({ paid: session.payment_status === 'paid' })
  } catch (error) {
    console.error('[/api/stripe/session]', error)
    return NextResponse.json({ error: 'SESSION_LOOKUP_FAILED' }, { status: 502 })
  }
}
