'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, usePolling, Band, Notice, Capsule, Loading, fmtDate } from './ui';
import { SCORING, MAX_POINTS_PER_BOTTLE } from '@/lib/constants';
import BottleForm from './BottleForm';

export function ratingDone(r) {
  return r && r.note !== null && r.note !== undefined;
}
const PRED_KEYS = ['appellation', 'grapes', 'region', 'country', 'color', 'vintage'];
export function predictionDone(p) {
  return !!p && PRED_KEYS.some((k) => p[k] !== null && p[k] !== undefined && p[k] !== '');
}

export default function ParticipantApp({ code }) {
  const { data, setData, error, refresh } = usePolling(() => api(`/api/t/${code}`), 5000, [code]);

  if (error && !data) {
    return (
      <main>
        <Band title="Dégustation introuvable" back="/" />
        <div className="page">
          <Notice kind="error">{error.status === 404 ? 'Ce code ne correspond à aucune soirée. Vérifiez-le auprès de l’organisateur.' : error.message}</Notice>
        </div>
      </main>
    );
  }
  if (!data) return <Loading />;

  const { tasting, me } = data;
  if (!me) return <Join data={data} code={code} onJoined={refresh} />;

  const sub = `${me.name}${tasting.event_date ? ` · ${fmtDate(tasting.event_date)}` : ''}`;

  return (
    <main>
      <Band title={tasting.name} sub={sub} right={data.isAdmin ? <Link href={`/admin/${code}`} className="small">Organiser</Link> : null} />
      <div className="page stack">
        {error && <Notice kind="error">Connexion instable, nouvelle tentative automatique…</Notice>}
        {tasting.phase === 'preparation' && <Waiting name={me.name} />}
        <MyBottles data={data} code={code} onChange={(myBottles) => setData((d) => ({ ...d, myBottles }))} />
        {tasting.phase === 'revelee' && (
          <div className="panel stack center reveal-in">
            <h2>Les bouteilles sont révélées</h2>
            <p>Découvrez les vins, les notes moyennes et le classement des dégustateurs.</p>
            <Link href={`/t/${code}/resultats`} className="btn gold block">
              Voir les résultats
            </Link>
          </div>
        )}
        {tasting.phase !== 'preparation' && <WineList data={data} code={code} />}
        {tasting.phase === 'degustation' && <Rules />}
        <LeaveButton code={code} onLeft={refresh} />
      </div>
    </main>
  );
}

function Waiting({ name }) {
  return (
    <div className="panel stack center">
      <h2>Bienvenue, {name}</h2>
      <p>La dégustation n’a pas encore commencé. Enregistrez votre ou vos bouteilles ci-dessous. Les vins à déguster apparaîtront tout seuls dès que l’organisateur lancera la soirée.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <span className="spinner" />
        <span className="small muted">En attente de l’organisateur</span>
      </div>
    </div>
  );
}

