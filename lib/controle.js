// Contrôle automatique d'une fiche de bouteille, avant la dégustation.
// Il repère les erreurs de saisie fréquentes (nom de cuvée à la place de l'appellation,
// faute de frappe, appellation d'une autre région, cépage inconnu, millésime impossible).
// Le détail des alertes n'est montré QU'À l'auteur de la bouteille ; l'organisateur
// ne voit que le nombre de fiches vérifiées (le contenu reste secret).
import { APPELLATIONS_BY_COUNTRY, REGIONS_BY_COUNTRY, ALL_GRAPES, GRAPES_BY_COUNTRY } from './appellations';
import { canonApp, canonGrape, plusProche, grapeComposition } from './bareme';

const fold = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const guill = (x) => `«\u00a0${String(x).trim()}\u00a0»`;
const dePays = (p) => (/^[AEIOUÉÈÊ]/i.test(p) ? `d’${p}` : `de ${p}`);

// Index par pays : nom canonique d'appellation -> fiches (une appellation peut exister dans plusieurs régions).
const INDEX = {};
for (const [pays, liste] of Object.entries(APPELLATIONS_BY_COUNTRY)) {
  const m = new Map();
  for (const a of liste) {
    const k = canonApp(a.name);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(a);
  }
  INDEX[pays] = m;
}
const REGIONS_CANON = Object.fromEntries(Object.entries(REGIONS_BY_COUNTRY).map(([p, l]) => [p, new Map(l.map((r) => [canonApp(r), r]))]));
const GRAPES_CANON = new Set(ALL_GRAPES.map((g) => canonGrape(g)));

/** Pays (connu de notre base) où existe cette appellation, hors `sauf`. */
function autrePays(nom, sauf) {
  const k = canonApp(nom);
  for (const [pays, m] of Object.entries(INDEX)) if (pays !== sauf && m.has(k)) return pays;
  return null;
}

/**
 * Alertes d'une fiche : [{ champ, message, suggestion?, remplacer? }]
 *  - champ : appellation, region, grapes, vintage ;
 *  - suggestion : valeur proposée (bouton « Utiliser … » dans le formulaire) ;
 *  - cuvee : vrai si le texte ressemble au nom de la cuvée (bouton « C'est le nom de la cuvée »).
 */
export function controleBouteille(b) {
  const out = [];
  const pays = b.country;
  const index = INDEX[pays];
  const app = String(b.appellation || '').trim();
  const reg = String(b.region || '').trim();

  const regions = REGIONS_CANON[pays];

  // --- Appellation ---
  let fiches = null;
  if (app && index) {
    fiches = index.get(canonApp(app)) || null;
    if (!fiches) {
      const ailleurs = autrePays(app, pays);
      const cuvee = (b.wine_name && fold(b.wine_name) === fold(app)) || /\b(cuvee|riserva|reserva|reserve|gran|vieilles vignes|selection|grande|tradition)\b/.test(fold(app));
      if (ailleurs) {
        out.push({ champ: 'appellation', message: `${guill(app)} est une appellation ${dePays(ailleurs)}, pas ${dePays(pays)}. Vérifiez le pays ou l’appellation.` });
      } else if (regions && regions.has(canonApp(app))) {
        // Nom de région saisi comme appellation (ex. « Jura »).
        const exemples = (APPELLATIONS_BY_COUNTRY[pays] || []).filter((a) => a.region && canonApp(a.region) === canonApp(app)).slice(0, 3).map((a) => a.name);
        out.push({ champ: 'appellation', message: `${guill(app)} est une région, pas une appellation. Choisissez l’appellation dans la liste${exemples.length ? ` (ex : ${exemples.join(', ')})` : ''}.` });
      } else {
        const proche = plusProche(app, (APPELLATIONS_BY_COUNTRY[pays] || []).map((a) => a.name));
        out.push({
          champ: 'appellation',
          message: `${guill(app)} n’est pas une appellation connue ${pays === 'France' ? 'en France' : `pour ce pays (${pays})`}.${cuvee ? ' On dirait le nom de la cuvée.' : ''}${proche ? ` Vouliez-vous dire ${guill(proche)} ?` : ' Choisissez-la dans la liste si possible.'}`,
          ...(proche ? { suggestion: proche } : {}),
          cuvee: true,
        });
      }
    }
  }

  // --- Région ---
  if (reg && regions && !regions.has(canonApp(reg))) {
    const proche = plusProche(reg, [...regions.values()]);
    out.push({ champ: 'region', message: `${guill(reg)} n’est pas une région viticole connue ${pays === 'France' ? 'en France' : `pour ce pays (${pays})`}.${proche ? ` Vouliez-vous dire ${guill(proche)} ?` : ''}`, ...(proche ? { suggestion: proche } : {}) });
  } else if (reg && fiches && fiches.some((f) => f.region) && !fiches.some((f) => !f.region || canonApp(f.region) === canonApp(reg))) {
    const vraie = fiches.find((f) => f.region).region;
    out.push({ champ: 'region', message: `${guill(app)} se trouve en ${vraie}, pas en ${reg}. Vérifiez la région ou l’appellation.`, suggestion: vraie });
  }

  // --- Cépages ---
  const compo = grapeComposition(b);
  for (const g of compo) {
    if (GRAPES_CANON.has(g.key)) continue;
    const proche = plusProche(g.name, GRAPES_BY_COUNTRY[pays] || ALL_GRAPES);
    out.push({ champ: 'grapes', message: `Cépage ${guill(g.name)} inconnu.${proche ? ` Vouliez-vous dire ${guill(proche)} ?` : ' Vérifiez l’orthographe.'}`, ...(proche ? { suggestion: proche, remplacer: g.name } : {}) });
  }
  if (compo.length && fiches) {
    const attendus = new Set(fiches.flatMap((f) => String(f.grapes || '').split(',').map((x) => canonGrape(x.trim())).filter(Boolean)));
    if (attendus.size && !compo.some((g) => attendus.has(g.key))) {
      const liste = String(fiches[0].grapes).split(',').map((x) => x.trim()).filter(Boolean).slice(0, 4).join(', ');
      out.push({ champ: 'grapes', message: `Cépage inhabituel pour ${app} (on y trouve surtout : ${liste}). Vérifiez, sauf si c’est voulu.` });
    }
  }
  const pcts = (Array.isArray(b.grape_mix) ? b.grape_mix : []).filter((g) => g?.name && String(g.pct ?? '').trim() !== '');
  if (pcts.length > 1 && pcts.length === (b.grape_mix || []).filter((g) => g?.name).length) {
    const somme = Math.round(pcts.reduce((s, g) => s + Number(String(g.pct).replace(',', '.')), 0) * 10) / 10;
    if (somme !== 100) out.push({ champ: 'grapes', message: `Les pourcentages des cépages font ${String(somme).replace('.', ',')} % au lieu de 100 %.` });
  }

  // --- Millésime ---
  const annee = new Date().getFullYear();
  const v = b.non_vintage ? null : Number(b.vintage);
  if (v && (v > annee || v < 1900)) out.push({ champ: 'vintage', message: `Millésime ${v} impossible.` });
  else if (v && v === annee) out.push({ champ: 'vintage', message: `Millésime ${v} : un vin de l’année est rare. Vérifiez.` });

  return out;
}

/** Fiche vérifiée : aucune alerte, ou alertes confirmées par son auteur (fiche_ok). */
export const ficheVerifiee = (b) => !!b.fiche_ok || controleBouteille(b).length === 0;
