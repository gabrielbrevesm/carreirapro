'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Globe2, Database, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClubBadge } from '@/components/shared/ClubBadge'
import { track } from '@/lib/analytics/track'
import { v2Eyebrow } from './tokens'

type ScenarioId = 'result' | 'transfer' | 'injury' | 'crisis'

const TABS: { id: ScenarioId; label: string }[] = [
  { id: 'result', label: 'Resultado' },
  { id: 'transfer', label: 'Transferência' },
  { id: 'injury', label: 'Lesão' },
  { id: 'crisis', label: 'Crise' },
]

const MICROBENEFITS = [
  { icon: Sparkles, label: 'Narrativa dinâmica' },
  { icon: Globe2, label: 'Contexto real' },
  { icon: Database, label: 'Memória da sua carreira' },
  { icon: Languages, label: 'Em português' },
]

function ResultCard() {
  return (
    <div className="space-y-5">
      <p className="text-xs font-medium tracking-wide text-[#AEBCC2] uppercase">Champions League — Semifinal</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center gap-2">
          <ClubBadge name="Roma" className="h-12 w-12" />
          <span className="text-sm font-semibold text-[#F5F7F8]">Roma</span>
        </div>
        <div className="[font-family:var(--font-sans)] text-3xl font-extrabold text-[#F5F7F8]">4 × 0</div>
        <div className="flex flex-1 flex-col items-center gap-2">
          <ClubBadge name="Liverpool" className="h-12 w-12" />
          <span className="text-sm font-semibold text-[#F5F7F8]">Liverpool</span>
        </div>
      </div>
      <div className="space-y-2 rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
        {[
          ['⚽', 'Endrick', '2 gols'],
          ['⚽', 'Liverpool', '61% posse'],
          ['⚽', 'Roma', '9 finalizações no alvo'],
        ].map(([icon, who, stat]) => (
          <div key={who + stat} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[#AEBCC2]">
              <span>{icon}</span> {who}
            </span>
            <span className="font-medium text-[#F5F7F8]">{stat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TransferCard() {
  return (
    <div className="space-y-5">
      <p className="text-xs font-medium tracking-wide text-[#AEBCC2] uppercase">Mercado de transferências</p>
      <p className="text-lg font-semibold text-[#F5F7F8]">Roma negocia jogador do Bayern</p>
      <div className="space-y-2 rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#AEBCC2]">Valor estimado</span>
          <span className="font-medium text-[#F5F7F8]">€62M</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#AEBCC2]">Status</span>
          <span className="rounded-full bg-[#F4B740]/15 px-2.5 py-0.5 text-xs font-medium text-[#F4B740]">Negociação avançada</span>
        </div>
      </div>
    </div>
  )
}

function InjuryCard() {
  return (
    <div className="space-y-5">
      <p className="text-xs font-medium tracking-wide text-[#AEBCC2] uppercase">Departamento médico</p>
      <p className="text-lg font-semibold text-[#F5F7F8]">Koné — desconforto muscular</p>
      <div className="space-y-2 rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#AEBCC2]">Previsão inicial</span>
          <span className="font-medium text-[#F5F7F8]">7–14 dias</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#AEBCC2]">Risco de recorrência</span>
          <span className="rounded-full bg-[#F4B740]/15 px-2.5 py-0.5 text-xs font-medium text-[#F4B740]">Moderado</span>
        </div>
      </div>
    </div>
  )
}

function CrisisCard() {
  return (
    <div className="space-y-5">
      <p className="text-xs font-medium tracking-wide text-[#AEBCC2] uppercase">Momento do clube</p>
      <p className="text-lg font-semibold text-[#F5F7F8]">4 derrotas consecutivas</p>
      <div className="space-y-2 rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#AEBCC2]">Posição na tabela</span>
          <span className="font-medium text-[#F5F7F8]">9º lugar</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#AEBCC2]">Diretoria</span>
          <span className="rounded-full bg-[#E85B4A]/15 px-2.5 py-0.5 text-xs font-medium text-[#E85B4A]">Solicita reunião</span>
        </div>
      </div>
    </div>
  )
}

const SCENARIO_CARDS: Record<ScenarioId, () => React.JSX.Element> = {
  result: ResultCard,
  transfer: TransferCard,
  injury: InjuryCard,
  crisis: CrisisCard,
}

export function HeroSection() {
  const [active, setActive] = useState<ScenarioId>('result')
  const ActiveCard = SCENARIO_CARDS[active]

  return (
    <section id="hero" className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(4,17,24,.94) 0%, rgba(4,17,24,.82) 55%, rgba(4,17,24,.55) 100%), radial-gradient(circle at 85% 20%, rgba(78,238,160,.10), transparent 40%), radial-gradient(circle at 15% 85%, rgba(46,155,107,.10), transparent 35%), linear-gradient(160deg, #0B1B23 0%, #0D2129 45%, #0A1920 100%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <div>
          <p className={`${v2Eyebrow} text-[#4EEEA0]`}>Mais que um modo carreira. Uma história viva.</p>
          <h1 className="[font-family:var(--font-sans)] mt-5 text-[clamp(2.75rem,5vw,4.5rem)] font-extrabold leading-[1.02] tracking-tight text-[#F5F7F8] text-balance">
            Seu modo carreira agora tem um <span className="text-[#4EEEA0]">mundo que reage</span> às suas decisões.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#AEBCC2]">
            Partidas, transferências, lesões e decisões viram matérias, análises e interações com o seu staff — com
            memória da sua carreira.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 bg-[#4EEEA0] px-7 text-base font-semibold text-[#07151D] hover:bg-[#86ECB9]"
            >
              <Link href="/login" onClick={() => track('hero_create_career_click', { section: 'hero' })}>
                Criar minha carreira <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-[rgba(126,166,177,0.35)] px-7 text-base text-[#F5F7F8] hover:bg-white/5"
            >
              <a href="#playground" onClick={() => track('hero_try_scenario_click', { section: 'hero' })}>
                Experimentar uma situação
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
            {MICROBENEFITS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-[#AEBCC2]">
                <Icon className="h-3.5 w-3.5 text-[#4EEEA0]" /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-2xl border border-[rgba(126,166,177,0.20)] bg-[#112631]/90 p-5 shadow-2xl backdrop-blur-sm sm:p-6">
          <div
            className="flex gap-1 rounded-xl bg-[#0D1E27] p-1"
            role="tablist"
            aria-label="Tipos de acontecimento demonstrados"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active === tab.id}
                onClick={() => {
                  setActive(tab.id)
                  track('hero_scenario_change', { scenario: tab.id })
                }}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  active === tab.id ? 'bg-[#4EEEA0] text-[#07151D]' : 'text-[#AEBCC2] hover:text-[#F5F7F8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div key={active} className="mt-5 animate-in fade-in duration-300">
            <ActiveCard />
          </div>

          <a
            href="#historias"
            onClick={() => track('hero_try_scenario_click', { section: 'hero_card' })}
            className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(126,166,177,0.20)] py-3 text-sm font-medium text-[#4EEEA0] transition-colors hover:bg-white/5"
          >
            Ver como o mundo reage <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
