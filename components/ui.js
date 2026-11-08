'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

// ---------- Appels au serveur ----------
export async function api(path, { method = 'GET', body, keepalive = false } = {}) {
  const res = await fetch(path, {
    method,
    keepalive, // la requête part même si la page se ferme juste après
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    credentials: 'same-origin',
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------- Rafraîchissement automatique (synchronisation) ----------
export function usePolling(load, intervalMs = 4000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    try {
      const d = await loadRef.current();
      setData(d);
      setError(null);
      return d;
    } catch (e) {
      setError(e);
      return null;
    }
  }, []);

  useEffect(() => {
    let stop = false;
    refresh();
    const id = setInterval(() => {
      if (!stop && document.visibilityState === 'visible') refresh();
    }, intervalMs);
    const onVis = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, error, refresh };
}

// ---------- Éléments visuels ----------
export function Capsule({ n, size = '' }) {
  return (
    <div className={`capsule ${size}`} aria-label={`Vin numéro ${n ?? '?'}`}>
      {n ?? '?'}
    </div>
  );
}

export function Band({ title, sub, back, right, wide }) {
  return (
    <header className={`band ${wide ? 'wide' : ''}`}>
      <div className="band-inner">
        {back && (
          <Link href={back} className="back" aria-label="Retour">
            ‹
          </Link>
        )}
        <div className="grow">
          <h1>{title}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function Notice({ kind = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Chips({ options, value, onChange, multi = false, disabled }) {
  const isOn = (o) => (multi ? (value || []).includes(o) : value === o);
  const toggle = (o) => {
    if (disabled) return;
    if (multi) {
      const cur = value || [];
      onChange(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
    } else onChange(value === o ? null : o);
  };
  return (
    <div className="chips">
      {options.map((o) => (
        <button type="button" key={o} className="chip" aria-pressed={isOn(o)} onClick={() => toggle(o)} disabled={disabled}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function Scale({ steps, value, onChange, none, disabled }) {
  const label = value === 0 ? none : value ? steps[value - 1] : 'Non renseigné';
  return (
    <div>
      <div className={`scale ${none ? 'with-none' : ''}`} role="radiogroup">
        {none && (
          <button
            type="button"
            className={`none ${value === 0 ? 'on' : ''}`}
            role="radio"
            aria-checked={value === 0}
            onClick={() => !disabled && onChange(value === 0 ? null : 0)}
            disabled={disabled}
          >
            {none}
          </button>
        )}
        {steps.map((s, i) => {
          const v = i + 1;
          const cls = value === v ? 'on' : value && value > 0 && v < value ? 'fill' : '';
          return (
            <button
              type="button"
              key={s}
              className={cls}
              role="radio"
              aria-checked={value === v}
              aria-label={s}
              onClick={() => !disabled && onChange(value === v ? null : v)}
              disabled={disabled}
            >
              {v}
            </button>
          );
        })}
      </div>
      <div className="scale-caption">
        <span>{steps[0]}</span>
        <strong>{label}</strong>
        <span>{steps[steps.length - 1]}</span>
      </div>
    </div>
  );
}

export function NoteInput({ value, onChange, disabled }) {
  const v = value === null || value === undefined ? null : Number(value);
  const set = (n) => !disabled && onChange(Math.max(0, Math.min(20, Math.round(n * 2) / 2)));
  return (
    <div>
      <div className="note-box">
        <button type="button" className="note-step" onClick={() => set((v ?? 12) - 0.5)} aria-label="Moins un demi-point" disabled={disabled}>
          −
        </button>
        <div className="note-value" aria-live="polite">
          <span className="big">{v === null ? '–' : String(v).replace('.', ',')}</span>
          <span className="of"> / 20</span>
        </div>
        <button type="button" className="note-step" onClick={() => set((v ?? 12) + 0.5)} aria-label="Plus un demi-point" disabled={disabled}>
          +
        </button>
      </div>
      <input
        type="range"
        className="note-range"
        min="0"
        max="20"
        step="0.5"
        value={v ?? 12}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Note sur 20"
        disabled={disabled}
      />
      {v === null && <div className="tiny muted center">Touchez + ou − ou faites glisser pour noter.</div>}
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-label="Chargement" />;
}

export function Loading({ label = 'Chargement…' }) {
  return (
    <div className="page center muted" style={{ paddingTop: 60 }}>
      <Spinner /> <div style={{ marginTop: 10 }}>{label}</div>
    </div>
  );
}

export function fmtDate(d) {
  if (!d) return null;
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// « 1 vin », « 2 vins »
export function plural(n, one, many = `${one}s`) {
  return `${n} ${Math.abs(n) >= 2 ? many : one}`;
}

export function fmtNote(n) {
  return n === null || n === undefined ? '–' : String(n).replace('.', ',');
}
