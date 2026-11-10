'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Band, Notice, Capsule, Chips, Scale, NoteInput, Loading, plural } from './ui';
import Autocomplete from './Autocomplete';
import RegionMap from './RegionMap';
import AromaPicker from './AromaPicker';
import ServeAlert from './ServeAlert';
import { optionsFor, fillFromAppellation, fillFromRegion, describePatch, regionOptions, appellationOptions, grapeOptions, appellationGrapes } from '@/lib/autofill';
import { ROBES, AROMES, SCALES, COLORS, COUNTRIES, REGIONS, GRAPES, NON_VINTAGE } from '@/lib/constants';
import { BAREME, VINTAGE_DECADES } from '@/lib/bareme';
import { missingFields, listeChamps, PRONO_CHAMPS } from '@/lib/pronostic';
import { readDraft, writeDraft, deleteDraft, sendPendingDrafts, isNetworkError, markRefused } from '@/lib/brouillons';

const EMPTY_RATING = {
  robe: null, intensite_visuelle: null, intensite_nez: null, aromes: [], acidite: null,
  tanins: null, corps: null, equilibre: null, longueur: null, note: null, commentaire: '',
};
const EMPTY_PRED = { appellation: '', grapes: '', region: '', country: '', color: null, vintage: '' };

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj?.[k] ?? null]));

