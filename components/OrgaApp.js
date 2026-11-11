'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Notice, Spinner, fmtDate } from './ui';
import { forgetSoiree } from '@/lib/memo';

// Appli de l'organisateur (installable sur l'écran d'accueil) : toutes les soirées,
// classées par étape, avec pour chacune Ouvrir, Modifier et Effacer.
// Cette page n'est envoyée qu'à un appareil connecté avec le mot de passe organisateur.
const PHASE = {
  preparation: 'En préparation',
  degustation: 'Dégustation en cours',
  revelation: 'Révélation en cours',
  revelee: 'Terminée',
};
const GROUPES = [
  ['encours', 'En cours', (s) => s.phase === 'degustation' || s.phase === 'revelation'],
  ['prepa', 'En préparation', (s) => s.phase === 'preparation'],
  ['finies', 'Terminées', (s) => s.phase === 'revelee'],
];
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

function useStandalone() {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(display-mode: standalone)');
    const check = () => setStandalone(!!(mq?.matches || window.navigator.standalone));
    check();
    mq?.addEventListener?.('change', check);
    return () => mq?.removeEventListener?.('change', check);
  }, []);
  return standalone;
}

function Installer() {
  const standalone = useStandalone();
  const [installEvt, setInstallEvt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState('autre');
  useEffect(() => {
    const ua = navigator.userAgent || '';
    setPlatform(/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /android/i.test(ua) ? 'android' : 'autre');
    try {
      navigator.serviceWorker?.register('/sw-orga.js', { scope: '/orga' }).catch(() => {});
    } catch {}
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  if (standalone) return null;
  if (installed) return <Notice kind="ok">Appli installée : ouvrez « Confrérie Orga » depuis l’écran d’accueil.</Notice>;
  return (
    <details className="panel install-card">
      <summary>Installer l’appli sur ce téléphone</summary>
      <div className="stack" style={{ marginTop: 10 }}>
        <p className="small muted">Elle s’ouvre en plein écran depuis l’icône « Confrérie Orga », directement sur vos soirées.</p>
        {installEvt ? (
          <button
            className="btn gold block"
            onClick={async () => {
              installEvt.prompt();
              const r = await installEvt.userChoice.catch(() => null);
              if (r?.outcome === 'accepted') setInstalled(true);
              setInstallEvt(null);
            }}
          >
            Installer l’appli
          </button>
        ) : platform === 'ios' ? (
          <ol className="install-steps">
            <li>
              Ouvrez cette page dans <strong>Safari</strong>.
            </li>
            <li>
              Touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut).
            </li>
            <li>
              Choisissez <strong>Sur l’écran d’accueil</strong>, puis <strong>Ajouter</strong>.
            </li>
            <li>Ouvrez l’appli « Confrérie Orga » et tapez une fois le mot de passe organisateur (l’iPhone sépare l’appli de Safari).</li>
          </ol>
        ) : platform === 'android' ? (
          <ol className="install-steps">
            <li>
              Dans <strong>Chrome</strong>, touchez le menu <strong>⋮</strong> en haut à droite.
            </li>
            <li>
              Choisissez <strong>Installer l’application</strong> (ou <strong>Ajouter à l’écran d’accueil</strong>).
            </li>
          </ol>
        ) : (
          <p className="small">Ouvrez cette page sur votre téléphone pour installer l’appli.</p>
        )}
      </div>
    </details>
  );
}

function Modifier({ s, onDone, onCancel }) {
  const [name, setName] = useState(s.name);
  const [date, setDate] = useState(s.event_date || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  return (
    <form
      className="orga-edit stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api(`/api/admin/${s.code}`, {
            method: 'POST',
            body: { action: 'edit', name, date },
          });
          onDone('Soirée modifiée.');
        } catch (err) {
          setError(err.message);
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>Nom de la soirée</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoFocus />
      </label>
      <label className="field">
        <span>Date (facultatif)</span>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <p className="tiny muted">Le code {s.code} ne change pas : les invités peuvent garder celui qu’ils ont reçu.</p>
      <Notice kind="error">{error}</Notice>
      <div className="row">
        <button className="btn sm" disabled={busy || !name.trim()}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn sm ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}

function Effacer({ s, onDone, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  return (
    <div className="orga-effacer stack" role="alertdialog" aria-label={`Effacer ${s.name}`}>
      <p className="small">
        <strong>Effacer « {s.name} » ?</strong> Participants, bouteilles, fiches, pronostics et résultats sont supprimés définitivement. Les participants n’auront plus accès à la
        soirée, même avec le code {s.code}.{s.phase === 'revelee' ? ' Elle disparaîtra aussi des archives et du palmarès.' : ''}
      </p>
      <Notice kind="error">{error}</Notice>
      <div className="row">
        <button
          className="btn sm danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await api(`/api/admin/${s.code}`, {
                method: 'POST',
                body: { action: 'deleteTasting', confirmName: s.name },
              });
              forgetSoiree(s.code);
              onDone(`« ${s.name} » a été effacée.`);
            } catch (err) {
              setError(err.message);
              setBusy(false);
            }
          }}
        >
          {busy ? 'Effacement…' : 'Effacer définitivement'}
        </button>
        <button type="button" className="btn sm ghost" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
      </div>
    </div>
  );
}

