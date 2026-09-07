'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Newspaper, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/track'

const NAV_LINKS = [
  { href: '#hero', label: 'Início' },
  { href: '#historias', label: 'Funcionalidades' },
  { href: '#planos', label: 'Preços' },
  { href: '#carreira-demo', label: 'Depoimentos' },
  { href: '#faq', label: 'FAQ' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[rgba(126,166,177,0.20)] backdrop-blur-md transition-colors duration-300 ${
        scrolled ? 'bg-[#07151D]/90' : 'bg-[#07151D]/60'
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4EEEA0] text-[#07151D]">
            <Newspaper className="h-4 w-4" />
          </span>
          <span className="[font-family:var(--font-sans)] text-lg font-extrabold tracking-tight text-[#F5F7F8]">
            CarreiraPRO
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#AEBCC2] lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-[#F5F7F8]">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm" className="text-[#AEBCC2] hover:bg-white/5 hover:text-[#F5F7F8]">
            <Link href="/login" onClick={() => track('login_click', { section: 'navbar' })}>
              Entrar
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-[#4EEEA0] text-[#07151D] hover:bg-[#86ECB9]">
            <Link href="/login" onClick={() => track('hero_create_career_click', { section: 'navbar' })}>
              Criar minha carreira
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <Button asChild size="sm" className="bg-[#4EEEA0] text-[#07151D] hover:bg-[#86ECB9]">
            <Link href="/login" onClick={() => track('hero_create_career_click', { section: 'navbar_mobile' })}>
              Começar
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#F5F7F8] hover:bg-white/5"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[rgba(126,166,177,0.20)] bg-[#07151D] px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#AEBCC2] hover:bg-white/5 hover:text-[#F5F7F8]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#AEBCC2] hover:bg-white/5 hover:text-[#F5F7F8]"
            >
              Entrar
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
