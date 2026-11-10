'use client';

import { useState } from 'react';

const TX = {
  fr: { email: 'Adresse e-mail', envoi: 'Effacement…', bouton: 'Effacer mon adresse', ok: 'C’est fait : si cette adresse était inscrite, elle a été effacée.', err: 'L’effacement n’a pas abouti. Vérifiez votre connexion et réessayez.' },
  en: { email: 'Email address', envoi: 'Removing…', bouton: 'Remove my address', ok: 'Done: if this address was on the list, it has been removed.', err: 'The removal didn’t go through. Check your connection and try again.' },
};

export default function Retrait({ lang = 'fr' }) {
  const t = TX[lang] || TX.fr;
  const [email, setEmail] = useState('');
  const [etat, setEtat] = useState(null);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setEtat('envoi');
        try {
          const r = await fetch('/api/liste-attente', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retirer', email }) });
          setEtat(r.ok ? 'ok' : 'erreur');
        } catch {
          setEtat('erreur');
        }
      }}
    >
      <label className="field">
        <span>{t.email}</span>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <button className="btn ghost block" disabled={!email.trim() || etat === 'envoi'}>
        {etat === 'envoi' ? t.envoi : t.bouton}
      </button>
      {etat === 'ok' && <p className="notice ok">{t.ok}</p>}
      {etat === 'erreur' && <p className="notice error">{t.err}</p>}
    </form>
  );
}
