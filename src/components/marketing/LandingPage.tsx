import Link from 'next/link'
import { Bebas_Neue, Source_Serif_4 } from 'next/font/google'
import {
  ArrowRight,
  BarChart,
  Camera,
  Check,
  Clock,
  Newspaper,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArticleShowcase } from '@/components/marketing/ArticleShowcase'
import { ContactsShowcase } from '@/components/marketing/ContactsShowcase'

const display = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
})

const editorial = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
})

const displayFont = '[font-family:var(--font-display)]'
const editorialFont = '[font-family:var(--font-editorial)]'

const TICKER_ITEMS = [
  'MATÉRIAS GERADAS POR IA',
  'IMAGENS EDITORIAIS EM SEGUNDOS',
  'ANÁLISE DE ELENCO POR IA',
  'MERCADO DE TRANSFERÊNCIAS ATUALIZADO TODO DIA',
  'TIMELINE COMPLETA DA SUA CARREIRA',
]

const FEATURES = [
  {
    icon: Newspaper,
    title: 'Matérias geradas por IA',
    body: 'Registre um resultado, uma contratação ou uma demissão polêmica e a redação transforma isso em matéria, no estilo dos grandes veículos esportivos.',
    rotate: '-rotate-1',
  },
  {
    icon: Camera,
    title: 'Imagens editoriais',
    body: 'Cada matéria pode vir com uma capa gerada por IA — do gramado à coletiva de imprensa, no estilo de um grande jornal esportivo.',
    rotate: 'rotate-1',
  },
  {
    icon: Clock,
    title: 'Timeline da carreira',
    body: 'Toda contratação, toda saída, toda decisão fica registrada numa linha do tempo — a história completa da sua passagem pelo clube.',
    rotate: 'rotate-1',
  },
  {
    icon: Shield,
    title: 'Análise de elenco',
    body: 'A IA lê o seu elenco e aponta pontos fortes, fragilidades e ajustes táticos — como um analista de desempenho de verdade.',
    rotate: '-rotate-1',
  },
  {
    icon: Users,
    title: 'Sugestões de contratação',
    body: 'Depois de 5 eventos registrados, a IA aprende o seu estilo de jogo e sugere reforços sob medida para o seu sistema tático.',
    rotate: 'rotate-1',
  },
  {
    icon: TrendingUp,
    title: 'Feed de mercado real',
    body: 'As transferências do futebol de verdade, sincronizadas todo dia — pra você especular contratações com contexto real.',
    rotate: '-rotate-1',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Crie sua carreira',
    body: 'Nome do técnico, clube e ponto de partida da sua passagem.',
  },
  {
    n: '02',
    title: 'Registre os eventos',
    body: 'Resultados, contratações, saídas e decisões da sua temporada.',
  },
  {
    n: '03',
    title: 'Receba a cobertura',
    body: 'Matéria, imagem editorial e timeline atualizadas em minutos.',
  },
  {
    n: '04',
    title: 'Vire Pro quando quiser',
    body: 'Mais carreiras em paralelo, análise de elenco e sugestões de contratação sob medida.',
  },
]

const FREE_ITEMS = [
  '1ª carreira ilimitada, gere quantas matérias quiser',
  'Questionário de história do técnico do seu save',
  'Imagens editoriais em todas as matérias da sua primeira carreira',
  'Timeline completa da carreira',
  'Contatos: receba mensagens do presidente do clube, do diretor esportivo e departamento médico',
]

const PRO_ITEMS = [
  'Crie quantas carreiras quiser, ainda mais liberdade',
  'Tudo do plano Free em cada uma delas',
  'Análise de elenco por IA',
  'Sugestões de contratação por estilo de jogo',
  'Feed de mercado dos últimos 30 dias',
  'Cancele quando quiser',
]