function Carte({ s, mode, setMode, onChanged }) {
  const ouvert = mode?.code === s.code ? mode.kind : null;
  const fermer = () => setMode(null);
  const fini = (msg) => {
    setMode(null);
    onChanged(msg);
  };
  return (
    <li className={`orga-carte${ouvert === 'effacer' ? ' danger' : ''}`}>
      <Link href={`/admin/${s.code}`} className="orga-soiree">
        <span className="orga-soiree-main">
          <strong>{s.name}</strong>
          <span className="tiny muted">
            {s.event_date ? `${fmtDate(s.event_date)} · ` : ''}
            {pluriel(s.participants, 'participant')} · {pluriel(s.bottles, 'bouteille')}
          </span>
        </span>
        <span className="orga-code" aria-label={`Code ${s.code}`}>
          {s.code}
        </span>
        <span aria-hidden="true">›</span>
      </Link>
      <div className="orga-actions">
        <span className={`pill ${s.phase === 'degustation' || s.phase === 'revelation' ? 'gold' : s.phase === 'revelee' ? 'green' : ''}`}>{PHASE[s.phase] || s.phase}</span>
        <button
          type="button"
          className="linklike small"
          aria-expanded={ouvert === 'modifier'}
          onClick={() => setMode(ouvert === 'modifier' ? null : { code: s.code, kind: 'modifier' })}
        >
          Modifier
        </button>
        <button
          type="button"
          className="linklike small orga-del"
          aria-expanded={ouvert === 'effacer'}
          onClick={() => setMode(ouvert === 'effacer' ? null : { code: s.code, kind: 'effacer' })}
        >
          Effacer
        </button>
      </div>
      {ouvert === 'modifier' && <Modifier s={s} onDone={fini} onCancel={fermer} />}
      {ouvert === 'effacer' && <Effacer s={s} onDone={fini} onCancel={fermer} />}
    </li>
  );
}

export default function OrgaApp() {
  const [soirees, setSoirees] = useState(null);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [mode, setMode] = useState(null); // { code, kind: 'modifier' | 'effacer' }
  const [voirTout, setVoirTout] = useState({}); // groupe -> tout afficher
  const [cherche, setCherche] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api('/api/orga/soirees');
      setSoirees(d.soirees);
      setError(null);
    } catch (e) {
      if (e.status === 401)
        window.location.reload(); // session expirée : retour à l'écran du mot de passe
      else setError(e.message || 'Pas de réseau.');
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 15000);
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  const changed = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
    load();
  };

  return (
    <main className="orga">
      <section className="orga-hero">
        <img src="/logo.webp" alt="La Confrérie du Pif" width={500} height={500} className="orga-logo petit" />
        <p className="orga-eyebrow">Appli de l’organisateur</p>
        <h1>Mes soirées</h1>
      </section>

      <div className="page stack">
        <Link href="/organiser" className="btn gold block">
          + Créer une soirée
        </Link>
        <Notice kind="ok">{flash}</Notice>
        <Notice kind="error">{error}</Notice>

        {soirees === null ? (
          !error && (
            <div className="center">
              <Spinner />
            </div>
          )
        ) : soirees.length === 0 ? (
          <div className="panel">
            <p className="small muted" style={{ margin: 0 }}>
              Aucune soirée pour l’instant. Créez la première : un code sur le thème du vin lui sera attribué, à donner aux participants.
            </p>
          </div>
        ) : (
          <>
            {soirees.length > 6 && (
              <input
                className="input"
                type="search"
                value={cherche}
                onChange={(e) => setCherche(e.target.value)}
                placeholder="Chercher une soirée (nom ou code)"
                aria-label="Chercher une soirée"
              />
            )}
            {GROUPES.map(([id, titre, test]) => {
              const q = cherche.trim().toLowerCase();
              const liste = soirees.filter(test).filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
              if (!liste.length) return null;
              const MAX = 5;
              const replie = !q && !voirTout[id] && liste.length > MAX;
              const visibles = replie ? liste.slice(0, MAX) : liste;
              return (
                <section key={id} className="panel stack" aria-labelledby={`g-${id}`}>
                  <h2 id={`g-${id}`}>
                    {titre} <span className="muted small">({liste.length})</span>
                  </h2>
                  <ul className="orga-list">
                    {visibles.map((s) => (
                      <Carte key={s.code} s={s} mode={mode} setMode={setMode} onChanged={changed} />
                    ))}
                  </ul>
                  {replie && (
                    <button type="button" className="btn ghost sm" onClick={() => setVoirTout((v) => ({ ...v, [id]: true }))}>
                      Voir les {liste.length - MAX} autres
                    </button>
                  )}
                </section>
              );
            })}
            {cherche.trim() && !soirees.some((s) => s.name.toLowerCase().includes(cherche.trim().toLowerCase()) || s.code.toLowerCase().includes(cherche.trim().toLowerCase())) && (
              <p className="small muted center">Aucune soirée ne correspond.</p>
            )}
          </>
        )}

        <Installer />

        <nav className="orga-liens" aria-label="Autres pages">
          <Link href="/archives">Archives et palmarès</Link>
          <Link href="/orga/liste-attente">Liste d’attente</Link>
          <Link href="/offre">Page de vente</Link>
          <Link href="/">Site des participants</Link>
          <button
            type="button"
            className="linklike muted"
            onClick={async () => {
              try {
                await api('/api/orga/session', { method: 'DELETE' });
              } catch {}
              window.location.reload();
            }}
          >
            Se déconnecter de ce téléphone
          </button>
        </nav>
      </div>
    </main>
  );
}
