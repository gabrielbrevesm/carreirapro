'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { LOADING_QUOTES } from '@/lib/loading-quotes'

// Loading leve (SVG + CSS puro, sem libs) — jogador chutando a bola pro gol em loop, com frases
// reais de jogadores/treinadores sobre determinação passando embaixo. Usado em qualquer tela
// onde a geração de conteúdo por IA leva alguns segundos.
export function GoalKickLoader({
  label,
  className,
  showQuotes = true,
}: {
  label?: string
  className?: string
  showQuotes?: boolean
}) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * LOADING_QUOTES.length))

  useEffect(() => {
    if (!showQuotes) return
    const timer = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % LOADING_QUOTES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [showQuotes])

  const quote = LOADING_QUOTES[quoteIndex]

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <svg viewBox="0 0 300 150" className="w-48 h-auto text-foreground" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes gkl-ball {
            0%   { transform: translate(0px, 0px); opacity: 1; }
            36%  { transform: translate(0px, 0px); opacity: 1; }
            40%  { transform: translate(8px, -4px); opacity: 1; }
            58%  { transform: translate(95px, -22px); opacity: 1; }
            72%  { transform: translate(158px, -6px); opacity: 1; }
            76%  { transform: translate(158px, -6px); opacity: 0; }
            77%  { transform: translate(0px, 0px); opacity: 0; }
            100% { transform: translate(0px, 0px); opacity: 1; }
          }
          @keyframes gkl-leg {
            0%, 32%  { transform: rotate(8deg); }
            38%      { transform: rotate(-22deg); }
            42%      { transform: rotate(38deg); }
            50%, 100% { transform: rotate(8deg); }
          }
          @keyframes gkl-net {
            0%, 74% { opacity: 0; transform: scale(1); }
            77%     { opacity: 0.9; transform: scale(1.08); }
            88%, 100% { opacity: 0; transform: scale(1); }
          }
          @keyframes gkl-quote-fade {
            0%   { opacity: 0; transform: translateY(2px); }
            15%  { opacity: 1; transform: translateY(0); }
            85%  { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-2px); }
          }
          .gkl-ball { animation: gkl-ball 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          .gkl-leg { animation: gkl-leg 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0%; }
          .gkl-net { animation: gkl-net 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          .gkl-quote { animation: gkl-quote-fade 4.5s ease-in-out; }
        `}</style>

        <line x1="10" y1="118" x2="290" y2="118" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />

        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.85">
          <line x1="210" y1="50" x2="210" y2="118" />
          <line x1="210" y1="50" x2="270" y2="50" />
          <line x1="270" y1="50" x2="270" y2="118" />
          <g strokeOpacity="0.35" strokeWidth="1.5">
            <line x1="215" y1="55" x2="215" y2="115" />
            <line x1="225" y1="52" x2="225" y2="115" />
            <line x1="235" y1="52" x2="235" y2="115" />
            <line x1="245" y1="52" x2="245" y2="115" />
            <line x1="255" y1="52" x2="255" y2="115" />
            <line x1="265" y1="52" x2="265" y2="115" />
          </g>
        </g>
        <circle className="gkl-net" cx="240" cy="85" r="26" fill="currentColor" fillOpacity="0.15" />

        <g transform="translate(40, 0)">
          <circle cx="20" cy="85" r="9" fill="currentColor" />
          <line x1="20" y1="94" x2="20" y2="112" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="20" y1="98" x2="6" y2="108" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="20" y1="98" x2="34" y2="90" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="20" y1="112" x2="10" y2="118" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <g className="gkl-leg">
            <line x1="20" y1="112" x2="34" y2="118" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>

        <circle className="gkl-ball" cx="70" cy="112" r="6" fill="currentColor" />
      </svg>

      {label && <p className="text-sm text-muted-foreground text-center">{label}</p>}

      {showQuotes && (
        <div key={quoteIndex} className="gkl-quote text-center max-w-xs px-2 min-h-10">
          <p className="text-xs italic text-muted-foreground/90 leading-snug">&ldquo;{quote.quote}&rdquo;</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">— {quote.author}</p>
        </div>
      )}
    </div>
  )
}
