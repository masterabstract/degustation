import Link from 'next/link';
import { GUIDE } from '@/lib/guide-textes';
import { SITE_URL } from '@/lib/site';
import GuideInscription from './GuideInscription';

// Guide public « organiser une dégustation de vin à l'aveugle ».
// Page rendue côté serveur : tout le texte est dans le HTML, lisible par Google sans JavaScript.

export const DATE_GUIDE = '2026-11-10';

function Bloc({ b }) {
  if (typeof b === 'string') return <p>{b}</p>;
  const [type, a, c] = b;
  if (type === 'sous') return <h3>{a}</h3>;
  if (type === 'liste')
    return (
      <ul className="gd-liste">
        {a.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    );
  if (type === 'etapes')
    return (
      <ol className="gd-etapes">
        {a.map(([t, d]) => (
          <li key={t}>
            <strong>{t}</strong>
            {d && <span>{d}</span>}
          </li>
        ))}
      </ol>
    );
  if (type === 'table')
    return (
      <div className="gd-table">
        <table>
          <thead>
            <tr>
              {a.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.map((row) => (
              <tr key={row[0]}>
                <th scope="row">{row[0]}</th>
                {row.slice(1).map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return null;
}

function donneesStructurees(G, lang) {
  const url = `${SITE_URL}${G.path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: G.titre,
        description: G.metaDesc,
        inLanguage: lang,
        datePublished: DATE_GUIDE,
        dateModified: DATE_GUIDE,
        mainEntityOfPage: url,
        image: `${SITE_URL}/opengraph-image.jpg`,
        author: { '@type': 'Organization', name: 'La Confrérie du Pif', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'La Confrérie du Pif', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.webp` } },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: lang,
        mainEntity: G.faq.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })),
      },
    ],
  };
}

export default function GuidePage({ lang = 'fr' }) {
  const G = GUIDE[lang] || GUIDE.fr;
  // « < » échappé : le texte ne peut pas fermer la balise script.
  const jsonld = JSON.stringify(donneesStructurees(G, lang)).replace(/</g, '\\u003c');
  return (
    <main className="of gd" lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonld }} />
      <header className="of-top">
        <div className="of-wrap of-top-in">
          <Link href="/" className="of-brand">
            <img src="/logo.webp" alt="" width={44} height={44} />
            <span>La Confrérie du Pif</span>
          </Link>
          <nav className="of-nav" aria-label={lang === 'en' ? 'Links' : 'Liens'}>
            <Link href={G.autre.href} hrefLang={G.autre.lang} className="of-lang" aria-label={G.autre.label}>
              {G.autre.lang.toUpperCase()}
            </Link>
            <a href="#appli" className="of-nav-cta">
              {lang === 'en' ? 'The app' : 'L’appli'}
            </a>
          </nav>
        </div>
      </header>

      <section className="gd-hero">
        <div className="of-wrap gd-col">
          <h1>{G.titre}</h1>
          <p className="gd-chapo">{G.chapo}</p>
          <p className="gd-maj">
            <time dateTime={DATE_GUIDE}>{G.maj}</time>
          </p>
        </div>
      </section>

      <div className="of-wrap gd-col">
        <nav className="gd-sommaire" aria-labelledby="gd-sommaire-titre">
          <h2 id="gd-sommaire-titre">{G.sommaire}</h2>
          <ol>
            {G.sections.map(([id, titre]) => (
              <li key={id}>
                <a href={`#${id}`}>{titre}</a>
              </li>
            ))}
            <li>
              <a href="#faq">{G.faqTitre}</a>
            </li>
          </ol>
        </nav>

        <article className="gd-article">
          {G.sections.map(([id, titre, blocs]) => (
            <section key={id} id={id} className="gd-section">
              <h2>{titre}</h2>
              {blocs.map((b, i) => (
                <Bloc key={i} b={b} />
              ))}
            </section>
          ))}
        </article>
      </div>

      <section className="of-section of-inscription gd-appli" id="appli" aria-labelledby="gd-appli-titre">
        <div className="of-wrap gd-col">
          <h2 id="gd-appli-titre">{G.app.titre}</h2>
          <p className="gd-appli-txt">{G.app.texte}</p>
          <p className="gd-appli-txt gd-appli-bientot">{G.app.bientot}</p>
          <GuideInscription lang={lang} />
        </div>
      </section>

      <section className="of-section" id="faq">
        <div className="of-wrap of-faq gd-col">
          <h2>{G.faqTitre}</h2>
          {G.faq.map(([q, r]) => (
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
          <nav aria-label={lang === 'en' ? 'Links' : 'Liens'}>
            <Link href="/">{G.lienOffre}</Link>
            <Link href={lang === 'en' ? '/en/privacy' : '/confidentialite'}>{lang === 'en' ? 'Privacy' : 'Confidentialité'}</Link>
            <Link href={G.autre.href} hrefLang={G.autre.lang}>
              {G.autre.label}
            </Link>
          </nav>
          <p className="of-sante">{G.sante}</p>
        </div>
      </footer>
    </main>
  );
}
