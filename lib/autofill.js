import { APPELLATIONS, APPELLATIONS_BY_COUNTRY, REGIONS_BY_COUNTRY, GRAPES_BY_COUNTRY, appellationInfo, REGION_COUNTRY, regionLists } from './appellations';
import { REGIONS, GRAPES } from './constants';
import { canonGrape } from './bareme';
import { grapeColor } from './vins/couleurs-cepages';

// Options proposées dans le champ « Appellation » : nom + rappel région et couleur.
function hintOf(a) {
  if (a.type === 'VSIG') return a.country === 'France' ? 'Sans appellation (vins nature)' : 'Sans appellation';
  const color = a.colors.length === 1 ? `, ${a.colors[0].toLowerCase()}` : '';
  return `${a.region}${a.type === 'IGP' ? ', IGP' : ''}${color}`;
}
const toOption = (a) => ({ label: a.name, hint: hintOf(a) });
export const APPELLATION_OPTIONS = APPELLATIONS.map(toOption);

// Listes proposées selon le pays choisi (toutes si aucun pays n'est choisi),
// puis, si une région connue est choisie, selon la région.
// `inRegion` : true quand les appellations et cépages sont ceux de la région ;
// les listes du pays restent alors disponibles en secours (`countryAppellations`, `countryGrapes`).
const cache = {};
export function optionsFor(country, region) {
  const key = `${country || '*'}|${region || ''}`;
  if (!cache[key]) {
    const known = country && APPELLATIONS_BY_COUNTRY[country];
    const countryAppellations = known ? APPELLATIONS_BY_COUNTRY[country].map(toOption) : APPELLATION_OPTIONS;
    const countryGrapes = country && GRAPES_BY_COUNTRY[country] && country !== 'Autre pays' ? GRAPES_BY_COUNTRY[country] : GRAPES;
    const reg = regionLists(country, region);
    cache[key] = {
      regions: country && REGIONS_BY_COUNTRY[country] ? REGIONS_BY_COUNTRY[country] : REGIONS,
      appellations: reg ? reg.appellations.map(toOption) : countryAppellations,
      grapes: reg && reg.grapes.length ? reg.grapes : countryGrapes,
      inRegion: !!reg,
      // nom des vins sans appellation du pays (Vin de France, Vino d'Italia…), s'il existe
      generic: known ? APPELLATIONS_BY_COUNTRY[country].find((a) => a.type === 'VSIG')?.name || null : null,
      countryAppellations,
      countryGrapes,
    };
  }
  return cache[key];
}

/**
 * Calcule les champs à pré-remplir après le choix d'une appellation.
 * Un champ n'est rempli que s'il est vide ou s'il contient encore la valeur
 * remplie automatiquement la fois précédente (on n'écrase jamais une saisie).
 * `filled` mémorise ce qui a été rempli automatiquement.
 */
export function fillFromAppellation(current, name, filled) {
  const info = appellationInfo(name);
  if (!info) return null;
  const proposals = {
    region: info.region,
    country: info.country,
    grapes: info.grapes,
    color: info.colors.length === 1 ? info.colors[0] : null,
  };
  return applyProposals(current, proposals, filled);
}

export function fillFromRegion(current, region, filled) {
  const country = REGION_COUNTRY[region];
  return country ? applyProposals(current, { country }, filled) : null;
}

function applyProposals(current, proposals, filled) {
  const patch = {};
  for (const [k, v] of Object.entries(proposals)) {
    if (!v) continue;
    const cur = current[k];
    const free = cur === null || cur === undefined || cur === '' || cur === filled[k];
    if (free && cur !== v) {
      patch[k] = v;
      filled[k] = v;
    }
  }
  return Object.keys(patch).length ? patch : null;
}

