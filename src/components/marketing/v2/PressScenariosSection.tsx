'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { PunditAvatar } from '@/components/shared/PunditAvatar'
import { track } from '@/lib/analytics/track'
import { v2Eyebrow } from './tokens'

type ScenarioId = 'domestic' | 'champions' | 'transfer'

type Scenario = {
  id: ScenarioId
  title: string
  badge: string
  journalists: { name: string; reasons: string[] }[]
  caption: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'domestic',
    title: 'Roma × Lecce',
    badge: 'Mercado doméstico',
    journalists: [
      { name: 'Lele Adani', reasons: ['Mercado italiano', 'Especialista em análise tática', 'Jogo de Serie A'] },
      { name: 'Paolo Condò', reasons: ['Mercado italiano', 'Contexto de campeonato nacional'] },
    ],
    caption: 'Apenas comentaristas italianos. Foco no cenário local.',
  },
  {
    id: 'champions',
    title: 'Roma × Liverpool — Champions',
    badge: 'Champions',
    journalists: [
      { name: 'Lele Adani', reasons: ['Mercado italiano', 'Análise tática de alto nível'] },
      { name: 'Paolo Condò', reasons: ['Mercado italiano', 'Contexto de competição europeia'] },
      { name: 'Jamie Carragher', reasons: ['Mercado inglês envolvido', 'Champions League', 'Partida de alta relevância'] },
      { name: 'Gary Neville', reasons: ['Mercado inglês envolvido', 'Champions League', 'Perfil de comentarista pós-jogo'] },
    ],
    caption: 'Comentaristas italianos e ingleses por se tratar de um grande jogo europeu.',
  },
  {
    id: 'transfer',
    title: 'Roma contrata jogador do Bayern',
    badge: 'Transferência internacional',
    journalists: [
      { name: 'Gianluca Di Marzio', reasons: ['Especialista em mercado italiano', 'Alta credibilidade em transferências'] },
      { name: 'Florian Plettenberg', reasons: ['Especialista em Bayern/Bundesliga', 'Clube de origem envolvido'] },
      { name: 'Fabrizio Romano', reasons: ['Alcance internacional', 'Transferência relevante o suficiente'] },
    ],
    caption: 'Especialistas em transferências, com alcance internacional.',
  },
]

function WhyPopover({ name, reasons }: { name: string; reasons: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-[10px] font-medium text-[#758B8D] hover:text-[#4EEEA0]"
      >
        <HelpCircle className="h-3 w-3" /> por quê?
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-xl border border-[rgba(126,166,177,0.25)] bg-[#0D1E27] p-3 text-left shadow-xl"
        >
          <p className="text-xs font-semibold text-[#F5F7F8]">{name}</p>
          <p className="mt-0.5 text-[10px] tracking-wide text-[#758B8D] uppercase">Motivo</p>
          <ul className="mt-1 space-y-1">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-[11px] text-[#AEBCC2]">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#4EEEA0]" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function PressScenariosSection() {
  const [active, setActive] = useState<ScenarioId>('domestic')
  const scenario = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0]

  return (
    <section className="bg-[#0D1E27] px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <p className={`${v2Eyebrow} text-[#4EEEA0]`}>Inteligência editorial contextual</p>
          <h2 className="[font-family:var(--font-sans)] mt-3 text-[clamp(1.75rem,3vw,2.625rem)] font-extrabold tracking-tight text-[#F5F7F8]">
            A imprensa certa reage ao acontecimento certo
          </h2>
          <p className="mt-3 text-base text-[#AEBCC2]">
            Nosso sistema seleciona automaticamente quem deve falar, de acordo com o contexto.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActive(s.id)
                track('press_scenario_change', { scenario: s.id })
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active === s.id
                  ? 'border-[rgba(78,238,160,0.4)] bg-[#4EEEA0]/8'
                  : 'border-[rgba(126,166,177,0.20)] bg-[#112631] hover:bg-[#16303C]'
              }`}
            >
              <span className="text-xs font-semibold text-[#4EEEA0]">{i + 1}</span>
              <p className="mt-1 text-sm font-semibold text-[#F5F7F8]">{s.title}</p>
              <span className="mt-2 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#AEBCC2] uppercase">
                {s.badge}
              </span>
            </button>
          ))}
        </div>

        <div
          key={scenario.id}
          className="mt-6 animate-in fade-in slide-in-from-bottom-1 rounded-2xl border border-[rgba(126,166,177,0.20)] bg-[#112631] p-6 duration-300"
        >
          <div className="flex flex-wrap gap-6">
            {scenario.journalists.map((j) => (
              <div key={j.name} className="flex flex-col items-center gap-2 text-center">
                <PunditAvatar name={j.name} className="h-14 w-14" />
                <p className="text-xs font-medium text-[#F5F7F8]">{j.name}</p>
                <WhyPopover name={j.name} reasons={j.reasons} />
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-[rgba(126,166,177,0.15)] pt-4 text-sm text-[#AEBCC2]">{scenario.caption}</p>
        </div>
      </div>
    </section>
  )
}
