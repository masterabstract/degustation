// =====================================================================
//  BARÈME DU CONCOURS : 20 points par vin français, 23 par vin étranger.
//  Ce fichier est la seule source du calcul. Il ne dépend que des réponses
//  enregistrées : le même calcul donne toujours le même résultat.
// =====================================================================
import { APPELLATIONS } from './appellations';

export const BAREME = {
  france: { grapes: 10, country: 2, geo: 5, vintage: 3, total: 20 },
  foreign: { grapes: 10, country: 5, geo: 5, vintage: 3, total: 23 },
  grapeWrongPenalty: 1, // moins 1 point par cépage cité à tort (jamais en dessous de 0)
  // Identification géographique : plus la réponse est précise, plus elle rapporte.
  // Les niveaux ne se cumulent pas : seul le meilleur niveau trouvé compte.
  geoFrance: [
    { key: 'appellation', label: 'Appellation exacte', points: 5 },
    { key: 'region', label: 'Région viticole exacte', points: 3 },
  ],
  geoForeign: [
    { key: 'appellation', label: 'Appellation ou indication géographique exacte', points: 5 },
    { key: 'subregion', label: 'Sous-région ou vallée exacte', points: 4 },
    { key: 'region', label: 'Grande région viticole exacte', points: 3 },
    { key: 'zone', label: 'Grande zone ou province exacte', points: 2 },
  ],
};

// Millésime : 3 points pour l'année exacte, puis on perd des points à chaque
// année d'écart. Plus le vin est ancien, plus la tolérance est grande.
// zeroAt = écart (en années) à partir duquel on n'a plus aucun point.
export const VINTAGE_DECADES = [
  { from: 2020, label: '2020 et après', zeroAt: 3 },
  { from: 2010, label: 'Années 2010', zeroAt: 4 },
  { from: 2000, label: 'Années 2000', zeroAt: 5 },
  { from: 1990, label: 'Années 1990', zeroAt: 6 },
  { from: 1980, label: 'Années 1980', zeroAt: 10 },
  { from: 1970, label: 'Années 1970', zeroAt: 12 },
  { from: 0, label: 'Années 1960 et avant', zeroAt: 15 },
];
export const NON_VINTAGE = 0; // réponse « non millésimé »

export const isFrench = (bottle) => !bottle.country || bottle.country === 'France';
export const scaleOf = (bottle) => (isFrench(bottle) ? BAREME.france : BAREME.foreign);

const r2 = (n) => Math.round(n * 100) / 100; // arrondi au centième, toujours le même

// ---------- Normalisation des textes ----------
export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bste\b/g, 'sainte')
    .replace(/\bst\b/g, 'saint')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Cépages ----------
// Noms différents ou variantes reconnus pour un même cépage.
const GRAPE_SYNONYMS = {
  shiraz: 'syrah', 'syrah shiraz': 'syrah',
  garnacha: 'grenache', 'grenache noir': 'grenache', 'garnacha tinta': 'grenache', cannonau: 'grenache',
  monastrell: 'mourvedre', mataro: 'mourvedre',
  carinena: 'carignan', mazuelo: 'carignan', carignane: 'carignan', samso: 'carignan',
  zinfandel: 'primitivo',
  alvarinho: 'albarino',
  'tinto fino': 'tempranillo', 'tinta roriz': 'tempranillo', aragonez: 'tempranillo', 'tinta del pais': 'tempranillo', 'ull de llebre': 'tempranillo',
  trebbiano: 'ugni blanc',
  rolle: 'vermentino',
  meunier: 'pinot meunier',
  'pinot grigio': 'pinot gris', 'grauburgunder': 'pinot gris',
  'pinot nero': 'pinot noir', spatburgunder: 'pinot noir', blauburgunder: 'pinot noir',
  'pinot bianco': 'pinot blanc', weissburgunder: 'pinot blanc',
  sauvignon: 'sauvignon blanc', 'fume blanc': 'sauvignon blanc',
  'chenin blanc': 'chenin', 'pineau de la loire': 'chenin',
  melon: 'melon de bourgogne',
  cot: 'malbec',
  breton: 'cabernet franc',
  'gamay noir': 'gamay',
  moscato: 'muscat', moscatel: 'muscat', 'muscat blanc a petits grains': 'muscat', 'muscat a petits grains': 'muscat',
  fendant: 'chasselas',
  nielluccio: 'sangiovese', niellucciu: 'sangiovese', brunello: 'sangiovese', morellino: 'sangiovese',
  spanna: 'nebbiolo', chiavennasca: 'nebbiolo',
  sciaccarello: 'sciaccarellu',
  jaen: 'mencia',
  'gewurz': 'gewurztraminer',
  'grenache blanc': 'grenache blanc',
};
export const canonGrape = (g) => {
  const n = norm(g);
  return GRAPE_SYNONYMS[n] || n;
};

