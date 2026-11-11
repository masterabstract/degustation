-- =====================================================================
--  DÉGUSTATION À L'AVEUGLE : schéma de la base de données Supabase
--  À coller tel quel dans Supabase > SQL Editor > New query > Run.
--  Le script peut être relancé sans danger (il ne supprime rien).
-- =====================================================================
--
--  PRINCIPE DE SÉCURITÉ
--  --------------------
--  Le navigateur des participants ne parle JAMAIS directement à Supabase.
--  Toutes les lectures et écritures passent par le serveur du site (Vercel),
--  qui utilise la clé secrète Supabase (jamais envoyée aux téléphones).
--
--  Ici on ferme donc la porte à double tour pour tout le reste :
--   1. Row Level Security (RLS) activée sur chaque table, SANS aucune règle
--      d'accès : les rôles publics "anon" et "authenticated" ne voient rien.
--   2. On retire en plus tous leurs droits sur ces tables.
--   3. Seul le rôle "service_role" (la clé secrète, côté serveur) a accès.
-- =====================================================================

create extension if not exists pgcrypto;

-- 1. DÉGUSTATIONS ------------------------------------------------------
create table if not exists public.tastings (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,            -- code d'accès partagé (ex : SAVAGNIN)
  name             text not null,                   -- nom de la soirée
  event_date       date,
  phase            text not null default 'preparation'
                   check (phase in ('preparation', 'degustation', 'revelation', 'revelee')),
  admin_token_hash text not null,                   -- empreinte du lien organisateur
  numbers_drawn    boolean not null default false,  -- numéros anonymes tirés au sort ?
  revealed_at      timestamptz,
  current_number   int,                             -- vin en cours de service
  served_numbers   int[] not null default '{}',     -- vins déjà servis
  revealed_numbers int[] not null default '{}',     -- vins déjà révélés (révélation vin par vin)
  created_at       timestamptz not null default now()
);

-- 2. PARTICIPANTS ------------------------------------------------------
create table if not exists public.participants (
  id           uuid primary key default gen_random_uuid(),
  tasting_id   uuid not null references public.tastings(id) on delete cascade,
  name         text not null,
  hors_concours boolean not null default false,     -- ex : l'organisateur qui connaît les vins
  token_hash   text,                                -- empreinte de la session du téléphone
  joined_at    timestamptz,
  created_at   timestamptz not null default now(),
  unique (tasting_id, name)
);

