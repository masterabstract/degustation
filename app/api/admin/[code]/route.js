import { db, unwrap, HttpError } from '@/lib/db';
import { route, json, body, cleanText } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { COLORS, REGIONS, PRICE_RANGES, SERVE_ORDER_BY_COLOR } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const BOTTLE_COLS = 'id, owner_id, number, serve_order, wine_name, producer, color, grapes, region, appellation, vintage, price_range, notes';

async function loadState(tasting) {
  const [participants, bottles, ratings, predictions] = await Promise.all([
    db().from('participants').select('id, name, hors_concours, token_hash, joined_at').eq('tasting_id', tasting.id).order('created_at'),
    db().from('bottles').select(BOTTLE_COLS).eq('tasting_id', tasting.id).order('created_at'),
    db().from('ratings').select('participant_id, bottle_id, note').eq('tasting_id', tasting.id),
    db().from('predictions').select('participant_id, bottle_id').eq('tasting_id', tasting.id),
  ]).then((rs) => rs.map((r) => unwrap(r)));

  return {
    tasting: {
      code: tasting.code,
      name: tasting.name,
      event_date: tasting.event_date,
      phase: tasting.phase,
      numbers_drawn: tasting.numbers_drawn,
      revealed_at: tasting.revealed_at,
    },
    participants: participants.map(({ token_hash, ...p }) => ({ ...p, connected: !!token_hash })),
    bottles,
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

function bottleFields(b) {
  const vintage = b.vintage === '' || b.vintage === null || b.vintage === undefined ? null : parseInt(b.vintage, 10);
  if (vintage !== null && (Number.isNaN(vintage) || vintage < 1900 || vintage > 2100)) throw new HttpError(400, 'Millésime invalide.');
  const f = {
    owner_id: b.owner_id || null,
    wine_name: cleanText(b.wine_name, 120),
    producer: cleanText(b.producer, 120),
    color: COLORS.includes(b.color) ? b.color : null,
    grapes: cleanText(b.grapes, 160),
    region: REGIONS.includes(b.region) ? b.region : null,
    appellation: cleanText(b.appellation, 120),
    vintage,
    price_range: PRICE_RANGES.includes(b.price_range) ? b.price_range : null,
    notes: cleanText(b.notes, 400),
  };
  if (!f.wine_name) throw new HttpError(400, 'Indiquez au moins le nom du vin.');
  return f;
}

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
    case 'addBottle':
      unwrap(await db().from('bottles').insert({ tasting_id: T, ...bottleFields(b.bottle || {}) }));
      break;
    case 'updateBottle':
      unwrap(await one(db().from('bottles').update(bottleFields(b.bottle || {})).eq('id', b.id)));
      break;
    case 'deleteBottle':
      if (!prep) throw new HttpError(400, 'Les bouteilles ne peuvent être supprimées qu’avant le début de la dégustation.');
      unwrap(await one(db().from('bottles').delete().eq('id', b.id)));
      break;

    // ----- Numéros anonymes -----
    case 'drawNumbers': {
      if (!prep) throw new HttpError(400, 'Les numéros sont figés une fois la dégustation commencée.');
      const bottles = unwrap(await one(db().from('bottles').select('id, number')));
      if (!bottles.length) throw new HttpError(400, 'Ajoutez d’abord des bouteilles.');
      if (b.mode === 'missing') {
        const taken = bottles.filter((x) => x.number).map((x) => x.number);
        let next = taken.length ? Math.max(...taken) : 0;
        for (const x of shuffle(bottles.filter((x) => !x.number))) {
          next += 1;
          unwrap(await one(db().from('bottles').update({ number: next }).eq('id', x.id)));
        }
      } else {
        unwrap(await one(db().from('bottles').update({ number: null })));
        const nums = shuffle(bottles.map((_, i) => i + 1));
        for (let i = 0; i < bottles.length; i++) {
          unwrap(await one(db().from('bottles').update({ number: nums[i] }).eq('id', bottles[i].id)));
        }
      }
      unwrap(await db().from('tastings').update({ numbers_drawn: true }).eq('id', T));
      break;
    }

    // ----- Ordre de service -----
    case 'setOrder': {
      if (revealed) throw new HttpError(400, 'Impossible après la révélation.');
      const ids = Array.isArray(b.ids) ? b.ids : [];
      for (let i = 0; i < ids.length; i++) {
        unwrap(await one(db().from('bottles').update({ serve_order: i + 1 }).eq('id', ids[i])));
      }
      break;
    }
    case 'autoOrder': {
      if (revealed) throw new HttpError(400, 'Impossible après la révélation.');
      const bottles = unwrap(await one(db().from('bottles').select('id, color, number, serve_order')));
      const sorted = [...bottles].sort(
        (a, c) =>
          (SERVE_ORDER_BY_COLOR[a.color] ?? 3) - (SERVE_ORDER_BY_COLOR[c.color] ?? 3) ||
          (a.serve_order ?? 999) - (c.serve_order ?? 999) ||
          (a.number ?? 999) - (c.number ?? 999)
      );
      for (let i = 0; i < sorted.length; i++) {
        unwrap(await one(db().from('bottles').update({ serve_order: i + 1 }).eq('id', sorted[i].id)));
      }
      break;
    }

    // ----- Déroulé -----
    case 'start': {
      if (!prep) throw new HttpError(400, 'La dégustation a déjà commencé.');
      const bottles = unwrap(await one(db().from('bottles').select('id, number, serve_order')));
      if (!bottles.length) throw new HttpError(400, 'Ajoutez au moins une bouteille.');
      if (bottles.some((x) => !x.number)) throw new HttpError(400, 'Toutes les bouteilles doivent avoir un numéro anonyme : tirez les numéros au sort.');
      if (bottles.some((x) => !x.serve_order)) {
        const sorted = [...bottles].sort((a, c) => (a.serve_order ?? 999) - (c.serve_order ?? 999) || a.number - c.number);
        for (let i = 0; i < sorted.length; i++) {
          unwrap(await one(db().from('bottles').update({ serve_order: i + 1 }).eq('id', sorted[i].id)));
        }
      }
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
