'use client';

import { useRef, useState } from 'react';
import { api, Chips, Notice, Spinner } from './ui';
import { COLORS, REGIONS, PRICE_RANGES, GRAPES } from '@/lib/constants';

const EMPTY = { wine_name: '', producer: '', color: null, grapes: '', region: '', appellation: '', vintage: '', price_range: null, notes: '' };

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
  const [scan, setScan] = useState({ state: 'idle', msg: null });
  const fileRef = useRef(null);
  const set = (k) => (v) => setB((x) => ({ ...x, [k]: v?.target ? v.target.value : v }));

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScan({ state: 'reading', msg: null });
    try {
      const image = await shrink(file);
      const r = await api(scanUrl, { method: 'POST', body: { image } });
      setB((x) => ({ ...x, ...Object.fromEntries(Object.entries(r.bottle).filter(([, v]) => v !== null && v !== '')) }));
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
        <span>Nom du vin ou de la cuvée *</span>
        <input className="input" value={b.wine_name} onChange={set('wine_name')} required maxLength={120} />
      </label>
      <label className="field">
        <span>Domaine, château ou maison</span>
        <input className="input" value={b.producer} onChange={set('producer')} maxLength={120} />
      </label>
      <div className="field">
        <span className="chip-group-label" style={{ fontWeight: 600, color: 'var(--encre)', fontSize: '0.9rem' }}>
          Couleur
        </span>
        <Chips options={COLORS} value={b.color} onChange={set('color')} />
      </div>
      <label className="field">
        <span>Cépage(s)</span>
        <input className="input" list="grapes-list" value={b.grapes} onChange={set('grapes')} placeholder="Ex : Syrah, Grenache" maxLength={160} />
      </label>
      <div className="grid2 collapse">
        <label className="field">
          <span>Région</span>
          <select className="input" value={b.region} onChange={set('region')}>
            <option value="">Choisir</option>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Millésime</span>
          <input className="input" type="number" inputMode="numeric" min="1900" max="2100" value={b.vintage} onChange={set('vintage')} placeholder="Vide si non millésimé" />
        </label>
      </div>
      <label className="field">
        <span>Appellation</span>
        <input className="input" value={b.appellation} onChange={set('appellation')} placeholder="Ex : Crozes-Hermitage" maxLength={120} />
      </label>
      <div className="field">
        <span className="chip-group-label" style={{ fontWeight: 600, color: 'var(--encre)', fontSize: '0.9rem' }}>
          Gamme de prix
        </span>
        <Chips options={PRICE_RANGES} value={b.price_range} onChange={set('price_range')} />
      </div>
      <label className="field">
        <span>Petit mot pour la révélation (facultatif)</span>
        <input className="input" value={b.notes} onChange={set('notes')} placeholder="Ex : rapporté de mes vacances" maxLength={400} />
      </label>
      <datalist id="grapes-list">
        {GRAPES.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <div className="row">
        <button className="btn" disabled={busy || !b.wine_name.trim()}>
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

function clean(x) {
  if (!x) return {};
  const o = {};
  for (const k of Object.keys(EMPTY)) o[k] = x[k] ?? EMPTY[k];
  o.vintage = x.vintage ?? '';
  return o;
}
