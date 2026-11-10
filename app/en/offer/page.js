import OffrePage from '@/components/OffrePage';
import { placesRestantes } from '@/lib/places';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: { absolute: 'La Confrérie du Pif: blind wine tasting with friends' },
  description: 'La Confrérie du Pif (pif is French slang for nose) helps you host blind wine tastings: secret bottles, guesses on your phone, a wine-by-wine reveal, rankings and trophies. Guests play for free.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/en/offer', languages: { fr: '/offre', en: '/en/offer' } },
  openGraph: {
    title: 'La Confrérie du Pif: blind wine tasting with friends',
    description: 'Guess on your phone, reveal wine by wine, rankings and trophies. Waiting list open: free trial for the first 10.',
    locale: 'en_GB',
  },
};

export default async function Page() {
  return <OffrePage places={await placesRestantes()} lang="en" />;
}
