'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMockData } from '@/lib/mock/store'
import { Loader2, MailCheck } from 'lucide-react'
import { GoogleIcon } from '@/components/shared/GoogleIcon'

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  return 'Não foi possível entrar agora. Tente de novo em instantes.'
}

function PasswordLogin({ onUseMagicLink }: { onUseMagicLink: () => void }) {
  const { signInWithPassword, signInWithGoogle } = useMockData()
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

    const result = await signInWithPassword(email, password)
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
    <>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta CarreiraPRO.</CardDescription>
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
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || googleLoading || !email || !password}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Entrar
          </Button>
        </form>

        <button
          type="button"
          onClick={onUseMagicLink}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Prefere entrar com um link de acesso por e-mail?
        </button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link href="/signup" className="text-foreground font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </CardFooter>
    </>
  )
}

function MagicLinkLogin({ onBack }: { onBack: () => void }) {
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
      <>
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
      </>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Link de acesso</CardTitle>
        <CardDescription>Digite seu e-mail e mandamos um link de acesso — sem senha pra lembrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">E-mail</Label>
            <Input
              id="magic-email"
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
        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline mt-4"
        >
          Voltar para login com senha
        </button>
      </CardContent>
    </>
  )
}

function LoginContent() {
  const [mode, setMode] = useState<'password' | 'magic-link'>('password')
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const reason = searchParams.get('reason')

  return (
    <div className="space-y-4">
      {authError && (
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível concluir o login{reason ? `: ${reason}` : ''}. Tente de novo.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        {mode === 'password' ? (
          <PasswordLogin onUseMagicLink={() => setMode('magic-link')} />
        ) : (
          <MagicLinkLogin onBack={() => setMode('password')} />
        )}
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
