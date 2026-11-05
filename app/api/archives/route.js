import { db, unwrap } from '@/lib/db';
import { route, json } from '@/lib/http';
import { computeResults, norm } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

// Archives : toutes les soirées RÉVÉLÉES (plus rien n'y est secret), avec le
// meilleur vin, le meilleur dégustateur, et un palmarès cumulé par participant.
// Les soirées en préparation ou en cours n'apparaissent pas.
export const GET = route(async () => {
  const tastings = unwrap(
    await db().from('tastings').select('id, code, name, event_date, revealed_at').eq('phase', 'revelee').order('revealed_at', { ascending: false })
  );
  if (!tastings.length) return json({ soirees: [], palmares: [] });

  const ids = tastings.map((t) => t.id);
  const q = (t, cols) => db().from(t).select(cols).in('tasting_id', ids);
  const [participants, bottles, ratings, predictions] = (
    await Promise.all([
      q('participants', 'id, tasting_id, name, hors_concours'),
      q('bottles', 'id, tasting_id, owner_id, number, serve_order, producer, wine_name, appellation, grapes, region, country, color, vintage, notes'),
      q('ratings', 'tasting_id, participant_id, bottle_id, note, aromes, commentaire'),
      q('predictions', 'tasting_id, participant_id, bottle_id, appellation, grapes, region, country, color, vintage'),
    ])
  ).map((r) => unwrap(r));

  const by = (rows, id) => rows.filter((r) => r.tasting_id === id);
  const label = (w) => [w.producer, w.wine_name !== w.producer ? w.wine_name : null].filter(Boolean).join(', ') + (w.vintage ? ` ${w.vintage}` : '');

  const people = new Map(); // palmarès, regroupé par prénom (sans accents ni majuscules)
  const soirees = tastings.map((t) => {
    const res = computeResults({ tasting: t, participants: by(participants, t.id), bottles: by(bottles, t.id), ratings: by(ratings, t.id), predictions: by(predictions, t.id) });
    const bestWines = res.wines.filter((w) => w.rank === 1);
    const bestTasters = res.tasters.filter((x) => x.rank === 1 && x.answered > 0);

    for (const x of res.tasters) {
      const key = norm(x.name);
      if (!key) continue;
      const p = people.get(key) || { name: x.name, soirees: 0, points: 0, max: 0, victoires: 0, meilleur: null, historique: [] };
      p.soirees += 1;
      if (!x.hors_concours && x.answered > 0) {
        p.points += x.points;
        p.max += x.max;
        if (x.rank === 1) p.victoires += 1;
        const sur20 = x.max ? (x.points / x.max) * 20 : 0;
        if (!p.meilleur || sur20 > p.meilleur.sur20) p.meilleur = { sur20: Math.round(sur20 * 10) / 10, soiree: t.name };
      }
      p.historique.push({ code: t.code, soiree: t.name, date: t.event_date, rang: x.rank, points: x.points, max: x.max, hors_concours: x.hors_concours });
      people.set(key, p);
    }

    return {
      code: t.code,
      name: t.name,
      event_date: t.event_date,
      revealed_at: t.revealed_at,
      participants: by(participants, t.id).length,
      vins: by(bottles, t.id).length,
      meilleurVin: bestWines.map((w) => ({ label: label(w), appellation: w.appellation, note: w.average, owner: w.owner })),
      meilleurDegustateur: bestTasters.map((x) => ({ name: x.name, points: x.points, max: x.max })),
    };
  });

  const palmares = [...people.values()]
    .map((p) => ({ ...p, moyenne: p.max ? Math.round((p.points / p.max) * 200) / 10 : null }))
    .sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1) || b.victoires - a.victoires || b.soirees - a.soirees);

  return json({ soirees, palmares });
});
