// =====================================================================
//  BARÈME DU CONCOURS : 20 points par vin français, 23 par vin étranger.
//  Ce fichier est la seule source du calcul. Il ne dépend que des réponses
//  enregistrées : le même calcul donne toujours le même résultat.
// =====================================================================

export const BAREME = {
  france: { grapes: 10, country: 2, geo: 5, vintage: 3, total: 20 },
  foreign: { grapes: 10, country: 5, geo: 5, vintage: 3, total: 23 },
  grapeWrongPenalty: 1, // moins 1 point par cépage cité à tort (jamais en dessous de 0)
  // Identification géographique, identique pour tous les vins (français et étrangers) :
  // deux réponses indépendantes qui s'additionnent. La bonne région (champ Région) rapporte
  // 3 points ; l'appellation exacte rapporte 2 points. Une appellation exacte avec une région
  // fausse ou absente ne rapporte donc que 2 points (cas fréquent des Vins de France).
  geoSplit: { region: 3, appellation: 2 },
  geoFranceSplit: { region: 3, appellation: 2 }, // (ancien nom, conservé)
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

// Note globale d'un dégustateur : le pourcentage des points possibles, ramené sur 20.
// (ex. 71,5 % des points = 14,3/20). Le classement utilise la valeur exacte.
export const sur20 = (pct) => Math.round(pct * 20 * 100) / 100;

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
const SYN = {
  syrah: ['shiraz', 'syrah shiraz'],
  grenache: ['garnacha', 'grenache noir', 'garnacha tinta', 'cannonau', 'lledoner pelut', 'garnacha peluda'],
  'grenache blanc': ['garnacha blanca'],
  mourvedre: ['monastrell', 'mataro'],
  carignan: ['carinena', 'mazuelo', 'carignane', 'carignano', 'samso'],
  primitivo: ['zinfandel', 'crljenak kastelanski', 'tribidrag'],
  albarino: ['alvarinho'],
  tempranillo: ['tinto fino', 'tinta de toro', 'tinta roriz', 'aragonez', 'tinta del pais', 'tinto del pais', 'cencibel', 'ull de llebre'],
  macabeo: ['viura', 'macabeu'],
  'ugni blanc': ['trebbiano', 'trebbiano toscano', 'procanico'],
  vermentino: ['rolle', 'pigato', 'favorita'],
  'pinot meunier': ['meunier', 'schwarzriesling'],
  'pinot gris': ['pinot grigio', 'grauburgunder', 'sivi pinot', 'rulander', 'szurkebarat'],
  'pinot noir': ['pinot nero', 'spatburgunder', 'blauburgunder'],
  'pinot blanc': ['pinot bianco', 'weissburgunder'],
  'sauvignon blanc': ['sauvignon', 'fume blanc'],
  chenin: ['chenin blanc', 'pineau de la loire', 'steen'],
  'melon de bourgogne': ['melon', 'muscadet'],
  malbec: ['cot'],
  'cabernet franc': ['breton', 'bouchy'],
  'fer servadou': ['braucol', 'mansois', 'pinenc'],
  gamay: ['gamay noir'],
  muscat: ['moscato', 'moscatel', 'moscato bianco', 'moscato giallo', 'muscat blanc a petits grains', 'muscat a petits grains', 'muscat d alexandrie', 'moscatel de alejandria', 'moscatel de grano menudo', 'zibibbo', 'muscat ottonel', 'muskateller', 'gelber muskateller', 'sargamuskotaly', 'rumeni muskat', 'muskat moravsky', 'moscatel de setubal', 'moscatel roxo'],
  chasselas: ['fendant', 'gutedel'],
  sangiovese: ['nielluccio', 'niellucciu', 'brunello', 'morellino', 'prugnolo gentile'],
  nebbiolo: ['spanna', 'chiavennasca'],
  sciaccarellu: ['sciaccarello'],
  mencia: ['jaen'],
  gewurztraminer: ['gewurz', 'traminer aromatico', 'tramini'],
  'muller thurgau': ['rivaner', 'riesling sylvaner', 'riesling x sylvaner'],
  sylvaner: ['silvaner', 'johannisberg'],
  blaufrankisch: ['lemberger', 'kekfrankos', 'frankovka', 'modra frankinja'],
  welschriesling: ['olaszrizling', 'grasevina', 'laski rizling', 'ryzlink vlassky'],
  riesling: ['ryzlink rynsky', 'rheinriesling'],
  'gruner veltliner': ['gruner', 'veltlinske zelene'],
  'saint laurent': ['sankt laurent', 'svatovavrinecke'],
  zweigelt: ['zweigeltrebe', 'blauer zweigelt'],
  portugieser: ['blauer portugieser', 'kekoporto', 'modry portugal'],
  savagnin: ['heida', 'paien'],
  chardonnay: ['morillon'],
  friulano: ['tocai friulano', 'sauvignonasse', 'sauvignon vert'],
  'ribolla gialla': ['rebula', 'ribolla'],
  refosco: ['refosk', 'refosco dal peduncolo rosso'],
  'malvasia istriana': ['malvazija istarska', 'malvazija'],
  'nero di troia': ['uva di troia'],
  pignoletto: ['grechetto gentile'],
  ansonica: ['inzolia', 'insolia'],
  'alicante bouschet': ['garnacha tintorera'],
  trincadeira: ['tinta amarela'],
  'fernao pires': ['maria gomes'],
  siria: ['roupeiro'],
  arinto: ['pederna'],
  sousao: ['souson', 'vinhao'],
  'tinta negra': ['tinta negra mole', 'negra mole'],
  palomino: ['listan blanco', 'palomino fino'],
  'listan prieto': ['pais', 'criolla chica', 'mission'],
  'pedro ximenez': ['px'],
  prensal: ['moll', 'prensal blanc'],
  durif: ['petite sirah'],
  carmenere: ['grande vidure'],
  piquepoul: ['picpoul'],
  kadarka: ['gamza'],
  furmint: ['sipon'],
  teran: ['terrano'],
  altesse: ['roussette'],
  'savagnin rose': ['klevener'],
};
const GRAPE_SYNONYMS = {};
for (const [canon, list] of Object.entries(SYN)) for (const v of list) GRAPE_SYNONYMS[norm(v)] = canon;
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
  const n = norm(s);
  // « Chablis Premier Cru » est une appellation à part entière (ailleurs, « 1er cru » n'est qu'une mention).
  if (/^chablis (premier|1er) cru\b/.test(n)) return 'chablis premier cru';
  return n.replace(DESIGNATIONS, ' ').replace(/\s+/g, ' ').trim();
}

