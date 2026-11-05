import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body, cleanText } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { bottleFields, numberMissing, SECRET_COLS, PUBLIC_COLS } from '@/lib/bottles';

export const dynamic = 'force-dynamic';

// L'organisateur ne connaît PAS les bouteilles : avant la révélation, il ne reçoit
// que leur identifiant, leur numéro anonyme et leur ordre de service.
// Ni le contenu, ni le propriétaire d'une bouteille ne lui sont envoyés.
async function loadState(tasting) {
  const revealed = tasting.phase === 'revelee';
  const [participants, bottles, ratings, predictions] = await Promise.all([
    db().from('participants').select('id, name, hors_concours, token_hash, joined_at').eq('tasting_id', tasting.id).order('created_at'),
    db().from('bottles').select(`${PUBLIC_COLS}, owner_id${revealed ? `, ${SECRET_COLS}` : ''}`).eq('tasting_id', tasting.id),
    db().from('ratings').select('participant_id, bottle_id, note').eq('tasting_id', tasting.id),
    db().from('predictions').select('participant_id, bottle_id').eq('tasting_id', tasting.id),
  ]).then((rs) => rs.map((r) => unwrap(r)));

  const count = (pid) => bottles.filter((b) => b.owner_id === pid).length;
  const visibleBottles = bottles
    .map((b) => (revealed ? b : { id: b.id, number: b.number, serve_order: b.serve_order }))
    .sort((a, b) => (a.number ?? 999) - (b.number ?? 999) || a.id.localeCompare(b.id));

  return {
    tasting: {
      code: tasting.code,
      name: tasting.name,
      event_date: tasting.event_date,
      phase: tasting.phase,
      numbers_drawn: tasting.numbers_drawn,
      revealed_at: tasting.revealed_at,
    },
    participants: participants.map(({ token_hash, ...p }) => ({ ...p, connected: !!token_hash, bottles: count(p.id) })),
    bottles: visibleBottles,
    progress: {
      ratings: ratings.filter((r) => r.note !== null).map((r) => [r.participant_id, r.bottle_id]),
      predictions: predictions.map((r) => [r.participant_id, r.bottle_id]),
    },
  };
}

export const GET = route(async (_req, { code }) => {
  const tasting = await requireAdmin(code);
  return json(await loadState(tasting));
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const POST = route(async (req, { code }) => {
  const tasting = await requireAdmin(code);
  const b = await body(req);
  const T = tasting.id;
  const prep = tasting.phase === 'preparation';
  const revealed = tasting.phase === 'revelee';
  const one = (q) => q.eq('tasting_id', T);

  switch (b.action) {
    // ----- Participants -----
    case 'addParticipants': {
      const names = [...new Set((b.names || []).map((n) => cleanText(n, 40)).filter(Boolean))];
      if (!names.length) throw new HttpError(400, 'Aucun nom saisi.');
      const existing = unwrap(await one(db().from('participants').select('name'))).map((p) => p.name.toLowerCase());
      const fresh = names.filter((n) => !existing.includes(n.toLowerCase()));
      if (fresh.length) unwrap(await db().from('participants').insert(fresh.map((n) => ({ tasting_id: T, name: n }))));
      break;
    }
    case 'updateParticipant': {
      const patch = {};
      if (b.name !== undefined) patch.name = cleanText(b.name, 40);
      if (b.hors_concours !== undefined) patch.hors_concours = !!b.hors_concours;
      if (patch.name === null) throw new HttpError(400, 'Le nom ne peut pas être vide.');
      const r = await one(db().from('participants').update(patch).eq('id', b.id));
      if (r.error?.code === '23505') throw new HttpError(400, 'Ce nom existe déjà.');
      unwrap(r);
      break;
    }
    case 'releaseParticipant': // libère le nom pour qu'il soit repris sur un autre téléphone
      unwrap(await one(db().from('participants').update({ token_hash: null, joined_at: null }).eq('id', b.id)));
      break;
    case 'deleteParticipant':
      if (revealed) throw new HttpError(400, 'Impossible après la révélation.');
      unwrap(await one(db().from('participants').delete().eq('id', b.id)));
      break;

    // ----- Bouteilles -----
    // Les bouteilles sont saisies par leurs propriétaires. L'organisateur ne peut
    // corriger une bouteille qu'APRÈS la révélation (faute de frappe, etc.).
    case 'updateBottle':
      if (!revealed) throw new HttpError(403, 'Seul le propriétaire peut modifier sa bouteille avant la révélation.');
      unwrap(await one(db().from('bottles').update(bottleFields(b.bottle || {})).eq('id', b.id)));
      break;

    // ----- Numéros anonymes -----
    case 'drawNumbers': {
      if (!prep) throw new HttpError(400, 'Les numéros sont figés une fois la dégustation commencée.');
      const bottles = unwrap(await one(db().from('bottles').select('id, number')));
      if (!bottles.length) throw new HttpError(400, 'Ajoutez d’abord des bouteilles.');
      if (b.mode === 'missing') {
        await numberMissing(T);
      } else {
        unwrap(await one(db().from('bottles').update({ number: null })));
        const nums = shuffle(bottles.map((_, i) => i + 1));
        for (let i = 0; i < bottles.length; i++) {
          unwrap(await one(db().from('bottles').update({ number: nums[i], serve_order: nums[i] }).eq('id', bottles[i].id)));
        }
      }
      unwrap(await db().from('tastings').update({ numbers_drawn: true }).eq('id', T));
      break;
    }

    // ----- Déroulé -----
    case 'start': {
      if (!prep) throw new HttpError(400, 'La dégustation a déjà commencé.');
      // La dégustation peut démarrer à tout moment, même avec une seule bouteille
      // (ou aucune) : les bouteilles sans numéro en reçoivent un maintenant, et
      // celles ajoutées ensuite seront numérotées dès leur enregistrement.
      await numberMissing(T);
      unwrap(await db().from('tastings').update({ phase: 'degustation' }).eq('id', T));
      break;
    }
    case 'pause': // retour en préparation (avant la révélation uniquement)
      if (revealed) throw new HttpError(400, 'La révélation est définitive.');
      unwrap(await db().from('tastings').update({ phase: 'preparation' }).eq('id', T));
      break;
    case 'reveal':
      if (tasting.phase !== 'degustation') throw new HttpError(400, 'La dégustation doit être en cours pour être révélée.');
      if (b.confirm !== true) throw new HttpError(400, 'Confirmation manquante.');
      unwrap(await db().from('tastings').update({ phase: 'revelee', revealed_at: new Date().toISOString() }).eq('id', T));
      break;
    case 'rename':
      unwrap(await db().from('tastings').update({ name: cleanText(b.name, 80) || tasting.name }).eq('id', T));
      break;

    default:
      throw new HttpError(400, 'Action inconnue.');
  }

  const fresh = unwrap(await db().from('tastings').select('*').eq('id', T).single());
  return json(await loadState(fresh));
});