export function splitGrapeNames(s) {
  return String(s || '')
    .split(/[,/&+;]|\bet\b/i)
    .map((x) => x.replace(/\d+([.,]\d+)?\s*%?/g, '').trim())
    .filter(Boolean);
}

/**
 * Composition réelle d'une bouteille : [{ name, share }] avec share en % (total 100).
 * - grape_mix [{ name, pct }] saisi par le propriétaire ;
 * - sans pourcentages, les cépages se partagent la composition à parts égales.
 */
export function grapeComposition(bottle) {
  let mix = Array.isArray(bottle.grape_mix) && bottle.grape_mix.length ? bottle.grape_mix : splitGrapeNames(bottle.grapes).map((name) => ({ name, pct: null }));
  mix = mix.filter((g) => g && g.name && norm(g.name));
  if (!mix.length) return [];
  const withPct = mix.every((g) => typeof g.pct === 'number' && g.pct > 0);
  const sum = withPct ? mix.reduce((a, g) => a + g.pct, 0) : 0;
  const merged = new Map();
  for (const g of mix) {
    const key = canonGrape(g.name);
    const share = withPct ? (g.pct / sum) * 100 : 100 / mix.length;
    const prev = merged.get(key);
    merged.set(key, { name: prev?.name || g.name, key, share: (prev?.share || 0) + share });
  }
  return [...merged.values()];
}

export function scoreGrapes(guessText, bottle, max) {
  const truth = grapeComposition(bottle);
  const guessed = [];
  for (const name of splitGrapeNames(guessText)) {
    const key = canonGrape(name);
    if (key && !guessed.some((g) => g.key === key)) guessed.push({ name, key });
  }
  if (!guessed.length || !truth.length) return { pts: 0, max, found: [], wrong: [], answered: guessed.length > 0 };
  const found = [];
  const wrong = [];
  for (const g of guessed) {
    const t = truth.find((x) => x.key === g.key);
    if (t) found.push({ name: t.name, share: r2(t.share), pts: r2((max * t.share) / 100) });
    else wrong.push(g.name);
  }
  const raw = found.reduce((a, f) => a + (max * f.share) / 100, 0) - wrong.length * BAREME.grapeWrongPenalty;
  return { pts: r2(Math.min(max, Math.max(0, raw))), max, found, wrong, answered: true };
}

// ---------- Géographie ----------
// Désignations à ignorer : « Chianti Classico DOCG » = « Chianti Classico ».
const DESIGNATIONS = /\b(aoc|aop|ac|docg|doc|doca|docq|dop|do|igt|igp|ava|gi|wo|vdp|qba|qualitatswein|appellation|controlee|protegee|d origine|origine|denominazione|di|origine controllata|e garantita|premier cru|1er cru)\b/g;
export function normPlace(s) {
  return norm(s).replace(DESIGNATIONS, ' ').replace(/\s+/g, ' ').trim();
}

// Variantes reconnues pour les régions et zones (français, langue locale, anglais).
const PLACE_ALIASES = {
  rhone: 'vallee du rhone', 'cotes du rhone region': 'vallee du rhone', 'rhone valley': 'vallee du rhone',
  'vallee de la loire': 'loire', 'val de loire': 'loire', 'loire valley': 'loire',
  burgundy: 'bourgogne', bordelais: 'bordeaux', 'sud ouest de la france': 'sud ouest', 'south west': 'sud ouest',
  piemonte: 'piemont', piedmont: 'piemont', toscana: 'toscane', tuscany: 'toscane', veneto: 'venetie',
  sicilia: 'sicile', sicily: 'sicile', puglia: 'pouilles', abruzzo: 'abruzzes', lombardia: 'lombardie',
  'castilla y leon': 'castille et leon', catalunya: 'catalogne', cataluna: 'catalogne', galicia: 'galice', andalucia: 'andalousie',
  mosel: 'moselle', pfalz: 'palatinat', california: 'californie', 'western cape': 'western cape',
  'south australia': 'australie meridionale', 'vale do douro': 'douro', 'douro valley': 'douro',
};
const canonPlace = (s) => {
  const n = normPlace(s);
  return PLACE_ALIASES[n] || n;
};
const samePlace = (a, b) => {
  const x = canonPlace(a);
  const y = canonPlace(b);
  return !!x && !!y && x === y;
};

const APP_REGION = new Map(APPELLATIONS.map((a) => [normPlace(a.name), a.region]));

/**
 * Identification géographique. Le candidat a répondu « appellation » et
 * « région, sous-région ou zone ». On cherche le niveau le plus précis trouvé :
 * - appellation : seulement par le champ appellation (ou un nom accepté par le propriétaire) ;
 * - sous-région, région, zone : par l'un ou l'autre champ, ou par la région connue
 *   de l'appellation proposée (ex. « Barbaresco » donne la région Piémont).
 */
