import 'server-only'

// Motor de imagem via Gemini (Google) — troca do gpt-image-1 porque preserva muito melhor a
// semelhança facial de uma pessoa real a partir de uma foto de referência (o problema relatado:
// rostos de técnicos/jogadores reais saindo genéricos, não fiéis).
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

function getGeminiImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
}

type GeminiInlineImage = { mimeType: string; data: string }

// Reforço de estilo aplicado a TODA geração, além do que o Diretor de Arte (GPT) já escreve no
// prompt — texto vindo de outro modelo varia turno a turno; este prefixo/sufixo fixo garante que
// as palavras-chave que mais combatem a "cara de IA" cheguem sempre ao Gemini, na mesma forma.
const REALISM_PREFIX =
  'RAW unedited photograph, real photojournalism, shot on a professional DSLR camera — NOT a 3D render, NOT CGI, NOT an illustration, NOT airbrushed, NOT a video game screenshot. '
const REALISM_SUFFIX =
  ' Natural skin texture with visible pores and subtle imperfections, natural asymmetry, realistic film grain, true-to-life color grading — avoid smooth plastic skin, waxy skin, artificial symmetry, or an overly clean/digital look.'

function buildRealisticPrompt(prompt: string): string {
  return `${REALISM_PREFIX}${prompt}${REALISM_SUFFIX}`
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType: string; data: string }
        text?: string
      }>
    }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
}

// Gera (ou edita, se `referenceImages` for passado) uma imagem via Gemini. Retorna o base64 puro
// (sem prefixo data:) da primeira imagem retornada, ou null se o modelo não retornar imagem.
export async function generateImageWithGemini(params: {
  prompt: string
  referenceImages?: GeminiInlineImage[]
}): Promise<string | null> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) return null

  const model = getGeminiImageModel()
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
    { text: buildRealisticPrompt(params.prompt) },
  ]
  for (const ref of params.referenceImages ?? []) {
    parts.push({ inline_data: { mime_type: ref.mimeType, data: ref.data } })
  }

  const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      // Temperatura baixa: queremos a foto mais literal/consistente com o prompt e a foto de
      // referência, não variações "criativas" — é isso que mais gera fuga de realismo.
      generationConfig: { responseModalities: ['IMAGE'], temperature: 0.35 },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Gemini API retornou ${res.status}: ${errBody.slice(0, 500)}`)
  }

  const data = (await res.json()) as GeminiGenerateContentResponse
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueou a geração: ${data.promptFeedback.blockReason}`)
  }

  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
  return imagePart?.inlineData?.data ?? null
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== null
}
