import { NON_VINTAGE } from './bareme';

// Les cinq réponses du pronostic qui rapportent des points (la couleur n'en rapporte pas).
// Un champ laissé vide rapporte 0 point : le site le signale pour qu'on pense à le remplir.
export const PRONO_CHAMPS = [
  { key: 'country', label: 'pays', pts: '2 ou 5 pts' },
  { key: 'region', label: 'région', pts: '3 pts' },
  { key: 'appellation', label: 'appellation', pts: '2 pts' },
  { key: 'grapes', label: 'cépages', pts: '10 pts' },
  { key: 'vintage', label: 'millésime', pts: '3 pts' },
];

function filled(p, key) {
  const v = p?.[key];
  if (key === 'vintage') return v === NON_VINTAGE || (v !== null && v !== undefined && String(v).trim() !== '' && !Number.isNaN(Number(v)));
  if (key === 'grapes') return String(v || '').split(',').some((x) => x.trim());
  return v !== null && v !== undefined && String(v).trim() !== '';
}

/** Champs qui rapportent des points et qui ne sont pas encore remplis. */
export function missingFields(p) {
  return PRONO_CHAMPS.filter((c) => !filled(p, c.key));
}

/** 'vide', 'incomplet' ou 'complet'. */
export function predictionStatus(p) {
  const n = PRONO_CHAMPS.length - missingFields(p).length;
  return n === 0 ? 'vide' : n === PRONO_CHAMPS.length ? 'complet' : 'incomplet';
}

/** « pays, région et millésime » */
export function listeChamps(champs) {
  const l = champs.map((c) => c.label);
  return l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} et ${l.at(-1)}`;
}
