'use client';

import { useId, useMemo, useRef, useState } from 'react';

// Recherche sans accents ni majuscules : « gev » trouve « Gevrey-Chambertin »,
// « cote rotie » trouve « Côte-Rôtie ».
export function fold(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function rank(label, q) {
  const f = fold(label);
  if (!q) return -1;
  if (f.startsWith(q)) return 0;
  if (f.split(' ').some((w) => w.startsWith(q))) return 1;
  if (f.includes(q)) return 2;
  // Plusieurs mots tapés : chacun doit commencer un mot de l'appellation.
  const parts = q.split(' ');
  if (parts.length > 1 && parts.every((p) => f.split(' ').some((w) => w.startsWith(p)))) return 3;
  return -1;
}

/**
 * Champ texte avec suggestions instantanées.
 * options : [{ label, hint? }] ou [string]
 * multi : suggestions pour le dernier élément d'une liste séparée par des virgules (cépages).
 */
export default function Autocomplete({ value, onChange, onPick, options, multi = false, max = 7, browse = false, ...inputProps }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [showAll, setShowAll] = useState(false); // liste complète : seulement juste après avoir touché le champ
  const listId = useId();
  const inputRef = useRef(null);
  const opts = useMemo(() => options.map((o) => (typeof o === 'string' ? { label: o } : o)), [options]);

  const text = String(value ?? '');
  const head = multi ? text.slice(0, text.lastIndexOf(',') + 1) : '';
  const query = fold(multi ? text.slice(text.lastIndexOf(',') + 1) : text);

  const matches = useMemo(() => {
    // Champ vide, ou champ qu'on vient de toucher : on montre toute la liste du pays.
    if (browse && (!query || showAll)) return opts.slice(0, 500);
    if (!query) return [];
    return opts
      .map((o) => ({ o, r: rank(o.label, query) }))
      .filter((x) => x.r >= 0 && fold(x.o.label) !== query)
      .sort((a, b) => a.r - b.r || a.o.label.length - b.o.label.length || a.o.label.localeCompare(b.o.label, 'fr'))
      .slice(0, max)
      .map((x) => x.o);
  }, [opts, query, max, browse, showAll]);

  function pick(o) {
    const next = multi ? `${head}${head ? ' ' : ''}${o.label}` : o.label;
    onChange(next);
    onPick?.(o);
    setOpen(false);
  }

  const show = open && matches.length > 0;

  return (
    <div className="ac">
      <input
        {...inputProps}
        ref={inputRef}
        className="input"
        value={text}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setShowAll(false);
          setActive(0);
        }}
        onFocus={() => {
          setOpen(true);
          setShowAll(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {show && (
        <ul className="ac-list" id={listId} role="listbox">
          {matches.map((o, i) => (
            <li key={o.label} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? 'on' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
              >
                <span className="ac-label">{o.label}</span>
                {o.hint && <span className="ac-hint">{o.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
