'use client'

import { useState } from 'react'
import { ArrowRight, Database, Lock, Sparkles } from 'lucide-react'
import { PunditAvatar } from '@/components/shared/PunditAvatar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/track'
import { v2Eyebrow } from './tokens'

const TIMELINE = [
  { month: 'Agosto', title: 'Adani duvida de Hollerbach', body: '"Ainda não vejo nível para ser titular da Roma."' },
  { month: 'Setembro', title: 'Hollerbach assume titularidade', body: 'Sequência de boas atuações convence o treinador.' },
  { month: 'Outubro', title: '4 gols + 5 assistências', body: 'Hollerbach se torna um dos destaques da temporada.' },
  { month: 'Novembro', title: 'Adani revisa sua opinião', body: '"Preciso rever o que disse. Hollerbach me calou."' },
]

const EXAMPLE_INPUT =
  'Vencemos a Juventus por 4x2. Estávamos perdendo por 2x0. Endrick marcou dois e Openda deu três assistências.'
const MAX_LEN = 500
const MIN_LEN = 20

const LOADING_STEPS = ['Contexto analisado', 'Imprensa selecionada', 'Staff consultado', 'Criando repercussão...']

function MemoryTimeline() {
  return (
    <div>
      <p className={`${v2Eyebrow} text-[#4EEEA0]`}>Continuidade real</p>
      <h2 className="[font-family:var(--font-sans)] mt-3 text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold tracking-tight text-[#F5F7F8]">
        Sua carreira não recomeça a cada mensagem
      </h2>
      <p className="mt-3 max-w-md text-sm text-[#AEBCC2]">
        O CarreiraPRO lembra do que aconteceu. Críticas, transferências, lesões e decisões fazem parte da sua
        história.
      </p>

      <ol className="relative mt-8 space-y-6 border-l border-[rgba(126,166,177,0.25)] pl-6">
        {TIMELINE.map((t) => (
          <li key={t.month} className="relative">
            <span className="absolute top-1 -left-[29px] h-3 w-3 rounded-full border-2 border-[#0D1E27] bg-[#4EEEA0]" />
            <div className="flex items-center gap-2">
              <PunditAvatar name="Lele Adani" className="h-6 w-6" />
              <p className="text-[11px] font-medium tracking-wide text-[#758B8D] uppercase">{t.month}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#F5F7F8]">{t.title}</p>
            <p className="text-sm text-[#AEBCC2] italic">{t.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-[rgba(126,166,177,0.20)] bg-[#112631] p-5">
        <Database className="h-5 w-5 text-[#4EEEA0]" />
        <p className="mt-2 text-sm font-semibold text-[#4EEEA0]">Memória que constrói histórias reais.</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#AEBCC2]">
          O sistema lembra o que foi dito, quem criticou, quem você contratou, quem se lesionou e como você
          respondeu. Tudo isso influencia as reações futuras.
        </p>
      </div>
    </div>
  )
}

type PlaygroundState = 'idle' | 'loading' | 'result'

function Playground() {
  const [input, setInput] = useState('')
  const [state, setState] = useState<PlaygroundState>('idle')
  const [stepIndex, setStepIndex] = useState(0)

  const canSubmit = input.trim().length >= MIN_LEN && state !== 'loading'

  const handleSubmit = () => {
    if (!canSubmit) return
    track('playground_submit', { length: input.trim().length })
    setState('loading')
    setStepIndex(0)

    const stepDelay = 450
    LOADING_STEPS.forEach((_, i) => {
      setTimeout(() => setStepIndex(i + 1), stepDelay * (i + 1))
    })
    setTimeout(
      () => {
        setState('result')
        track('playground_result', {})
      },
      stepDelay * LOADING_STEPS.length + 300
    )
  }

  return (
    <div id="playground" className="rounded-2xl border border-[rgba(126,166,177,0.20)] bg-[#112631] p-6">
      <p className={`${v2Eyebrow} text-[#4EEEA0]`}>Demonstração</p>
      <h2 className="[font-family:var(--font-sans)] mt-3 text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold tracking-tight text-[#F5F7F8]">
        Experimente agora
      </h2>
      <p className="mt-2 text-sm text-[#AEBCC2]">Digite uma situação da sua carreira e veja o mundo reagir.</p>

      {state !== 'result' ? (
        <div className="mt-5 space-y-3">
          <label htmlFor="playground-input" className="sr-only">
            Situação da sua carreira
          </label>
          <Textarea
            id="playground-input"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
            placeholder={`Ex.: ${EXAMPLE_INPUT}`}
            rows={4}
            disabled={state === 'loading'}
            className="resize-none border-[rgba(126,166,177,0.25)] bg-[#0D1E27] text-[#F5F7F8] placeholder:text-[#556269] focus-visible:ring-[#4EEEA0]/40"
          />
          <div className="flex items-center justify-between text-xs text-[#758B8D]">
            <span>
              {input.length}/{MAX_LEN}
            </span>
            {input.length === 0 && (
              <button type="button" className="text-[#4EEEA0] hover:underline" onClick={() => setInput(EXAMPLE_INPUT)}>
                Usar exemplo
              </button>
            )}
          </div>

          {state === 'loading' ? (
            <div className="rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
              <p className="text-sm font-medium text-[#4EEEA0]">O mundo está reagindo...</p>
              <ul className="mt-2 space-y-1.5">
                {LOADING_STEPS.map((step, i) => (
                  <li key={step} className="flex items-center gap-2 text-xs text-[#AEBCC2]">
                    <span className={i < stepIndex ? 'text-[#4EEEA0]' : 'text-[#556269]'}>
                      {i < stepIndex ? '✓' : '●'}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full gap-2 bg-[#4EEEA0] text-[#07151D] hover:bg-[#86ECB9] disabled:opacity-40"
            >
              Gerar repercussão <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-3 animate-in fade-in duration-300">
          <div className="rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
            <p className="text-[10px] font-semibold tracking-widest text-[#4EEEA0] uppercase">Manchete</p>
            <p className="mt-1.5 text-sm font-bold leading-snug text-[#F5F7F8]">
              Roma mostra poder de reação e vence a Juventus em jogaço
            </p>
            <p className="mt-1 text-xs text-[#AEBCC2]">
              &ldquo;De 2 a 0 para 4 a 2. Uma noite para entrar na história da temporada.&rdquo;
            </p>
          </div>

          <div className="rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
            <div className="flex items-center gap-2">
              <PunditAvatar name="Lele Adani" className="h-6 w-6" />
              <p className="text-xs font-semibold text-[#F5F7F8]">Lele Adani</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#AEBCC2] italic">
              &ldquo;Essa é a Roma que eu quero ver. Personalidade, qualidade e um Endrick decisivo. Openda foi o
              maestro da virada.&rdquo;
            </p>
          </div>

          <div className="rounded-xl border border-[rgba(126,166,177,0.20)] bg-[#0D1E27] p-4">
            <p className="text-[10px] font-semibold tracking-widest text-[#4EEEA0] uppercase">Análise do auxiliar</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#AEBCC2]">
              A equipe mostrou resiliência e manteve a intensidade mesmo em desvantagem. A entrada de Openda mudou o
              jogo, e o posicionamento de Endrick entre os zagueiros foi fundamental.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {['Continuar conversa com o auxiliar', 'Ver reação do diretor técnico'].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => track('playground_pro_click', { feature: label })}
                className="flex w-full items-center gap-2 rounded-lg border border-[rgba(126,166,177,0.20)] bg-white/[0.02] px-3 py-2.5 text-left text-xs text-[#AEBCC2] hover:bg-white/5"
              >
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#758B8D]" />
                <span className="flex-1">{label}</span>
                <span className="rounded-full bg-[#4EEEA0]/15 px-2 py-0.5 text-[10px] font-bold text-[#4EEEA0]">PRO</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setState('idle')
              setInput('')
            }}
            className="flex w-full items-center justify-center gap-1.5 pt-1 text-xs font-medium text-[#4EEEA0] hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" /> Tentar outra situação
          </button>
        </div>
      )}
    </div>
  )
}

export function MemoryPlaygroundSection() {
  return (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 lg:grid-cols-2">
        <MemoryTimeline />
        <Playground />
      </div>
    </section>
  )
}
