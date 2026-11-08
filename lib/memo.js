// Mémoire locale du téléphone : les soirées déjà rejointes (participant) ou organisées,
// pour y revenir sans retaper le code. Rien de secret ici : seulement le code, le nom de la
// soirée et le prénom. Le stockage peut être indisponible (navigation privée) : tout est protégé.
const KEY = 'confrerie:soirees';

export function recentSoirees() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => x && typeof x.code === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberSoiree({ code, name, who, role = 'participant' }) {
  try {
    const list = recentSoirees().filter((x) => !(x.code === code && x.role === role));
    list.unshift({ code, name: String(name || '').slice(0, 80), who: who ? String(who).slice(0, 40) : null, role, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6)));
  } catch {}
}

export function forgetSoiree(code) {
  try {
    localStorage.setItem(KEY, JSON.stringify(recentSoirees().filter((x) => x.code !== code)));
  } catch {}
}
