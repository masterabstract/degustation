import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource-variable/manrope/wght.css';
import './globals.css';
import { SITE_URL } from '@/lib/site';

// Code de vérification Google Search Console (variable Vercel GOOGLE_SITE_VERIFICATION, facultative).
const GOOGLE = process.env.GOOGLE_SITE_VERIFICATION;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'La Confrérie du Pif', template: '%s · La Confrérie du Pif' },
  description: 'Dégustations à l’aveugle entre amis : fiches, pronostics, révélation et palmarès.',
  applicationName: 'La Confrérie du Pif',
  appleWebApp: { title: 'Confrérie du Pif' },
  // Par défaut, rien n'est référencé : seules l'accueil et le guide l'autorisent explicitement.
  robots: { index: false, follow: false },
  ...(GOOGLE ? { verification: { google: GOOGLE } } : {}),
  openGraph: { title: 'La Confrérie du Pif', description: 'Dégustation à l’aveugle entre amis : rejoignez la soirée.', locale: 'fr_FR', type: 'website' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4a0e1e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
