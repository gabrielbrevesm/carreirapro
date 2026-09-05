import { LayoutDashboard, MessageCircle, Settings } from 'lucide-react'

// "Minhas Carreiras" foi removida daqui de propósito — a Visão Geral já mostra "Suas carreiras"
// com um link "Ver todas" para /careers quando necessário, então um item de nav dedicado só
// duplicava a mesma informação.
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contatos', icon: MessageCircle },
  { href: '/settings', label: 'Configurações', icon: Settings },
] as const
