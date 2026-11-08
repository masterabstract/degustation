import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource-variable/manrope/wght.css';
import './globals.css';

export const metadata = {
  title: { default: 'La Confrérie du Pif', template: '%s · La Confrérie du Pif' },
  description: 'Dégustations à l’aveugle entre amis : fiches, pronostics, révélation et palmarès.',
  applicationName: 'La Confrérie du Pif',
  appleWebApp: { title: 'Confrérie du Pif' },
  robots: { index: false, follow: false },
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
