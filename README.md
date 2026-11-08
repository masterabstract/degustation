# La Confrérie du Pif · dégustations à l’aveugle

Site web pour organiser une dégustation de vin à l'aveugle : fiches de dégustation sur téléphone, pronostics, révélation finale et classements.

**Pour mettre le site en ligne, ouvrez le fichier `GUIDE-MISE-EN-LIGNE.html`** (double-clic : il s'ouvre dans votre navigateur). Tout y est expliqué pas à pas.

## Technique

- Next.js 16 (React 19), hébergé sur Vercel.
- Supabase (PostgreSQL) pour la base de données.
- Les téléphones ne parlent jamais directement à Supabase : toutes les données passent par le serveur du site, qui garde la clé secrète. Les tables sont verrouillées (RLS sans règle publique, droits retirés aux rôles publics).
- Chaque participant saisit ses propres bouteilles : avant la révélation, personne d'autre (organisateur compris) n'en reçoit le contenu ni le propriétaire.
- Synchronisation entre téléphones : actualisation automatique toutes les 4 à 6 secondes.

## Variables d'environnement (Vercel)

| Nom | Valeur |
| --- | --- |
| `SUPABASE_URL` | adresse du projet, `https://xxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | clé secrète Supabase (`sb_secret_...`) |
| `ORGANIZER_PASSWORD` | mot de passe obligatoire pour créer une soirée ou effacer des archives (sans lui, la création est bloquée en ligne) |
| `ANTHROPIC_API_KEY` | facultatif : active la lecture des étiquettes en photo (API Claude) |
| `ANTHROPIC_MODEL` | facultatif : modèle utilisé, `claude-sonnet-5-5` par défaut |

## Fichiers importants

- `supabase/schema.sql` : création des tables et des règles de sécurité (à coller dans Supabase).
- `lib/bareme.js` : barème unique (20 points vin français, 23 points vin étranger), identique pour tous et reproductible.
- `lib/scoring.js` : moyennes, classements et résumé.
- `lib/vins/` : base des vins préchargée (1 009 appellations dont 68 IGP et les vins sans appellation comme Vin de France, 150 régions, 546 cépages, classés par pays).
- `lib/constants.js` : listes de choix (robes, roue des arômes : 22 familles et 147 arômes, pays).
- `app/api/` : toutes les routes serveur (aucune information secrète n'en sort avant la révélation).
- `/api/sante` : page de contrôle après la mise en ligne.

## Sources des cartes (public/cartes)

- France : INAO, délimitation parcellaire des AOC viticoles (Licence Ouverte 2.0).
- Union européenne : Candiago et al. (2022), inventaire géographique des AOP viticoles européennes (CC BY 4.0).
- États-Unis : AVA, UC Davis (CC0). Australie : Wine Australia (CC BY 4.0). Suisse : OFS / swisstopo. Autres pays : geoBoundaries.
- Contours généralisés repris d'Open Wine Atlas (code MIT), regroupés par région viticole ; limites des pays et provinces : Natural Earth (domaine public).
- Rattachement des appellations aux régions officielles : INAO (France), IVV (Portugal), Österreich Wein (Autriche), Swiss Wine (Suisse), Wines of Hungary (6 borrégió), Vina Croatia (4 régions), registre européen des AOP. Les appellations « parapluie » couvrant une province entière (Niederösterreich, Duna, Cava…) ne sont pas dessinées ; une aire mal géocodée dans la source (Valdeorras) est écartée.
