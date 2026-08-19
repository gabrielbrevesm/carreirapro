import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isAllowed, type UsageField } from '@/lib/freemium'
import type { UserPlan, UsageTracking } from '@/types'

const COLUMN_BY_FIELD: Record<UsageField, 'articles_generated' | 'images_generated' | 'squad_analyses_used'> = {
  articlesGenerated: 'articles_generated',
  imagesGenerated: 'images_generated',
  squadAnalyses: 'squad_analyses_used',
}

type QuotaResult = { ok: true; userId: string } | { ok: false; status: number; error: string }

// Confere a cota do plano do usuário AUTENTICADO (via cookie de sessão) direto no banco — nunca
// confia no que o client alega localmente, já que isso é fácil de falsificar no navegador.
// Se permitido, já incrementa o contador (via service_role, a única forma de escrever nessas
// colunas — ver migration 0002). Chamar isso ANTES de gastar dinheiro com a OpenAI.
export async function checkAndReserveQuota(
  supabaseServer: SupabaseClient,
  supabaseAdmin: SupabaseClient,
  field: UsageField
): Promise<QuotaResult> {
  const {
    data: { user },
  } = await supabaseServer.auth.getUser()
  if (!user) return { ok: false, status: 401, error: 'UNAUTHENTICATED' }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('plan, articles_generated, images_generated, squad_analyses_used')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return { ok: false, status: 404, error: 'PROFILE_NOT_FOUND' }

  const plan = profile.plan as UserPlan
  const usage: UsageTracking = {
    articlesGenerated: profile.articles_generated,
    imagesGenerated: profile.images_generated,
    squadAnalyses: profile.squad_analyses_used,
  }

  if (!isAllowed(plan, usage, field)) {
    return { ok: false, status: 402, error: 'QUOTA_EXCEEDED' }
  }

  const column = COLUMN_BY_FIELD[field]
  await supabaseAdmin
    .from('profiles')
    .update({ [column]: usage[field] + 1 })
    .eq('id', user.id)

  return { ok: true, userId: user.id }
}
