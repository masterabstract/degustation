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
  const live = tasting.phase === 'revelation';
  if (tasting.phase !== 'revelee' && !live) {
    if (!me && !admin) throw new HttpError(401, 'Rejoignez la dégustation pour voir les résultats.');
    throw new HttpError(403, 'Les résultats seront visibles après la révélation.');
  }
  // Après la révélation, plus rien n'est secret : les résultats restent
  // consultables à tout moment, depuis les archives, sans avoir à se reconnecter.

  const q = (t, cols) => db().from(t).select(cols).eq('tasting_id', tasting.id);
  const [participants, bottles, ratings, predictions] = (
    await Promise.all([
      q('participants', 'id, name, hors_concours'),
      q('bottles', 'id, owner_id, number, serve_order, producer, wine_name, appellation, grapes, region, country, color, vintage, notes'),
      q('ratings', 'participant_id, bottle_id, note, aromes, commentaire'),
      q('predictions', 'participant_id, bottle_id, appellation, grapes, region, country, color, vintage'),
    ])
  ).map((r) => unwrap(r));

  const results = computeResults({ tasting, participants, bottles, ratings, predictions, meId: me?.id });

  if (live) {
    // Révélation vin par vin en cours : on n'envoie QUE les vins déjà révélés,
    // dans l'ordre de leur révélation. Rien sur les autres, ni sur les dégustateurs.
    const order = tasting.revealed_numbers || [];
    const shown = order.map((n) => results.wines.find((w) => w.number === n)).filter(Boolean);
    return json({
      tasting: { code: tasting.code, name: tasting.name, event_date: tasting.event_date, phase: tasting.phase },
      me: me ? { id: me.id, name: me.name } : null,
      live: true,
      total: bottles.length,
      revealed: shown.map(({ comments, myNote, ...w }) => ({ ...w, myNote: w.myNote, comments })),
    });
  }

  return json({
    tasting: { code: tasting.code, name: tasting.name, event_date: tasting.event_date, revealed_at: tasting.revealed_at, phase: tasting.phase },
    me: me ? { id: me.id, name: me.name } : null,
    ...results,
  });
});
