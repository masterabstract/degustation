import ParticipantApp from '@/components/ParticipantApp';

export default async function Page({ params }) {
  const { code } = await params;
  return <ParticipantApp code={code.toUpperCase()} />;
}