const FAQ = [
  {
    q: 'Preciso ter o EA FC pra usar o CarreiraPRO?',
    a: 'Sim. O CarreiraPRO acompanha a sua carreira dentro do jogo — você registra o que acontece na sua temporada e a redação cobre.',
  },
  {
    q: 'Eu escrevo a matéria ou a IA faz tudo sozinha?',
    a: 'Você registra os eventos principais — resultado, contratação, decisão — e a IA escreve a matéria no estilo editorial de um grande veículo esportivo.',
  },
  {
    q: 'Posso cancelar o plano Pro quando quiser?',
    a: 'Sim. É uma assinatura mensal, sem fidelidade. Cancele quando quiser direto nas configurações da sua conta.',
  },
  {
    q: 'E se eu quiser jogar mais de uma carreira ao mesmo tempo?',
    a: 'Sua primeira carreira é gratuita para sempre, com matérias e imagens ilimitadas. Pra criar uma segunda carreira em paralelo, é só assinar o Pro.',
  },
]

export function LandingPage() {
  return (
    <div className={`${display.variable} ${editorial.variable} bg-[#EFF1EC] text-[#12151A]`}>
      <style>{`
        @keyframes cpro-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .cpro-marquee-track { animation: cpro-marquee 32s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cpro-marquee-track { animation: none; }
        }
      `}</style>

      {/* Masthead */}
      <header className="sticky top-0 z-40 border-b border-[#12151A]/10 bg-[#EFF1EC]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#12151A] text-[#EFF1EC]">
              <Newspaper className="h-4 w-4" />
            </span>
            <span className={`${displayFont} text-2xl leading-none tracking-wide`}>
              CARREIRAPRO
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#12151A]/70 md:flex">
            <a href="#recursos" className="transition-colors hover:text-[#12151A]">
              Recursos
            </a>
            <a href="#como-funciona" className="transition-colors hover:text-[#12151A]">
              Como funciona
            </a>
            <a href="#exemplos" className="transition-colors hover:text-[#12151A]">
              Exemplos
            </a>
            <a href="#planos" className="transition-colors hover:text-[#12151A]">
              Planos
            </a>
            <a href="#faq" className="transition-colors hover:text-[#12151A]">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#1E8F5E] text-white hover:bg-[#17734A]"
            >
              <Link href="/login">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] text-[#1E8F5E] uppercase">
                SEU MODO CARREIRA NO EA FC AGORA COM HISTÓRIA VIVA
              </p>
              <h1
                className={`${displayFont} mt-4 text-[3rem] leading-[0.95] tracking-wide sm:text-[4rem] lg:text-[4.5rem]`}
              >
                JOGUE O MODO CARREIRA SEM ENJOAR
              </h1>
              <p className="mt-6 max-w-lg text-lg text-[#12151A]/75">
                Envie os resultados, contratações e decisões da sua temporada e receba
                matérias, capas e análises geradas por IA — como se um grande veículo
                esportivo cobrisse a sua carreira todos os dias.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-11 gap-2 bg-[#1E8F5E] px-6 text-base text-white hover:bg-[#17734A]"
                >
                  <Link href="/login">
                    Começar grátis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 border-[#12151A]/20 px-6 text-base"
                >
                  <a href="#planos">Ver planos</a>
                </Button>
              </div>
              <p className="mt-4 [font-family:var(--font-geist-mono)] text-xs tracking-wide text-[#12151A]/50 uppercase">
                PRIMEIRA CARREIRA 100% GRATUITA - SEM CARTÃO PARA COMEÇAR
              </p>
            </div>

            {/* Signature: clipped article cards */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -top-6 -right-4 w-64 -rotate-6 rounded-sm bg-white p-4 shadow-xl ring-1 ring-[#12151A]/10 transition-transform duration-300 hover:rotate-0">
                <span className="inline-block rounded-sm bg-[#12151A] px-2 py-0.5 [font-family:var(--font-geist-mono)] text-[0.65rem] tracking-widest text-white uppercase">
                  Imagem editorial
                </span>
                <div className="mt-3 aspect-4/3 w-full rounded-sm bg-[linear-gradient(135deg,#1E8F5E_0%,#12151A_60%,#0B0E11_100%)]" />
              </div>

              <div className="relative rotate-2 rounded-sm bg-white p-6 shadow-xl ring-1 ring-[#12151A]/10 transition-transform duration-300 hover:rotate-0">
                <span className="inline-block rounded-sm bg-[#E23B32] px-2 py-0.5 [font-family:var(--font-geist-mono)] text-[0.65rem] tracking-widest text-white uppercase">
                  Manchete
                </span>
                <h2 className={`${editorialFont} mt-3 text-2xl leading-tight font-semibold`}>
                  Presidente confirma contratação bilionária e muda os rumos da temporada
                </h2>
                <p className="mt-2 [font-family:var(--font-geist-mono)] text-[0.65rem] tracking-widest text-[#12151A]/50 uppercase">
                  CarreiraPRO Sport · Temporada 25/26 · Rodada 14
                </p>
                <p className={`${editorialFont} mt-3 text-sm leading-relaxed text-[#12151A]/80`}>
                  Foi em uma tarde de terça-feira que a diretoria surpreendeu a torcida.
                  Depois de semanas de rumores, a reformulação do elenco ganhou nome e
                  sobrenome — e o vestiário sentiu o impacto imediato…
                </p>
                <p className={`${editorialFont} mt-3 text-xs text-[#12151A]/60 italic`}>
                  — Redação CarreiraPRO
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ticker */}
        <div className="overflow-hidden border-y border-[#12151A]/10 bg-[#12151A] py-3">
          <div className="cpro-marquee-track flex w-max gap-10 whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span
                key={i}
                className="[font-family:var(--font-geist-mono)] text-xs tracking-[0.2em] text-[#EFF1EC]/70 uppercase"
              >
                {item} <span className="mx-4 text-[#1E8F5E]">●</span>
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="recursos" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] text-[#1E8F5E] uppercase">
                As seções da redação
              </p>
              <h2 className={`${displayFont} mt-3 text-4xl tracking-wide sm:text-5xl`}>
                TUDO QUE COBRE A SUA CARREIRA
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`${f.rotate} rounded-sm bg-white p-6 shadow-md ring-1 ring-[#12151A]/10 transition-transform duration-300 hover:rotate-0 hover:shadow-lg`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#12151A]/5">
                    <f.icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#12151A]/70">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contatos */}
        <section id="contatos" className="bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] text-[#1E8F5E] uppercase">
                A diretoria também fala com você
              </p>
              <h2 className={`${displayFont} mt-3 text-4xl tracking-wide sm:text-5xl`}>SUA CAIXA DE ENTRADA GANHA VIDA</h2>
              <p className="mt-4 text-[#12151A]/70">
                Presidente, diretor esportivo e departamento médico mandam mensagem direto pra você — como colegas de
                trabalho, não comunicados oficiais. É a bastidor da sua carreira, não só a manchete.
              </p>
            </div>
            <ContactsShowcase />
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] text-[#1E8F5E] uppercase">
                Da redação pra sua tela
              </p>
              <h2 className={`${displayFont} mt-3 text-4xl tracking-wide sm:text-5xl`}>
                COMO FUNCIONA
              </h2>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <div key={s.n} className="relative">
                  <div className="flex items-center gap-3">
                    <span
                      className={`${displayFont} flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#1E8F5E] text-xl text-[#1E8F5E]`}
                    >
                      {s.n}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span className="hidden h-px flex-1 bg-[#12151A]/15 lg:block" />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#12151A]/70">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exemplos de matérias */}
        <section id="exemplos" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <ArticleShowcase />
          </div>
        </section>

        {/* Pricing */}
        <section id="planos" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] text-[#1E8F5E] uppercase">
                Assinatura
              </p>
              <h2 className={`${displayFont} mt-3 text-4xl tracking-wide sm:text-5xl`}>
                UM PLANO PRA COMEÇAR, UM PRA VIVER A TEMPORADA INTEIRA
              </h2>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Free */}
              <div className="rounded-lg border border-[#12151A]/15 bg-white p-8">
                <h3 className="text-sm font-semibold tracking-wide text-[#12151A]/60 uppercase">
                  Free
                </h3>
                <p className={`${displayFont} mt-2 text-5xl tracking-wide`}>R$0</p>
                <p className="mt-1 text-sm text-[#12151A]/60">pra começar a cobertura da sua carreira</p>
                <ul className="mt-6 space-y-3">
                  {FREE_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1E8F5E]" />
                      <span className="text-[#12151A]/80">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" size="lg" className="mt-8 w-full border-[#12151A]/20">
                  <Link href="/login">Começar grátis</Link>
                </Button>
              </div>

              {/* Pro */}
              <div className="relative rounded-lg border-2 border-[#1E8F5E] bg-[#12151A] p-8 text-white shadow-xl">
                <span className="absolute -top-3 right-8 rounded-full bg-[#E23B32] px-3 py-1 [font-family:var(--font-geist-mono)] text-[0.65rem] font-medium tracking-widest text-white uppercase">
                  Mais popular
                </span>
                <h3 className="text-sm font-semibold tracking-wide text-white/60 uppercase">
                  Pro
                </h3>
                <p className={`${displayFont} mt-2 text-5xl tracking-wide`}>
                  R$49,90<span className="text-lg text-white/50">/mês</span>
                </p>
                <p className="mt-1 text-sm text-white/60">pra quem quer a temporada inteira coberta</p>
                <ul className="mt-6 space-y-3">
                  {PRO_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1E8F5E]" />
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-8 w-full bg-[#1E8F5E] text-white hover:bg-[#2FBE79]">
                  <Link href="/login">Quero ser Pro</Link>
                </Button>
              </div>
            </div>
            <p className="mt-6 text-center [font-family:var(--font-geist-mono)] text-xs tracking-wide text-[#12151A]/50 uppercase">
              Pagamento processado pela Stripe · sem fidelidade · cancele quando quiser
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="max-w-2xl">
              <p className="[font-family:var(--font-geist-mono)] text-xs font-medium tracking-[0.2em] text-[#1E8F5E] uppercase">
                Perguntas frequentes
              </p>
              <h2 className={`${displayFont} mt-3 text-4xl tracking-wide sm:text-5xl`}>
                DÚVIDAS DE PLANTÃO
              </h2>
            </div>

            <dl className="mt-10 divide-y divide-[#12151A]/10">
              {FAQ.map((item) => (
                <div key={item.q} className="py-6">
                  <dt className="text-base font-semibold">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[#12151A]/70">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#12151A] px-4 py-20 text-center text-white sm:px-6">
          <div className="mx-auto max-w-2xl">
            <BarChart className="mx-auto h-8 w-8 text-[#1E8F5E]" />
            <h2 className={`${displayFont} mt-4 text-4xl tracking-wide sm:text-5xl`}>
              A PRÓXIMA TEMPORADA TAMBÉM MERECE MANCHETE.
            </h2>
            <p className="mt-4 text-white/70">
              Crie sua conta, registre o primeiro evento da sua carreira e veja a redação
              entrar em ação.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-11 gap-2 bg-[#1E8F5E] px-6 text-base text-white hover:bg-[#2FBE79]"
            >
              <Link href="/login">
                <Sparkles className="h-4 w-4" />
                Começar grátis agora
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#12151A]/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#12151A] text-[#EFF1EC]">
              <Newspaper className="h-3.5 w-3.5" />
            </span>
            <span className={`${displayFont} text-lg tracking-wide`}>CARREIRAPRO</span>
          </div>
          <p className="text-sm text-[#12151A]/60">
            Feito pra quem vive o modo carreira. © {new Date().getFullYear()} CarreiraPRO.
          </p>
          <Link href="/login" className="text-sm font-medium text-[#12151A]/70 hover:text-[#12151A]">
            Entrar
          </Link>
        </div>
      </footer>
    </div>
  )
}
