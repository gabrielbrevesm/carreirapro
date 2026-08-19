# CarreiraPRO — Especificação Técnica Completa

> Documento de referência para desenvolvimento com Claude Code.
> Baseado no PRD v1.0 (2026-07-28).
> Leia este arquivo inteiro antes de escrever qualquer código.

---

## ÍNDICE

1. [Visão geral e stack](#1-visão-geral-e-stack)
2. [Estrutura de pastas](#2-estrutura-de-pastas)
3. [Variáveis de ambiente](#3-variáveis-de-ambiente)
4. [Banco de dados — migrations SQL](#4-banco-de-dados--migrations-sql)
5. [Tipos TypeScript globais](#5-tipos-typescript-globais)
6. [Autenticação e middleware](#6-autenticação-e-middleware)
7. [Clientes de serviços externos](#7-clientes-de-serviços-externos)
8. [Motor de geração de artigos (IA)](#8-motor-de-geração-de-artigos-ia)
9. [Motor de geração de imagens (IA)](#9-motor-de-geração-de-imagens-ia)
10. [Analisador de elenco (IA)](#10-analisador-de-elenco-ia)
11. [Scraper de mercado de transferências](#11-scraper-de-mercado-de-transferências)
12. [API Routes — especificação completa](#12-api-routes--especificação-completa)
13. [Páginas e componentes](#13-páginas-e-componentes)
14. [Sistema de freemium e paywall](#14-sistema-de-freemium-e-paywall)
15. [Stripe — checkout e webhook](#15-stripe--checkout-e-webhook)
16. [Cron jobs](#16-cron-jobs)
17. [Fases de implementação](#17-fases-de-implementação)
18. [Comandos de setup](#18-comandos-de-setup)

---

## 1. VISÃO GERAL E STACK

### O que é o CarreiraPRO
Plataforma web que transforma o modo carreira do EA FC em uma experiência jornalística imersiva. O usuário envia inputs sobre sua carreira virtual (resultados, contratações, acontecimentos) e recebe matérias geradas por IA no estilo de grandes veículos esportivos, imagens editoriais, sugestões de contratações e atualizações diárias do mercado real de transferências.

### Stack técnica (MVP)

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR/SSG nativo, API routes, server actions, deploy simples |
| Linguagem | TypeScript (strict) | Segurança de tipos, essencial com schema de DB complexo |
| Estilos | Tailwind CSS v4 + shadcn/ui | UI rápida e consistente, tema customizável |
| Banco de dados | Supabase (PostgreSQL) | Auth + DB + Storage em um serviço; RLS nativo |
| Auth | Supabase Auth | Email/senha + Google OAuth |
| Storage | Supabase Storage | Upload de fotos de elenco, armazenamento de imagens geradas |
| IA — texto | OpenAI GPT-4o | Melhor qualidade de geração narrativa; suporte a visão (análise de fotos) |
| IA — imagem | OpenAI DALL-E 3 | Integrado ao mesmo cliente; qualidade editorial adequada |
| Pagamentos | Stripe | Padrão de mercado; suporte a assinaturas recorrentes |
| Deploy | Vercel | Integração nativa com Next.js; cron jobs gratuitos |
| Scraping | Cheerio + node-fetch | Leve, sem browser headless no MVP |
| Gerenciador de pacotes | pnpm | Mais rápido que npm, lockfile determinístico |

### Princípios de desenvolvimento
- **Mobile-first**: todos os componentes são construídos primeiro para 375px, depois expandidos
- **Server Components por padrão**: usar `'use client'` apenas onde estritamente necessário (interações, formulários controlados)
- **Dados sensíveis nunca no cliente**: chaves de API, lógica de geração, validação de assinatura ficam em server-side
- **Falha elegante**: se a geração de IA falhar, mostrar erro claro e não cobrar o uso da cota gratuita
- **RLS (Row Level Security)**: todas as tabelas protegidas por política de acesso no Supabase

---

## 2. ESTRUTURA DE PASTAS

```
carreirapro/
│
├── CLAUDE.md                          ← este arquivo
├── .env.local                         ← variáveis de ambiente (nunca commitar)
├── .env.example                       ← template de variáveis (commitar)
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                    ← shadcn/ui config
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql           ← schema completo
│   └── seed.sql                      ← dados de exemplo para dev
│
└── src/
    ├── middleware.ts                  ← proteção de rotas autenticadas
    │
    ├── app/
    │   ├── layout.tsx                 ← layout raiz (font, metadata)
    │   ├── globals.css
    │   │
    │   ├── (auth)/                    ← grupo de rotas públicas
    │   │   ├── layout.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── signup/
    │   │       └── page.tsx
    │   │
    │   ├── (dashboard)/               ← grupo de rotas protegidas
    │   │   ├── layout.tsx             ← sidebar + topbar
    │   │   ├── dashboard/
    │   │   │   └── page.tsx           ← visão geral de todas as carreiras
    │   │   ├── careers/
    │   │   │   ├── page.tsx           ← lista de carreiras
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx       ← questionário de nova carreira
    │   │   │   └── [careerSlug]/
    │   │   │       ├── page.tsx       ← hub da carreira
    │   │   │       ├── input/
    │   │   │       │   └── page.tsx   ← formulário de input de evento
    │   │   │       ├── timeline/
    │   │   │       │   └── page.tsx   ← histórico cronológico de matérias
    │   │   │       ├── squad/
    │   │   │       │   └── page.tsx   ← upload de elenco + sugestões
    │   │   │       └── article/
    │   │   │           └── [articleId]/
    │   │   │               └── page.tsx ← matéria individual
    │   │   ├── market/
    │   │   │   └── page.tsx           ← feed diário de transferências
    │   │   └── settings/
    │   │       └── page.tsx           ← perfil + assinatura
    │   │
    │   └── api/
    │       ├── careers/
    │       │   ├── route.ts           ← GET list, POST create
    │       │   └── [id]/
    │       │       └── route.ts       ← GET, PATCH, DELETE
    │       ├── articles/
    │       │   ├── generate/
    │       │   │   └── route.ts       ← POST: gera matéria via IA
    │       │   └── [id]/
    │       │       └── route.ts       ← GET artigo individual
    │       ├── images/
    │       │   └── generate/
    │       │       └── route.ts       ← POST: gera imagem editorial via DALL-E
    │       ├── squad/
    │       │   └── analyze/
    │       │       └── route.ts       ← POST: analisa foto do elenco + sugere contratações
    │       ├── market/
    │       │   ├── route.ts           ← GET feed de transferências
    │       │   └── sync/
    │       │       └── route.ts       ← POST (interno/cron): sincroniza dados
    │       ├── stripe/
    │       │   ├── checkout/
    │       │   │   └── route.ts       ← POST: cria sessão de checkout
    │       │   └── webhook/
    │       │       └── route.ts       ← POST: recebe eventos do Stripe
    │       └── cron/
    │           └── market-sync/
    │               └── route.ts       ← GET: disparado pelo cron do Vercel
    │
    ├── components/
    │   ├── ui/                        ← componentes shadcn/ui (gerados via CLI)
    │   ├── auth/
    │   │   ├── LoginForm.tsx
    │   │   └── SignupForm.tsx
    │   ├── career/
    │   │   ├── CareerCard.tsx
    │   │   ├── CareerQuestionnaire.tsx
    │   │   ├── EventInputForm.tsx
    │   │   └── CareerTimeline.tsx
    │   ├── article/
    │   │   ├── ArticleCard.tsx
    │   │   ├── ArticleRenderer.tsx
    │   │   └── ArticleShareButton.tsx
    │   ├── market/
    │   │   ├── TransferFeed.tsx
    │   │   └── TransferCard.tsx
    │   ├── squad/
    │   │   ├── SquadUploader.tsx
    │   │   └── TransferSuggestionCard.tsx
    │   └── shared/
    │       ├── Paywall.tsx
    │       ├── Sidebar.tsx
    │       ├── Topbar.tsx
    │       ├── LoadingSpinner.tsx
    │       └── EmptyState.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts              ← createBrowserClient
    │   │   ├── server.ts              ← createServerClient
    │   │   └── admin.ts               ← createAdminClient (service role)
    │   ├── openai/
    │   │   ├── client.ts              ← OpenAI instance
    │   │   ├── article-generator.ts   ← lógica de geração de matéria
    │   │   ├── image-generator.ts     ← lógica de geração de imagem
    │   │   └── squad-analyzer.ts      ← lógica de análise de elenco
    │   ├── stripe/
    │   │   └── client.ts
    │   ├── scrapers/
    │   │   └── transfermarkt.ts
    │   ├── memory/
    │   │   └── context-builder.ts     ← monta contexto histórico por carreira
    │   ├── freemium.ts               ← verificação de cota e permissões
    │   └── utils.ts
    │
    └── types/
        └── index.ts                  ← todos os tipos globais
```

---

## 3. VARIÁVEIS DE AMBIENTE

Criar `.env.local` na raiz com:

```bash
# ─── Supabase ───────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...          # NUNCA expor no cliente

# ─── OpenAI ─────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-...

# ─── Stripe ─────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...                  # ID do preço mensal R$49,90

# ─── App ────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://carreirapro.com.br  # localhost:3000 em dev
CRON_SECRET=gere-um-uuid-aqui                  # valida chamadas do cron

# ─── Configurações de freemium ──────────────────────────────
FREE_ARTICLE_LIMIT=1                           # gerações gratuitas
FREE_IMAGE_LIMIT=1
FREE_SQUAD_ANALYSIS_LIMIT=0                    # somente Pro
```

Criar `.env.example` com os mesmos campos, valores substituídos por `PLACEHOLDER`.

---

## 4. BANCO DE DADOS — MIGRATIONS SQL

Criar o arquivo `supabase/migrations/001_initial.sql` com o conteúdo abaixo.
Executar com `npx supabase db push` ou pelo painel do Supabase.

```sql
-- ═══════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- busca textual

-- ═══════════════════════════════════════════════════════════
-- PROFILES
-- Extensão da tabela auth.users do Supabase
-- ═══════════════════════════════════════════════════════════
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  full_name     text,
  avatar_url    text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- Trigger: cria profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTIONS
-- Espelha dados do Stripe para acesso rápido
-- ═══════════════════════════════════════════════════════════
create table public.subscriptions (
  id                   text primary key,          -- stripe subscription id
  user_id              uuid references public.profiles(id) on delete cascade not null,
  status               text not null,             -- active | past_due | canceled | trialing
  price_id             text,                      -- stripe price id
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean default false,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);

-- ═══════════════════════════════════════════════════════════
-- USAGE TRACKING
-- Controla uso do tier gratuito por usuário
-- ═══════════════════════════════════════════════════════════
create table public.usage_tracking (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references public.profiles(id) on delete cascade not null unique,
  articles_generated    int default 0 not null,
  images_generated      int default 0 not null,
  squad_analyses        int default 0 not null,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

create index idx_usage_tracking_user_id on public.usage_tracking(user_id);

-- Trigger: cria usage_tracking junto com o profile
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usage_tracking (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- ═══════════════════════════════════════════════════════════
-- CAREERS
-- Cada "save" de carreira do usuário
-- ═══════════════════════════════════════════════════════════
create table public.careers (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id) on delete cascade not null,
  slug             text not null,                           -- URL-friendly identifier
  
  -- Identidade do técnico
  manager_type     text not null check (manager_type in ('real', 'fictional')),
  manager_name     text not null,
  manager_bio      text,                                    -- bio gerada/editada
  manager_origin   text,                                    -- história de chegada ao clube
  
  -- Clube e contexto
  club_name        text not null,
  club_league      text not null,
  club_country     text not null,
  club_tier        text,                                    -- top | mid | lower | national
  season_start     text not null,                          -- ex: "2025/26"
  initial_objective text,                                  -- sobrevivência | reconstrução | dominância
  
  -- Estado atual (atualizado a cada evento)
  current_season   text,
  events_count     int default 0,
  
  -- Metadados
  is_active        boolean default true,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  
  unique(user_id, slug)
);

create index idx_careers_user_id on public.careers(user_id);

-- ═══════════════════════════════════════════════════════════
-- CAREER MEMORY
-- Contexto persistido por carreira para o "universo vivo"
-- JSON estruturado que alimenta os prompts de IA
-- ═══════════════════════════════════════════════════════════
create table public.career_memory (
  id            uuid primary key default uuid_generate_v4(),
  career_id     uuid references public.careers(id) on delete cascade not null unique,
  
  -- Fatos estabelecidos (array JSON de strings)
  established_facts    jsonb default '[]'::jsonb,
  
  -- Personagens recorrentes (array de {name, role, relationship})
  recurring_characters jsonb default '[]'::jsonb,
  
  -- Narrativas em andamento (array de {title, description, started_at})
  active_narratives    jsonb default '[]'::jsonb,
  
  -- Rivalidades criadas (array de {rival_club, description})
  rivalries            jsonb default '[]'::jsonb,
  
  -- Jogadores em destaque {player_name: description}
  player_highlights    jsonb default '{}'::jsonb,
  
  -- Últimos 10 resultados (para contexto imediato)
  recent_results       jsonb default '[]'::jsonb,
  
  -- Contratações da carreira
  key_signings         jsonb default '[]'::jsonb,
  
  updated_at    timestamptz default now() not null
);

-- ═══════════════════════════════════════════════════════════
-- CAREER EVENTS
-- Cada input do usuário sobre um acontecimento
-- ═══════════════════════════════════════════════════════════
create table public.career_events (
  id            uuid primary key default uuid_generate_v4(),
  career_id     uuid references public.careers(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  
  event_type    text not null check (event_type in (
    'match_result',     -- resultado de partida
    'signing',          -- contratação
    'departure',        -- saída de jogador
    'squad_update',     -- atualização geral do elenco
    'season_start',     -- início de temporada
    'title_won',        -- título conquistado
    'dismissal_risk',   -- risco de demissão
    'press_conference', -- coletiva de imprensa
    'custom'            -- evento personalizado
  )),
  
  -- Input do usuário (texto livre + dados estruturados)
  raw_input     text not null,
  structured_data jsonb,  -- dados extraídos/parseados pelo IA
  
  -- Contexto do evento
  season        text,
  competition   text,     -- Premier League | FA Cup | Champions League | etc.
  match_week    int,
  
  -- Mídia anexada
  has_image_attachment boolean default false,
  attachment_url text,   -- URL no Supabase Storage
  
  -- Ordem na timeline
  event_order   int,
  
  created_at    timestamptz default now() not null
);

create index idx_career_events_career_id on public.career_events(career_id);
create index idx_career_events_created_at on public.career_events(created_at desc);

-- ═══════════════════════════════════════════════════════════
-- ARTICLES
-- Matérias jornalísticas geradas por IA
-- ═══════════════════════════════════════════════════════════
create table public.articles (
  id              uuid primary key default uuid_generate_v4(),
  career_id       uuid references public.careers(id) on delete cascade not null,
  event_id        uuid references public.career_events(id) on delete set null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  
  -- Conteúdo
  headline        text not null,
  subheadline     text,
  body            text not null,        -- markdown completo da matéria
  
  -- Seções estruturadas (para renderização modular)
  sections        jsonb,               -- {main, tactical, press, social, backstage, closing}
  
  -- Contexto
  season          text,
  competition     text,
  event_type      text,
  
  -- Geração
  model_used      text,                -- gpt-4o | gpt-4o-mini
  tokens_used     int,
  generation_time_ms int,
  
  -- Imagem editorial
  image_url       text,               -- URL no Supabase Storage
  image_prompt    text,               -- prompt usado para gerar a imagem
  image_status    text default 'pending' check (image_status in ('pending', 'generating', 'ready', 'failed')),
  
  -- Compartilhamento
  share_token     text unique default encode(gen_random_bytes(12), 'hex'),
  
  created_at      timestamptz default now() not null
);

create index idx_articles_career_id on public.articles(career_id);
create index idx_articles_created_at on public.articles(created_at desc);
create index idx_articles_share_token on public.articles(share_token);

-- ═══════════════════════════════════════════════════════════
-- SQUAD ANALYSES
-- Análises de elenco e sugestões de contratação
-- ═══════════════════════════════════════════════════════════
create table public.squad_analyses (
  id              uuid primary key default uuid_generate_v4(),
  career_id       uuid references public.careers(id) on delete cascade not null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  
  -- Input
  photo_url       text not null,      -- URL da foto do elenco no Storage
  financial_budget text,              -- orçamento informado pelo usuário
  user_context    text,               -- contexto adicional (posição carente, objetivo)
  
  -- Output
  identified_gaps jsonb,             -- posições carentes identificadas
  suggestions     jsonb not null,    -- array de TransferSuggestion
  
  -- Metadados
  model_used      text,
  tokens_used     int,
  
  created_at      timestamptz default now() not null
);

create index idx_squad_analyses_career_id on public.squad_analyses(career_id);

-- ═══════════════════════════════════════════════════════════
-- MARKET UPDATES
-- Feed diário de transferências reais
-- ═══════════════════════════════════════════════════════════
create table public.market_updates (
  id              uuid primary key default uuid_generate_v4(),
  
  -- Dados do jogador/transferência
  player_name     text not null,
  player_age      int,
  player_position text,
  player_nationality text,
  
  from_club       text,
  to_club         text,
  transfer_type   text check (transfer_type in ('permanent', 'loan', 'rumor', 'renewal', 'release', 'scouted')),
  transfer_fee    text,               -- texto livre (ex: "€25M" ou "free transfer")
  transfer_status text check (transfer_status in ('confirmed', 'rumor', 'negotiating', 'official')),
  
  -- Fonte e contexto
  source_url      text,
  source_name     text,              -- Transfermarkt | Fabrizio Romano | etc.
  summary         text,             -- resumo gerado ou scraped
  
  -- Datas
  published_at    timestamptz,
  synced_at       timestamptz default now() not null,
  date_label      date not null      -- para agrupamento por dia
);

create index idx_market_updates_date_label on public.market_updates(date_label desc);
create index idx_market_updates_player_name on public.market_updates using gin(player_name gin_trgm_ops);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- profiles
alter table public.profiles enable row level security;
create policy "Usuário vê seu próprio perfil" on public.profiles
  for select using (auth.uid() = id);
create policy "Usuário atualiza seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- subscriptions
alter table public.subscriptions enable row level security;
create policy "Usuário vê sua própria assinatura" on public.subscriptions
  for select using (auth.uid() = user_id);

-- usage_tracking
alter table public.usage_tracking enable row level security;
create policy "Usuário vê seu próprio uso" on public.usage_tracking
  for select using (auth.uid() = user_id);

-- careers
alter table public.careers enable row level security;
create policy "Usuário vê suas próprias carreiras" on public.careers
  for select using (auth.uid() = user_id);
create policy "Usuário cria suas próprias carreiras" on public.careers
  for insert with check (auth.uid() = user_id);
create policy "Usuário atualiza suas próprias carreiras" on public.careers
  for update using (auth.uid() = user_id);
create policy "Usuário deleta suas próprias carreiras" on public.careers
  for delete using (auth.uid() = user_id);

-- career_memory
alter table public.career_memory enable row level security;
create policy "Usuário vê memória de suas carreiras" on public.career_memory
  for select using (
    auth.uid() = (select user_id from public.careers where id = career_id)
  );

-- career_events
alter table public.career_events enable row level security;
create policy "Usuário gerencia seus próprios eventos" on public.career_events
  for all using (auth.uid() = user_id);

-- articles
alter table public.articles enable row level security;
create policy "Usuário vê seus próprios artigos" on public.articles
  for select using (auth.uid() = user_id);
-- Artigos públicos via share_token (sem autenticação)
create policy "Artigos públicos por token" on public.articles
  for select using (share_token is not null);

-- squad_analyses
alter table public.squad_analyses enable row level security;
create policy "Usuário vê suas próprias análises" on public.squad_analyses
  for all using (auth.uid() = user_id);

-- market_updates (leitura pública para usuários autenticados)
alter table public.market_updates enable row level security;
create policy "Usuários autenticados veem feed de mercado" on public.market_updates
  for select using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- Criar manualmente no painel do Supabase ou via CLI
-- ═══════════════════════════════════════════════════════════
-- Bucket: "squad-photos" (privado, max 10MB por arquivo)
-- Bucket: "article-images" (público, max 5MB por arquivo)
-- Bucket: "attachments" (privado, max 20MB por arquivo)
```

---

## 5. TIPOS TYPESCRIPT GLOBAIS

`src/types/index.ts`:

```typescript
// ─── Banco de dados ───────────────────────────────────────

export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Subscription = {
  id: string
  user_id: string
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
  price_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export type UsageTracking = {
  id: string
  user_id: string
  articles_generated: number
  images_generated: number
  squad_analyses: number
  created_at: string
  updated_at: string
}

export type CareerManagerType = 'real' | 'fictional'
export type ClubTier = 'top' | 'mid' | 'lower' | 'national'
export type InitialObjective = 'survival' | 'rebuild' | 'dominance' | 'custom'

export type Career = {
  id: string
  user_id: string
  slug: string
  manager_type: CareerManagerType
  manager_name: string
  manager_bio: string | null
  manager_origin: string | null
  club_name: string
  club_league: string
  club_country: string
  club_tier: ClubTier | null
  season_start: string
  initial_objective: string | null
  current_season: string | null
  events_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CareerMemory = {
  id: string
  career_id: string
  established_facts: string[]
  recurring_characters: Array<{
    name: string
    role: string
    relationship: string
  }>
  active_narratives: Array<{
    title: string
    description: string
    started_at: string
  }>
  rivalries: Array<{
    rival_club: string
    description: string
  }>
  player_highlights: Record<string, string>
  recent_results: Array<{
    competition: string
    home_team: string
    away_team: string
    score: string
    date: string
  }>
  key_signings: Array<{
    player_name: string
    from_club: string
    season: string
    context: string
  }>
  updated_at: string
}

export type EventType =
  | 'match_result'
  | 'signing'
  | 'departure'
  | 'squad_update'
  | 'season_start'
  | 'title_won'
  | 'dismissal_risk'
  | 'press_conference'
  | 'custom'

export type CareerEvent = {
  id: string
  career_id: string
  user_id: string
  event_type: EventType
  raw_input: string
  structured_data: Record<string, unknown> | null
  season: string | null
  competition: string | null
  match_week: number | null
  has_image_attachment: boolean
  attachment_url: string | null
  event_order: number
  created_at: string
}

export type ArticleSections = {
  main: string
  tactical: string
  press_comments: PressComment[]
  social_media: SocialPost[]
  backstage: string
  closing: string
}

export type PressComment = {
  outlet: string          // "Sky Sports" | "BBC Sport" | "Vampeta" | etc.
  commentator: string     // nome do comentarista
  stance: 'positive' | 'negative' | 'neutral'
  quote: string
}

export type SocialPost = {
  platform: 'twitter' | 'instagram'
  account_type: 'player' | 'journalist' | 'fan' | 'club' | 'stats' | 'rival' | 'humor'
  handle: string
  display_name: string
  content: string
  emoji_only?: boolean
  reply_to?: string       // handle de quem está respondendo
  likes?: number
  retweets?: number
}

export type Article = {
  id: string
  career_id: string
  event_id: string | null
  user_id: string
  headline: string
  subheadline: string | null
  body: string
  sections: ArticleSections | null
  season: string | null
  competition: string | null
  event_type: string | null
  model_used: string | null
  tokens_used: number | null
  generation_time_ms: number | null
  image_url: string | null
  image_prompt: string | null
  image_status: 'pending' | 'generating' | 'ready' | 'failed'
  share_token: string
  created_at: string
}

export type TransferSuggestion = {
  player_name: string
  age: number
  position: string
  current_club: string
  nationality: string
  estimated_value: string
  transfer_fee_estimate: string
  viability_score: number            // 1-10
  narrative_justification: string    // por que faz sentido narrativamente
  financial_justification: string    // por que o clube pode pagar
  personal_justification: string     // motivação do jogador para ir
  market_context: string             // situação real do jogador (se disponível)
  real_life_data_available: boolean
}

export type SquadAnalysis = {
  id: string
  career_id: string
  user_id: string
  photo_url: string
  financial_budget: string | null
  user_context: string | null
  identified_gaps: string[]
  suggestions: TransferSuggestion[]
  model_used: string | null
  tokens_used: number | null
  created_at: string
}

export type TransferStatus = 'confirmed' | 'rumor' | 'negotiating' | 'official'
export type TransferType = 'permanent' | 'loan' | 'rumor' | 'renewal' | 'release' | 'scouted'

export type MarketUpdate = {
  id: string
  player_name: string
  player_age: number | null
  player_position: string | null
  player_nationality: string | null
  from_club: string | null
  to_club: string | null
  transfer_type: TransferType | null
  transfer_fee: string | null
  transfer_status: TransferStatus | null
  source_url: string | null
  source_name: string | null
  summary: string | null
  published_at: string | null
  synced_at: string
  date_label: string
}

// ─── API Requests / Responses ─────────────────────────────

export type GenerateArticleRequest = {
  career_id: string
  event_type: EventType
  raw_input: string
  season?: string
  competition?: string
  match_week?: number
  attachment_url?: string  // URL de imagem já upada
}

export type GenerateArticleResponse = {
  article: Article
  event: CareerEvent
  usage_remaining: number | null  // null = Pro (sem limite)
}

export type GenerateImageRequest = {
  article_id: string
  headline: string
  club_name: string
  manager_name: string
  event_type: string
}

export type AnalyzeSquadRequest = {
  career_id: string
  photo_url: string
  financial_budget?: string
  user_context?: string
}

// ─── UI / Client ──────────────────────────────────────────

export type UserPlan = 'free' | 'pro'

export type UserContext = {
  profile: Profile
  subscription: Subscription | null
  usage: UsageTracking
  plan: UserPlan
}
```

---

## 6. AUTENTICAÇÃO E MIDDLEWARE

`src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/careers', '/market', '/settings']
const AUTH_PATHS = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)'],
}
```

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

`src/lib/supabase/admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

// Uso exclusivo em server-side (API routes, server actions)
// NUNCA importar em componentes client-side
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
```

---

## 7. CLIENTES DE SERVIÇOS EXTERNOS

`src/lib/openai/client.ts`:
```typescript
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

`src/lib/stripe/client.ts`:
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})
```

---

## 8. MOTOR DE GERAÇÃO DE ARTIGOS (IA)

`src/lib/openai/article-generator.ts`:

Este é o arquivo mais crítico do produto. Leia com atenção.

```typescript
import { openai } from './client'
import type { Career, CareerMemory, ArticleSections } from '@/types'

// ─── System prompt base ───────────────────────────────────
const BASE_SYSTEM_PROMPT = `
Você é um jornalista esportivo inglês de elite cobrindo carreiras fictícias no EA FC.
Escreve para veículos como The Athletic, BBC Sport, Sky Sports e The Guardian.
Você cobre esta carreira há anos e conhece toda a história do treinador e do clube.

REGRAS ABSOLUTAS:
1. Escreva SEMPRE em português do Brasil
2. Preserve nomes de veículos, jornalistas e jogadores no idioma original
3. Tom: profissional, como um grande jornal esportivo — nunca novelesco ou exagerado
4. NUNCA contradiga fatos estabelecidos anteriormente
5. Faça personagens lembrarem de acontecimentos antigos
6. Crie narrativas que se acumulem ao longo das temporadas
7. O universo deve parecer existir independentemente do treinador

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (JSON):
Retorne um JSON válido com os campos: headline, subheadline, sections
Onde sections contém: main, tactical, press_comments, social_media, backstage, closing
`

// ─── Builder de contexto histórico ───────────────────────
function buildMemoryContext(career: Career, memory: CareerMemory): string {
  const parts: string[] = []

  parts.push(`CONTEXTO DA CARREIRA:`)
  parts.push(`Treinador: ${career.manager_name} (${career.manager_type === 'real' ? 'treinador real' : 'treinador fictício'})`)
  parts.push(`Clube: ${career.club_name} | Liga: ${career.club_league} | País: ${career.club_country}`)
  parts.push(`Temporada de início: ${career.season_start}`)
  parts.push(`Objetivo inicial: ${career.initial_objective}`)
  if (career.manager_origin) parts.push(`História de chegada: ${career.manager_origin}`)
  if (career.manager_bio) parts.push(`Bio do treinador: ${career.manager_bio}`)

  if (memory.established_facts.length > 0) {
    parts.push(`\nFATOS ESTABELECIDOS (NUNCA contradizer):`)
    memory.established_facts.forEach(f => parts.push(`- ${f}`))
  }

  if (memory.recent_results.length > 0) {
    parts.push(`\nÚLTIMOS RESULTADOS:`)
    memory.recent_results.slice(-5).forEach(r =>
      parts.push(`- ${r.competition}: ${r.home_team} ${r.score} ${r.away_team}`)
    )
  }

  if (memory.key_signings.length > 0) {
    parts.push(`\nPRINCIPAIS CONTRATAÇÕES DA CARREIRA:`)
    memory.key_signings.slice(-8).forEach(s =>
      parts.push(`- ${s.player_name} (${s.from_club}, ${s.season}): ${s.context}`)
    )
  }

  if (memory.active_narratives.length > 0) {
    parts.push(`\nNARRATIVAS EM ANDAMENTO:`)
    memory.active_narratives.forEach(n =>
      parts.push(`- ${n.title}: ${n.description}`)
    )
  }

  if (memory.rivalries.length > 0) {
    parts.push(`\nRIVALIDADES CRIADAS:`)
    memory.rivalries.forEach(r =>
      parts.push(`- vs ${r.rival_club}: ${r.description}`)
    )
  }

  if (Object.keys(memory.player_highlights).length > 0) {
    parts.push(`\nJOGADORES EM DESTAQUE:`)
    Object.entries(memory.player_highlights).forEach(([player, desc]) =>
      parts.push(`- ${player}: ${desc}`)
    )
  }

  if (memory.recurring_characters.length > 0) {
    parts.push(`\nPERSONAGENS RECORRENTES:`)
    memory.recurring_characters.forEach(c =>
      parts.push(`- ${c.name} (${c.role}): ${c.relationship}`)
    )
  }

  return parts.join('\n')
}

// ─── Prompt de geração de matéria ─────────────────────────
function buildArticlePrompt(
  rawInput: string,
  eventType: string,
  season: string | null,
  competition: string | null,
  matchWeek: number | null
): string {
  return `
ACONTECIMENTO A COBRIR:
Tipo: ${eventType}
${season ? `Temporada: ${season}` : ''}
${competition ? `Competição: ${competition}` : ''}
${matchWeek ? `Rodada: ${matchWeek}` : ''}

INPUT DO USUÁRIO (acontecimento):
${rawInput}

Escreva uma matéria completa sobre este acontecimento seguindo a estrutura JSON abaixo.
Seja específico, cite jogadores, técnicos rivais e contextos reais/fictícios verossímeis.
Varie os comentaristas e perfis de redes sociais — não repita sempre os mesmos.

Responda SOMENTE com JSON válido, sem markdown ao redor, neste formato:
{
  "headline": "título chamativo",
  "subheadline": "subtítulo contextualizando o momento da temporada",
  "sections": {
    "main": "matéria principal em markdown (3-5 parágrafos)",
    "tactical": "análise tática em markdown (2-3 parágrafos)",
    "press_comments": [
      {
        "outlet": "nome do veículo",
        "commentator": "nome do comentarista",
        "stance": "positive|negative|neutral",
        "quote": "comentário/opinião"
      }
    ],
    "social_media": [
      {
        "platform": "twitter|instagram",
        "account_type": "player|journalist|fan|club|stats|rival|humor",
        "handle": "@handle",
        "display_name": "Nome Exibido",
        "content": "conteúdo do post",
        "emoji_only": false,
        "reply_to": "@handle_ou_null",
        "likes": 1234,
        "retweets": 456
      }
    ],
    "backstage": "bastidores em markdown (1-2 parágrafos, inclua rumores verossímeis)",
    "closing": "parágrafo de fechamento com gancho para próximo jogo/restante da temporada"
  }
}

REQUISITOS DA SEÇÃO press_comments:
- Mínimo 6 comentaristas, máximo 10
- Incluir pelo menos: Sky Sports, BBC Sport, Cazé TV, Vampeta, 1 comentarista sul-americano
- Incluir pelo menos 2 opiniões negativas/críticas e 2 positivas
- Jamie Carragher, Rio Ferdinand, Alan Shearer, Micah Richards devem aparecer quando fizer sentido
- Fabrizio Romano apenas em matérias de contratação/rumores

REQUISITOS DA SEÇÃO social_media:
- Mínimo 10 posts, máximo 18
- Misture: jogadores do elenco, ex-jogadores, jornalistas, torcedores, páginas de stats, páginas de humor, perfis de scouting, técnicos rivais, ídolos do clube
- Inclua pelo menos: 2 posts de humor/meme, 1 post só com emojis, 1 resposta a outro post, 1 perfil de estatísticas
- Varie entre apoio, provocação, piadas e análises sérias
- Likes e retweets devem ser realistas e variados (de 23 a 47.000)
`
}

// ─── Função principal de geração ─────────────────────────
export async function generateArticle(params: {
  career: Career
  memory: CareerMemory
  rawInput: string
  eventType: string
  season?: string | null
  competition?: string | null
  matchWeek?: number | null
  attachmentUrl?: string | null
}): Promise<{ sections: ArticleSections; headline: string; subheadline: string; tokensUsed: number }> {
  const memoryContext = buildMemoryContext(params.career, params.memory)
  const articlePrompt = buildArticlePrompt(
    params.rawInput,
    params.eventType,
    params.season ?? null,
    params.competition ?? null,
    params.matchWeek ?? null
  )

  const messages: Parameters<typeof openai.chat.completions.create>[0]['messages'] = [
    {
      role: 'system',
      content: BASE_SYSTEM_PROMPT + '\n\n' + memoryContext,
    },
  ]

  // Se há imagem anexada, usar visão do GPT-4o
  if (params.attachmentUrl) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: params.attachmentUrl, detail: 'high' },
        },
        {
          type: 'text',
          text: `Analise a imagem acima (pode ser tabela de classificação, escalação ou estatísticas) e incorpore essas informações na matéria.\n\n${articlePrompt}`,
        },
      ],
    })
  } else {
    messages.push({ role: 'user', content: articlePrompt })
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.85,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('Resposta vazia da OpenAI')

  const parsed = JSON.parse(content)
  return {
    headline: parsed.headline,
    subheadline: parsed.subheadline,
    sections: parsed.sections,
    tokensUsed: response.usage?.total_tokens ?? 0,
  }
}

// ─── Extrator de fatos para atualizar a memória ───────────
export async function extractMemoryUpdates(params: {
  rawInput: string
  eventType: string
  generatedArticle: string
  career: Career
}): Promise<Partial<CareerMemory>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Você é um extrator de fatos de artigos esportivos fictícios.
Analise o acontecimento e extraia fatos que devem ser persistidos na memória da carreira.
Responda SOMENTE com JSON válido.`,
      },
      {
        role: 'user',
        content: `
Acontecimento (tipo: ${params.eventType}):
${params.rawInput}

Clube: ${params.career.club_name} | Treinador: ${params.career.manager_name}

Extraia e retorne JSON com:
{
  "new_facts": ["fato 1", "fato 2"],
  "result_to_add": {
    "competition": "nome",
    "home_team": "time",
    "away_team": "time",
    "score": "2-1",
    "date": "${new Date().toISOString().split('T')[0]}"
  } | null,
  "signing_to_add": {
    "player_name": "nome",
    "from_club": "clube",
    "season": "2025/26",
    "context": "contexto"
  } | null,
  "player_highlight_update": {"nome_jogador": "descrição"} | null
}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  })

  return JSON.parse(response.choices[0].message.content ?? '{}')
}
```

---

## 9. MOTOR DE GERAÇÃO DE IMAGENS (IA)

`src/lib/openai/image-generator.ts`:

```typescript
import { openai } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function generateArticleImage(params: {
  articleId: string
  headline: string
  clubName: string
  managerName: string
  eventType: string
}): Promise<{ imageUrl: string; prompt: string }> {
  const prompt = buildImagePrompt(params)

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',        // landscape ideal para compartilhamento
    quality: 'hd',
    style: 'vivid',
  })

  const openaiUrl = response.data[0]?.url
  if (!openaiUrl) throw new Error('DALL-E não retornou URL')

  // Baixar e salvar no Supabase Storage (URLs da OpenAI expiram em 1h)
  const imageBuffer = await fetch(openaiUrl).then(r => r.arrayBuffer())
  const supabase = createAdminClient()
  const fileName = `${params.articleId}-${Date.now()}.webp`

  const { data: uploadData, error } = await supabase.storage
    .from('article-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('article-images')
    .getPublicUrl(uploadData.path)

  return { imageUrl: publicUrl, prompt }
}

function buildImagePrompt(params: {
  headline: string
  clubName: string
  managerName: string
  eventType: string
}): string {
  const base = `
Newspaper sports front page editorial photograph, professional photojournalism style.
Football (soccer) manager ${params.managerName} and ${params.clubName}.
Headline text overlay: "${params.headline.substring(0, 80)}".
`

  const eventStyles: Record<string, string> = {
    match_result: 'Dramatic celebration or dejection on the pitch, stadium lights, crowd in background, golden hour lighting.',
    signing: 'Press conference room, player and manager holding up the club shirt, official backdrop with club crest, media cameras.',
    title_won: 'Trophy lift, confetti falling, entire team celebrating, night stadium illuminated.',
    dismissal_risk: 'Tense manager on touchline, arms crossed, dramatic stormy atmosphere.',
    season_start: 'Training ground, manager with tactical board, players warming up in background.',
  }

  const style = eventStyles[params.eventType] ?? eventStyles.match_result

  return `${base}${style}
Style: high-quality newspaper editorial photography, sports journalism, cinematic color grading, dramatic composition.
Layout: bold headline overlay at bottom, newspaper branding bar at top.
DO NOT include: watermarks, logos of real newspapers, text errors, extra people.
Photorealistic, ultra-detailed, 8K quality.`.trim()
}
```

---

## 10. ANALISADOR DE ELENCO (IA)

`src/lib/openai/squad-analyzer.ts`:

```typescript
import { openai } from './client'
import type { Career, TransferSuggestion } from '@/types'

export async function analyzeSquadAndSuggestSignings(params: {
  career: Career
  photoUrl: string
  financialBudget?: string
  userContext?: string
}): Promise<{ gaps: string[]; suggestions: TransferSuggestion[]; tokensUsed: number }> {

  const systemPrompt = `
Você é um scout de elite e especialista em mercado de transferências.
Analisa elencos do EA FC e sugere contratações realistas e contextualizadas.
Considera: posições carentes, poder financeiro do clube, momento de carreira do atleta na vida real, 
viabilidade narrativa (motivação pessoal do jogador), localidade e nível competitivo.
Responda SOMENTE com JSON válido.
`

  const userPrompt = `
Analise o elenco na imagem para o ${params.career.club_name} (${params.career.club_league}).
Treinador: ${params.career.manager_name}

${params.financialBudget ? `Orçamento disponível: ${params.financialBudget}` : 'Orçamento: não informado (assuma orçamento moderado para a liga)'}
${params.userContext ? `Contexto adicional: ${params.userContext}` : ''}

1. Identifique as principais posições carentes ou que precisam ser reforçadas
2. Sugira 5 a 8 jogadores reais (que existem ou existiram) para cada posição carente identificada
3. Para cada sugestão, justifique por que aquele jogador específico iria para aquele clube agora

Retorne JSON:
{
  "identified_gaps": ["posição/necessidade 1", "posição/necessidade 2"],
  "suggestions": [
    {
      "player_name": "Nome Completo",
      "age": 24,
      "position": "Ponta Direita",
      "current_club": "Clube Atual",
      "nationality": "Brasileira",
      "estimated_value": "€15M",
      "transfer_fee_estimate": "€12M - €18M",
      "viability_score": 8,
      "narrative_justification": "Por que a narrativa desta carreira combina com este jogador",
      "financial_justification": "Por que o clube consegue pagar / negociar",
      "personal_justification": "Motivação do jogador: fase de carreira, desejo de mais minutos, conexão com a liga, família, etc.",
      "market_context": "Situação atual do jogador no mercado real (contratos, rumores conhecidos)",
      "real_life_data_available": true
    }
  ]
}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: params.photoUrl, detail: 'high' } },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
    temperature: 0.7,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('Resposta vazia da OpenAI')

  const parsed = JSON.parse(content)
  return {
    gaps: parsed.identified_gaps ?? [],
    suggestions: parsed.suggestions ?? [],
    tokensUsed: response.usage?.total_tokens ?? 0,
  }
}
```

---

## 11. SCRAPER DE MERCADO DE TRANSFERÊNCIAS

`src/lib/scrapers/transfermarkt.ts`:

```typescript
import * as cheerio from 'cheerio'
import type { MarketUpdate } from '@/types'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CarreiraPRO/1.0)',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
}

// Scrapa a página de últimas transferências do Transfermarkt
export async function scrapeLatestTransfers(): Promise<Partial<MarketUpdate>[]> {
  try {
    const res = await fetch('https://www.transfermarkt.com/transfers/neuestetransfers/statistik', {
      headers: HEADERS,
      next: { revalidate: 0 },
    })

    if (!res.ok) throw new Error(`TM scrape failed: ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const updates: Partial<MarketUpdate>[] = []
    const today = new Date().toISOString().split('T')[0]

    // Selecionar linhas da tabela de transferências
    $('table.items tbody tr').each((_, row) => {
      const $row = $(row)
      const playerName = $row.find('.spielprofil_tooltip').first().text().trim()
      const fromClub = $row.find('.vereinprofil_tooltip').eq(0).text().trim()
      const toClub = $row.find('.vereinprofil_tooltip').eq(1).text().trim()
      const fee = $row.find('.rechts.hauptlink').text().trim()

      if (!playerName) return

      updates.push({
        player_name: playerName,
        from_club: fromClub || null,
        to_club: toClub || null,
        transfer_fee: fee || null,
        transfer_type: fee === '-' || fee === 'loan' ? 'loan' : 'permanent',
        transfer_status: 'confirmed',
        source_name: 'Transfermarkt',
        source_url: 'https://www.transfermarkt.com',
        date_label: today,
        synced_at: new Date().toISOString(),
        summary: `${playerName}: ${fromClub} → ${toClub}${fee ? ` (${fee})` : ''}`,
      })
    })

    return updates.slice(0, 50)  // limitar a 50 por execução
  } catch (error) {
    console.error('[TransfermarktScraper] Erro:', error)
    return []
  }
}

// Fallback: busca no BBC Sport se TM falhar
export async function scrapeBBCSportTransfers(): Promise<Partial<MarketUpdate>[]> {
  try {
    const res = await fetch('https://www.bbc.com/sport/football/transfers', {
      headers: HEADERS,
    })
    const html = await res.text()
    const $ = cheerio.load(html)
    const updates: Partial<MarketUpdate>[] = []
    const today = new Date().toISOString().split('T')[0]

    $('[data-testid="transfer-item"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text) {
        updates.push({
          player_name: text.split(' ')[0] ?? 'Unknown',
          summary: text,
          source_name: 'BBC Sport',
          source_url: 'https://www.bbc.com/sport/football/transfers',
          transfer_status: 'confirmed',
          date_label: today,
          synced_at: new Date().toISOString(),
        })
      }
    })

    return updates.slice(0, 30)
  } catch {
    return []
  }
}
```

---

## 12. API ROUTES — ESPECIFICAÇÃO COMPLETA

### 12.1 POST /api/articles/generate

`src/app/api/articles/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateArticle, extractMemoryUpdates } from '@/lib/openai/article-generator'
import { checkAndDecrementUsage } from '@/lib/freemium'
import type { GenerateArticleRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body: GenerateArticleRequest = await req.json()
    const { career_id, event_type, raw_input, season, competition, match_week, attachment_url } = body

    // 1. Verificar se o usuário tem acesso à carreira
    const { data: career, error: careerError } = await supabase
      .from('careers')
      .select('*')
      .eq('id', career_id)
      .eq('user_id', user.id)
      .single()

    if (careerError || !career) {
      return NextResponse.json({ error: 'Carreira não encontrada' }, { status: 404 })
    }

    // 2. Verificar cota (freemium)
    const { allowed, remaining } = await checkAndDecrementUsage(user.id, 'articles_generated')
    if (!allowed) {
      return NextResponse.json({
        error: 'PAYWALL',
        message: 'Você usou sua geração gratuita. Assine o plano Pro para continuar.',
      }, { status: 402 })
    }

    // 3. Buscar memória da carreira
    const admin = createAdminClient()
    const { data: memory } = await admin
      .from('career_memory')
      .select('*')
      .eq('career_id', career_id)
      .single()

    // Se não existe memória, criar uma vazia
    const careerMemory = memory ?? {
      established_facts: [],
      recurring_characters: [],
      active_narratives: [],
      rivalries: [],
      player_highlights: {},
      recent_results: [],
      key_signings: [],
    }

    // 4. Gerar matéria via OpenAI
    const startTime = Date.now()
    const { headline, subheadline, sections, tokensUsed } = await generateArticle({
      career,
      memory: careerMemory,
      rawInput: raw_input,
      eventType: event_type,
      season,
      competition,
      matchWeek: match_week,
      attachmentUrl: attachment_url,
    })
    const generationTime = Date.now() - startTime

    // 5. Salvar evento
    const { data: event } = await admin
      .from('career_events')
      .insert({
        career_id,
        user_id: user.id,
        event_type,
        raw_input,
        season: season ?? null,
        competition: competition ?? null,
        match_week: match_week ?? null,
        has_image_attachment: !!attachment_url,
        attachment_url: attachment_url ?? null,
        event_order: (career.events_count ?? 0) + 1,
      })
      .select()
      .single()

    // 6. Salvar artigo
    const bodyText = [
      `# ${headline}`,
      subheadline ? `*${subheadline}*` : '',
      '',
      sections.main,
      '',
      '## Análise Tática',
      sections.tactical,
      '',
      sections.closing,
    ].filter(Boolean).join('\n')

    const { data: article } = await admin
      .from('articles')
      .insert({
        career_id,
        event_id: event?.id ?? null,
        user_id: user.id,
        headline,
        subheadline,
        body: bodyText,
        sections,
        season: season ?? null,
        competition: competition ?? null,
        event_type,
        model_used: 'gpt-4o',
        tokens_used: tokensUsed,
        generation_time_ms: generationTime,
        image_status: 'pending',
      })
      .select()
      .single()

    // 7. Atualizar memória (async, não bloqueia resposta)
    extractMemoryUpdates({
      rawInput: raw_input,
      eventType: event_type,
      generatedArticle: bodyText,
      career,
    }).then(async (updates) => {
      const currentMemory = careerMemory
      const newFacts = [...(currentMemory.established_facts ?? []), ...(updates.new_facts ?? [])]
      const newResults = updates.result_to_add
        ? [...(currentMemory.recent_results ?? []).slice(-9), updates.result_to_add]
        : currentMemory.recent_results
      const newSignings = updates.signing_to_add
        ? [...(currentMemory.key_signings ?? []), updates.signing_to_add]
        : currentMemory.key_signings
      const newHighlights = {
        ...(currentMemory.player_highlights ?? {}),
        ...(updates.player_highlight_update ?? {}),
      }

      await admin.from('career_memory').upsert({
        career_id,
        established_facts: newFacts.slice(-50),  // manter últimos 50 fatos
        recurring_characters: currentMemory.recurring_characters,
        active_narratives: currentMemory.active_narratives,
        rivalries: currentMemory.rivalries,
        player_highlights: newHighlights,
        recent_results: newResults,
        key_signings: newSignings.slice(-20),
      })
    }).catch(console.error)

    // 8. Incrementar contador de eventos da carreira
    await admin
      .from('careers')
      .update({ events_count: (career.events_count ?? 0) + 1 })
      .eq('id', career_id)

    return NextResponse.json({
      article,
      event,
      usage_remaining: remaining,
    })

  } catch (error) {
    console.error('[/api/articles/generate]', error)
    return NextResponse.json({ error: 'Erro interno ao gerar matéria' }, { status: 500 })
  }
}
```

### 12.2 POST /api/images/generate

`src/app/api/images/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateArticleImage } from '@/lib/openai/image-generator'
import { checkAndDecrementUsage } from '@/lib/freemium'
import type { GenerateImageRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body: GenerateImageRequest = await req.json()

    const { allowed } = await checkAndDecrementUsage(user.id, 'images_generated')
    if (!allowed) {
      return NextResponse.json({ error: 'PAYWALL' }, { status: 402 })
    }

    // Atualizar status para 'generating'
    const admin = createAdminClient()
    await admin.from('articles').update({ image_status: 'generating' }).eq('id', body.article_id)

    const { imageUrl, prompt } = await generateArticleImage(body)

    await admin.from('articles').update({
      image_url: imageUrl,
      image_prompt: prompt,
      image_status: 'ready',
    }).eq('id', body.article_id)

    return NextResponse.json({ image_url: imageUrl })

  } catch (error) {
    console.error('[/api/images/generate]', error)
    // Marcar como falhou mas não bloquear o usuário
    return NextResponse.json({ error: 'Falha na geração de imagem' }, { status: 500 })
  }
}
```

### 12.3 POST /api/squad/analyze

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeSquadAndSuggestSignings } from '@/lib/openai/squad-analyzer'
import { checkAndDecrementUsage } from '@/lib/freemium'
import type { AnalyzeSquadRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body: AnalyzeSquadRequest = await req.json()

    // Squad analysis é exclusivo Pro
    const { allowed } = await checkAndDecrementUsage(user.id, 'squad_analyses')
    if (!allowed) {
      return NextResponse.json({ error: 'PAYWALL', feature: 'squad_analysis' }, { status: 402 })
    }

    const { data: career } = await supabase
      .from('careers')
      .select('*')
      .eq('id', body.career_id)
      .eq('user_id', user.id)
      .single()

    if (!career) return NextResponse.json({ error: 'Carreira não encontrada' }, { status: 404 })

    const { gaps, suggestions, tokensUsed } = await analyzeSquadAndSuggestSignings({
      career,
      photoUrl: body.photo_url,
      financialBudget: body.financial_budget,
      userContext: body.user_context,
    })

    const admin = createAdminClient()
    const { data: analysis } = await admin
      .from('squad_analyses')
      .insert({
        career_id: body.career_id,
        user_id: user.id,
        photo_url: body.photo_url,
        financial_budget: body.financial_budget ?? null,
        user_context: body.user_context ?? null,
        identified_gaps: gaps,
        suggestions,
        model_used: 'gpt-4o',
        tokens_used: tokensUsed,
      })
      .select()
      .single()

    return NextResponse.json({ analysis })

  } catch (error) {
    console.error('[/api/squad/analyze]', error)
    return NextResponse.json({ error: 'Erro na análise do elenco' }, { status: 500 })
  }
}
```

### 12.4 GET /api/market

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const position = searchParams.get('position')
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  let query = supabase
    .from('market_updates')
    .select('*')
    .eq('date_label', date)
    .order('synced_at', { ascending: false })
    .limit(limit)

  if (position) query = query.ilike('player_position', `%${position}%`)
  if (status) query = query.eq('transfer_status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updates: data })
}
```

### 12.5 POST /api/cron/market-sync

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scrapeLatestTransfers, scrapeBBCSportTransfers } from '@/lib/scrapers/transfermarkt'

export async function GET(req: NextRequest) {
  // Validar que é o cron do Vercel
  const cronSecret = req.headers.get('authorization')
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    let updates = await scrapeLatestTransfers()

    // Fallback se TM falhar
    if (updates.length === 0) {
      updates = await scrapeBBCSportTransfers()
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'Nenhuma atualização encontrada', count: 0 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('market_updates').upsert(updates, {
      onConflict: 'player_name,date_label',
      ignoreDuplicates: true,
    })

    if (error) throw error

    // Limpar dados com mais de 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    await admin
      .from('market_updates')
      .delete()
      .lt('date_label', thirtyDaysAgo.toISOString().split('T')[0])

    return NextResponse.json({ message: 'Sync concluído', count: updates.length })

  } catch (error) {
    console.error('[/api/cron/market-sync]', error)
    return NextResponse.json({ error: 'Falha no sync' }, { status: 500 })
  }
}
```

### 12.6 Stripe — Checkout e Webhook

`src/app/api/stripe/checkout/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    customer_email: user.email,
    metadata: { user_id: user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
    locale: 'pt-BR',
  })

  return NextResponse.json({ url: session.url })
}
```

`src/app/api/stripe/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.user_id
      if (!userId) break

      await admin.from('subscriptions').upsert({
        id: sub.id,
        user_id: userId,
        status: sub.status,
        price_id: sub.items.data[0]?.price.id ?? null,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await admin.from('subscriptions').update({ status: 'canceled' }).eq('id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }
```

---

## 13. PÁGINAS E COMPONENTES

### 13.1 Sistema de Freemium

`src/lib/freemium.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

type UsageField = 'articles_generated' | 'images_generated' | 'squad_analyses'

const FREE_LIMITS: Record<UsageField, number> = {
  articles_generated: parseInt(process.env.FREE_ARTICLE_LIMIT ?? '1'),
  images_generated: parseInt(process.env.FREE_IMAGE_LIMIT ?? '1'),
  squad_analyses: parseInt(process.env.FREE_SQUAD_ANALYSIS_LIMIT ?? '0'),
}

export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return data ? 'pro' : 'free'
}

export async function checkAndDecrementUsage(
  userId: string,
  field: UsageField
): Promise<{ allowed: boolean; remaining: number | null }> {
  const plan = await getUserPlan(userId)

  // Pro: sem limite
  if (plan === 'pro') return { allowed: true, remaining: null }

  const admin = createAdminClient()
  const { data: usage } = await admin
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!usage) return { allowed: false, remaining: 0 }

  const current = usage[field] as number
  const limit = FREE_LIMITS[field]

  if (current >= limit) {
    return { allowed: false, remaining: 0 }
  }

  // Decrementar
  await admin
    .from('usage_tracking')
    .update({ [field]: current + 1, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return { allowed: true, remaining: limit - current - 1 }
}
```

### 13.2 Componente Paywall

`src/components/shared/Paywall.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Newspaper, Image, Users, TrendingUp } from 'lucide-react'

export function Paywall({ feature }: { feature?: string }) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full border-2 border-primary/20">
        <CardHeader className="text-center pb-2">
          <Badge className="w-fit mx-auto mb-3" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            CarreiraPRO Plus
          </Badge>
          <CardTitle className="text-2xl">
            Continue sua cobertura
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {feature === 'squad_analysis'
              ? 'Análise de elenco é exclusiva do plano Pro'
              : 'Você usou sua geração gratuita. Assine para continuar.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { icon: Newspaper, text: 'Matérias jornalísticas ilimitadas' },
              { icon: Image, text: 'Imagens editoriais ilimitadas' },
              { icon: Users, text: 'Análise de elenco com sugestões de contratação' },
              { icon: TrendingUp, text: 'Feed diário de transferências reais' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {text}
              </div>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-4 text-center">
            <span className="text-3xl font-bold">R$49,90</span>
            <span className="text-muted-foreground text-sm">/mês</span>
            <p className="text-xs text-muted-foreground mt-1">Cancele quando quiser</p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Redirecionando...' : 'Assinar CarreiraPRO Pro'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 13.3 Formulário de Input de Evento

`src/components/career/EventInputForm.tsx`:

```tsx
'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImagePlus, Loader2, Newspaper } from 'lucide-react'
import type { EventType } from '@/types'

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  match_result: '⚽ Resultado de Partida',
  signing: '🤝 Contratação',
  departure: '✈️ Saída de Jogador',
  squad_update: '📋 Atualização do Elenco',
  season_start: '🏁 Início de Temporada',
  title_won: '🏆 Título Conquistado',
  dismissal_risk: '🔥 Risco de Demissão',
  press_conference: '🎤 Coletiva de Imprensa',
  custom: '📰 Acontecimento Personalizado',
}

type Props = {
  careerId: string
  careerSlug: string
}

export function EventInputForm({ careerId, careerSlug }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [eventType, setEventType] = useState<EventType>('match_result')
  const [rawInput, setRawInput] = useState('')
  const [season, setSeason] = useState('')
  const [competition, setCompetition] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawInput.trim()) return
    setLoading(true)
    setError(null)

    try {
      let attachmentUrl: string | undefined

      // Upload de imagem se houver
      if (attachment) {
        const formData = new FormData()
        formData.append('file', attachment)
        formData.append('career_id', careerId)
        const uploadRes = await fetch('/api/upload/attachment', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        attachmentUrl = uploadData.url
      }

      // Gerar matéria
      const res = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career_id: careerId,
          event_type: eventType,
          raw_input: rawInput,
          season: season || undefined,
          competition: competition || undefined,
          attachment_url: attachmentUrl,
        }),
      })

      const data = await res.json()

      if (res.status === 402) {
        // Paywall — redirecionar para settings com paywall
        router.push('/settings?paywall=true')
        return
      }

      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar matéria')

      // Redirecionar para a matéria gerada
      router.push(`/careers/${careerSlug}/article/${data.article.id}`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Tipo de Acontecimento</Label>
        <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Temporada (opcional)</Label>
          <Input
            placeholder="ex: 2025/26"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Competição (opcional)</Label>
          <Input
            placeholder="ex: Premier League"
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>O que aconteceu?</Label>
        <Textarea
          placeholder={
            eventType === 'match_result'
              ? 'Ex: Venci o Arsenal 2x1 fora de casa. Bamford marcou dois gols e foi o melhor em campo. Salah saiu lesionado no 2° tempo...'
              : eventType === 'signing'
              ? 'Ex: Contratei o Samu Omorodion por £14M. Ele vinha do Atlético de Madrid e escolheu o Leeds por ser titular garantido...'
              : 'Descreva o acontecimento com o máximo de detalhes possível...'
          }
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Quanto mais detalhes você fornecer, melhor a matéria gerada.
        </p>
      </div>

      {/* Upload de imagem */}
      <div className="space-y-2">
        <Label>Imagem (opcional)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
          />
          <ImagePlus className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {attachment ? attachment.name : 'Tabela, escalação ou estatísticas — a IA vai ler e incluir na matéria'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading || !rawInput.trim()} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando matéria...
          </>
        ) : (
          <>
            <Newspaper className="w-4 h-4 mr-2" />
            Publicar Matéria
          </>
        )}
      </Button>
    </form>
  )
}
```

### 13.4 Renderizador de Artigo

`src/components/article/ArticleRenderer.tsx`:

```tsx
import ReactMarkdown from 'react-markdown'
import type { Article, PressComment, SocialPost } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Twitter, Instagram, ThumbsUp, Repeat2 } from 'lucide-react'

const STANCE_COLORS = {
  positive: 'bg-green-50 border-green-200 text-green-800',
  negative: 'bg-red-50 border-red-200 text-red-800',
  neutral: 'bg-gray-50 border-gray-200 text-gray-800',
}

export function ArticleRenderer({ article }: { article: Article }) {
  const sections = article.sections

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-3">
        {article.image_url && article.image_status === 'ready' && (
          <img
            src={article.image_url}
            alt={article.headline}
            className="w-full rounded-xl object-cover aspect-video"
          />
        )}
        <h1 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">
          {article.headline}
        </h1>
        {article.subheadline && (
          <p className="text-lg text-muted-foreground">{article.subheadline}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(article.created_at).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
          {article.competition && <><Separator orientation="vertical" className="h-4" /><Badge variant="outline">{article.competition}</Badge></>}
          {article.season && <><Separator orientation="vertical" className="h-4" /><span>{article.season}</span></>}
        </div>
      </header>

      <Separator />

      {/* Matéria principal */}
      {sections?.main && (
        <section className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
          <ReactMarkdown>{sections.main}</ReactMarkdown>
        </section>
      )}

      {/* Análise tática */}
      {sections?.tactical && (
        <section className="bg-muted/50 rounded-xl p-5 space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Análise Tática
          </h2>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{sections.tactical}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Comentários da imprensa */}
      {sections?.press_comments && sections.press_comments.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            O Que a Imprensa Diz
          </h2>
          <div className="grid gap-3">
            {sections.press_comments.map((comment: PressComment, i: number) => (
              <div
                key={i}
                className={`border rounded-lg p-4 ${STANCE_COLORS[comment.stance]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{comment.commentator}</span>
                  <Badge variant="outline" className="text-xs">{comment.outlet}</Badge>
                </div>
                <p className="text-sm italic">"{comment.quote}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Redes sociais */}
      {sections?.social_media && sections.social_media.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Redes Sociais
          </h2>
          <div className="space-y-3">
            {sections.social_media.map((post: SocialPost, i: number) => (
              <div key={i} className="border rounded-xl p-4 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                      {post.display_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{post.display_name}</p>
                      <p className="text-xs text-muted-foreground">{post.handle}</p>
                    </div>
                  </div>
                  {post.platform === 'twitter'
                    ? <Twitter className="w-4 h-4 text-sky-500" />
                    : <Instagram className="w-4 h-4 text-pink-500" />
                  }
                </div>
                <p className="text-sm">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {post.likes?.toLocaleString('pt-BR')}
                  </span>
                  {post.retweets && (
                    <span className="flex items-center gap-1">
                      <Repeat2 className="w-3 h-3" />
                      {post.retweets.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bastidores */}
      {sections?.backstage && (
        <section className="border-l-4 border-primary/30 pl-4 space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Bastidores
          </h2>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{sections.backstage}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Fechamento */}
      {sections?.closing && (
        <section className="bg-primary/5 rounded-xl p-5">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{sections.closing}</ReactMarkdown>
          </div>
        </section>
      )}
    </article>
  )
}
```

---

## 14. SISTEMA DE FREEMIUM E PAYWALL

Resumo do comportamento esperado:

| Ação | Free | Pro |
|---|---|---|
| Criar conta e carreira | ✅ | ✅ |
| Questionário de história | ✅ | ✅ |
| Gerar matéria | 1x vitalício | Ilimitado |
| Gerar imagem editorial | 1x vitalício | Ilimitado |
| Análise de elenco | ❌ | Ilimitado |
| Feed de mercado | ✅ (limitado a hoje) | ✅ (30 dias) |
| Timeline da carreira | ✅ | ✅ |
| Sugestão por estilo de jogo | ❌ | ✅ após 5 inputs |

Paywall deve ser exibido:
- Na API: retornar `{ status: 402, error: 'PAYWALL' }`
- No cliente: interceptar 402 e renderizar o componente `<Paywall />`
- Nunca cobrar a cota gratuita se a geração falhar

---

## 15. STRIPE — CONFIGURAÇÃO

1. Criar produto "CarreiraPRO Pro" no painel Stripe
2. Criar preço: R$49,90 / mês recorrente / BRL
3. Copiar o Price ID para `STRIPE_PRO_PRICE_ID`
4. Configurar webhook no Stripe para:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Endpoint do webhook: `https://seu-dominio.com/api/stripe/webhook`
6. Para dev local: usar `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 16. CRON JOBS

`vercel.json` na raiz:

```json
{
  "crons": [
    {
      "path": "/api/cron/market-sync",
      "schedule": "0 7 * * *"
    }
  ]
}
```

O cron executa todo dia às 07:00 UTC (04:00 Brasília).
O header `Authorization: Bearer {CRON_SECRET}` é enviado automaticamente pelo Vercel.

---

## 17. FASES DE IMPLEMENTAÇÃO

### FASE 1 — Fundação (Semana 1–2)
**Objetivo:** Usuário consegue criar conta, criar uma carreira e gerar a primeira matéria.

- [ ] Setup do projeto Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [ ] Configurar Supabase (projeto, migrations, storage buckets)
- [ ] Implementar auth (login, signup, logout, middleware)
- [ ] CRUD básico de carreiras (`/api/careers`)
- [ ] Questionário de nova carreira (`/careers/new`)
- [ ] Implementar `lib/openai/article-generator.ts`
- [ ] Implementar `lib/memory/context-builder.ts` + tabela `career_memory`
- [ ] Implementar `POST /api/articles/generate`
- [ ] Página de input de evento (`/careers/[slug]/input`)
- [ ] Renderizador de artigo (`ArticleRenderer`)
- [ ] Página de artigo individual

**Critério de conclusão:** usuário cria conta → cria carreira → digita resultado → vê matéria completa publicada.

---

### FASE 2 — Imagem e Freemium (Semana 3)
**Objetivo:** Imagem editorial gerada + paywall funcionando.

- [ ] Implementar `lib/openai/image-generator.ts`
- [ ] Implementar `POST /api/images/generate`
- [ ] Geração de imagem assíncrona após publicação da matéria (polling ou webhook interno)
- [ ] Implementar `lib/freemium.ts`
- [ ] Componente `<Paywall />`
- [ ] Configurar Stripe (produto, preço, webhook)
- [ ] `POST /api/stripe/checkout` e `POST /api/stripe/webhook`
- [ ] Página de settings com estado da assinatura

**Critério de conclusão:** usuário free vê matéria + imagem na primeira geração → na segunda, vê o paywall → assina → passa a ter acesso ilimitado.

---

### FASE 3 — Timeline e Memória (Semana 4)
**Objetivo:** Histórico da carreira coeso e memória funcionando entre sessões.

- [ ] Timeline da carreira (`/careers/[slug]/timeline`)
- [ ] Componente `<CareerTimeline />`
- [ ] Página de hub da carreira com métricas (`/careers/[slug]`)
- [ ] Dashboard com lista de carreiras do usuário
- [ ] Refinamento do extrator de memória (`extractMemoryUpdates`)
- [ ] Teste de consistência: gerar 10+ matérias e verificar continuidade narrativa
- [ ] Upload de imagem como attachment no formulário de evento

**Critério de conclusão:** usuário com 5+ matérias vê que personagens e fatos são lembrados nas matérias seguintes.

---

### FASE 4 — Análise de Elenco (Semana 5)
**Objetivo:** Sugestões de contratação funcionando.

- [ ] Implementar `lib/openai/squad-analyzer.ts`
- [ ] `POST /api/squad/analyze`
- [ ] Upload de foto do elenco para Supabase Storage
- [ ] Página de análise de elenco (`/careers/[slug]/squad`)
- [ ] Componente `<SquadUploader />`
- [ ] Componente `<TransferSuggestionCard />`
- [ ] Integrar dados de mercado real nas sugestões (quando disponíveis)

**Critério de conclusão:** usuário Pro faz upload de screenshot do elenco e recebe 5–8 sugestões contextualizadas.

---

### FASE 5 — Feed de Mercado (Semana 6)
**Objetivo:** Transferências reais atualizadas diariamente.

- [ ] Implementar `lib/scrapers/transfermarkt.ts` com fallback `bbc-sport.ts`
- [ ] `GET /api/cron/market-sync` com autenticação por CRON_SECRET
- [ ] `GET /api/market` com filtros
- [ ] Configurar `vercel.json` com cron schedule
- [ ] Página de feed de mercado (`/market`)
- [ ] Componente `<TransferFeed />`
- [ ] Filtros por liga, posição e status

**Critério de conclusão:** cron roda às 7h, feed mostra transferências do dia com filtros funcionando.

---

### FASE 6 — Polimento e Lançamento (Semana 7–8)
**Objetivo:** Produto pronto para os primeiros usuários reais.

- [ ] Sugestão de modo história baseada em estilo de jogo (desbloqueável após 5 inputs)
- [ ] Compartilhamento de matéria via share_token (página pública)
- [ ] Botão de compartilhar imagem editorial
- [ ] SEO básico (metadata, og:image)
- [ ] Error boundaries e estados de loading em todos os componentes
- [ ] Página 404 e de erro
- [ ] Testes de carga nas rotas de IA
- [ ] Configurar Vercel Analytics
- [ ] Documentação de deploy

---

## 18. COMANDOS DE SETUP

```bash
# 1. Criar projeto
pnpm create next-app carreirapro --typescript --tailwind --app --src-dir --import-alias "@/*"
cd carreirapro

# 2. Instalar dependências
pnpm add @supabase/supabase-js @supabase/ssr openai stripe cheerio react-markdown
pnpm add -D @types/cheerio supabase

# 3. Instalar shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input textarea select label badge separator

# 4. Inicializar Supabase localmente (opcional, para dev)
npx supabase init
npx supabase start

# 5. Aplicar migrations
npx supabase db push

# 6. Configurar .env.local (preencher com suas credenciais)
cp .env.example .env.local

# 7. Rodar em desenvolvimento
pnpm dev

# 8. Stripe CLI para testar webhooks localmente
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 9. Deploy na Vercel
vercel --prod
```

---

## NOTAS IMPORTANTES PARA O CLAUDE CODE

1. **Nunca** importar `createAdminClient` em arquivos `'use client'` ou em componentes client-side.
2. **Sempre** validar `auth.uid()` antes de qualquer operação de banco nas API routes.
3. A geração de imagem é **assíncrona** — a matéria é publicada primeiro com `image_status: 'pending'`, a imagem é gerada separadamente e o cliente deve fazer polling ou usar Supabase Realtime para atualizar.
4. O `body` do webhook do Stripe deve ser lido como **texto bruto** (`await req.text()`), não como JSON.
5. O campo `sections` do artigo é JSONB no banco — sempre fazer `JSON.parse/stringify` adequadamente.
6. O **scraper do Transfermarkt** pode ser bloqueado — sempre ter o fallback do BBC Sport pronto.
7. **Mobile-first**: todos os componentes devem ter breakpoints `md:` e `lg:`, não o contrário.
8. **Tokens de IA**: monitorar custo. Uma matéria completa (GPT-4o) custa ~$0,04–0,08. Uma imagem (DALL-E 3 HD) custa ~$0,08. Calcule o break-even com o preço de R$49,90/mês.
9. O campo `share_token` em `articles` permite URLs públicas sem autenticação — implementar uma página `/share/[token]` que não exige login.
10. Manter o prompt de geração de artigos em `article-generator.ts` — **não hardcodar inline** nas API routes. Facilita iteração.
```
