import Accueil from './Accueil';

// Accueil : les participants y entrent le code de la soirée.
// Référencé par Google (recherche « La Confrérie du Pif »), avec un lien vers le guide.
export const metadata = {
  title: { absolute: 'La Confrérie du Pif · Dégustation de vin à l’aveugle entre amis' },
  description: 'Rejoignez une dégustation de vin à l’aveugle avec le code de la soirée : fiches, pronostics, révélation et palmarès. Et notre guide pour organiser la vôtre.',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <Accueil />;
}
