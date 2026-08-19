import { ListChecks } from 'lucide-react'

export function RecapSummary({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null

  return (
    <div className="rounded-2xl bg-zinc-900 text-zinc-100 dark:bg-zinc-950 px-4 py-3 space-y-1.5">
      <p className="text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5" /> Para continuar de onde parou
      </p>
      {lines.map((line, i) => (
        <p key={i} className="text-sm leading-relaxed">
          {line}
        </p>
      ))}
      <p className="text-xs text-zinc-400 pt-1">Conte o que aconteceu depois disso no campo abaixo.</p>
    </div>
  )
}
