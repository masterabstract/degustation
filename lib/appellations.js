// Base de données des vins : appellations, régions et cépages, par pays.
// Sources de saisie : lib/vins/france.js, lib/vins/europe.js, lib/vins/cepages.js.
import { FRANCE } from './vins/france';
import { MONDE } from './vins/europe';
import { CEPAGES, INTERNATIONAUX } from './vins/cepages';

const COLOR_CODES = { R: 'Rouge', B: 'Blanc', O: 'Rosé', E: 'Effervescent', D: 'Doux / liquoreux' };

function parse(country, text) {
  const out = [];
  let region = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      region = line.slice(1).trim();
      continue;
    }
    const [name, colors = '', grapes = ''] = line.split('|').map((x) => x.trim());
    out.push({ name, region, country, colors: colors.split('').map((c) => COLOR_CODES[c]).filter(Boolean), grapes });
  }
  return out;
}

const BY_COUNTRY = { France: parse('France', FRANCE) };
for (const [country, text] of Object.entries(MONDE)) BY_COUNTRY[country] = parse(country, text);

export const APPELLATIONS = Object.values(BY_COUNTRY).flat();

// Pays proposés : France d'abord, puis l'Europe, puis le reste du monde.
const EUROPE = ['Italie', 'Espagne', 'Portugal', 'Allemagne', 'Autriche', 'Suisse', 'Grèce', 'Hongrie', 'Slovénie', 'Croatie', 'Roumanie', 'Bulgarie', 'Géorgie', 'Luxembourg', 'Belgique', 'Royaume-Uni', 'République tchèque', 'Chypre'];
const WORLD = ['États-Unis', 'Argentine', 'Chili', 'Afrique du Sud', 'Australie', 'Nouvelle-Zélande', 'Liban'];
export const COUNTRY_LIST = ['France', ...EUROPE, ...WORLD, 'Autre pays'];

// Sans doublons (« Gewurztraminer » et « Gewürztraminer » ne comptent qu'une fois), triés.
const fold = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const uniqSorted = (arr) => {
  const m = new Map();
  for (const x of arr) if (x && !m.has(fold(x))) m.set(fold(x), x);
  return [...m.values()].sort((a, b) => a.localeCompare(b, 'fr'));
};

export const APPELLATIONS_BY_COUNTRY = Object.fromEntries(Object.entries(BY_COUNTRY).map(([c, list]) => [c, list]));

export const REGIONS_BY_COUNTRY = Object.fromEntries(Object.entries(BY_COUNTRY).map(([c, list]) => [c, uniqSorted(list.map((a) => a.region))]));

export const GRAPES_BY_COUNTRY = Object.fromEntries(
  COUNTRY_LIST.map((c) => [
    c,
    uniqSorted([...(CEPAGES[c] || []), ...INTERNATIONAUX, ...(BY_COUNTRY[c] || []).flatMap((a) => a.grapes.split(',').map((g) => g.trim()))]),
  ])
);

export const ALL_REGIONS = uniqSorted(APPELLATIONS.map((a) => a.region));
export const ALL_GRAPES = uniqSorted([...INTERNATIONAUX, ...Object.values(CEPAGES).flat(), ...APPELLATIONS.flatMap((a) => a.grapes.split(',').map((g) => g.trim()))]);

const BY_NAME = new Map(APPELLATIONS.map((a) => [a.name.toLowerCase(), a]));
export function appellationInfo(name) {
  return BY_NAME.get(String(name || '').toLowerCase()) || null;
}

// Pays de chaque région connue (pour remplir le pays quand on choisit une région).
export const REGION_COUNTRY = Object.fromEntries(APPELLATIONS.map((a) => [a.region, a.country]));
