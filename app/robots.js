import { SITE_URL } from '@/lib/site';

// Consignes pour les robots des moteurs de recherche (adresse : /robots.txt).
// Les soirées, les espaces organisateur et les archives ne doivent jamais être explorés.
export const dynamic = 'force-dynamic';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/t/', '/admin/', '/orga', '/organiser', '/archives'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
