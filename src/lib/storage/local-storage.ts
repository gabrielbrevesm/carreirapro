import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomId } from '@/lib/utils'

// Storage próprio do app: arquivos ficam no bucket público "uploads" do Supabase Storage.
// Substitui o antigo storage em disco (public/uploads) — necessário porque a maioria dos
// hosts de produção (incluindo a Vercel) não tem disco persistente entre deploys/requests.
export type UploadCategory = 'images' | 'managers' | 'players' | 'audio' | 'clubs'

const BUCKET = 'uploads'

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'audio/mpeg') return 'mp3'
  if (mime === 'image/svg+xml') return 'svg'
  return 'bin'
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Salva um data URL base64 (ex: "data:image/png;base64,...") no Supabase Storage e retorna a URL pública.
// O upload em si já falhou de forma intermitente em produção (erro 520, transiente do lado do
// Supabase Storage) DEPOIS de já termos pago pela geração da imagem na OpenAI/Gemini — perder a
// imagem inteira por causa disso é um desperdício bobo, então tenta mais 2 vezes com um respiro
// curto antes de desistir de verdade.
export async function saveDataUrlToStorage(dataUrl: string, category: UploadCategory): Promise<string> {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) throw new Error('Data URL inválida')

  const admin = createAdminClient()
  if (!admin) throw new Error('Supabase admin client indisponível (SUPABASE_SERVICE_ROLE_KEY ausente)')

  const path = `${category}/${randomId()}.${extFromMime(parsed.mime)}`

  let lastError: unknown = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await admin.storage.from(BUCKET).upload(path, parsed.buffer, {
      contentType: parsed.mime,
      upsert: false,
    })
    if (!error) return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

    lastError = error
    console.error(`[saveDataUrlToStorage] tentativa ${attempt}/3 falhou`, error)
    if (attempt < 3) await sleep(500 * attempt)
  }

  throw lastError
}
