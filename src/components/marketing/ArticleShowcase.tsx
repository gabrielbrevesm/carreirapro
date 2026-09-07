'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const EXAMPLES = [
  {
    image: '/mockups/article-1.png',
    outlet: 'The Guardian',
    fact: 'Antony e Solanke marcaram, mas o time só empatou de novo',
  },
  {
    image: '/mockups/article-2.png',
    outlet: 'Sky Sports',
    fact: 'Vencemos de virada por 6 a 4, jogo de loucos, mas o goleiro vacilou demais',
  },
  {
    image: '/mockups/article-3.png',
    outlet: "L'Équipe",
    fact: 'Fui visto jantando com o Vinícius Jr em Mônaco e já falam em Real Madrid',
  },
] as const

type Phase = 'typing' | 'loading' | 'done'

export function ArticleShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('typing')
  const [typed, setTyped] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const runDemo = (index: number) => {
    clearTimers()
    setActiveIndex(index)
    setPhase('typing')
    setTyped('')
    const fact = EXAMPLES[index].fact
    for (let i = 0; i < fact.length; i++) {
      timers.current.push(setTimeout(() => setTyped(fact.slice(0, i + 1)), 26 * i))
    }
    timers.current.push(
      setTimeout(() => {
        setPhase('loading')
        timers.current.push(setTimeout(() => setPhase('done'), 1300))
      }, 26 * fact.length + 350)
    )
  }

  useEffect(() => {
    timers.current.push(setTimeout(() => runDemo(0), 500))
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = EXAMPLES[activeIndex]

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1fr]">
      <div>
        <p className="[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] text-[#1E8F5E] uppercase">
          Veja a redação em ação
        </p>
        <h2 className="[font-family:var(--font-display)] mt-3 text-4xl tracking-wide sm:text-5xl">MANDE O FATO. RECEBA A MATÉRIA.</h2>
        <p className="mt-4 max-w-md text-[#12151A]/70">
          É assim, todo santo dia da sua carreira: você conta o que aconteceu no jogo, e a redação devolve a
          cobertura completa — manchete, capa e texto — em menos de um minuto.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {EXAMPLES.map((example, i) => (
            <button
              key={example.outlet}
              type="button"
              onClick={() => runDemo(i)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-medium tracking-wide uppercase transition-colors',
                i === activeIndex
                  ? 'border-[#1E8F5E] bg-[#1E8F5E]/10 text-[#1E8F5E]'
                  : 'border-[#12151A]/15 text-[#12151A]/60 hover:border-[#12151A]/30'
              )}
            >
              {example.outlet}
            </button>
          ))}
        </div>

        {phase === 'done' && (
          <button
            type="button"
            onClick={() => runDemo(activeIndex)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#12151A]/60 hover:text-[#12151A]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Ver de novo
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-[280px]">
        <div className="mb-4 rounded-full border border-[#12151A]/15 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="text-[#12151A]/40">Fato do jogo: </span>
          <span className="text-[#12151A]/85">{typed}</span>
          {phase === 'typing' && <span className="-mb-0.5 ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#1E8F5E]" />}
        </div>

        <div
          className={cn(
            'relative aspect-[860/1928] w-full overflow-hidden rounded-[2.2rem] shadow-2xl',
            phase !== 'done' && 'border border-[#12151A]/10 bg-white'
          )}
        >
          {phase !== 'done' ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              {phase === 'loading' ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-[#1E8F5E]" />
                  <p className="text-xs font-medium tracking-wide text-[#12151A]/50 uppercase">Escrevendo matéria...</p>
                </>
              ) : (
                <div className="w-full space-y-3 opacity-40">
                  <div className="mx-auto aspect-4/3 w-full rounded-lg bg-[#12151A]/10" />
                  <div className="mx-auto h-3 w-3/4 rounded bg-[#12151A]/15" />
                  <div className="mx-auto h-3 w-1/2 rounded bg-[#12151A]/15" />
                </div>
              )}
            </div>
          ) : (
            <img
              key={active.image}
              src={active.image}
              alt={`Exemplo de matéria: ${active.outlet}`}
              className="h-full w-full animate-in fade-in zoom-in-95 object-cover duration-500"
            />
          )}
        </div>
      </div>
    </div>
  )
}
