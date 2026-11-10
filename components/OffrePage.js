'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PLACES_ESSAI, GROUPES, TARIFS } from '@/lib/liste-attente';
import { TEXTES } from '@/lib/offre-textes';

// Page de vente de La Confrérie du Pif (français ou anglais).
// Élément signature : les 10 capsules numérotées, une par place d'essai gratuit.

function Places({ places, large = false, T, variant = '' }) {
  const prises = places === null ? 0 : PLACES_ESSAI - places;
  return (
    <div className={`of-places${large ? ' large' : ''}${variant ? ` ${variant}` : ''}`}>
      <div className="of-capsules" role="img" aria-label={T.places.label(places)}>
        {Array.from({ length: PLACES_ESSAI }, (_, i) => (
          <span key={i} className={`of-cap${i < prises ? ' prise' : ''}`} style={{ '--i': i }}>
            {i + 1}
          </span>
        ))}
      </div>
      <p className="of-places-txt">{places === null ? T.places.inconnu : places > 0 ? T.places.reste(places) : T.places.fini}</p>
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

function Inscription({ places, setPlaces, T, lang }) {
  const F = T.form;
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
        body: JSON.stringify({ ...f, lang, ouvert: Date.now() - opened.current }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || F.erreur);
      if (typeof d.places === 'number') setPlaces(d.places);
      setEtat({ s: 'ok', msg: d.essai ? F.okEssai : F.ok });
    } catch (err) {
      setEtat({ s: 'erreur', msg: err.message || F.erreur });
    }
  }

  if (etat.s === 'ok') {
    return (
      <div className="of-form of-merci" role="status">
        <img src="/logo.webp" alt="" width={96} height={96} />
        <p className="of-merci-titre">{F.merci(f.prenom)}</p>
        <p>{etat.msg}</p>
      </div>
    );
  }
  return (
    <form className="of-form" onSubmit={envoyer} noValidate>
      <label className="of-field">
        <span>{F.email}</span>
        <input type="email" required autoComplete="email" inputMode="email" value={f.email} onChange={set('email')} placeholder={F.emailPh} maxLength={160} />
      </label>
      <div className="of-row2">
        <label className="of-field">
          <span>{F.prenom}</span>
          <input type="text" autoComplete="given-name" value={f.prenom} onChange={set('prenom')} maxLength={60} />
        </label>
        <label className="of-field">
          <span>{F.groupe}</span>
          <select value={f.groupe} onChange={set('groupe')}>
            <option value="">{F.choisir}</option>
            {GROUPES.map((g, i) => (
              <option key={g} value={g}>
                {F.groupes[i]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {/* champ piège pour les robots, invisible pour les personnes */}
      <label className="of-piege" aria-hidden="true">
        {F.piege}
        <input type="text" tabIndex={-1} autoComplete="off" value={f.site} onChange={set('site')} />
      </label>
      <label className="of-consent">
        <input type="checkbox" checked={f.consent} onChange={set('consent')} />
        <span>
          {F.consent1}
          <Link href={T.footer.confidHref}>{F.consentLien}</Link>
          {F.consent2}
        </span>
      </label>
      {etat.s === 'erreur' && (
        <p className="of-err" role="alert">
          {etat.msg}
        </p>
      )}
      <button className="of-btn or" disabled={etat.s === 'envoi' || !f.email.trim() || !f.consent}>
        {etat.s === 'envoi' ? F.envoi : places === null || places > 0 ? T.boutonTesteur : F.bouton}
      </button>
      {places !== null && places > 0 && <p className="of-note">{F.note}</p>}
    </form>
  );
}

export default function OffrePage({ places: initialPlaces, lang = 'fr' }) {
  const T = TEXTES[lang] || TEXTES.fr;
  const P = T.plans;
  const money = (n) => new Intl.NumberFormat(T.locale, { style: 'currency', currency: 'EUR' }).format(n);
  const [places, setPlaces] = useState(initialPlaces);
  const home = lang === 'en' ? '/en/offer' : '/offre';
  return (
    <main className="of" lang={lang}>
      <header className="of-top">
        <div className="of-wrap of-top-in">
          <Link href={home} className="of-brand">
            <img src="/logo.webp" alt="" width={44} height={44} />
            <span>La Confrérie du Pif</span>
          </Link>
          <nav className="of-nav" aria-label={lang === 'en' ? 'Sections' : 'Sections'}>
            <a href="#deroule">{T.nav.deroule}</a>
            <a href="#tarifs">{T.nav.tarifs}</a>
            <Link href={T.nav.autreHref} className="of-lang" hrefLang={lang === 'en' ? 'fr' : 'en'} aria-label={T.nav.autreLabel}>
              {T.nav.autre}
            </Link>
            <a href="#inscription" className="of-nav-cta">
              {T.nav.attente}
            </a>
          </nav>
        </div>
      </header>

      <section className="of-hero">
        <div className="of-wrap of-hero-in">
          <div className="of-hero-txt">
            <h1>{T.titre}</h1>
            <p className="of-lead">{T.lead}</p>
            <div className="of-ctas">
              <a href="#inscription" className="of-btn or">
                {places === null || places > 0 ? T.testeurs.cta : T.ctaInscription}
              </a>
              <a href="#tarifs" className="of-btn clair">
                {T.ctaTarifs}
              </a>
            </div>
            {(places === null || places > 0) && (
              <a href="#testeurs-titre" className="of-hero-testeurs">
                {T.places.hero(places)}
              </a>
            )}
          </div>
          <div className="of-hero-visu">
            <Phone src="/offre/revelation.webp" alt={T.heroAlt} priority />
          </div>
        </div>
      </section>

      <section className="of-testeurs" aria-labelledby="testeurs-titre">
        <div className="of-wrap of-testeurs-in">
          <div className="of-testeurs-tete">
            <h2 id="testeurs-titre">{places === 0 ? T.testeurs.titreComplet : T.testeurs.titre}</h2>
            <p>{T.testeurs.sous}</p>
            <Places places={places} large T={T} variant="clair" />
          </div>
          <ul className="of-testeurs-points">
            {T.testeurs.points.map(([t, d]) => (
              <li key={t}>
                <strong>{t}</strong>
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <div className="of-testeurs-cta">
            {(places === null || places > 0) && (
              <a href="#inscription" className="of-btn bordeaux">
                {T.testeurs.cta}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="of-section" id="deroule">
        <div className="of-wrap">
          <h2>{T.deroule}</h2>
          <ol className="of-etapes">
            {T.etapes.map(([t, d], i) => (
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
          <h2>{T.ecrans}</h2>
          {T.ecransNote && <p className="of-sub">{T.ecransNote}</p>}
          <div className="of-ecrans-row">
            {T.captures.map(([src, alt, cap]) => (
              <figure key={src}>
                <Phone src={src} alt={alt} />
                <figcaption>{cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="of-section">
        <div className="of-wrap">
          <h2>{T.atoutsTitre}</h2>
          <dl className="of-atouts">
            {T.atouts.map(([t, d]) => (
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
          <h2>{T.tarifsTitre}</h2>
          <p className="of-sub">{T.tarifsSous}</p>
          <div className="of-plans">
            <article className="of-plan">
              <h3>{P.soiree.nom}</h3>
              <p className="of-prix">
                {money(TARIFS.soiree)}
                <span>{P.soiree.unite}</span>
              </p>
              <p className="of-plan-note">{P.soiree.note}</p>
            </article>
            <article className="of-plan">
              <h3>{P.mensuel.nom}</h3>
              <p className="of-prix">
                {money(TARIFS.mensuel)}
                <span>{P.mensuel.unite}</span>
              </p>
              <p className="of-plan-note">{P.mensuel.note}</p>
            </article>
            <article className="of-plan star">
              <p className="of-badge">{P.annuel.badge}</p>
              <h3>{P.annuel.nom}</h3>
              <p className="of-prix">
                {money(TARIFS.annuel)}
                <span>{P.annuel.unite}</span>
              </p>
              <p className="of-plan-note">{P.annuel.note(money(TARIFS.mensuel * 12), money(TARIFS.annuel / 12))}</p>
            </article>
          </div>
          <h3 className="of-inclus-titre">{T.inclusTitre}</h3>
          <ul className="of-inclus">
            {T.inclus.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="of-tarif-note">{T.tarifNote}</p>
        </div>
      </section>

      <section className="of-section of-inscription" id="inscription">
        <div className="of-wrap of-inscription-in">
          <div className="of-inscription-txt">
            <h2>{places === null || places > 0 ? T.inscriptionTitreTesteur : T.inscriptionTitre}</h2>
            <p>{T.inscriptionTxt}</p>
            <Places places={places} large T={T} />
          </div>
          <Inscription places={places} setPlaces={setPlaces} T={T} lang={lang} />
        </div>
      </section>

      <section className="of-section">
        <div className="of-wrap of-faq">
          <h2>{T.faqTitre}</h2>
          {T.faq.map(([q, r]) => (
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
            <Link href={T.footer.confidHref}>{T.footer.confid}</Link>
            <Link href="/">{T.footer.rejoindre}</Link>
            <Link href={T.nav.autreHref} hrefLang={lang === 'en' ? 'fr' : 'en'}>
              {T.nav.autreLabel}
            </Link>
          </nav>
          <p className="of-sante">{T.footer.sante}</p>
        </div>
      </footer>
    </main>
  );
}
