import { Newspaper, BrainCircuit, Briefcase, Cross, Globe2, MessageCircleQuestion } from 'lucide-react'
import { PunditAvatar } from '@/components/shared/PunditAvatar'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { v2Card, v2CardHover, v2Eyebrow } from './tokens'

function SectionShell({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className={`${v2Card} ${v2CardHover} flex h-full flex-col gap-4 p-5`}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4EEEA0]/12 text-[#4EEEA0]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-[#F5F7F8]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function PressCard() {
  return (
    <SectionShell title="Imprensa" icon={Newspaper}>
      <div className="rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
        <p className="text-[10px] font-semibold tracking-widest text-[#4EEEA0] uppercase">La Gazzetta dello Sport</p>
        <p className="mt-2 text-sm font-bold leading-snug text-[#F5F7F8]">
          Roma atropela Liverpool e coloca um pé na final
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#AEBCC2]">
          Uma atuação de time grande. A Roma foi intensa, vertical e mostrou que acredita no título.
        </p>
        <div className="mt-3 flex items-center gap-2 border-t border-[rgba(126,166,177,0.15)] pt-3">
          <PunditAvatar name="Lele Adani" className="h-7 w-7" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#F5F7F8]">Lele Adani</p>
            <p className="text-[11px] text-[#758B8D]">Comentarista</p>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

function AssistantCard() {
  const points = ['Pressão alta no 1º tempo', 'Triangulações pelo lado esquerdo', 'Endrick em grande fase', 'Boa compactação defensiva']
  return (
    <SectionShell title="Auxiliar técnico" icon={BrainCircuit}>
      <ul className="space-y-1.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-xs text-[#AEBCC2]">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#4EEEA0]" />
            {p}
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-[#0D1E27] p-3.5">
        <p className="text-xs leading-relaxed text-[#F5F7F8] italic">
          &ldquo;Mantivemos o plano de jogo à risca. A equipe respondeu muito bem.&rdquo;
        </p>
      </div>
    </SectionShell>
  )
}

function DirectorCard() {
  return (
    <SectionShell title="Diretor técnico" icon={Briefcase}>
      <p className="text-xs leading-relaxed text-[#AEBCC2]">
        &ldquo;Resultado impressionante. Isso valoriza o elenco e nos coloca em uma posição forte no mercado.
        Precisamos aproveitar esse momento para reforçar o ataque na próxima janela, especialmente com ponta
        esquerda e um volante.&rdquo;
      </p>
      <div className="mt-auto flex items-center gap-2 border-t border-[rgba(126,166,177,0.15)] pt-3">
        <PunditAvatar name="Florent Ghisolfi" className="h-7 w-7" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#F5F7F8]">Florent Ghisolfi</p>
          <p className="text-[11px] text-[#758B8D]">Diretor Técnico</p>
        </div>
      </div>
    </SectionShell>
  )
}

function MedicalCard() {
  return (
    <SectionShell title="Departamento médico" icon={Cross}>
      <div className="flex items-center gap-2.5">
        <PlayerAvatar name="Koné" className="h-9 w-9" />
        <div>
          <p className="text-sm font-semibold text-[#F5F7F8]">Koné</p>
          <p className="text-xs text-[#AEBCC2]">Desconforto muscular</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#AEBCC2]">Risco de lesão</span>
        <span className="rounded-full bg-[#F4B740]/15 px-2.5 py-0.5 font-medium text-[#F4B740]">Moderado</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#AEBCC2]">Previsão de retorno</span>
        <span className="font-medium text-[#F5F7F8]">7 a 14 dias</span>
      </div>
      <div className="rounded-xl bg-[#0D1E27] p-3.5">
        <p className="text-xs leading-relaxed text-[#F5F7F8]">Sentiu no 2º tempo. Será reavaliado amanhã.</p>
      </div>
    </SectionShell>
  )
}

function InternationalCard() {
  return (
    <SectionShell title="Repercussão internacional" icon={Globe2}>
      <div className="flex -space-x-2">
        {['Paolo Condò', 'Jamie Carragher', 'Gary Neville'].map((name) => (
          <PunditAvatar key={name} name={name} className="h-9 w-9 border-2 border-[#112631]" />
        ))}
      </div>
      <div className="rounded-xl bg-[#0D1E27] p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#4EEEA0]">
          <MessageCircleQuestion className="h-3.5 w-3.5" /> Por que eles estão falando?
        </p>
        <p className="mt-1.5 text-xs text-[#AEBCC2]">Semifinal de Champions · Roma × Liverpool</p>
      </div>
      <p className="text-xs leading-relaxed text-[#F5F7F8] italic">
        &ldquo;Uma vitória que repercute em toda a Europa. A Roma está de volta entre os grandes.&rdquo;
      </p>
    </SectionShell>
  )
}

export function FiveStoriesSection() {
  return (
    <section id="historias" className="bg-[#0D1E27] px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <p className={`${v2Eyebrow} text-[#4EEEA0]`}>O que o mundo faz com a sua carreira</p>
          <h2 className="[font-family:var(--font-sans)] mt-3 text-[clamp(1.75rem,3vw,2.625rem)] font-extrabold tracking-tight text-[#F5F7F8]">
            Uma partida. Cinco histórias.
          </h2>
          <p className="mt-3 text-base text-[#AEBCC2]">
            O mesmo jogo, diferentes perspectivas. Um mundo real reagindo às suas decisões.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <PressCard />
          <AssistantCard />
          <DirectorCard />
          <MedicalCard />
          <InternationalCard />
        </div>
      </div>
    </section>
  )
}
