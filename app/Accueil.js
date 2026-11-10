'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recentSoirees } from '@/lib/memo';

export default function Accueil() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [recent, setRecent] = useState([]);
  useEffect(() => setRecent(recentSoirees()), []);
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const mine = recent.filter((x) => x.role === 'participant').slice(0, 3);
  const organised = recent.filter((x) => x.role === 'organisateur').slice(0, 3);
  // Un participant n'a pas à voir l'espace organisateur en grand : un simple lien discret suffit.
  const showOrganiser = organised.length > 0 || mine.length === 0;

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
        {organised.length > 0 && (
          <div className="panel stack">
            <h2>Reprendre l’organisation</h2>
            {organised.map((x) => (
              <Link key={x.code} href={`/admin/${x.code}`} className="btn ghost block resume-btn">
                <span>{x.name || `Soirée ${x.code}`}</span>
                <span className="resume-sub">Espace organisateur · {x.code}</span>
              </Link>
            ))}
          </div>
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
              placeholder="K7P4M"
              aria-label="Code de la dégustation"
            />
          </label>
          <button className="btn block" disabled={clean.length < 4}>
            Rejoindre
          </button>
        </form>

        {showOrganiser && (
          <div className="panel">
            <h2>Vous organisez ?</h2>
            <p className="muted">Créez la soirée et invitez les participants : chacun enregistre ses bouteilles en secret. Accès réservé, protégé par le mot de passe organisateur.</p>
            <Link href="/organiser" className="btn ghost block">
              Créer une dégustation
            </Link>
            <Link href="/orga" className="small" style={{ display: 'block', textAlign: 'center', marginTop: 10 }}>
              Installer l’appli organisateur
            </Link>
          </div>
        )}

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
        {organised.length > 0 && (
          <p className="center small" style={{ marginTop: 8 }}>
            Page de vente (réservée aux organisateurs pour l’instant) : <Link href="/offre">découvrir La Confrérie du Pif</Link>
          </p>
        )}
        {!showOrganiser && (
          <p className="center tiny">
            <Link href="/orga" className="muted">
              Espace organisateur
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
