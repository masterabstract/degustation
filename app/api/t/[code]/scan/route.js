import Anthropic from '@anthropic-ai/sdk';
import { HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { requireParticipant } from '@/lib/auth';
import { COLORS, REGIONS, PRICE_RANGES } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Lecture d'une étiquette par l'IA. La photo est envoyée à l'API Claude
// (Anthropic) pour être analysée, puis oubliée : elle n'est jamais enregistrée
// dans la base, et seul le participant qui l'a prise reçoit le résultat.

const TOOL = {
  name: 'fiche_bouteille',
  description: 'Enregistre les informations lues sur l’étiquette du vin.',
  input_schema: {
    type: 'object',
    properties: {
      lisible: { type: 'boolean', description: 'false si la photo ne montre pas une étiquette de vin lisible' },
      wine_name: { type: ['string', 'null'], description: 'Nom de la cuvée ou du vin. Si aucune cuvée, reprendre l’appellation.' },
      producer: { type: ['string', 'null'], description: 'Domaine, château, maison ou producteur.' },
      color: { type: ['string', 'null'], enum: [...COLORS, null] },
      grapes: { type: ['string', 'null'], description: 'Cépage(s), séparés par des virgules.' },
      region: { type: ['string', 'null'], enum: [...REGIONS, null] },
      appellation: { type: ['string', 'null'] },
      vintage: { type: ['integer', 'null'], description: 'Millésime, null si non millésimé ou illisible.' },
      price_range: { type: ['string', 'null'], enum: [...PRICE_RANGES, null], description: 'Estimation du prix de vente habituel en France.' },
      remarque: { type: ['string', 'null'], description: 'Une phrase courte en français sur ce qui reste incertain, ou null.' },
    },
    required: ['lisible', 'wine_name', 'producer', 'color', 'grapes', 'region', 'appellation', 'vintage', 'price_range', 'remarque'],
  },
};

const PROMPT = `Voici la photo d'une bouteille de vin (étiquette ou contre-étiquette).
Remplis la fiche avec l'outil fiche_bouteille, en français.
- Recopie fidèlement ce qui est écrit : producteur, cuvée, appellation, millésime.
- Couleur et cépages : s'ils ne sont pas écrits, déduis-les uniquement quand c'est certain (par exemple Chablis donne Chardonnay, Sancerre rouge donne Pinot Noir). Sinon laisse null.
- Région : choisis dans la liste proposée celle qui correspond à l'appellation.
- Gamme de prix : estime le prix de vente habituel en France de cette bouteille si tu le connais, sinon null.
- N'invente rien. Si la photo n'est pas une étiquette de vin lisible, mets lisible à false.`;

export const POST = route(async (req, { code }) => {
  const { tasting } = await requireParticipant(code);
  if (tasting.phase !== 'preparation') throw new HttpError(403, 'L’ajout de bouteilles est fermé.');
  if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(503, 'La lecture par photo n’est pas activée sur ce site. Saisissez la bouteille à la main.');

  const { image } = await body(req);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(image || ''));
  if (!m) throw new HttpError(400, 'Photo illisible, réessayez.');
  if (m[2].length > 4_000_000) throw new HttpError(400, 'Photo trop lourde, réessayez.');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, authToken: null });
  let msg;
  try {
    msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 800,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });
  } catch (e) {
    console.error('Lecture IA', e?.status, e?.message);
    const why = e?.status === 401 ? 'clé ANTHROPIC_API_KEY invalide' : e?.status === 429 ? 'trop de demandes, réessayez dans une minute' : e?.status === 400 && /credit/i.test(e?.message || '') ? 'crédit API épuisé' : 'service momentanément indisponible';
    throw new HttpError(502, `La lecture de la photo a échoué (${why}). Saisissez la bouteille à la main.`);
  }

  const out = msg.content.find((c) => c.type === 'tool_use')?.input;
  if (!out || out.lisible === false) throw new HttpError(422, 'Étiquette illisible. Reprenez la photo de plus près, bien éclairée, ou saisissez à la main.');
  const pick = (v, list) => (list.includes(v) ? v : null);
  return json({
    bottle: {
      wine_name: out.wine_name || out.appellation || '',
      producer: out.producer || '',
      color: pick(out.color, COLORS),
      grapes: out.grapes || '',
      region: pick(out.region, REGIONS) || '',
      appellation: out.appellation || '',
      vintage: Number.isInteger(out.vintage) ? out.vintage : '',
      price_range: pick(out.price_range, PRICE_RANGES),
    },
    remarque: out.remarque || null,
  });
});
