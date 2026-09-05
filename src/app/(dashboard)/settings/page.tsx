'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useMockData } from '@/lib/mock/store'
import { Paywall } from '@/components/shared/Paywall'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Sparkles, Sun, Moon, Monitor } from 'lucide-react'
import { FREE_LIMITS } from '@/lib/freemium'
import { toast } from 'sonner'

function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const options = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>Escolha como o CarreiraPRO deve ser exibido.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                mounted && theme === value ? 'border-primary bg-primary/5 text-foreground' : 'text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const { state, refreshProfile } = useMockData()
  const [verifying, setVerifying] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const verifiedSessionId = useRef<string | null>(null)

  const paywallFeature = searchParams.get('paywall')
  const sessionId = searchParams.get('session_id')
  const showSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    if (!showSuccess || !sessionId || verifiedSessionId.current === sessionId) return
    verifiedSessionId.current = sessionId
    setVerifying(true)
    ;(async () => {
      const res = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
      const data = await res.json()
      if (!data.paid) {
        toast.error('Pagamento ainda não confirmado pela Stripe.')
        return
      }
      // O webhook pode levar um instante para persistir plan='pro' no banco — tenta algumas
      // vezes com um pequeno intervalo antes de desistir.
      for (let attempt = 0; attempt < 5; attempt++) {
        const plan = await refreshProfile()
        if (plan === 'pro') return
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      toast.error('Pagamento confirmado, mas o plano ainda não foi atualizado. Atualize a página em instantes.')
    })()
      .catch(() => toast.error('Não foi possível confirmar o pagamento.'))
      .finally(() => setVerifying(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccess, sessionId])

  const handleCancelSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Não foi possível abrir o portal de assinatura.')
    } catch {
      toast.error('Não foi possível abrir o portal de assinatura.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Perfil e assinatura.</p>
      </div>

      {showSuccess && (
        <Alert>
          <CheckCircle2 className="w-4 h-4" />
          <AlertTitle>{verifying ? 'Confirmando pagamento...' : 'Assinatura confirmada!'}</AlertTitle>
          <AlertDescription>
            {verifying
              ? 'Estamos verificando seu pagamento com a Stripe.'
              : 'Você agora tem acesso ilimitado ao CarreiraPRO Pro.'}
          </AlertDescription>
        </Alert>
      )}

      {paywallFeature && state.plan !== 'pro' && <Paywall feature={paywallFeature} />}

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{state.profile?.fullName}</p>
          <p className="text-muted-foreground">{state.profile?.email}</p>
        </CardContent>
      </Card>

      <AppearanceCard />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assinatura</CardTitle>
            {state.plan === 'pro' ? (
              <Badge className="gap-1 border-0 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950">
                <Sparkles className="w-3 h-3" /> Pro
              </Badge>
            ) : (
              <Badge variant="outline">Gratuito</Badge>
            )}
          </div>
          <CardDescription>
            {state.plan === 'pro' ? 'Acesso ilimitado a todas as funcionalidades.' : 'Uso limitado do plano gratuito.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.plan === 'free' && (
            <div className="space-y-3">
              {(
                [
                  { key: 'articlesGenerated', label: 'Matérias geradas' },
                  { key: 'imagesGenerated', label: 'Imagens geradas' },
                  { key: 'squadAnalyses', label: 'Análises de elenco' },
                ] as const
              ).map(({ key, label }) => {
                const used = state.usage[key]
                const limit = FREE_LIMITS[key]
                const unlimited = !Number.isFinite(limit)
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{label}</span>
                      <span>{limit === 0 ? 'Exclusivo Pro' : unlimited ? `${used} · Ilimitado` : `${used}/${limit}`}</span>
                    </div>
                    <Progress value={limit === 0 ? 100 : unlimited ? 100 : Math.min((used / limit) * 100, 100)} />
                  </div>
                )
              })}
            </div>
          )}

          {state.plan === 'pro' ? (
            <Button variant="outline" className="w-full" onClick={handleCancelSubscription} disabled={portalLoading}>
              {portalLoading ? 'Abrindo portal...' : 'Cancelar assinatura'}
            </Button>
          ) : (
            <Button className="w-full" asChild>
              <a href="/settings?paywall=articles">Assinar CarreiraPRO Pro — R$49,90/mês</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
