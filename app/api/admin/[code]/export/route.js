import { db, unwrap } from '@/lib/db';
import { route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { computeResults } from '@/lib/scoring';
import { BAREME, VINTAGE_DECADES } from '@/lib/bareme';

export const dynamic = 'force-dynamic';

// Sauvegarde complète de la soirée (fichier .json téléchargé par l'organisateur).
export const GET = route(async (_req, { code }) => {
  const tasting = await requireAdmin(code);
  const q = (t) => db().from(t).select('*').eq('tasting_id', tasting.id);
  const [participants, bottles, ratings, predictions] = (
    await Promise.all([q('participants'), q('bottles'), q('ratings'), q('predictions')])
  ).map((r) => unwrap(r));

  const { admin_token_hash, ...t } = tasting;
  const revealed = tasting.phase === 'revelee';
  // Avant la révélation, la sauvegarde ne contient pas le contenu des bouteilles
  // ni leurs propriétaires (l'organisateur ne doit pas les connaître).
  const safeBottles = revealed ? bottles : bottles.map((b) => ({ id: b.id, number: b.number, serve_order: b.serve_order }));
  const clean = participants.map(({ token_hash, ...p }) => p);
  const data = {
    exported_at: new Date().toISOString(),
    tasting: t,
    participants: clean,
    bottles: safeBottles,
    ratings,
    predictions,
    bareme: { ...BAREME, millesime: VINTAGE_DECADES, classement: 'pourcentage des points possibles ; départage cépages, géographie, pays, millésime' },
    results: revealed ? computeResults({ tasting, participants: clean, bottles, ratings, predictions }) : null,
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
