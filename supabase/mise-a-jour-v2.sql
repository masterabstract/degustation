-- Mise à jour version 2 : ajout du pays.
-- À coller dans Supabase > SQL Editor > New query > Run (une seule fois suffit).
alter table public.bottles     add column if not exists country text;
alter table public.predictions add column if not exists country text;
notify pgrst, 'reload schema';
