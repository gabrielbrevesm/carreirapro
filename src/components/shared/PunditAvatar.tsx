import { cn } from '@/lib/utils'

// Avatar de iniciais com cor determinística por nome — usado pros comentaristas do "Debate na
// Imprensa". Não busca foto real: são nomes fictícios ou citados de forma genérica pela IA, então
// uma "foto" de verdade seria enganosa; iniciais coloridas dão identidade visual sem inventar.
const PALETTE = [
  'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  'bg-orange-500/15 text-orange-700 dark:text-orange-400',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export function PunditAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        colorForName(name),
        className
      )}
    >
      {initialsForName(name)}
    </div>
  )
}
