import 'server-only';
import { NextResponse } from 'next/server';
import { HttpError } from './db';

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Enveloppe chaque route : transforme les erreurs en messages JSON lisibles.
export function route(fn) {
  return async (req, ctx) => {
    try {
      const params = ctx?.params ? await ctx.params : {};
      return await fn(req, params);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: 'Erreur inattendue du serveur. Réessayez dans un instant.' }, 500);
    }
  };
}

export async function body(req) {
  // Protection contre les requêtes forgées depuis un autre site : un formulaire
  // extérieur ne peut pas envoyer de JSON. On refuse donc tout autre format.
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new HttpError(415, 'Requête invalide.');
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, 'Requête invalide.');
  }
}

export function cleanText(v, max = 120) {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/\s+/g, ' ').trim().slice(0, max);
  return s || null;
}
