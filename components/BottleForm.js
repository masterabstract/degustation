'use client';

import { useRef, useState } from 'react';
import Autocomplete from './Autocomplete';
import { optionsFor, fillFromAppellation, fillFromRegion, describePatch } from '@/lib/autofill';
import { api, Chips, Notice, Spinner } from './ui';
import { COLORS, COUNTRIES } from '@/lib/constants';

const EMPTY = { producer: '', appellation: '', grape_mix: [{ name: '', pct: '' }], region: '', subregion: '', zone: '', country: 'France', color: null, wine_name: '', vintage: '', non_vintage: false, notes: '' };

const rowsFromText = (t) => {
  const names = String(t || '').split(',').map((x) => x.trim()).filter(Boolean);
  return names.length ? names.map((name) => ({ name, pct: names.length === 1 ? 100 : '' })) : [{ name: '', pct: '' }];
};
const rowsText = (rows) => rows.map((r) => r.name.trim()).filter(Boolean).join(', ');

// Réduit la photo sur le téléphone avant l'envoi (plus rapide, moins de données).
async function shrink(file, max = 1568) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function BottleForm({ initial, onSave, onCancel, busy, scanUrl }) {
  const [b, setB] = useState({ ...EMPTY, ...clean(initial) });
  const filled = useRef(initial?.id ? {} : { country: 'France' }); // ce qui a été rempli automatiquement
  const [autoNote, setAutoNote] = useState(null);
  const [scan, setScan] = useState({ state: 'idle', msg: null });
  const fileRef = useRef(null);
  const set = (k) => (v) => setB((x) => ({ ...x, [k]: v?.target ? v.target.value : v }));
  const opts = optionsFor(b.country); // listes du pays choisi

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScan({ state: 'reading', msg: null });
    try {
      const image = await shrink(file);
      const r = await api(scanUrl, { method: 'POST', body: { image } });
      const { grapes, ...found } = r.bottle;
      setB((x) => ({ ...x, ...Object.fromEntries(Object.entries(found).filter(([, v]) => v !== null && v !== '')), ...(grapes ? { grape_mix: rowsFromText(grapes) } : {}) }));
      setScan({ state: 'done', msg: r.remarque });
    } catch (err) {
      setScan({ state: 'error', msg: err.message });
    }
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(b);
      }}
    >
      {scanUrl && (
        <div className="stack">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} hidden />
          <button type="button" className="btn gold block" disabled={scan.state === 'reading'} onClick={() => fileRef.current?.click()}>
            {scan.state === 'reading' ? (
              <>
                <Spinner /> Lecture de l’étiquette…
              </>
            ) : (
              'Photographier l’étiquette'
            )}
          </button>
          {scan.state === 'done' && (
            <Notice kind="ok">
              Étiquette lue. Vérifiez et corrigez chaque champ avant d’enregistrer.
              {scan.msg ? ` ${scan.msg}` : ''}
            </Notice>
          )}
          {scan.state === 'error' && <Notice kind="error">{scan.msg}</Notice>}
          {scan.state === 'idle' && <p className="tiny muted center">L’IA lit la photo et remplit le formulaire. La photo n’est pas conservée.</p>}
        </div>
      )}
      <label className="field">
        <span>Pays *</span>
        <select className="input" value={b.country || ''} onChange={set('country')} required aria-label="Pays">
          <option value="">Choisir le pays du vin</option>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="tiny muted" style={{ fontWeight: 400, marginTop: 4 }}>
          {b.country === 'France' ? 'Vin français : noté sur 20 points.' : b.country ? 'Vin étranger : noté sur 23 points.' : 'Le pays décide du barème et des listes proposées ci-dessous.'}{b.country ? ` Géographie : la région rapporte 3 points et l’appellation 2 points, jugées séparément ; la région est donc obligatoire${b.country === 'France' ? ', même pour un Vin de France' : ''}.` : ''}
        </span>
      </label>
      <label className="field">
        <span>Domaine, château ou maison *</span>
        <input className="input" value={b.producer} onChange={set('producer')} required maxLength={120} placeholder="Ex : Domaine Ogier" />
      </label>
      <div className="field">
        <span>Appellation *</span>
        <Autocomplete
          value={b.appellation}
          onChange={set('appellation')}
          options={opts.appellations}
          browse
          onPick={(o) => {
            const patch = fillFromAppellation({ ...b, grapes: rowsText(b.grape_mix) }, o.label, filled.current);
            if (patch) {
              const { grapes, ...rest } = patch;
              setB((x) => ({ ...x, ...rest, ...(grapes ? { grape_mix: rowsFromText(grapes) } : {}) }));
            }
            setAutoNote(describePatch(patch));
          }}
          placeholder="Tapez les premières lettres, ex : gev"
          maxLength={120}
          aria-label="Appellation"
        />
        {autoNote && <div className="autofill-note">{autoNote}</div>}
        <span className="tiny muted" style={{ fontWeight: 400 }}>
          Vin sans appellation (vin nature, vin de table) : choisissez {opts.generic ? `« ${opts.generic} »` : '« Vin de France » ou son équivalent'}, ou son IGP.
        </span>
      </div>
      <GrapeRows rows={b.grape_mix} options={opts.grapes} onChange={(grape_mix) => setB((x) => ({ ...x, grape_mix }))} />
      <div className="field">
        <span>Région viticole *</span>
        <Autocomplete
          value={b.region}
          onChange={set('region')}
          options={opts.regions}
          browse
          onPick={(o) => {
            const patch = fillFromRegion(b, o.label, filled.current);
            if (patch) setB((x) => ({ ...x, ...patch }));
          }}
          placeholder={b.country && b.country !== 'France' ? 'Ex : Toscane' : 'Ex : Vallée du Rhône'}
          maxLength={80}
          aria-label="Région"
        />
      </div>
      <div className="field">
        <span className="chip-group-label" style={{ fontWeight: 600, color: 'var(--encre)', fontSize: '0.9rem' }}>
          Couleur
        </span>
        <Chips options={COLORS} value={b.color} onChange={set('color')} />
      </div>
      <label className="field">
        <span>Nom de la cuvée</span>
        <input className="input" value={b.wine_name} onChange={set('wine_name')} placeholder="Ex : Les Gamins (si la bouteille en a un)" maxLength={120} aria-label="Nom de la cuvée" />
      </label>
      <div className="field">
        <span>Millésime *</span>
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            type="number"
            inputMode="numeric"
            min="1900"
            max="2100"
            value={b.non_vintage ? '' : b.vintage}
            onChange={set('vintage')}
            placeholder={b.non_vintage ? 'Non millésimé' : 'Ex : 2019'}
            disabled={b.non_vintage}
            aria-label="Millésime"
          />
          <button type="button" className="chip" aria-pressed={b.non_vintage} onClick={() => setB((x) => ({ ...x, non_vintage: !x.non_vintage }))}>
            Non millésimé
          </button>
        </div>
      </div>
      <label className="field">
        <span>Petit mot pour la révélation</span>
        <input className="input" value={b.notes} onChange={set('notes')} placeholder="Ex : rapporté de mes vacances en Bourgogne" maxLength={400} aria-label="Petit mot pour la révélation" />
      </label>
      <p className="tiny muted" style={{ margin: 0 }}>* champ obligatoire</p>
      {(() => {
        const manque = [
          !b.country && 'pays',
          !b.producer.trim() && 'domaine',
          !b.appellation.trim() && 'appellation',
          !rowsText(b.grape_mix) && 'cépage',
          !b.region.trim() && 'région',
          !b.non_vintage && !String(b.vintage).trim() && 'millésime (ou « Non millésimé »)',
        ].filter(Boolean);
        return manque.length ? <p className="tiny" style={{ margin: 0, color: 'var(--erreur)' }}>Pour enregistrer, il manque : {manque.join(', ')}.</p> : null;
      })()}
      <div className="row">
        <button className="btn" disabled={busy || !b.producer.trim() || !b.country || !b.appellation.trim() || !b.region.trim() || !rowsText(b.grape_mix) || (!b.non_vintage && !String(b.vintage).trim())}>
          {initial?.id ? 'Enregistrer les modifications' : 'Enregistrer la bouteille'}
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

