import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource-variable/manrope/wght.css';
import './globals.css';

export const metadata = {
  title: 'Dégustation à l’aveugle',
  description: 'Fiches de dégustation, pronostics et révélation finale.',
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
