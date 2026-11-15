'use client';

import Link from 'next/link';
import { bilanSoiree } from '@/lib/bilan';

const pct = (x) => `${String(Math.round(x * 1000) / 10).replace('.', ',')} %`;
const rangTxt = (r) => (r === 1 ? '1er' : `${r}e`);

/** Bilan d'un dégustateur : réussite par critère face à la table, réussites, points à travailler, conseils. */
export function CarteBilan({ b, moi = false }) {
  if (!b) return null;
  return (
    <div className="bilan stack">
      <p className="bilan-tete">
        {b.rang ? (
          <>
            <strong>{rangTxt(b.rang)}</strong> sur {b.classes} ·{' '}
          </>
        ) : null}
        <strong>{String(b.note).replace('.', ',')}/20</strong> · {String(b.points).replace('.', ',')} points sur {b.max}
      </p>

      <div className="bilan-criteres" role="table" aria-label="Réussite par critère, comparée à la moyenne de la table">
        {b.criteres.map((c) => (
          <div key={c.id} className="bilan-critere" role="row">
            <span role="cell">{c.nom}</span>
            <span className="bilan-jauge" role="cell" aria-label={`${pct(c.pct)}, moyenne de la table ${pct(c.moyenne)}`}>
              <span className={`bilan-barre ${c.ecart >= 0 ? 'plus' : 'moins'}`} style={{ width: `${Math.max(2, c.pct * 100)}%` }} />
              <span className="bilan-moyenne" style={{ left: `${c.moyenne * 100}%` }} title="Moyenne de la table" />
            </span>
            <strong role="cell">{pct(c.pct)}</strong>
          </div>
        ))}
        <p className="tiny muted" style={{ margin: 0 }}>
          Le trait vertical marque la moyenne de la table.
        </p>
      </div>

      {b.reussites.length > 0 && (
        <div>
          <h3 className="bilan-titre">Ce qui a bien marché</h3>
          <ul className="bilan-liste ok">
            {b.reussites.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      {b.travail.length > 0 && (
        <div>
          <h3 className="bilan-titre">{moi ? 'Ce que je peux encore travailler' : 'Ce qu’il peut encore travailler'}</h3>
          <ul className="bilan-liste travail">
            {b.travail.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      {b.conseils.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          <h3 className="bilan-titre">{moi ? 'Mes conseils pour la prochaine soirée' : 'Conseils pour la prochaine soirée'}</h3>
          {b.conseils.map((c) => (
            <div key={c.cle} className="bilan-conseil">
              <strong>{c.titre}</strong>
              <span>{c.texte}</span>
              <Link href={c.lien} className="tiny">
                Relire dans le guide de la dégustation
              </Link>
            </div>
          ))}
        </div>
      )}
      {!b.travail.length && !b.conseils.length && <p className="small">Une soirée sans point faible : continuez comme ça.</p>}
    </div>
  );
}

/** Encadré « Mon bilan de la soirée », sur la page des résultats du participant. */
export function MonBilan({ data }) {
  if (!data?.me) return null;
  const me = data.tasters?.find((t) => t.id === data.me.id);
  if (!me || !me.answered) return null;
  const aNoter = (data.wines || []).filter((w) => w.owner !== me.name);
  const mesNotes = aNoter.filter((w) => w.myNote !== null && w.myNote !== undefined).length;
  const b = bilanSoiree(data, me.id, { mesNotes });
  if (!b) return null;
  return (
    <section className="panel stack bilan-panel" aria-labelledby="bilan-titre">
      <h2 id="bilan-titre">Mon bilan de la soirée</h2>
      <CarteBilan b={b} moi />
    </section>
  );
}
