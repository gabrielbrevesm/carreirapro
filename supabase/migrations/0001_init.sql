-- CarreiraPRO — schema inicial (migração do protótipo client-side/localStorage para Postgres real).
-- Todas as tabelas de domínio são protegidas por Row Level Security, escopadas ao usuário dono
-- da carreira (auth.uid()). Sem isso, qualquer usuário autenticado poderia ler/editar dados de
-- qualquer outro usuário — RLS é o que torna isso um produto multi-usuário seguro de verdade.

-- ─── Perfil (estende auth.users) ────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  articles_generated int not null default 0,
  images_generated int not null default 0,
  squad_analyses_used int not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê o próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuário edita o próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Cria o profile automaticamente quando um novo usuário se cadastra (magic link / OAuth).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Carreiras ───────────────────────────────────────────────────

create table public.careers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  manager_type text not null check (manager_type in ('real', 'fictional')),
  manager_name text not null,
  manager_bio text,
  manager_origin text,
  manager_photo_url text,
  club_name text not null,
  club_league text not null,
  club_country text not null,
  club_tier text,
  season_start text not null,
  initial_objective text,
  current_season text,
  events_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

alter table public.careers enable row level security;

create policy "Dono gerencia suas carreiras" on public.careers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Memória da carreira (1:1 com careers) ──────────────────────

create table public.career_memories (
  career_id uuid primary key references public.careers (id) on delete cascade,
  established_facts jsonb not null default '[]',
  recurring_characters jsonb not null default '[]',
  active_narratives jsonb not null default '[]',
  rivalries jsonb not null default '[]',
  player_highlights jsonb not null default '{}',
  recent_results jsonb not null default '[]',
  key_signings jsonb not null default '[]',
  captain_name text,
  vice_captain_name text,
  updated_at timestamptz not null default now()
);

alter table public.career_memories enable row level security;

create policy "Dono gerencia a memória das suas carreiras" on public.career_memories
  for all using (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()));

-- ─── Eventos da carreira ─────────────────────────────────────────

create table public.career_events (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id) on delete cascade,
  event_type text not null,
  raw_input text not null,
  season text,
  competition text,
  match_week int,
  has_image_attachment boolean not null default false,
  attachment_url text,
  event_order int not null,
  created_at timestamptz not null default now()
);

alter table public.career_events enable row level security;

create policy "Dono gerencia os eventos das suas carreiras" on public.career_events
  for all using (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()));

-- ─── Matérias ────────────────────────────────────────────────────

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id) on delete cascade,
  event_id uuid references public.career_events (id) on delete set null,
  headline text not null,
  subheadline text,
  body text not null,
  sections jsonb,
  season text,
  competition text,
  event_type text,
  model_used text not null default '',
  tokens_used int not null default 0,
  generation_time_ms int not null default 0,
  image_url text,
  image_prompt text,
  image_status text not null default 'pending' check (image_status in ('pending', 'generating', 'ready', 'failed')),
  share_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;

create policy "Dono gerencia as matérias das suas carreiras" on public.articles
  for all using (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()));

-- Leitura pública de UMA matéria por share_token exato (link de compartilhamento), sem expor a
-- tabela inteira — a função roda com privilégio elevado e só devolve a linha que bate o token.
create function public.get_article_by_share_token(token text)
returns setof public.articles
language sql
security definer set search_path = public
stable
as $$
  select * from public.articles where share_token = token limit 1;
$$;

grant execute on function public.get_article_by_share_token(text) to anon, authenticated;

-- ─── Personagens paralelos / Contatos ────────────────────────────

create table public.character_messages (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  character_id text not null check (character_id in ('diretor_esportivo', 'presidente', 'auxiliar_tecnico', 'departamento_medico', 'capitao')),
  headline text not null,
  body text not null,
  model_used text not null default '',
  tokens_used int not null default 0,
  generation_time_ms int not null default 0,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  user_reply text,
  user_reply_at timestamptz,
  character_response text,
  character_response_at timestamptz
);

alter table public.character_messages enable row level security;

create policy "Dono gerencia os personagens das suas carreiras" on public.character_messages
  for all using (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()));

-- ─── Análises de elenco ──────────────────────────────────────────

create table public.squad_analyses (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id) on delete cascade,
  photo_url text not null,
  financial_budget text,
  user_context text,
  identified_gaps jsonb not null default '[]',
  suggestions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.squad_analyses enable row level security;

create policy "Dono gerencia as análises de elenco das suas carreiras" on public.squad_analyses
  for all using (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid()));

-- ─── Índices de apoio ────────────────────────────────────────────

create index careers_user_id_idx on public.careers (user_id);
create index career_events_career_id_idx on public.career_events (career_id);
create index articles_career_id_idx on public.articles (career_id);
create index character_messages_career_id_idx on public.character_messages (career_id);
create index character_messages_career_character_idx on public.character_messages (career_id, character_id);
create index squad_analyses_career_id_idx on public.squad_analyses (career_id);
