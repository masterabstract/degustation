import crypto from 'node:crypto';
import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body, cleanText } from '@/lib/http';
import { newToken, hashToken, randomCode, setAdminCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Création d'une dégustation par l'organisateur.
export const POST = route(async (req) => {
  const b = await body(req);

  const expected = process.env.ORGANIZER_PASSWORD;
  if (expected) {
    const given = String(b.password || '');
    const ok = given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    if (!ok) throw new HttpError(403, 'Mot de passe organisateur incorrect.');
  }

  const name = cleanText(b.name, 80);
  if (!name) throw new HttpError(400, 'Donnez un nom à la soirée.');
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : null;

  const adminToken = newToken();
  let tasting = null;
  for (let i = 0; i < 6 && !tasting; i++) {
    const { data, error } = await db()
      .from('tastings')
      .insert({ code: randomCode(5), name, event_date: eventDate, admin_token_hash: hashToken(adminToken) })
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
