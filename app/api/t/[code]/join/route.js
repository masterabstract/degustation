import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body, cleanText } from '@/lib/http';
import { getTasting, getParticipant, newToken, hashToken, setParticipantCookie, clearParticipantCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Un participant choisit son nom dans la liste (ou en ajoute un).
// Chaque nom ne peut être pris que par un seul téléphone à la fois.
export const POST = route(async (req, { code }) => {
  const tasting = await getTasting(code);
  const b = await body(req);

  if (b.action === 'leave') {
    const me = await getParticipant(tasting);
    if (me) unwrap(await db().from('participants').update({ token_hash: null, joined_at: null }).eq('id', me.id));
    await clearParticipantCookie(tasting.code);
    return json({ ok: true });
  }

  const already = await getParticipant(tasting);
  if (already) return json({ ok: true, me: already });

  let participantId = b.participantId;
  if (!participantId) {
    const name = cleanText(b.name, 40);
    if (!name) throw new HttpError(400, 'Indiquez votre nom ou pseudonyme.');
    if (tasting.phase === 'revelee') throw new HttpError(400, 'La soirée est terminée : il n’est plus possible de s’ajouter.');
    const existing = unwrap(
      await db().from('participants').select('id, token_hash').eq('tasting_id', tasting.id).ilike('name', name.replace(/[%_]/g, '')).maybeSingle()
    );
    if (existing) {
      if (existing.token_hash) throw new HttpError(409, 'Ce nom est déjà utilisé sur un autre téléphone. Choisissez-en un autre ou demandez à l’organisateur de le libérer.');
      participantId = existing.id;
    } else {
      const created = unwrap(await db().from('participants').insert({ tasting_id: tasting.id, name }).select('id').single());
      participantId = created.id;
    }
  }

  const token = newToken();
  // Mise à jour conditionnelle : ne réussit que si le nom est encore libre.
  const claimed = unwrap(
    await db()
      .from('participants')
      .update({ token_hash: hashToken(token), joined_at: new Date().toISOString() })
      .eq('id', participantId)
      .eq('tasting_id', tasting.id)
      .is('token_hash', null)
      .select('id, name')
  );
  if (!claimed.length) {
    throw new HttpError(409, 'Ce nom est déjà utilisé sur un autre téléphone. Demandez à l’organisateur de le libérer si c’est bien vous.');
  }

  await setParticipantCookie(tasting.code, token);
  return json({ ok: true, me: claimed[0] });
});
