import Confidentialite from '@/components/Confidentialite';

export const metadata = {
  title: { absolute: 'Privacy · La Confrérie du Pif' },
  description: 'What La Confrérie du Pif keeps, why, for how long, and how to have it deleted.',
  robots: { index: true, follow: true },
  alternates: { languages: { fr: '/confidentialite', en: '/en/privacy' } },
};

export default function Page() {
  return <Confidentialite lang="en" />;
}
