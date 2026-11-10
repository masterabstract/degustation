import 'server-only';
import { db } from './db';
import { PLACES_ESSAI } from './liste-attente';

// Nombre de places d'essai restantes, calculé sur le serveur (aucun inscrit n'est révélé).
export async function placesRestantes() {
  try {
    const { count, error } = await db().from('waitlist').select('id', { count: 'exact', head: true });
    if (error) return null;
    return Math.max(0, PLACES_ESSAI - (count || 0));
  } catch {
    return null;
  }
}
