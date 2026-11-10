import { cookies } from 'next/headers';
import { route, json } from '@/lib/http';
import { requireAdmin, adminCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Lien organisateur de la soirée, pour l'ouvrir dans l'appli organisateur ou sur un autre appareil.
// Réservé à l'organisateur déjà connecté : le lien est reconstitué à partir de sa propre clé.
export const GET = route(async (req, { code }) => {
  const tasting = await requireAdmin(code);
  const key = (await cookies()).get(adminCookie(tasting.code))?.value;
  const origin = new URL(req.url).origin;
  return json({ url: `${origin}/admin/${tasting.code}?cle=${encodeURIComponent(key)}` });
});
