import 'server-only';
import { HttpError } from './db';
import { cleanText } from './http';
import { COLORS, REGIONS, PRICE_RANGES } from './constants';

// Colonnes SECRÈTES d'une bouteille (visibles uniquement par son propriétaire
// avant la révélation, puis par tous après).
export const SECRET_COLS = 'wine_name, producer, color, grapes, region, appellation, vintage, price_range, notes';

// Version « anonyme » d'une bouteille : ce que l'organisateur et les autres voient.
export const PUBLIC_COLS = 'id, number, serve_order';

export function bottleFields(b) {
  const vintage = b.vintage === '' || b.vintage === null || b.vintage === undefined ? null : parseInt(b.vintage, 10);
  if (vintage !== null && (Number.isNaN(vintage) || vintage < 1900 || vintage > 2100)) throw new HttpError(400, 'Millésime invalide.');
  const f = {
    wine_name: cleanText(b.wine_name, 120),
    producer: cleanText(b.producer, 120),
    color: COLORS.includes(b.color) ? b.color : null,
    grapes: cleanText(b.grapes, 160),
    region: REGIONS.includes(b.region) ? b.region : null,
    appellation: cleanText(b.appellation, 120),
    vintage,
    price_range: PRICE_RANGES.includes(b.price_range) ? b.price_range : null,
    notes: cleanText(b.notes, 400),
  };
  if (!f.wine_name) throw new HttpError(400, 'Indiquez au moins le nom du vin.');
  return f;
}
