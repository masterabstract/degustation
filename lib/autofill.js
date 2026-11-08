import { APPELLATIONS, APPELLATIONS_BY_COUNTRY, REGIONS_BY_COUNTRY, GRAPES_BY_COUNTRY, appellationInfo, REGION_COUNTRY } from './appellations';
import { REGIONS, GRAPES } from './constants';

// Options proposées dans le champ « Appellation » : nom + rappel région et couleur.
const toOption = (a) => ({
  label: a.name,
  hint: `${a.region}${a.colors.length === 1 ? `, ${a.colors[0].toLowerCase()}` : ''}`,
});
export const APPELLATION_OPTIONS = APPELLATIONS.map(toOption);

// Listes proposées selon le pays choisi (toutes si aucun pays n'est choisi).
const cache = {};
export function optionsFor(country) {
  const key = country || '*';
  if (!cache[key]) {
    const known = country && APPELLATIONS_BY_COUNTRY[country];
    cache[key] = {
      appellations: known ? APPELLATIONS_BY_COUNTRY[country].map(toOption) : APPELLATION_OPTIONS,
      regions: country && REGIONS_BY_COUNTRY[country] ? REGIONS_BY_COUNTRY[country] : REGIONS,
      grapes: country && GRAPES_BY_COUNTRY[country] && country !== 'Autre pays' ? GRAPES_BY_COUNTRY[country] : GRAPES,
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
