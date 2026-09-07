'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/track'
import { Navbar } from './v2/Navbar'
import { HeroSection } from './v2/HeroSection'
import { FiveStoriesSection } from './v2/FiveStoriesSection'
import { StaffSection } from './v2/StaffSection'
import { PressScenariosSection } from './v2/PressScenariosSection'
import { MemoryPlaygroundSection } from './v2/MemoryPlaygroundSection'
import { EaFcBridgeSection } from './v2/EaFcBridgeSection'
import { DemoCareerSection } from './v2/DemoCareerSection'
import { FinalCtaSection, FooterV2 } from './v2/FinalCtaAndFooter'

// Landing v2 — conceito "central de comando" escuro (ver spec em
// carreirapro-landing-page-implementation-spec.md). Fica inteiramente isolada da v1
// (./LandingPage.tsx, intocada) pra que voltar pra versão anterior seja só trocar qual
// componente é renderizado em src/app/page.tsx — nada aqui depende da v1 nem é compartilhado.
// A fonte (Poppins, --font-sans) já é carregada globalmente pelo layout raiz — font-sans aqui
// só ativa a mesma variável, sem recarregar o arquivo de fonte.
export function LandingPageV2() {
  useEffect(() => {
    track('landing_view', { variant: 'v2' })
  }, [])

  return (
    <div className="bg-[#101F28] font-sans text-[#F5F7F8] antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FiveStoriesSection />
        <StaffSection />
        <PressScenariosSection />
        <MemoryPlaygroundSection />
        <EaFcBridgeSection />
        <DemoCareerSection />
        <FinalCtaSection />
      </main>
      <FooterV2 />
    </div>
  )
}
