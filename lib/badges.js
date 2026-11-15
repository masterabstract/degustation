// Badges de la Confrérie : une famille par rubrique, cinq paliers chacune.
// Ils se gagnent soirée après soirée et ne se perdent jamais. Le compte vient
// uniquement des résultats calculés (même barème pour tous) : il est reproductible.

export const PALIERS = [
  { id: 'bronze', nom: 'Bronze', seuil: 1 },
  { id: 'argent', nom: 'Argent', seuil: 3 },
  { id: 'or', nom: 'Or', seuil: 5 },
  { id: 'platine', nom: 'Platine', seuil: 10 },
  { id: 'diamant', nom: 'Diamant', seuil: 50 },
];

// unite : [singulier, pluriel] pour « 3 millésimes exacts ».
export const FAMILLES = [
  { id: 'millesime', nom: 'Maître du temps', regle: 'Trouver le millésime exact d’un vin', unite: ['millésime exact', 'millésimes exacts'] },
  { id: 'pays', nom: 'Globe-trotteur', regle: 'Trouver le pays d’un vin', unite: ['pays trouvé', 'pays trouvés'] },
  { id: 'region', nom: 'Boussole', regle: 'Trouver la région d’un vin', unite: ['région trouvée', 'régions trouvées'] },
  { id: 'appellation', nom: 'Cartographe', regle: 'Trouver l’appellation d’un vin', unite: ['appellation trouvée', 'appellations trouvées'] },
  { id: 'cepages', nom: 'Nez de vigneron', regle: 'Trouver tous les cépages d’un vin, sans erreur', unite: ['vin aux cépages trouvés', 'vins aux cépages trouvés'] },
  { id: 'parfait', nom: 'Sans faute', regle: 'Trouver un vin en entier : pays, région, appellation, cépages et millésime exact', unite: ['vin parfait', 'vins parfaits'] },
  { id: 'degustateur', nom: 'Plume d’or', regle: 'Noter un vin sur sa fiche de dégustation', unite: ['vin noté', 'vins notés'] },
  { id: 'fidelite', nom: 'Pilier de la Confrérie', regle: 'Participer à une soirée', unite: ['soirée', 'soirées'] },
];

export const compteurVide = () => Object.fromEntries(FAMILLES.map((f) => [f.id, 0]));

/** Ce qu'un dégustateur gagne en une soirée, d'après ses résultats calculés. */
export function gainsDeLaSoiree(taster, nbNotes = 0, aApporte = false) {
  const g = compteurVide();
  for (const d of taster?.details || []) {
    if (!d.answered) continue;
    const millesime = d.vintage?.gap === 0;
    const pays = d.country?.pts > 0;
    const region = !!d.geo?.regOk;
    const appellation = !!d.geo?.appOk;
    const cepages = (d.grapes?.found?.length || 0) > 0 && !(d.grapes?.wrong?.length) && d.grapes.pts >= d.grapes.max - 0.01;
    if (millesime) g.millesime += 1;
    if (pays) g.pays += 1;
    if (region) g.region += 1;
    if (appellation) g.appellation += 1;
    if (cepages) g.cepages += 1;
    if (millesime && pays && region && appellation && cepages) g.parfait += 1;
  }
  g.degustateur = nbNotes;
  // Participer : avoir pronostiqué, noté un vin ou apporté une bouteille.
  g.fidelite = (taster?.answered || 0) > 0 || nbNotes > 0 || aApporte ? 1 : 0;
  return g;
}

export const ajouter = (a, b) => Object.fromEntries(FAMILLES.map((f) => [f.id, (a?.[f.id] || 0) + (b?.[f.id] || 0)]));

/** Palier atteint pour un compte : index dans PALIERS, ou -1. */
export const palierDe = (n) => PALIERS.reduce((acc, p, i) => (n >= p.seuil ? i : acc), -1);

/** Toutes les familles avec le palier atteint et ce qu'il manque pour le suivant. */
export function etatBadges(compteur) {
  return FAMILLES.map((f) => {
    const n = compteur?.[f.id] || 0;
    const i = palierDe(n);
    const suivant = PALIERS[i + 1] || null;
    return { famille: f.id, n, palier: i >= 0 ? PALIERS[i].id : null, suivant: suivant ? { id: suivant.id, nom: suivant.nom, seuil: suivant.seuil, reste: suivant.seuil - n } : null };
  });
}

/** Paliers franchis entre deux comptes (badges gagnés pendant une soirée). */
export function nouveauxBadges(avant, apres) {
  const out = [];
  for (const f of FAMILLES) {
    const a = palierDe(avant?.[f.id] || 0);
    const b = palierDe(apres?.[f.id] || 0);
    for (let i = a + 1; i <= b; i++) out.push({ famille: f.id, palier: PALIERS[i].id, n: apres[f.id] });
  }
  return out;
}

export const nombreBadges = (compteur) => etatBadges(compteur).reduce((s, b) => s + (b.palier ? PALIERS.findIndex((p) => p.id === b.palier) + 1 : 0), 0);
