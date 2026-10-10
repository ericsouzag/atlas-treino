// Mini-framework de testes (sem dependências)
let falhas = 0, total = 0;
export function teste(nome, fn) {
  total++;
  try { fn(); console.log('  ok  ' + nome); }
  catch (e) { falhas++; console.log('  FALHA ' + nome + '\n        ' + (e && e.message)); }
}
export function igual(a, b, msg = '') { if (a !== b) throw new Error(`${msg} esperado ${JSON.stringify(b)} mas veio ${JSON.stringify(a)}`); }
export function perto(a, b, tol, msg = '') { if (!(Math.abs(a - b) <= tol)) throw new Error(`${msg} esperado ~${b} (±${tol}) mas veio ${a}`); }
export function ok(c, msg = 'condição falsa') { if (!c) throw new Error(msg); }
export function fim() { console.log(`\n${total - falhas}/${total} testes passaram`); if (falhas) process.exit(1); }
