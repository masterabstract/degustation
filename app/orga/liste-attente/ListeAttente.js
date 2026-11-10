'use client';

import { useState } from 'react';
import { Band, Notice } from '@/components/ui';

// Inscrits de la page de vente, visibles seulement avec le mot de passe organisateur.
export default function ListeAttente() {
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load(e) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/liste-attente/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      setRows(d.inscrits);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const date = (x) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main>
      <Band title="Liste d’attente" sub="Inscrits de la page de vente" back="/orga" />
      <div className="page stack">
        {!rows ? (
          <form className="panel stack" onSubmit={load}>
            <p className="small muted">Réservé au propriétaire du site : tapez le mot de passe organisateur.</p>
            <label className="field">
              <span>Mot de passe organisateur</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
            </label>
            <Notice kind="error">{error}</Notice>
            <button className="btn block" disabled={busy || !password}>
              {busy ? 'Chargement…' : 'Voir les inscrits'}
            </button>
          </form>
        ) : (
          <>
            <div className="panel stack">
              <h2>
                {rows.length} inscrit{rows.length > 1 ? 's' : ''}
              </h2>
              <p className="small muted">Les 10 premiers (en doré) ont droit à l’essai gratuit. Écrivez-leur depuis votre messagerie ; ne transmettez jamais ces adresses à quelqu’un d’autre.</p>
              <div className="row">
                <button
                  type="button"
                  className="btn ghost sm"
                  disabled={!rows.length}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(rows.map((r) => r.email).join(', '));
                      setCopied(true);
                    } catch {}
                  }}
                >
                  {copied ? 'Adresses copiées' : 'Copier toutes les adresses'}
                </button>
                <button type="button" className="btn ghost sm" onClick={() => load()}>
                  Actualiser
                </button>
              </div>
            </div>
            {rows.length > 0 && (
              <div className="panel flush">
                <ul className="wl-list">
                  {rows.map((r) => (
                    <li key={r.email} className={r.essai ? 'essai' : ''}>
                      <span className="wl-rang">{r.rang}</span>
                      <span className="wl-main">
                        <strong>{r.email}</strong>
                        <span className="tiny muted">
                          {[r.prenom, r.groupe, r.langue === 'en' ? 'anglais' : null, date(r.created_at)].filter(Boolean).join(', ')}
                          {r.essai ? ' (essai gratuit)' : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
