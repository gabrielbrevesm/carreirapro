'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Newspaper, ImageIcon, Users, Trophy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const FEATURE_MESSAGES: Record<string, string> = {
  articles: 'Você usou sua geração gratuita de matéria. Assine para continuar.',
  images: 'Você usou sua imagem editorial gratuita. Assine para gerar mais.',
  squad_analysis: 'Análise de elenco é exclusiva do plano Pro.',
  new_career: 'Sua primeira carreira é gratuita. Para criar mais carreiras, assine o Pro.',
}

export function Paywall({ feature }: { feature?: string }) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'CHECKOUT_FAILED')
      window.location.href = data.url
    } catch {
      toast.error('Não foi possível iniciar o checkout. Tente novamente em instantes.')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full border-2 border-primary/20">
        <CardHeader className="text-center pb-2">
          <Badge className="w-fit mx-auto mb-3" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            CarreiraPRO Plus
          </Badge>
          <CardTitle className="text-2xl">Continue sua cobertura</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {feature ? FEATURE_MESSAGES[feature] : 'Você usou sua geração gratuita. Assine para continuar.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { icon: Newspaper, text: 'Matérias jornalísticas ilimitadas' },
              { icon: ImageIcon, text: 'Imagens editoriais ilimitadas' },
              { icon: Users, text: 'Análise de elenco com sugestões de contratação' },
              { icon: Trophy, text: 'Crie mais de uma carreira ao mesmo tempo' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {text}
              </div>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-4 text-center">
            <span className="text-3xl font-bold">R$49,90</span>
            <span className="text-muted-foreground text-sm">/mês</span>
            <p className="text-xs text-muted-foreground mt-1">Cancele quando quiser</p>
          </div>

          <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? 'Redirecionando...' : 'Assinar CarreiraPRO Pro'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
