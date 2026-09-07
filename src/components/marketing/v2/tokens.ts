// Design tokens da landing v2 — escopados a este diretório (não tocam o tema global do app nem
// a v1 da landing, que continua em '@/components/marketing/LandingPage'). Segue o mesmo padrão
// da v1: cores como valores arbitrários do Tailwind em vez de variáveis CSS globais, pra não
// colidir com os tokens do shadcn usados no resto do produto.

export const V2 = {
  bg: '#101F28',
  bgDeep: '#07151D',
  bgCard: '#112631',
  bgCardHover: '#16303C',
  bgElevated: '#172D38',
  border: 'rgba(126, 166, 177, 0.20)',
  borderStrong: 'rgba(126, 166, 177, 0.35)',
  green: '#4EEEA0',
  greenStrong: '#2E9B6B',
  greenSoft: '#86ECB9',
  textPrimary: '#F5F7F8',
  textSecondary: '#AEBCC2',
  textMuted: '#758B8D',
  warning: '#F4B740',
  danger: '#E85B4A',
  info: '#55A8FF',
} as const

// Classes utilitárias repetidas com frequência — sempre como strings LITERAIS (nunca compostas
// via template com as variáveis acima): o Tailwind só compila classes que consegue "ver"
// estaticamente no código-fonte, então `bg-[${V2.bg}]` nunca funcionaria.
export const v2Display = '[font-family:var(--font-sans)] font-extrabold tracking-tight'
export const v2Eyebrow = '[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] uppercase'
export const v2Card = 'rounded-2xl border border-[rgba(126,166,177,0.20)] bg-[#112631]'
export const v2CardHover = 'hover:border-[rgba(78,238,160,0.35)] hover:-translate-y-0.5 transition-all duration-300'
