import ResultsPage from '@/components/ResultsPage';

export const metadata = { title: 'Résultats de la dégustation' };

export default async function Page({ params }) {
  const { code } = await params;
  return <ResultsPage code={code.toUpperCase()} />;
}
