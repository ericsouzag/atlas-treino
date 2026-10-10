// Atualiza a lista de arquivos pré-carregados em sw.js e muda a versão do cache.
// Uso: node tools/gerar-sw.mjs [nova-versao]
import fs from 'node:fs';
import path from 'node:path';
const raiz = path.resolve(import.meta.dirname, '..');
const pastas = ['css', 'js', 'fonts', 'icons'];
const lista = ['index.html', 'manifest.webmanifest', 'firebase-config.js'];
const varre = d => fs.readdirSync(path.join(raiz, d), { withFileTypes: true }).forEach(e => { const rel = path.posix.join(d, e.name); e.isDirectory() ? varre(rel) : lista.push(rel); });
pastas.forEach(varre);
lista.sort();
let sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
const versao = process.argv[2] || sw.match(/VERSAO = '([^']+)'/)[1];
sw = sw.replace(/const ARQUIVOS = \[[\s\S]*?\n\];/, `const ARQUIVOS = [\n  './',\n${lista.map(f => `  './${f}',`).join('\n')}\n];`).replace(/VERSAO = '[^']+'/, `VERSAO = '${versao}'`);
fs.writeFileSync(path.join(raiz, 'sw.js'), sw);
console.log(`sw.js atualizado: ${lista.length} arquivos, versão ${versao}`);
