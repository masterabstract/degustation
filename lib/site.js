// Adresse publique du site, utilisée pour Google (sitemap, adresses canoniques, aperçus de liens).
// Ordre de priorité : la variable Vercel SITE_URL (votre nom de domaine, si vous en prenez un),
// puis l'adresse de production fournie par Vercel, puis l'adresse locale.
export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  'http://localhost:3000'
).replace(/\/+$/, '');
