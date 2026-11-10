import OffrePage from '@/components/OffrePage';
import OffreReservee from '@/components/OffreReservee';
import { accesOffre, offrePublique } from '@/lib/acces-offre';
import { placesRestantes } from '@/lib/places';

export const dynamic = 'force-dynamic';

const META = {
  title: { absolute: 'La Confrérie du Pif: blind wine tasting with friends' },
  description: 'La Confrérie du Pif (pif is French slang for nose) helps you host blind wine tastings: secret bottles, guesses on your phone, a wine-by-wine reveal, rankings and trophies. Guests play for free.',
  alternates: { canonical: '/en/offer', languages: { fr: '/offre', en: '/en/offer' } },
  openGraph: {
    title: 'La Confrérie du Pif: blind wine tasting with friends',
    description: 'Guess on your phone, reveal wine by wine, rankings and trophies. Waiting list open: free trial for the first 10.',
    locale: 'en_GB',
  },
};

// Référencée par Google seulement une fois la page rendue publique (OFFRE_PUBLIQUE = oui).
export function generateMetadata() {
  return { ...META, robots: offrePublique() ? { index: true, follow: true } : { index: false, follow: false } };
}

export default async function Page() {
  if (!(await accesOffre())) return <OffreReservee lang="en" />;
  return <OffrePage places={await placesRestantes()} lang="en" />;
}
