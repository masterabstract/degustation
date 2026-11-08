import { db, unwrap } from '@/lib/db';
import { route, json } from '@/lib/http';
import { getTasting, getParticipant, isAdmin } from '@/lib/auth';
import { SECRET_COLS, PUBLIC_COLS } from '@/lib/bottles';

export const dynamic = 'force-dynamic';

// État visible par un participant. Ne contient AUCUNE information secrète :
// pour les bouteilles des autres, seuls l'identifiant technique, le numéro anonyme
// et l'ordre de service sont envoyés. Jamais le nom, le propriétaire, etc.
// Le participant reçoit en plus le détail de SES propres bouteilles (myBottles).
export const GET = route(async (_req, { code }) => {
  const tasting = await getTasting(code);
  const me = await getParticipant(tasting);

  const participants = unwrap(
    await db().from('participants').select('id, name, token_hash').eq('tasting_id', tasting.id).order('name')
  ).map((p) => ({ id: p.id, name: p.name, taken: !!p.token_hash }));

  let bottles = [];
  let sheets = {};
  let myBottles = [];
  if (me) {
    // Uniquement les bouteilles dont CE participant est propriétaire.
    myBottles = unwrap(
      await db().from('bottles').select(`${PUBLIC_COLS}, ${SECRET_COLS}`).eq('tasting_id', tasting.id).eq('owner_id', me.id).order('created_at')
    );
  }
  if (me && tasting.phase !== 'preparation') {
    bottles = unwrap(
      await db().from('bottles').select('id, number, serve_order').eq('tasting_id', tasting.id).order('number')
    );
    const [ratings, predictions] = await Promise.all([
      db().from('ratings').select('*').eq('participant_id', me.id),
      db().from('predictions').select('*').eq('participant_id', me.id),
    ]).then((rs) => rs.map((r) => unwrap(r)));
    for (const r of ratings) (sheets[r.bottle_id] ||= {}).rating = strip(r);
    for (const p of predictions) (sheets[p.bottle_id] ||= {}).prediction = strip(p);
  }

  return json({
    tasting: {
      code: tasting.code,
      name: tasting.name,
      event_date: tasting.event_date,
      phase: tasting.phase,
      current_number: tasting.phase === 'degustation' ? tasting.current_number : null,
      served_numbers: tasting.served_numbers || [],
      revealed_numbers: tasting.phase === 'preparation' ? [] : tasting.revealed_numbers || [],
    },
    me: me ? { id: me.id, name: me.name } : null,
    isAdmin: await isAdmin(tasting),
    participants,
    bottles,
    sheets,
    myBottles,
    scanEnabled: !!process.env.ANTHROPIC_API_KEY,
  });
});

function strip({ id, tasting_id, participant_id, bottle_id, ...rest }) {
  return rest;
}
