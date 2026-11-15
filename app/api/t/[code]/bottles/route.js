import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { requireParticipant } from '@/lib/auth';
import { bottleFields, numberMissing, bottleInPlay, OWNER_COLS, ownerView, ecrireFiche } from '@/lib/bottles';

export const dynamic = 'force-dynamic';

// Chaque participant gère SES bouteilles. Personne d'autre (ni l'organisateur,
// ni les autres participants) ne peut lire leur contenu avant la révélation.
export const POST = route(async (req, { code }) => {
  const { tasting, me } = await requireParticipant(code);
  const b = await body(req);
  const mine = (q) => q.eq('tasting_id', tasting.id).eq('owner_id', me.id);
  if (tasting.phase === 'revelation') throw new HttpError(403, 'La révélation a commencé : les bouteilles ne peuvent plus être modifiées.');
  // Avant tout autre contrôle : la bouteille doit appartenir à ce participant.
  const ownOrFail = async (id) => {
    const row = unwrap(await mine(db().from('bottles').select('id').eq('id', id || '00000000-0000-0000-0000-000000000000')).maybeSingle());
    if (!row) throw new HttpError(404, 'Bouteille introuvable.');
  };
  const isRevealed = async (id) => {
    const row = unwrap(await db().from('bottles').select('number').eq('id', id || '00000000-0000-0000-0000-000000000000').eq('tasting_id', tasting.id).maybeSingle());
    return !!row && (tasting.revealed_numbers || []).includes(row.number);
  };

  if (b.action === 'add') {
    if (tasting.phase === 'revelee') throw new HttpError(403, 'La soirée est terminée : les bouteilles sont révélées.');
    const count = unwrap(await mine(db().from('bottles').select('id'))).length;
    if (count >= 6) throw new HttpError(400, 'Maximum 6 bouteilles par participant.');
    unwrap(await ecrireFiche((f) => db().from('bottles').insert({ tasting_id: tasting.id, owner_id: me.id, ...f }), bottleFields(b.bottle || {})), 'Bouteille non enregistrée.');
    // Pendant la dégustation, la bouteille reçoit tout de suite le numéro suivant.
    if (tasting.phase === 'degustation') await numberMissing(tasting.id);
  } else if (b.action === 'update') {
    if (tasting.phase === 'revelee') throw new HttpError(403, 'Les bouteilles sont révélées.');
    await ownOrFail(b.id);
    if (tasting.phase === 'degustation' && (await isRevealed(b.id))) throw new HttpError(403, 'Cette bouteille est révélée : elle ne peut plus être modifiée.');
    if (tasting.phase === 'degustation' && (await bottleInPlay(b.id))) throw new HttpError(403, 'Des participants ont déjà noté ou deviné cette bouteille : ses réponses ne peuvent plus changer.');
    const r = unwrap(await ecrireFiche((f) => mine(db().from('bottles').update(f).eq('id', b.id)).select('id'), bottleFields(b.bottle || {})));
    if (!r.length) throw new HttpError(404, 'Bouteille introuvable.');
  } else if (b.action === 'confirm') {
    // « J'ai vérifié ma fiche, elle est juste » : ne change aucune réponse, seulement le contrôle.
    if (tasting.phase === 'revelee') throw new HttpError(403, 'Les bouteilles sont révélées.');
    await ownOrFail(b.id);
    const r = await mine(db().from('bottles').update({ fiche_ok: true }).eq('id', b.id));
    if (r.error && /fiche_ok/.test(r.error.message || '')) throw new HttpError(503, 'La base de données doit être mise à jour (voir le guide de mise en ligne).');
    unwrap(r);
  } else if (b.action === 'delete') {
    if (tasting.phase === 'revelee') throw new HttpError(403, 'Suppression impossible après la révélation.');
    await ownOrFail(b.id);
    if (tasting.phase === 'degustation' && (await isRevealed(b.id))) throw new HttpError(403, 'Cette bouteille est révélée : elle ne peut plus être retirée.');
    if (tasting.phase === 'degustation' && (await bottleInPlay(b.id))) throw new HttpError(403, 'Des participants ont déjà noté ou deviné cette bouteille : elle ne peut plus être retirée.');
    unwrap(await mine(db().from('bottles').delete().eq('id', b.id)));
  } else {
    throw new HttpError(400, 'Action inconnue.');
  }

  const myBottles = unwrap(await mine(db().from('bottles').select(OWNER_COLS)).order('created_at')).map(ownerView);
  return json({ myBottles });
});
