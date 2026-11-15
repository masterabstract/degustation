'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FAMILLES, PALIERS } from '@/lib/badges';

// Pictogrammes des familles (traits simples, 24 x 24).
const ICONES = {
  millesime: (
    <>
      <path d="M7 3h10M7 21h10" />
      <path d="M8 3c0 4.5 4 5.5 4 9s-4 4.5-4 9M16 3c0 4.5-4 5.5-4 9s4 4.5 4 9" />
    </>
  ),
  pays: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.6 2.6 3.6 5.5 3.6 8.5s-1 5.9-3.6 8.5M12 3.5C9.4 6.1 8.4 9 8.4 12s1 5.9 3.6 8.5" />
    </>
  ),
  region: (
    <>
      <path d="M12 21s-6.5-6.4-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.6 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </>
  ),
  appellation: (
    <>
      <path d="M3.5 11.5V4h7.5l9.5 9.5-7.5 7.5z" />
      <circle cx="7.8" cy="8.2" r="1.4" />
    </>
  ),
  cepages: (
    <>
      <path d="M12 3.5c0 1.6 1 2.4 2.5 2.6" />
      <circle cx="9" cy="9" r="2.2" />
      <circle cx="13.6" cy="9" r="2.2" />
      <circle cx="11.3" cy="12.8" r="2.2" />
      <circle cx="15.9" cy="12.8" r="2.2" />
      <circle cx="13.6" cy="16.6" r="2.2" />
      <circle cx="6.7" cy="12.8" r="2.2" />
    </>
  ),
  parfait: <path d="M12 3.3l2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.1 6-.8z" />,
  degustateur: (
    <>
      <path d="M19.5 4.5c-6.5.5-11 5-12.5 12.5" />
      <path d="M19.5 4.5c.3 6-4.2 10.3-10.5 11" />
      <path d="M5 20l2-3" />
    </>
  ),
  fidelite: (
    <>
      <path d="M7.5 3.5h9c.4 3.6-.2 8-4.5 8.5-4.3-.5-4.9-4.9-4.5-8.5z" />
      <path d="M12 12v7.5M8.5 20.5h7" />
    </>
  ),
};

export const famille = (id) => FAMILLES.find((f) => f.id === id);
export const palier = (id) => PALIERS.find((p) => p.id === id);

/** Médaille : disque aux couleurs du palier, pictogramme de la famille. Sans palier : verrouillée. */
export function Medaille({ fam, pal, taille = 56, titre }) {
  const f = famille(fam);
  return (
    <span className={`medaille ${pal || 'verrou'}`} style={{ '--t': `${taille}px` }} role="img" aria-label={titre || `${f?.nom}${pal ? ` ${palier(pal)?.nom}` : ' (pas encore gagné)'}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {ICONES[fam]}
      </svg>
    </span>
  );
}

/** Collection complète d'un dégustateur : chaque famille, son palier et ce qu'il manque pour le suivant. */
export function GrilleBadges({ badges }) {
  if (!badges?.length) return null;
  return (
    <ul className="badges-grille">
      {badges.map((b) => {
        const f = famille(b.famille);
        const p = b.palier ? palier(b.palier) : null;
        const prochain = b.suivant;
        const base = p ? p.seuil : 0;
        const pct = prochain ? Math.round(((b.n - base) / (prochain.seuil - base)) * 100) : 100;
        return (
          <li key={b.famille} className={p ? '' : 'verrou'}>
            <Medaille fam={b.famille} pal={b.palier} taille={48} />
            <span className="badges-txt">
              <strong>{f.nom}</strong>
              <span className="tiny">
                {p ? <span className={`badge-palier ${p.id}`}>{p.nom}</span> : <span className="muted">À gagner</span>} · {b.n} {f.unite[b.n > 1 ? 1 : 0]}
              </span>
              {prochain ? (
                <span className="badges-jauge" title={`${prochain.reste} de plus pour le palier ${prochain.nom}`}>
                  <span style={{ width: `${Math.max(4, pct)}%` }} />
                </span>
              ) : (
                <span className="tiny" style={{ color: 'var(--or-fonce)', fontWeight: 700 }}>
                  Palier maximal atteint
                </span>
              )}
              {prochain && (
                <span className="tiny muted">
                  {prochain.nom} à {prochain.seuil} : encore {prochain.reste}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Règles des badges (dépliable). */
export function ReglesBadges() {
  return (
    <details className="small badges-regles">
      <summary>Comment gagner les badges ?</summary>
      <p style={{ margin: '8px 0 4px' }}>
        Chaque badge a cinq paliers : {PALIERS.map((p) => `${p.nom} (${p.seuil})`).join(', ')}. Les badges se cumulent d’une soirée à l’autre et ne se perdent jamais.
      </p>
      <ul>
        {FAMILLES.map((f) => (
          <li key={f.id}>
            <strong>{f.nom}</strong> : {f.regle.charAt(0).toLowerCase() + f.regle.slice(1)}.
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Page des résultats : badges gagnés ce soir par chacun (chargés une fois, après la révélation). */
export function BadgesDuSoir({ code, me }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let vivant = true;
    fetch(`/api/t/${code}/badges`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivant && setData(d))
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, [code]);
  // Pour chaque famille, on n'affiche que le plus haut palier gagné ce soir (Argent plutôt que Bronze + Argent).
  const ORDRE = PALIERS.map((p) => p.id);
  const meilleurs = (liste) => Object.values(liste.reduce((m, b) => (!m[b.famille] || ORDRE.indexOf(b.palier) > ORDRE.indexOf(m[b.famille].palier) ? { ...m, [b.famille]: b } : m), {}));
  const gagnants = (data?.participants || []).filter((p) => p.nouveaux.length).map((p) => ({ ...p, nouveaux: meilleurs(p.nouveaux) }));
  if (!data) return null;
  const moi = me ? data.participants.find((p) => p.name === me.name) : null;
  return (
    <section className="panel stack badges-soir" aria-labelledby="badges-soir-titre">
      <h2 id="badges-soir-titre">Badges gagnés ce soir</h2>
      {!gagnants.length && <p className="small muted">Aucun nouveau badge ce soir.</p>}
      <ul className="badges-soir-liste">
        {gagnants.map((p) => (
          <li key={p.name} className={moi?.name === p.name ? 'moi' : ''}>
            <strong>{p.name}</strong>
            <span className="badges-soir-medailles">
              {p.nouveaux.map((b, i) => (
                <span key={i} className="badges-soir-item">
                  <Medaille fam={b.famille} pal={b.palier} taille={40} />
                  <span className="tiny">
                    {famille(b.famille).nom}
                    <br />
                    <span className={`badge-palier ${b.palier}`}>{palier(b.palier).nom}</span>
                  </span>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      {moi && (
        <details className="small">
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Ma collection de badges</summary>
          <div style={{ marginTop: 10 }}>
            <GrilleBadges badges={moi.badges} />
          </div>
        </details>
      )}
      <ReglesBadges />
      <Link href="/archives" className="small">
        Les badges de tous les dégustateurs, dans le championnat
      </Link>
    </section>
  );
}
