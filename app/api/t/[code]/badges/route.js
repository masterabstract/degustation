import { HttpError } from '@/lib/db';
import { route, json } from '@/lib/http';
import { getTasting } from '@/lib/auth';
import { chargerResultats, compterBadges } from '@/lib/historique';
import { etatBadges, nouveauxBadges } from '@/lib/badges';

export const dynamic = 'force-dynamic';

// Badges gagnés pendant cette soirée (et collection de chacun à l'issue de la soirée).
// Seulement après la révélation complète : avant, rien n'est calculé.
export const GET = route(async (req, { code }) => {
  const tasting = await getTasting(code);
  if (tasting.phase !== 'revelee') throw new HttpError(403, 'Les badges sont attribués à la fin de la révélation.');
  const liste = await chargerResultats();
  const snap = compterBadges(liste).parSoiree.get(tasting.id) || new Map();
  const participants = [...snap.values()]
    .map(({ name, avant, apres }) => ({ name, nouveaux: nouveauxBadges(avant, apres), badges: etatBadges(apres) }))
    .sort((a, b) => b.nouveaux.length - a.nouveaux.length || a.name.localeCompare(b.name, 'fr'));
  return json({ participants });
});
