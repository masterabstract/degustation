import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Client Supabase utilisé UNIQUEMENT sur le serveur.
// La clé secrète ne quitte jamais Vercel : elle n'est pas préfixée NEXT_PUBLIC_,
// donc Next.js refuse de l'inclure dans le code envoyé aux téléphones.
let client;

export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error('Configuration manquante : SUPABASE_URL et SUPABASE_SECRET_KEY doivent être définies.');
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

// Petite aide : renvoie les données ou lève une erreur lisible.
export function unwrap({ data, error }, message = 'Erreur de base de données') {
  if (error) {
    console.error(message, error);
    throw new HttpError(500, message);
  }
  return data;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
