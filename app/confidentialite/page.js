import Link from 'next/link';
import { Band } from '@/components/ui';
import Retrait from './Retrait';

export const metadata = {
  title: 'Confidentialité',
  description: 'Quelles données La Confrérie du Pif conserve, pourquoi, combien de temps, et comment les faire effacer.',
  robots: { index: true, follow: true },
};

export default function Page() {
  const contact = process.env.CONTACT_EMAIL || null; // adresse de contact facultative (variable Vercel)
  return (
    <main>
      <Band title="Confidentialité" sub="La Confrérie du Pif" back="/offre" />
      <div className="page stack legal">
        <div className="panel stack">
          <h2>En bref</h2>
          <p>Le site ne conserve que ce qui sert à faire fonctionner vos soirées et, si vous vous y inscrivez, la liste d’attente. Aucune publicité, aucun traceur publicitaire, aucune revente de données.</p>
        </div>

        <div className="panel stack">
          <h2>Les soirées de dégustation</h2>
          <p><strong>Ce qui est conservé</strong> : le nom de la soirée, les prénoms ou pseudonymes choisis par l’organisateur, les bouteilles enregistrées, les fiches de dégustation et les pronostics.</p>
          <p><strong>Pourquoi</strong> : faire fonctionner la soirée (secret des bouteilles, révélation, classements) et en garder les résultats dans les archives.</p>
          <p><strong>Combien de temps</strong> : jusqu’à ce que l’organisateur efface la soirée depuis son espace ou depuis les archives. Tout est alors supprimé définitivement.</p>
          <p><strong>Sur votre téléphone</strong> : un cookie technique vous reconnaît dans la soirée, et le téléphone garde le code de la soirée et, en cas de coupure réseau, vos réponses en attente d’envoi. Rien d’autre.</p>
        </div>

        <div className="panel stack">
          <h2>La liste d’attente</h2>
          <p><strong>Ce qui est conservé</strong> : votre adresse e-mail, et si vous les avez indiqués, votre prénom et la taille de votre groupe, avec la date de votre accord.</p>
          <p><strong>Pourquoi</strong> : vous écrire au lancement de La Confrérie du Pif et, pour les 10 premiers inscrits, organiser l’essai gratuit. Votre adresse ne sert à rien d’autre et n’est transmise à personne.</p>
          <p><strong>Base</strong> : votre consentement, donné en cochant la case du formulaire. Vous pouvez le retirer à tout moment, ci-dessous.</p>
          <p><strong>Combien de temps</strong> : jusqu’au lancement et au plus 3 ans après votre inscription, sauf si vous vous désinscrivez avant.</p>
        </div>

        <div className="panel stack" id="desinscription">
          <h2>Vous désinscrire de la liste d’attente</h2>
          <p>Indiquez l’adresse inscrite : elle est effacée immédiatement et définitivement.</p>
          <Retrait />
        </div>

        <div className="panel stack">
          <h2>Où sont les données</h2>
          <p>Le site est hébergé par Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis) et la base de données par Supabase. Seul le serveur du site accède à la base ; les téléphones ne la consultent jamais directement.</p>
        </div>

        <div className="panel stack">
          <h2>Vos droits</h2>
          <p>Vous pouvez demander l’accès à vos données, leur rectification ou leur effacement{contact ? <> en écrivant à <a href={`mailto:${contact}`}>{contact}</a></> : ' (pour la liste d’attente, avec le formulaire ci-dessus ; pour une soirée, auprès de son organisateur)'}. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).</p>
        </div>

        <p className="center small">
          <Link href="/offre">Retour à la présentation</Link>
        </p>
      </div>
    </main>
  );
}
