import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

// Session organisateur : une fois le mot de passe organisateur (variable ORGANIZER_PASSWORD)
// donné sur un appareil, un cookie « httpOnly » l'y garde 30 jours. Il ouvre l'appli organisateur,
// toutes les soirées et la page de vente. Un participant, sans ce mot de passe, n'y a jamais accès.
// Changer le mot de passe dans Vercel déconnecte tous les appareils.
const COOKIE = 'dg_orga';
const OPTS = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 };

function jeton() {
  const pw = process.env.ORGANIZER_PASSWORD;
  return pw ? crypto.createHash('sha256').update(`offre:${pw}`).digest('hex') : null;
}

export async function estOrganisateur() {
  const j = jeton();
  const c = (await cookies()).get(COOKIE)?.value;
  return !!(j && c && c.length === j.length && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(j)));
}

export async function ouvrirSessionOrga() {
  const j = jeton();
  if (j) (await cookies()).set(COOKIE, j, OPTS);
}

export async function fermerSessionOrga() {
  (await cookies()).delete(COOKIE);
}
