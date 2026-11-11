import Organiser from './Organiser';
import OrgaConnexion from '@/components/OrgaConnexion';
import { estOrganisateur } from '@/lib/orga';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouvelle soirée' };

export default async function Page() {
  if (!(await estOrganisateur())) return <OrgaConnexion />;
  return <Organiser />;
}
