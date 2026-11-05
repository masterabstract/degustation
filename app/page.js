'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Capsule } from '@/components/ui';

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="capsule-row" aria-hidden="true">
            <Capsule n={1} size="sm" />
            <Capsule n={2} size="sm" />
            <Capsule n={3} size="sm" />
          </div>
          <h1>Dégustation à l’aveugle</h1>
          <p>Notez chaque vin, tentez vos pronostics, et découvrez les bouteilles à la fin de la soirée.</p>
        </div>
      </section>

      <div className="page stack">
        <form
          className="panel stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (clean.length >= 4) router.push(`/t/${clean}`);
          }}
        >
          <h2>Rejoindre la soirée</h2>
          <label className="field">
            <span>Code donné par l’organisateur</span>
            <input
              className="input code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={8}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              placeholder="K7P4M"
              aria-label="Code de la dégustation"
            />
          </label>
          <button className="btn block" disabled={clean.length < 4}>
            Rejoindre
          </button>
        </form>

        <div className="panel">
          <h2>Vous organisez ?</h2>
          <p className="muted">Créez la soirée, ajoutez les participants et enregistrez les bouteilles en secret.</p>
          <Link href="/organiser" className="btn ghost block">
            Créer une dégustation
          </Link>
        </div>
      </div>
    </main>
  );
}
