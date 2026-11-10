'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, Band, Notice, Capsule, Loading, fmtNote } from './ui';
import { sur20 } from '@/lib/bareme';


const TABS = [
  ['vins', 'Meilleur vin'],
  ['degustateurs', 'Meilleur dégustateur'],
  ['commentaires', 'Commentaires'],
  ['resume', 'Résumé'],
];

const num = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
// Note globale sur 20, au prorata du pourcentage des points possibles.
const noteTxt = (pct) => `${String(sur20(pct)).replace('.', ',')}/20`;

// Détail transparent d'un score sur un vin : critère par critère, avec l'explication.
export function ScoreDetail({ d }) {
  // Dans l'ordre du pronostic : pays, région et appellation, cépages, millésime.
  const rows = [
    ['Pays', d.country, d.why.country],
    ['Région et appellation', d.geo, d.why.geo],
    ['Cépages', d.grapes, d.why.grapes],
    ['Millésime', d.vintage, d.why.vintage],
  ];
  return (
    <div className="breakdown tiny" style={{ marginTop: 4 }}>
      {rows.map(([label, c, why]) => (
        <span key={label} style={{ display: 'contents' }}>
          <strong style={{ whiteSpace: 'nowrap' }}>
            {label} {num(c.pts)}/{c.max}
          </strong>
          <span className="muted">{why}</span>
        </span>
      ))}
    </div>
  );
}

function guessLine(g) {
  if (!g) return 'Pas de pronostic';
  const v = g.vintage === 0 ? 'non millésimé' : g.vintage;
  return [g.grapes, g.appellation, g.region, g.country, v].filter((x) => x !== null && x !== undefined && x !== '').join(' · ') || 'Pas de pronostic';
}

