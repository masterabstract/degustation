// Listes de choix partagées par le site (aucune donnée secrète ici).
import { APPELLATIONS, REGION_COUNTRY } from './appellations';

export const COLORS = ['Effervescent', 'Blanc', 'Rosé', 'Rouge', 'Doux / liquoreux'];

// Ordre de service conseillé : bulles, blancs, rosés, rouges, vins doux.
export const SERVE_ORDER_BY_COLOR = {
  Effervescent: 0,
  Blanc: 1,
  'Rosé': 2,
  Rouge: 3,
  'Doux / liquoreux': 4,
};

export const ROBES = [
  { group: 'Blancs', values: ['Jaune vert', 'Jaune pâle', 'Jaune paille', 'Jaune doré', 'Or', 'Ambré'] },
  { group: 'Rosés', values: ['Gris', 'Rose pâle', 'Pétale', 'Saumon', 'Framboise'] },
  { group: 'Rouges', values: ['Violacé', 'Pourpre', 'Rubis', 'Grenat', 'Tuilé', 'Orangé'] },
];
export const ALL_ROBES = ROBES.flatMap((g) => g.values);

export const AROMES = [
  'Fruits frais',
  'Fruits mûrs, confits',
  'Agrumes',
  'Fruits secs',
  'Floral',
  'Végétal, herbacé',
  'Épicé',
  'Boisé, vanillé',
  'Grillé, torréfié',
  'Beurré, pâtissier',
  'Minéral',
  'Animal, cuir',
  'Sous-bois, truffe',
  'Balsamique, résineux',
];

// Échelles à 5 crans (valeur 1 à 5). "tanins" accepte aussi 0 = sans objet.
export const SCALES = {
  intensite_visuelle: { label: 'Intensité visuelle', steps: ['Pâle', 'Légère', 'Moyenne', 'Soutenue', 'Profonde'] },
  intensite_nez: { label: 'Intensité du nez', steps: ['Fermé', 'Discret', 'Moyen', 'Expressif', 'Puissant'] },
  acidite: { label: 'Acidité', steps: ['Plate', 'Souple', 'Fraîche', 'Vive', 'Nerveuse'] },
  tanins: { label: 'Tanins', steps: ['Fondus', 'Souples', 'Présents', 'Fermes', 'Astringents'], none: 'Sans objet' },
  corps: { label: 'Corps', steps: ['Léger', 'Fluide', 'Moyen', 'Charpenté', 'Puissant'] },
  equilibre: { label: 'Équilibre', steps: ['Déséquilibré', 'Fragile', 'Correct', 'Harmonieux', 'Remarquable'] },
  longueur: { label: 'Longueur en bouche', steps: ['Courte', 'Moyenne', 'Bonne', 'Longue', 'Très longue'], hint: 'Courte : moins de 3 s. Très longue : plus de 12 s.' },
};

export const COUNTRIES = [
  'France', 'Italie', 'Espagne', 'Portugal', 'Allemagne', 'Autriche', 'Suisse', 'Grèce', 'Hongrie',
  'Liban', 'Géorgie', 'États-Unis', 'Argentine', 'Chili', 'Afrique du Sud', 'Australie', 'Nouvelle-Zélande', 'Autre pays',
];

// Suggestions de régions (saisie libre : on peut taper une autre région).
// Complétées automatiquement par les régions de la base d'appellations.
export const BASE_REGIONS = [
  'Alsace', 'Beaujolais', 'Bordeaux', 'Bourgogne', 'Champagne', 'Corse', 'Jura', 'Languedoc', 'Roussillon',
  'Loire', 'Provence', 'Savoie', 'Sud-Ouest', 'Vallée du Rhône',
  'Piémont', 'Toscane', 'Vénétie', 'Sicile', 'Rioja', 'Ribera del Duero', 'Priorat', 'Douro', 'Moselle', 'Rheingau',
  'Wachau', 'Napa Valley', 'Mendoza', 'Stellenbosch', 'Barossa', 'Marlborough',
];

export const BASE_GRAPES = [
  'Cabernet Sauvignon', 'Cabernet Franc', 'Merlot', 'Malbec', 'Pinot Noir', 'Gamay', 'Syrah',
  'Grenache', 'Mourvèdre', 'Carignan', 'Cinsault', 'Tannat', 'Nebbiolo', 'Sangiovese', 'Tempranillo',
  'Chardonnay', 'Sauvignon Blanc', 'Chenin', 'Riesling', 'Gewurztraminer', 'Pinot Gris', 'Muscat',
  'Viognier', 'Marsanne', 'Roussanne', 'Sémillon', 'Melon de Bourgogne', 'Savagnin', 'Aligoté',
  'Vermentino', 'Pinot Meunier', 'Assemblage',
];

// Barème des pronostics (affiché aux participants).
export const SCORING = {
  appellation: 4,
  grapes: 3,
  region: 3,
  country: 2,
  color: 2,
  vintageExact: 3,
  vintageOne: 2,
  vintageTwo: 1,
};
export const MAX_POINTS_PER_BOTTLE = 4 + 3 + 3 + 2 + 2 + 3;

// Code 0 dans un pronostic de millésime = « non millésimé ».
export const NON_VINTAGE = 0;

// ---------- Listes complètes pour la saisie assistée ----------

export const REGIONS = [...new Set([...BASE_REGIONS, ...APPELLATIONS.map((a) => a.region)])].sort((a, b) => a.localeCompare(b, 'fr'));

export const GRAPES = [
  ...new Set([
    ...BASE_GRAPES,
    ...APPELLATIONS.flatMap((a) => a.grapes.split(',').map((g) => g.trim())),
    'Petit Verdot', 'Muscadelle', 'Ugni Blanc', 'Colombard', 'Jacquère', 'Altesse', 'Mondeuse', 'Poulsard', 'Trousseau',
    'Chasselas', 'Romorantin', 'Sciaccarellu', 'Nielluccio', 'Grüner Veltliner', 'Albariño', 'Verdejo', 'Touriga Nacional',
    'Corvina', 'Garganega', 'Glera', 'Nerello Mascalese', 'Barbera', 'Dolcetto', 'Cortese', 'Furmint', 'Assyrtiko', 'Mencía',
    'Palomino', 'Zinfandel', 'Pinotage', 'Carménère', 'Pinot Blanc', 'Grolleau', 'Négrette', 'Fer Servadou', 'Mauzac',
    'Piquepoul', 'Clairette', 'Petit Manseng', 'Gros Manseng', 'Rolle', 'Bourboulenc', 'Shiraz', 'Primitivo', 'Montepulciano',
  ]),
].sort((a, b) => a.localeCompare(b, 'fr'));

export { REGION_COUNTRY };
