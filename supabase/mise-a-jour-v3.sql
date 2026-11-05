-- Mise à jour version 3 : vin en cours de service et révélation vin par vin.
-- À coller dans Supabase > SQL Editor > New query > Run (une seule fois suffit).
alter table public.tastings add column if not exists current_number   int;
alter table public.tastings add column if not exists served_numbers   int[] not null default '{}';
alter table public.tastings add column if not exists revealed_numbers int[] not null default '{}';

alter table public.tastings drop constraint if exists tastings_phase_check;
alter table public.tastings add constraint tastings_phase_check
  check (phase in ('preparation', 'degustation', 'revelation', 'revelee'));

create or replace function public.block_predictions_after_reveal()
returns trigger language plpgsql as $$
begin
  if (select phase from public.tastings where id = new.tasting_id) in ('revelation', 'revelee') then
    raise exception 'Les pronostics sont verrouillés : la révélation a commencé.';
  end if;
  new.updated_at := now();
  return new;
end $$;

notify pgrst, 'reload schema';
