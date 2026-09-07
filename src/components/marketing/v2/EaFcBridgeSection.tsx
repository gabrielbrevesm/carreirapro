import { Gamepad2, TrendingUp, ArrowRight } from 'lucide-react'
import { v2Eyebrow } from './tokens'

const EA_ITEMS = ['Partidas', 'Mercado', 'Competições', 'Elenco']
const CARREIRAPRO_ITEMS = ['Imprensa', 'Staff', 'Diretoria', 'Departamento Médico', 'Redes Sociais', 'História']

export function EaFcBridgeSection() {
  return (
    <section className="bg-[#0D1E27] px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <p className={`${v2Eyebrow} text-[#4EEEA0]`}>A ponte</p>
          <h2 className="[font-family:var(--font-sans)] mt-3 text-[clamp(1.75rem,3vw,2.625rem)] font-extrabold tracking-tight text-[#F5F7F8]">
            Do EA FC para o CarreiraPRO
          </h2>
          <p className="mt-3 text-base text-[#AEBCC2]">Você joga. O mundo reage.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-[rgba(126,166,177,0.20)] bg-[#172D38] p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#AEBCC2]">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold tracking-wide text-[#AEBCC2] uppercase">EA FC</p>
            <p className="text-lg font-bold text-[#F5F7F8]">Você joga</p>
            <ul className="mt-4 space-y-2">
              {EA_ITEMS.map((item) => (
                <li key={item} className="rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-[#AEBCC2]">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center py-2 lg:py-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4EEEA0]/15 text-[#4EEEA0]">
              <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
            </span>
          </div>

          <div className="rounded-2xl border border-[rgba(78,238,160,0.4)] bg-[#112631] p-6 shadow-[0_0_40px_-12px_rgba(78,238,160,0.25)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4EEEA0]/15 text-[#4EEEA0]">
              <TrendingUp className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold tracking-wide text-[#4EEEA0] uppercase">CarreiraPRO</p>
            <p className="text-lg font-bold text-[#F5F7F8]">O mundo reage</p>
            <ul className="mt-4 space-y-2">
              {CARREIRAPRO_ITEMS.map((item) => (
                <li key={item} className="rounded-lg border border-[rgba(78,238,160,0.15)] bg-[#4EEEA0]/5 px-3 py-2 text-sm text-[#F5F7F8]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
