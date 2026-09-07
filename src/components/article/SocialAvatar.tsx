import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { ClubBadge } from '@/components/shared/ClubBadge'
import { PunditAvatar } from '@/components/shared/PunditAvatar'
import { cn } from '@/lib/utils'
import type { SocialPost } from '@/types'

// Avatar por tipo de conta nas Redes Sociais:
// - jogador → foto real (Transfermarkt);
// - clube → escudo real (Wikipédia);
// - jornalista → foto real (é sempre uma figura pública real, ex: Fabrizio Romano);
// - torcedor/rival/humor/stats → conta fictícia: gera um avatar consistente por "seed" em vez de
//   uma foto real de alguém que não existe (evita tanto o genérico "iniciais" quanto inventar a
//   cara de uma pessoa real que não é quem está postando).
export function SocialAvatar({
  post,
  className,
}: {
  post: Pick<SocialPost, 'accountType' | 'displayName' | 'handle'>
  className?: string
}) {
  if (post.accountType === 'player') return <PlayerAvatar name={post.displayName} className={className} />
  if (post.accountType === 'club') return <ClubBadge name={post.displayName} className={className} />
  if (post.accountType === 'journalist') return <PunditAvatar name={post.displayName} className={className} />

  const seed = encodeURIComponent(post.handle || post.displayName)
  return (
    <img
      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`}
      alt=""
      className={cn('rounded-full object-cover shrink-0 bg-muted', className)}
    />
  )
}

// Mesma ideia para os quote-entries do formato livre (redes sociais parseadas do markdown da
// IA), que só têm nome — sem accountType/handle pra decidir entre foto real ou avatar gerado.
export function GenericSocialAvatar({ name, className }: { name: string; className?: string }) {
  const seed = encodeURIComponent(name)
  return (
    <img
      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`}
      alt=""
      className={cn('rounded-full object-cover shrink-0 bg-muted', className)}
    />
  )
}
