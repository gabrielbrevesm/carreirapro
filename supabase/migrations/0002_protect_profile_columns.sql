-- Sem isso, qualquer usuário autenticado poderia dar um UPDATE direto na própria linha de
-- `profiles` (via REST da API, fora do app) e virar "pro" de graça, ou zerar seus próprios
-- contadores de uso pra burlar o limite gratuito — a policy de RLS de profiles permite update
-- na própria linha, mas não distingue quais colunas.
--
-- Restringe o que o usuário autenticado pode alterar via UPDATE só a campos de perfil (nome,
-- avatar). Plano, contadores de uso e IDs do Stripe só podem ser escritos pelo service_role
-- (rotas server-side com o admin client), nunca pelo navegador do usuário.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
