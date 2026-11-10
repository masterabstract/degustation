// Appli de l'organisateur : installable sur l'écran d'accueil du téléphone (plein écran).
// Seule cette partie du site propose l'installation ; les participants utilisent le site normal.
export const metadata = {
  title: 'Appli organisateur',
  manifest: '/orga.webmanifest',
  applicationName: 'Confrérie Orga',
  appleWebApp: { capable: true, title: 'Confrérie Orga', statusBarStyle: 'black' },
  // anciens iPhone : balise historique en plus du manifeste
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export default function OrgaLayout({ children }) {
  return children;
}
