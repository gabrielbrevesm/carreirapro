-- URL do áudio (narração via TTS) da matéria, gerado sob demanda e cacheado por matéria —
-- evita regerar (e pagar de novo) toda vez que o usuário clica em "Ouvir matéria".
alter table public.articles add column audio_url text;
