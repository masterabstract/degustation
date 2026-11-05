// Listes de choix partagées par le site (aucune donnée secrète ici).

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

export const REGIONS = [
  'Alsace', 'Beaujolais', 'Bordeaux', 'Bourgogne', 'Champagne', 'Corse', 'Jura',
  'Languedoc-Roussillon', 'Loire', 'Provence', 'Savoie', 'Sud-Ouest', 'Vallée du Rhône',
  'Allemagne', 'Autriche', 'Espagne', 'Italie', 'Portugal', 'États-Unis',
  'Amérique du Sud', 'Afrique du Sud', 'Australie, Nouvelle-Zélande', 'Autre pays',
];

export const PRICE_RANGES = ['Moins de 10 €', '10 à 20 €', '20 à 35 €', '35 à 60 €', 'Plus de 60 €'];

export const GRAPES = [
  'Cabernet Sauvignon', 'Cabernet Franc', 'Merlot', 'Malbec', 'Pinot Noir', 'Gamay', 'Syrah',
  'Grenache', 'Mourvèdre', 'Carignan', 'Cinsault', 'Tannat', 'Nebbiolo', 'Sangiovese', 'Tempranillo',
  'Chardonnay', 'Sauvignon Blanc', 'Chenin', 'Riesling', 'Gewurztraminer', 'Pinot Gris', 'Muscat',
  'Viognier', 'Marsanne', 'Roussanne', 'Sémillon', 'Melon de Bourgogne', 'Savagnin', 'Aligoté',
  'Vermentino', 'Pinot Meunier', 'Assemblage',
];

// Barème des pronostics (affiché aux participants).
export const SCORING = {
  color: 2,
  grapes: 3,
  region: 3,
  appellation: 4,
  vintageExact: 3,
  vintageOne: 2,
  vintageTwo: 1,
  priceExact: 2,
  priceNear: 1,
};
export const MAX_POINTS_PER_BOTTLE = 2 + 3 + 3 + 4 + 3 + 2;

// Code 0 dans un pronostic de millésime = « non millésimé ».
export const NON_VINTAGE = 0;
