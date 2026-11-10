'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Notice, Spinner } from './ui';
import { recentSoirees, rememberSoiree } from '@/lib/memo';

// Appli de l'organisateur (installée sur l'écran d'accueil) : ses soirées, la création
// d'une soirée, et la connexion avec le lien organisateur.
const PHASE = {
  preparation: 'En préparation',
  degustation: 'Dégustation en cours',
  revelation: 'Révélation en cours',
  revelee: 'Terminée',
};
const PHASE_COURT = { preparation: 'Prépa', degustation: 'En cours', revelation: 'Révélation', revelee: 'Terminée' };

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

export default function OrgaApp() {
  const router = useRouter();
  const standalone = useStandalone();
  const [soirees, setSoirees] = useState(null);
  const [status, setStatus] = useState({}); // code -> { ok, phase, name, participants, bottles }
  const [installEvt, setInstallEvt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState('autre');
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState(null);
  const [busy, setBusy] = useState(false);

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

  // Soirées organisées sur ce téléphone, avec leur état en direct.
  useEffect(() => {
    const list = recentSoirees().filter((x) => x.role === 'organisateur');
    setSoirees(list);
    let alive = true;
    const load = () =>
      list.forEach((x) =>
        api(`/api/admin/${x.code}`)
          .then((d) => alive && setStatus((s) => ({ ...s, [x.code]: { ok: true, phase: d.tasting.phase, name: d.tasting.name, participants: d.participants?.length || 0, bottles: d.bottles?.length || 0 } })))
          .catch((e) => alive && setStatus((s) => ({ ...s, [x.code]: { ok: false, gone: e.status === 404, relog: e.status === 401 } })))
      );
    load();
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  async function openLink(e) {
    e.preventDefault();
    setLinkError(null);
    const m = String(link).match(/admin\/([A-Za-z0-9]{5})\?cle=([^&\s#]+)/);
    if (!m) return setLinkError('Ce n’est pas un lien organisateur. Il ressemble à : …/admin/ABCDE?cle=…');
    const code = m[1].toUpperCase();
    setBusy(true);
    try {
      await api(`/api/admin/${code}/login`, { method: 'POST', body: { key: decodeURIComponent(m[2]) } });
      const d = await api(`/api/admin/${code}`);
      rememberSoiree({ code, name: d.tasting.name, role: 'organisateur' });
      router.push(`/admin/${code}`);
    } catch (err) {
      setLinkError(err.status === 404 ? 'Cette soirée n’existe pas (ou a été effacée).' : err.message);
      setBusy(false);
    }
  }

  const showInstall = !standalone && !installed;

  return (
    <main className="orga">
      <section className="orga-hero">
        <img src="/logo.webp" alt="La Confrérie du Pif" width={500} height={500} className="orga-logo" />
        <p className="orga-eyebrow">Appli de l’organisateur</p>
        <h1>Espace organisateur</h1>
      </section>

      <div className="page stack">
        {showInstall && (
          <div className="panel stack install-card">
            <h2>Installer l’appli sur ce téléphone</h2>
            <p className="small muted">Elle s’ouvre en plein écran depuis l’icône « Confrérie Orga », directement sur vos soirées. Réservée à l’organisateur : les invités, eux, utilisent simplement le lien de la soirée.</p>
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
                <li>Ouvrez l’appli « Confrérie Orga » et collez votre lien organisateur ci-dessous (l’iPhone sépare l’appli de Safari : il faut s’y reconnecter une fois).</li>
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
        )}
        {installed && !standalone && <Notice kind="ok">Appli installée : ouvrez « Confrérie Orga » depuis l’écran d’accueil.</Notice>}

        <div className="panel stack">
          <h2>Mes soirées</h2>
          {soirees === null ? (
            <Spinner />
          ) : soirees.length === 0 ? (
            <p className="small muted">Aucune soirée sur ce téléphone pour l’instant. Créez-en une, ou ouvrez votre lien organisateur ci-dessous.</p>
          ) : (
            <ul className="orga-list">
              {soirees.map((x) => {
                const st = status[x.code];
                return (
                  <li key={x.code}>
                    <Link href={`/admin/${x.code}`} className="orga-soiree">
                      <span className="orga-soiree-main">
                        <strong>{st?.name || x.name || `Soirée ${x.code}`}</strong>
                        <span className="tiny muted">
                          Code {x.code}
                          {st?.ok ? ` · ${PHASE[st.phase] || st.phase} · ${st.participants} participant${st.participants > 1 ? 's' : ''} · ${st.bottles} bouteille${st.bottles > 1 ? 's' : ''}` : ''}
                        </span>
                        {st && !st.ok && <span className="tiny" style={{ color: 'var(--erreur)' }}>{st.gone ? 'Soirée introuvable (effacée ?)' : st.relog ? 'Reconnexion nécessaire : collez le lien organisateur' : 'Pas de réseau'}</span>}
                      </span>
                      {st?.ok && <span className={`pill ${st.phase === 'degustation' ? 'gold' : ''}`}>{PHASE_COURT[st.phase] || st.phase}</span>}
                      <span aria-hidden="true">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/organiser" className="btn block">
            Créer une nouvelle soirée
          </Link>
        </div>

        <form className="panel stack" onSubmit={openLink}>
          <h2>Ouvrir avec mon lien organisateur</h2>
          <p className="small muted">Le lien secret reçu à la création de la soirée (aussi disponible dans l’onglet Soirée de l’espace organisateur, sur un appareil déjà connecté).</p>
          <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Collez le lien ici" aria-label="Lien organisateur" autoComplete="off" />
          <Notice kind="error">{linkError}</Notice>
          <button className="btn ghost block" disabled={busy || !link.trim()}>
            {busy ? 'Connexion…' : 'Ouvrir la soirée'}
          </button>
        </form>

        <div className="row" style={{ justifyContent: 'center', gap: 18 }}>
          <Link href="/archives" className="small">
            Archives et palmarès
          </Link>
          <Link href="/orga/liste-attente" className="small">
            Liste d’attente
          </Link>
          <Link href="/offre" className="small">
            Page de vente
          </Link>
          <Link href="/" className="small muted">
            Site des participants
          </Link>
        </div>
      </div>
    </main>
  );
}
