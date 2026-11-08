import 'server-only';
import { db, unwrap, HttpError } from './db';
import { cleanText } from './http';
import { COLORS, COUNTRIES } from './constants';
import { knownCountries } from './appellations';

// Colonnes SECRÈTES d'une bouteille (visibles uniquement par son propriétaire
// avant la révélation, puis par tous après).
export const SECRET_COLS = 'producer, wine_name, appellation, accepted_names, grapes, grape_mix, region, subregion, zone, country, color, vintage, notes';

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

  // Pays obligatoire : il détermine le barème (20 points si France, 23 sinon).
  const country = COUNTRIES.includes(b.country) ? b.country : null;
  if (!country) throw new HttpError(400, 'Indiquez le pays du vin.');

  // Cépages : au moins un. Pour un assemblage, les pourcentages doivent faire 100 %,
  // ou être tous laissés vides (le barème compte alors des parts égales).
  const rows = (Array.isArray(b.grape_mix) ? b.grape_mix : [])
    .map((g) => ({ name: cleanText(g?.name, 60), pct: g?.pct === '' || g?.pct === null || g?.pct === undefined ? null : Number(String(g.pct).replace(',', '.')) }))
    .filter((g) => g.name);
  if (!rows.length) throw new HttpError(400, 'Indiquez au moins un cépage.');
  if (rows.length > 12) throw new HttpError(400, '12 cépages au maximum.');
  if (rows.some((g) => g.pct !== null && (Number.isNaN(g.pct) || g.pct <= 0 || g.pct > 100))) throw new HttpError(400, 'Chaque pourcentage doit être compris entre 1 et 100.');
  let grape_mix;
  if (rows.length === 1) grape_mix = [{ name: rows[0].name, pct: 100 }];
  else if (rows.every((g) => g.pct === null)) grape_mix = rows.map((g) => ({ name: g.name, pct: null }));
  else {
    if (rows.some((g) => g.pct === null)) throw new HttpError(400, 'Indiquez le pourcentage de chaque cépage, ou laissez-les tous vides.');
    const sum = Math.round(rows.reduce((a, g) => a + g.pct, 0) * 10) / 10;
    if (sum !== 100) throw new HttpError(400, `Les pourcentages des cépages font ${String(sum).replace('.', ',')} % au lieu de 100 %.`);
    grape_mix = rows.map((g) => ({ name: g.name, pct: Math.round(g.pct * 10) / 10 }));
  }
  const grapes = grape_mix.map((g) => (g.pct && grape_mix.length > 1 ? `${g.name} ${String(g.pct).replace('.', ',')} %` : g.name)).join(', ');
  const french = country === 'France';
  // Vin français : la région rapporte 3 points à elle seule, elle doit donc être renseignée
  // (même pour un Vin de France, dont la région ne se déduit pas de l'appellation).
  if (french && !cleanText(b.region, 80)) throw new HttpError(400, 'Indiquez la région viticole de ce vin français (elle rapporte 3 points aux dégustateurs), même pour un Vin de France.');

  // Cohérence : une appellation ou une région connue d'un autre pays seulement est sûrement une erreur
  // (ex. « Bourgogne » pour un vin italien). Les noms inconnus de notre base restent acceptés.
  for (const [kind, label] of [['appellation', 'L’appellation'], ['region', 'La région']]) {
    const v = cleanText(b[kind], 120);
    const where = v && country !== 'Autre pays' ? knownCountries(kind, v) : null;
    const alsoHere = (knownCountries('appellation', v)?.has(country)) || (knownCountries('region', v)?.has(country));
    if (where && !where.has(country) && !alsoHere) throw new HttpError(400, `${label} « ${v} » appartient à : ${[...where].join(', ')}, pas à : ${country}. Vérifiez le pays ou la ${kind === 'region' ? 'région' : 'l’appellation'}.`.replace('la l’appellation', 'l’appellation'));
  }

  return {
    producer,
    wine_name: cuvee || producer, // sans cuvée : on reprend le domaine
    appellation: cleanText(b.appellation, 120),
    accepted_names: cleanText(b.accepted_names, 300),
    grapes,
    grape_mix,
    region: cleanText(b.region, 80),
    subregion: french ? null : cleanText(b.subregion, 80),
    zone: french ? null : cleanText(b.zone, 80),
    country,
    color: COLORS.includes(b.color) ? b.color : null,
    vintage,
    notes,
  };
}

// Une bouteille ne peut plus être modifiée ni retirée par son propriétaire dès
// qu'un participant l'a notée ou a fait un pronostic dessus : les bonnes réponses
// doivent être fixées avant que le jeu commence sur ce vin.
export async function bottleInPlay(bottleId) {
  const [r, p] = await Promise.all([
    db().from('ratings').select('id').eq('bottle_id', bottleId).limit(1),
    db().from('predictions').select('id').eq('bottle_id', bottleId).limit(1),
  ]);
  return unwrap(r).length > 0 || unwrap(p).length > 0;
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
