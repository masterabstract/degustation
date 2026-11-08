import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { requireParticipant } from '@/lib/auth';
import { bottleFields, numberMissing, bottleInPlay, SECRET_COLS, PUBLIC_COLS } from '@/lib/bottles';

export const dynamic = 'force-dynamic';

// Chaque participant gère SES bouteilles. Personne d'autre (ni l'organisateur,
// ni les autres participants) ne peut lire leur contenu avant la révélation.
export const POST = route(async (req, { code }) => {
  const { tasting, me } = await requireParticipant(code);
  const b = await body(req);
  const mine = (q) => q.eq('tasting_id', tasting.id).eq('owner_id', me.id);
  if (tasting.phase === 'revelation') throw new HttpError(403, 'La révélation a commencé : les bouteilles ne peuvent plus être modifiées.');

  if (b.action === 'add') {
    if (tasting.phase === 'revelee') throw new HttpError(403, 'La soirée est terminée : les bouteilles sont révélées.');
    const count = unwrap(await mine(db().from('bottles').select('id'))).length;
    if (count >= 6) throw new HttpError(400, 'Maximum 6 bouteilles par participant.');
    unwrap(await db().from('bottles').insert({ tasting_id: tasting.id, owner_id: me.id, ...bottleFields(b.bottle || {}) }), 'Bouteille non enregistrée.');
    // Pendant la dégustation, la bouteille reçoit tout de suite le numéro suivant.
    if (tasting.phase === 'degustation') await numberMissing(tasting.id);
  } else if (b.action === 'update') {
    if (tasting.phase === 'revelee') throw new HttpError(403, 'Les bouteilles sont révélées.');
    if (tasting.phase === 'degustation' && (await bottleInPlay(b.id))) throw new HttpError(403, 'Des participants ont déjà noté ou deviné cette bouteille : ses réponses ne peuvent plus changer.');
    const r = unwrap(await mine(db().from('bottles').update(bottleFields(b.bottle || {})).eq('id', b.id)).select('id'));
    if (!r.length) throw new HttpError(404, 'Bouteille introuvable.');
  } else if (b.action === 'delete') {
    if (tasting.phase === 'revelee') throw new HttpError(403, 'Suppression impossible après la révélation.');
    if (tasting.phase === 'degustation' && (await bottleInPlay(b.id))) throw new HttpError(403, 'Des participants ont déjà noté ou deviné cette bouteille : elle ne peut plus être retirée.');
    unwrap(await mine(db().from('bottles').delete().eq('id', b.id)));
  } else {
    throw new HttpError(400, 'Action inconnue.');
  }

  const myBottles = unwrap(await mine(db().from('bottles').select(`${PUBLIC_COLS}, ${SECRET_COLS}`)).order('created_at'));
  return json({ myBottles });
});
