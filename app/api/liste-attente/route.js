import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body, cleanText } from '@/lib/http';
import { PLACES_ESSAI, GROUPES } from '@/lib/liste-attente';

export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,100}\.[a-z]{2,24}$/i;
const count = async () => {
  const { count: n, error } = await db().from('waitlist').select('id', { count: 'exact', head: true });
  if (error) throw new HttpError(500, 'La liste d’attente est indisponible pour le moment.');
  return n || 0;
};

// Places d'essai gratuit restantes (seul ce chiffre est public, jamais les inscrits).
export const GET = route(async () => {
  const n = await count();
  return json({ places: Math.max(0, PLACES_ESSAI - n), total: PLACES_ESSAI });
});

export const POST = route(async (req) => {
  const b = await body(req);
  const email = String(b.email || '').trim().toLowerCase();

  if (b.action === 'retirer') {
    // Droit d'effacement (RGPD) : on supprime sans dire si l'adresse était inscrite.
    if (EMAIL.test(email)) unwrap(await db().from('waitlist').delete().eq('email', email));
    return json({ ok: true });
  }

  // Anti-robots : champ invisible rempli, ou formulaire envoyé en moins de 2 secondes.
  if (b.site || (Number.isFinite(b.ouvert) && b.ouvert < 2000)) return json({ ok: true, essai: false });
  if (!EMAIL.test(email)) throw new HttpError(400, 'Adresse e-mail invalide. Vérifiez-la, par exemple : prenom@exemple.fr');
  if (b.consent !== true) throw new HttpError(400, 'Cochez la case d’accord pour que nous puissions vous écrire au lancement.');
  const groupe = GROUPES.includes(b.groupe) ? b.groupe : null;

  const avant = await count();
  const r = await db().from('waitlist').insert({ email, prenom: cleanText(b.prenom, 60), groupe }).select('created_at').single();
  if (r.error) {
    if (r.error.code === '23505') throw new HttpError(409, 'Cette adresse est déjà sur la liste d’attente : vous serez prévenu au lancement.');
    unwrap(r);
  }
  // rang réel d'inscription (gère deux inscriptions simultanées)
  const { count: rang } = await db().from('waitlist').select('id', { count: 'exact', head: true }).lte('created_at', r.data.created_at);
  const position = rang || avant + 1;
  return json({ ok: true, essai: position <= PLACES_ESSAI, places: Math.max(0, PLACES_ESSAI - position) });
});