-- 3. BOUTEILLES (informations SECRÈTES jusqu'à la révélation) ----------
create table if not exists public.bottles (
  id          uuid primary key default gen_random_uuid(),
  tasting_id  uuid not null references public.tastings(id) on delete cascade,
  owner_id    uuid references public.participants(id) on delete set null,
  number      int,                                  -- numéro anonyme affiché aux participants
  serve_order int,                                  -- ordre de service
  wine_name   text not null,                        -- cuvée / nom du vin
  producer    text,                                 -- domaine, château, maison
  color       text,                                 -- rouge, blanc, rosé, effervescent, doux
  grapes      text,                                 -- cépage(s)
  region      text,
  country     text,                                 -- pays
  subregion   text,                                 -- vins étrangers : sous-région ou vallée
  zone        text,                                 -- vins étrangers : grande zone ou province
  grape_mix   jsonb,                                -- cépages et pourcentages [{name, pct}]
  accepted_names text,                              -- autres noms acceptés pour l'appellation
  appellation text,
  vintage     int,                                  -- millésime (vide = non millésimé)
  price_range text,
  notes       text,                                 -- remarque libre de l'organisateur
  created_at  timestamptz not null default now(),
  unique (tasting_id, number)
);

-- 4. FICHES DE DÉGUSTATION --------------------------------------------
create table if not exists public.ratings (
  id               uuid primary key default gen_random_uuid(),
  tasting_id       uuid not null references public.tastings(id) on delete cascade,
  participant_id   uuid not null references public.participants(id) on delete cascade,
  bottle_id        uuid not null references public.bottles(id) on delete cascade,
  robe             text,                           -- couleur et robe
  intensite_visuelle smallint check (intensite_visuelle between 1 and 5),
  intensite_nez    smallint check (intensite_nez between 1 and 5),
  aromes           text[] not null default '{}',   -- familles aromatiques
  acidite          smallint check (acidite between 1 and 5),
  tanins           smallint check (tanins between 0 and 5),  -- 0 = sans objet
  corps            smallint check (corps between 1 and 5),
  equilibre        smallint check (equilibre between 1 and 5),
  longueur         smallint check (longueur between 1 and 5),
  note             numeric(3,1) check (note between 0 and 20),
  commentaire      text,
  updated_at       timestamptz not null default now(),
  unique (participant_id, bottle_id)
);

-- 5. PRONOSTICS --------------------------------------------------------
create table if not exists public.predictions (
  id             uuid primary key default gen_random_uuid(),
  tasting_id     uuid not null references public.tastings(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  bottle_id      uuid not null references public.bottles(id) on delete cascade,
  color          text,
  grapes         text,
  region         text,
  country        text,
  appellation    text,
  vintage        int,
  price_range    text,
  updated_at     timestamptz not null default now(),
  unique (participant_id, bottle_id)
);

-- Colonnes ajoutées dans les versions 2, 3 et 4 (sans effet si elles existent déjà).
alter table public.bottles add column if not exists grape_mix      jsonb;
alter table public.bottles add column if not exists subregion      text;
alter table public.bottles add column if not exists zone           text;
alter table public.bottles add column if not exists accepted_names text;
alter table public.tastings add column if not exists current_number   int;
alter table public.tastings add column if not exists served_numbers   int[] not null default '{}';
alter table public.tastings add column if not exists revealed_numbers int[] not null default '{}';
alter table public.tastings drop constraint if exists tastings_phase_check;
alter table public.tastings add constraint tastings_phase_check
  check (phase in ('preparation', 'degustation', 'revelation', 'revelee'));
alter table public.bottles     add column if not exists country text;
alter table public.predictions add column if not exists country text;

create index if not exists participants_tasting_idx on public.participants(tasting_id);
create index if not exists bottles_tasting_idx      on public.bottles(tasting_id);
create index if not exists ratings_tasting_idx      on public.ratings(tasting_id);
create index if not exists predictions_tasting_idx  on public.predictions(tasting_id);

-- 6. VERROU : pronostics interdits après la révélation -----------------
--    (double sécurité : le serveur du site le vérifie déjà)
create or replace function public.block_predictions_after_reveal()
returns trigger language plpgsql as $$
begin
  if (select phase from public.tastings where id = new.tasting_id) in ('revelation', 'revelee') then
    raise exception 'Les pronostics sont verrouillés : la révélation a commencé.';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists predictions_lock on public.predictions;
create trigger predictions_lock
  before insert or update on public.predictions
  for each row execute function public.block_predictions_after_reveal();

-- 7. SÉCURITÉ : RLS activée, aucune règle publique, droits retirés -----
alter table public.tastings     enable row level security;
alter table public.participants enable row level security;
alter table public.bottles      enable row level security;
alter table public.ratings      enable row level security;
alter table public.predictions  enable row level security;

revoke all on table public.tastings, public.participants, public.bottles,
                    public.ratings, public.predictions
  from anon, authenticated;

grant all on table public.tastings, public.participants, public.bottles,
                   public.ratings, public.predictions
  to service_role;

revoke execute on function public.block_predictions_after_reveal() from public, anon, authenticated;

-- Liste d'attente de la page de vente (/offre)
create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique check (char_length(email) between 5 and 160),
  prenom        text check (char_length(prenom) <= 60),
  groupe        text check (char_length(groupe) <= 20),     -- taille du groupe indiquée
  langue        text not null default 'fr' check (langue in ('fr', 'en')), -- langue de la page d'inscription
  consent_at    timestamptz not null default now(),         -- accord RGPD donné
  created_at    timestamptz not null default now()
);
create index if not exists waitlist_created_idx on public.waitlist (created_at);

alter table public.waitlist enable row level security;
revoke all on table public.waitlist from anon, authenticated;
grant all on table public.waitlist to service_role;


-- Recharge la liste des colonnes côté API.
notify pgrst, 'reload schema';

-- Fin. Si "Success. No rows returned" s'affiche, tout est en place.
