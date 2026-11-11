import OrgaApp from '@/components/OrgaApp';
import OrgaConnexion from '@/components/OrgaConnexion';
import { estOrganisateur } from '@/lib/orga';

export const dynamic = 'force-dynamic';

// Sans le mot de passe organisateur, seul l'écran de connexion est envoyé : un participant ne voit rien d'autre.
export default async function Page() {
  if (!(await estOrganisateur())) return <OrgaConnexion />;
  return <OrgaApp />;
}
