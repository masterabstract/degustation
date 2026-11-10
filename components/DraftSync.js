'use client';

import { useEffect, useState } from 'react';
import { pendingDrafts, sendPendingDrafts, takeRefused } from '@/lib/brouillons';

// Sur la liste des vins : envoie les fiches restées sur le téléphone (coupure réseau)
// et prévient le participant tant qu'il en reste.
export default function DraftSync({ code }) {
  const [left, setLeft] = useState(0);
  const [refused, setRefused] = useState(0);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const r = pendingDrafts(code).length ? await sendPendingDrafts(code) : { left: 0 };
      if (!alive) return;
      setLeft(r.left);
      const n = takeRefused(code); // y compris celles refusées depuis la page d'un vin
      if (n) setRefused((x) => x + n);
    };
    run();
    const id = setInterval(run, 5000);
    window.addEventListener('online', run);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener('online', run);
    };
  }, [code]);

  if (!left && !refused) return null;
  return (
    <>
      {left > 0 && (
        <div className="offline-note" role="status">
          <strong>Pas de réseau.</strong> {left > 1 ? `${left} fiches sont gardées` : 'Une fiche est gardée'} sur ce téléphone : {left > 1 ? 'elles partiront' : 'elle partira'} toute seule dès que la connexion revient.
        </div>
      )}
      {refused > 0 && (
        <div className="notice error">
          {refused > 1 ? `${refused} fiches n’ont` : 'Une fiche n’a'} pas pu être envoyée{refused > 1 ? 's' : ''} avant la révélation du vin (pas de réseau) : après la révélation, aucune réponse ne peut plus être ajoutée.
        </div>
      )}
    </>
  );
}
