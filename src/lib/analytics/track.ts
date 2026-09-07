'use client'

// Instrumentação mínima e honesta: não há provedor de analytics instalado no projeto ainda
// (nenhum GA4/Segment/Plausible configurado). Isso empurra os eventos pro `dataLayer` padrão
// do GA4 SE ele existir (não falha se não existir) — assim, quando um provedor for instalado,
// os eventos já fluem sem precisar re-instrumentar nada. Em dev, também loga no console pra
// dar visibilidade imediata de que a instrumentação está no lugar certo.
type TrackParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export function track(event: string, params: TrackParams = {}): void {
  if (typeof window === 'undefined') return

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[track]', event, params)
  }

  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event, ...params })
}
