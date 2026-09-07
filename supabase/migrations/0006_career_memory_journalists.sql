-- Continuidade/overuse do motor de mídia (src/lib/media) — histórico de quais jornalistas já
-- foram usados nesta carreira, quando e com que posição/sentimento.
alter table public.career_memories
  add column recent_journalists jsonb not null default '[]'::jsonb;
