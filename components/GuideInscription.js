'use client';

import { useEffect, useState } from 'react';
import { Places, Inscription } from './OffrePage';
import { TEXTES } from '@/lib/offre-textes';

// Encadré « appli » du guide : compteur des 10 places d'essai et formulaire de liste d'attente.
// Le nombre de places est demandé au serveur après l'affichage, pour que la page du guide reste statique (rapide).
export default function GuideInscription({ lang = 'fr' }) {
  const T = TEXTES[lang] || TEXTES.fr;
  const [places, setPlaces] = useState(null);
  useEffect(() => {
    let vivant = true;
    fetch('/api/liste-attente', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivant && d && typeof d.places === 'number' && setPlaces(d.places))
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, []);
  return (
    <div className="gd-appli-in">
      <Places places={places} large T={T} />
      <Inscription places={places} setPlaces={setPlaces} T={T} lang={lang} />
    </div>
  );
}
