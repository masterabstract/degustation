# Dégustation à l'aveugle

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
| `ORGANIZER_PASSWORD` | mot de passe exigé pour créer une soirée |
| `ANTHROPIC_API_KEY` | facultatif : active la lecture des étiquettes en photo (API Claude) |
| `ANTHROPIC_MODEL` | facultatif : modèle utilisé, `claude-sonnet-5-5` par défaut |

## Fichiers importants

- `supabase/schema.sql` : création des tables et des règles de sécurité (à coller dans Supabase).
- `lib/scoring.js` : calcul des moyennes, du barème des pronostics et du résumé.
- `lib/constants.js` : listes de choix (robes, arômes, régions, gammes de prix, barème).
- `app/api/` : toutes les routes serveur (aucune information secrète n'en sort avant la révélation).
- `/api/sante` : page de contrôle après la mise en ligne.