export default function ResultsPage({ code }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('vins');

  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer;
    const load = async () => {
      try {
        const d = await api(`/api/t/${code}/results`);
        if (stop) return;
        setData((prev) => {
          if (prev?.live && !d.live) setJustFinished(true);
          return d;
        });
        setError(null);
        // Pendant la révélation vin par vin, on suit en direct.
        if (d.live) timer = setTimeout(load, 3000);
      } catch (e) {
        if (stop) return;
        setError(e);
        if (e.status === 403) timer = setTimeout(load, 5000); // révélation pas encore commencée
      }
    };
    load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
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
  if (data.live) return <LiveReveal data={data} code={code} />;

  return (
    <main>
      <Band title="Résultats" sub={data.tasting.name} back={data.me ? `/t/${code}` : '/archives'} />
      <div className="page">
        <Podium data={data} animate={justFinished} />
        <Trophies list={data.trophies || []} animate={justFinished} />
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
  return [w.producer, w.wine_name !== w.producer ? w.wine_name : null].filter(Boolean).join(', ');
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
            <div className="facts">{[w.appellation, w.vintage].filter(Boolean).join(', ')}</div>
            <div className="facts">{[w.grapes, w.region, w.country, w.color].filter(Boolean).join(' · ')}</div>
            {w.owner && <div className="facts">Apportée par {w.owner}</div>}
            {w.topAromas.length > 0 && (
              <div className="facts">
                Arômes cités : {(w.topFamilles || []).length ? <strong>{w.topFamilles.join(', ').toLowerCase()}</strong> : null}
                {(w.topFamilles || []).length ? ' · ' : ''}
                {w.topAromas.join(', ').toLowerCase()}
              </div>
            )}
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
                {num(t.points)} pts sur {t.max} · {t.answered} pronostic{t.answered > 1 ? 's' : ''}
                {t.hors_concours ? ' · hors concours' : ''}
              </div>
              <div className="facts tiny">
                Cépages {num(t.byCrit.grapes.pts)}/{t.byCrit.grapes.max} · Géo {num(t.byCrit.geo.pts)}/{t.byCrit.geo.max} · Pays {num(t.byCrit.country.pts)}/{t.byCrit.country.max} · Millésime {num(t.byCrit.vintage.pts)}/{t.byCrit.vintage.max}
              </div>
            </div>
            <div className="score">
              {String(sur20(t.pct)).replace('.', ',')}
              <small>/20</small>
            </div>
          </div>
          <button className="linklike small" style={{ marginTop: 8, marginLeft: 'calc(1.6em + 14px)' }} onClick={() => setOpen(open === t.id ? null : t.id)}>
            {open === t.id ? 'Masquer le détail' : 'Voir le détail du calcul'}
          </button>
          {open === t.id && (
            <div style={{ marginTop: 10, marginLeft: 'calc(1.6em + 14px)' }} className="stack">
              {t.details.map((d) => (
                <div key={d.bottleId} className="row small" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <Capsule n={d.number} size="xs" />
                  <div className="grow">
                    <strong>
                      {num(d.total)}/{d.max} pts
                    </strong>{' '}
                    <span className="muted">{numById[d.bottleId] ? wineTitle(numById[d.bottleId]) : ''}</span>
                    <div className="tiny" style={{ marginTop: 2 }}>
                      Réponse : {guessLine(d.guess)}
                    </div>
                    {d.answered && <ScoreDetail d={d} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="tiny muted" style={{ padding: '0 16px 14px' }}>
        Classement au pourcentage des points possibles : 20 points par vin français, 23 par vin étranger, sans compter ses propres bouteilles. Départage : cépages, puis géographie, puis pays, puis millésime. HC : hors concours.
      </p>
    </div>
  );
}

function Comments({ data }) {
  const withComments = [...data.wines].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)).filter((w) => w.comments.length);
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
      <Link className="small center" href="/archives">
        Voir toutes les soirées et le palmarès
      </Link>
    </div>
  );
}

// ---------- Révélation vin par vin, en direct ----------
function LiveReveal({ data, code }) {
  const seen = useRef(null);
  const [count, setCount] = useState(null); // compte à rebours en cours
  const [shownCount, setShownCount] = useState(data.revealed.length);
  const n = data.revealed.length;

  useEffect(() => {
    if (seen.current === null) {
      seen.current = n; // à l'ouverture de la page : pas de compte à rebours pour les vins déjà révélés
      setShownCount(n);
      return;
    }
    if (n > seen.current) {
      seen.current = n;
      const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        setShownCount(n);
        return;
      }
      setCount(3);
      const t1 = setTimeout(() => setCount(2), 1000);
      const t2 = setTimeout(() => setCount(1), 2000);
      const t3 = setTimeout(() => {
        setCount(null);
        setShownCount(n);
      }, 3000);
      return () => [t1, t2, t3].forEach(clearTimeout);
    }
  }, [n]);

  const visible = data.revealed.slice(0, shownCount);
  const next = data.revealed[shownCount];
  const remaining = data.total - shownCount;
  const during = data.tasting.phase === 'degustation'; // révélations au fil de la dégustation

  return (
    <main>
      <Band title="Révélation" sub={data.tasting.name} back={data.me ? `/t/${code}` : '/archives'} />
      <div className="page stack">
        {count !== null && next && (
          <div className="countdown" role="status" aria-live="assertive">
            <div>
              <div className="lbl">Révélation du vin n°{next.number}</div>
              <div className="num" key={count}>
                {count}
              </div>
            </div>
          </div>
        )}
        <div className="panel center">
          <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
            {[...Array(data.total)].map((_, i) => (
              <span key={i} className={`dot ${i < shownCount ? 'full' : ''}`} />
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {shownCount} vin{shownCount > 1 ? 's' : ''} révélé{shownCount > 1 ? 's' : ''} sur {data.total}
            {during ? (remaining > 0 ? ' · la dégustation continue' : ' · d’autres bouteilles peuvent encore arriver') : remaining > 0 ? ' · le meilleur sera révélé en dernier' : ' · le podium arrive !'}
          </p>
          {during && data.me && (
            <Link href={`/t/${code}`} className="btn block" style={{ marginTop: 10 }}>
              Retour aux vins à déguster
            </Link>
          )}
        </div>
        {visible.length === 0 && (
          <div className="panel center stack">
            <span className="spinner" />
            <p className="muted">L’organisateur va révéler le premier vin…</p>
          </div>
        )}
        {shownCount > 0 && data.standings?.length > 0 && <Standings list={data.standings} n={shownCount} />}
        {[...visible].reverse().map((w, i) => (
          <div key={w.id} className={`panel reveal-card ${i === 0 ? 'latest' : ''}`}>
            <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <Capsule n={w.number} size={i === 0 ? 'lg' : 'sm'} />
              <div className="grow">
                <div className="wine-name">{wineTitle(w)}</div>
                <div className="facts">{[w.appellation, w.vintage || 'Non millésimé'].filter(Boolean).join(', ')}</div>
                <div className="facts">{[w.grapes, w.region, w.country, w.color].filter(Boolean).join(' · ')}</div>
                {w.owner && <div className="facts">Apportée par {w.owner}</div>}
                {w.notes && <div className="facts" style={{ fontStyle: 'italic' }}>« {w.notes} »</div>}
                {w.myNote !== null && w.myNote !== undefined && <div className="tiny" style={{ marginTop: 4 }}>Votre note : {fmtNote(w.myNote)}/20</div>}
              </div>
              <div className="score">
                {fmtNote(w.average)}
                <small>/20</small>
                {w.rank && (
                  <div className="tiny muted" style={{ fontFamily: 'var(--sans)', marginTop: 4 }}>
                    {w.rank === 1 ? '1er' : `${w.rank}e`} sur {data.total}
                  </div>
                )}
              </div>
            </div>
            {i === 0 && w.scores?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="section-label" style={{ marginTop: 0 }}>
                  Les pronostics sur ce vin (sur {w.scores[0].max} points)
                </div>
                <div className="tiny muted">Touchez un nom pour voir le détail des points, critère par critère.</div>
                {w.scores.map((sc) => (
                  <details key={sc.name} className="small" style={{ padding: '4px 0', borderTop: '1px solid var(--trait)' }}>
                    <summary style={{ listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 10, color: 'var(--encre)' }}>
                      <span>
                        <strong>{sc.name}</strong> <span className="muted tiny">{guessLine(sc.guess)}</span>
                      </span>
                      <strong style={{ whiteSpace: 'nowrap', color: 'var(--lie)' }}>
                        {num(sc.total)} pts
                      </strong>
                    </summary>
                    {sc.detail ? (
                      <ScoreDetail d={sc.detail} />
                    ) : (
                      <div className="tiny muted">
                        Cépages : {sc.why.grapes} · Géographie : {sc.why.geo} · Pays : {sc.why.country} · Millésime : {sc.why.vintage}
                      </div>
                    )}
                  </details>
                ))}
              </div>
            )}
            {i === 0 && w.comments?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {w.comments.slice(0, 3).map((c, k) => (
                  <div key={k} className="quote">
                    <div>{c.text}</div>
                    <div className="who">{c.author}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

// ---------- Podium final ----------
function Podium({ data, animate }) {
  const best = data.wines.filter((w) => w.rank === 1);
  const tasters = data.tasters.filter((t) => t.rank && t.answered > 0);
  const top = [1, 2, 3].map((r) => tasters.filter((t) => t.rank === r));
  if (!best.length && !tasters.length) return null;
  const names = (list) => list.map((t) => t.name).join(' et ');
  return (
    <div className={`panel stack ${animate ? 'reveal-in' : ''}`} style={{ marginBottom: 12 }}>
      {best.length > 0 && (
        <div className="center">
          <div className="muted small">Meilleur vin de la soirée</div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 6 }}>
            <Capsule n={best[0].number} />
            <div style={{ textAlign: 'left' }}>
              <div className="wine-name">{best.map(wineTitle).join(' et ')}</div>
              <div className="facts">
                {fmtNote(best[0].average)}/20{best.length === 1 && best[0].owner ? ` · apportée par ${best[0].owner}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}
      {tasters.length > 0 && (
        <>
          <div className="muted small center" style={{ marginTop: 6 }}>
            Podium des dégustateurs
          </div>
          <div className="podium">
            {[1, 0, 2].map((i) => (
              <div key={i} className={`step p${i + 1}`} style={{ visibility: top[i].length ? 'visible' : 'hidden' }}>
                <div className="medal">{i + 1}</div>
                <div className="who">{names(top[i]) || '-'}</div>
                <div className="pts">{top[i][0] ? noteTxt(top[i][0].pct) : ''}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Trophées de la Confrérie ----------
const TROPHY_ICON = { pif: 'nez', gps: 'carte', millesime: 'sablier', nez: 'grappe', lanterne: 'lanterne' };
function TrophyIcon({ id }) {
  const k = TROPHY_ICON[id];
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      {k === 'nez' && <path {...c} d="M12 3c-1 4-3.5 8-3.5 11.5A3.5 3.5 0 0 0 12 18a3.5 3.5 0 0 0 3.5-3.5M8.5 14.5c-1 0-2 .7-2 1.8 0 1 .8 1.7 1.8 1.7M15.5 14.5c1 0 2 .7 2 1.8 0 1-.8 1.7-1.8 1.7M9 21h6" />}
      {k === 'carte' && <path {...c} d="M12 21s-6-5.6-6-10.5A6 6 0 0 1 18 10.5C18 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />}
      {k === 'sablier' && <path {...c} d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />}
      {k === 'grappe' && <path {...c} d="M12 4c0-1 1-2 2.5-2M9.5 8.5a2 2 0 1 0 0-.01M14.5 8.5a2 2 0 1 0 0-.01M12 12a2 2 0 1 0 0-.01M7.5 12.5a2 2 0 1 0 0-.01M16.5 12.5a2 2 0 1 0 0-.01M10 16a2 2 0 1 0 0-.01M14 16a2 2 0 1 0 0-.01M12 19.5a2 2 0 1 0 0-.01" />}
      {k === 'lanterne' && <path {...c} d="M10 3h4M12 3v2M8 7h8l-1 11H9L8 7zM9 18h6v3H9zM12 10v5" />}
    </svg>
  );
}

function Trophies({ list, animate }) {
  if (!list.length) return null;
  return (
    <div className={`panel stack trophies ${animate ? 'reveal-in' : ''}`} style={{ marginBottom: 12 }}>
      <div className="muted small center">Trophées de la Confrérie</div>
      <ul className="trophy-list">
        {list.map((t) => (
          <li key={t.id} className={`trophy ${t.id}`}>
            <span className="trophy-icon">
              <TrophyIcon id={t.id} />
            </span>
            <span className="trophy-body">
              <span className="trophy-title">{t.titre}</span>
              <span className="trophy-who">{t.winners.join(' et ')}</span>
              <span className="trophy-why">
                {t.pour} · {t.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Classement provisoire, calculé uniquement sur les vins déjà révélés.
function Standings({ list, n }) {
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, 3);
  return (
    <div className="panel">
      <div className="row between">
        <strong>Classement provisoire</strong>
        <span className="tiny muted">
          après {n} vin{n > 1 ? 's' : ''}
        </span>
      </div>
      <div className="stack" style={{ marginTop: 8, gap: 6 }}>
        {shown.map((t) => (
          <div key={t.id} className="row between small" style={{ flexWrap: 'nowrap' }}>
            <span>
              <strong style={{ color: 'var(--or-fonce)', display: 'inline-block', width: '1.8em' }}>{t.rank ?? 'HC'}</strong>
              {t.name}
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>
              {num(t.points)}/{t.max} pts · <strong>{noteTxt(t.pct)}</strong>
            </span>
          </div>
        ))}
      </div>
      {list.length > 3 && (
        <button className="linklike small" style={{ marginTop: 8 }} onClick={() => setAll(!all)}>
          {all ? 'Voir le podium seulement' : `Voir les ${list.length} dégustateurs`}
        </button>
      )}
    </div>
  );
}
