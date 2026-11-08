-- Mise à jour version 4 : barème 20 / 23 points.
-- À coller dans Supabase > SQL Editor > New query > Run (une seule fois suffit).
alter table public.bottles add column if not exists grape_mix      jsonb;  -- cépages et pourcentages
alter table public.bottles add column if not exists subregion      text;   -- vins étrangers : sous-région ou vallée
alter table public.bottles add column if not exists zone           text;   -- vins étrangers : grande zone ou province
alter table public.bottles add column if not exists accepted_names text;   -- autres noms acceptés pour l'appellation
notify pgrst, 'reload schema';
