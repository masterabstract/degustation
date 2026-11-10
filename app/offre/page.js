import OffrePage from '@/components/OffrePage';
import { placesRestantes } from '@/lib/places';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dégustation à l’aveugle entre amis',
  description:
    'La Confrérie du Pif vous aide à organiser vos dégustations de vin à l’aveugle : bouteilles gardées secrètes, pronostics sur téléphone, révélation vin par vin, classement et trophées. Les invités jouent gratuitement.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/offre', languages: { fr: '/offre', en: '/en/offer' } },
  openGraph: {
    title: 'La Confrérie du Pif : la dégustation à l’aveugle entre amis',
    description: 'Pronostics sur téléphone, révélation vin par vin, classement et trophées. Liste d’attente ouverte : essai gratuit pour les 10 premiers.',
  },
};

export default async function Page() {
  return <OffrePage places={await placesRestantes()} lang="fr" />;
}
