import 'server-only';
import { db, unwrap, HttpError } from './db';
import { cleanText } from './http';
import { COLORS, COUNTRIES } from './constants';

// Colonnes SECRÈTES d'une bouteille (visibles uniquement par son propriétaire
// avant la révélation, puis par tous après).
export const SECRET_COLS = 'producer, wine_name, appellation, grapes, region, country, color, vintage, notes';

// Version « anonyme » d'une bouteille : ce que l'organisateur et les autres voient.
export const PUBLIC_COLS = 'id, number, serve_order';

export function bottleFields(b) {
  const producer = cleanText(b.producer, 120);
  if (!producer) throw new HttpError(400, 'Indiquez le domaine, château ou maison.');

  const cuvee = cleanText(b.wine_name, 120); // facultatif

  // Millésime obligatoire, sauf si « Non millésimé » est choisi.
  let vintage = null;
  if (!b.non_vintage) {
    vintage = b.vintage === '' || b.vintage === null || b.vintage === undefined ? null : parseInt(b.vintage, 10);
    if (vintage === null) throw new HttpError(400, 'Indiquez le millésime, ou touchez « Non millésimé ».');
    if (Number.isNaN(vintage) || vintage < 1900 || vintage > 2100) throw new HttpError(400, 'Millésime invalide.');
  }

  const notes = cleanText(b.notes, 400); // facultatif

  return {
    producer,
    wine_name: cuvee || producer, // sans cuvée : on reprend le domaine
    appellation: cleanText(b.appellation, 120),
    grapes: cleanText(b.grapes, 160),
    region: cleanText(b.region, 80),
    country: COUNTRIES.includes(b.country) ? b.country : null,
    color: COLORS.includes(b.color) ? b.color : null,
    vintage,
    notes,
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Donne un numéro anonyme à toutes les bouteilles qui n'en ont pas encore :
// numéros suivant le plus grand existant, distribués au hasard entre elles.
// Les numéros déjà attribués ne changent jamais.
export async function numberMissing(tastingId) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const all = unwrap(await db().from('bottles').select('id, number').eq('tasting_id', tastingId));
    const missing = all.filter((x) => !x.number);
    if (!missing.length) return;
    let next = Math.max(0, ...all.map((x) => x.number || 0));
    let conflict = false;
    for (const x of shuffle(missing)) {
      next += 1;
      const { error } = await db()
        .from('bottles')
        .update({ number: next, serve_order: next })
        .eq('id', x.id)
        .is('number', null);
      if (error?.code === '23505') {
        conflict = true; // deux ajouts simultanés : on recommence
        break;
      }
      unwrap({ error });
    }
    if (!conflict) return;
  }
}
