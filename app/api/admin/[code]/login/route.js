import crypto from 'node:crypto';
import { HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { getTasting, hashToken, setAdminCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Connexion organisateur depuis un autre appareil grâce au lien secret.
export const POST = route(async (req, { code }) => {
  const tasting = await getTasting(code);
  const { key } = await body(req);
  const h = hashToken(String(key || '').trim());
  const ok = h.length === tasting.admin_token_hash.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(tasting.admin_token_hash));
  if (!ok) throw new HttpError(403, 'Clé organisateur incorrecte.');
  await setAdminCookie(tasting.code, String(key).trim());
  return json({ ok: true });
});
