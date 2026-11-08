'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, usePolling, Band, Notice, Capsule, Chips, Loading, fmtDate } from './ui';
import BottleForm from './BottleForm';
import QrCode from './QrCode';

const PHASE_LABEL = {
  preparation: 'En préparation',
  degustation: 'Dégustation en cours',
  revelation: 'Révélation en cours',
  revelee: 'Bouteilles révélées',
};

const TABS = [
  ['accueil', 'Soirée'],
  ['participants', 'Participants'],
  ['bouteilles', 'Bouteilles'],
  ['suivi', 'Suivi'],
  ['revelation', 'Révélation'],
];

export default function AdminApp({ code }) {
  const [authed, setAuthed] = useState(null); // null = vérification en cours
  const [tab, setTab] = useState('accueil');
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Connexion via le lien organisateur (?cle=...)
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('cle');
    (async () => {
      if (key) {
        try {
          await api(`/api/admin/${code}/login`, { method: 'POST', body: { key } });
          window.history.replaceState(null, '', `/admin/${code}`);
        } catch (e) {
          setError(e.message);
        }
      }
      try {
        await api(`/api/admin/${code}`);
        setAuthed(true);
      } catch (e) {
        setAuthed(false);
        if (e.status !== 401) setError(e.message);
      }
    })();
  }, [code]);

  const { data, setData, error: pollError } = usePolling(
    () => (authed ? api(`/api/admin/${code}`) : Promise.resolve(null)),
    4000,
    [authed, code]
  );

  async function act(action, payload = {}, okMsg) {
    setBusy(true);
    setError(null);
    try {
      const d = await api(`/api/admin/${code}`, { method: 'POST', body: { action, ...payload } });
      setData(d);
      if (okMsg) {
        setFlash(okMsg);
        setTimeout(() => setFlash(null), 2500);
      }
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) return <Loading />;
  if (!authed) return <AdminLogin code={code} error={error} onDone={() => window.location.reload()} />;
  if (!data) return <Loading />;

  const { tasting } = data;
  const ctx = { data, act, busy, code, setTab };

  return (
    <main>
      <Band
        wide
        title={tasting.name}
        sub={`Organisateur · ${PHASE_LABEL[tasting.phase]}${tasting.event_date ? ` · ${fmtDate(tasting.event_date)}` : ''}`}
      />
      <div className="page wide">
        <div className="sticky-tabs">
          <nav className="tabs" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="stack">
          <Notice kind="error">{error || (pollError && pollError.status !== 401 ? 'Connexion perdue, nouvelle tentative…' : null)}</Notice>
          <Notice kind="ok">{flash}</Notice>
          {tab === 'accueil' && <TabHome {...ctx} />}
          {tab === 'participants' && <TabParticipants {...ctx} />}
          {tab === 'bouteilles' && <TabBottles {...ctx} />}
          {tab === 'suivi' && <TabProgress {...ctx} />}
          {tab === 'revelation' && <TabReveal {...ctx} />}
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------
function AdminLogin({ code, error: initialError, onDone }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState(initialError);
  return (
    <main>
      <Band title="Espace organisateur" sub={`Soirée ${code}`} back="/" />
      <form
        className="page stack"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const k = key.includes('cle=') ? new URL(key).searchParams.get('cle') : key;
            await api(`/api/admin/${code}/login`, { method: 'POST', body: { key: k } });
            onDone();
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        <div className="panel stack">
          <p>Ouvrez le lien organisateur reçu à la création de la soirée, ou collez-le ci-dessous.</p>
          <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Lien ou clé organisateur" />
          <Notice kind="error">{error}</Notice>
          <button className="btn block" disabled={!key.trim()}>
            Accéder
          </button>
        </div>
      </form>
    </main>
  );
}

// ---------------------------------------------------------------
function TabHome({ data, act, busy, code, setTab }) {
  const { tasting, participants, bottles } = data;
  const [copied, setCopied] = useState(false);
  const [bigQr, setBigQr] = useState(false);
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${code}` : '';
  const numbered = bottles.length > 0 && bottles.every((b) => b.number);
  const connected = participants.filter((p) => p.connected).length;
  const without = participants.filter((p) => p.bottles === 0).length;

  const steps = [
    { done: participants.length > 0, text: `${participants.length} participant${participants.length > 1 ? 's' : ''} inscrit${participants.length > 1 ? 's' : ''}`, tab: 'participants' },
    { done: bottles.length > 0, text: `${bottles.length} bouteille${bottles.length > 1 ? 's' : ''} enregistrée${bottles.length > 1 ? 's' : ''} par les participants${without ? ` (${without} sans bouteille)` : ''}`, tab: 'bouteilles' },
    { done: numbered, text: numbered ? 'Numéros anonymes attribués' : 'Numéros attribués automatiquement au lancement', tab: 'bouteilles' },
  ];

  return (
    <>
      <div className="panel center stack">
        <div className="muted">Scannez pour rejoindre la soirée</div>
        {joinUrl && <QrCode text={joinUrl} size={200} />}
        <button className="btn gold" onClick={() => setBigQr(true)}>
          Afficher en grand
        </button>
        <div className="muted">ou tapez le code</div>
        <div className="access-code">{tasting.code}</div>
        <div className="small muted">
          ou le lien direct : <strong>{joinUrl.replace(/^https?:\/\//, '')}</strong>
        </div>
        <button
          className="btn ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(joinUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
        >
          {copied ? 'Lien copié' : 'Copier le lien à partager'}
        </button>
        <div className="small">
          {connected} / {participants.length} participants connectés sur leur téléphone
        </div>
      </div>

      {bigQr && (
        <div className="overlay" role="dialog" aria-label="QR code en grand" onClick={() => setBigQr(false)}>
          <h2>{tasting.name}</h2>
          <div style={{ background: 'var(--papier)', padding: 12, borderRadius: 16 }}>
            <QrCode text={joinUrl} size={Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 80 : 320)} />
          </div>
          <div>Scannez avec l’appareil photo de votre téléphone</div>
          <div className="access-code">{tasting.code}</div>
          <button className="btn gold">Fermer</button>
        </div>
      )}

      {tasting.phase === 'preparation' && (
        <div className="panel stack">
          <h2>Préparer la soirée</h2>
          {steps.map((s, i) => (
            <div key={i} className="row">
              <span className={`dot ${s.done ? 'full' : ''}`} aria-hidden="true" />
              <span className="grow">{s.text}</span>
              <button className="linklike small" onClick={() => setTab(s.tab)}>
                Ouvrir
              </button>
            </div>
          ))}
          <button className="btn gold block" disabled={busy} onClick={() => act('start', {}, 'La dégustation est lancée.')}>
            Lancer la dégustation
          </button>
          <p className="tiny muted center">Vous pouvez lancer dès la première bouteille : les suivantes s’ajouteront au fur et à mesure.</p>
        </div>
      )}

      {tasting.phase === 'degustation' && (
        <div className="panel stack">
          <h2>Vin en cours de service</h2>
          <p className="small muted">
            Touchez le numéro que vous servez : il passe en tête de liste et s’affiche « en cours » sur tous les téléphones.
          </p>
          <ServePicker data={data} act={act} busy={busy} />
          <div className="row">
            <button className="btn gold" onClick={() => setTab('revelation')}>
              Révéler un vin
            </button>
            <button className="btn" onClick={() => setTab('suivi')}>
              Voir le suivi
            </button>
            {!(tasting.revealed_numbers || []).length && (
              <button className="btn ghost" disabled={busy} onClick={() => act('pause', {}, 'Retour en préparation.')}>
                Repasser en préparation
              </button>
            )}
          </div>
        </div>
      )}

      {tasting.phase === 'revelation' && (
        <div className="panel stack">
          <h2>Révélation en cours</h2>
          <button className="btn gold block" onClick={() => setTab('revelation')}>
            Continuer la révélation
          </button>
        </div>
      )}

      {tasting.phase === 'revelee' && (
        <div className="panel stack">
          <h2>Les bouteilles sont révélées</h2>
          <Link className="btn gold block" href={`/t/${code}/resultats`}>
            Voir les résultats
          </Link>
        </div>
      )}

      <DeleteTasting code={code} name={tasting.name} />

      <div className="panel stack">
        <h2>Sauvegarde</h2>
        <p className="small muted">Téléchargez à tout moment une copie complète de la soirée (participants, bouteilles, fiches, pronostics).</p>
        <a className="btn ghost" href={`/api/admin/${code}/export`}>
          Télécharger la sauvegarde
        </a>
      </div>
    </>
  );
}

// ---------------------------------------------------------------
function TabParticipants({ data, act, busy }) {
  const { participants, tasting } = data;
  const [names, setNames] = useState('');
  const bottlesOf = (id) => participants.find((p) => p.id === id)?.bottles ?? 0;

  return (
    <>
      <form
        className="panel stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const list = names.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
          if (list.length && (await act('addParticipants', { names: list }, 'Participants ajoutés.'))) setNames('');
        }}
      >
        <h2>Ajouter des participants</h2>
        <textarea className="input" rows={3} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Un prénom par ligne'} />
        <button className="btn" disabled={busy || !names.trim()}>
          Ajouter
        </button>
      </form>

      <div className="panel flush">
        {participants.length === 0 && <div className="item muted">Aucun participant pour l’instant.</div>}
        {participants.map((p) => (
          <div key={p.id} className="item">
            <div className="grow">
              <div className="name">{p.name}</div>
              <div className="row tiny" style={{ marginTop: 4, gap: 6 }}>
                {p.connected ? <span className="pill green">Connecté</span> : <span className="pill">Pas encore connecté</span>}
                <span className="pill">{bottlesOf(p.id)} bouteille{bottlesOf(p.id) > 1 ? 's' : ''}</span>
                {p.hors_concours && <span className="pill red">Hors concours</span>}
              </div>
              <label className="row small" style={{ marginTop: 8, gap: 8 }}>
                <input
                  type="checkbox"
                  checked={p.hors_concours}
                  onChange={(e) => act('updateParticipant', { id: p.id, hors_concours: e.target.checked })}
                />
                Hors concours pour les pronostics
              </label>
            </div>
            <div className="actions">
              {p.connected && (
                <button
                  className="btn ghost sm"
                  onClick={() => confirm(`Libérer « ${p.name} » ? Il pourra se reconnecter depuis un autre téléphone, ses notes sont conservées.`) && act('releaseParticipant', { id: p.id }, 'Nom libéré.')}
                >
                  Libérer
                </button>
              )}
              <button
                className="btn ghost sm"
                onClick={() => {
                  const n = prompt('Nouveau nom', p.name);
                  if (n && n.trim() && n.trim() !== p.name) act('updateParticipant', { id: p.id, name: n.trim() });
                }}
              >
                Renommer
              </button>
              {tasting.phase !== 'revelee' && (
                <button
                  className="btn ghost sm"
                  onClick={() => confirm(`Supprimer « ${p.name} » et toutes ses notes ?`) && act('deleteParticipant', { id: p.id }, 'Participant supprimé.')}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="tiny muted">
        « Libérer » sert si quelqu’un change de téléphone ou ferme son navigateur : il pourra choisir à nouveau son nom. Un participant peut aussi s’ajouter lui-même en rejoignant la soirée.
      </p>
    </>
  );
}

// ---------------------------------------------------------------
function bottleLine(b) {
  return [b.appellation, b.grapes, b.region, b.country, b.color, b.vintage].filter(Boolean).join(', ');
}

function TabBottles({ data, act, busy }) {
  const { bottles, participants, tasting } = data;
  const [editing, setEditing] = useState(null);
  const prep = tasting.phase === 'preparation';
  const revealed = tasting.phase === 'revelee';
  const missing = bottles.filter((b) => !b.number).length;
  const ownerName = (id) => participants.find((p) => p.id === id)?.name;

  return (
    <>
      {!revealed && (
        <Notice kind="info">
          Chaque participant enregistre ses bouteilles depuis son téléphone. Vous ne voyez ni leur contenu ni leur propriétaire : seulement leur nombre et leur numéro.
        </Notice>
      )}

      <div className="panel flush">
        <div className="item" style={{ display: 'block' }}>
          <h2 style={{ margin: 0 }}>Bouteilles par participant</h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {bottles.length} bouteille{bottles.length > 1 ? 's' : ''} au total
          </p>
        </div>
        {participants.map((p) => (
          <div key={p.id} className="item" style={{ alignItems: 'center' }}>
            <div className="grow name">{p.name}</div>
            {p.bottles > 0 ? <span className="pill green">{p.bottles} bouteille{p.bottles > 1 ? 's' : ''}</span> : <span className="pill red">Aucune</span>}
          </div>
        ))}
      </div>

      {prep && (
        <div className="panel stack">
          <h2>Numéros anonymes</h2>
          <p className="small muted">
            Les numéros sont attribués au hasard automatiquement au lancement de la dégustation. Vous pouvez aussi les tirer dès maintenant, pour que chacun puisse étiqueter sa bouteille masquée (chaussette, papier aluminium) avant de commencer.
          </p>
          <div className="row">
            <button
              className="btn gold"
              disabled={busy || !bottles.length}
              onClick={() => (!tasting.numbers_drawn || confirm('Retirer au sort TOUS les numéros ? Les étiquettes déjà posées seront fausses.')) && act('drawNumbers', { mode: 'all' }, 'Numéros tirés au sort.')}
            >
              {tasting.numbers_drawn ? 'Retirer tous les numéros' : 'Tirer les numéros au sort'}
            </button>
            {tasting.numbers_drawn && missing > 0 && (
              <button className="btn" disabled={busy} onClick={() => act('drawNumbers', { mode: 'missing' }, 'Nouvelles bouteilles numérotées.')}>
                Numéroter les {missing} nouvelle{missing > 1 ? 's' : ''}
              </button>
            )}
          </div>
          {bottles.length > 0 && (
            <div className="row" style={{ gap: 8 }}>
              {bottles.map((b) => (
                <Capsule key={b.id} n={b.number} size="xs" />
              ))}
            </div>
          )}
        </div>
      )}

      {tasting.phase === 'degustation' && (
        <div className="panel stack">
          <h2>Numéros</h2>
          <p className="small muted">
            Une bouteille ajoutée pendant la dégustation reçoit automatiquement le numéro suivant et apparaît aussitôt sur tous les téléphones. Son propriétaire voit le numéro à écrire dessus.
          </p>
          <div className="row" style={{ gap: 8 }}>
            {bottles.map((b) => (
              <Capsule key={b.id} n={b.number} size="xs" />
            ))}
          </div>
        </div>
      )}

      {revealed && (
        <div className="panel flush">
          <div className="item" style={{ display: 'block' }}>
            <h2 style={{ margin: 0 }}>Bouteilles révélées</h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>Vous pouvez corriger une faute : les classements se recalculent.</p>
          </div>
          {bottles.map((b) =>
            editing === b.id ? (
              <div key={b.id} className="item" style={{ display: 'block' }}>
                <BottleForm
                  initial={b}
                  busy={busy}
                  onCancel={() => setEditing(null)}
                  onSave={async (x) => (await act('updateBottle', { id: b.id, bottle: x }, 'Bouteille corrigée.')) && setEditing(null)}
                />
              </div>
            ) : (
              <div key={b.id} className="item">
                <Capsule n={b.number} size="sm" />
                <div className="grow">
                  <div className="name">{[b.producer, b.wine_name !== b.producer ? b.wine_name : null].filter(Boolean).join(', ')}</div>
                  <div className="small muted">{bottleLine(b)}</div>
                  <div className="tiny">{ownerName(b.owner_id) ? `Apportée par ${ownerName(b.owner_id)}` : ''}</div>
                </div>
                <div className="actions">
                  <button className="btn ghost sm" onClick={() => setEditing(b.id)}>
                    Corriger
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------
function TabProgress({ data }) {
  const { participants, bottles, progress } = data;
  const ordered = [...bottles].sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
  const has = (list, p, b) => list.some(([pp, bb]) => pp === p && bb === b);
  const totalCells = participants.length * bottles.length || 1;
  const notes = progress.ratings.length;
  const preds = progress.predictions.length;

  return (
    <>
      <div className="panel">
        <h2>Avancement en direct</h2>
        <p className="small muted">Mis à jour automatiquement toutes les quelques secondes.</p>
        <div className="legend small">
          <span><span className="dot full" /> note et pronostic</span>
          <span><span className="dot half" /> l’un des deux</span>
          <span><span className="dot" /> rien</span>
        </div>
        <p className="small" style={{ marginTop: 10 }}>
          {notes} notes sur {participants.length * bottles.length} · {preds} pronostics ({Math.round((preds / totalCells) * 100)} %)
        </p>
      </div>
      <div className="panel flush table-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th>Participant</th>
              {ordered.map((b) => (
                <th key={b.id}>
                  <Capsule n={b.number} size="xs" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.name} {!p.connected && <span className="tiny muted">(hors ligne)</span>}
                </td>
                {ordered.map((b) => {
                  const r = has(progress.ratings, p.id, b.id);
                  const pr = has(progress.predictions, p.id, b.id);
                  return (
                    <td key={b.id}>
                      <span className={`dot ${r && pr ? 'full' : r || pr ? 'half' : ''}`} title={`${r ? 'Noté' : 'Pas noté'}, ${pr ? 'pronostic fait' : 'pas de pronostic'}`} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------------------------------------------------------
function ServePicker({ data, act, busy }) {
  const { tasting, bottles } = data;
  const served = new Set(tasting.served_numbers || []);
  const shown = new Set(tasting.revealed_numbers || []);
  const numbers = bottles.map((b) => b.number).filter(Boolean).sort((a, b) => a - b);
  if (!numbers.length) return <p className="small muted">Aucune bouteille pour l’instant.</p>;
  return (
    <>
      <div className="serve-grid">
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            className={`serve-btn ${tasting.current_number === n ? 'current' : served.has(n) ? 'served' : ''}`}
            disabled={busy || shown.has(n)}
            aria-pressed={tasting.current_number === n}
            aria-label={`Servir le vin n°${n}`}
            onClick={() => act('serve', { number: n }, `On sert le n°${n}.`)}
          >
            <Capsule n={n} size="sm" />
            {shown.has(n) ? <span className="tag" style={{ background: 'var(--bordeaux)' }}>révélé</span> : tasting.current_number === n ? <span className="tag">en cours</span> : served.has(n) ? <span className="tag" style={{ background: 'var(--trait-fort)' }}>servi</span> : null}
          </button>
        ))}
      </div>
      {tasting.current_number && (
        <button className="linklike small" disabled={busy} onClick={() => act('serve', { number: null }, 'Plus de vin en cours.')}>
          Aucun vin en cours (pause)
        </button>
      )}
    </>
  );
}

function TabReveal({ data, act, busy, code }) {
  const { tasting, participants, bottles, progress } = data;
  const [armed, setArmed] = useState(null);
  const done = tasting.revealed_numbers || [];

  if (tasting.phase === 'revelee') {
    return (
      <div className="panel stack center">
        <h2>Révélation terminée</h2>
        <p>Les fiches et pronostics sont verrouillés. Chacun peut consulter les résultats sur son téléphone.</p>
        <Link className="btn gold block" href={`/t/${code}/resultats`}>
          Ouvrir les résultats
        </Link>
        <a className="btn ghost block" href={`/api/admin/${code}/export`}>
          Télécharger la sauvegarde finale
        </a>
      </div>
    );
  }

  if (tasting.phase === 'preparation') {
    return (
      <div className="panel">
        <h2>Pas encore</h2>
        <p className="muted">Lancez d’abord la dégustation depuis l’onglet Soirée.</p>
      </div>
    );
  }

  if (tasting.phase === 'revelation') {
    const left = bottles.filter((b) => b.number && !done.includes(b.number)).sort((a, b) => a.number - b.number);
    const shown = done.map((n) => bottles.find((b) => b.number === n)).filter(Boolean);
    return (
      <>
        <div className="panel stack">
          <h2>Révélation vin par vin</h2>
          <p className="small">
            {done.length} bouteille{done.length > 1 ? 's' : ''} révélée{done.length > 1 ? 's' : ''} sur {bottles.length}. Chaque révélation s’affiche sur tous les téléphones après un compte à rebours, avec les points de chacun et le classement provisoire.
          </p>
          {left.length > 0 ? (
            <>
              <button className="btn gold block" disabled={busy} onClick={() => act('revealNext', {}, 'Bouteille révélée.')}>
                Révéler la bouteille suivante
              </button>
              <p className="tiny muted center">Du moins bien noté au mieux noté : le meilleur vin est révélé en dernier.</p>
              <details>
                <summary className="small">Ou choisir la bouteille à révéler</summary>
                <div className="serve-grid" style={{ marginTop: 10 }}>
                  {left.map((b) => (
                    <button key={b.id} type="button" className="serve-btn" disabled={busy} aria-label={`Révéler le vin n°${b.number}`} onClick={() => act('revealNumber', { number: b.number }, `Vin n°${b.number} révélé.`)}>
                      <Capsule n={b.number} size="sm" />
                    </button>
                  ))}
                </div>
              </details>
            </>
          ) : (
            <Notice kind="ok">Tous les vins sont révélés. Place au podium !</Notice>
          )}
          {left.length === 0 && (
            <button className="btn gold block" disabled={busy} onClick={() => act('finishReveal', { confirm: true }, 'Classements affichés.')}>
              Afficher les classements et le podium
            </button>
          )}
          <Link className="small center" href={`/t/${code}/resultats`}>
            Ouvrir l’écran de révélation (à projeter sur une télévision)
          </Link>
        </div>
        {shown.length > 0 && (
          <div className="panel flush">
            {[...shown].reverse().map((b) => (
              <div key={b.id} className="item">
                <Capsule n={b.number} size="sm" />
                <div className="grow">
                  <div className="name">{[b.producer, b.wine_name !== b.producer ? b.wine_name : null].filter(Boolean).join(', ')}</div>
                  <div className="small muted">{bottleLine(b)}</div>
                  {b.owner_name && <div className="tiny">Apportée par {b.owner_name}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // Dégustation en cours : les vins sont révélés un par un, au fil de la soirée.
  // D'autres bouteilles peuvent encore être ajoutées et servies après chaque révélation.
  const served = tasting.served_numbers || [];
  const numbered = bottles.filter((b) => b.number).sort((a, b) => a.number - b.number);
  const canReveal = numbered.filter((b) => served.includes(b.number) && !done.includes(b.number));
  const revealedList = done.map((n) => bottles.find((b) => b.number === n)).filter(Boolean);
  const notServed = numbered.filter((b) => !served.includes(b.number) && !done.includes(b.number));
  const allDone = numbered.length > 0 && numbered.every((b) => done.includes(b.number));
  const stats = (b) => ({
    fiches: progress.ratings.filter(([, bid]) => bid === b.id).length,
    pronos: progress.predictions.filter(([, bid]) => bid === b.id).length,
  });
  const target = armed && armed !== 'finish' ? numbered.find((b) => b.number === armed) : null;
  return (
    <>
      <div className="panel stack">
        <h2>Révéler un vin</h2>
        <p className="small">
          {done.length} vin{done.length > 1 ? 's' : ''} révélé{done.length > 1 ? 's' : ''} sur {numbered.length}. Révélez chaque vin quand tout le monde l’a goûté : il s’affiche sur tous les téléphones après un compte à rebours, avec les points de chacun et le classement provisoire. Sa fiche et ses pronostics sont alors verrouillés. Les autres vins restent ouverts, et d’autres bouteilles peuvent encore être ajoutées.
        </p>
        {target ? (
          <div className="stack">
            <Notice kind="info">
              Révéler le vin n°{target.number} ? {stats(target).fiches} fiche{stats(target).fiches > 1 ? 's' : ''} et {stats(target).pronos} pronostic{stats(target).pronos > 1 ? 's' : ''} enregistrés sur {participants.length} participants. Ensuite, plus personne ne pourra modifier sa fiche ni son pronostic sur ce vin.
            </Notice>
            <button className="btn danger block" disabled={busy} onClick={async () => (await act('revealNumber', { number: target.number }, `Vin n°${target.number} révélé.`)) && setArmed(null)}>
              Oui, révéler le vin n°{target.number}
            </button>
            <button className="btn ghost block" onClick={() => setArmed(null)}>
              Pas encore
            </button>
          </div>
        ) : canReveal.length > 0 ? (
          <>
            {tasting.current_number && canReveal.some((b) => b.number === tasting.current_number) && (
              <button className="btn gold block" onClick={() => setArmed(tasting.current_number)}>
                Révéler le vin en cours (n°{tasting.current_number})
              </button>
            )}
            <div className="small muted">Ou touchez le vin servi à révéler :</div>
            <div className="serve-grid">
              {canReveal.map((b) => (
                <button key={b.id} type="button" className="serve-btn" disabled={busy} aria-label={`Révéler le vin n°${b.number}`} onClick={() => setArmed(b.number)}>
                  <Capsule n={b.number} size="sm" />
                  <span className="tag" style={{ background: 'var(--trait-fort)' }}>
                    {stats(b).fiches}/{participants.length}
                  </span>
                </button>
              ))}
            </div>
            <p className="tiny muted">Le chiffre sous chaque vin : nombre de fiches remplies sur le nombre de participants.</p>
          </>
        ) : (
          <p className="small muted">{notServed.length ? 'Servez un vin (onglet Soirée) pour pouvoir le révéler.' : allDone ? 'Tous les vins servis sont révélés.' : 'Aucun vin servi pour l’instant.'}</p>
        )}
        <Link className="small center" href={`/t/${code}/resultats`}>
          Ouvrir l’écran de révélation (à projeter sur une télévision)
        </Link>
      </div>

      {revealedList.length > 0 && (
        <div className="panel flush">
          {[...revealedList].reverse().map((b) => (
            <div key={b.id} className="item">
              <Capsule n={b.number} size="sm" />
              <div className="grow">
                <div className="name">{[b.producer, b.wine_name !== b.producer ? b.wine_name : null].filter(Boolean).join(', ')}</div>
                <div className="small muted">{bottleLine(b)}</div>
                {b.owner_name && <div className="tiny">Apportée par {b.owner_name}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel stack">
        <h2>Fin de la soirée</h2>
        {allDone ? (
          armed === 'finish' ? (
            <>
              <Notice kind="info">Plus aucune bouteille ne pourra être ajoutée. Les classements définitifs et le podium s’affichent sur tous les téléphones.</Notice>
              <button className="btn danger block" disabled={busy} onClick={async () => (await act('finishReveal', { confirm: true }, 'Classements affichés.')) && setArmed(null)}>
                Confirmer : afficher les classements et le podium
              </button>
              <button className="btn ghost block" onClick={() => setArmed(null)}>
                Annuler
              </button>
            </>
          ) : (
            <button className="btn gold block" onClick={() => setArmed('finish')}>
              Afficher les classements et le podium
            </button>
          )
        ) : (
          <p className="small muted">
            Quand tous les vins seront révélés ({numbered.length - done.length} restant{numbered.length - done.length > 1 ? 's' : ''}), vous pourrez afficher les classements définitifs et le podium.
          </p>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------
function DeleteTasting({ code, name }) {
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState(null);
  return (
    <details className="panel">
      <summary>Supprimer cette soirée</summary>
      <div className="stack" style={{ marginTop: 12 }}>
        <p className="small muted">
          Pour effacer une soirée de test, par exemple. Tout est supprimé définitivement : participants, bouteilles, fiches, pronostics et résultats. Elle disparaît aussi des archives et du palmarès.
        </p>
        {!armed ? (
          <button className="btn ghost" onClick={() => setArmed(true)}>
            Je veux supprimer cette soirée
          </button>
        ) : (
          <>
            <label className="field">
              <span>Recopiez le nom de la soirée pour confirmer : {name}</span>
              <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Nom de la soirée à supprimer" />
            </label>
            <Notice kind="error">{error}</Notice>
            <button
              className="btn danger"
              disabled={typed.trim() !== name}
              onClick={async () => {
                try {
                  await api(`/api/admin/${code}`, { method: 'POST', body: { action: 'deleteTasting', confirmName: typed } });
                  window.location.href = '/';
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Supprimer définitivement
            </button>
          </>
        )}
      </div>
    </details>
  );
}
