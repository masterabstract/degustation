import Confidentialite from '@/components/Confidentialite';

export const metadata = {
  title: 'Confidentialité',
  description: 'Ce que La Confrérie du Pif garde, pourquoi, combien de temps, et comment le faire effacer.',
  robots: { index: true, follow: true },
  alternates: { languages: { fr: '/confidentialite', en: '/en/privacy' } },
};

export default function Page() {
  return <Confidentialite lang="fr" />;
}
