// Fiches gardées sur le téléphone quand le réseau manque.
// Chaque modification d'une fiche ou d'un pronostic est d'abord copiée ici, puis envoyée au serveur.
// La copie n'est effacée qu'une fois l'envoi confirmé : tant qu'elle existe, c'est qu'elle n'est pas partie.
// Elle ne contient que les réponses du participant lui-même (rien de secret sur les bouteilles).
// Un vin déjà révélé refuse toute fiche (même ancienne) : impossible de tricher en « rattrapant » une réponse.
const key = (code, bottleId) => `dg_${code}_${bottleId}`;

function get(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null;
  }
}

export function readDraft(code, bottleId) {
  const d = get(key(code, bottleId));
  if (!d) return null;
  // ancien format (sans indicateurs) : on considère les deux parties comme à envoyer
  return { rating: d.rating || null, pred: d.pred || null, dr: d.dr ?? !!d.rating, dp: d.dp ?? !!d.pred, at: d.at || 0 };
}

/** Enregistre l'état courant ; `kind` ('rating' ou 'prediction') marque la partie modifiée. */
export function writeDraft(code, bottleId, { rating, pred }, kind) {
  try {
    const old = readDraft(code, bottleId);
    const d = { rating, pred, dr: !!old?.dr || kind === 'rating', dp: !!old?.dp || kind === 'prediction', at: Date.now() };
    localStorage.setItem(key(code, bottleId), JSON.stringify(d));
  } catch {}
}

export function deleteDraft(code, bottleId) {
  try {
    localStorage.removeItem(key(code, bottleId));
  } catch {}
}

/** Identifiants des bouteilles dont une fiche attend d'être envoyée. */
export function pendingDrafts(code) {
  const out = [];
  try {
    const p = `dg_${code}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(p)) out.push(k.slice(p.length));
    }
  } catch {}
  return out;
}

export function draftPayload(bottleId, d) {
  const body = { bottleId };
  if (d.dr && d.rating) body.rating = d.rating;
  if (d.dp && d.pred) body.prediction = { ...d.pred, vintage: d.pred.vintage === '' || d.pred.vintage === undefined ? null : Number(d.pred.vintage) };
  return body;
}

// Fiches refusées (vin révélé avant le retour du réseau) : compteur gardé sur le téléphone
// jusqu'à ce que le participant en soit prévenu sur la liste des vins.
const refusedKey = (code) => `dg-refus_${code}`;
export function markRefused(code) {
  try {
    localStorage.setItem(refusedKey(code), String(Number(localStorage.getItem(refusedKey(code)) || 0) + 1));
  } catch {}
}
export function takeRefused(code) {
  try {
    const n = Number(localStorage.getItem(refusedKey(code)) || 0);
    localStorage.removeItem(refusedKey(code));
    return n;
  } catch {
    return 0;
  }
}

/** Vrai si l'erreur vient du réseau (pas de connexion), et non d'un refus du serveur. */
export const isNetworkError = (e) => !e?.status;

let sending = false;
/**
 * Envoie les fiches en attente (sauf celle ouverte à l'écran, gérée par la page elle-même).
 * Renvoie { sent, refused, left } : `refused` = fiches refusées (vin révélé entre-temps).
 */
export async function sendPendingDrafts(code, exceptBottleId = null) {
  const res = { sent: 0, refused: 0, left: 0 };
  if (sending) return { ...res, left: pendingDrafts(code).length };
  sending = true;
  try {
    for (const id of pendingDrafts(code)) {
      if (id === exceptBottleId) continue;
      const d = readDraft(code, id);
      const body = d && draftPayload(id, d);
      if (!body || (!body.rating && !body.prediction)) {
        deleteDraft(code, id);
        continue;
      }
      try {
        const r = await fetch(`/api/t/${code}/sheet`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', credentials: 'same-origin' });
        if (r.ok) {
          // n'efface que si rien n'a changé pendant l'envoi
          if ((readDraft(code, id)?.at || 0) === d.at) deleteDraft(code, id);
          res.sent++;
        } else if (r.status === 403 || r.status === 404 || r.status === 400) {
          deleteDraft(code, id); // vin révélé, supprimé ou fiche invalide : elle ne partira jamais
          if (r.status === 403) markRefused(code);
          res.refused++;
        } else res.left++;
      } catch {
        res.left++; // toujours pas de réseau
      }
    }
  } finally {
    sending = false;
  }
  return res;
}

/** Soirée effacée : on retire du téléphone tout ce qui la concernait (fiches en attente, compteur). */
export function oublierBrouillons(code) {
  try {
    const p = `dg_${code}_`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(p) || k === `dg-refus_${code}`)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
