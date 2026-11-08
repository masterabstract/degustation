import { scoreBottle, summarize, rankTasters, explain, norm, sur20 } from './bareme';

export { norm };

// ---------- Classements ----------
function rankWithTies(items, key) {
  let prev = null;
  let rank = 0;
  return items.map((it, i) => {
    if (prev === null || it[key] !== prev) rank = i + 1;
    prev = it[key];
    return { ...it, rank };
  });
}

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Calcule le score de chaque dégustateur sur une liste de bouteilles.
 * Chacun est noté sur toutes les bouteilles sauf les siennes.
 */
export function scoreTasters({ participants, bottles, predictions }) {
  const sortedBottles = [...bottles].sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
  const list = participants.map((p) => {
    const mine = predictions.filter((x) => x.participant_id === p.id);
    const details = sortedBottles
      .filter((b) => b.owner_id !== p.id)
      .map((b) => {
        const pred = mine.find((x) => x.bottle_id === b.id) || null;
        const s = scoreBottle(pred, b);
        return { bottleId: b.id, number: b.number, ...s, why: explain(s), guess: pred ? { appellation: pred.appellation, region: pred.region, grapes: pred.grapes, country: pred.country, vintage: pred.vintage } : null };
      });
    const sum = summarize(details);
    return {
      id: p.id,
      name: p.name,
      hors_concours: p.hors_concours,
      ...sum,
      answered: details.filter((d) => d.answered).length,
      appellations: details.filter((d) => d.geo.level === 'appellation').length,
      details,
    };
  });
  const inContest = rankTasters(list.filter((t) => !t.hors_concours));
  const outContest = list.filter((t) => t.hors_concours).sort((a, b) => b.pct - a.pct).map((t) => ({ ...t, rank: null }));
  return [...inContest, ...outContest];
}

export const pct1 = (x) => Math.round(x * 1000) / 10; // 0,8234 -> 82,3

export function computeResults({ tasting, participants, bottles, ratings, predictions, meId = null }) {
  const byId = Object.fromEntries(participants.map((p) => [p.id, p]));
  const sorted = [...bottles].sort((a, b) => (a.number ?? 999) - (b.number ?? 999));

  // --- Vins ---
  let wines = sorted.map((b) => {
    const rs = ratings.filter((r) => r.bottle_id === b.id);
    // La note du propriétaire sur sa propre bouteille ne compte pas.
    const counted = rs.filter((r) => r.note !== null && r.note !== undefined && r.participant_id !== b.owner_id);
    const notes = counted.map((r) => Number(r.note));
    const avg = notes.length ? notes.reduce((a, c) => a + c, 0) / notes.length : null;
    const sd = notes.length > 1 ? Math.sqrt(notes.reduce((a, c) => a + (c - avg) ** 2, 0) / notes.length) : 0;
    const aromaCount = {};
    rs.forEach((r) => (r.aromes || []).forEach((a) => (aromaCount[a] = (aromaCount[a] || 0) + 1)));
    const topAromas = Object.entries(aromaCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
    const mine = meId ? rs.find((r) => r.participant_id === meId) : null;
    return {
      id: b.id,
      number: b.number,
      serve_order: b.serve_order,
      wine_name: b.wine_name,
      producer: b.producer,
      color: b.color,
      grapes: b.grapes,
      region: b.region,
      subregion: b.subregion || null,
      zone: b.zone || null,
      country: b.country,
      appellation: b.appellation,
      vintage: b.vintage,
      notes: b.notes || null,
      owner: byId[b.owner_id]?.name || null,
      average: avg === null ? null : round1(avg),
      avgRaw: avg,
      count: notes.length,
      spread: round1(sd),
      topAromas,
      myNote: mine?.note ?? null,
      comments: rs
        .filter((r) => r.commentaire)
        .map((r) => ({ author: byId[r.participant_id]?.name || '?', text: r.commentaire, note: r.note })),
    };
  });
  wines.sort((a, b) => (b.avgRaw ?? -1) - (a.avgRaw ?? -1));
  wines = rankWithTies(wines, 'avgRaw').map(({ avgRaw, ...w }) => ({ ...w, rank: avgRaw === null ? null : w.rank }));

  // --- Dégustateurs (barème 20 / 23 points, classement au pourcentage) ---
  const ranked = scoreTasters({ participants, bottles, predictions });
  const tasters = ranked;

  return { wines, tasters, summary: buildSummary({ tasting, participants, bottles, ratings, wines, tasters }) };
}

// ---------- Résumé de la soirée ----------
function joinFr(arr) {
  return arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} et ${arr.at(-1)}`;
}

function fmt(n) {
  return n === null || n === undefined ? '-' : String(n).replace('.', ',');
}

function buildSummary({ tasting, participants, bottles, ratings, wines, tasters }) {
  const lines = [];
  const date = tasting.event_date
    ? new Date(tasting.event_date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  lines.push(`${tasting.name}${date ? `, ${date}` : ''}`);
  lines.push(`${participants.length} dégustateurs, ${bottles.length} vins à l’aveugle, ${ratings.filter((r) => r.note !== null).length} notes attribuées.`);

  const label = (w) => [w.producer, w.wine_name !== w.producer ? w.wine_name : null, w.appellation].filter(Boolean).join(', ') + (w.vintage ? ` ${w.vintage}` : '');
  const rated = wines.filter((w) => w.average !== null);
  if (rated.length) {
    const top = rated.filter((w) => w.rank === 1);
    lines.push('');
    lines.push(`${top.length > 1 ? 'Meilleurs vins ex aequo' : 'Meilleur vin'} : ${joinFr(top.map((w) => `n°${w.number} ${label(w)}${w.owner ? ` (apporté par ${w.owner})` : ''}`))}, ${fmt(top[0].average)}/20.`);
    const podium = rated.filter((w) => w.rank > 1 && w.rank <= 3);
    podium.forEach((w) => lines.push(`${w.rank}e : n°${w.number} ${label(w)}, ${fmt(w.average)}/20.`));
    if (rated.length > 2) {
      const divisive = [...rated].filter((w) => w.count > 1).sort((a, b) => b.spread - a.spread)[0];
      if (divisive && divisive.spread >= 1.5) lines.push(`Le vin qui a le plus divisé : n°${divisive.number} ${label(divisive)} (écart type ${fmt(divisive.spread)}).`);
    }
  }

  const ranked = tasters.filter((t) => t.rank !== null && t.answered > 0);
  if (ranked.length) {
    const best = ranked.filter((t) => t.rank === 1);
    lines.push('');
    lines.push(`${best.length > 1 ? 'Meilleurs dégustateurs ex aequo' : 'Meilleur dégustateur'} : ${joinFr(best.map((t) => t.name))}, ${fmt(sur20(best[0].pct))}/20, soit ${fmt(pct1(best[0].pct))} % des points (${fmt(best[0].points)} sur ${best[0].max}).`);
    ranked.filter((t) => t.rank > 1 && t.rank <= 3).forEach((t) => lines.push(`${t.rank}e : ${t.name}, ${fmt(sur20(t.pct))}/20 (${fmt(t.points)} points sur ${t.max}).`));
  }

  const aromas = {};
  ratings.forEach((r) => (r.aromes || []).forEach((a) => (aromas[a] = (aromas[a] || 0) + 1)));
  const topA = Object.entries(aromas).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a.toLowerCase());
  if (topA.length) {
    lines.push('');
    lines.push(`Arômes les plus cités : ${topA.join(', ')}.`);
  }
  return lines.join('\n');
}
