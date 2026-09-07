-- Perfil pessoal opcional do técnico, usado como contexto extra pela IA ao escrever matérias.
alter table public.careers
  add column playing_style text,
  add column preferred_formation text,
  add column personal_tastes text,
  add column career_milestones text;
