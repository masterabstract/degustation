import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db, unwrap, HttpError } from './db';

// Sessions : un jeton aléatoire est stocké dans un cookie "httpOnly"
// (illisible par le JavaScript de la page). En base, on ne garde que son empreinte.

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 jours
};

export const newToken = () => crypto.randomBytes(24).toString('base64url');
export const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

function sameHash(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const adminCookie = (code) => `dg_admin_${code}`;
const partCookie = (code) => `dg_part_${code}`;

export function normalizeCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export async function getTasting(code) {
  const c = normalizeCode(code);
  if (!c) throw new HttpError(404, 'Code de dégustation inconnu.');
  const t = unwrap(await db().from('tastings').select('*').eq('code', c).maybeSingle());
  if (!t) throw new HttpError(404, 'Aucune dégustation ne correspond à ce code.');
  return t;
}

export async function setAdminCookie(code, token) {
  (await cookies()).set(adminCookie(code), token, COOKIE_OPTS);
}
export async function setParticipantCookie(code, token) {
  (await cookies()).set(partCookie(code), token, COOKIE_OPTS);
}
export async function clearParticipantCookie(code) {
  (await cookies()).delete(partCookie(code));
}

export async function isAdmin(tasting) {
  const token = (await cookies()).get(adminCookie(tasting.code))?.value;
  return !!token && sameHash(hashToken(token), tasting.admin_token_hash);
}

export async function requireAdmin(code) {
  const tasting = await getTasting(code);
  if (!(await isAdmin(tasting))) throw new HttpError(401, 'Accès organisateur requis.');
  return tasting;
}

export async function getParticipant(tasting) {
  const token = (await cookies()).get(partCookie(tasting.code))?.value;
  if (!token) return null;
  const p = unwrap(
    await db()
      .from('participants')
      .select('id, name, hors_concours')
      .eq('tasting_id', tasting.id)
      .eq('token_hash', hashToken(token))
      .maybeSingle()
  );
  return p || null;
}

export async function requireParticipant(code) {
  const tasting = await getTasting(code);
  const me = await getParticipant(tasting);
  if (!me) throw new HttpError(401, 'Rejoignez d’abord la dégustation.');
  return { tasting, me };
}

// Code d'accès lisible : pas de 0/O ni de 1/I pour éviter les confusions.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function randomCode(len = 5) {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
