import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// O link mágico do Supabase redireciona pra cá com um `code` (fluxo PKCE) — trocamos por uma
// sessão real e mandamos o usuário pro app.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, req.nextUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', req.nextUrl.origin))
}
