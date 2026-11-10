import Link from 'next/link';
import { Band } from './ui';
import Retrait from '@/app/confidentialite/Retrait';

// Politique de confidentialité, courte et claire, en français et en anglais.
const TX = {
  fr: {
    titre: 'Confidentialité',
    retour: ['/offre', 'Retour à la présentation'],
    autre: ['/en/privacy', 'en', 'English version'],
    bref: 'Nous gardons le strict nécessaire, le temps nécessaire. Pas de publicité, pas de traceurs, rien n’est vendu ni partagé.',
    donnees: 'Ce que nous gardons',
    blocs: [
      {
        nom: 'Vos soirées',
        quoi: 'Les prénoms ou pseudos des participants, les bouteilles, les fiches de dégustation et les pronostics.',
        pourquoi: 'Faire fonctionner la soirée et afficher ses résultats.',
        duree: 'Jusqu’à ce que l’organisateur efface la soirée. Soirée d’essai : tout est effacé une semaine après.',
      },
      {
        nom: 'La liste d’attente',
        quoi: 'Votre e-mail et, si vous les donnez, votre prénom et la taille de votre groupe.',
        pourquoi: 'Vous prévenir du lancement. Pour les 10 testeurs : organiser l’essai, puis vous envoyer un court questionnaire de satisfaction pour recueillir votre avis.',
        duree: 'Jusqu’au lancement (3 ans au plus), ou jusqu’à votre désinscription.',
      },
      {
        nom: 'Sur votre téléphone',
        quoi: 'Un cookie technique, le code de la soirée et, sans réseau, vos réponses en attente d’envoi.',
        pourquoi: 'Vous reconnaître dans la soirée et ne rien perdre en cas de coupure.',
        duree: 'Jusqu’à ce que vous quittiez la soirée ou vidiez votre navigateur.',
      },
    ],
    labels: { quoi: 'Quoi', pourquoi: 'Pourquoi', duree: 'Combien de temps' },
    questionnaire: 'Le questionnaire est facultatif : vos réponses servent uniquement à améliorer La Confrérie du Pif.',
    base: 'Base légale : votre consentement pour la liste d’attente et le questionnaire ; le service demandé pour les soirées.',
    hebergeTitre: 'Où sont les données',
    heberge: 'Le site est hébergé par Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis), la base de données par Supabase. Les téléphones ne lisent jamais la base directement.',
    droitsTitre: 'Vos droits',
    droits: (c) => (c ? <>Accès, rectification, effacement : écrivez à <a href={`mailto:${c}`}>{c}</a>. Vous pouvez aussi saisir la CNIL (cnil.fr).</> : <>Accès, rectification, effacement : pour la liste d’attente, utilisez le formulaire ci-dessous ; pour une soirée, adressez-vous à son organisateur. Vous pouvez aussi saisir la CNIL (cnil.fr).</>),
    retraitTitre: 'Quitter la liste d’attente',
    retraitTxt: 'Votre adresse est effacée immédiatement et définitivement.',
  },
  en: {
    titre: 'Privacy',
    retour: ['/en/offer', 'Back to the presentation'],
    autre: ['/confidentialite', 'fr', 'Version française'],
    bref: 'We keep only what’s needed, for only as long as it’s needed. No advertising, no trackers, nothing sold or shared.',
    donnees: 'What we keep',
    blocs: [
      {
        nom: 'Your evenings',
        quoi: 'Participants’ first names or nicknames, the bottles, tasting notes and guesses.',
        pourquoi: 'To run the evening and show its results.',
        duree: 'Until the host deletes the evening. Trial evening: everything is deleted one week later.',
      },
      {
        nom: 'The waiting list',
        quoi: 'Your email and, if you give them, your first name and group size.',
        pourquoi: 'To tell you when we launch. For the 10 testers: to set up the trial, then send you a short satisfaction survey to hear your feedback.',
        duree: 'Until launch (3 years at most), or until you unsubscribe.',
      },
      {
        nom: 'On your phone',
        quoi: 'A technical cookie, the evening’s code and, without signal, your answers waiting to be sent.',
        pourquoi: 'To recognise you in the evening and lose nothing if the connection drops.',
        duree: 'Until you leave the evening or clear your browser.',
      },
    ],
    labels: { quoi: 'What', pourquoi: 'Why', duree: 'How long' },
    questionnaire: 'The survey is optional: your answers are used only to improve La Confrérie du Pif.',
    base: 'Legal basis: your consent for the waiting list and the survey; the service you asked for, for evenings.',
    hebergeTitre: 'Where the data is',
    heberge: 'The site is hosted by Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA), the database by Supabase. Phones never read the database directly.',
    droitsTitre: 'Your rights',
    droits: (c) => (c ? <>Access, correction, deletion: write to <a href={`mailto:${c}`}>{c}</a>. You can also contact the CNIL, the French data protection authority (cnil.fr).</> : <>Access, correction, deletion: for the waiting list, use the form below; for an evening, ask its host. You can also contact the CNIL, the French data protection authority (cnil.fr).</>),
    retraitTitre: 'Leave the waiting list',
    retraitTxt: 'Your address is deleted immediately and permanently.',
  },
};

export default function Confidentialite({ lang = 'fr' }) {
  const t = TX[lang] || TX.fr;
  const contact = process.env.CONTACT_EMAIL || null; // adresse de contact facultative (variable Vercel)
  return (
    <main lang={lang}>
      <Band title={t.titre} sub="La Confrérie du Pif" back={t.retour[0]} />
      <div className="page stack legal">
        <p className="legal-bref">{t.bref}</p>

        <h2 className="h2">{t.donnees}</h2>
        {t.blocs.map((b) => (
          <section key={b.nom} className="panel legal-bloc">
            <h3>{b.nom}</h3>
            <dl>
              <dt>{t.labels.quoi}</dt>
              <dd>{b.quoi}</dd>
              <dt>{t.labels.pourquoi}</dt>
              <dd>{b.pourquoi}</dd>
              <dt>{t.labels.duree}</dt>
              <dd>{b.duree}</dd>
            </dl>
          </section>
        ))}
        <p className="small muted">
          {t.questionnaire} {t.base}
        </p>

        <section className="panel stack">
          <h3>{t.hebergeTitre}</h3>
          <p>{t.heberge}</p>
        </section>

        <section className="panel stack">
          <h3>{t.droitsTitre}</h3>
          <p>{t.droits(contact)}</p>
        </section>

        <section className="panel stack" id={lang === 'en' ? 'unsubscribe' : 'desinscription'}>
          <h3>{t.retraitTitre}</h3>
          <p>{t.retraitTxt}</p>
          <Retrait lang={lang} />
        </section>

        <p className="center small">
          <Link href={t.retour[0]}>{t.retour[1]}</Link>
          <Link style={{ marginLeft: 18 }} href={t.autre[0]} hrefLang={t.autre[1]}>
            {t.autre[2]}
          </Link>
        </p>
      </div>
    </main>
  );
}
