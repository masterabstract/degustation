import { SITE_URL } from '@/lib/site';
import { GUIDE } from '@/lib/guide-textes';
import { DATE_GUIDE } from '@/components/GuidePage';

// Plan du site pour Google (adresse : /sitemap.xml).
// Seules les pages publiques y figurent. La page de vente et la confidentialité
// n'y entrent qu'une fois la page de vente ouverte à tous (variable OFFRE_PUBLIQUE = oui).
export const dynamic = 'force-dynamic';

export default function sitemap() {
  const u = (p) => `${SITE_URL}${p}`;
  const guideLangs = { languages: { fr: u(GUIDE.fr.path), en: u(GUIDE.en.path) } };
  const pages = [
    { url: u('/'), changeFrequency: 'monthly', priority: 0.6 },
    { url: u(GUIDE.fr.path), lastModified: DATE_GUIDE, changeFrequency: 'monthly', priority: 1, alternates: guideLangs },
    { url: u(GUIDE.en.path), lastModified: DATE_GUIDE, changeFrequency: 'monthly', priority: 0.8, alternates: guideLangs },
  ];
  if (process.env.OFFRE_PUBLIQUE === 'oui') {
    const offre = { languages: { fr: u('/offre'), en: u('/en/offer') } };
    const priv = { languages: { fr: u('/confidentialite'), en: u('/en/privacy') } };
    pages.push(
      { url: u('/offre'), changeFrequency: 'weekly', priority: 0.9, alternates: offre },
      { url: u('/en/offer'), changeFrequency: 'weekly', priority: 0.7, alternates: offre },
      { url: u('/confidentialite'), changeFrequency: 'yearly', priority: 0.2, alternates: priv },
      { url: u('/en/privacy'), changeFrequency: 'yearly', priority: 0.2, alternates: priv },
    );
  }
  return pages;
}
