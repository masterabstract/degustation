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
          <h1>La Confrérie du Pif</h1>
          <p className="hero-eyebrow">Dégustations à l’aveugle entre amis</p>
          <p>Notez chaque vin, tentez vos pronostics, et découvrez les bouteilles une à une au fil de la soirée.</p>
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
          <p className="muted">Créez la soirée et invitez les participants : chacun enregistre ses bouteilles en secret.</p>
          <Link href="/organiser" className="btn ghost block">
            Créer une dégustation
          </Link>
        </div>

        <Link href="/archives" className="panel" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>Archives et palmarès</h2>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </div>
          <p className="muted small" style={{ marginTop: 4 }}>
            Les soirées passées, leurs résultats, et le classement général des dégustateurs.
          </p>
        </Link>
      </div>
    </main>
  );
}
