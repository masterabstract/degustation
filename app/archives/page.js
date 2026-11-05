'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Band, Notice, Loading, fmtDate, fmtNote } from '@/components/ui';

export default function Archives() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('soirees');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api('/api/archives').then(setData).catch(setError);
  }, []);

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
            {!data.soirees.length && <div className="panel muted">Aucune soirée révélée pour l’instant. Elles apparaîtront ici après leur révélation.</div>}
            {data.soirees.map((s) => (
              <Link key={s.code} href={`/t/${s.code}/resultats`} className="panel" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div className="row between" style={{ alignItems: 'baseline' }}>
                  <h2 style={{ margin: 0 }}>{s.name}</h2>
                  <span className="chev" aria-hidden="true">
                    ›
                  </span>
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
                    <strong>Meilleur dégustateur :</strong> {s.meilleurDegustateur.map((x) => x.name).join(' et ')} ({s.meilleurDegustateur[0].points} pts)
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {tab === 'palmares' && (
          <div className="stack">
            <p className="small muted">
              Classement de tous les dégustateurs, toutes soirées confondues, selon leur moyenne de pronostics sur 20 par vin. Les participations hors concours ne comptent pas dans la moyenne.
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
                        {p.meilleur ? ` · record ${fmtNote(p.meilleur.sur20)}/20` : ''}
                      </div>
                    </div>
                    <div className="score">
                      {p.moyenne === null ? '–' : fmtNote(p.moyenne)}
                      <small>/20</small>
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
                            {h.hors_concours ? 'hors concours' : `${h.rang ? `${h.rang}${h.rang === 1 ? 'er' : 'e'} · ` : ''}${h.points}/${h.max} pts`}
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
