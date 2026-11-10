'use client';

import { useState } from 'react';
import Link from 'next/link';

const TX = {
  fr: {
    titre: 'Page réservée aux organisateurs',
    txt: 'La présentation de La Confrérie du Pif n’est pas encore publique.',
    participant: 'Vous êtes invité à une dégustation ? Rejoignez-la avec le code ou le lien reçu.',
    rejoindre: 'Rejoindre ma soirée',
    orga: 'Vous êtes organisateur ? Tapez le mot de passe organisateur.',
    label: 'Mot de passe organisateur',
    bouton: 'Voir la page',
    envoi: 'Vérification…',
  },
  en: {
    titre: 'For hosts only',
    txt: 'The La Confrérie du Pif presentation is not public yet.',
    participant: 'Invited to a tasting? Join it with the code or link you received.',
    rejoindre: 'Join my evening',
    orga: 'Are you a host? Enter the organizer password.',
    label: 'Organizer password',
    bouton: 'View the page',
    envoi: 'Checking…',
  },
};

export default function OffreReservee({ lang = 'fr' }) {
  const t = TX[lang] || TX.fr;
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="of-reserve" lang={lang}>
      <div className="of-reserve-in">
        <img src="/logo.webp" alt="La Confrérie du Pif" width={160} height={160} />
        <h1>{t.titre}</h1>
        <p>{t.txt}</p>
        <p>{t.participant}</p>
        <Link href="/" className="of-btn or">
          {t.rejoindre}
        </Link>
        <form
          className="of-reserve-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr(null);
            try {
              const r = await fetch('/api/offre/acces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw, lang }) });
              const d = await r.json().catch(() => ({}));
              if (!r.ok) throw new Error(d.error || 'Erreur');
              window.location.reload();
            } catch (er) {
              setErr(er.message);
              setBusy(false);
            }
          }}
        >
          <p className="small">{t.orga}</p>
          <label className="of-field">
            <span>{t.label}</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          </label>
          {err && (
            <p className="of-err" role="alert">
              {err}
            </p>
          )}
          <button className="of-btn clair" disabled={busy || !pw}>
            {busy ? t.envoi : t.bouton}
          </button>
        </form>
      </div>
    </main>
  );
}
