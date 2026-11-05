'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, usePolling, Band, Notice, Capsule, Chips, Loading, fmtDate } from './ui';
import { COLORS, REGIONS, PRICE_RANGES, GRAPES } from '@/lib/constants';

const PHASE_LABEL = {
  preparation: 'En préparation',
  degustation: 'Dégustation en cours',
  revelee: 'Bouteilles révélées',
};

const TABS = [
  ['accueil', 'Soirée'],
  ['participants', 'Participants'],
  ['bouteilles', 'Bouteilles'],
  ['service', 'Ordre'],
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
          {tab === 'service' && <TabOrder {...ctx} />}
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
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${code}` : '';
  const numbered = bottles.length > 0 && bottles.every((b) => b.number);
  const connected = participants.filter((p) => p.connected).length;
  const owners = bottles.filter((b) => b.owner_id).length;

  const steps = [
    { done: participants.length > 0, text: `${participants.length} participant${participants.length > 1 ? 's' : ''} inscrit${participants.length > 1 ? 's' : ''}`, tab: 'participants' },
    { done: bottles.length > 0, text: `${bottles.length} bouteille${bottles.length > 1 ? 's' : ''} enregistrée${bottles.length > 1 ? 's' : ''}${bottles.length ? `, ${owners} avec propriétaire` : ''}`, tab: 'bouteilles' },
    { done: numbered, text: numbered ? 'Numéros anonymes tirés au sort' : 'Numéros anonymes à tirer au sort', tab: 'bouteilles' },
    { done: bottles.length > 0 && bottles.every((b) => b.serve_order), text: 'Ordre de service défini', tab: 'service' },
  ];

  return (
    <>
      <div className="panel center stack">
        <div className="muted">Code d’accès des participants</div>
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
          <button className="btn gold block" disabled={busy || !numbered} onClick={() => act('start', {}, 'La dégustation est lancée.')}>
            Lancer la dégustation
          </button>
          {!numbered && <p className="tiny muted center">Le lancement nécessite au moins une bouteille et des numéros tirés au sort.</p>}
        </div>
      )}

      {tasting.phase === 'degustation' && (
        <div className="panel stack">
          <h2>Dégustation en cours</h2>
          <p>Les participants voient les numéros des vins et remplissent leurs fiches. Suivez leur avancement dans l’onglet Suivi.</p>
          <div className="row">
            <button className="btn" onClick={() => setTab('suivi')}>
              Voir le suivi
            </button>
            <button className="btn ghost" disabled={busy} onClick={() => act('pause', {}, 'Retour en préparation.')}>
              Repasser en préparation
            </button>
          </div>
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
  const { participants, bottles, tasting } = data;
  const [names, setNames] = useState('');
  const bottlesOf = (id) => bottles.filter((b) => b.owner_id === id).length;

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
                Hors concours pour les pronostics (connaît les bouteilles)
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
const EMPTY_BOTTLE = { wine_name: '', producer: '', owner_id: '', color: null, grapes: '', region: '', appellation: '', vintage: '', price_range: null, notes: '' };

function BottleForm({ initial, participants, onSave, onCancel, busy }) {
  const [b, setB] = useState({ ...EMPTY_BOTTLE, ...initial, vintage: initial?.vintage ?? '', owner_id: initial?.owner_id ?? '' });
  const set = (k) => (v) => setB((x) => ({ ...x, [k]: v?.target ? v.target.value : v }));
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(b);
      }}
    >
      <label className="field">
        <span>Nom du vin ou de la cuvée *</span>
        <input className="input" value={b.wine_name} onChange={set('wine_name')} required maxLength={120} />
      </label>
      <label className="field">
        <span>Domaine, château ou maison</span>
        <input className="input" value={b.producer || ''} onChange={set('producer')} maxLength={120} />
      </label>
      <label className="field">
        <span>Apportée par</span>
        <select className="input" value={b.owner_id || ''} onChange={set('owner_id')}>
          <option value="">Choisir un participant</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="field">
        <span className="chip-group-label" style={{ fontWeight: 600, color: 'var(--encre)', fontSize: '0.9rem' }}>
          Couleur
        </span>
        <Chips options={COLORS} value={b.color} onChange={set('color')} />
      </div>
      <label className="field">
        <span>Cépage(s)</span>
        <input className="input" list="grapes-list" value={b.grapes || ''} onChange={set('grapes')} placeholder="Ex : Syrah, Grenache" maxLength={160} />
      </label>
      <div className="grid2 collapse">
        <label className="field">
          <span>Région</span>
          <select className="input" value={b.region || ''} onChange={set('region')}>
            <option value="">Choisir</option>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Millésime</span>
          <input className="input" type="number" inputMode="numeric" min="1900" max="2100" value={b.vintage} onChange={set('vintage')} placeholder="Vide si non millésimé" />
        </label>
      </div>
      <label className="field">
        <span>Appellation</span>
        <input className="input" value={b.appellation || ''} onChange={set('appellation')} placeholder="Ex : Crozes-Hermitage" maxLength={120} />
      </label>
      <div className="field">
        <span className="chip-group-label" style={{ fontWeight: 600, color: 'var(--encre)', fontSize: '0.9rem' }}>
          Gamme de prix
        </span>
        <Chips options={PRICE_RANGES} value={b.price_range} onChange={set('price_range')} />
      </div>
      <label className="field">
        <span>Remarque (visible à la révélation par vous seul)</span>
        <input className="input" value={b.notes || ''} onChange={set('notes')} maxLength={400} />
      </label>
      <datalist id="grapes-list">
        {GRAPES.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <div className="row">
        <button className="btn" disabled={busy || !b.wine_name.trim()}>
          {initial?.id ? 'Enregistrer les modifications' : 'Ajouter la bouteille'}
        </button>
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

function bottleLine(b) {
  return [b.color, b.appellation, b.vintage, b.grapes].filter(Boolean).join(', ');
}

function TabBottles({ data, act, busy }) {
  const { bottles, participants, tasting } = data;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const ownerName = (id) => participants.find((p) => p.id === id)?.name;
  const prep = tasting.phase === 'preparation';
  const missing = bottles.filter((b) => !b.number).length;
  const sorted = [...bottles].sort((a, b) => (a.number ?? 999) - (b.number ?? 999));

  return (
    <>
      <Notice kind="info">Écran confidentiel : ne laissez personne regarder pendant que vous saisissez les bouteilles.</Notice>

      {adding ? (
        <div className="panel">
          <h2>Nouvelle bouteille</h2>
          <BottleForm
            participants={participants}
            busy={busy}
            onCancel={() => setAdding(false)}
            onSave={async (b) => (await act('addBottle', { bottle: b }, 'Bouteille ajoutée.')) && setAdding(false)}
          />
        </div>
      ) : (
        <button className="btn block" onClick={() => setAdding(true)}>
          Ajouter une bouteille
        </button>
      )}

      {prep && bottles.length > 0 && (
        <div className="panel stack">
          <h2>Numéros anonymes</h2>
          <p className="small muted">
            Chaque bouteille reçoit un numéro tiré au sort. Collez ce numéro sur la bouteille masquée (chaussette, papier aluminium, sac).
          </p>
          <div className="row">
            <button
              className="btn gold"
              disabled={busy}
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
        </div>
      )}

      <div className="panel flush">
        {bottles.length === 0 && <div className="item muted">Aucune bouteille enregistrée.</div>}
        {sorted.map((b) =>
          editing === b.id ? (
            <div key={b.id} className="item" style={{ display: 'block' }}>
              <BottleForm
                initial={b}
                participants={participants}
                busy={busy}
                onCancel={() => setEditing(null)}
                onSave={async (x) => (await act('updateBottle', { id: b.id, bottle: x }, 'Bouteille modifiée.')) && setEditing(null)}
              />
            </div>
          ) : (
            <div key={b.id} className="item">
              <Capsule n={b.number} size="sm" />
              <div className="grow">
                <div className="name">{[b.producer, b.wine_name].filter(Boolean).join(', ')}</div>
                <div className="small muted">{bottleLine(b) || 'Détails à compléter'}</div>
                <div className="tiny" style={{ marginTop: 4 }}>
                  {ownerName(b.owner_id) ? `Apportée par ${ownerName(b.owner_id)}` : <span className="pill red">Propriétaire à indiquer</span>}
                  {b.price_range ? ` · ${b.price_range}` : ''}
                </div>
              </div>
              <div className="actions">
                <button className="btn ghost sm" onClick={() => setEditing(b.id)}>
                  Modifier
                </button>
                {prep && (
                  <button className="btn ghost sm" onClick={() => confirm('Supprimer cette bouteille ?') && act('deleteBottle', { id: b.id }, 'Bouteille supprimée.')}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------
function TabOrder({ data, act, busy }) {
  const { bottles, tasting } = data;
  const ordered = useMemo(
    () => [...bottles].sort((a, b) => (a.serve_order ?? 999) - (b.serve_order ?? 999) || (a.number ?? 999) - (b.number ?? 999)),
    [bottles]
  );
  const locked = tasting.phase === 'revelee';

  function move(i, dir) {
    const ids = ordered.map((b) => b.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    act('setOrder', { ids });
  }

  return (
    <>
      <div className="panel stack">
        <h2>Ordre de service</h2>
        <p className="small muted">Les participants verront les vins dans cet ordre. L’ordre conseillé : bulles, blancs, rosés, rouges, puis vins doux.</p>
        <button className="btn gold" disabled={busy || locked || !bottles.length} onClick={() => act('autoOrder', {}, 'Ordre conseillé appliqué.')}>
          Appliquer l’ordre conseillé
        </button>
      </div>
      <div className="panel flush">
        {ordered.length === 0 && <div className="item muted">Ajoutez d’abord des bouteilles.</div>}
        {ordered.map((b, i) => (
          <div key={b.id} className="item" style={{ alignItems: 'center' }}>
            <div className="rank" style={{ fontSize: '1.2rem' }}>
              {i + 1}
            </div>
            <Capsule n={b.number} size="sm" />
            <div className="grow">
              <div className="name">{b.wine_name}</div>
              <div className="small muted">{b.color || 'Couleur non indiquée'}</div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn ghost sm" aria-label="Monter" disabled={busy || locked || i === 0} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button className="btn ghost sm" aria-label="Descendre" disabled={busy || locked || i === ordered.length - 1} onClick={() => move(i, 1)}>
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------
function TabProgress({ data }) {
  const { participants, bottles, progress } = data;
  const ordered = [...bottles].sort((a, b) => (a.serve_order ?? 999) - (b.serve_order ?? 999));
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
function TabReveal({ data, act, busy, code }) {
  const { tasting, participants, bottles, progress } = data;
  const [armed, setArmed] = useState(false);

  if (tasting.phase === 'revelee') {
    return (
      <div className="panel stack center">
        <h2>Révélation effectuée</h2>
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

  const missingOwners = bottles.filter((b) => !b.owner_id).length;
  return (
    <div className="panel stack">
      <h2>Révéler les bouteilles</h2>
      <p>
        {progress.ratings.length} notes et {progress.predictions.length} pronostics enregistrés pour {participants.length} participants et {bottles.length} vins.
      </p>
      {missingOwners > 0 && <Notice kind="error">{missingOwners} bouteille(s) sans propriétaire : le classement des dégustateurs en tiendra compte moins bien.</Notice>}
      <p className="small muted">
        La révélation est définitive : elle verrouille toutes les fiches et tous les pronostics, puis affiche les bouteilles et les classements à tout le monde.
      </p>
      {!armed ? (
        <button className="btn gold block" onClick={() => setArmed(true)}>
          Révéler les bouteilles
        </button>
      ) : (
        <div className="stack">
          <Notice kind="info">Tout le monde a terminé ? Une fois confirmé, plus aucune modification n’est possible.</Notice>
          <button className="btn danger block" disabled={busy} onClick={() => act('reveal', { confirm: true }, 'Révélation effectuée !')}>
            Confirmer la révélation
          </button>
          <button className="btn ghost block" onClick={() => setArmed(false)}>
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
