import { SCORING, NON_VINTAGE, MAX_POINTS_PER_BOTTLE, VINTAGE_TIERS, VINTAGE_POINTS } from './constants';

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

// Noms différents pour un même cépage.
const GRAPE_SYNONYMS = {
  shiraz: 'syrah', garnacha: 'grenache', 'grenache noir': 'grenache', cannonau: 'grenache',
  monastrell: 'mourvedre', mataro: 'mourvedre', carinena: 'carignan', mazuelo: 'carignan',
  zinfandel: 'primitivo', alvarinho: 'albarino', 'tinto fino': 'tempranillo', 'tinta roriz': 'tempranillo',
  aragonez: 'tempranillo', trebbiano: 'ugni blanc', rolle: 'vermentino', meunier: 'pinot meunier',
  'pinot grigio': 'pinot gris', 'pinot nero': 'pinot noir', spatburgunder: 'pinot noir', 'sauvignon': 'sauvignon blanc',
};
const canon = (g) => GRAPE_SYNONYMS[g] || g;
const sameGrape = (x, y) => {
  const a = canon(x);
  const b = canon(y);
  return a === b || (a.length >= 4 && b.startsWith(a + ' ')) || (b.length >= 4 && a.startsWith(b + ' '));
};

// Cépages : 4 points si tout est juste (tous trouvés, aucun faux),
// 3 points si au moins un est juste, moins 1 point par cépage faux (minimum 0).
export function grapesPoints(guess, truth) {
  const g = [...new Set(splitGrapes(guess))];
  const t = [...new Set(splitGrapes(truth))];
  if (!g.length || !t.length) return 0;
  const correct = g.filter((x) => t.some((y) => sameGrape(x, y)));
  if (!correct.length) return 0;
  const wrong = g.length - correct.length;
  const allFound = t.every((y) => g.some((x) => sameGrape(x, y)));
  if (allFound && wrong === 0) return SCORING.grapesAll;
  return Math.max(0, SCORING.grapesSome - wrong * SCORING.grapesWrongPenalty);
}

// Millésime : marge d'erreur qui grandit avec l'âge du vin.
export function vintagePoints(guess, truth) {
  if (guess === null || guess === undefined) return 0;
  const truthNV = truth === null || truth === undefined;
  if (guess === NON_VINTAGE) return truthNV ? SCORING.vintage : 0;
  if (truthNV) return 0;
  const tier = VINTAGE_TIERS.find((t) => truth >= t.from) || VINTAGE_TIERS.at(-1);
  const gap = Math.abs(guess - truth);
  const i = tier.margins.findIndex((m) => gap <= m);
  return i === -1 ? 0 : VINTAGE_POINTS[i];
}

function textMatch(guess, truth) {
  const g = norm(guess);
  const t = norm(truth);
  return !!g && !!t && (g === t || (g.length >= 4 && t.includes(g)) || (t.length >= 4 && g.includes(t)));
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
  const d = { appellation: 0, grapes: 0, region: 0, country: 0, color: 0, vintage: 0 };
  if (!pred) return { total: 0, detail: d };

  if (appellationMatch(pred.appellation, bottle.appellation)) d.appellation = SCORING.appellation;
  d.grapes = grapesPoints(pred.grapes, bottle.grapes);
  if (textMatch(pred.region, bottle.region)) d.region = SCORING.region;
  if (pred.country && bottle.country && pred.country === bottle.country) d.country = SCORING.country;
  if (pred.color && bottle.color && pred.color === bottle.color) d.color = SCORING.color;

  d.vintage = vintagePoints(pred.vintage, bottle.vintage);

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
      details: details.sort((a, b) => (bottleById[a.bottleId].number ?? 0) - (bottleById[b.bottleId].number ?? 0)),
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
    lines.push(`${best.length > 1 ? 'Meilleurs dégustateurs ex aequo' : 'Meilleur dégustateur'} : ${joinFr(best.map((t) => t.name))}, ${best[0].points} points sur ${best[0].max}, soit ${fmt(Math.round((best[0].points / (best[0].max || 1)) * 200) / 10)}/20 par vin.`);
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
