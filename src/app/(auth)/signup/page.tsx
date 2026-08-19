import { redirect } from 'next/navigation'

// Login por magic link é o mesmo fluxo pra conta nova ou existente — não há um formulário de
// cadastro separado (o Supabase cria o usuário automaticamente no primeiro acesso pelo link).
export default function SignupPage() {
  redirect('/login')
}
