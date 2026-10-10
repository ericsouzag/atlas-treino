// Utilitários de texto em português: normalização, singular, distância de edição.

/** minúsculas, sem acentos, sem pontuação supérflua, espaços colapsados */
export function normalizar(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9/.,+% ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Singulariza uma palavra (heurística simples para o vocabulário de comida) */
export function singular(w) {
  if (w.length <= 3) return w;
  if (w.endsWith('oes')) return w.slice(0, -3) + 'ao';
  if (w.endsWith('aes')) return w.slice(0, -3) + 'ao';
  if (w.endsWith('ais')) return w.slice(0, -2) + 'l';
  if (w.endsWith('eis')) return w.slice(0, -2) + 'l';
  if (w.endsWith('ns')) return w.slice(0, -2) + 'm';
  if (w.endsWith('res') || w.endsWith('zes')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/** Tokens normalizados e singularizados */
export function tokens(s) {
  return normalizar(s).split(' ').filter(Boolean).map(singular);
}

/** Distância de Levenshtein (com corte) */
export function levenshtein(a, b, max = 3) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let minRow = i;
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
      if (cur[j] < minRow) minRow = cur[j];
    }
    if (minRow > max) return max + 1;
    prev = cur;
  }
  return prev[n];
}

export const arred = (x, d = 0) => {
  const f = 10 ** d;
  return Math.round((x + Number.EPSILON) * f) / f;
};
