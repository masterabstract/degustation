import 'server-only';
import crypto from 'node:crypto';

// Codes de soirée : uniquement des lettres, toujours un cépage ou une appellation
// de Bourgogne, de la vallée du Rhône ou du Jura (10 lettres au plus, sans accent).
// Un code n'est jamais attribué à deux soirées existantes en même temps.
export const MOTS_VIN = {
  bourgogne: [
    // cépages
    'PINOT', 'CHARDONNAY', 'ALIGOTE', 'GAMAY', 'CESAR', 'TRESSOT', 'MELON', 'SACY',
    // appellations
    'CHABLIS', 'IRANCY', 'VEZELAY', 'EPINEUIL', 'MARSANNAY', 'FIXIN', 'GEVREY', 'MOREY', 'CHAMBOLLE', 'MUSIGNY', 'VOUGEOT', 'ECHEZEAUX', 'VOSNE', 'ROMANEE', 'TACHE', 'NUITS',
    'LADOIX', 'CORTON', 'PERNAND', 'SAVIGNY', 'CHOREY', 'BEAUNE', 'POMMARD', 'VOLNAY', 'MONTHELIE', 'AUXEY', 'MEURSAULT', 'BLAGNY', 'PULIGNY', 'MONTRACHET', 'CHASSAGNE',
    'SANTENAY', 'MARANGES', 'BOUZERON', 'RULLY', 'MERCUREY', 'GIVRY', 'MONTAGNY', 'MACON', 'FUISSE', 'VIRE', 'CLESSE',
  ],
  rhone: [
    // cépages
    'SYRAH', 'GRENACHE', 'VIOGNIER', 'MARSANNE', 'ROUSSANNE', 'MOURVEDRE', 'CINSAULT', 'CLAIRETTE', 'COUNOISE', 'CARIGNAN', 'PICPOUL', 'MUSCAT',
    // appellations
    'COTEROTIE', 'CONDRIEU', 'HERMITAGE', 'CROZES', 'CORNAS', 'GIGONDAS', 'VACQUEYRAS', 'TAVEL', 'LIRAC', 'RASTEAU', 'CAIRANNE', 'VINSOBRES', 'VENTOUX', 'LUBERON',
  ],
  jura: [
    // cépages
    'SAVAGNIN', 'POULSARD', 'PLOUSSARD', 'TROUSSEAU',
    // appellations et vins du Jura
    'ARBOIS', 'PUPILLIN', 'ETOILE', 'CHALON', 'MACVIN', 'VINJAUNE',
  ],
};
export const TOUS_MOTS = [...new Set(Object.values(MOTS_VIN).flat())];

const hasard = (n) => crypto.randomInt(n);

/** Un code libre : un mot de la liste qu'aucune soirée existante n'utilise.
 *  Si tous sont pris, deux mots accolés (ex. PINOTGAMAY), toujours 10 lettres au plus. */
export function codeVin(pris = new Set()) {
  const libres = TOUS_MOTS.filter((m) => !pris.has(m));
  if (libres.length) return libres[hasard(libres.length)];
  const courts = TOUS_MOTS.filter((m) => m.length <= 6);
  const duos = [];
  for (const a of courts) for (const b of courts) if (a !== b && a.length + b.length <= 10 && !pris.has(a + b)) duos.push(a + b);
  return duos.length ? duos[hasard(duos.length)] : null;
}