function WineList({ data, code }) {
  const { bottles, sheets, tasting } = data;
  const mineIds = new Set((data.myBottles || []).map((b) => b.id));
  const done = bottles.filter((b) => ratingDone(sheets[b.id]?.rating)).length;
  return (
    <>
      <div className="row between">
        <h2 className="h2" style={{ margin: 0 }}>
          Les vins
        </h2>
        <span className="small muted">
          {done} / {bottles.length} notés
        </span>
      </div>
      <ul className="panel flush wine-list">
        {bottles.map((b, i) => {
          const s = sheets[b.id] || {};
          return (
            <li key={b.id}>
              <Link className="wine-row" href={`/t/${code}/vin/${b.number}`}>
                <Capsule n={b.number} />
                <div className="grow">
                  <div className="title">Vin n°{b.number}</div>
                  <div className="tiny muted">
                    {mineIds.has(b.id) ? 'Votre bouteille' : ''}
                  </div>
                  <div className="ticks">
                    <span className={`tick ${ratingDone(s.rating) ? 'done' : ''}`}>
                      {ratingDone(s.rating) ? `Fiche · ${String(s.rating.note).replace('.', ',')}/20` : 'Fiche à remplir'}
                    </span>
                    <span className={`tick ${predictionDone(s.prediction) ? 'done' : ''}`}>{predictionDone(s.prediction) ? 'Pronostic fait' : 'Pronostic à faire'}</span>
                  </div>
                </div>
                <span className="chev" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {tasting.phase === 'degustation' && <p className="tiny muted center">Tout est enregistré automatiquement à chaque modification.</p>}
    </>
  );
}

function Rules() {
  return (
    <details className="panel">
      <summary>Règles et barème des pronostics</summary>
      <div className="small" style={{ marginTop: 10 }}>
        <p>Pour chaque vin, vous gagnez :</p>
        <div className="breakdown">
          <strong>{SCORING.appellation} pts</strong>
          <span>appellation exacte</span>
          <strong>{SCORING.grapes} pts</strong>
          <span>un cépage juste</span>
          <strong>{SCORING.region} pts</strong>
          <span>région exacte</span>
          <strong>{SCORING.country} pts</strong>
          <span>pays exact</span>
          <strong>{SCORING.color} pts</strong>
          <span>couleur exacte</span>
          <strong>
            {SCORING.vintageExact}/{SCORING.vintageOne}/{SCORING.vintageTwo} pts
          </strong>
          <span>millésime exact, à 1 an, à 2 ans</span>
        </div>
        <p style={{ marginTop: 10 }}>
          Maximum {MAX_POINTS_PER_BOTTLE} points par vin. Votre propre bouteille ne compte ni dans votre score de pronostics, ni dans la note moyenne du vin.
          Les pronostics sont verrouillés au moment de la révélation.
        </p>
      </div>
    </details>
  );
}

function LeaveButton({ code, onLeft }) {
  return (
    <p className="center tiny">
      <button
        className="linklike muted"
        onClick={async () => {
          if (!confirm('Se déconnecter de ce téléphone ? Vos notes restent enregistrées et vous pourrez revenir en choisissant à nouveau votre nom.')) return;
          await api(`/api/t/${code}/join`, { method: 'POST', body: { action: 'leave' } });
          onLeft();
        }}
      >
        Ce n’est pas moi / changer de téléphone
      </button>
    </p>
  );
}

function Join({ data, code, onJoined }) {
  const { tasting, participants } = data;
  const [selected, setSelected] = useState(null);
  const [newName, setNewName] = useState('');
  const [other, setOther] = useState(participants.length === 0);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/t/${code}/join`, { method: 'POST', body: other ? { name: newName } : { participantId: selected } });
      await onJoined();
    } catch (e) {
      setError(e.message);
      onJoined();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <Band title={tasting.name} sub={tasting.event_date ? fmtDate(tasting.event_date) : 'Dégustation à l’aveugle'} back="/" />
      <div className="page stack">
        <div className="panel stack">
          <h2>Qui êtes-vous ?</h2>
          {!other && (
            <>
              <div className="chips">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="chip"
                    aria-pressed={selected === p.id}
                    disabled={p.taken}
                    onClick={() => setSelected(p.id)}
                    title={p.taken ? 'Déjà connecté sur un autre téléphone' : undefined}
                    style={p.taken ? { opacity: 0.45, textDecoration: 'line-through' } : undefined}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {participants.some((p) => p.taken) && <p className="tiny muted">Les noms barrés sont déjà utilisés sur un autre téléphone.</p>}
              <button className="linklike small" style={{ alignSelf: 'flex-start' }} onClick={() => setOther(true)}>
                Je ne suis pas dans la liste
              </button>
            </>
          )}
          {other && (
            <>
              <label className="field">
                <span>Votre nom ou pseudonyme</span>
                <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} autoFocus />
              </label>
              {participants.length > 0 && (
                <button className="linklike small" style={{ alignSelf: 'flex-start' }} onClick={() => setOther(false)}>
                  Revenir à la liste
                </button>
              )}
            </>
          )}
          <Notice kind="error">{error}</Notice>
          <button className="btn block" disabled={busy || (other ? !newName.trim() : !selected)} onClick={join}>
            {busy ? 'Connexion…' : 'C’est moi, entrer'}
          </button>
        </div>
      </div>
    </main>
  );
}

function MyBottles({ data, code, onChange }) {
  const { tasting, myBottles = [], scanEnabled } = data;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const prep = tasting.phase === 'preparation';

  async function send(payload) {
    setBusy(true);
    setError(null);
    try {
      const r = await api(`/api/t/${code}/bottles`, { method: 'POST', body: payload });
      onChange(r.myBottles);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!prep && !myBottles.length) return null;

  return (
    <div className="panel stack">
      <h2>Mes bouteilles</h2>
      {prep && (
        <p className="small muted">
          Vous seul voyez ces informations. Ni l’organisateur ni les autres participants n’y ont accès avant la révélation.
        </p>
      )}
      {myBottles.map((b) =>
        editing === b.id ? (
          <div key={b.id} className="panel">
            <BottleForm
              initial={b}
              busy={busy}
              onCancel={() => setEditing(null)}
              onSave={async (x) => (await send({ action: 'update', id: b.id, bottle: x })) && setEditing(null)}
            />
          </div>
        ) : (
          <div key={b.id} className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
            <Capsule n={b.number} size="sm" />
            <div className="grow">
              <div style={{ fontWeight: 700 }}>{[b.producer, b.wine_name !== b.producer ? b.wine_name : null].filter(Boolean).join(', ')}</div>
              <div className="small muted">{[b.appellation, b.grapes, b.region, b.country, b.color].filter(Boolean).join(', ') || 'Détails à compléter'}</div>
              {b.number ? (
                tasting.phase === 'preparation' && (
                  <div className="small" style={{ color: 'var(--or-fonce)', fontWeight: 600 }}>
                    Masquez la bouteille et écrivez dessus : n°{b.number}
                  </div>
                )
              ) : (
                <div className="tiny muted">Numéro attribué au tirage au sort</div>
              )}
            </div>
            {prep && (
              <div className="actions">
                <button className="btn ghost sm" onClick={() => setEditing(b.id)}>
                  Modifier
                </button>
                <button className="btn ghost sm" disabled={busy} onClick={() => confirm('Retirer cette bouteille ?') && send({ action: 'delete', id: b.id })}>
                  Retirer
                </button>
              </div>
            )}
          </div>
        )
      )}
      <Notice kind="error">{error}</Notice>
      {prep &&
        (adding ? (
          <div className="panel">
            <BottleForm
              busy={busy}
              scanUrl={scanEnabled ? `/api/t/${code}/scan` : null}
              onCancel={() => setAdding(false)}
              onSave={async (x) => (await send({ action: 'add', bottle: x })) && setAdding(false)}
            />
          </div>
        ) : (
          <button className="btn block" onClick={() => setAdding(true)}>
            {myBottles.length ? 'Ajouter une autre bouteille' : 'Ajouter ma bouteille'}
          </button>
        ))}
    </div>
  );
}
