// Bilan personnel d'une soirée : points forts, points à travailler et conseils.
// Calculé uniquement à partir des résultats officiels (mêmes règles pour tous) :
// deux personnes avec les mêmes réponses obtiennent exactement le même bilan.

const CRITERES = [
  { id: 'grapes', nom: 'Cépages' },
  { id: 'geo', nom: 'Région et appellation' },
  { id: 'country', nom: 'Pays' },
  { id: 'vintage', nom: 'Millésime' },
];
const GUIDE = '/degustation-vin-aveugle';
const fr = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const pl = (n, s, p = `${s}s`) => `${n} ${n > 1 ? p : s}`;
const label = (w) => [w.producer, w.wine_name && w.wine_name !== w.producer ? w.wine_name : null].filter(Boolean).join(', ') || `Vin n°${w.number}`;

// Bibliothèque de conseils (textes fixes, choisis selon les constats).
const CONSEILS = {
  vides: { titre: 'Répondez à toutes les questions', texte: 'Une case vide rapporte toujours 0. Même approximative, une réponse rapporte souvent des points : un millésime à 1 an près vaut encore 2 points sur 3 pour un vin récent.', lien: `${GUIDE}#points` },
  vieux: { titre: 'Vos vins étaient plus âgés que vous ne pensiez', texte: 'Regardez le bord du verre : un rouge qui tire vers la brique ou l’orangé, un blanc doré, des tanins fondus et des arômes de sous-bois, de cuir ou de fruits secs signalent plusieurs années de garde.', lien: `${GUIDE}#deguster` },
  jeunes: { titre: 'Vos vins étaient plus jeunes que vous ne pensiez', texte: 'Une robe violacée ou très brillante, un fruit frais et croquant et des tanins encore fermes sont les signes d’un vin jeune.', lien: `${GUIDE}#deguster` },
  millesime: { titre: 'Affinez l’âge des vins', texte: 'Jugez l’âge en trois indices : la couleur sur le bord du verre, l’évolution des arômes (fruit frais, puis fruit cuit, puis sous-bois) et la souplesse des tanins.', lien: `${GUIDE}#deguster` },
  cepagesTrop: { titre: 'Ne citez que les cépages dont vous êtes sûr', texte: 'Chaque cépage en trop retire 1 point. Beaucoup de régions travaillent un seul cépage (Pinot Noir et Chardonnay en Bourgogne, Syrah au nord du Rhône, Riesling en Alsace) : un seul nom suffit souvent.', lien: `${GUIDE}#points` },
  cepages: { titre: 'Travaillez les signatures des cépages', texte: 'Retenez un ou deux marqueurs par cépage : poivre et violette pour la Syrah, cerise et robe claire pour le Pinot Noir, cassis et cèdre pour le Cabernet Sauvignon, agrumes et buis pour le Sauvignon.', lien: `${GUIDE}#deviner` },
  etrangers: { titre: 'Repérez les vins du Nouveau Monde', texte: 'Un fruit très mûr, presque confituré, plus d’alcool et un boisé vanillé marqué orientent vers l’étranger (Espagne, Italie du Sud, Amérique, Australie). L’Europe du Nord donne plus d’acidité et de retenue.', lien: `${GUIDE}#deviner` },
  francais: { titre: 'Pensez plus souvent à la France', texte: 'Fraîcheur, retenue et notes minérales sont souvent françaises. Avant de partir loin, demandez-vous si le vin ne pourrait pas venir d’une région française au climat proche.', lien: `${GUIDE}#deviner` },
  region: { titre: 'Partez du climat pour trouver la région', texte: 'Acidité vive et alcool modéré : climat frais (Loire, Bourgogne, Alsace, Jura). Vin chaleureux et très mûr : climat chaud (Rhône sud, Languedoc, Provence). Le cépage reconnu réduit aussi les régions possibles.', lien: `${GUIDE}#deviner` },
  appellation: { titre: 'Apprenez les appellations phares', texte: 'Une fois la région trouvée, l’appellation rapporte 2 points de plus. Retenez 3 ou 4 appellations par région et leur style.', lien: `${GUIDE}#deviner` },
  notes: { titre: 'Notez chaque vin', texte: 'Remplir la fiche de dégustation (note, arômes) entraîne la mémoire du goût et vous fait gagner le badge Plume d’or.', lien: `${GUIDE}#deguster` },
};

