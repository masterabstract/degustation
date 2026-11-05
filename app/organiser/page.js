'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, Band, Notice } from '@/components/ui';

export default function Organiser() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [people, setPeople] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const participants = people.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
      const r = await api('/api/tastings', { method: 'POST', body: { name, date, participants, password } });
      setCreated(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const adminUrl = `${window.location.origin}/admin/${created.code}?cle=${created.adminKey}`;
    return (
      <main>
        <Band title="Soirée créée" sub={name} />
        <div className="page stack">
          <div className="panel center stack">
            <div className="muted">Code à donner aux participants</div>
            <div className="access-code">{created.code}</div>
          </div>
          <div className="panel stack">
            <h2>Votre lien organisateur</h2>
            <p>
              Ce lien secret vous permet de revenir dans l’espace organisateur depuis n’importe quel appareil.
              <strong> Gardez-le pour vous</strong> : il donne accès aux bouteilles cachées.
            </p>
            <input className="input small" readOnly value={adminUrl} onFocus={(e) => e.target.select()} aria-label="Lien organisateur" />
            <button
              className="btn ghost block"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(adminUrl);
                  setCopied(true);
                } catch {}
              }}
            >
              {copied ? 'Lien copié' : 'Copier le lien'}
            </button>
            <p className="tiny muted">Conseil : envoyez-le vous par e-mail ou enregistrez-le dans vos notes.</p>
          </div>
          <Link href={`/admin/${created.code}`} className="btn block">
            Ouvrir l’espace organisateur
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Band title="Nouvelle dégustation" back="/" />
      <form className="page stack" onSubmit={submit}>
        <div className="panel stack">
          <label className="field">
            <span>Nom de la soirée</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Les vins de novembre" required maxLength={80} />
          </label>
          <label className="field">
            <span>Date</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <div className="panel stack">
          <label className="field">
            <span>Participants</span>
            <textarea
              className="input"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder={'Un prénom par ligne\nCamille\nKarim\nLéa'}
              rows={6}
            />
          </label>
          <p className="tiny muted">Facultatif ici : vous pourrez en ajouter ou en retirer ensuite.</p>
        </div>
        <div className="panel stack">
          <label className="field">
            <span>Mot de passe organisateur</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          <p className="tiny muted">Celui que vous avez défini lors de la mise en ligne du site. Il empêche des inconnus de créer des soirées.</p>
        </div>
        <Notice kind="error">{error}</Notice>
        <button className="btn block" disabled={busy || !name.trim()}>
          {busy ? 'Création…' : 'Créer la dégustation'}
        </button>
      </form>
    </main>
  );
}
