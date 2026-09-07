import { NextRequest, NextResponse } from 'next/server'
import { fetchManagerPhotoUrl } from '@/lib/managers/wikipedia-photo'
import { findJournalistByName } from '@/lib/media/journalists'
import { readImageRegistry } from '@/lib/media/image-registry'

// Foto de um comentarista/jornalista real citado em "Debate na Imprensa" — os nomes que a IA usa
// vêm da base curada (src/lib/media/journalists), que já tem imagem pré-sincronizada via
// `npm run journalists:sync-images` (Wikipedia/Wikimedia Commons, com licença rastreada). Só cai
// na busca ao vivo pra um nome fora da base curada.
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 })

  const journalist = findJournalistByName(name)
  if (journalist) {
    const registry = await readImageRegistry()
    const image = registry[journalist.id]
    if (image?.status === 'available' && image.localPath) {
      return NextResponse.json({ photoUrl: image.localPath })
    }
    // Está na base curada mas sem imagem disponível (not_found/manual_review/pending) — não
    // adianta tentar de novo ao vivo, o sync já tentou com mais contexto que temos aqui.
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    const photoUrl = await fetchManagerPhotoUrl(name)
    if (!photoUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('[/api/pundits/photo]', error)
    return NextResponse.json({ error: 'LOOKUP_FAILED' }, { status: 502 })
  }
}
