'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Newspaper, Briefcase, BrainCircuit, Cross, Share2 } from 'lucide-react'
import { ClubBadge } from '@/components/shared/ClubBadge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { track } from '@/lib/analytics/track'
import { v2Eyebrow } from './tokens'

type Reaction = 'press' | 'director' | 'assistant' | 'medical' | 'social'

const REACTION_META: Record<Reaction, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  press: { label: 'Imprensa', icon: Newspaper },
  director: { label: 'Diretor', icon: Briefcase },
  assistant: { label: 'Auxiliar', icon: BrainCircuit },
  medical: { label: 'Médico', icon: Cross },
  social: { label: 'Redes', icon: Share2 },
}

type DemoEvent = {
  id: string
  date: string
  title: string
  description: string
  reactions: Reaction[]
  detail: { headline: string; staffReaction: string; consequence: string; futureReference: string }
}

const DEMO_EVENTS: DemoEvent[] = [
  {
    id: 'endrick',
    date: '15 AGO',
    title: 'Roma anuncia Endrick',
    description: 'Jovem brasileiro chega por €52 milhões.',
    reactions: ['press', 'director', 'social'],
    detail: {
      headline: '"Roma aposta alto no futuro" — a chegada do brasileiro mais cobiçado do mercado',
      staffReaction: 'Diretor técnico: "Um investimento que reflete nossa ambição para as próximas temporadas."',
      consequence: 'Expectativa da torcida sobe imediatamente; concorrência interna pelo ataque se intensifica.',
      futureReference: 'Voltará a aparecer quando Endrick estrear e, depois, quando decidir jogos importantes.',
    },
  },
  {
    id: 'vdb',
    date: '02 SET',
    title: 'Van den Berg lesionado',
    description: 'Zagueiro deve ficar 3 semanas fora.',
    reactions: ['medical', 'press'],
    detail: {
      headline: '"Desfalque na zaga" — departamento médico confirma lesão muscular',
      staffReaction: 'Departamento médico: "Sem risco de agravamento, mas a cautela é necessária."',
      consequence: 'Auxiliar técnico reorganiza a defesa para os próximos três jogos.',
      futureReference: 'Retorno vira notícia própria — e referência quando a defesa voltar a vacilar sem ele.',
    },
  },
  {
    id: 'colwill',
    date: '21 OUT',
    title: 'Colwill brilha contra Atalanta',
    description: 'Atuação de gala do zagueiro inglês.',
    reactions: ['press', 'assistant'],
    detail: {
      headline: '"A revelação da zaga" — Colwill vira assunto na imprensa italiana',
      staffReaction: 'Auxiliar técnico: "Ele ganhou a confiança do sistema — não sai mais do time."',
      consequence: 'Colwill assume a titularidade de forma consolidada.',
      futureReference: 'Passa a ser citado como referência de consistência defensiva em matérias futuras.',
    },
  },
  {
    id: 'napoli',
    date: '05 NOV',
    title: 'Roma 4×0 Napoli',
    description: 'Time assume a ponta e liderança da Serie A.',
    reactions: ['press', 'assistant', 'director'],
    detail: {
      headline: '"Roma impõe autoridade e assume a liderança" — goleada sobre o Napoli reacende o sonho do título',
      staffReaction: 'Diretor técnico: "Esse resultado nos coloca numa posição de força para a janela de inverno."',
      consequence: 'Pressão por manter o nível sobe; imprensa passa a tratar a Roma como candidata ao título.',
      futureReference: 'Vira ponto de comparação em toda sequência de resultados ruins que vier depois.',
    },
  },
]

export function DemoCareerSection() {
  const [openEvent, setOpenEvent] = useState<DemoEvent | null>(null)

  return (
    <section id="carreira-demo" className="px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`${v2Eyebrow} text-[#4EEEA0]`}>Veja funcionando de verdade</p>
            <h2 className="[font-family:var(--font-sans)] mt-3 text-[clamp(1.75rem,3vw,2.625rem)] font-extrabold tracking-tight text-[#F5F7F8]">
              Carreira demonstração
            </h2>
            <p className="mt-2 text-sm text-[#AEBCC2]">Marco Ferreira — AS Roma · Temporada 2028/29</p>
          </div>
          <Link
            href="/login"
            onClick={() => track('demo_career_event_click', { action: 'ver_mais' })}
            className="flex items-center gap-1.5 text-sm font-medium text-[#4EEEA0] hover:underline"
          >
            Ver mais <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 space-y-2">
          {DEMO_EVENTS.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => {
                setOpenEvent(event)
                track('demo_career_event_click', { event: event.id })
              }}
              className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#112631] p-4 text-left transition-colors hover:bg-[#16303C] sm:flex-nowrap"
            >
              <span className="w-14 shrink-0 text-xs font-semibold tracking-wide text-[#758B8D] uppercase">{event.date}</span>
              <ClubBadge name="Roma" className="h-8 w-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#F5F7F8]">{event.title}</p>
                <p className="truncate text-xs text-[#AEBCC2]">{event.description}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {event.reactions.map((r) => {
                  const { label, icon: Icon } = REACTION_META[r]
                  return (
                    <span
                      key={r}
                      title={label}
                      className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-[#AEBCC2]"
                    >
                      <Icon className="h-3 w-3 text-[#4EEEA0]" />
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                  )
                })}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!openEvent} onOpenChange={(open) => !open && setOpenEvent(null)}>
        <DialogContent className="border-[rgba(126,166,177,0.25)] bg-[#112631] text-[#F5F7F8] sm:max-w-lg">
          {openEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#F5F7F8]">{openEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {[
                  { label: 'Evento', value: openEvent.description },
                  { label: 'Matéria', value: openEvent.detail.headline },
                  { label: 'Reação do staff', value: openEvent.detail.staffReaction },
                  { label: 'Consequências', value: openEvent.detail.consequence },
                  { label: 'Referências futuras', value: openEvent.detail.futureReference },
                ].map((row, i, arr) => (
                  <div key={row.label} className="relative pl-5">
                    {i < arr.length - 1 && <span className="absolute top-5 left-[3px] h-full w-px bg-[rgba(126,166,177,0.25)]" />}
                    <span className="absolute top-1 left-0 h-1.5 w-1.5 rounded-full bg-[#4EEEA0]" />
                    <p className="text-[10px] font-semibold tracking-widest text-[#4EEEA0] uppercase">{row.label}</p>
                    <p className="mt-1 leading-relaxed text-[#AEBCC2]">{row.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
