// Script único (roda uma vez, fora do runtime da app) para gerar as 5 fotos de perfil dos
// personagens paralelos. Uso: node scripts/generate-character-avatars.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'

const ROOT = process.cwd()

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)\s*$/.exec(line)
    if (!match) continue
    const [, key, rawValue] = match
    const value = rawValue.replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('OPENAI_API_KEY não encontrada em .env.local')
  process.exit(1)
}

const client = new OpenAI({ apiKey })

const STYLE_SUFFIX =
  'Fotografia editorial realista, still de revista esportiva, retrato do ombro para cima, enquadramento quadrado centrado, ' +
  'iluminação suave e profissional, fundo desfocado neutro. Pessoa e ambiente genéricos/fictícios — nunca uma pessoa real, ' +
  'sem escudos, logotipos ou uniformes de clubes reais, sem texto na imagem.'

const CHARACTERS = [
  {
    id: 'diretor_esportivo',
    prompt: `Diretor esportivo de um clube de futebol: pessoa de meia-idade, terno elegante, expressão séria e analítica, escritório de clube com pranchetas de scouting desfocadas ao fundo. ${STYLE_SUFFIX}`,
  },
  {
    id: 'presidente',
    prompt: `Presidente de um clube de futebol: executivo mais velho, terno formal, postura confiante e institucional, escritório executivo desfocado ao fundo. ${STYLE_SUFFIX}`,
  },
  {
    id: 'auxiliar_tecnico',
    prompt: `Auxiliar técnico / analista de desempenho de futebol: pessoa com colete ou polo de treino, segurando um tablet, à beira de campo, luz natural de tarde. ${STYLE_SUFFIX}`,
  },
  {
    id: 'departamento_medico',
    prompt: `Médico do departamento médico de um clube de futebol: jaleco esportivo, ambiente de fisioterapia/clínica desfocado ao fundo, expressão atenta e cuidadosa. ${STYLE_SUFFIX}`,
  },
  {
    id: 'capitao',
    prompt: `Capitão de um time de futebol: jogador com braçadeira de capitão, uniforme esportivo genérico sem marcas, expressão determinada, campo desfocado ao fundo. ${STYLE_SUFFIX}`,
  },
]

const OUT_DIR = path.join(ROOT, 'public', 'characters')
mkdirSync(OUT_DIR, { recursive: true })

for (const character of CHARACTERS) {
  console.log(`Gerando avatar: ${character.id}...`)
  const response = await client.images.generate({
    model: 'gpt-image-1',
    prompt: character.prompt,
    n: 1,
    size: '1024x1024',
    quality: 'high',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) {
    console.error(`Falha ao gerar ${character.id}: sem dados de imagem na resposta`)
    continue
  }

  const filePath = path.join(OUT_DIR, `${character.id}.png`)
  writeFileSync(filePath, Buffer.from(b64, 'base64'))
  console.log(`Salvo em ${filePath}`)
}

console.log('Concluído.')