const LABELS = { region: 'région', country: 'pays', grapes: 'cépage', color: 'couleur' };
export function describePatch(patch) {
  const keys = Object.keys(patch || {});
  if (!keys.length) return null;
  const names = keys.map((k) => LABELS[k]);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : names[0];
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} rempli${keys.length > 1 ? 's' : ''} automatiquement : vérifiez si besoin.`;
}

// ---------------------------------------------------------------------------
// Aide au pronostic : cépages <-> régions <-> appellations
// ---------------------------------------------------------------------------
const splitGrapes = (t) => String(t || '').split(',').map((x) => x.trim()).filter(Boolean);

// Cépage (forme canonique : Spätburgunder = Pinot Noir…) -> régions où des appellations l'utilisent.
const GRAPE_INDEX = new Map();
for (const a of APPELLATIONS) {
  if (!a.region) continue;
  for (const g of splitGrapes(a.grapes)) {
    const k = canonGrape(g);
    if (!GRAPE_INDEX.has(k)) GRAPE_INDEX.set(k, new Map());
    const key = `${a.country}|${a.region}`;
    const m = GRAPE_INDEX.get(k);
    if (!m.has(key)) m.set(key, { country: a.country, region: a.region, n: 0 });
    m.get(key).n++;
  }
}

/**
 * Régions où l'on trouve les cépages déjà notés dans le pronostic (dans le pays choisi,
 * ou dans tous les pays). Les régions qui ont le plus de ces cépages viennent d'abord.
 */
export function regionsForGrapes(grapesText, country) {
  const typed = splitGrapes(grapesText);
  const found = new Map();
  for (const name of typed) {
    const m = GRAPE_INDEX.get(canonGrape(name));
    if (!m) continue;
    for (const [key, r] of m) {
      if (country && country !== 'Autre pays' && r.country !== country) continue;
      if (!found.has(key)) found.set(key, { ...r, grapes: [], n: 0 });
      const f = found.get(key);
      if (!f.grapes.includes(name)) f.grapes.push(name);
      f.n += r.n;
    }
  }
  return [...found.values()].sort((a, b) => b.grapes.length - a.grapes.length || b.n - a.n || a.region.localeCompare(b.region, 'fr'));
}

/** Liste des régions pour le pronostic : celles des cépages notés d'abord, avec un rappel. */
export function regionOptions(baseRegions, grapesText, country) {
  const sugg = regionsForGrapes(grapesText, country);
  if (!sugg.length) return { options: baseRegions, suggested: [] };
  const top = sugg.map((r) => ({ label: r.region, hint: `${r.grapes.join(', ')}${country ? '' : ` · ${r.country}`}` }));
  const seen = new Set(top.map((o) => o.label));
  return { options: [...top, ...baseRegions.filter((r) => !seen.has(typeof r === 'string' ? r : r.label))], suggested: sugg.map((r) => r.region) };
}

/** Appellations : celles qui utilisent les cépages notés d'abord. */
export function appellationOptions(options, grapesText) {
  const typed = splitGrapes(grapesText).map((g) => [g, canonGrape(g)]);
  if (!typed.length) return options;
  const top = [], rest = [];
  for (const o of options) {
    const info = appellationInfo(o.label);
    const has = info ? typed.filter(([, k]) => splitGrapes(info.grapes).some((g) => canonGrape(g) === k)).map(([g]) => g) : [];
    if (has.length) top.push({ ...o, hint: `${o.hint} · ${has.join(', ')}` });
    else rest.push(o);
  }
  return [...top, ...rest];
}

/** Cépages d'une appellation, classés en rouges et blancs. */
export function appellationGrapes(name) {
  const info = appellationInfo(name);
  const list = info ? splitGrapes(info.grapes) : [];
  if (!list.length) return null;
  return {
    name: info.name,
    rouges: list.filter((g) => grapeColor(g) === 'rouge'),
    blancs: list.filter((g) => grapeColor(g) === 'blanc'),
    all: list,
  };
}

/** Cépages proposés : ceux de l'appellation choisie d'abord. */
export function grapeOptions(baseGrapes, appellation) {
  const g = appellationGrapes(appellation);
  if (!g) return baseGrapes;
  const top = g.all.map((x) => ({ label: x, hint: `${grapeColor(x)} · ${g.name}` }));
  const seen = new Set(g.all.map((x) => canonGrape(x)));
  return [...top, ...baseGrapes.filter((x) => !seen.has(canonGrape(typeof x === 'string' ? x : x.label)))];
}
