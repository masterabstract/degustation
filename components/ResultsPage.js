'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Band, Notice, Capsule, Loading, fmtNote } from './ui';

const TABS = [
  ['vins', 'Meilleur vin'],
  ['degustateurs', 'Meilleur dégustateur'],
  ['commentaires', 'Commentaires'],
  ['resume', 'Résumé'],
];

const DETAIL_LABELS = { color: 'Couleur', grapes: 'Cépage', region: 'Région', appellation: 'Appellation', vintage: 'Millésime', price: 'Prix' };

export default function ResultsPage({ code }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('vins');

  useEffect(() => {
    api(`/api/t/${code}/results`).then(setData).catch(setError);
  }, [code]);

  if (error) {
    return (
      <main>
        <Band title="Résultats" back={`/t/${code}`} />
        <div className="page">
          <Notice kind="info">{error.message}</Notice>
        </div>
      </main>
    );
  }
  if (!data) return <Loading label="Calcul des résultats…" />;

  return (
    <main>
      <Band title="Résultats" sub={data.tasting.name} back={`/t/${code}`} />
      <div className="page">
        <div className="sticky-tabs">
          <nav className="tabs" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="stack reveal-in" key={tab}>
          {tab === 'vins' && <Wines data={data} />}
          {tab === 'degustateurs' && <Tasters data={data} />}
          {tab === 'commentaires' && <Comments data={data} />}
          {tab === 'resume' && <Summary data={data} />}
        </div>
      </div>
    </main>
  );
}

function wineTitle(w) {
  return [w.producer, w.wine_name].filter(Boolean).join(', ');
}

function Wines({ data }) {
  return (
    <div className="panel flush">
      {data.wines.map((w) => (
        <div key={w.id} className={`result ${w.rank === 1 ? 'first' : ''}`}>
          <div className="rank">{w.rank ?? '–'}</div>
          <Capsule n={w.number} size="sm" />
          <div className="grow">
            <div className="wine-name">{wineTitle(w)}</div>
            <div className="facts">{[w.appellation, w.vintage || 'Non millésimé', w.color].filter(Boolean).join(', ')}</div>
            <div className="facts">{[w.grapes, w.region, w.price_range].filter(Boolean).join(' · ')}</div>
            <div className="facts">
              {w.owner ? `Apportée par ${w.owner}` : ''}
              {w.topAromas.length ? `${w.owner ? ' · ' : ''}${w.topAromas.join(', ').toLowerCase()}` : ''}
            </div>
            {w.notes && <div className="facts" style={{ fontStyle: 'italic' }}>« {w.notes} »</div>}
            {w.myNote !== null && <div className="tiny" style={{ marginTop: 4 }}>Votre note : {fmtNote(w.myNote)}/20</div>}
          </div>
          <div className="score">
            {fmtNote(w.average)}
            <small>/20</small>
            <div className="tiny muted" style={{ fontFamily: 'var(--sans)', marginTop: 4 }}>
              {w.count} note{w.count > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      ))}
      <p className="tiny muted" style={{ padding: '0 16px 14px' }}>
        Moyenne des notes sur 20, sans la note du propriétaire de la bouteille.
      </p>
    </div>
  );
}

function Tasters({ data }) {
  const [open, setOpen] = useState(null);
  const numById = Object.fromEntries(data.wines.map((w) => [w.id, w]));
  return (
    <div className="panel flush">
      {data.tasters.map((t) => (
        <div key={t.id} className={`result ${t.rank === 1 ? 'first' : ''}`} style={{ display: 'block' }}>
          <div className="row" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
            <div className="rank">{t.rank ?? 'HC'}</div>
            <div className="grow">
              <div className="wine-name">
                {t.name}
                {data.me?.id === t.id ? ' (vous)' : ''}
              </div>
              <div className="facts">
                {t.answered} pronostic{t.answered > 1 ? 's' : ''} · {t.appellations} appellation{t.appellations > 1 ? 's' : ''} trouvée{t.appellations > 1 ? 's' : ''}
                {t.hors_concours ? ' · hors concours' : ''}
              </div>
            </div>
            <div className="score">
              {t.points}
              <small> pts</small>
            </div>
          </div>
          <button className="linklike small" style={{ marginTop: 8, marginLeft: 'calc(1.6em + 14px)' }} onClick={() => setOpen(open === t.id ? null : t.id)}>
            {open === t.id ? 'Masquer le détail' : 'Voir le détail'}
          </button>
          {open === t.id && (
            <div style={{ marginTop: 10, marginLeft: 'calc(1.6em + 14px)' }} className="stack">
              {t.details.map((d) => (
                <div key={d.bottleId} className="row small" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <Capsule n={d.number} size="xs" />
                  <div className="grow">
                    <strong>{d.total} pts</strong> <span className="muted">{numById[d.bottleId] ? wineTitle(numById[d.bottleId]) : ''}</span>
                    <div className="tiny muted">
                      {d.answered
                        ? Object.entries(d.detail)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => `${DETAIL_LABELS[k]} +${v}`)
                            .join(', ') || 'Aucun point'
                        : 'Pas de pronostic'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="tiny muted" style={{ padding: '0 16px 14px' }}>
        Total des points de pronostics, hors bouteille apportée. En cas d’égalité, le plus d’appellations trouvées passe devant. HC : hors concours.
      </p>
    </div>
  );
}

function Comments({ data }) {
  const withComments = [...data.wines].sort((a, b) => (a.serve_order ?? 0) - (b.serve_order ?? 0)).filter((w) => w.comments.length);
  if (!withComments.length) return <div className="panel muted">Aucun commentaire n’a été laissé.</div>;
  return withComments.map((w) => (
    <div key={w.id} className="panel">
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <Capsule n={w.number} size="sm" />
        <div className="wine-name grow">{wineTitle(w)}</div>
      </div>
      {w.comments.map((c, i) => (
        <div key={i} className="quote">
          <div>{c.text}</div>
          <div className="who">
            {c.author}
            {c.note !== null ? `, ${fmtNote(c.note)}/20` : ''}
          </div>
        </div>
      ))}
    </div>
  ));
}

function Summary({ data }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="panel stack">
      <h2>Résumé de la soirée</h2>
      <div className="summary-text">{data.summary}</div>
      <button
        className="btn ghost block"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(data.summary);
            setCopied(true);
          } catch {}
        }}
      >
        {copied ? 'Résumé copié' : 'Copier le résumé (pour WhatsApp, e-mail…)'}
      </button>
      <Link className="small center" href="/">
        Retour à l’accueil
      </Link>
    </div>
  );
}