export function scoreGeo(guess, bottle) {
  const levels = isFrench(bottle) ? BAREME.geoFrance : BAREME.geoForeign;
  const gApp = guess?.appellation || '';
  const gReg = guess?.region || '';
  const derived = APP_REGION.get(normPlace(gApp)) || '';
  const accepted = [bottle.appellation, ...String(bottle.accepted_names || '').split(/[,;]/)].filter((x) => x && x.trim());

  for (const lvl of levels) {
    let ok = false;
    if (lvl.key === 'appellation') ok = accepted.some((a) => samePlace(gApp, a));
    else {
      const truth = bottle[lvl.key];
      if (truth) ok = [gApp, gReg, derived].some((g) => g && samePlace(g, truth));
    }
    if (ok) return { pts: lvl.points, max: 5, level: lvl.key, label: lvl.label, answered: !!(gApp || gReg) };
  }
  return { pts: 0, max: 5, level: null, label: 'Aucune identification géographique correcte', answered: !!(gApp || gReg) };
}

// ---------- Pays ----------
export function scoreCountry(guess, bottle, max) {
  const ok = !!guess && norm(guess) === norm(bottle.country || 'France');
  return { pts: ok ? max : 0, max, answered: !!guess };
}

// ---------- Millésime ----------
export function vintageDecade(year) {
  return VINTAGE_DECADES.find((d) => year >= d.from) || VINTAGE_DECADES.at(-1);
}

export function scoreVintage(guess, bottle, max) {
  const truth = bottle.vintage;
  const answered = guess !== null && guess !== undefined && guess !== '';
  if (!answered) return { pts: 0, max, answered: false, gap: null };
  const g = Number(guess);
  const truthNV = truth === null || truth === undefined;
  if (g === NON_VINTAGE) return { pts: truthNV ? max : 0, max, answered: true, gap: truthNV ? 0 : null };
  if (truthNV) return { pts: 0, max, answered: true, gap: null };
  const gap = Math.abs(g - truth);
  const { zeroAt } = vintageDecade(truth);
  return { pts: r2(Math.max(0, (max * (zeroAt - gap)) / zeroAt)), max, answered: true, gap };
}

// ---------- Score complet d'un pronostic sur un vin ----------
export function scoreBottle(pred, bottle) {
  const scale = scaleOf(bottle);
  const grapes = scoreGrapes(pred?.grapes, bottle, scale.grapes);
  const country = scoreCountry(pred?.country, bottle, scale.country);
  const geo = scoreGeo(pred, bottle);
  const vintage = scoreVintage(pred?.vintage, bottle, scale.vintage);
  const total = r2(grapes.pts + country.pts + geo.pts + vintage.pts);
  return { total, max: scale.total, french: isFrench(bottle), answered: !!pred && (grapes.answered || country.answered || geo.answered || vintage.answered), grapes, country, geo, vintage };
}

// ---------- Classement des dégustateurs ----------
// Classement au pourcentage des points possibles (chacun joue sur toutes les
// bouteilles sauf les siennes). Départage, dans l'ordre : part des points de
// cépage, puis de géographie, puis de pays, puis de millésime.
const KEYS = ['grapes', 'geo', 'country', 'vintage'];
export function rankTasters(list) {
  const key = (t) => [t.pct, ...KEYS.map((k) => t.byCrit[k].pct)].map((x) => Math.round(x * 1e6));
  const cmp = (a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    return 0;
  };
  const sorted = [...list].sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name, 'fr'));
  let rank = 0;
  return sorted.map((t, i) => {
    if (i === 0 || cmp(sorted[i - 1], t) !== 0) rank = i + 1;
    return { ...t, rank };
  });
}

/** Totaux d'un dégustateur à partir de ses scores par vin. */
export function summarize(details) {
  const byCrit = {};
  for (const k of KEYS) {
    const pts = r2(details.reduce((a, d) => a + d[k].pts, 0));
    const max = details.reduce((a, d) => a + d[k].max, 0);
    byCrit[k] = { pts, max, pct: max ? pts / max : 0 };
  }
  const points = r2(details.reduce((a, d) => a + d.total, 0));
  const max = details.reduce((a, d) => a + d.max, 0);
  return { points, max, pct: max ? points / max : 0, byCrit };
}

// Texte court expliquant un score (affiché dans les résultats).
export function explain(s) {
  const f = (n) => String(r2(n)).replace('.', ',');
  const g = s.grapes;
  const grapes = !g.answered
    ? 'pas de réponse'
    : [...g.found.map((x) => `${x.name} (${f(x.share)} %) +${f(x.pts)}`), ...g.wrong.map((w) => `${w} faux −${BAREME.grapeWrongPenalty}`)].join(', ') || 'aucun cépage juste';
  const v = s.vintage;
  const vintage = !v.answered ? 'pas de réponse' : v.gap === 0 ? 'exact' : v.gap === null ? 'faux' : `écart ${v.gap} an${v.gap > 1 ? 's' : ''}`;
  return { grapes, geo: s.geo.answered ? s.geo.label : 'pas de réponse', country: s.country.answered ? (s.country.pts ? 'exact' : 'faux') : 'pas de réponse', vintage };
}
