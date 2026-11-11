import ListeAttente from './ListeAttente';
import OrgaConnexion from '@/components/OrgaConnexion';
import { estOrganisateur } from '@/lib/orga';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Liste d’attente' };

export default async function Page() {
  if (!(await estOrganisateur())) return <OrgaConnexion retour="/orga" retourLabel="Retour" />;
  return <ListeAttente />;
}
