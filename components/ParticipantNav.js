'use client';

import Link from 'next/link';

// Barre d'onglets du participant, en bas de l'écran (comme une appli) :
// Vins (pronostics) · Ma bouteille · Révélation / Résultats · Règles.
const ICONES = {
  vins: (
    <>
      <path d="M8 3h8c.5 4.5-.5 9-4 9.5C8.5 12 7.5 7.5 8 3z" />
      <path d="M12 12.5V20M8.5 20.5h7" />
    </>
  ),
  bouteille: (
    <>
      <path d="M10 2.5h4v4.2c1.9 1 3 2.6 3 4.8v9H7v-9c0-2.2 1.1-3.8 3-4.8z" />
      <path d="M7 14h10" />
    </>
  ),
  resultats: (
    <>
      <path d="M4 20.5h16M6 20.5v-6h4v6M10 20.5V10h4v10.5M14 20.5v-8h4v8" />
      <path d="M12 3.5l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
    </>
  ),
  regles: (
    <>
      <path d="M5 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v13H7.5A2.5 2.5 0 0 1 5 17.5z" />
      <path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H17M8.5 8.5h5M8.5 11.5h5" />
    </>
  ),
};

export const ongletsParticipant = (code, phase, revelations = 0) => [
  { id: 'vins', label: 'Vins', href: `/t/${code}` },
  { id: 'bouteille', label: 'Ma bouteille', href: `/t/${code}?onglet=bouteille` },
  {
    id: 'resultats',
    label: phase === 'revelee' ? 'Résultats' : 'Révélation',
    href: `/t/${code}/resultats`,
    off: !(phase === 'revelation' || phase === 'revelee' || revelations > 0),
  },
  { id: 'regles', label: 'Règles', href: `/t/${code}?onglet=regles` },
];

/**
 * actif : onglet courant ; badges : { vins: 3, bouteille: '!' } ; point : { resultats: true } (nouveauté) ;
 * onSelect : si fourni (page des vins), change d'onglet sans recharger la page.
 */
export default function ParticipantNav({ code, actif, phase, revelations = 0, badges = {}, point = {}, onSelect }) {
  const items = ongletsParticipant(code, phase, revelations);
  return (
    <nav className="pnav" aria-label="Navigation de la soirée">
      <div className="pnav-in">
        {items.map((it) => {
          const contenu = (
            <>
              <span className="pnav-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24">{ICONES[it.id]}</svg>
                {badges[it.id] ? <span className="pnav-badge">{badges[it.id]}</span> : point[it.id] ? <span className="pnav-point" /> : null}
              </span>
              <span className="pnav-lbl">{it.label}</span>
            </>
          );
          const props = { className: `pnav-item${actif === it.id ? ' actif' : ''}${it.off ? ' off' : ''}`, 'aria-current': actif === it.id ? 'page' : undefined };
          if (it.off)
            return (
              <span key={it.id} {...props} aria-disabled="true" title="Disponible dès la première révélation">
                {contenu}
              </span>
            );
          if (onSelect && it.id !== 'resultats')
            return (
              <button key={it.id} type="button" {...props} onClick={() => onSelect(it.id)}>
                {contenu}
              </button>
            );
          return (
            <Link key={it.id} href={it.href} {...props}>
              {contenu}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
