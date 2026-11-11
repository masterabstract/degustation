import 'server-only';
import crypto from 'node:crypto';

// Codes de soirée sur le thème du vin : un mot (cépage, appellation, vocabulaire de la dégustation)
// suivi de deux chiffres, par exemple SYRAH42 ou MORGON73. Huit caractères au plus.
// Chiffres de 2 à 9 seulement : jamais de confusion entre 0 et O, ni entre 1 et I.
export const MOTS_VIN = [
  // cépages
  'SYRAH', 'GAMAY', 'PINOT', 'MERLOT', 'MALBEC', 'TANNAT', 'MUSCAT', 'MAUZAC', 'MELON', 'ROLLE', 'CESAR', 'CHENIN', 'DURAS', 'PINEAU', 'ARINTO', 'GLERA', 'MENCIA', 'BOBAL',
  // appellations et régions
  'MEDOC', 'GRAVES', 'CAHORS', 'BANDOL', 'CHINON', 'BEAUNE', 'VOLNAY', 'CORNAS', 'TAVEL', 'LIRAC', 'SAUMUR', 'ANJOU', 'ALSACE', 'JURA', 'SAVOIE', 'RIOJA', 'PORTO', 'TOKAJ', 'BAROLO', 'SOAVE', 'MOSEL', 'RHONE', 'FITOU', 'BUGEY', 'MAURY', 'GIVRY', 'RULLY', 'MACON', 'MORGON', 'CHENAS', 'REGNIE', 'IRANCY', 'BLAYE', 'CASSIS', 'BELLET', 'LIMOUX', 'DOURO', 'TORO', 'RIBERA', 'NAPA', 'SONOMA', 'OTAGO', 'NUITS', 'VOSNE', 'QUINCY', 'BARSAC', 'CROZES',
  // vocabulaire du vin
  'TANIN', 'CEPAGE', 'CUVEE', 'AROME', 'CARAFE', 'VERRE', 'CAVE', 'CHAI', 'CRU', 'PIF', 'PALAIS', 'BOISE', 'ROBE', 'NEZ', 'FUT', 'VIGNE', 'GRAPPE', 'RAISIN', 'CAVEAU', 'FLACON', 'MAGNUM', 'CUVIER', 'FRUITE', 'EPICE', 'CORSE',
];

const CHIFFRES = '23456789';

export function codeVin() {
  const b = crypto.randomBytes(4);
  const mot = MOTS_VIN[b.readUInt16BE(0) % MOTS_VIN.length];
  return `${mot}${CHIFFRES[b[2] % 8]}${CHIFFRES[b[3] % 8]}`;
}
