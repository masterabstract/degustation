import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
import { hashToken } from './auth';

// Page de vente réservée aux organisateurs tant qu'elle n'est pas publique.
// Pour l'ouvrir à tous au lancement : variable Vercel OFFRE_PUBLIQUE = oui.
export const offrePublique = () => process.env.OFFRE_PUBLIQUE === 'oui';

const COOKIE = 'dg_orga';
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 };

// Jeton dérivé du mot de passe organisateur : changer le mot de passe retire tous les accès.
function jeton() {
  const pw = process.env.ORGANIZER_PASSWORD;
  return pw ? crypto.createHash('sha256').update(`offre:${pw}`).digest('hex') : null;
}

export async function donnerAccesOffre() {
  const j = jeton();
  if (j) (await cookies()).set(COOKIE, j, COOKIE_OPTS);
}

/** Vrai si ce visiteur peut voir la page de vente : page publique, mot de passe organisateur déjà donné, ou organisateur d'une soirée. */
export async function accesOffre() {
  if (offrePublique()) return true;
  const jar = await cookies();
  const j = jeton();
  const c = jar.get(COOKIE)?.value;
  if (j && c && c.length === j.length && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(j))) return true;
  // organisateur connecté à au moins une soirée sur cet appareil
  const admins = jar.getAll().filter((x) => x.name.startsWith('dg_admin_')).slice(0, 5);
  for (const a of admins) {
    try {
      const { data } = await db().from('tastings').select('admin_token_hash').eq('code', a.name.slice(9)).maybeSingle();
      const h = hashToken(a.value);
      if (data?.admin_token_hash && h.length === data.admin_token_hash.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(data.admin_token_hash))) return true;
    } catch {}
  }
  return false;
}
