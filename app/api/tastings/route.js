import { estOrganisateur, ouvrirSessionOrga } from '@/lib/orga';
import { codeVin } from '@/lib/codes-vin';
import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body, cleanText } from '@/lib/http';
import { newToken, hashToken, setAdminCookie, organizerPasswordOk } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Création d'une dégustation par l'organisateur.
export const POST = route(async (req) => {
  const b = await body(req);

  // L'espace organisateur est réservé : le mot de passe ORGANIZER_PASSWORD est exigé.
  // (Sans mot de passe défini, la création n'est permise qu'en local, jamais sur le site en ligne.)
  // Déjà connecté avec le mot de passe sur cet appareil : inutile de le redonner.
  const ok = (await estOrganisateur()) ? true : organizerPasswordOk(b.password);
  if (ok === null && process.env.NODE_ENV === 'production') throw new HttpError(403, 'Aucun mot de passe organisateur n’est défini sur le site (variable ORGANIZER_PASSWORD dans Vercel) : la création de soirée est désactivée.');
  if (ok === false) {
    await new Promise((r) => setTimeout(r, 700)); // freine les essais au hasard
    throw new HttpError(403, 'Mot de passe organisateur incorrect.');
  }
  if (ok === true) await ouvrirSessionOrga(); // appareil reconnu comme celui de l'organisateur (30 jours)
  if (b.check === true) return json({ ok: true }); // simple vérification avant d'afficher le formulaire

  const name = cleanText(b.name, 80);
  if (!name) throw new HttpError(400, 'Donnez un nom à la soirée.');
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : null;

  const adminToken = newToken();
  let tasting = null;
  for (let i = 0; i < 25 && !tasting; i++) {
    const { data, error } = await db()
      .from('tastings')
      .insert({ code: codeVin(), name, event_date: eventDate, admin_token_hash: hashToken(adminToken) })
      .select('id, code')
      .single();
    if (!error) tasting = data;
    else if (error.code !== '23505') unwrap({ error }, 'Impossible de créer la dégustation.');
  }
  if (!tasting) throw new HttpError(500, 'Impossible de générer un code unique, réessayez.');

  // Participants saisis dès la création (facultatif).
  const names = [...new Set((Array.isArray(b.participants) ? b.participants : []).map((n) => cleanText(n, 40)).filter(Boolean))].slice(0, 40);
  if (names.length) {
    unwrap(await db().from('participants').insert(names.map((n) => ({ tasting_id: tasting.id, name: n }))), 'Participants non enregistrés.');
  }

  await setAdminCookie(tasting.code, adminToken);
  return json({ code: tasting.code, adminKey: adminToken });
});
