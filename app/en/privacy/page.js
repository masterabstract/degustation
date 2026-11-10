import Confidentialite from '@/components/Confidentialite';
import { offrePublique } from '@/lib/acces-offre';

const META = {
  title: { absolute: 'Privacy · La Confrérie du Pif' },
  description: 'What La Confrérie du Pif keeps, why, for how long, and how to have it deleted.',
  alternates: { languages: { fr: '/confidentialite', en: '/en/privacy' } },
};

export function generateMetadata() {
  return { ...META, robots: offrePublique() ? { index: true, follow: true } : { index: false, follow: false } };
}

export default function Page() {
  return <Confidentialite lang="en" />;
}
