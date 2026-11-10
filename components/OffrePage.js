'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PLACES_ESSAI, GROUPES, TARIFS, prix } from '@/lib/liste-attente';

// Page de vente de La Confrérie du Pif.
// Élément signature : les 10 capsules numérotées, une par place d'essai gratuit.

function Places({ places, large = false }) {
  const prises = places === null ? 0 : PLACES_ESSAI - places;
  return (
    <div className={`of-places${large ? ' large' : ''}`}>
      <div className="of-capsules" role="img" aria-label={places === null ? `${PLACES_ESSAI} places d’essai gratuit` : `${places} places d’essai gratuit restantes sur ${PLACES_ESSAI}`}>
        {Array.from({ length: PLACES_ESSAI }, (_, i) => (
          <span key={i} className={`of-cap${i < prises ? ' prise' : ''}`} style={{ '--i': i }}>
            {i + 1}
          </span>
        ))}
      </div>
      <p className="of-places-txt">
        {places === null
          ? `Essai gratuit pour les ${PLACES_ESSAI} premiers inscrits.`
          : places > 0
            ? `Essai gratuit pour les ${PLACES_ESSAI} premiers inscrits : ${places > 1 ? `il reste ${places} places` : 'il reste une place'}.`
            : `Les ${PLACES_ESSAI} places d’essai gratuit sont prises. Inscrivez-vous pour être prévenu du lancement.`}
      </p>
    </div>
  );
}

function Phone({ src, alt, priority }) {
  return (
    <div className="of-phone">
      <img src={src} alt={alt} width={780} height={1328} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />
    </div>
  );
}

const ETAPES = [
  ['Créez la soirée', 'Donnez-lui un nom et ajoutez les prénoms. Vos invités la rejoignent avec un QR code ou un code de 5 caractères.'],
  ['Chacun cache sa bouteille', 'Chaque invité enregistre sa bouteille sur son téléphone. Personne ne la voit, pas même vous : le site lui attribue un numéro à coller sur la bouteille.'],
  ['On déguste, on pronostique', 'Pays, région, appellation, cépages, millésime : les listes se resserrent à chaque réponse, carte des régions viticoles à l’appui.'],
  ['La révélation', 'Vin par vin, la bouteille apparaît sur tous les téléphones avec les points de chacun. À la fin : podium, trophées et palmarès.'],
];

const ATOUTS = [
  ['Les bouteilles restent secrètes', 'Leur contenu ne quitte le serveur qu’à la révélation. Impossible de tricher en fouillant son téléphone.'],
  ['Un barème juste, expliqué point par point', 'Vins français sur 20 points, vins étrangers sur 23. Le calcul est le même pour tous et chacun voit le détail de ses points.'],
  ['Les cartes des régions viticoles', 'Les contours officiels des appellations, pays par pays : on pronostique en touchant la carte.'],
  ['Une aide qui connaît le vin', 'Tapez Barolo et le Nebbiolo vous est proposé. Choisissez la Rioja et seules ses appellations s’affichent.'],
  ['Même sans réseau', 'Dans une cave sans 4G, les fiches restent sur le téléphone et partent dès que la connexion revient.'],
  ['Rien à installer pour les invités', 'Un lien suffit, sur iPhone comme sur Android. L’organisateur a son appli, installée depuis le site.'],
  ['Les trophées de la confrérie', 'Le Pif d’or, le GPS du terroir, le Nez fin, la Lanterne rouge… de quoi animer la fin de soirée.'],
  ['Le palmarès, soirée après soirée', 'Chaque dégustation est archivée : résultats, commentaires et classement général de votre confrérie.'],
];

const INCLUS = ['Soirées illimitées', 'Invités gratuits, sans compte ni téléchargement', 'Révélation vin par vin, classements et trophées', 'Archives et palmarès de votre confrérie', 'Appli organisateur sur votre téléphone'];

