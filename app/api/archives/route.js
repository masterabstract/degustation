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
  const tastings = unwrap(await db().from('tastings').select('*').eq('phase', 'revelee').order('revealed_at', { ascending: false }));
  if (!tastings.length) return json({ soirees: [], palmares: [], championnat: { annees: [], classements: {} }, carnets: {} });

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
  const anneeDe = (t) => Number(String(t.event_date || t.revealed_at || '').slice(0, 4)) || null;
  const CRITERES = ['grapes', 'geo', 'country', 'vintage'];
  const bloc = () => ({ soirees: 0, classees: 0, points: 0, max: 0, victoires: 0, podiums: 0, trophees: [], crit: Object.fromEntries(CRITERES.map((k) => [k, { pts: 0, max: 0 }])), meilleur: null });

  // Regroupement par prénom (sans accents ni majuscules) : palmarès, championnat par année, carnet.
  const people = new Map();
  const soirees = tastings.map((t) => {
    const res = computeResults({ tasting: t, participants: by(participants, t.id), bottles: by(bottles, t.id), ratings: by(ratings, t.id), predictions: by(predictions, t.id) });
    const bestWines = res.wines.filter((w) => w.rank === 1);
    const bestTasters = res.tasters.filter((x) => x.rank === 1 && x.answered > 0);
    const annee = anneeDe(t);
    const notesDe = (pid) => by(ratings, t.id).filter((r) => r.participant_id === pid);

    for (const x of res.tasters) {
      const key = norm(x.name);
      if (!key) continue;
      const p = people.get(key) || { name: x.name, total: bloc(), annees: {}, historique: [], vins: [], apportes: [] };
      const blocs = [p.total, (p.annees[annee] ||= bloc())];
      const classe = !x.hors_concours && x.answered > 0;
      const trophees = (res.trophies || []).filter((tr) => tr.winners.includes(x.name)).map((tr) => ({ titre: tr.titre, soiree: t.name }));
      for (const B of blocs) {
        B.soirees += 1;
        if (!classe) continue;
        B.classees += 1;
        B.points += x.points;
        B.max += x.max;
        if (x.rank === 1) B.victoires += 1;
        if (x.rank && x.rank <= 3) B.podiums += 1;
        B.trophees.push(...trophees);
        for (const k of CRITERES) {
          B.crit[k].pts += x.byCrit[k].pts;
          B.crit[k].max += x.byCrit[k].max;
        }
        const note = sur20(x.pct);
        if (!B.meilleur || note > B.meilleur.note) B.meilleur = { note, soiree: t.name };
      }
      p.historique.push({ code: t.code, soiree: t.name, date: t.event_date, annee, rang: x.rank, points: x.points, max: x.max, pct: Math.round(x.pct * 1000) / 10, note: sur20(x.pct), hors_concours: x.hors_concours, trophees: trophees.map((tr) => tr.titre) });
      // Carnet : chaque vin goûté, avec ses points de pronostic et sa note de dégustation.
      const mesNotes = notesDe(x.id);
      for (const d of x.details) {
        const w = res.wines.find((v) => v.id === d.bottleId);
        if (!w) continue;
        p.vins.push({ code: t.code, soiree: t.name, date: t.event_date, annee, numero: d.number, vin: label(w), appellation: w.appellation, region: w.region, pays: w.country, couleur: w.color, points: d.total, max: d.max, note: mesNotes.find((r) => r.bottle_id === d.bottleId)?.note ?? null });
      }
      for (const w of res.wines.filter((v) => v.owner === x.name)) p.apportes.push({ code: t.code, soiree: t.name, annee, vin: label(w), appellation: w.appellation, moyenne: w.average, rang: w.rank });
      people.set(key, p);
    }

    return {
      code: t.code,
      name: t.name,
      event_date: t.event_date,
      revealed_at: t.revealed_at,
      annee,
      participants: by(participants, t.id).length,
      vins: by(bottles, t.id).length,
      meilleurVin: bestWines.map((w) => ({ label: label(w), appellation: w.appellation, note: w.average, owner: w.owner })),
      meilleurDegustateur: bestTasters.map((x) => ({ name: x.name, points: x.points, max: x.max, pct: Math.round(x.pct * 1000) / 10, note: sur20(x.pct) })),
    };
  });

  const ligne = (name, B) => ({
    name,
    soirees: B.soirees,
    classees: B.classees,
    points: Math.round(B.points * 100) / 100,
    max: B.max,
    moyenne: B.max ? sur20(B.points / B.max) : null,
    victoires: B.victoires,
    podiums: B.podiums,
    trophees: B.trophees,
    meilleur: B.meilleur,
    forces: Object.fromEntries(CRITERES.map((k) => [k, B.crit[k].max ? Math.round((B.crit[k].pts / B.crit[k].max) * 1000) / 10 : null])),
  });
  // Classement : note moyenne sur 20 (tous les points de pronostic cumulés), puis victoires, puis podiums.
  const trier = (rows) => {
    const sorted = rows.sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1) || b.victoires - a.victoires || b.podiums - a.podiums || a.name.localeCompare(b.name, 'fr'));
    let rang = 0;
    return sorted.map((r, i) => {
      if (r.moyenne === null) return { ...r, rang: null };
      const prev = sorted[i - 1];
      if (!prev || prev.moyenne !== r.moyenne || prev.victoires !== r.victoires || prev.podiums !== r.podiums) rang = i + 1;
      return { ...r, rang };
    });
  };

  const annees = [...new Set(soirees.map((s) => s.annee).filter(Boolean))].sort((a, b) => b - a);
  const classements = Object.fromEntries(annees.map((a) => [a, trier([...people.values()].filter((p) => p.annees[a]).map((p) => ligne(p.name, p.annees[a])))]));
  const palmares = trier([...people.values()].map((p) => ({ ...ligne(p.name, p.total), historique: p.historique })));
  const carnets = Object.fromEntries([...people.values()].map((p) => [p.name, { vins: p.vins, apportes: p.apportes }]));

  return json({ soirees, palmares, championnat: { annees, classements }, carnets });
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
