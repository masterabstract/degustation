import SheetPage from '@/components/SheetPage';

export default async function Page({ params }) {
  const { code, n } = await params;
  return <SheetPage code={code.toUpperCase()} number={parseInt(n, 10)} />;
}
