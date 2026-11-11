'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, Band, Notice } from '@/components/ui';

// Création d'une soirée. Cette page n'est envoyée qu'à l'organisateur connecté (voir page.js).
export default function Organiser() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [people, setPeople] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const participants = people
        .split(/[\n,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const r = await api('/api/tastings', {
        method: 'POST',
        body: { name, date, participants },
      });
      setCreated(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const joinUrl = `${window.location.origin}/t/${created.code}`;
    return (
      <main>
        <Band title="Soirée créée" sub={name} back="/orga" />
        <div className="page stack">
          <div className="panel center stack">
            <div className="muted">Code à donner aux participants</div>
            <div className="access-code">{created.code}</div>
            <div className="small muted">
              ou le lien direct : <strong>{joinUrl.replace(/^https?:\/\//, '')}</strong>
            </div>
            <button
              className="btn ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(joinUrl);
                  setCopied(true);
                } catch {}
              }}
            >
              {copied ? 'Lien copié' : 'Copier le lien à partager'}
            </button>
          </div>
          <Link href={`/admin/${created.code}`} className="btn gold block">
            Ouvrir la soirée
          </Link>
          <Link href="/orga" className="btn ghost block">
            Retour à mes soirées
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Band title="Nouvelle dégustation" back="/orga" />
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
            <textarea className="input" value={people} onChange={(e) => setPeople(e.target.value)} placeholder={'Un prénom par ligne\nCamille\nKarim\nLéa'} rows={6} />
          </label>
          <p className="tiny muted">Facultatif ici : vous pourrez en ajouter ou en retirer ensuite.</p>
        </div>
        <Notice kind="error">{error}</Notice>
        <button className="btn block" disabled={busy || !name.trim()}>
          {busy ? 'Création…' : 'Créer la dégustation'}
        </button>
      </form>
    </main>
  );
}
