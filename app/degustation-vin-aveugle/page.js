import GuidePage from '@/components/GuidePage';
import { GUIDE } from '@/lib/guide-textes';

const G = GUIDE.fr;
const IMG = { url: '/opengraph-image.jpg', width: 1200, height: 630, alt: 'La Confrérie du Pif' };

// Page publique faite pour Google : référencée (index), contrairement au reste du site.
export const metadata = {
  title: { absolute: G.metaTitre },
  description: G.metaDesc,
  alternates: {
    canonical: G.path,
    languages: { fr: GUIDE.fr.path, en: GUIDE.en.path, 'x-default': GUIDE.fr.path },
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: { type: 'article', url: G.path, title: G.titre, description: G.metaDesc, locale: 'fr_FR', siteName: 'La Confrérie du Pif', images: [IMG] },
  twitter: { card: 'summary_large_image', title: G.titre, description: G.metaDesc, images: ['/opengraph-image.jpg'] },
};

export default function Page() {
  return <GuidePage lang="fr" />;
}
