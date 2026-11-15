import 'server-only';
import { db, unwrap } from './db';
import { computeResults, norm } from './scoring';
import { compteurVide, gainsDeLaSoiree, ajouter } from './badges';

// Toutes les soirées RÉVÉLÉES (plus rien n'y est secret) avec leurs résultats recalculés,
// de la plus ancienne à la plus récente. Sert aux archives, au championnat et aux badges.
export async function chargerResultats() {
  const tastings = unwrap(await db().from('tastings').select('*').eq('phase', 'revelee').order('revealed_at', { ascending: true }));
  if (!tastings.length) return [];
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
  return tastings.map((t) => {
    const r = by(ratings, t.id);
    return {
      t,
      participants: by(participants, t.id),
      bottles: by(bottles, t.id),
      ratings: r,
      res: computeResults({ tasting: t, participants: by(participants, t.id), bottles: by(bottles, t.id), ratings: r, predictions: by(predictions, t.id) }),
    };
  });
}

/** Nombre de vins notés (note donnée) par un participant dans une soirée. */
export const nbNotes = (ratings, pid) => ratings.filter((x) => x.participant_id === pid && x.note !== null && x.note !== undefined).length;

/**
 * Compteurs de badges, soirée après soirée, regroupés par prénom (sans accents ni majuscules).
 * Renvoie { cumul: Map(clé -> { name, compteur }), parSoiree: Map(tastingId -> Map(clé -> { name, avant, apres })) }.
 */
export function compterBadges(liste) {
  const cumul = new Map();
  const parSoiree = new Map();
  for (const { t, res, ratings, bottles } of liste) {
    const snap = new Map();
    for (const x of res.tasters) {
      const key = norm(x.name);
      if (!key) continue;
      const c = cumul.get(key) || { name: x.name, compteur: compteurVide() };
      const avant = c.compteur;
      c.compteur = ajouter(avant, gainsDeLaSoiree(x, nbNotes(ratings, x.id), bottles.some((b) => b.owner_id === x.id)));
      c.name = x.name;
      cumul.set(key, c);
      snap.set(key, { name: x.name, avant, apres: c.compteur });
    }
    parSoiree.set(t.id, snap);
  }
  return { cumul, parSoiree };
}