// Variantes reconnues pour les régions et zones (français, langue locale, anglais).
const PLACE_ALIASES = {
  rhone: 'vallee du rhone', 'cotes du rhone region': 'vallee du rhone', 'rhone valley': 'vallee du rhone',
  'vallee de la loire': 'loire', 'val de loire': 'loire', 'loire valley': 'loire',
  burgundy: 'bourgogne', bordelais: 'bordeaux', 'sud ouest de la france': 'sud ouest', 'south west': 'sud ouest',
  'savoie bugey': 'savoie',
  // Vins sans appellation (souvent les vins nature)
  vdf: 'vin de france', 'vin de table': 'vin de france', 'vin de table francais': 'vin de france', vsig: 'vin de france',
  // Italie
  piemonte: 'piemont', piedmont: 'piemont', toscana: 'toscane', tuscany: 'toscane', veneto: 'venetie',
  sicilia: 'sicile', sicily: 'sicile', puglia: 'pouilles', apulia: 'pouilles', abruzzo: 'abruzzes', lombardia: 'lombardie',
  'trentino alto adige': 'trentin haut adige', 'trentino': 'trentin haut adige', 'alto adige': 'trentin haut adige', 'sudtirol': 'trentin haut adige',
  'friuli venezia giulia': 'frioul venetie julienne', frioul: 'frioul venetie julienne', friuli: 'frioul venetie julienne',
  'emilia romagna': 'emilie romagne', marche: 'marches', lazio: 'latium', umbria: 'ombrie', campania: 'campanie',
  basilicata: 'basilicate', calabria: 'calabre', sardegna: 'sardaigne', sardinia: 'sardaigne', liguria: 'ligurie', 'valle d aosta': 'val d aoste',
  // Espagne
  'la rioja': 'rioja', 'castilla y leon': 'castille et leon', catalunya: 'catalogne', cataluna: 'catalogne', galicia: 'galice',
  andalucia: 'andalousie', navarra: 'navarre', aragon: 'aragon', 'pais vasco': 'pays basque', extremadura: 'estremadure',
  'castilla la mancha': 'castille la manche', murcia: 'murcie', 'comunidad valenciana': 'communaute valencienne',
  baleares: 'iles baleares', canarias: 'iles canaries', 'canary islands': 'iles canaries',
  // Portugal
  'vale do douro': 'douro', 'douro valley': 'douro', 'peninsula de setubal': 'peninsule de setubal', madeira: 'madere', acores: 'acores', azores: 'acores',
  // Allemagne, Autriche, Suisse
  mosel: 'moselle', pfalz: 'palatinat', baden: 'bade', wurttemberg: 'wurtemberg', franken: 'franconie', sachsen: 'saxe',
  niederosterreich: 'basse autriche', steiermark: 'styrie', wien: 'vienne', ticino: 'tessin', 'deutschschweiz': 'suisse alemanique',
  // Croatie, Hongrie, Autriche (noms officiels et anciens noms)
  istrie: 'istrie et kvarner', istra: 'istrie et kvarner', 'hrvatska istra': 'istrie et kvarner', 'istra i kvarner': 'istrie et kvarner',
  slavonie: 'slavonie et danube', slavonija: 'slavonie et danube', 'slavonija i hrvatsko podunavlje': 'slavonie et danube',
  'bregovita hrvatska': 'croatie des collines', 'croatian uplands': 'croatie des collines',
  dalmacija: 'dalmatie', dalmatia: 'dalmatie',
  'egri': 'eger', 'felso magyarorszag': 'eger', 'eszak dunantul': 'felso pannon', 'balatoni': 'balaton', 'dunai': 'duna', 'tokaji': 'tokaj', 'tokaj hegyalja': 'tokaj',
  'bergland osterreich': 'bergland', crisana: 'crisana et maramures',
  flanders: 'flandre', vlaanderen: 'flandre', wales: 'pays de galles', england: 'angleterre',
  // Autres
  california: 'californie', 'south australia': 'australie meridionale', 'western australia': 'australie occidentale',
  'new south wales': 'nouvelle galles du sud', santorini: 'cyclades', kakheti: 'kakhetie',
};
const canonPlace = (s) => {
  const n = normPlace(s);
  return PLACE_ALIASES[n] || n;
};
const samePlace = (a, b) => {
  const x = canonPlace(a);
  const y = canonPlace(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // « Languedoc-Roussillon » vaut pour les deux régions.
  const lr = new Set(['languedoc', 'roussillon']);
  return (x === 'languedoc roussillon' && lr.has(y)) || (y === 'languedoc roussillon' && lr.has(x));
};

/**
 * Identification géographique (tous les vins) : région 3 points + appellation 2 points,
 * chacune jugée sur sa propre réponse. L'appellation est reconnue avec ou sans accents,
 * tirets ni mentions (AOC, DOCG, DO…), et la région avec ses noms courants (Toscana = Toscane).
 */
export function scoreGeo(guess, bottle) {
  const gApp = guess?.appellation || '';
  const gReg = guess?.region || '';
  const accepted = [bottle.appellation, ...String(bottle.accepted_names || '').split(/[,;]/)].filter((x) => x && x.trim());
  const answered = !!(gApp || gReg);
  const S = BAREME.geoSplit;
  const regOk = !!bottle.region && !!gReg && samePlace(gReg, bottle.region);
  const appOk = !!gApp && accepted.some((a) => samePlace(gApp, a));
  const pts = (regOk ? S.region : 0) + (appOk ? S.appellation : 0);
  const label = regOk && appOk
    ? `Région (${S.region}) + appellation (${S.appellation}) exactes`
    : regOk
      ? `Région exacte (${S.region}), appellation ${gApp ? 'fausse' : 'non donnée'}`
      : appOk
        ? `Appellation exacte (${S.appellation}), région ${gReg ? 'fausse' : 'non donnée'}`
        : 'Ni la région ni l’appellation';
  return { pts, max: S.region + S.appellation, level: regOk && appOk ? 'appellation' : regOk ? 'region' : appOk ? 'appellation_seule' : null, label, answered, regOk, appOk };
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
