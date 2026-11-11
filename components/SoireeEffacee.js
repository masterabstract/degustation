'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Band } from './ui';
import { recentSoirees, forgetSoiree } from '@/lib/memo';
import { pendingDrafts, oublierBrouillons } from '@/lib/brouillons';

// Affiché à un participant quand la soirée n'existe plus (effacée par l'organisateur)
// ou que le code est inconnu. Le téléphone oublie alors la soirée et ses fiches en attente.
export default function SoireeEffacee({ code, connue = false }) {
  const [effacee, setEffacee] = useState(connue);
  useEffect(() => {
    if (recentSoirees().some((x) => x.code === code) || pendingDrafts(code).length) setEffacee(true);
    forgetSoiree(code);
    oublierBrouillons(code);
  }, [code]);
  return (
    <main>
      <Band title={effacee ? 'Soirée effacée' : 'Dégustation introuvable'} back="/" />
      <div className="page stack">
        <div className="panel stack center">
          <img src="/logo.webp" alt="" width={110} height={110} className="join-logo" />
          {effacee ? (
            <p>Cette soirée a été effacée par l’organisateur : elle n’est plus accessible. Ce téléphone l’a retirée de ses soirées.</p>
          ) : (
            <p>Le code {code} ne correspond à aucune soirée. Vérifiez-le auprès de l’organisateur.</p>
          )}
          <Link href="/" className="btn block">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
