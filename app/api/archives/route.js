import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { organizerPasswordOk } from '@/lib/auth';
import { computeResults, norm } from '@/lib/scoring';
import { sur20 } from '@/lib/bareme';

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
      q('bottles', 'id, tasting_id, owner_id, number, serve_order, producer, wine_name, appellation, accepted_names, grapes, grape_mix, region, subregion, zone, country, color, vintage, notes'),
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
        const pc = Math.round(x.pct * 1000) / 10;
        if (!p.meilleur || pc > p.meilleur.pct) p.meilleur = { pct: pc, note: sur20(x.pct), soiree: t.name };
      }
      p.historique.push({ code: t.code, soiree: t.name, date: t.event_date, rang: x.rank, points: x.points, max: x.max, pct: Math.round(x.pct * 1000) / 10, note: sur20(x.pct), hors_concours: x.hors_concours });
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
      meilleurDegustateur: bestTasters.map((x) => ({ name: x.name, points: x.points, max: x.max, pct: Math.round(x.pct * 1000) / 10, note: sur20(x.pct) })),
    };
  });

  const palmares = [...people.values()]
    .map((p) => ({ ...p, points: Math.round(p.points * 100) / 100, moyenne: p.max ? sur20(p.points / p.max) : null }))
    .sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1) || b.victoires - a.victoires || b.soirees - a.soirees);

  return json({ soirees, palmares });
});

// Suppression de soirées archivées, réservée à l'organisateur (mot de passe
// organisateur). Seules les soirées révélées (celles des archives) peuvent être
// effacées ici ; tout leur contenu part avec elles (participants, bouteilles,
// fiches, pronostics). Le palmarès se recalcule tout seul.
export const POST = route(async (req) => {
  const b = await body(req);
  if (b.action !== 'delete') throw new HttpError(400, 'Action inconnue.');
  const ok = organizerPasswordOk(b.password);
  if (ok === null) throw new HttpError(403, 'Aucun mot de passe organisateur n’est défini (variable ORGANIZER_PASSWORD dans Vercel) : la suppression est désactivée.');
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // freine les essais au hasard
    throw new HttpError(403, 'Mot de passe organisateur incorrect.');
  }
  const codes = [...new Set((Array.isArray(b.codes) ? b.codes : []).map((c) => String(c).toUpperCase()).filter((c) => /^[A-Z0-9]{4,10}$/.test(c)))];
  if (!codes.length) throw new HttpError(400, 'Choisissez au moins une soirée à effacer.');
  const deleted = unwrap(await db().from('tastings').delete().in('code', codes).eq('phase', 'revelee').select('code'));
  return json({ deleted: deleted.length });
});
