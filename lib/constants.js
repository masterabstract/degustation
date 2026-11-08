// Listes de choix partagées par le site (aucune donnée secrète ici).
import { COUNTRY_LIST, ALL_REGIONS, ALL_GRAPES, REGION_COUNTRY } from './appellations';

export const COLORS = ['Effervescent', 'Blanc', 'Orange', 'Rosé', 'Rouge', 'Doux / liquoreux'];

// Ordre de service conseillé : bulles, blancs, oranges (macération), rosés, rouges, vins doux.
export const SERVE_ORDER_BY_COLOR = {
  Effervescent: 0,
  Blanc: 1,
  Orange: 2,
  'Rosé': 3,
  Rouge: 4,
  'Doux / liquoreux': 5,
};

export const ROBES = [
  { group: 'Blancs', values: ['Jaune vert', 'Jaune pâle', 'Jaune paille', 'Jaune doré', 'Or', 'Ambré'] },
  { group: 'Oranges (macération)', values: ['Orange pâle', 'Orange vif', 'Cuivré', 'Mordoré'] },
  { group: 'Rosés', values: ['Gris', 'Rose pâle', 'Pétale', 'Saumon', 'Framboise'] },
  { group: 'Rouges', values: ['Violacé', 'Pourpre', 'Rubis', 'Grenat', 'Tuilé', 'Orangé'] },
];
export const ALL_ROBES = ROBES.flatMap((g) => g.values);

// Roue des arômes : 3 origines (raisin, fermentation, élevage et vieillissement),
// 21 familles et leurs descripteurs précis. Plusieurs choix possibles.
export const AROME_FAMILLES = [
  { origine: 'Arômes primaires (le raisin)', famille: 'Fruits rouges', aromes: ['Fraise', 'Fraise des bois', 'Framboise', 'Groseille', 'Cerise', 'Griotte', 'Canneberge'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Fruits noirs', aromes: ['Cassis', 'Mûre', 'Myrtille', 'Cerise noire', 'Prune', 'Sureau'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Agrumes', aromes: ['Citron', 'Citron vert', 'Pamplemousse', 'Orange', 'Mandarine', 'Bergamote', 'Zeste d’agrume'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Fruits blancs et à noyau', aromes: ['Pomme verte', 'Pomme mûre', 'Poire', 'Coing', 'Pêche blanche', 'Pêche jaune', 'Abricot', 'Mirabelle'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Fruits exotiques', aromes: ['Ananas', 'Mangue', 'Fruit de la passion', 'Litchi', 'Banane', 'Melon', 'Goyave'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Floral', aromes: ['Fleurs blanches', 'Acacia', 'Aubépine', 'Chèvrefeuille', 'Fleur d’oranger', 'Jasmin', 'Tilleul', 'Rose', 'Violette', 'Pivoine', 'Iris', 'Genêt'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Végétal', aromes: ['Herbe coupée', 'Foin', 'Bourgeon de cassis', 'Buis', 'Poivron vert', 'Feuille de tomate', 'Fougère', 'Menthe', 'Eucalyptus'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Herbes et garrigue', aromes: ['Garrigue', 'Thym', 'Romarin', 'Laurier', 'Fenouil', 'Anis', 'Réglisse'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Épices', aromes: ['Poivre noir', 'Poivre blanc', 'Clou de girofle', 'Cannelle', 'Muscade', 'Gingembre', 'Safran'] },
  { origine: 'Arômes primaires (le raisin)', famille: 'Minéral', aromes: ['Pierre à fusil', 'Silex', 'Craie', 'Graphite', 'Iodé', 'Salin', 'Pétrole (hydrocarbure)'] },
  { origine: 'Arômes secondaires (la fermentation)', famille: 'Lacté et levuré', aromes: ['Beurre frais', 'Crème', 'Yaourt', 'Brioche', 'Mie de pain', 'Levure', 'Biscuit'] },
  { origine: 'Arômes secondaires (la fermentation)', famille: 'Bonbon et fermentaire', aromes: ['Bonbon anglais', 'Bonbon acidulé', 'Guimauve'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Boisé', aromes: ['Chêne', 'Vanille', 'Noix de coco', 'Cèdre', 'Santal', 'Boîte à cigares'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Grillé et torréfié', aromes: ['Pain grillé', 'Fumé', 'Café', 'Cacao', 'Chocolat', 'Moka', 'Caramel', 'Amande grillée', 'Noisette grillée'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Fruits secs et confits', aromes: ['Amande', 'Noisette', 'Noix', 'Figue sèche', 'Pruneau', 'Raisin sec', 'Datte', 'Fruits confits', 'Écorce d’orange confite'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Miel et confiserie', aromes: ['Miel', 'Cire d’abeille', 'Pâte d’amande', 'Pain d’épices', 'Confiture', 'Fruits cuits'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Sous-bois et terre', aromes: ['Champignon', 'Sous-bois', 'Feuilles mortes', 'Humus', 'Terre humide', 'Truffe'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Animal', aromes: ['Cuir', 'Gibier', 'Fourrure', 'Viande', 'Musc'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Tabac et thé', aromes: ['Tabac blond', 'Tabac brun', 'Thé noir', 'Foin séché'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Balsamique', aromes: ['Résine', 'Pin', 'Encens', 'Camphre', 'Goudron'] },
  { origine: 'Arômes tertiaires (l’élevage et le vieillissement)', famille: 'Oxydatif', aromes: ['Noix fraîche', 'Curry', 'Pomme blette', 'Rancio'] },
  { origine: 'Défauts éventuels', famille: 'Défauts', aromes: ['Bouchonné (moisi, carton)', 'Réduit (œuf, chou)', 'Soufré (allumette)', 'Oxydé (madérisé)', 'Phénolé (écurie, sueur de cheval)', 'Piqué (vinaigre, vernis)'] },
];
export const AROMES = AROME_FAMILLES.flatMap((f) => f.aromes);
// Familles de l'ancienne fiche (soirées déjà enregistrées) : toujours acceptées et affichées.
export const AROMES_ANCIENS = ['Fruits frais', 'Fruits mûrs, confits', 'Agrumes', 'Fruits secs', 'Floral', 'Végétal, herbacé', 'Épicé', 'Boisé, vanillé', 'Grillé, torréfié', 'Beurré, pâtissier', 'Minéral', 'Animal, cuir', 'Sous-bois, truffe', 'Balsamique, résineux'];
export const FAMILLE_DE_AROME = Object.fromEntries(AROME_FAMILLES.flatMap((f) => f.aromes.map((a) => [a, f.famille])));

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
