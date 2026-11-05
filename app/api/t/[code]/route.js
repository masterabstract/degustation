import { db, unwrap } from '@/lib/db';
import { route, json } from '@/lib/http';
import { getTasting, getParticipant, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// État visible par un participant. Ne contient AUCUNE information secrète :
// pour les bouteilles, seuls l'identifiant technique, le numéro anonyme
// et l'ordre de service sont envoyés. Jamais le nom, le propriétaire, etc.
export const GET = route(async (_req, { code }) => {
  const tasting = await getTasting(code);
  const me = await getParticipant(tasting);

  const participants = unwrap(
    await db().from('participants').select('id, name, token_hash').eq('tasting_id', tasting.id).order('name')
  ).map((p) => ({ id: p.id, name: p.name, taken: !!p.token_hash }));

  let bottles = [];
  let sheets = {};
  if (me && tasting.phase !== 'preparation') {
    bottles = unwrap(
      await db().from('bottles').select('id, number, serve_order').eq('tasting_id', tasting.id).order('serve_order')
    );
    const [ratings, predictions] = await Promise.all([
      db().from('ratings').select('*').eq('participant_id', me.id),
      db().from('predictions').select('*').eq('participant_id', me.id),
    ]).then((rs) => rs.map((r) => unwrap(r)));
    for (const r of ratings) (sheets[r.bottle_id] ||= {}).rating = strip(r);
    for (const p of predictions) (sheets[p.bottle_id] ||= {}).prediction = strip(p);
  }

  return json({
    tasting: { code: tasting.code, name: tasting.name, event_date: tasting.event_date, phase: tasting.phase },
    me: me ? { id: me.id, name: me.name } : null,
    isAdmin: await isAdmin(tasting),
    participants,
    bottles,
    sheets,
  });
});

function strip({ id, tasting_id, participant_id, bottle_id, ...rest }) {
  return rest;
}
