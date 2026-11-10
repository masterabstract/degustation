import OffrePage from '@/components/OffrePage';
import { db } from '@/lib/db';
import { PLACES_ESSAI } from '@/lib/liste-attente';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dégustation à l’aveugle entre amis',
  description:
    'La Confrérie du Pif organise vos dégustations de vin à l’aveugle : bouteilles gardées secrètes, pronostics sur téléphone, révélation vin par vin, classement et trophées. Les invités jouent gratuitement.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'La Confrérie du Pif : la dégustation à l’aveugle entre amis',
    description: 'Pronostics sur téléphone, révélation vin par vin, classement et trophées. Liste d’attente ouverte : essai gratuit pour les 10 premiers.',
  },
};

// Nombre de places d'essai restantes, calculé sur le serveur (aucun inscrit n'est révélé).
async function placesRestantes() {
  try {
    const { count, error } = await db().from('waitlist').select('id', { count: 'exact', head: true });
    if (error) return null;
    return Math.max(0, PLACES_ESSAI - (count || 0));
  } catch {
    return null;
  }
}

export default async function Page() {
  return <OffrePage places={await placesRestantes()} />;
}