const FAQ = [
  ['Mes invités doivent-ils installer une application ?', 'Non. Ils ouvrent le lien de la soirée (ou scannent le QR code) dans le navigateur de leur téléphone, choisissent leur prénom, et c’est tout. Ni compte, ni mot de passe, ni téléchargement.'],
  ['Qui paie ?', 'Seul l’organisateur s’abonne. Les invités jouent gratuitement, aussi nombreux soient-ils.'],
  ['Comment sont calculés les points ?', 'Chaque vin rapporte des points sur le pays, la région, l’appellation, les cépages (au prorata d’un assemblage) et le millésime (selon l’écart). Le classement final est une note sur 20, au prorata des points possibles, car personne ne joue sur sa propre bouteille.'],
  ['Et si l’on n’y connaît pas grand-chose ?', 'C’est prévu : les listes proposent les bonnes réponses possibles, la carte aide à situer, et la fiche de dégustation (arômes, note) est facultative. Les débutants marquent souvent plus qu’ils ne le pensent.'],
  ['Combien de vins et d’invités par soirée ?', 'Il n’y a pas de limite fixée. L’appli est utilisée lors de soirées d’une dizaine de dégustateurs et de bouteilles, et on peut ajouter des bouteilles en cours de route.'],
  ['Quand pourrai-je l’utiliser ?', 'L’appli tourne déjà lors de nos propres soirées. L’ouverture aux autres confréries se fait par étapes : les inscrits sur la liste d’attente sont prévenus en premier, et les 10 premiers l’essaient gratuitement.'],
];

