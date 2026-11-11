'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Notice } from './ui';

// Porte d'entrée de la partie organisateur : mot de passe organisateur, une fois par appareil (30 jours).
// Les participants n'ont pas ce mot de passe : ils ne voient jamais rien d'autre que cet écran.
export default function OrgaConnexion({ retour = '/', retourLabel = 'Je suis participant : retour à l’accueil', titre = 'Réservé à l’organisateur' }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Dans l'appli organisateur (/orga), le service worker est enregistré dès cet écran : l'appli reste installable.
  useEffect(() => {
    try {
      if (window.location.pathname.startsWith('/orga')) navigator.serviceWorker?.register('/sw-orga.js', { scope: '/orga' }).catch(() => {});
    } catch {}
  }, []);
  return (
    <main className="orga">
      <section className="orga-hero">
        <img src="/logo.webp" alt="La Confrérie du Pif" width={500} height={500} className="orga-logo petit" />
        <p className="orga-eyebrow">Espace organisateur</p>
      </section>
      <form
        className="page stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api('/api/orga/session', {
              method: 'POST',
              body: { password },
            });
            window.location.reload();
          } catch (err) {
            setError(err.message);
            setBusy(false);
          }
        }}
      >
        <div className="panel stack">
          <h2>{titre}</h2>
          <p className="small muted">Les participants n’ont rien à faire ici : ils rejoignent la soirée avec le code ou le lien reçu.</p>
          <label className="field">
            <span>Mot de passe organisateur</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
          </label>
          <Notice kind="error">{error}</Notice>
          <button className="btn block" disabled={busy || !password}>
            {busy ? 'Vérification…' : 'Entrer'}
          </button>
          <p className="tiny muted">Ce téléphone s’en souviendra pendant 30 jours.</p>
        </div>
        <Link href={retour} className="linklike small" style={{ alignSelf: 'center' }}>
          {retourLabel}
        </Link>
      </form>
    </main>
  );
}
