import { LayoutDashboard, Trophy, MessageCircle, Settings } from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/careers', label: 'Minhas Carreiras', icon: Trophy },
  { href: '/contacts', label: 'Contatos', icon: MessageCircle },
  { href: '/settings', label: 'Configurações', icon: Settings },
] as const
