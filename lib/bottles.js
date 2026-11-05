import 'server-only';
import { HttpError } from './db';
import { cleanText } from './http';
import { COLORS, COUNTRIES } from './constants';

// Colonnes SECRÈTES d'une bouteille (visibles uniquement par son propriétaire
// avant la révélation, puis par tous après).
export const SECRET_COLS = 'producer, wine_name, appellation, grapes, region, country, color, vintage, notes';

// Version « anonyme » d'une bouteille : ce que l'organisateur et les autres voient.
export const PUBLIC_COLS = 'id, number, serve_order';

export function bottleFields(b) {
  const vintage = b.vintage === '' || b.vintage === null || b.vintage === undefined ? null : parseInt(b.vintage, 10);
  if (vintage !== null && (Number.isNaN(vintage) || vintage < 1900 || vintage > 2100)) throw new HttpError(400, 'Millésime invalide.');
  const producer = cleanText(b.producer, 120);
  if (!producer) throw new HttpError(400, 'Indiquez au moins le domaine, château ou maison.');
  const f = {
    producer,
    wine_name: cleanText(b.wine_name, 120) || producer, // cuvée facultative
    appellation: cleanText(b.appellation, 120),
    grapes: cleanText(b.grapes, 160),
    region: cleanText(b.region, 80),
    country: COUNTRIES.includes(b.country) ? b.country : null,
    color: COLORS.includes(b.color) ? b.color : null,
    vintage,
    notes: cleanText(b.notes, 400),
  };
  return f;
}