export default function SheetPage({ code, number: routeNumber }) {
  const router = useRouter();
  // Numéro du vin affiché. Sans réseau, on passe d'un vin à l'autre sans recharger la page
  // (le changement de page échouerait), en gardant l'adresse à jour.
  const [number, setNumber] = useState(routeNumber);
  useEffect(() => setNumber(routeNumber), [routeNumber]);
  const [listBlocked, setListBlocked] = useState(false);
  const [warnLeave, setWarnLeave] = useState(null); // destination après un 1er toucher avec pronostic incomplet
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
  const tries = useRef(0); // essais d'envoi ratés à la suite (pour espacer les nouveaux essais)
  const [retry, setRetry] = useState(0); // relance le chargement quand le réseau manquait
  const [noNetwork, setNoNetwork] = useState(false);
  const [lostDraft, setLostDraft] = useState(false);
  const latest = useRef({ rating, pred });
  latest.current = { rating, pred };
  const latestBottle = useRef(null);
  // Bouteille à laquelle appartiennent la saisie et les modifications en attente (dirty).
  // Évite d'envoyer la fiche d'un vin sur un autre quand on change de vin pendant une coupure.
  const dataFor = useRef(null);
  const flushRef = useRef(null);

  const stateRef = useRef(null);
  stateRef.current = state;

  // Prépare la saisie d'un vin : la copie gardée sur le téléphone (non envoyée, donc plus récente)
  // l'emporte sur la version du serveur.
  function initSheet(d, b) {
    clearTimeout(timer.current);
    setLostDraft(false);
    setWarnLeave(null);
    dirty.current = { rating: false, prediction: false };
    dataFor.current = null;
    const s = d.sheets?.[b.id] || {};
    let local = readDraft(code, b.id);
    const lockedNow = d.tasting.phase !== 'degustation' || (d.tasting.revealed_numbers || []).includes(b.number);
    if (local && lockedNow) {
      deleteDraft(code, b.id); // vin révélé avant le retour du réseau : la fiche ne peut plus partir
      if (local.dr || local.dp) setLostDraft(true);
      local = null;
    }
    const r = local?.dr && local.rating ? { ...EMPTY_RATING, ...local.rating } : s.rating ? { ...EMPTY_RATING, ...pick(s.rating, Object.keys(EMPTY_RATING)) } : EMPTY_RATING;
    const p = local?.dp && local.pred ? { ...EMPTY_PRED, ...local.pred } : s.prediction ? { ...EMPTY_PRED, ...pick(s.prediction, Object.keys(EMPTY_PRED)) } : EMPTY_PRED;
    const nr = { ...r, aromes: r.aromes || [], commentaire: r.commentaire || '' };
    const np = { ...p, grapes: p.grapes || '', region: p.region || '', country: p.country || '', appellation: p.appellation || '', vintage: p.vintage ?? '' };
    setRating(nr);
    setPred(np);
    latest.current = { rating: nr, pred: np };
    dataFor.current = b.id;
    if (local?.dr) dirty.current.rating = true;
    if (local?.dp) dirty.current.prediction = true;
    if (dirty.current.rating || dirty.current.prediction) schedule(0);
  }

  // Chargement (et rechargement automatique quand le réseau manquait)
  useEffect(() => {
    let alive = true;
    if (dataFor.current !== null && stateRef.current?.bottles?.find((x) => x.id === dataFor.current)?.number !== number) dataFor.current = null; // on change de vin
    api(`/api/t/${code}`)
      .then((d) => {
        if (!alive) return;
        setNoNetwork(false);
        if (!d.me) return router.replace(`/t/${code}`);
        setState(d);
        const b = d.bottles.find((x) => x.number === number);
        if (!b) return;
        initSheet(d, b);
        sendPendingDrafts(code, b.id); // fiches d'autres vins restées sur le téléphone
      })
      .catch((e) => {
        if (!alive) return;
        if (isNetworkError(e)) {
          // Pas de réseau : si la liste des vins est déjà connue, on ouvre quand même la fiche
          // (elle sera gardée sur le téléphone), et on réessaie de charger tout seul.
          const st = stateRef.current;
          const b = st?.bottles?.find((x) => x.number === number);
          if (b && dataFor.current !== b.id) initSheet(st, b);
          setNoNetwork(true);
          setTimeout(() => alive && setRetry((n) => n + 1), 3000);
        } else setLoadError(e);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, number, retry]);

  // Retour du réseau : on envoie tout de suite ce qui attendait.
  useEffect(() => {
    const h = () => {
      tries.current = 0;
      setListBlocked(false);
      if (dirty.current.rating || dirty.current.prediction) schedule(0);
      sendPendingDrafts(code, latestBottle.current);
    };
    window.addEventListener('online', h);
    return () => window.removeEventListener('online', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const bottles = state?.bottles || [];
  const idx = bottles.findIndex((b) => b.number === number);
  const bottle = bottles[idx];
  // Verrouillé : hors dégustation, ou vin déjà révélé (les vins sont révélés un par un).
  const thisRevealed = !!state && (state.tasting.revealed_numbers || []).includes(Number(number));
  const locked = state?.tasting.phase !== 'degustation' || thisRevealed;
  latestBottle.current = bottle?.id || null;

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
    const bid = dataFor.current;
    if (!bid) return;
    const { rating: r, pred: p } = latest.current;
    const payload = { bottleId: bid };
    if (dirty.current.rating) payload.rating = r;
    if (dirty.current.prediction) payload.prediction = { ...p, vintage: p.vintage === '' ? null : Number(p.vintage) };
    if (!payload.rating && !payload.prediction) return;
    dirty.current = { rating: false, prediction: false };
    const sentAt = Date.now();
    const current = () => dataFor.current === bid; // toujours sur ce vin ?
    setSave({ status: 'saving', msg: 'Enregistrement…' });
    try {
      await api(`/api/t/${code}/sheet`, { method: 'PUT', body: payload, keepalive: true });
      tries.current = 0;
      // Mémorise ce qui est enregistré (utile pour rouvrir ce vin plus tard sans réseau).
      setState((st) => (st ? { ...st, sheets: { ...st.sheets, [bid]: { ...(st.sheets?.[bid] || {}), ...(payload.rating ? { rating: payload.rating } : {}), ...(payload.prediction ? { prediction: payload.prediction } : {}) } } } : st));
      // La copie du téléphone n'est effacée que si rien n'a été modifié depuis l'envoi.
      if ((readDraft(code, bid)?.at || 0) <= sentAt) deleteDraft(code, bid);
      if (!current()) return;
      // Si une autre modification est arrivée pendant l'envoi, elle part juste après :
      // on n'affiche « Enregistré » que lorsque tout est vraiment enregistré.
      if (dirty.current.rating || dirty.current.prediction) setSave({ status: 'pending', msg: 'Modification en cours…' });
      else setSave({ status: 'saved', msg: 'Enregistré' });
    } catch (e) {
      if (e.status === 403) {
        deleteDraft(code, bid); // vin révélé ou soirée verrouillée : la fiche ne partira plus
        if (!current()) markRefused(code); // le participant a quitté ce vin : il sera prévenu sur la liste
        if (current()) {
          dirty.current = { rating: false, prediction: false };
          setSave({ status: 'error', msg: e.message });
        }
        return;
      }
      if (!current()) return; // on a changé de vin : la copie du téléphone repartira toute seule
      if (payload.rating) dirty.current.rating = true;
      if (payload.prediction) dirty.current.prediction = true;
      // Nouvel essai de plus en plus espacé (3 s, 6 s, 12 s, puis toutes les 15 s) ;
      // le retour du réseau déclenche aussi un envoi immédiat.
      const wait = Math.min(15000, 3000 * 2 ** tries.current++);
      if (isNetworkError(e)) setSave({ status: 'offline', msg: 'Hors ligne : gardé sur le téléphone' });
      else setSave({ status: 'error', msg: 'Non enregistré, nouvel essai…' });
      schedule(wait);
    }
  }

  flushRef.current = flush;

  function schedule(ms = 700) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current?.(), ms); // toujours la version à jour de flush
  }

  function change(kind, patch) {
    if (locked) return;
    if (kind === 'rating') setRating((x) => ({ ...x, ...patch }));
    else setPred((x) => ({ ...x, ...patch }));
    dirty.current[kind === 'rating' ? 'rating' : 'prediction'] = true;
    setSave((cur) => (cur.status === 'offline' ? cur : { status: 'pending', msg: 'Modification en cours…' }));
    // Copie gardée sur le téléphone tant que l'envoi n'est pas confirmé (coupure réseau).
    if (dataFor.current) {
      const next = { ...latest.current, [kind === 'rating' ? 'rating' : 'pred']: { ...(kind === 'rating' ? latest.current.rating : latest.current.pred), ...patch } };
      latest.current = next;
      writeDraft(code, dataFor.current, { rating: next.rating, pred: next.pred }, kind === 'rating' ? 'rating' : 'prediction');
    }
    schedule(save.status === 'offline' ? 1500 : 700);
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

  async function go(target, n = null) {
    // Pronostic incomplet : on le signale une fois ; un second toucher passe quand même.
    const mineNow = (stateRef.current?.myBottles || []).some((m) => m.id === dataFor.current);
    const manque = !locked && !mineNow ? missingFields(latest.current.pred) : [];
    if (manque.length && warnLeave !== target) {
      setWarnLeave(target);
      return;
    }
    setWarnLeave(null);
    clearTimeout(timer.current);
    await flush();
    const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || noNetwork || save.status === 'offline';
    if (offline) {
      if (n === null) return setListBlocked(true); // la liste ne peut pas s'ouvrir sans réseau
      setListBlocked(false);
      setNumber(n);
      try {
        window.history.replaceState(window.history.state, '', target);
      } catch {}
      window.scrollTo(0, 0);
      return;
    }
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
  if (noNetwork && (!state || !bottle)) {
    return (
      <main>
        <Band title={`Vin n°${number}`} back={`/t/${code}`} />
        <div className="page">
          <Notice kind="info">Pas de réseau pour l’instant. La fiche s’ouvrira toute seule dès que la connexion revient.</Notice>
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
  // Aide au pronostic : les cépages notés orientent les régions et appellations proposées,
  // l'appellation choisie oriente les cépages proposés (rouges et blancs).
  const regionHelp = regionOptions(predOpts.regions, pred.grapes, pred.country);
  const appOptions = appellationOptions(predOpts.appellations, pred.grapes);
  const grapeOpts = grapeOptions(predOpts.grapes, pred.appellation);
  const appGrapes = appellationGrapes(pred.appellation);
  const grapeList = String(pred.grapes || '').split(',').map((x) => x.trim()).filter(Boolean);
  // Champs du pronostic qui rapportent des points et qui sont encore vides
  const isMine = !!state && (state.myBottles || []).some((m) => m.id === bottle?.id);
  const manque = locked || isMine ? [] : missingFields(pred); // sa propre bouteille ne compte pas
  const isMissing = (key) => manque.some((c) => c.key === key);
  const foldG = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hasGrape = (g) => grapeList.some((x) => foldG(x) === foldG(g));
  const toggleGrape = (g) => change('pred', { grapes: (hasGrape(g) ? grapeList.filter((x) => foldG(x) !== foldG(g)) : [...grapeList, g]).join(', ') });
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
      <ServeAlert code={code} tasting={state.tasting} currentPage={number} />
      <div className="page">
        <div className="sticky-tabs">
          <nav className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'prono'} onClick={() => setTab('prono')}>
              Pronostics
              {manque.length > 0 && (
                <span className="tab-badge" aria-label={`${manque.length} à compléter`}>
                  {manque.length}
                </span>
              )}
            </button>
            <button role="tab" aria-selected={tab === 'fiche'} onClick={() => setTab('fiche')}>
              Fiche de dégustation
              <span className="tab-sub">facultative</span>
            </button>
          </nav>
        </div>

        {listBlocked && <Notice kind="info">Pas de réseau : la liste des vins s’ouvrira quand la connexion reviendra. Vous pouvez continuer à remplir les fiches avec les flèches ‹ et ›.</Notice>}
        {(save.status === 'offline' || noNetwork) && (
          <div className="offline-note" role="status">
            <strong>Pas de réseau.</strong> Continuez normalement : tout ce que vous notez est gardé sur ce téléphone et partira tout seul dès que la connexion revient.
          </div>
        )}
        {lostDraft && (
          <Notice kind="error">Une partie de cette fiche n’a pas pu être envoyée avant la révélation du vin (pas de réseau). Elle ne compte donc pas : après la révélation, aucune réponse ne peut plus être ajoutée, pour que personne ne puisse tricher.</Notice>
        )}
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
          <Notice kind="info">C’est votre bouteille : vous pouvez la noter et pronostiquer pour le plaisir, mais votre note et vos pronostics ne comptent pas.</Notice>
        )}
        {locked && state.tasting.phase === 'preparation' && <Notice kind="info">La dégustation est en pause : vos saisies reprendront dès sa relance.</Notice>}

        {tab === 'fiche' && (
          <div className="panel" style={{ marginTop: 12 }}>
            <p className="small muted" style={{ marginTop: 0 }}>
              <strong>Fiche facultative</strong> : remplissez ce que vous voulez, ou rien du tout. Elle ne rapporte aucun point ; votre note sur 20 sert seulement à élire le meilleur vin de la soirée.
            </p>
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
            <Crit n={4} title="Arômes" hint="Ouvrez une famille et touchez les arômes que vous sentez (plusieurs choix possibles). Primaires : ceux du raisin ; secondaires : ceux de la fermentation ; tertiaires : ceux de l’élevage et du vieillissement.">
              <AromaPicker value={r.aromes} onChange={(v) => change('rating', { aromes: v })} disabled={locked} />
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
            {!locked && !isMine && (
              <div className={`prono-check ${manque.length ? 'todo' : 'done'}`} role="status">
                {manque.length === 0 ? (
                  <>
                    <strong>Pronostic complet.</strong> Les cinq réponses qui rapportent des points sont remplies.
                  </>
                ) : manque.length === PRONO_CHAMPS.length ? (
                  <>
                    <strong>Pronostic à faire.</strong> Cinq réponses rapportent des points : pays, région, appellation, cépages et millésime. Une réponse vide rapporte 0 point : en cas de doute, tentez votre chance.
                  </>
                ) : (
                  <>
                    <strong>
                      Il manque {manque.length > 1 ? `${manque.length} réponses` : 'une réponse'} : {listeChamps(manque)}.
                    </strong>{' '}
                    {manque.length > 1 ? 'Elles rapportent' : 'Elle rapporte'} des points ({manque.map((c) => `${c.label} ${c.pts}`).join(', ')}) ; vide, {manque.length > 1 ? 'elles ne rapportent' : 'elle ne rapporte'} rien. En cas de doute, tentez votre chance.
                  </>
                )}
              </div>
            )}
            <Crit missing={isMissing('country')} title="Pays" n={1} pts={`${BAREME.france.country} ou ${BAREME.foreign.country} pts`} hint={`${BAREME.france.country} points si le vin est français, ${BAREME.foreign.country} points s’il est étranger.`}>
              <select className="input" aria-label="Pays" value={pred.country} onChange={(e) => change('pred', { country: e.target.value })} disabled={locked}>
                <option value="">Choisir un pays</option>
                {COUNTRIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Crit>
            <Crit
              missing={isMissing('region')}
              title="Région"
              n={2}
              pts="3 pts"
              hint={`Touchez la région sur la carte ou tapez son nom : les appellations et les cépages proposés se limitent ensuite à cette région. La bonne région rapporte 3 points. Elle est jugée séparément de l’appellation : pensez à la remplir, même pour un Vin de France.${pred.country ? '' : ' Choisissez d’abord le pays.'}`}
            >
              <RegionMap
                country={pred.country}
                value={pred.region}
                suggested={regionHelp.suggested}
                disabled={locked}
                onPick={(name) => {
                  const patch = fillFromRegion({ ...pred, region: name }, name, filled.current);
                  change('pred', { region: name, ...(patch || {}) });
                }}
              />
              <Autocomplete
                value={pred.region}
                onChange={(v) => change('pred', { region: v })}
                options={regionHelp.options}
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
              {regionHelp.suggested.length > 0 && !locked && (
                <div className="autofill-note">
                  En tête de liste{pred.country ? ' et en doré sur la carte' : ''} : les régions où l’on trouve {grapeList.join(', ')}.
                </div>
              )}
            </Crit>
            <Crit
              missing={isMissing('appellation')}
              title="Appellation"
              n={3}
              pts="+2 pts"
              hint={`${predOpts.inRegion ? `Appellations de la région ${pred.region}${predOpts.generic ? `, plus ${predOpts.generic} pour les vins sans appellation` : ''}. Une autre appellation du pays ? Tapez son nom, elle sera proposée. ` : 'Choisissez d’abord la région pour réduire la liste. '}L’appellation exacte rapporte 2 points, qui s’ajoutent aux 3 points de la région si celle-ci est juste. L’appellation exacte sans la bonne région ne rapporte que 2 points.`}
            >
              <Autocomplete
                value={pred.appellation}
                onChange={(v) => change('pred', { appellation: v })}
                options={appOptions}
                fallback={predOpts.inRegion ? predOpts.countryAppellations : undefined}
                browse
                onPick={(o) => {
                  const autoGrapes = filled.current.grapes && pred.grapes === filled.current.grapes; // cépages remplis automatiquement avant
                  const patch = fillFromAppellation({ ...pred, appellation: o.label }, o.label, filled.current) || {};
                  delete patch.color; // la couleur ne fait pas partie du barème
                  // Cépages : remplis seulement si l'appellation n'en a qu'un (Barolo = Nebbiolo).
                  // Sinon on les propose (un cépage faux coûte un point) : voir sous « Cépage(s) ».
                  const ag = appellationGrapes(o.label);
                  if (!ag || ag.all.length !== 1) {
                    delete patch.grapes;
                    delete filled.current.grapes;
                    if (autoGrapes) patch.grapes = ''; // on retire le cépage de l'appellation précédente
                  }
                  if (Object.keys(patch).length) change('pred', patch);
                  setAutoNote(describePatch(Object.fromEntries(Object.entries(patch).filter(([, v]) => v))));
                }}
                placeholder="Tapez les premières lettres, ex : gev"
                aria-label="Appellation"
                maxLength={120}
                disabled={locked}
              />
              {autoNote && <div className="autofill-note">{autoNote}</div>}
            </Crit>
            <Crit
              missing={isMissing('grapes')}
              title="Cépage(s)"
              n={4}
              pts={`${BAREME.france.grapes} pts`}
              hint={`Assemblage : chaque cépage trouvé rapporte sa part (70 % de Merlot = 7 points). Moins ${BAREME.grapeWrongPenalty} point par cépage faux. Séparez les cépages par des virgules.${predOpts.inRegion ? ` Liste : cépages de la région ${pred.region} ; tapez un autre nom pour chercher dans tout le pays.` : ''}`}
            >
              <Autocomplete
                multi
                value={pred.grapes}
                onChange={(v) => change('pred', { grapes: v })}
                options={grapeOpts}
                fallback={predOpts.inRegion ? predOpts.countryGrapes : undefined}
                browse
                placeholder="Ex : Pinot Noir"
                aria-label="Cépage"
                maxLength={120}
                disabled={locked}
              />
              {appGrapes && !locked && (
                <div className="grape-help">
                  <div className="small muted">Cépages principaux du {appGrapes.name} : touchez pour ajouter ou retirer.</div>
                  {[['Rouges', appGrapes.rouges], ['Blancs', appGrapes.blancs]].map(([label, list]) =>
                    list.length ? (
                      <div key={label} className="grape-help-row">
                        <span className="tiny muted">{label}</span>
                        {list.map((g) => (
                          <button key={g} type="button" className="chip" aria-pressed={hasGrape(g)} onClick={() => toggleGrape(g)}>
                            {g}
                          </button>
                        ))}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </Crit>
            <Crit missing={isMissing('vintage')} title="Millésime" n={5} pts={`${BAREME.france.vintage} pts`} hint="Année exacte : 3 points. Ensuite on perd des points à chaque année d’écart, moins vite pour les vins anciens (tableau ci-dessous).">
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
                Passer à la fiche de dégustation (facultative)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bottom-bar">
        {warnLeave && (
          <div className="leave-warn" role="alert">
            {(() => {
              const m = missingFields(pred);
              return m.length === PRONO_CHAMPS.length ? 'Pronostic pas encore fait sur ce vin (0 point).' : `Pronostic incomplet : il manque ${listeChamps(m)}.`;
            })()}{' '}
            <button type="button" className="linklike" onClick={() => { setWarnLeave(null); setTab('prono'); window.scrollTo({ top: 0 }); }}>
              Compléter
            </button>{' '}
            ou touchez à nouveau pour passer.
          </div>
        )}
        <div className="inner">
          <button className="btn ghost sm" disabled={!prev} onClick={() => prev && go(`/t/${code}/vin/${prev.number}`, prev.number)} aria-label="Vin précédent">
            ‹ {prev ? `n°${prev.number}` : ''}
          </button>
          <div className={`save-state ${save.status}`} aria-live="polite">
            {save.msg || (locked ? 'Lecture seule' : 'Enregistrement automatique')}
          </div>
          {next ? (
            <button className="btn sm" onClick={() => go(`/t/${code}/vin/${next.number}`, next.number)} aria-label="Vin suivant">
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

function Crit({ n, title, hint, pts, missing, children }) {
  return (
    <section className={`crit${missing ? ' missing' : ''}`}>
      <div className="crit-head">
        {n && <span className="crit-num">{n}</span>}
        <span className="crit-title">{title}</span>
        {missing && <span className="pill red">À compléter</span>}
        {pts && <span className="pill" style={{ marginLeft: missing ? 0 : 'auto' }}>{pts}</span>}
      </div>
      {hint && <div className="crit-hint">{hint}</div>}
      {children}
    </section>
  );
}

export function VintageTable() {
  const f = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
  return (
    <table className="grid fit tiny" style={{ marginTop: 10 }}>
      <thead>
        <tr>
          <th>Millésime réel</th>
          <th>Par année d’écart</th>
          <th>0 point dès</th>
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
