'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recentSoirees } from '@/lib/memo';
import { api } from '@/components/ui';

export default function Accueil() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [recent, setRecent] = useState([]);
  const [orga, setOrga] = useState(false); // appareil connecté avec le mot de passe organisateur ?
  useEffect(() => {
    setRecent(recentSoirees());
    api('/api/orga/session')
      .then((d) => setOrga(!!d.organisateur))
      .catch(() => {});
  }, []);
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const mine = recent.filter((x) => x.role === 'participant').slice(0, 3);

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <img src="/logo.webp" alt="" width={500} height={500} className="hero-logo" fetchPriority="high" />
          <h1>La Confrérie du Pif</h1>
          <p className="hero-eyebrow">Dégustations à l’aveugle entre amis</p>
          <p>Notez chaque vin, tentez vos pronostics, et découvrez les bouteilles une à une au fil de la soirée.</p>
        </div>
      </section>

      <div className="page stack">
        {mine.length > 0 && (
          <div className="panel stack">
            <h2>Reprendre ma soirée</h2>
            {mine.map((x) => (
              <Link key={x.code} href={`/t/${x.code}`} className="btn block resume-btn">
                <span>{x.name || `Soirée ${x.code}`}</span>
                <span className="resume-sub">
                  Code {x.code}
                  {x.who ? ` · ${x.who}` : ''}
                </span>
              </Link>
            ))}
            <p className="tiny muted">Ce téléphone se souvient de vos soirées : pas besoin de retaper le code.</p>
          </div>
        )}
        {orga && (
          <Link href="/orga" className="btn gold block">
            Espace organisateur : mes soirées
          </Link>
        )}
        <form
          className="panel stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (clean.length >= 4) router.push(`/t/${clean}`);
          }}
        >
          <h2>{mine.length ? 'Rejoindre une autre soirée' : 'Rejoindre la soirée'}</h2>
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
              placeholder="SYRAH42"
              aria-label="Code de la dégustation"
            />
          </label>
          <button className="btn block" disabled={clean.length < 4}>
            Rejoindre
          </button>
        </form>

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
        <Link href="/degustation-vin-aveugle" className="panel" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>Le guide de la dégustation à l’aveugle</h2>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </div>
          <p className="muted small" style={{ marginTop: 4 }}>
            Cacher les bouteilles, l’ordre de service, la méthode pour deviner et le barème des points.
          </p>
        </Link>
        {orga && (
          <p className="center small" style={{ marginTop: 8 }}>
            Page de vente (réservée aux organisateurs pour l’instant) : <Link href="/offre">découvrir La Confrérie du Pif</Link>
          </p>
        )}
      </div>
    </main>
  );
}
