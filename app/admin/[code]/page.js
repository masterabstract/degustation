import AdminApp from '@/components/AdminApp';

export const metadata = { title: 'Espace organisateur' };

export default async function Page({ params }) {
  const { code } = await params;
  return <AdminApp code={code.toUpperCase()} />;
}
