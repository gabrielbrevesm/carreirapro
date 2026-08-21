import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// O link mágico do Supabase redireciona pra cá com um `code` (fluxo PKCE) — trocamos por uma
// sessão real e mandamos o usuário pro app.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') ?? '/'

  if (code) {
    // Diagnóstico: confere se alguma env var usada pelo cliente do Supabase tem caractere fora
    // do range Latin-1 (>255) — só o resultado (nome + índice + code point), nunca o valor.
    for (const varName of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
      const val = process.env[varName] ?? ''
      for (let i = 0; i < val.length; i++) {
        const cc = val.charCodeAt(i)
        if (cc > 255) {
          console.error(`[/auth/callback] env "${varName}" (len ${val.length}) tem char inválido no índice ${i}: code ${cc}`)
          break
        }
      }
    }
    console.error(
      '[/auth/callback] env lengths:',
      ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].map(
        (n) => `${n}=${(process.env[n] ?? '').length}`
      )
    )

    const supabase = await createClient()
    // Diagnóstico: sem logar o conteúdo (sensível), verifica se algum cookie tem caractere
    // fora do range Latin-1 (>255) — é exatamente o que o erro "Cannot convert argument to a
    // ByteString" indica, e cookies são o único dado desta request que não vem de env var.
    const allCookies = (await (await import('next/headers')).cookies()).getAll()
    for (const c of allCookies) {
      for (let i = 0; i < c.value.length; i++) {
        const code = c.value.charCodeAt(i)
        if (code > 255) {
          console.error(
            `[/auth/callback] cookie "${c.name}" (len ${c.value.length}) tem char inválido no índice ${i}: code ${code}`
          )
          break
        }
      }
    }
    console.error(
      '[/auth/callback] cookies presentes:',
      allCookies.map((c) => `${c.name}(${c.value.length})`)
    )

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
