'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Band, Notice, Loading, fmtDate, fmtNote, plural } from '@/components/ui';

export default function Archives() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('soirees');
  const [open, setOpen] = useState(null);
  // Effacement de soirées (organisateur)
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState([]);
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => api('/api/archives').then(setData).catch(setError);
  useEffect(() => {
    load();
  }, []);

  function toggle(code) {
    setConfirming(false);
    setSelected((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  }
  function stopManage() {
    setManage(false);
    setSelected([]);
    setPassword('');
    setConfirming(false);
  }
  async function remove() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api('/api/archives', { method: 'POST', body: { action: 'delete', codes: selected, password } });
      setMsg({ kind: 'ok', text: r.deleted > 1 ? `${r.deleted} soirées effacées. Le palmarès a été recalculé.` : 'Soirée effacée. Le palmarès a été recalculé.' });
      stopManage();
      await load();
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <main>
        <Band title="Archives" back="/" />
        <div className="page">
          <Notice kind="error">{error.message}</Notice>
        </div>
      </main>
    );
  }
  if (!data) return <Loading label="Chargement des archives…" />;

  return (
    <main>
      <Band title="Archives de la Confrérie" sub="Toutes les soirées révélées et le championnat des dégustateurs" back="/" />
      <div className="page">
        <div className="sticky-tabs">
          <nav className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'soirees'} onClick={() => setTab('soirees')}>
              Soirées ({data.soirees.length})
            </button>
            <button role="tab" aria-selected={tab === 'palmares'} onClick={() => setTab('palmares')}>
              Championnat
            </button>
          </nav>
        </div>

        {tab === 'soirees' && (
          <div className="stack">
            {msg && !manage && <Notice kind={msg.kind}>{msg.text}</Notice>}
            {!data.soirees.length && <div className="panel muted">Aucune soirée révélée pour l’instant. Elles apparaîtront ici après leur révélation.</div>}
            {data.soirees.length > 0 && !manage && (
              <button className="linklike small" style={{ alignSelf: 'flex-end' }} onClick={() => { setManage(true); setMsg(null); }}>
                Effacer des soirées…
              </button>
            )}
            {manage && (
              <div className="panel stack">
                <strong>Effacer des soirées</strong>
                <p className="small muted" style={{ margin: 0 }}>
                  Cochez les soirées à effacer, puis entrez le mot de passe organisateur. L’effacement est <strong>définitif</strong> : participants, bouteilles, fiches et pronostics de ces soirées disparaissent, et le palmarès est recalculé sans elles. Pensez à télécharger la sauvegarde avant si vous voulez la garder.
                </p>
              </div>
            )}
            {data.soirees.map((s) => {
              const inner = (
                <>
                  <div className="row between" style={{ alignItems: 'baseline', flexWrap: 'nowrap' }}>
                    <h2 style={{ margin: 0 }}>{s.name}</h2>
                    {!manage && (
                      <span className="chev" aria-hidden="true">
                        ›
                      </span>
                    )}
                  </div>
                  <div className="small muted">
                    {[s.event_date ? fmtDate(s.event_date) : null, plural(s.participants, 'dégustateur'), plural(s.vins, 'vin')].filter(Boolean).join(' · ')}
                  </div>
                  {s.meilleurVin.length > 0 && (
                    <p className="small" style={{ marginTop: 8 }}>
                      <strong>Meilleur vin :</strong> {s.meilleurVin.map((w) => `${w.label}${w.appellation ? `, ${w.appellation}` : ''}`).join(' et ')} ({fmtNote(s.meilleurVin[0].note)}/20
                      {s.meilleurVin.length === 1 && s.meilleurVin[0].owner ? `, apporté par ${s.meilleurVin[0].owner}` : ''})
                    </p>
                  )}
                  {s.meilleurDegustateur.length > 0 && (
                    <p className="small">
                      <strong>Meilleur dégustateur :</strong> {s.meilleurDegustateur.map((x) => x.name).join(' et ')} ({fmtNote(s.meilleurDegustateur[0].note)}/20)
                    </p>
                  )}
                </>
              );
              if (!manage) {
                return (
                  <Link key={s.code} href={`/t/${s.code}/resultats`} className="panel" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    {inner}
                  </Link>
                );
              }
              const on = selected.includes(s.code);
              return (
                <label key={s.code} className={`panel archive-pick${on ? ' on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(s.code)} aria-label={`Effacer ${s.name}`} />
                  <div className="grow">{inner}</div>
                </label>
              );
            })}
            {manage && (
              <div className="panel stack archive-actions">
                <label className="small" htmlFor="pw-orga">
                  Mot de passe organisateur
                </label>
                <input
                  id="pw-orga"
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setConfirming(false); }}
                  placeholder="Celui demandé pour créer une soirée"
                />
                {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
                {!confirming ? (
                  <button className="btn danger block" disabled={!selected.length || !password || busy} onClick={() => setConfirming(true)}>
                    Effacer {selected.length > 1 ? `les ${selected.length} soirées cochées` : selected.length === 1 ? 'la soirée cochée' : 'les soirées cochées'}
                  </button>
                ) : (
                  <div className="stack">
                    <Notice kind="error">
                      Effacer définitivement : {data.soirees.filter((x) => selected.includes(x.code)).map((x) => x.name).join(', ')} ? Cette action ne peut pas être annulée.
                    </Notice>
                    <button className="btn danger block" disabled={busy} onClick={remove}>
                      {busy ? 'Effacement…' : 'Oui, effacer définitivement'}
                    </button>
                    <button className="btn ghost block" disabled={busy} onClick={() => setConfirming(false)}>
                      Non, garder
                    </button>
                  </div>
                )}
                <button className="linklike small" onClick={stopManage} disabled={busy}>
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'palmares' && <Championnat data={data} open={open} setOpen={setOpen} />}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------
// Championnat de la Confrérie : classement par année (ou toutes années) et carnet de chacun.
const CRITERES = [
  ['grapes', 'Cépages'],
  ['geo', 'Région et appellation'],
  ['country', 'Pays'],
  ['vintage', 'Millésime'],
];
const rangTxt = (r) => (r === 1 ? '1er' : `${r}e`);

function Championnat({ data, open, setOpen }) {
  const annees = data.championnat?.annees || [];
  const [annee, setAnnee] = useState(annees[0] ?? 'toutes');
  const lignes = annee === 'toutes' ? data.palmares : data.championnat.classements[annee] || [];
  return (
    <div className="stack">
      <div className="chips" role="group" aria-label="Année du championnat">
        {annees.map((a) => (
          <button key={a} className="chip" aria-pressed={annee === a} onClick={() => setAnnee(a)}>
            {a}
          </button>
        ))}
        <button className="chip" aria-pressed={annee === 'toutes'} onClick={() => setAnnee('toutes')}>
          Toutes les années
        </button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        {annee === 'toutes' ? 'Toutes les soirées révélées' : `Championnat ${annee}`} : classement selon la note moyenne sur 20, c’est-à-dire tous les points de pronostic gagnés, divisés par tous les points
        possibles, ramenés sur 20. À égalité : le plus de victoires, puis de podiums. Les participations hors concours ne comptent pas. Touchez un nom pour ouvrir son carnet.
      </p>
      <div className="panel flush">
        {!lignes.length && <div className="item muted">Le championnat se remplira après la première révélation.</div>}
        {lignes.map((p) => (
          <div key={p.name} className={`result ${p.rang === 1 ? 'first' : ''}`} style={{ display: 'block' }}>
            <button className="champ-ligne" aria-expanded={open === p.name} onClick={() => setOpen(open === p.name ? null : p.name)}>
              <span className="rank">{p.rang ?? '–'}</span>
              <span className="grow">
                <span className="wine-name">{p.name}</span>
                <span className="facts">
                  {p.soirees} soirée{p.soirees > 1 ? 's' : ''} · {p.victoires} victoire{p.victoires > 1 ? 's' : ''} · {p.podiums} podium{p.podiums > 1 ? 's' : ''}
                  {p.trophees?.length ? ` · ${p.trophees.length} trophée${p.trophees.length > 1 ? 's' : ''}` : ''}
                </span>
              </span>
              <span className="score">
                {p.moyenne === null ? '–' : fmtNote(p.moyenne)}
                {p.moyenne !== null && <small>/20</small>}
              </span>
            </button>
            {open === p.name && <Carnet ligne={p} carnet={data.carnets?.[p.name]} historique={(data.palmares.find((x) => x.name === p.name)?.historique || []).filter((h) => annee === 'toutes' || h.annee === annee)} annee={annee} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Carnet({ ligne, carnet, historique, annee }) {
  const filtre = (x) => annee === 'toutes' || x.annee === annee;
  const vins = (carnet?.vins || []).filter(filtre);
  const apportes = (carnet?.apportes || []).filter(filtre);
  const forces = CRITERES.filter(([k]) => ligne.forces?.[k] !== null && ligne.forces?.[k] !== undefined);
  const candidats = forces.filter(([k]) => k !== 'country'); // le pays est le plus facile : il ne compte pas comme point fort
  const fort = candidats.length ? candidats.reduce((a, b) => (ligne.forces[b[0]] > ligne.forces[a[0]] ? b : a)) : null;
  const meilleursVins = vins.filter((v) => v.note !== null).sort((a, b) => b.note - a.note).slice(0, 3);
  return (
    <div className="carnet stack">
      <h3 style={{ margin: 0 }}>Le carnet de {ligne.name}</h3>
      {forces.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          <div className="small">
            Points forts{fort ? (
              <>
                {' '}
                : <strong>{fort[1].toLowerCase()}</strong>
              </>
            ) : null}
          </div>
          {forces.map(([k, l]) => (
            <div key={k} className="carnet-barre">
              <span>{l}</span>
              <span className="carnet-jauge" aria-hidden="true">
                <span style={{ width: `${Math.min(100, ligne.forces[k])}%` }} />
              </span>
              <strong>{String(ligne.forces[k]).replace('.', ',')} %</strong>
            </div>
          ))}
        </div>
      )}
      {ligne.trophees?.length > 0 && (
        <div className="small">
          <strong>Trophées :</strong> {ligne.trophees.map((t) => `${t.titre} (${t.soiree})`).join(' · ')}
        </div>
      )}
      {ligne.meilleur && (
        <div className="small">
          <strong>Record :</strong> {fmtNote(ligne.meilleur.note)}/20 ({ligne.meilleur.soiree})
        </div>
      )}
      {historique.length > 0 && (
        <div className="stack small" style={{ gap: 6 }}>
          <strong>Ses soirées</strong>
          {historique.map((h) => (
            <Link key={h.code} href={`/t/${h.code}/resultats`} className="row between" style={{ textDecoration: 'none', color: 'inherit', flexWrap: 'nowrap' }}>
              <span>
                {h.soiree}
                {h.date ? <span className="muted"> · {fmtDate(h.date)}</span> : null}
              </span>
              <strong style={{ whiteSpace: 'nowrap' }}>{h.hors_concours ? 'hors concours' : `${h.rang ? `${rangTxt(h.rang)} · ` : ''}${fmtNote(h.note)}/20`}</strong>
            </Link>
          ))}
        </div>
      )}
      {meilleursVins.length > 0 && (
        <div className="small">
          <strong>Ses coups de cœur :</strong> {meilleursVins.map((v) => `${v.vin} (${fmtNote(v.note)}/20)`).join(' · ')}
        </div>
      )}
      {vins.length > 0 && (
        <details className="small">
          <summary style={{ cursor: 'pointer' }}>
            <strong>
              Les {vins.length} vins goûtés
            </strong>{' '}
            (points de pronostic et sa note)
          </summary>
          <ul className="carnet-vins">
            {vins.map((v, i) => (
              <li key={i}>
                <span>
                  {v.vin}
                  <span className="muted">
                    {' '}
                    · {[v.appellation, v.pays !== 'France' ? v.pays : null].filter(Boolean).join(', ')} · {v.soiree}
                  </span>
                </span>
                <span className="carnet-pts">
                  {fmtNote(v.points)}/{v.max} pts{v.note !== null ? ` · ${fmtNote(v.note)}/20` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {apportes.length > 0 && (
        <div className="small">
          <strong>Vins apportés :</strong>{' '}
          {apportes.map((w) => `${w.vin}${w.moyenne !== null && w.moyenne !== undefined ? ` (${fmtNote(w.moyenne)}/20${w.rang === 1 ? ', meilleur vin' : ''})` : ''}`).join(' · ')}
        </div>
      )}
    </div>
  );
}
