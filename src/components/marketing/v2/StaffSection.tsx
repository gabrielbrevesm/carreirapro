'use client'

import { useState } from 'react'
import { Briefcase, BrainCircuit, Cross, Crown, Search, Database } from 'lucide-react'
import { PunditAvatar } from '@/components/shared/PunditAvatar'
import { track } from '@/lib/analytics/track'
import { v2Eyebrow } from './tokens'

type StaffId = 'director' | 'assistant' | 'medical' | 'president' | 'scout'

const STAFF_NAV: { id: StaffId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'director', label: 'Diretor Técnico', icon: Briefcase },
  { id: 'assistant', label: 'Auxiliar Técnico', icon: BrainCircuit },
  { id: 'medical', label: 'Departamento Médico', icon: Cross },
  { id: 'president', label: 'Presidente', icon: Crown },
  { id: 'scout', label: 'Scout', icon: Search },
]

const SUGGESTIONS = [
  { player: 'Nico Williams', profile: 'Velocidade e drible', value: '€40–50M' },
  { player: 'Kaoru Mitoma', profile: 'Técnico e versátil', value: '€35–45M' },
  { player: 'Rafael Leão', profile: 'Experiência e impacto', value: '€70–80M' },
  { player: 'Gabriel Martinelli', profile: 'Jovem e potencial', value: '€50–60M' },
]

function DirectorPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[rgba(126,166,177,0.15)] px-5 py-4">
        <PunditAvatar name="Florent Ghisolfi" className="h-10 w-10" />
        <div>
          <p className="text-sm font-semibold text-[#F5F7F8]">Florent Ghisolfi</p>
          <p className="text-xs text-[#AEBCC2]">Diretor Técnico</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-[#4EEEA0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4EEEA0]" /> Online
        </span>
      </div>

      <div className="flex-1 space-y-3 p-5">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#4EEEA0] px-4 py-2.5 text-sm text-[#07151D]">
            Temos €45 milhões. Quero contratar um ponta esquerda. O que você acha?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#0D1E27] px-4 py-2.5 text-sm leading-relaxed text-[#F5F7F8]">
            Com nosso orçamento de €45 milhões, podemos buscar um ponta esquerda de bom nível. Considerando nosso
            estilo de jogo e as carências do elenco, eu separaria alguns nomes interessantes que se encaixam no
            perfil que você procura. Vale lembrar que precisamos manter margem para outras posições prioritárias,
            como o volante defensivo.
          </div>
        </div>
      </div>
    </div>
  )
}

function BulletPanel({ title, sections }: { title: string; sections: { label: string; items: string[] }[] }) {
  return (
    <div className="space-y-5 p-5">
      <p className="text-xs font-semibold tracking-widest text-[#4EEEA0] uppercase">{title}</p>
      {sections.map((s) => (
        <div key={s.label} className="space-y-2">
          <p className="text-xs font-medium text-[#AEBCC2]">{s.label}</p>
          <ul className="space-y-1.5">
            {s.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#F5F7F8]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4EEEA0]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

const PANELS: Record<Exclude<StaffId, 'director'>, React.JSX.Element> = {
  assistant: (
    <BulletPanel
      title="Análise da última partida"
      sections={[
        { label: 'Pontos positivos', items: ['Pressão alta funcionou no 1º tempo', 'Boa compactação defensiva'] },
        { label: 'Pontos de atenção', items: ['Transições lentas no 2º tempo', 'Lateral direito exposto em contra-ataques'] },
        { label: 'Sugestão tática', items: ['Openda pode ganhar espaço entrando aos 60min'] },
      ]}
    />
  ),
  medical: (
    <BulletPanel
      title="Departamento médico"
      sections={[
        { label: 'Lesionados', items: ['Koné — desconforto muscular, retorno em 7–14 dias'] },
        { label: 'Disponibilidade', items: ['Van den Berg apto, com carga controlada'] },
        { label: 'Recomendação', items: ['Limitar minutagem de Koné nas próximas 2 partidas'] },
      ]}
    />
  ),
  president: (
    <BulletPanel
      title="Presidente"
      sections={[
        { label: 'Momento do clube', items: ['Confiança em alta após a classificação'] },
        { label: 'Objetivos', items: ['Cobrança por título ainda nesta temporada'] },
        { label: 'Decisão relevante', items: ['Orçamento extra aprovado para a janela de inverno'] },
      ]}
    />
  ),
  scout: (
    <div className="space-y-5 p-5">
      <p className="text-xs font-semibold tracking-widest text-[#4EEEA0] uppercase">Sugestões de jogadores</p>
      <div className="overflow-x-auto rounded-xl border border-[rgba(126,166,177,0.15)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(126,166,177,0.15)] text-xs text-[#758B8D]">
              <th className="px-3 py-2 font-medium">Jogador</th>
              <th className="px-3 py-2 font-medium">Perfil</th>
              <th className="px-3 py-2 font-medium">Valor estimado</th>
            </tr>
          </thead>
          <tbody>
            {SUGGESTIONS.map((row) => (
              <tr key={row.player} className="border-b border-[rgba(126,166,177,0.08)] last:border-0">
                <td className="px-3 py-2.5 font-medium text-[#F5F7F8]">{row.player}</td>
                <td className="px-3 py-2.5 text-[#AEBCC2]">{row.profile}</td>
                <td className="px-3 py-2.5 text-[#F5F7F8]">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-[#758B8D]">
        <Database className="h-3.5 w-3.5 text-[#4EEEA0]" /> Ele conhece seu elenco, orçamento e decisões anteriores.
      </p>
    </div>
  ),
}

export function StaffSection() {
  const [active, setActive] = useState<StaffId>('director')

  return (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <p className={`${v2Eyebrow} text-[#4EEEA0]`}>Seu staff está sempre por perto</p>
          <h2 className="[font-family:var(--font-sans)] mt-3 text-[clamp(1.75rem,3vw,2.625rem)] font-extrabold tracking-tight text-[#F5F7F8]">
            Seu clube tem pessoas. Converse com elas.
          </h2>
          <p className="mt-3 text-base text-[#AEBCC2]">
            Converse com seu staff, diretoria e departamento médico. Eles conhecem sua realidade.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-[rgba(126,166,177,0.20)] bg-[#112631] lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-1 overflow-x-auto border-b border-[rgba(126,166,177,0.15)] p-3 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
            {STAFF_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActive(id)
                  track('staff_actor_change', { actor: id })
                }}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors lg:whitespace-normal ${
                  active === id
                    ? 'border border-[rgba(78,238,160,0.35)] bg-[#4EEEA0]/10 text-[#4EEEA0]'
                    : 'border border-transparent text-[#AEBCC2] hover:bg-white/5 hover:text-[#F5F7F8]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div key={active} className="min-h-[380px] animate-in fade-in duration-300">
            {active === 'director' ? <DirectorPanel /> : PANELS[active]}
          </div>
        </div>
      </div>
    </section>
  )
}
