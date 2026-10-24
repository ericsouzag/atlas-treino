// Roda todos os testes: node tests/rodar.mjs
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const dir = import.meta.dirname;
let falhou = false;
for (const f of ['parser', 'nutrition', 'composition', 'planner', 'store', 'atividades', 'catalogo', 'ilustracoes', 'entrada', 'fichas', 'alimentos', 'nova', 'grupos']) {
  console.log(`\n=== ${f} ===`);
  const r = spawnSync(process.execPath, [path.join(dir, `${f}.test.mjs`)], { stdio: 'inherit' });
  if (r.status !== 0) falhou = true;
}
console.log(falhou ? '\nHÁ TESTES FALHANDO' : '\nTodos os testes passaram.');
process.exit(falhou ? 1 : 0);
