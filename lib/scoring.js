import { SCORING, PRICE_RANGES, NON_VINTAGE, MAX_POINTS_PER_BOTTLE } from './constants';

// ---------- Comparaison de textes tolérante ----------
export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bste\b/g, 'sainte')
    .replace(/\bst\b/g, 'saint')
    .trim();
}

function splitGrapes(s) {
  return String(s || '')
    .split(/[,/&+;]|\bet\b/i)
    .map(norm)
    .filter(Boolean);
}

function grapesMatch(guess, truth) {
  const g = splitGrapes(guess);
  const t = splitGrapes(truth);
  if (!g.length || !t.length) return false;
  return g.some((x) => t.some((y) => x === y || (x.length >= 4 && y.includes(x)) || (y.length >= 4 && x.includes(y))));
}

function appellationMatch(guess, truth) {
  const g = norm(guess);
  const t = norm(truth);
  if (!g || !t) return false;
  if (g === t) return true;
  // "Saint Emilion" accepté pour "Saint-Émilion Grand Cru", et inversement.
  return (g.length >= 5 && t.includes(g)) || (t.length >= 5 && g.includes(t));
}

// ---------- Points d'un pronostic ----------
export function scorePrediction(pred, bottle) {
  const d = { color: 0, grapes: 0, region: 0, appellation: 0, vintage: 0, price: 0 };
  if (!pred) return { total: 0, detail: d };

  if (pred.color && bottle.color && pred.color === bottle.color) d.color = SCORING.color;
  if (grapesMatch(pred.grapes, bottle.grapes)) d.grapes = SCORING.grapes;
  if (pred.region && bottle.region && pred.region === bottle.region) d.region = SCORING.region;
  if (appellationMatch(pred.appellation, bottle.appellation)) d.appellation = SCORING.appellation;

  if (pred.vintage !== null && pred.vintage !== undefined) {
    const truthNV = bottle.vintage === null || bottle.vintage === undefined;
    if (pred.vintage === NON_VINTAGE) {
      if (truthNV) d.vintage = SCORING.vintageExact;
    } else if (!truthNV) {
      const gap = Math.abs(pred.vintage - bottle.vintage);
      d.vintage = gap === 0 ? SCORING.vintageExact : gap === 1 ? SCORING.vintageOne : gap === 2 ? SCORING.vintageTwo : 0;
    }
  }

  const gi = PRICE_RANGES.indexOf(pred.price_range);
  const ti = PRICE_RANGES.indexOf(bottle.price_range);
  if (gi >= 0 && ti >= 0) d.price = gi === ti ? SCORING.priceExact : Math.abs(gi - ti) === 1 ? SCORING.priceNear : 0;

  return { total: Object.values(d).reduce((a, b) => a + b, 0), detail: d };
}

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

export function computeResults({ tasting, participants, bottles, ratings, predictions, meId = null }) {
  const byId = Object.fromEntries(participants.map((p) => [p.id, p]));
  const sorted = [...bottles].sort((a, b) => (a.serve_order ?? 999) - (b.serve_order ?? 999));

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
      appellation: b.appellation,
      vintage: b.vintage,
      price_range: b.price_range,
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

  // --- Dégustateurs ---
  const bottleById = Object.fromEntries(bottles.map((b) => [b.id, b]));
  let tasters = participants.map((p) => {
    const mine = predictions.filter((x) => x.participant_id === p.id);
    const eligible = bottles.filter((b) => b.owner_id !== p.id);
    const details = eligible.map((b) => {
      const pred = mine.find((x) => x.bottle_id === b.id);
      const s = scorePrediction(pred, b);
      return { bottleId: b.id, number: b.number, answered: !!pred, ...s };
    });
    const points = details.reduce((a, d) => a + d.total, 0);
    return {
      id: p.id,
      name: p.name,
      hors_concours: p.hors_concours,
      points,
      max: eligible.length * MAX_POINTS_PER_BOTTLE,
      answered: details.filter((d) => d.answered).length,
      appellations: details.filter((d) => d.detail.appellation > 0).length,
      details: details.sort((a, b) => (bottleById[a.bottleId].serve_order ?? 0) - (bottleById[b.bottleId].serve_order ?? 0)),
    };
  });
  const inContest = tasters.filter((t) => !t.hors_concours).sort((a, b) => b.points - a.points || b.appellations - a.appellations);
  const outContest = tasters.filter((t) => t.hors_concours).sort((a, b) => b.points - a.points);
  tasters = [...rankWithTies(inContest, 'points'), ...outContest.map((t) => ({ ...t, rank: null }))];

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

  const label = (w) => [w.producer, w.wine_name].filter(Boolean).join(', ') + (w.vintage ? ` ${w.vintage}` : '');
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
    lines.push(`${best.length > 1 ? 'Meilleurs dégustateurs ex aequo' : 'Meilleur dégustateur'} : ${joinFr(best.map((t) => t.name))}, ${best[0].points} points sur ${best[0].max}.`);
    ranked.filter((t) => t.rank > 1 && t.rank <= 3).forEach((t) => lines.push(`${t.rank}e : ${t.name}, ${t.points} points.`));
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
