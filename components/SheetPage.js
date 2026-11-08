'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Band, Notice, Capsule, Chips, Scale, NoteInput, Loading, plural } from './ui';
import Autocomplete from './Autocomplete';
import RegionMap from './RegionMap';
import { optionsFor, fillFromAppellation, fillFromRegion, describePatch } from '@/lib/autofill';
import { ROBES, AROMES, SCALES, COLORS, COUNTRIES, REGIONS, GRAPES, NON_VINTAGE } from '@/lib/constants';
import { BAREME, VINTAGE_DECADES } from '@/lib/bareme';

const EMPTY_RATING = {
  robe: null, intensite_visuelle: null, intensite_nez: null, aromes: [], acidite: null,
  tanins: null, corps: null, equilibre: null, longueur: null, note: null, commentaire: '',
};
const EMPTY_PRED = { appellation: '', grapes: '', region: '', country: '', color: null, vintage: '' };

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj?.[k] ?? null]));

export default function SheetPage({ code, number }) {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState('prono'); // onglet 1 : pronostics, onglet 2 : fiche de dégustation
  const [rating, setRating] = useState(EMPTY_RATING);
  const [pred, setPred] = useState(EMPTY_PRED);
  const [save, setSave] = useState({ status: 'idle', msg: '' });
  const dirty = useRef({ rating: false, prediction: false });
  const filled = useRef({});
  const [autoNote, setAutoNote] = useState(null);
  const timer = useRef(null);
  const latest = useRef({ rating, pred });
  latest.current = { rating, pred };

  // Chargement initial
  useEffect(() => {
    let alive = true;
    api(`/api/t/${code}`)
      .then((d) => {
        if (!alive) return;
        if (!d.me) return router.replace(`/t/${code}`);
        setState(d);
        const b = d.bottles.find((x) => x.number === number);
        if (!b) return;
        const s = d.sheets[b.id] || {};
        const localRaw = typeof localStorage !== 'undefined' ? safeGet(`dg_${code}_${b.id}`) : null;
        const r = s.rating ? { ...EMPTY_RATING, ...pick(s.rating, Object.keys(EMPTY_RATING)) } : localRaw?.rating || EMPTY_RATING;
        const p = s.prediction ? { ...EMPTY_PRED, ...pick(s.prediction, Object.keys(EMPTY_PRED)) } : localRaw?.pred || EMPTY_PRED;
        setRating({ ...r, aromes: r.aromes || [], commentaire: r.commentaire || '' });
        setPred({ ...p, grapes: p.grapes || '', region: p.region || '', country: p.country || '', appellation: p.appellation || '', vintage: p.vintage ?? '' });
        if (!s.rating && localRaw?.rating) dirty.current.rating = true;
        if (!s.prediction && localRaw?.pred) dirty.current.prediction = true;
        if (dirty.current.rating || dirty.current.prediction) schedule(0);
      })
      .catch((e) => alive && setLoadError(e));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, number]);

  const bottles = state?.bottles || [];
  const idx = bottles.findIndex((b) => b.number === number);
  const bottle = bottles[idx];
  // Verrouillé : hors dégustation, ou vin déjà révélé (les vins sont révélés un par un).
  const thisRevealed = !!state && (state.tasting.revealed_numbers || []).includes(Number(number));
  const locked = state?.tasting.phase !== 'degustation' || thisRevealed;

  // Surveille l'état de la soirée (pause, révélation) sans toucher à la saisie en cours.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      api(`/api/t/${code}`)
        .then((d) => setState((s) => (s ? { ...s, tasting: d.tasting, bottles: d.bottles?.length ? d.bottles : s.bottles } : s)))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [code]);

  async function flush() {
    if (!bottle) return;
    const { rating: r, pred: p } = latest.current;
    const payload = { bottleId: bottle.id };
    if (dirty.current.rating) payload.rating = r;
    if (dirty.current.prediction) payload.prediction = { ...p, vintage: p.vintage === '' ? null : Number(p.vintage) };
    if (!payload.rating && !payload.prediction) return;
    dirty.current = { rating: false, prediction: false };
    setSave({ status: 'saving', msg: 'Enregistrement…' });
    try {
      await api(`/api/t/${code}/sheet`, { method: 'PUT', body: payload, keepalive: true });
      // Si une autre modification est arrivée pendant l'envoi, elle part juste après :
      // on n'affiche « Enregistré » que lorsque tout est vraiment enregistré.
      if (dirty.current.rating || dirty.current.prediction) {
        setSave({ status: 'pending', msg: 'Modification en cours…' });
      } else {
        setSave({ status: 'saved', msg: 'Enregistré' });
        safeDel(`dg_${code}_${bottle.id}`);
      }
    } catch (e) {
      if (payload.rating) dirty.current.rating = true;
      if (payload.prediction) dirty.current.prediction = true;
      if (e.status === 403) {
        setSave({ status: 'error', msg: e.message });
        return;
      }
      setSave({ status: 'error', msg: 'Non enregistré, nouvel essai…' });
      schedule(3000);
    }
  }

  function schedule(ms = 700) {
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, ms);
  }

  function change(kind, patch) {
    if (locked) return;
    if (kind === 'rating') setRating((x) => ({ ...x, ...patch }));
    else setPred((x) => ({ ...x, ...patch }));
    dirty.current[kind === 'rating' ? 'rating' : 'prediction'] = true;
    setSave({ status: 'pending', msg: 'Modification en cours…' });
    // Copie de secours sur le téléphone en cas de coupure réseau.
    if (bottle) {
      const next = { ...latest.current, [kind === 'rating' ? 'rating' : 'pred']: { ...(kind === 'rating' ? latest.current.rating : latest.current.pred), ...patch } };
      safeSet(`dg_${code}_${bottle.id}`, { rating: next.rating, pred: next.pred });
    }
    schedule();
  }

  // Enregistre avant de quitter la page.
  useEffect(() => {
    const h = () => {
      if (dirty.current.rating || dirty.current.prediction) flush();
    };
    window.addEventListener('pagehide', h);
    return () => {
      window.removeEventListener('pagehide', h);
      h();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottle?.id]);

  async function go(target) {
    clearTimeout(timer.current);
    await flush();
    router.push(target);
  }

  if (loadError) {
    return (
      <main>
        <Band title="Fiche indisponible" back={`/t/${code}`} />
        <div className="page">
          <Notice kind="error">{loadError.message}</Notice>
        </div>
      </main>
    );
  }
  if (!state) return <Loading />;
  if (!bottle) {
    return (
      <main>
        <Band title={`Vin n°${number}`} back={`/t/${code}`} />
        <div className="page">
          <Notice kind="info">Ce vin n’est pas disponible pour le moment.</Notice>
        </div>
      </main>
    );
  }

  const prev = bottles[idx - 1];
  const next = bottles[idx + 1];
  const r = rating;
  const predOpts = optionsFor(pred.country, pred.region); // listes du pays, puis de la région pronostiqués
  const sc = (key) => (
    <Scale steps={SCALES[key].steps} none={SCALES[key].none} value={r[key]} onChange={(v) => change('rating', { [key]: v })} disabled={locked} />
  );

  return (
    <main>
      <Band
        title={`Vin n°${bottle.number}`}
        sub={`${plural(bottles.length, 'vin')} à déguster`}
        back={`/t/${code}`}
        right={<Capsule n={bottle.number} />}
      />
      <div className="page">
        <div className="sticky-tabs">
          <nav className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'prono'} onClick={() => setTab('prono')}>
              Pronostics
            </button>
            <button role="tab" aria-selected={tab === 'fiche'} onClick={() => setTab('fiche')}>
              Fiche de dégustation
            </button>
          </nav>
        </div>

        {locked && (state.tasting.phase === 'revelee' || state.tasting.phase === 'revelation' || thisRevealed) && (
          <div className="panel stack center reveal-in" style={{ marginBottom: 12 }}>
            <h2>{thisRevealed && state.tasting.phase === 'degustation' ? `Le vin n°${number} est révélé` : state.tasting.phase === 'revelation' ? 'La révélation a commencé' : 'Les bouteilles sont révélées'}</h2>
            <p className="small muted">Cette fiche est verrouillée.</p>
            <Link href={`/t/${code}/resultats`} className="btn gold block">
              {state.tasting.phase === 'revelee' ? 'Voir les résultats' : 'Voir la révélation'}
            </Link>
          </div>
        )}
        {!locked && state.tasting.current_number && state.tasting.current_number !== bottle.number && bottles.some((x) => x.number === state.tasting.current_number) && (
          <div className="notice info row between" style={{ marginBottom: 12, flexWrap: 'nowrap' }}>
            <span>
              On sert maintenant le <strong>n°{state.tasting.current_number}</strong>
            </span>
            <button className="btn sm" onClick={() => go(`/t/${code}/vin/${state.tasting.current_number}`)}>
              Y aller
            </button>
          </div>
        )}
        {(() => {
          // Un autre vin vient d'être révélé : on le signale, sans quitter la fiche en cours.
          const rv = state.tasting.revealed_numbers || [];
          const last = rv[rv.length - 1];
          if (state.tasting.phase !== 'degustation' || !last || last === bottle.number) return null;
          return (
            <div className="notice ok row between" style={{ marginBottom: 12, flexWrap: 'nowrap' }}>
              <span>
                <strong>Vin n°{last} révélé</strong>
              </span>
              <Link className="btn sm" href={`/t/${code}/resultats`}>
                Voir
              </Link>
            </div>
          );
        })()}
        {(state.myBottles || []).some((m) => m.id === bottle.id) && (
          <Notice kind="info">C’est votre bouteille : vous pouvez la noter pour le plaisir, mais votre note et vos pronostics ne comptent pas.</Notice>
        )}
        {locked && state.tasting.phase === 'preparation' && <Notice kind="info">La dégustation est en pause : vos saisies reprendront dès sa relance.</Notice>}

        {tab === 'fiche' && (
          <div className="panel" style={{ marginTop: 12 }}>
            <Crit n={1} title="Couleur et robe">
              {ROBES.map((g) => (
                <div key={g.group}>
                  <div className="chip-group-label">{g.group}</div>
                  <Chips options={g.values} value={r.robe} onChange={(v) => change('rating', { robe: v })} disabled={locked} />
                </div>
              ))}
            </Crit>
            <Crit n={2} title={SCALES.intensite_visuelle.label}>{sc('intensite_visuelle')}</Crit>
            <Crit n={3} title={SCALES.intensite_nez.label}>{sc('intensite_nez')}</Crit>
            <Crit n={4} title="Familles aromatiques" hint="Plusieurs choix possibles.">
              <Chips multi options={AROMES} value={r.aromes} onChange={(v) => change('rating', { aromes: v })} disabled={locked} />
            </Crit>
            <Crit n={5} title={SCALES.acidite.label}>{sc('acidite')}</Crit>
            <Crit n={6} title={SCALES.tanins.label}>{sc('tanins')}</Crit>
            <Crit n={7} title={SCALES.corps.label}>{sc('corps')}</Crit>
            <Crit n={8} title={SCALES.equilibre.label}>{sc('equilibre')}</Crit>
            <Crit n={9} title={SCALES.longueur.label} hint={SCALES.longueur.hint}>
              {sc('longueur')}
            </Crit>
            <Crit n={10} title="Note globale">
              <NoteInput value={r.note} onChange={(v) => change('rating', { note: v })} disabled={locked} />
            </Crit>
            <Crit n={11} title="Commentaire personnel">
              <textarea
                className="input"
                value={r.commentaire}
                onChange={(e) => change('rating', { commentaire: e.target.value })}
                placeholder="Vos impressions, un accord mets-vin, un souvenir…"
                aria-label="Commentaire personnel"
                maxLength={1000}
                disabled={locked}
              />
            </Crit>
          </div>
        )}

        {tab === 'prono' && (
          <div className="panel" style={{ marginTop: 12 }}>
            <p className="small muted">
              D’après vous, quel est ce vin ? Un vin français vaut {BAREME.france.total} points, un vin étranger {BAREME.foreign.total} points. Vos pronostics restent secrets jusqu’à la révélation.
            </p>
            <Crit title="Pays" n={1} pts={`${BAREME.france.country} ou ${BAREME.foreign.country} pts`} hint={`${BAREME.france.country} points si le vin est français, ${BAREME.foreign.country} points s’il est étranger.`}>
              <select className="input" aria-label="Pays" value={pred.country} onChange={(e) => change('pred', { country: e.target.value })} disabled={locked}>
                <option value="">Choisir un pays</option>
                {COUNTRIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Crit>
            <Crit
              title="Région, sous-région ou zone"
              n={2}
              pts="2 à 4 pts"
              hint={`Touchez la région sur la carte ou tapez son nom : les appellations et les cépages proposés se limitent ensuite à cette région. Si l’appellation est fausse, une bonne région rapporte quand même : vin français 3 points ; vin étranger, sous-région 4, région 3, grande zone 2.${pred.country ? '' : ' Choisissez d’abord le pays.'}`}
            >
              <RegionMap
                country={pred.country}
                value={pred.region}
                disabled={locked}
                onPick={(name) => {
                  const patch = fillFromRegion({ ...pred, region: name }, name, filled.current);
                  change('pred', { region: name, ...(patch || {}) });
                }}
              />
              <Autocomplete
                value={pred.region}
                onChange={(v) => change('pred', { region: v })}
                options={predOpts.regions}
                browse
                onPick={(o) => {
                  const patch = fillFromRegion({ ...pred, region: o.label }, o.label, filled.current);
                  if (patch) change('pred', patch);
                }}
                placeholder="Ex : Bourgogne, Toscane, Napa Valley"
                aria-label="Région"
                maxLength={80}
                disabled={locked}
              />
            </Crit>
            <Crit
              title="Appellation"
              n={3}
              pts="5 pts"
              hint={predOpts.inRegion ? `Appellations de la région ${pred.region}${predOpts.generic ? `, plus ${predOpts.generic} pour les vins sans appellation` : ''}. Une autre appellation du pays ? Tapez son nom, elle sera proposée. Appellation exacte : 5 points.` : 'Appellation exacte : 5 points. Choisissez d’abord la région pour réduire la liste.'}
            >
              <Autocomplete
                value={pred.appellation}
                onChange={(v) => change('pred', { appellation: v })}
                options={predOpts.appellations}
                fallback={predOpts.inRegion ? predOpts.countryAppellations : undefined}
                browse
                onPick={(o) => {
                  const patch = fillFromAppellation({ ...pred, appellation: o.label }, o.label, filled.current);
                  if (patch) delete patch.color; // la couleur ne fait pas partie du barème
                  if (patch && Object.keys(patch).length) change('pred', patch);
                  setAutoNote(describePatch(patch));
                }}
                placeholder="Tapez les premières lettres, ex : gev"
                aria-label="Appellation"
                maxLength={120}
                disabled={locked}
              />
              {autoNote && <div className="autofill-note">{autoNote}</div>}
            </Crit>
            <Crit
              title="Cépage(s)"
              n={4}
              pts={`${BAREME.france.grapes} pts`}
              hint={`Assemblage : chaque cépage trouvé rapporte sa part (70 % de Merlot = 7 points). Moins ${BAREME.grapeWrongPenalty} point par cépage faux. Séparez les cépages par des virgules.${predOpts.inRegion ? ` Liste : cépages de la région ${pred.region} ; tapez un autre nom pour chercher dans tout le pays.` : ''}`}
            >
              <Autocomplete
                multi
                value={pred.grapes}
                onChange={(v) => change('pred', { grapes: v })}
                options={predOpts.grapes}
                fallback={predOpts.inRegion ? predOpts.countryGrapes : undefined}
                browse
                placeholder="Ex : Pinot Noir"
                aria-label="Cépage"
                maxLength={120}
                disabled={locked}
              />
            </Crit>
            <Crit title="Millésime" n={5} pts={`${BAREME.france.vintage} pts`} hint="Année exacte : 3 points. Ensuite on perd des points à chaque année d’écart, moins vite pour les vins anciens (tableau ci-dessous).">
              <div className="row">
                <input
                  className="input grow"
                  type="number"
                  inputMode="numeric"
                  min="1900"
                  max="2100"
                  value={pred.vintage === NON_VINTAGE ? '' : pred.vintage}
                  onChange={(e) => change('pred', { vintage: e.target.value })}
                  placeholder="Ex : 2019"
                  aria-label="Millésime"
                  disabled={locked || pred.vintage === NON_VINTAGE}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="chip"
                  aria-pressed={pred.vintage === NON_VINTAGE}
                  onClick={() => change('pred', { vintage: pred.vintage === NON_VINTAGE ? '' : NON_VINTAGE })}
                  disabled={locked}
                >
                  Non millésimé
                </button>
              </div>
              <VintageTable />
            </Crit>
            {!locked && (
              <button className="btn gold block" style={{ marginTop: 8 }} onClick={() => { setTab('fiche'); window.scrollTo({ top: 0 }); }}>
                Passer à la fiche de dégustation
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bottom-bar">
        <div className="inner">
          <button className="btn ghost sm" disabled={!prev} onClick={() => prev && go(`/t/${code}/vin/${prev.number}`)} aria-label="Vin précédent">
            ‹ {prev ? `n°${prev.number}` : ''}
          </button>
          <div className={`save-state ${save.status}`} aria-live="polite">
            {save.msg || (locked ? 'Lecture seule' : 'Enregistrement automatique')}
          </div>
          {next ? (
            <button className="btn sm" onClick={() => go(`/t/${code}/vin/${next.number}`)} aria-label="Vin suivant">
              n°{next.number} ›
            </button>
          ) : (
            <button className="btn sm" onClick={() => go(`/t/${code}`)}>
              Liste
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Crit({ n, title, hint, pts, children }) {
  return (
    <section className="crit">
      <div className="crit-head">
        {n && <span className="crit-num">{n}</span>}
        <span className="crit-title">{title}</span>
        {pts && <span className="pill" style={{ marginLeft: 'auto' }}>{pts}</span>}
      </div>
      {hint && <div className="crit-hint">{hint}</div>}
      {children}
    </section>
  );
}

function safeGet(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null;
  }
}
function safeSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function safeDel(k) {
  try {
    localStorage.removeItem(k);
  } catch {}
}

export function VintageTable() {
  const f = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
  return (
    <table className="grid tiny" style={{ marginTop: 10 }}>
      <thead>
        <tr>
          <th>Millésime réel</th>
          <th>Par année d’écart</th>
          <th>0 point à partir de</th>
        </tr>
      </thead>
      <tbody>
        {VINTAGE_DECADES.map((d) => (
          <tr key={d.label}>
            <td>{d.label}</td>
            <td>−{f(BAREME.france.vintage / d.zeroAt)} pt</td>
            <td>{d.zeroAt} ans d’écart</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
