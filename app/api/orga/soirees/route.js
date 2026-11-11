import { db, unwrap, HttpError } from '@/lib/db';
import { route, json } from '@/lib/http';
import { estOrganisateur } from '@/lib/orga';

export const dynamic = 'force-dynamic';

// Toutes les soirées, pour l'appli organisateur. Réservé à l'organisateur connecté.
// Rien de secret : nom, date, étape, nombre de participants et de bouteilles.
export const GET = route(async () => {
  if (!(await estOrganisateur())) throw new HttpError(401, 'Accès organisateur requis.');
  const [tastings, participants, bottles] = (
    await Promise.all([
      db().from('tastings').select('id, code, name, event_date, phase, created_at, revealed_at').order('created_at', { ascending: false }).limit(200),
      db().from('participants').select('tasting_id'),
      db().from('bottles').select('tasting_id'),
    ])
  ).map((r) => unwrap(r));
  const compte = (rows) => rows.reduce((m, r) => m.set(r.tasting_id, (m.get(r.tasting_id) || 0) + 1), new Map());
  const np = compte(participants);
  const nb = compte(bottles);
  return json({
    soirees: tastings.map((t) => ({
      code: t.code,
      name: t.name,
      event_date: t.event_date,
      phase: t.phase,
      created_at: t.created_at,
      participants: np.get(t.id) || 0,
      bottles: nb.get(t.id) || 0,
    })),
  });
});
