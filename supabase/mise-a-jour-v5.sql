-- Mise à jour version 5 : contrôle des fiches, historique des corrections, règles de calcul v2.
-- À coller dans Supabase > SQL Editor > New query > Run (une seule fois suffit).

-- Version des règles de calcul de chaque soirée. Les soirées déjà créées gardent la version 1
-- (leurs résultats ne changent jamais) ; les nouvelles soirées utilisent la version 2
-- (synonymes d'appellations et petites fautes de frappe tolérées).
alter table public.tastings add column if not exists regles smallint not null default 1;
alter table public.tastings alter column regles set default 2;

-- Historique des corrections de bouteilles faites après la révélation.
alter table public.tastings add column if not exists corrections jsonb not null default '[]'::jsonb;

-- « J'ai vérifié ma fiche, elle est juste » (confirmé par l'auteur de la bouteille).
alter table public.bottles add column if not exists fiche_ok boolean not null default false;

notify pgrst, 'reload schema';
