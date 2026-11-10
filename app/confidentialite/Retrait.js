'use client';

import { useState } from 'react';

export default function Retrait() {
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
        <span>Adresse e-mail</span>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <button className="btn ghost block" disabled={!email.trim() || etat === 'envoi'}>
        {etat === 'envoi' ? 'Effacement…' : 'Effacer mon adresse'}
      </button>
      {etat === 'ok' && <p className="notice ok">C’est fait : si cette adresse était inscrite, elle a été effacée.</p>}
      {etat === 'erreur' && <p className="notice error">L’effacement n’a pas abouti. Vérifiez votre connexion et réessayez.</p>}
    </form>
  );
}
