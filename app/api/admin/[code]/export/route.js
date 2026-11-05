import { db, unwrap } from '@/lib/db';
import { route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { computeResults } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

// Sauvegarde complète de la soirée (fichier .json téléchargé par l'organisateur).
export const GET = route(async (_req, { code }) => {
  const tasting = await requireAdmin(code);
  const q = (t) => db().from(t).select('*').eq('tasting_id', tasting.id);
  const [participants, bottles, ratings, predictions] = (
    await Promise.all([q('participants'), q('bottles'), q('ratings'), q('predictions')])
  ).map((r) => unwrap(r));

  const { admin_token_hash, ...t } = tasting;
  const clean = participants.map(({ token_hash, ...p }) => p);
  const data = {
    exported_at: new Date().toISOString(),
    tasting: t,
    participants: clean,
    bottles,
    ratings,
    predictions,
    results: tasting.phase === 'revelee' ? computeResults({ tasting, participants: clean, bottles, ratings, predictions }) : null,
  };
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="degustation-${tasting.code}-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});
