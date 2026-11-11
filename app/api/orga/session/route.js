import { HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { organizerPasswordOk } from '@/lib/auth';
import { estOrganisateur, ouvrirSessionOrga, fermerSessionOrga } from '@/lib/orga';

export const dynamic = 'force-dynamic';

// Cet appareil est-il celui de l'organisateur ?
export const GET = route(async () => json({ organisateur: await estOrganisateur() }));

// Connexion avec le mot de passe organisateur (gardée 30 jours sur l'appareil).
export const POST = route(async (req) => {
  const { password } = await body(req);
  const ok = organizerPasswordOk(password);
  if (ok === null) throw new HttpError(403, 'Aucun mot de passe organisateur n’est défini sur le site (variable ORGANIZER_PASSWORD dans Vercel).');
  if (!ok) {
    await new Promise((r) => setTimeout(r, 700)); // freine les essais au hasard
    throw new HttpError(403, 'Mot de passe organisateur incorrect.');
  }
  await ouvrirSessionOrga();
  return json({ organisateur: true });
});

// Déconnexion de cet appareil.
export const DELETE = route(async () => {
  await fermerSessionOrga();
  return json({ organisateur: false });
});
