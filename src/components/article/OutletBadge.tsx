import { cn } from '@/lib/utils'

// Identidade visual "estilizada" de cada veículo — cores de marca aproximadas, não os
// logotipos oficiais (que são material protegido por direitos autorais das respectivas empresas).
// Cobre os veículos citados no motor narrativo; qualquer outro nome recebe uma cor estável
// derivada do próprio nome, para que cada veículo sempre tenha a mesma cor entre matérias.
const OUTLET_BRANDS: Array<{ match: RegExp; bg: string; fg: string }> = [
  { match: /espn/i, bg: '#d00000', fg: '#ffffff' },
  { match: /^bbc/i, bg: '#000000', fg: '#ffffff' },
  { match: /sky sport/i, bg: '#0072c9', fg: '#ffffff' },
  { match: /the guardian/i, bg: '#052962', fg: '#ffffff' },
  { match: /the athletic/i, bg: '#000000', fg: '#f4c430' },
  { match: /the times/i, bg: '#111111', fg: '#ffffff' },
  { match: /globo esporte|ge\.globo|globoesporte/i, bg: '#0d47a1', fg: '#ffffff' },
  { match: /la gazzetta/i, bg: '#ff2400', fg: '#ffffff' },
  { match: /corriere dello sport/i, bg: '#ff6600', fg: '#ffffff' },
  { match: /tuttosport/i, bg: '#5b21b6', fg: '#ffffff' },
  { match: /la repubblica/i, bg: '#a4001d', fg: '#ffffff' },
  { match: /l.?equipe/i, bg: '#003399', fg: '#ffcc00' },
  { match: /marca/i, bg: '#ff0000', fg: '#ffffff' },
  { match: /^as$/i, bg: '#0033a0', fg: '#ffffff' },
  { match: /bild/i, bg: '#e3000f', fg: '#ffffff' },
  { match: /kicker/i, bg: '#e2001a', fg: '#ffffff' },
  { match: /^ol.$/i, bg: '#ffcc00', fg: '#000000' },
  { match: /fabrizio romano|romano/i, bg: '#1d4ed8', fg: '#ffffff' },
  { match: /di marzio/i, bg: '#0f766e', fg: '#ffffff' },
]

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 38%)`
}

export function getOutletStyle(outletLabel: string): { bg: string; fg: string } {
  const known = OUTLET_BRANDS.find((b) => b.match.test(outletLabel.trim()))
  if (known) return known
  return { bg: hashColor(outletLabel.trim().toLowerCase()), fg: '#ffffff' }
}

export function OutletBadge({ label, className }: { label: string; className?: string }) {
  const { bg, fg } = getOutletStyle(label)
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-wide align-middle', className)}
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  )
}
