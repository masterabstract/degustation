import { db, unwrap, HttpError } from '@/lib/db';
import { route, json } from '@/lib/http';
import { getTasting, getParticipant, isAdmin } from '@/lib/auth';
import { computeResults } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

// Résultats : refusés tant que l'organisateur n'a pas déclenché la révélation.
export const GET = route(async (_req, { code }) => {
  const tasting = await getTasting(code);
  const me = await getParticipant(tasting);
  const admin = await isAdmin(tasting);
  if (!me && !admin) throw new HttpError(401, 'Rejoignez la dégustation pour voir les résultats.');
  if (tasting.phase !== 'revelee') throw new HttpError(403, 'Les résultats seront visibles après la révélation.');

  const q = (t, cols) => db().from(t).select(cols).eq('tasting_id', tasting.id);
  const [participants, bottles, ratings, predictions] = (
    await Promise.all([
      q('participants', 'id, name, hors_concours'),
      q('bottles', 'id, owner_id, number, serve_order, wine_name, producer, color, grapes, region, appellation, vintage, price_range'),
      q('ratings', 'participant_id, bottle_id, note, aromes, commentaire'),
      q('predictions', 'participant_id, bottle_id, color, grapes, region, appellation, vintage, price_range'),
    ])
  ).map((r) => unwrap(r));

  const results = computeResults({ tasting, participants, bottles, ratings, predictions, meId: me?.id });
  return json({
    tasting: { code: tasting.code, name: tasting.name, event_date: tasting.event_date, revealed_at: tasting.revealed_at },
    me: me ? { id: me.id, name: me.name } : null,
    ...results,
  });
});
