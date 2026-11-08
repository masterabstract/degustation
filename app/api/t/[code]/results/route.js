import { db, unwrap, HttpError } from '@/lib/db';
import { route, json } from '@/lib/http';
import { getTasting, getParticipant, isAdmin } from '@/lib/auth';
import { computeResults, scoreTasters } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

// Résultats : refusés tant que l'organisateur n'a pas déclenché la révélation.
export const GET = route(async (_req, { code }) => {
  const tasting = await getTasting(code);
  const me = await getParticipant(tasting);
  const admin = await isAdmin(tasting);
  // Les vins sont révélés un par un pendant la dégustation : dès le premier vin révélé,
  // les résultats « en direct » (vins révélés seulement) sont visibles.
  const live = tasting.phase === 'revelation' || (tasting.phase === 'degustation' && (tasting.revealed_numbers || []).length > 0);
  if (tasting.phase !== 'revelee' && !live) {
    if (!me && !admin) throw new HttpError(401, 'Rejoignez la dégustation pour voir les résultats.');
    throw new HttpError(403, 'Les résultats apparaîtront dès la révélation du premier vin.');
  }
  // Après la révélation, plus rien n'est secret : les résultats restent
  // consultables à tout moment, depuis les archives, sans avoir à se reconnecter.

  const q = (t, cols) => db().from(t).select(cols).eq('tasting_id', tasting.id);
  const [participants, bottles, ratings, predictions] = (
    await Promise.all([
      q('participants', 'id, name, hors_concours'),
      q('bottles', 'id, owner_id, number, serve_order, producer, wine_name, appellation, accepted_names, grapes, grape_mix, region, subregion, zone, country, color, vintage, notes'),
      q('ratings', 'participant_id, bottle_id, note, aromes, commentaire'),
      q('predictions', 'participant_id, bottle_id, appellation, grapes, region, country, color, vintage'),
    ])
  ).map((r) => unwrap(r));

  const results = computeResults({ tasting, participants, bottles, ratings, predictions, meId: me?.id });

  if (live) {
    // Révélation bouteille par bouteille : on n'envoie QUE les vins déjà révélés,
    // dans l'ordre de leur révélation, avec les points de chacun sur ces vins
    // et le classement provisoire calculé uniquement sur ces vins.
    const order = tasting.revealed_numbers || [];
    // (le rang d'un vin parmi tous les vins n'est pas envoyé : il trahirait les vins non révélés)
    const shown = order.map((n) => results.wines.find((w) => w.number === n)).filter(Boolean).map(({ rank, ...w }) => w);
    const revealedBottles = bottles.filter((b) => order.includes(b.number));
    const partial = scoreTasters({ participants, bottles: revealedBottles, predictions: predictions.filter((p) => revealedBottles.some((b) => b.id === p.bottle_id)) });
    const scoresFor = (bottleId) =>
      partial
        .map((t) => {
          const d = t.details.find((x) => x.bottleId === bottleId);
          return d ? { name: t.name, total: d.total, max: d.max, why: d.why, guess: d.guess, geoLabel: d.geo.label } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'fr'));
    return json({
      tasting: { code: tasting.code, name: tasting.name, event_date: tasting.event_date, phase: tasting.phase },
      me: me ? { id: me.id, name: me.name } : null,
      live: true,
      total: bottles.filter((b) => b.number).length,
      revealed: shown.map((w) => ({ ...w, scores: scoresFor(w.id) })),
      standings: partial.filter((t) => t.max > 0).map(({ details, ...t }) => t),
    });
  }

  return json({
    tasting: { code: tasting.code, name: tasting.name, event_date: tasting.event_date, revealed_at: tasting.revealed_at, phase: tasting.phase },
    me: me ? { id: me.id, name: me.name } : null,
    ...results,
  });
});