function GrapeRows({ rows, options, onChange }) {
  const named = rows.filter((r) => r.name.trim());
  const filledPct = named.filter((r) => String(r.pct).trim() !== '');
  const sum = Math.round(filledPct.reduce((a, r) => a + Number(String(r.pct).replace(',', '.') || 0), 0) * 10) / 10;
  const blend = named.length > 1;
  const status = !blend ? null : filledPct.length === 0 ? 'equal' : filledPct.length < named.length ? 'partial' : sum === 100 ? 'ok' : 'bad';
  const update = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="field">
      <span>Cépage(s) et pourcentages *</span>
      <div className="stack" style={{ gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Autocomplete value={r.name} onChange={(v) => update(i, { name: v })} options={options} browse placeholder={i === 0 ? 'Ex : Merlot' : 'Autre cépage'} maxLength={60} aria-label={`Cépage ${i + 1}`} />
            </div>
            {rows.length > 1 && (
              <>
                <input
                  className="input"
                  style={{ width: 74, flex: 'none', textAlign: 'right' }}
                  inputMode="decimal"
                  value={r.pct}
                  onChange={(e) => update(i, { pct: e.target.value.replace(/[^0-9.,]/g, '') })}
                  placeholder="%"
                  aria-label={`Pourcentage du cépage ${i + 1}`}
                />
                <button type="button" className="btn ghost sm" aria-label={`Retirer le cépage ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                  ×
                </button>
              </>
            )}
          </div>
        ))}
        <button type="button" className="linklike small" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...rows.map((r) => (rows.length === 1 && String(r.pct) === '100' ? { ...r, pct: '' } : r)), { name: '', pct: '' }])}>
          + Ajouter un cépage (assemblage)
        </button>
        {status === 'ok' && <div className="autofill-note">Total : 100 %</div>}
        {status === 'bad' && <div className="tiny" style={{ color: 'var(--erreur)' }}>Total : {String(sum).replace('.', ',')} % (il faut 100 %)</div>}
        {status === 'partial' && <div className="tiny" style={{ color: 'var(--erreur)' }}>Indiquez le % de chaque cépage, ou laissez-les tous vides.</div>}
        {status === 'equal' && <div className="tiny muted">Sans pourcentages, les cépages comptent à parts égales dans le barème.</div>}
      </div>
    </div>
  );
}

function clean(x) {
  if (!x) return {};
  const o = {};
  for (const k of Object.keys(EMPTY)) o[k] = x[k] ?? EMPTY[k];
  o.grape_mix = Array.isArray(x.grape_mix) && x.grape_mix.length
    ? x.grape_mix.map((g) => ({ name: g.name, pct: g.pct === null || g.pct === undefined || x.grape_mix.length === 1 ? (x.grape_mix.length === 1 ? 100 : '') : String(g.pct) }))
    : rowsFromText(String(x.grapes || '').replace(/\s*\d+([.,]\d+)?\s*%/g, ''));
  o.vintage = x.vintage ?? '';
  if (o.wine_name === o.producer) o.wine_name = ''; // pas de cuvée distincte
  if (x.id && (x.vintage === null || x.vintage === undefined)) o.non_vintage = true;
  if (x.id && !x.country) o.country = '';
  return o;
}
