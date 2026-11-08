import { APPELLATIONS, APPELLATIONS_BY_COUNTRY, REGIONS_BY_COUNTRY, GRAPES_BY_COUNTRY, appellationInfo, REGION_COUNTRY, regionLists } from './appellations';
import { REGIONS, GRAPES } from './constants';

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
