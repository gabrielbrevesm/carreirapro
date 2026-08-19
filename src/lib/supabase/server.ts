import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
// Lê/escreve a sessão via cookies do request — precisa ser chamado dentro do escopo de um
// request (não pode ser instanciado uma vez e reaproveitado entre requests).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Chamado a partir de um Server Component (sem permissão de escrita) — o middleware
          // já cuida de manter a sessão atualizada nesse caso, então é seguro ignorar aqui.
        }
      },
    },
  })
}
