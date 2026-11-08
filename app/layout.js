import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource-variable/manrope/wght.css';
import './globals.css';

// Adresse publique du site (pour l'aperçu du lien envoyé par WhatsApp ou SMS). Sur Vercel,
// elle est fournie automatiquement ; en local, on utilise localhost.
const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'La Confrérie du Pif', template: '%s · La Confrérie du Pif' },
  description: 'Dégustations à l’aveugle entre amis : fiches, pronostics, révélation et palmarès.',
  applicationName: 'La Confrérie du Pif',
  appleWebApp: { title: 'Confrérie du Pif' },
  robots: { index: false, follow: false },
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
