'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Band, Notice, Loading, fmtDate, fmtNote } from '@/components/ui';

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
      <Band title="Archives" sub="Toutes les soirées révélées et le palmarès des dégustateurs" back="/" />
      <div className="page">
        <div className="sticky-tabs">
          <nav className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'soirees'} onClick={() => setTab('soirees')}>
              Soirées ({data.soirees.length})
            </button>
            <button role="tab" aria-selected={tab === 'palmares'} onClick={() => setTab('palmares')}>
              Palmarès
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
                    {[s.event_date ? fmtDate(s.event_date) : null, `${s.participants} dégustateurs`, `${s.vins} vins`].filter(Boolean).join(' · ')}
                  </div>
                  {s.meilleurVin.length > 0 && (
                    <p className="small" style={{ marginTop: 8 }}>
                      <strong>Meilleur vin :</strong> {s.meilleurVin.map((w) => `${w.label}${w.appellation ? `, ${w.appellation}` : ''}`).join(' et ')} ({fmtNote(s.meilleurVin[0].note)}/20
                      {s.meilleurVin.length === 1 && s.meilleurVin[0].owner ? `, apporté par ${s.meilleurVin[0].owner}` : ''})
                    </p>
                  )}
                  {s.meilleurDegustateur.length > 0 && (
                    <p className="small">
                      <strong>Meilleur dégustateur :</strong> {s.meilleurDegustateur.map((x) => x.name).join(' et ')} ({fmtNote(s.meilleurDegustateur[0].pct)} % des points)
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

        {tab === 'palmares' && (
          <div className="stack">
            <p className="small muted">
              Classement de tous les dégustateurs, toutes soirées confondues, selon le pourcentage des points de pronostics obtenus. Les participations hors concours ne comptent pas dans la moyenne.
            </p>
            <div className="panel flush">
              {!data.palmares.length && <div className="item muted">Le palmarès se remplira après la première révélation.</div>}
              {data.palmares.map((p, i) => (
                <div key={p.name} className={`result ${i === 0 ? 'first' : ''}`} style={{ display: 'block' }}>
                  <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
                    <div className="rank">{p.moyenne === null ? '–' : i + 1}</div>
                    <div className="grow">
                      <div className="wine-name">{p.name}</div>
                      <div className="facts">
                        {p.soirees} soirée{p.soirees > 1 ? 's' : ''} · {p.victoires} victoire{p.victoires > 1 ? 's' : ''}
                        {p.meilleur ? ` · record ${fmtNote(p.meilleur.pct)} %` : ''}
                      </div>
                    </div>
                    <div className="score">
                      {p.moyenne === null ? '–' : `${fmtNote(p.moyenne)} %`}
                    </div>
                  </div>
                  <button className="linklike small" style={{ marginTop: 8, marginLeft: 'calc(1.6em + 14px)' }} onClick={() => setOpen(open === p.name ? null : p.name)}>
                    {open === p.name ? 'Masquer ses soirées' : 'Voir ses soirées'}
                  </button>
                  {open === p.name && (
                    <div className="stack small" style={{ marginTop: 10, marginLeft: 'calc(1.6em + 14px)' }}>
                      {p.historique.map((h) => (
                        <Link key={h.code} href={`/t/${h.code}/resultats`} className="row between" style={{ textDecoration: 'none', color: 'inherit', flexWrap: 'nowrap' }}>
                          <span>
                            {h.soiree}
                            {h.date ? <span className="muted"> · {fmtDate(h.date)}</span> : null}
                          </span>
                          <strong style={{ whiteSpace: 'nowrap' }}>
                            {h.hors_concours ? 'hors concours' : `${h.rang ? `${h.rang}${h.rang === 1 ? 'er' : 'e'} · ` : ''}${fmtNote(h.pct)} %`}
                          </strong>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
