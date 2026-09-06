// Sem `import 'server-only'` de propósito: este módulo também roda fora do Next.js, no script
// de sync (scripts/sync-journalist-images.ts via tsx) — nunca é importado por um componente
// client (só por rotas de API e pelo próprio script).
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { JournalistImage } from './types'

// Registro persistido (checkado no git) com o resultado do sync de imagens — o runtime normal
// só LÊ este arquivo (§58, etapa 9: nunca busca a rede a cada execução da aplicação). A busca
// externa só roda via `npm run journalists:sync-images`.
const REGISTRY_PATH = path.join(process.cwd(), 'src', 'lib', 'media', 'journalist-images.data.json')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'media', 'journalists')

export type JournalistImageRegistry = Record<string, JournalistImage>

export async function readImageRegistry(): Promise<JournalistImageRegistry> {
  try {
    const raw = await readFile(REGISTRY_PATH, 'utf-8')
    return JSON.parse(raw) as JournalistImageRegistry
  } catch {
    return {}
  }
}

export async function writeImageRegistry(registry: JournalistImageRegistry): Promise<void> {
  const sorted: JournalistImageRegistry = {}
  for (const key of Object.keys(registry).sort()) sorted[key] = registry[key]
  await writeFile(REGISTRY_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8')
}

function extFromContentType(contentType: string): string {
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  return 'jpg'
}

// Salva o arquivo em public/media/journalists/<pais>/<slug>.<ext> — mesmo padrão de asset
// estático já usado pelos personagens (public/characters/*.png), só que versionado por país.
export async function saveJournalistImageFile(params: {
  journalistId: string
  country: string
  buffer: Buffer
  contentType: string
}): Promise<string> {
  const ext = extFromContentType(params.contentType)
  const dir = path.join(PUBLIC_DIR, params.country)
  await mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${params.journalistId}.${ext}`)
  await writeFile(filePath, params.buffer)
  return `/media/journalists/${params.country}/${params.journalistId}.${ext}`
}
