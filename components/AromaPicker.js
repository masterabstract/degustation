'use client';

import { useMemo, useState } from 'react';
import { AROME_FAMILLES, AROMES_ANCIENS } from '@/lib/constants';
import { fold } from './Autocomplete';

// Choix des arômes : les familles (fruits rouges, floral, boisé…) regroupées par origine
// (raisin, fermentation, élevage), chacune s'ouvre sur ses arômes précis.
// Une recherche permet d'aller droit au but (« cass » trouve Cassis et Bourgeon de cassis).
export default function AromaPicker({ value = [], onChange, disabled }) {
  const [open, setOpen] = useState(() => new Set());
  const [q, setQ] = useState('');
  const selected = new Set(value);
  const query = fold(q);

  const toggle = (a) => {
    if (disabled) return;
    onChange(selected.has(a) ? value.filter((x) => x !== a) : [...value, a]);
  };
  const toggleFamily = (f) =>
    setOpen((cur) => {
      const next = new Set(cur);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });

  const found = useMemo(() => {
    if (!query) return [];
    return AROME_FAMILLES.flatMap((f) => f.aromes.filter((a) => fold(a).includes(query) || fold(f.famille).includes(query)).map((a) => ({ a, f: f.famille })));
  }, [query]);

  const origins = [...new Set(AROME_FAMILLES.map((f) => f.origine))];
  const chip = (a, hint) => (
    <button type="button" key={a} className="chip" aria-pressed={selected.has(a)} onClick={() => toggle(a)} disabled={disabled}>
      {a}
      {hint && <span className="chip-hint"> · {hint}</span>}
    </button>
  );

  return (
    <div className="aroma-picker">
      <div className="aroma-selected">
        {value.length ? (
          <>
            <span className="tiny muted">Vos arômes ({value.length}) :</span>
            <div className="chips">{value.map((a) => chip(a))}</div>
          </>
        ) : (
          <span className="tiny muted">Aucun arôme choisi : ouvrez une famille ou cherchez un arôme.</span>
        )}
      </div>

      <input
        className="input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chercher un arôme, ex : cassis, violette, brioche"
        aria-label="Chercher un arôme"
        disabled={disabled}
      />
      {query && (
        <div className="chips" style={{ marginTop: 8 }}>
          {found.length ? found.map(({ a, f }) => chip(a, f)) : <span className="tiny muted">Aucun arôme trouvé.</span>}
        </div>
      )}

      {!query &&
        origins.map((o) => (
          <div key={o} className="aroma-origin">
            <div className="chip-group-label">{o}</div>
            {AROME_FAMILLES.filter((f) => f.origine === o).map((f) => {
              const n = f.aromes.filter((a) => selected.has(a)).length;
              const isOpen = open.has(f.famille);
              return (
                <div key={f.famille} className={`aroma-family${isOpen ? ' open' : ''}`}>
                  <button type="button" className="aroma-family-head" aria-expanded={isOpen} onClick={() => toggleFamily(f.famille)}>
                    <span>{f.famille}</span>
                    <span className="aroma-count">
                      {n > 0 && <span className="tag">{n}</span>}
                      <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                    </span>
                  </button>
                  {isOpen && <div className="chips aroma-chips">{f.aromes.map((a) => chip(a))}</div>}
                </div>
              );
            })}
          </div>
        ))}

      {value.some((a) => AROMES_ANCIENS.includes(a)) && (
        <p className="tiny muted">Les familles générales de l’ancienne fiche restent enregistrées ; touchez-les pour les retirer.</p>
      )}
    </div>
  );
}