/**
 * Bilan d'un dégustateur pour une soirée révélée.
 * data : réponse de /api/t/[code]/results ; tasterId : son identifiant.
 */
export function bilanSoiree(data, tasterId, { mesNotes = null } = {}) {
  const t = data?.tasters?.find((x) => x.id === tasterId);
  if (!t || !t.answered) return null;
  const wines = Object.fromEntries((data.wines || []).map((w) => [w.id, w]));
  const classes = data.tasters.filter((x) => x.rank && x.answered > 0);

  // 1. Critères : sa réussite face à la moyenne de la table.
  const criteres = CRITERES.map((c) => {
    const m = classes.filter((x) => x.byCrit[c.id].max > 0);
    const moyenne = m.length ? m.reduce((s, x) => s + x.byCrit[c.id].pct, 0) / m.length : 0;
    const b = t.byCrit[c.id];
    return { ...c, pct: b.pct, moyenne, perdus: Math.round((b.max - b.pts) * 100) / 100, ecart: b.pct - moyenne };
  });
  const fort = [...criteres].sort((a, b) => b.ecart - a.ecart || b.pct - a.pct)[0];
  // Ordre de priorité : le critère qui a coûté le plus de points d'abord.
  const faibles = [...criteres].sort((a, b) => b.perdus - a.perdus || a.ecart - b.ecart);

  // 2. Constats, vin par vin.
  const d = t.details;
  const joues = d.filter((x) => x.answered);
  const vides = { pays: 0, geo: 0, grapes: 0, vintage: 0, vins: d.length - joues.length };
  let trop = 0;
  let paysEtrangerRate = 0;
  let paysFrancaisRate = 0;
  let nbEtrangers = 0;
  let regionRatee = 0;
  let appRatee = 0;
  const regionsApp = new Set();
  const ecarts = [];
  let exacts = 0;
  for (const x of joues) {
    const w = wines[x.bottleId] || {};
    const g = x.guess || {};
    if (!g.country) vides.pays += 1;
    if (!g.region && !g.appellation) vides.geo += 1;
    if (!x.grapes?.answered) vides.grapes += 1;
    if (!x.vintage?.answered) vides.vintage += 1;
    trop += x.grapes?.wrong?.length || 0;
    const etranger = (w.country || 'France') !== 'France';
    if (etranger) nbEtrangers += 1;
    if (g.country && !(x.country?.pts > 0)) {
      if (etranger && /^france$/i.test(g.country.trim())) paysEtrangerRate += 1;
      if (!etranger) paysFrancaisRate += 1;
    }
    if (x.country?.pts > 0 && (g.region || g.appellation) && !x.geo?.regOk) regionRatee += 1;
    if (x.geo?.regOk && g.appellation && !x.geo?.appOk) {
      appRatee += 1;
      if (w.region) regionsApp.add(w.region);
    }
    if (x.vintage?.answered && typeof w.vintage === 'number' && Number(g.vintage) > 1000) {
      ecarts.push(Number(g.vintage) - w.vintage);
      if (x.vintage.gap === 0) exacts += 1;
    }
  }
  const nbVides = vides.pays + vides.geo + vides.grapes + vides.vintage;
  const moyEcart = ecarts.length ? ecarts.reduce((s, e) => s + e, 0) / ecarts.length : 0;
  const parfaits = joues.filter((x) => x.total >= x.max - 0.01).length;

  // 3. Ce qui a bien marché.
  const reussites = [];
  const meilleurs = [...joues].sort((a, b) => b.total / b.max - a.total / a.max).slice(0, 2).filter((x) => x.total > 0);
  for (const x of meilleurs) reussites.push(`${label(wines[x.bottleId] || { number: x.number })} (n°${x.number}) : ${fr(x.total)} points sur ${x.max}.`);
  if (parfaits) reussites.push(`${pl(parfaits, 'vin trouvé', 'vins trouvés')} en entier.`);
  if (exacts) reussites.push(`${pl(exacts, 'millésime exact', 'millésimes exacts')}.`);
  if (fort && fort.ecart > 0.02) reussites.push(`${fort.nom} : ${fr(fort.pct * 100)} % de réussite, au-dessus de la moyenne de la table (${fr(fort.moyenne * 100)} %).`);

  // 4. Points à travailler (constats chiffrés) et conseils, par ordre d'importance.
  const travail = [];
  const conseils = [];
  const add = (cle) => !conseils.some((c) => c.cle === cle) && CONSEILS[cle] && conseils.push({ cle, ...CONSEILS[cle] });
  if (nbVides >= 1 || vides.vins) {
    const parties = [vides.vins && pl(vides.vins, 'vin sans réponse', 'vins sans réponse'), vides.vintage && pl(vides.vintage, 'millésime vide', 'millésimes vides'), vides.grapes && pl(vides.grapes, 'cépage vide', 'cépages vides'), vides.geo && pl(vides.geo, 'région vide', 'régions vides'), vides.pays && pl(vides.pays, 'pays vide', 'pays vides')].filter(Boolean);
    travail.push(`Réponses manquantes : ${parties.join(', ')}.`);
    add('vides');
  }
  // Un critère est « faible » s'il est sous la moyenne de la table ou sous 40 % de réussite.
  // Les erreurs typiques (cépages en trop, pays confondus…) sont signalées dans tous les cas.
  for (const c of faibles) {
    const faible = c.ecart < -0.02 || c.pct < 0.4;
    if (c.id === 'vintage' && ecarts.length) {
      if (moyEcart >= 1.5) {
        travail.push(`Millésime : vous avez vu les vins plus jeunes qu’ils ne sont, de ${fr(moyEcart)} ans en moyenne.`);
        add('vieux');
      } else if (moyEcart <= -1.5) {
        travail.push(`Millésime : vous avez vu les vins plus âgés qu’ils ne sont, de ${fr(-moyEcart)} ans en moyenne.`);
        add('jeunes');
      } else if (faible) {
        travail.push(`Millésime : ${fr(c.pct * 100)} % de réussite (moyenne de la table : ${fr(c.moyenne * 100)} %).`);
        add('millesime');
      }
    }
    if (c.id === 'grapes') {
      if (trop >= 2) {
        travail.push(`Cépages : ${pl(trop, 'cépage cité en trop', 'cépages cités en trop')}, soit ${pl(trop, 'point perdu', 'points perdus')}.`);
        add('cepagesTrop');
      }
      if (faible) {
        travail.push(`Cépages : ${fr(c.pct * 100)} % des points trouvés (moyenne de la table : ${fr(c.moyenne * 100)} %).`);
        add('cepages');
      }
    }
    if (c.id === 'country') {
      if (paysEtrangerRate) {
        travail.push(`Pays : ${paysEtrangerRate} vin${paysEtrangerRate > 1 ? 's' : ''} étranger${paysEtrangerRate > 1 ? 's' : ''} sur ${nbEtrangers} pris pour ${paysEtrangerRate > 1 ? 'des vins français' : 'un vin français'}.`);
        add('etrangers');
      }
      if (paysFrancaisRate) {
        travail.push(`Pays : ${paysFrancaisRate} vin${paysFrancaisRate > 1 ? 's' : ''} français placé${paysFrancaisRate > 1 ? 's' : ''} à l’étranger.`);
        add('francais');
      }
      if (!paysEtrangerRate && !paysFrancaisRate && faible) {
        travail.push(`Pays : ${fr(c.pct * 100)} % de réussite (moyenne de la table : ${fr(c.moyenne * 100)} %).`);
        add('etrangers');
      }
    }
    if (c.id === 'geo') {
      if (regionRatee >= 2 || (regionRatee && faible)) {
        travail.push(`Région : ${regionRatee} fois le bon pays mais une autre région.`);
        add('region');
      }
      if (appRatee >= 2 || (appRatee && faible)) {
        travail.push(`Appellation : ${appRatee} fois la bonne région mais une autre appellation${regionsApp.size ? ` (${[...regionsApp].join(', ')})` : ''}.`);
        add('appellation');
      }
      if (!regionRatee && !appRatee && faible) {
        travail.push(`Région et appellation : ${fr(c.pct * 100)} % de réussite (moyenne de la table : ${fr(c.moyenne * 100)} %).`);
        add('region');
      }
    }
  }
  if (mesNotes !== null && mesNotes === 0 && joues.length) add('notes');

  return {
    nom: t.name,
    rang: t.rank,
    classes: classes.length,
    note: Math.round(t.pct * 2000) / 100,
    points: t.points,
    max: t.max,
    criteres,
    fort,
    reussites,
    travail: travail.slice(0, 5),
    conseils: conseils.slice(0, 3),
  };
}
