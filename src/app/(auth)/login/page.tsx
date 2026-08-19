'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMockData } from '@/lib/mock/store'
import { Loader2, MailCheck } from 'lucide-react'

export default function LoginPage() {
  const { sendMagicLink } = useMockData()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    setError(null)

    const result = await sendMagicLink(email)
    setLoading(false)

    if (!result.ok) {
      setError('Não foi possível enviar o link agora. Tente de novo em instantes.')
      return
    }
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <MailCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Confira seu e-mail</CardTitle>
          <CardDescription>
            Mandamos um link de acesso para <strong>{sentTo}</strong>. Clique nele para entrar — sem senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => setSentTo(null)}>
            Usar outro e-mail
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Digite seu e-mail e mandamos um link de acesso — sem senha pra lembrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Enviar link de acesso
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
