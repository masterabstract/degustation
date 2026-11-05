import { db } from '@/lib/db';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

// Page de contrôle après la mise en ligne : /api/sante
// Indique si la configuration et la base de données répondent, sans rien révéler.
export async function GET() {
  const checks = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
    ORGANIZER_PASSWORD: !!process.env.ORGANIZER_PASSWORD,
  };
  const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (missing.includes('SUPABASE_URL') || missing.includes('SUPABASE_SECRET_KEY')) {
    return json({ ok: false, message: `Variable(s) manquante(s) sur Vercel : ${missing.join(', ')}` }, 500);
  }
  const { error } = await db().from('tastings').select('id', { count: 'exact', head: true });
  if (error) {
    return json({ ok: false, message: 'La base Supabase ne répond pas correctement. Vérifiez l’adresse, la clé secrète et que le script SQL a bien été exécuté.', detail: error.message || error.code }, 500);
  }
  const photo = process.env.ANTHROPIC_API_KEY ? 'activée' : 'désactivée (ANTHROPIC_API_KEY absente, saisie manuelle uniquement)';
  return json({
    ok: true,
    message: missing.length ? 'Base de données connectée. Attention : ORGANIZER_PASSWORD n’est pas défini.' : 'Tout fonctionne : base de données connectée et configuration complète.',
    photo: `Lecture des étiquettes par photo : ${photo}.`,
  });
}
