// Comando de sincronização de imagens dos jornalistas (§63 do brief).
//
// Uso:
//   npm run journalists:sync-images                    # só quem ainda não tem imagem
//   npm run journalists:sync-images -- --force          # refaz todo mundo
//   npm run journalists:sync-images -- --journalist=gary-neville
//   npm run journalists:sync-images -- --country=england
//   npm run journalists:sync-images -- --dry-run        # mostra o que faria, sem baixar
//
// Runtime normal (a UI) nunca chama a Wikipédia diretamente pra jornalistas curados — só lê o
// registro gerado aqui (src/lib/media/journalist-images.data.json).

import { JOURNALISTS } from '../src/lib/media/journalists'
import { readImageRegistry, writeImageRegistry } from '../src/lib/media/image-registry'
import { syncJournalistImage } from '../src/lib/media/sync-journalist-images'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseArgs(argv: string[]) {
  const force = argv.includes('--force')
  const dryRun = argv.includes('--dry-run')
  const journalistArg = argv.find((a) => a.startsWith('--journalist='))?.split('=')[1]
  const countryArg = argv.find((a) => a.startsWith('--country='))?.split('=')[1]
  return { force, dryRun, journalistId: journalistArg, country: countryArg }
}

async function main() {
  const { force, dryRun, journalistId, country } = parseArgs(process.argv.slice(2))

  let targets = JOURNALISTS.filter((j) => j.active)
  if (journalistId) targets = targets.filter((j) => j.id === journalistId)
  if (country) targets = targets.filter((j) => j.country === country)

  if (targets.length === 0) {
    console.log('Nenhum jornalista corresponde aos filtros informados.')
    return
  }

  const registry = await readImageRegistry()
  console.log(`Sincronizando imagens de ${targets.length} jornalista(s)${dryRun ? ' [dry-run]' : ''}...\n`)

  let available = 0
  let manualReview = 0
  let notFound = 0
  let failed = 0
  let skipped = 0

  for (const journalist of targets) {
    // Espaça as chamadas — bater rápido demais na API pública da Wikimedia derruba tudo em 429
    // (aconteceu na primeira tentativa desta sessão: lote inteiro voltou "not found" por causa
    // de rate limit, não porque as pessoas não existem).
    await sleep(600)

    const journalistWithCurrentImage = { ...journalist, image: registry[journalist.id] }
    const { image, outcome } = await syncJournalistImage(journalistWithCurrentImage, { force, dryRun })

    if (outcome.detail.includes('já sincronizado')) {
      skipped++
      console.log(`- ${journalist.id} — skip (${outcome.detail})`)
      continue
    }

    if (!dryRun) registry[journalist.id] = image

    const icon = outcome.status === 'available' ? '✓' : outcome.status === 'manual_review' ? '!' : outcome.status === 'not_found' ? '×' : '⚠'
    console.log(`${icon} ${journalist.id} — ${outcome.status} — ${outcome.detail}`)

    if (outcome.status === 'available') available++
    else if (outcome.status === 'manual_review') manualReview++
    else if (outcome.status === 'not_found') notFound++
    else failed++
  }

  if (!dryRun) await writeImageRegistry(registry)

  console.log('\nResumo:')
  console.log(`  disponível: ${available}`)
  console.log(`  revisão manual: ${manualReview}`)
  console.log(`  não encontrado: ${notFound}`)
  console.log(`  falhou: ${failed}`)
  console.log(`  ignorado (já tinha): ${skipped}`)
}

main().catch((err) => {
  console.error('Erro no sync de imagens:', err)
  process.exit(1)
})
