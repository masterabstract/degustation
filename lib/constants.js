// Listes de choix partagées par le site (aucune donnée secrète ici).
import { COUNTRY_LIST, ALL_REGIONS, ALL_GRAPES, REGION_COUNTRY } from './appellations';

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

export const COUNTRIES = COUNTRY_LIST;

// Listes complètes (toutes régions et tous cépages connus de la base).
export const REGIONS = ALL_REGIONS;
export const GRAPES = ALL_GRAPES;

export { REGION_COUNTRY };

// Code 0 dans un pronostic de millésime = « non millésimé ».
export { NON_VINTAGE } from './bareme';
