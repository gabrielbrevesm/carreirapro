-- Bucket público para as imagens geradas/baixadas pelo app (matérias, fotos de técnico,
-- fotos de jogador). Substitui o antigo storage em disco (public/uploads), que não sobrevive
-- a um deploy sem disco persistente (ex: Vercel).
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Leitura pública (as imagens são exibidas em <img src> direto, sem autenticação).
create policy "uploads: leitura pública"
on storage.objects for select
to public
using (bucket_id = 'uploads');

-- Escrita apenas via service_role (todo upload passa pelo Route Handler no server,
-- nunca diretamente do browser) — mesma lógica de privilégio das colunas de profiles.
create policy "uploads: escrita via service_role"
on storage.objects for insert
to service_role
with check (bucket_id = 'uploads');
