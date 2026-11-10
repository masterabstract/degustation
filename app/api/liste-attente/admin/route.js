import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { organizerPasswordOk } from '@/lib/auth';
import { PLACES_ESSAI } from '@/lib/liste-attente';

export const dynamic = 'force-dynamic';

// Liste des inscrits, réservée au propriétaire du site (mot de passe organisateur).
export const POST = route(async (req) => {
  const b = await body(req);
  const ok = organizerPasswordOk(b.password);
  if (ok === null && process.env.NODE_ENV === 'production') throw new HttpError(403, 'Aucun mot de passe organisateur n’est défini sur le site (variable ORGANIZER_PASSWORD dans Vercel).');
  if (ok === false) {
    await new Promise((r) => setTimeout(r, 700));
    throw new HttpError(403, 'Mot de passe organisateur incorrect.');
  }
  const rows = unwrap(await db().from('waitlist').select('email, prenom, groupe, created_at').order('created_at'));
  return json({ inscrits: rows.map((x, i) => ({ ...x, rang: i + 1, essai: i < PLACES_ESSAI })) });
});
