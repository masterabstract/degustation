-- Liste d'attente de la page de vente (/offre).
-- À coller dans Supabase > SQL Editor > New query > Run (une seule fois suffit ; relançable sans danger).
-- Comme le reste de la base : seul le serveur du site y accède (clé secrète), jamais le navigateur.
create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique check (char_length(email) between 5 and 160),
  prenom        text check (char_length(prenom) <= 60),
  groupe        text check (char_length(groupe) <= 20),     -- taille du groupe indiquée
  consent_at    timestamptz not null default now(),         -- accord RGPD donné
  created_at    timestamptz not null default now()
);
create index if not exists waitlist_created_idx on public.waitlist (created_at);

alter table public.waitlist enable row level security;
revoke all on table public.waitlist from anon, authenticated;
grant all on table public.waitlist to service_role;

notify pgrst, 'reload schema';
-- Fin. Si "Success. No rows returned" s'affiche, la liste d'attente est prête.
