import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente com service_role — ignora RLS. Uso exclusivo em contextos server-only e sensíveis
// (ex: webhook do Stripe atualizando o plano de um usuário sem uma sessão de usuário no request).
// Nunca importar em código que roda no client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
