import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// O link mágico do Supabase redireciona pra cá com um `code` (fluxo PKCE) — trocamos por uma
// sessão real e mandamos o usuário pro app.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    // Diagnóstico: loga os nomes (não valores) dos cookies de sessão do Supabase presentes
    // nesta request — ajuda a identificar se o cookie do PKCE code_verifier está ausente,
    // duplicado ou fragmentado (causa comum de falha silenciosa/corrompida na troca do código).
    const cookieNames = (await (await import('next/headers')).cookies())
      .getAll()
      .map((c) => c.name)
      .filter((n) => n.startsWith('sb-'))
    console.error('[/auth/callback] cookies sb- presentes:', cookieNames)

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(new URL(next, req.nextUrl.origin))
      }
      console.error('[/auth/callback] exchangeCodeForSession retornou erro', error.name, error.message, error.status)
      return NextResponse.redirect(
        new URL(`/login?error=auth&reason=${encodeURIComponent(`${error.name}: ${error.message}`)}`, req.nextUrl.origin)
      )
    } catch (err) {
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      console.error('[/auth/callback] exchangeCodeForSession lançou exceção', err)
      return NextResponse.redirect(
        new URL(`/login?error=auth&reason=${encodeURIComponent(`exception: ${message}`)}`, req.nextUrl.origin)
      )
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth&reason=missing_code', req.nextUrl.origin))
}
