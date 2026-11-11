import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
import { hashToken } from './auth';
import { estOrganisateur, ouvrirSessionOrga } from './orga';

// Page de vente réservée aux organisateurs tant qu'elle n'est pas publique.
// Pour l'ouvrir à tous au lancement : variable Vercel OFFRE_PUBLIQUE = oui.
export const offrePublique = () => process.env.OFFRE_PUBLIQUE === 'oui';

// Le mot de passe organisateur donne aussi accès à la page de vente (voir lib/orga.js).
export const donnerAccesOffre = ouvrirSessionOrga;

/** Vrai si ce visiteur peut voir la page de vente : page publique, mot de passe organisateur déjà donné, ou organisateur d'une soirée. */
export async function accesOffre() {
  if (offrePublique()) return true;
  if (await estOrganisateur()) return true;
  const jar = await cookies();
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
