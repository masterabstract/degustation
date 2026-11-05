import Anthropic from '@anthropic-ai/sdk';
import { HttpError } from '@/lib/db';
import { route, json, body } from '@/lib/http';
import { requireParticipant } from '@/lib/auth';
import { COLORS, COUNTRIES } from '@/lib/constants';

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
      producer: { type: ['string', 'null'], description: 'Domaine, château, maison ou producteur.' },
      appellation: { type: ['string', 'null'] },
      grapes: { type: ['string', 'null'], description: 'Cépage(s), séparés par des virgules.' },
      region: { type: ['string', 'null'], description: 'Région viticole, par exemple Bourgogne, Vallée du Rhône, Toscane.' },
      country: { type: ['string', 'null'], enum: [...COUNTRIES, null] },
      color: { type: ['string', 'null'], enum: [...COLORS, null] },
      wine_name: { type: ['string', 'null'], description: 'Nom de la cuvée s’il y en a une, sinon null.' },
      vintage: { type: ['integer', 'null'], description: 'Millésime, null si non millésimé ou illisible.' },
      remarque: { type: ['string', 'null'], description: 'Une phrase courte en français sur ce qui reste incertain, ou null.' },
    },
    required: ['lisible', 'producer', 'appellation', 'grapes', 'region', 'country', 'color', 'wine_name', 'vintage', 'remarque'],
  },
};

const PROMPT = `Voici la photo d'une bouteille de vin (étiquette ou contre-étiquette).
Remplis la fiche avec l'outil fiche_bouteille, en français.
- Recopie fidèlement ce qui est écrit : domaine, appellation, cuvée, millésime.
- Cépages, région, pays et couleur : s'ils ne sont pas écrits, déduis-les uniquement quand c'est certain (par exemple Chablis donne Chardonnay, Bourgogne, France, Blanc). Sinon laisse null.
- N'invente rien. Si la photo n'est pas une étiquette de vin lisible, mets lisible à false.`;

export const POST = route(async (req, { code }) => {
  const { tasting } = await requireParticipant(code);
  if (tasting.phase === 'revelee' || tasting.phase === 'revelation') throw new HttpError(403, 'L’ajout de bouteilles est fermé.');
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
      producer: out.producer || '',
      appellation: out.appellation || '',
      grapes: out.grapes || '',
      region: out.region || '',
      country: pick(out.country, COUNTRIES),
      color: pick(out.color, COLORS),
      wine_name: out.wine_name || '',
      vintage: Number.isInteger(out.vintage) ? out.vintage : '',
    },
    remarque: out.remarque || null,
  });
});