function Inscription({ places, setPlaces }) {
  const opened = useRef(0);
  const [f, setF] = useState({ email: '', prenom: '', groupe: '', consent: false, site: '' });
  const [etat, setEtat] = useState({ s: 'idle', msg: '' }); // idle | envoi | ok | erreur
  useEffect(() => {
    opened.current = Date.now();
  }, []);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function envoyer(e) {
    e.preventDefault();
    setEtat({ s: 'envoi', msg: '' });
    try {
      const r = await fetch('/api/liste-attente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, ouvert: Date.now() - opened.current }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'L’inscription n’a pas abouti. Réessayez dans un instant.');
      if (typeof d.places === 'number') setPlaces(d.places);
      setEtat({ s: 'ok', msg: d.essai ? 'C’est noté : vous faites partie des 10 premiers. Nous vous écrirons pour organiser votre essai gratuit.' : 'C’est noté : nous vous écrirons dès le lancement.' });
    } catch (err) {
      setEtat({ s: 'erreur', msg: err.message });
    }
  }

  if (etat.s === 'ok') {
    return (
      <div className="of-form of-merci" role="status">
        <img src="/logo.webp" alt="" width={96} height={96} />
        <p className="of-merci-titre">Merci{f.prenom ? `, ${f.prenom}` : ''} !</p>
        <p>{etat.msg}</p>
      </div>
    );
  }
  return (
    <form className="of-form" onSubmit={envoyer} noValidate>
      <label className="of-field">
        <span>Adresse e-mail</span>
        <input type="email" required autoComplete="email" inputMode="email" value={f.email} onChange={set('email')} placeholder="prenom@exemple.fr" maxLength={160} />
      </label>
      <div className="of-row2">
        <label className="of-field">
          <span>Prénom (facultatif)</span>
          <input type="text" autoComplete="given-name" value={f.prenom} onChange={set('prenom')} maxLength={60} />
        </label>
        <label className="of-field">
          <span>Votre groupe (facultatif)</span>
          <select value={f.groupe} onChange={set('groupe')}>
            <option value="">Choisir</option>
            {GROUPES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      {/* champ piège pour les robots, invisible pour les personnes */}
      <label className="of-piege" aria-hidden="true">
        Site web
        <input type="text" tabIndex={-1} autoComplete="off" value={f.site} onChange={set('site')} />
      </label>
      <label className="of-consent">
        <input type="checkbox" checked={f.consent} onChange={set('consent')} />
        <span>
          J’accepte de recevoir un e-mail au lancement de La Confrérie du Pif. Mon adresse ne sert qu’à cela, et je peux me désinscrire à tout moment (voir la <Link href="/confidentialite">politique de confidentialité</Link>).
        </span>
      </label>
      {etat.s === 'erreur' && (
        <p className="of-err" role="alert">
          {etat.msg}
        </p>
      )}
      <button className="of-btn or" disabled={etat.s === 'envoi' || !f.email.trim() || !f.consent}>
        {etat.s === 'envoi' ? 'Inscription…' : 'M’inscrire sur la liste d’attente'}
      </button>
      {places !== null && places > 0 && <p className="of-note">Les {PLACES_ESSAI} premiers inscrits pourront essayer gratuitement.</p>}
    </form>
  );
}

export default function OffrePage({ places: initialPlaces }) {
  const [places, setPlaces] = useState(initialPlaces);
  return (
    <main className="of">
      <header className="of-top">
        <div className="of-wrap of-top-in">
          <Link href="/offre" className="of-brand">
            <img src="/logo.webp" alt="" width={44} height={44} />
            <span>La Confrérie du Pif</span>
          </Link>
          <nav className="of-nav" aria-label="Sections">
            <a href="#deroule">Le déroulé</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#inscription" className="of-nav-cta">
              Liste d’attente
            </a>
          </nav>
        </div>
      </header>

      <section className="of-hero">
        <div className="of-wrap of-hero-in">
          <div className="of-hero-txt">
            <h1>Qui a le meilleur nez ?</h1>
            <p className="of-lead">La Confrérie du Pif organise vos dégustations de vin à l’aveugle entre amis. Les bouteilles restent secrètes, chacun pronostique sur son téléphone, et la révélation, vin par vin, désigne le meilleur palais de la soirée.</p>
            <div className="of-ctas">
              <a href="#inscription" className="of-btn or">
                M’inscrire sur la liste d’attente
              </a>
              <a href="#tarifs" className="of-btn clair">
                Voir les tarifs
              </a>
            </div>
            <Places places={places} />
          </div>
          <div className="of-hero-visu">
            <Phone src="/offre/revelation.webp" alt="Écran de révélation : le Barolo de Karim, avec les pronostics et les points de chaque dégustateur" priority />
          </div>
        </div>
      </section>

      <section className="of-section" id="deroule">
        <div className="of-wrap">
          <h2>Une soirée en quatre temps</h2>
          <ol className="of-etapes">
            {ETAPES.map(([t, d], i) => (
              <li key={t}>
                <span className="of-etape-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="of-section of-ecrans">
        <div className="of-wrap">
          <h2>Ce que voient vos invités</h2>
          <div className="of-ecrans-row">
            <figure>
              <Phone src="/offre/pronostic.webp" alt="Pronostic : la carte des régions viticoles d’Espagne" />
              <figcaption>Le pronostic, carte des régions à l’appui</figcaption>
            </figure>
            <figure>
              <Phone src="/offre/liste.webp" alt="Liste des vins de la soirée, avec le vin en cours de service" />
              <figcaption>Les vins de la soirée, le vin servi en tête</figcaption>
            </figure>
            <figure>
              <Phone src="/offre/trophees.webp" alt="Trophées de fin de soirée : le Pif d’or, le GPS du terroir, le Nez fin" />
              <figcaption>Les trophées de fin de soirée</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="of-section">
        <div className="of-wrap">
          <h2>Pensé pour une vraie soirée</h2>
          <dl className="of-atouts">
            {ATOUTS.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="of-section of-tarifs" id="tarifs">
        <div className="of-wrap">
          <h2>Tarifs</h2>
          <p className="of-sub">L’organisateur s’abonne, les invités jouent gratuitement.</p>
          <div className="of-plans">
            <article className="of-plan">
              <h3>Mensuel</h3>
              <p className="of-prix">
                {prix(TARIFS.mensuel)}
                <span>par mois</span>
              </p>
              <p className="of-plan-note">Sans engagement, résiliable en ligne à tout moment.</p>
            </article>
            <article className="of-plan star">
              <p className="of-badge">2 mois offerts</p>
              <h3>Annuel</h3>
              <p className="of-prix">
                {prix(TARIFS.annuel)}
                <span>par an</span>
              </p>
              <p className="of-plan-note">Au lieu de {prix(TARIFS.mensuel * 12)} en mensuel, soit environ {prix(TARIFS.annuel / 12)} par mois.</p>
            </article>
          </div>
          <ul className="of-inclus">
            {INCLUS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="of-tarif-note">Les deux formules donnent accès aux mêmes fonctions. Tarifs prévus au lancement ; rien à payer aujourd’hui.</p>
        </div>
      </section>

      <section className="of-section of-inscription" id="inscription">
        <div className="of-wrap of-inscription-in">
          <div className="of-inscription-txt">
            <h2>Soyez parmi les premiers</h2>
            <p>Laissez votre adresse : nous vous écrirons au lancement. Les {PLACES_ESSAI} premiers inscrits pourront essayer La Confrérie du Pif gratuitement avec leur groupe.</p>
            <Places places={places} large />
          </div>
          <Inscription places={places} setPlaces={setPlaces} />
        </div>
      </section>

      <section className="of-section">
        <div className="of-wrap of-faq">
          <h2>Questions fréquentes</h2>
          {FAQ.map(([q, r]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{r}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="of-footer">
        <div className="of-wrap of-footer-in">
          <div className="of-brand">
            <img src="/logo.webp" alt="" width={44} height={44} />
            <span>La Confrérie du Pif</span>
          </div>
          <nav aria-label="Liens">
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/">Rejoindre une soirée</Link>
          </nav>
          <p className="of-sante">L’abus d’alcool est dangereux pour la santé, à consommer avec modération. Réservé aux personnes majeures.</p>
        </div>
      </footer>
    </main>
  );
}
