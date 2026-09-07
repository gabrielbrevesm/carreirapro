import Link from 'next/link'
import { ArrowRight, Newspaper, Video, AtSign, Camera, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/track'

const FOOTER_LINKS = ['Sobre', 'Planos', 'Privacidade', 'Termos', 'Contato']
const SOCIALS = [
  { icon: Video, label: 'YouTube' },
  { icon: AtSign, label: 'X/Twitter' },
  { icon: Camera, label: 'Instagram' },
  { icon: MessageCircle, label: 'Discord' },
]

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center sm:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(4,17,24,.90), rgba(4,17,24,.90)), radial-gradient(circle at 30% 30%, rgba(78,238,160,.10), transparent 40%), linear-gradient(160deg, #0B1B23 0%, #0D2129 50%, #0A1920 100%)',
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute top-1/2 left-6 hidden -translate-y-1/2 -rotate-90 text-[11px] font-semibold tracking-[0.3em] text-[#758B8D]/60 uppercase md:block"
        aria-hidden
      >
        Sua carreira, outro nível.
      </span>
      <span
        className="pointer-events-none absolute top-1/2 right-6 hidden -translate-y-1/2 rotate-90 text-[11px] font-semibold tracking-[0.3em] text-[#758B8D]/60 uppercase md:block"
        aria-hidden
      >
        Carreira vive.
      </span>

      <div className="relative mx-auto max-w-2xl">
        <h2 className="[font-family:var(--font-sans)] text-[clamp(2rem,4vw,3.25rem)] font-extrabold tracking-tight text-[#F5F7F8] text-balance">
          Transforme sua carreira em uma história viva
        </h2>
        <p className="mt-4 text-lg text-[#AEBCC2]">
          Mais do que matérias: um universo persistente que reage ao que você faz.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 gap-2 bg-[#4EEEA0] px-7 text-base font-semibold text-[#07151D] hover:bg-[#86ECB9]">
            <Link href="/login" onClick={() => track('final_cta_click', { cta: 'comecar' })}>
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 border-[rgba(126,166,177,0.35)] px-7 text-base text-[#F5F7F8] hover:bg-white/5">
            <a href="#hero" onClick={() => track('final_cta_click', { cta: 'ver_demonstracao' })}>
              Ver demonstração
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function FooterV2() {
  return (
    <footer className="border-t border-[rgba(126,166,177,0.15)] bg-[#07151D] px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
        <div>
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4EEEA0] text-[#07151D]">
              <Newspaper className="h-3.5 w-3.5" />
            </span>
            <span className="[font-family:var(--font-sans)] text-base font-extrabold tracking-tight text-[#F5F7F8]">
              CarreiraPRO
            </span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-[#758B8D]">Futebol gera histórias. Nós damos voz a elas.</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#AEBCC2] md:justify-start">
          {FOOTER_LINKS.map((link) => (
            <a key={link} href="#" className="hover:text-[#F5F7F8]">
              {link}
            </a>
          ))}
        </nav>

        <div className="flex gap-3">
          {SOCIALS.map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#AEBCC2] hover:bg-white/10 hover:text-[#F5F7F8]"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-[#556269]">Feito por fãs de futebol. Para quem vive o modo carreira.</p>
    </footer>
  )
}
