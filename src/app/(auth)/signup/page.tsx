'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useMockData } from '@/lib/mock/store'
import { Loader2 } from 'lucide-react'
import { GoogleIcon } from '@/components/shared/GoogleIcon'

function translateAuthError(message: string): string {
  if (message.includes('already registered')) return 'Já existe uma conta com esse e-mail. Tente entrar.'
  if (message.includes('Password should be')) return 'A senha precisa ter pelo menos 6 caracteres.'
  return 'Não foi possível criar sua conta agora. Tente de novo em instantes.'
}

export default function SignupPage() {
  const { signUpWithPassword, signInWithGoogle } = useMockData()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || loading) return
    setLoading(true)
    setError(null)

    const result = await signUpWithPassword(email, password)
    setLoading(false)

    if (!result.ok) {
      setError(translateAuthError(result.error ?? ''))
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const result = await signInWithGoogle()
    if (!result.ok) {
      setError('Não foi possível continuar com o Google agora. Tente de novo.')
      setGoogleLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Comece grátis — sem cartão pra começar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-4 h-4" />}
          Continuar com Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

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
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Pelo menos 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || googleLoading || !email || !password}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Criar conta
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
