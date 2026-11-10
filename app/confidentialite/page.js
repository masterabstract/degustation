import Confidentialite from '@/components/Confidentialite';
import { offrePublique } from '@/lib/acces-offre';

const META = {
  title: 'Confidentialité',
  description: 'Ce que La Confrérie du Pif garde, pourquoi, combien de temps, et comment le faire effacer.',
  alternates: { languages: { fr: '/confidentialite', en: '/en/privacy' } },
};

export function generateMetadata() {
  return { ...META, robots: offrePublique() ? { index: true, follow: true } : { index: false, follow: false } };
}

export default function Page() {
  return <Confidentialite lang="fr" />;
}
