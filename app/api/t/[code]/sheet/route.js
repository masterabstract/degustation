import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body, cleanText } from '@/lib/http';
import { requireParticipant } from '@/lib/auth';
import { ALL_ROBES, AROMES, SCALES, COLORS, COUNTRIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

function scale(v, min = 1) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseInt(v, 10);
  return n >= min && n <= 5 ? n : null;
}

function cleanRating(r) {
  const note = r.note === null || r.note === undefined || r.note === '' ? null : Math.round(Number(r.note) * 2) / 2;
  if (note !== null && (Number.isNaN(note) || note < 0 || note > 20)) throw new HttpError(400, 'La note doit être entre 0 et 20.');
  const out = {
    robe: ALL_ROBES.includes(r.robe) ? r.robe : null,
    aromes: Array.isArray(r.aromes) ? [...new Set(r.aromes.filter((a) => AROMES.includes(a)))] : [],
    note,
    commentaire: r.commentaire ? String(r.commentaire).slice(0, 1000) : null,
  };
  for (const k of Object.keys(SCALES)) out[k] = scale(r[k], k === 'tanins' ? 0 : 1);
  return out;
}

function cleanPrediction(p) {
  let vintage = p.vintage === null || p.vintage === undefined || p.vintage === '' ? null : parseInt(p.vintage, 10);
  if (vintage !== null && (Number.isNaN(vintage) || (vintage !== 0 && (vintage < 1900 || vintage > 2100)))) vintage = null;
  return {
    appellation: cleanText(p.appellation, 120),
    grapes: cleanText(p.grapes, 120),
    region: cleanText(p.region, 80),
    country: COUNTRIES.includes(p.country) ? p.country : null,
    color: COLORS.includes(p.color) ? p.color : null,
    vintage,
  };
}

// Enregistrement automatique de la fiche et/ou des pronostics d'un vin.
export const PUT = route(async (req, { code }) => {
  const { tasting, me } = await requireParticipant(code);
  if (tasting.phase === 'preparation') throw new HttpError(403, 'La dégustation n’a pas encore commencé.');
  if (tasting.phase === 'revelee') throw new HttpError(403, 'Les bouteilles sont révélées : les fiches et pronostics sont verrouillés.');

  const b = await body(req);
  const bottle = unwrap(
    await db().from('bottles').select('id').eq('id', b.bottleId || '00000000-0000-0000-0000-000000000000').eq('tasting_id', tasting.id).maybeSingle()
  );
  if (!bottle) throw new HttpError(404, 'Vin introuvable.');

  const keys = { tasting_id: tasting.id, participant_id: me.id, bottle_id: bottle.id };
  const now = new Date().toISOString();
  if (b.rating) {
    unwrap(
      await db().from('ratings').upsert({ ...keys, ...cleanRating(b.rating), updated_at: now }, { onConflict: 'participant_id,bottle_id' }),
      'Fiche non enregistrée.'
    );
  }
  if (b.prediction) {
    const r = await db().from('predictions').upsert({ ...keys, ...cleanPrediction(b.prediction) }, { onConflict: 'participant_id,bottle_id' });
    if (r.error?.message?.includes('verrouill')) throw new HttpError(403, 'Les pronostics sont verrouillés.');
    unwrap(r, 'Pronostic non enregistré.');
  }
  return json({ ok: true, savedAt: now });
});
