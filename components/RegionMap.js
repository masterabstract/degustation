'use client';

import { useEffect, useState } from 'react';
import { fold } from './Autocomplete';

// Carte des régions viticoles du pays choisi. Toucher une région la choisit.
// Les cartes sont des fichiers statiques (public/cartes), chargées seulement quand on en a besoin.
const slug = (s) => fold(s).replace(/ /g, '-');
const cache = {};

export default function RegionMap({ country, value, onPick, disabled }) {
  const [state, setState] = useState({ country: null, data: null });

  useEffect(() => {
    if (!country || country === 'Autre pays') return;
    if (cache[country]) return setState({ country, data: cache[country] });
    let alive = true;
    fetch(`/cartes/${slug(country)}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) cache[country] = d;
        if (alive) setState({ country, data: d });
      })
      .catch(() => alive && setState({ country, data: null }));
    return () => {
      alive = false;
    };
  }, [country]);

  const data = state.country === country ? state.data : null;
  if (!country || !data) return null;
  const sel = fold(value);
  const pick = (name) => !disabled && onPick(name);
  const isSel = (name) => sel && fold(name) === sel;

  return (
    <div className="carte">
      <svg viewBox={`0 0 ${data.w} ${data.h}`} role="group" aria-label={`Carte des régions viticoles : ${country}`}>
        <rect width={data.w} height={data.h} className="carte-mer" />
        <path d={data.land} className="carte-voisins" />
        <path d={data.country} className="carte-pays" />
        {data.areas?.map((a) => (
          <path
            key={a.region}
            d={a.d}
            className={`carte-zone${isSel(a.region) ? ' on' : ''}`}
            onClick={() => pick(a.region)}
          >
            <title>{a.region}</title>
          </path>
        ))}
        {data.borders && <path d={data.borders} className="carte-limites" />}
        {data.regions.map((r) => (
          <g
            key={r.name}
            className={`carte-region${isSel(r.name) ? ' on' : ''}`}
            onClick={() => pick(r.name)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={r.name}
            aria-pressed={!!isSel(r.name)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(r.name))}
          >
            <circle cx={r.x} cy={r.y} r="12" className="carte-cible" />
            <circle cx={r.x} cy={r.y} r={isSel(r.name) ? 5.5 : 4} className="carte-point" />
            <text x={r.lx} y={r.ly} textAnchor={r.a} className="carte-nom">
              {r.name}
            </text>
          </g>
        ))}
      </svg>
      {data.outside?.length > 0 && (
        <div className="carte-hors">
          Hors carte :
          {data.outside.map((n) => (
            <button key={n} type="button" className={`chip${isSel(n) ? ' on' : ''}`} aria-pressed={!!isSel(n)} onClick={() => pick(n)} disabled={disabled}>
              {n}
            </button>
          ))}
        </div>
      )}
      <div className="carte-aide">
        Touchez une région sur la carte ou tapez son nom.{data.credit ? ' Zones colorées : aires officielles des appellations.' : ''}
      </div>
      {data.credit && <div className="carte-credit">{data.credit}</div>}
    </div>
  );
}
