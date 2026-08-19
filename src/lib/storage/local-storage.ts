import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomId } from '@/lib/utils'

// Storage próprio do app: arquivos ficam no bucket público "uploads" do Supabase Storage.
// Substitui o antigo storage em disco (public/uploads) — necessário porque a maioria dos
// hosts de produção (incluindo a Vercel) não tem disco persistente entre deploys/requests.
export type UploadCategory = 'images' | 'managers' | 'players'

const BUCKET = 'uploads'

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'bin'
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') }
}

// Salva um data URL base64 (ex: "data:image/png;base64,...") no Supabase Storage e retorna a URL pública.
export async function saveDataUrlToStorage(dataUrl: string, category: UploadCategory): Promise<string> {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) throw new Error('Data URL inválida')

  const admin = createAdminClient()
  if (!admin) throw new Error('Supabase admin client indisponível (SUPABASE_SERVICE_ROLE_KEY ausente)')

  const path = `${category}/${randomId()}.${extFromMime(parsed.mime)}`
  const { error } = await admin.storage.from(BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.mime,
    upsert: false,
  })
  if (error) throw error

  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
