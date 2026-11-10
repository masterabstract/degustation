import { HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { organizerPasswordOk } from '@/lib/auth';
import { donnerAccesOffre } from '@/lib/acces-offre';

export const dynamic = 'force-dynamic';

// Donne accès à la page de vente (non publique pour l'instant) avec le mot de passe organisateur.
export const POST = route(async (req) => {
  const b = await body(req);
  const en = b.lang === 'en';
  const ok = organizerPasswordOk(b.password);
  if (ok !== true) {
    await new Promise((r) => setTimeout(r, 700));
    throw new HttpError(403, en ? 'Wrong organizer password.' : 'Mot de passe organisateur incorrect.');
  }
  await donnerAccesOffre();
  return json({ ok: true });
});
