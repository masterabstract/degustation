import OffrePage from '@/components/OffrePage';
import OffreReservee from '@/components/OffreReservee';
import { accesOffre, offrePublique } from '@/lib/acces-offre';
import { placesRestantes } from '@/lib/places';

export const dynamic = 'force-dynamic';

const META = {
  title: 'Dégustation à l’aveugle entre amis',
  description:
    'La Confrérie du Pif vous aide à organiser vos dégustations de vin à l’aveugle : bouteilles gardées secrètes, pronostics sur téléphone, révélation vin par vin, classement et trophées. Les invités jouent gratuitement.',
  alternates: { canonical: '/offre', languages: { fr: '/offre', en: '/en/offer' } },
  openGraph: {
    title: 'La Confrérie du Pif : la dégustation à l’aveugle entre amis',
    description: 'Pronostics sur téléphone, révélation vin par vin, classement et trophées. Liste d’attente ouverte : essai gratuit pour les 10 premiers.',
  },
};

// Référencée par Google seulement une fois la page rendue publique (OFFRE_PUBLIQUE = oui).
export function generateMetadata() {
  return { ...META, robots: offrePublique() ? { index: true, follow: true } : { index: false, follow: false } };
}

export default async function Page() {
  if (!(await accesOffre())) return <OffreReservee lang="fr" />;
  return <OffrePage places={await placesRestantes()} lang="fr" />;
}
