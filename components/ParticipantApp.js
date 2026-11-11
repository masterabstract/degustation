'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, usePolling, Band, Notice, Capsule, Loading, fmtDate } from './ui';
import { BAREME } from '@/lib/bareme';
import BottleForm from './BottleForm';
import { VintageTable } from './SheetPage';
import { rememberSoiree } from '@/lib/memo';
import SoireeEffacee from './SoireeEffacee';
import { predictionStatus, missingFields } from '@/lib/pronostic';
import ServeAlert from './ServeAlert';
import DraftSync from './DraftSync';

export function ratingDone(r) {
  return r && r.note !== null && r.note !== undefined;
}
const PRED_KEYS = ['appellation', 'grapes', 'region', 'country', 'color', 'vintage'];
export function predictionDone(p) {
  return !!p && PRED_KEYS.some((k) => p[k] !== null && p[k] !== undefined && p[k] !== '');
}

export default function ParticipantApp({ code }) {
  const { data, setData, error, refresh } = usePolling(() => api(`/api/t/${code}`), 5000, [code]);
  // On retient la soirée sur ce téléphone : retour direct depuis l'accueil, sans retaper le code.
  const meName = data?.me?.name;
  const tName = data?.tasting?.name;
  useEffect(() => {
    if (meName) rememberSoiree({ code, name: tName, who: meName });
  }, [code, meName, tName]);
  // Soirée effacée par l'organisateur (même pendant qu'on l'utilise) : plus aucun accès.
  if (error?.status === 404) return <SoireeEffacee code={code} connue={!!data} />;
  if (error && !data) {
    return (
      <main>
        <Band title="Dégustation introuvable" back="/" />
        <div className="page">
          <Notice kind="error">{error.message}</Notice>
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
      <ServeAlert code={code} tasting={tasting} />
      <div className="page stack">
        {error && <Notice kind="error">Connexion instable, nouvelle tentative automatique…</Notice>}
        <DraftSync code={code} />
        {tasting.phase === 'preparation' && <Waiting name={me.name} />}
        <MyBottles data={data} code={code} onChange={(myBottles) => setData((d) => ({ ...d, myBottles }))} />
        {tasting.phase === 'revelation' && (
          <div className="panel stack center reveal-in">
            <h2>La révélation a commencé</h2>
            <p>Les fiches sont verrouillées. Suivez la révélation des vins, un par un, jusqu’au podium.</p>
            <Link href={`/t/${code}/resultats`} className="btn gold block">
              Suivre la révélation
            </Link>
          </div>
        )}
        {tasting.phase === 'degustation' && (tasting.revealed_numbers || []).length > 0 && (
          <div className="panel stack center reveal-in">
            <h2>Vin n°{tasting.revealed_numbers[tasting.revealed_numbers.length - 1]} révélé</h2>
            <p className="small">
              {tasting.revealed_numbers.length > 1 ? `${tasting.revealed_numbers.length} vins sont révélés. ` : ''}Découvrez la bouteille, les points de chacun et le classement provisoire. La dégustation continue pour les autres vins.
            </p>
            <Link href={`/t/${code}/resultats`} className="btn gold block">
              Voir la révélation
            </Link>
          </div>
        )}
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

// Pronostic : complet (les 5 réponses à points), incomplet (il en manque) ou à faire.
function PronoTick({ p }) {
  const st = predictionStatus(p);
  const n = missingFields(p).length;
  if (st === 'complet') return <span className="tick done">Pronostic complet</span>;
  if (st === 'incomplet') return <span className="tick partial">Pronostic incomplet ({n} à compléter)</span>;
  return <span className="tick">Pronostic à faire</span>;
}

function WineRow({ b, code, sheets, mine, now, later, revealed }) {
  const s = sheets[b.id] || {};
  return (
    <li className={now ? 'now-serving' : ''}>
      <Link className={`wine-row ${later ? 'later' : ''}`} href={`/t/${code}/vin/${b.number}`}>
        <Capsule n={b.number} size={now ? 'lg' : ''} />
        <div className="grow">
          {now && <span className="now-badge">En cours de service</span>}
          <div className="title">Vin n°{b.number}</div>
          {mine && <div className="tiny muted">Votre bouteille</div>}
          {revealed && <div className="tiny" style={{ color: 'var(--bordeaux)', fontWeight: 700 }}>Révélé · fiche verrouillée</div>}
          <div className="ticks">
            {mine ? <span className="tick">Pronostic : ne compte pas</span> : <PronoTick p={s.prediction} />}
            {ratingDone(s.rating) ? (
              <span className="tick done">Note · {String(s.rating.note).replace('.', ',')}/20</span>
            ) : (
              <span className="tick optional">Fiche facultative</span>
            )}
          </div>
        </div>
        <span className="chev" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  );
}

function WineList({ data, code }) {
  const { bottles, sheets, tasting } = data;
  const mineIds = new Set((data.myBottles || []).map((b) => b.id));
  // Ce qui compte pour les points : les pronostics sur les vins des autres (la fiche est facultative).
  const toGuess = bottles.filter((b) => !mineIds.has(b.id));
  const done = toGuess.filter((b) => predictionStatus(sheets[b.id]?.prediction) === 'complet').length;
  const served = new Set(tasting.served_numbers || []);
  const shown = new Set(tasting.revealed_numbers || []);
  const live = tasting.phase === 'degustation' && served.size > 0;
  const current = bottles.find((b) => b.number === tasting.current_number);
  // Ordre : le vin en cours, puis les vins servis (le plus récent d'abord), les vins à venir, et enfin les vins révélés.
  const servedList = bottles.filter((b) => served.has(b.number) && b !== current && !shown.has(b.number)).sort((a, c) => c.number - a.number);
  const laterList = bottles.filter((b) => !served.has(b.number) && b !== current && !shown.has(b.number));
  const revealedList = bottles.filter((b) => shown.has(b.number) && b !== current).sort((a, c) => c.number - a.number);
  const row = (b, extra = {}) => <WineRow key={b.id} b={b} code={code} sheets={sheets} mine={mineIds.has(b.id)} revealed={tasting.phase === 'degustation' && shown.has(b.number)} {...extra} />;

  return (
    <>
      <div className="row between">
        <h2 className="h2" style={{ margin: 0 }}>
          Les vins
        </h2>
        {toGuess.length > 0 && (
          <span className="small muted">
            {done} / {toGuess.length} pronostic{toGuess.length > 1 ? 's' : ''} complet{toGuess.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {live ? (
        <>
          {current && <ul className="panel flush wine-list">{row(current, { now: true })}</ul>}
          {servedList.length > 0 && (
            <>
              <div className="section-label">Déjà servis</div>
              <ul className="panel flush wine-list">{servedList.map((b) => row(b))}</ul>
            </>
          )}
          {laterList.length > 0 && (
            <>
              <div className="section-label">Pas encore servis</div>
              <ul className="panel flush wine-list">{laterList.map((b) => row(b, { later: true }))}</ul>
            </>
          )}
          {revealedList.length > 0 && (
            <>
              <div className="section-label">Déjà révélés</div>
              <ul className="panel flush wine-list">{revealedList.map((b) => row(b))}</ul>
            </>
          )}
        </>
      ) : (
        <ul className="panel flush wine-list">{bottles.map((b) => row(b, { now: tasting.phase === 'degustation' && b.number === tasting.current_number }))}</ul>
      )}
      {tasting.phase === 'degustation' && <p className="tiny muted center">Tout est enregistré automatiquement à chaque modification.</p>}
    </>
  );
}

function Rules() {
  const F = BAREME.france;
  const E = BAREME.foreign;
  return (
    <details className="panel">
      <summary>Règles et barème des pronostics</summary>
      <div className="small stack" style={{ marginTop: 10 }}>
        <table className="grid fit">
          <thead>
            <tr>
              <th>Critère</th>
              <th>Vin français</th>
              <th>Vin étranger</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Cépage(s)</td><td>{F.grapes}</td><td>{E.grapes}</td></tr>
            <tr><td>Pays</td><td>{F.country}</td><td>{E.country}</td></tr>
            <tr><td>Géographie<span className="sub">région {BAREME.geoSplit.region} + appellation {BAREME.geoSplit.appellation}</span></td><td>{F.geo}</td><td>{E.geo}</td></tr>
            <tr><td>Millésime</td><td>{F.vintage}</td><td>{E.vintage}</td></tr>
            <tr><td><strong>Total</strong></td><td><strong>{F.total}</strong></td><td><strong>{E.total}</strong></td></tr>
          </tbody>
        </table>
        <p>
          <strong>Seuls les pronostics rapportent des points.</strong> La fiche de dégustation (robe, arômes, note sur 20, commentaire) est facultative : elle ne compte pas dans le classement des dégustateurs. Les notes sur 20 servent seulement à élire le meilleur vin de la soirée.
        </p>
        <p>
          <strong>Cépages</strong> : un monocépage exact rapporte 10 points. Pour un assemblage, chaque cépage trouvé rapporte sa part (70 % de Merlot = 7 points), et chaque cépage cité à tort retire {BAREME.grapeWrongPenalty} point.
        </p>
        <p>
          <strong>Géographie</strong> (tous les vins) : on gagne 3 points si on trouve la région et 2 points si on trouve l’appellation, soit 5 points au total. Les deux réponses sont jugées séparément : l’appellation exacte sans la bonne région ne rapporte que 2 points, ce qui arrive souvent avec les Vins de France (sans appellation, ils peuvent venir de n’importe quelle région).
        </p>
        <p>
          <strong>Millésime</strong> : 3 points pour l’année exacte, puis des points en moins à chaque année d’écart, moins vite pour les vins anciens :
        </p>
        <VintageTable />
        <p>
          <strong>Classement</strong> : note globale sur 20, au prorata des points possibles (71,5 % des points = 14,3/20), car personne ne joue sur ses propres bouteilles et chacun n’a donc pas le même nombre de points possibles. En cas d’égalité : cépages, puis géographie, puis pays, puis millésime.
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
          forgetSoiree(code);
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
  const [entered, setEntered] = useState(false);

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

  if (!entered) return <Welcome tasting={tasting} count={participants.length} onEnter={() => setEntered(true)} />;

  return (
    <main>
      <Band title={tasting.name} sub={tasting.event_date ? fmtDate(tasting.event_date) : 'La Confrérie du Pif'} back="/" />
      <div className="page stack">
        <div className="panel stack">
          <img src="/logo.webp" alt="" width={96} height={96} className="join-logo" />
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

// Page d'accueil des participants qui arrivent par le lien ou le code de la soirée.
const PHASE_LINE = {
  preparation: 'La soirée se prépare : enregistrez vos bouteilles.',
  degustation: 'La dégustation a commencé, rejoignez la tablée !',
  revelation: 'Les bouteilles sont en train d’être révélées.',
  revelee: 'La soirée est terminée : découvrez le palmarès.',
};
function Welcome({ tasting, count, onEnter }) {
  return (
    <main className="welcome">
      <section className="welcome-hero">
        <img src="/logo.webp" alt="La Confrérie du Pif, dégustation à l’aveugle" width={500} height={500} className="welcome-logo" fetchPriority="high" />
        <p className="welcome-eyebrow">Vous êtes convié à</p>
        <h1>{tasting.name}</h1>
        {tasting.event_date && <p className="welcome-date">{fmtDate(tasting.event_date)}</p>}
        {PHASE_LINE[tasting.phase] && <p className="welcome-phase">{PHASE_LINE[tasting.phase]}</p>}
        <button className="btn gold block welcome-cta" onClick={onEnter}>
          Entrer dans la Confrérie
        </button>
        {tasting.phase === 'revelee' && (
          <Link href={`/t/${tasting.code}/resultats`} className="btn ghost block welcome-cta" style={{ marginTop: 10, color: 'var(--creme)', borderColor: 'var(--or)' }}>
            Voir les résultats
          </Link>
        )}
        {count > 0 && <p className="welcome-count">{count} {count > 1 ? 'confrères inscrits' : 'confrère inscrit'}</p>}
      </section>
      <section className="page stack">
        <h2 className="welcome-title">Le déroulé de la soirée</h2>
        <ol className="welcome-steps">
          <li>
            <strong>Vos bouteilles, en secret</strong>
            <span>Enregistrez le vin que vous apportez. Personne ne le voit avant la révélation, pas même l’organisateur.</span>
          </li>
          <li>
            <strong>À l’aveugle, le nez dans le verre</strong>
            <span>Pour chaque vin, vos pronostics (pays, région, appellation, cépages, millésime) : ce sont eux qui rapportent les points. La fiche de dégustation (note, arômes, commentaire) est facultative.</span>
          </li>
          <li>
            <strong>La révélation</strong>
            <span>Les bouteilles sont dévoilées une à une, les points tombent et le meilleur pif de la soirée est couronné.</span>
          </li>
        </ol>
        <button className="btn block" onClick={onEnter}>
          C’est parti
        </button>
      </section>
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
  const open = tasting.phase === 'preparation' || tasting.phase === 'degustation'; // ajout possible jusqu'à la révélation

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

  if (!open && !myBottles.length) return null;

  return (
    <div className="panel stack">
      <h2>Mes bouteilles</h2>
      {open && (
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
                open && (
                  <div className="small" style={{ color: 'var(--or-fonce)', fontWeight: 600 }}>
                    Masquez la bouteille et écrivez dessus : n°{b.number}
                  </div>
                )
              ) : (
                <div className="tiny muted">Le numéro sera attribué au lancement de la dégustation</div>
              )}
            </div>
            {open && (
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
      {open &&
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
