// Servidor estático para desenvolvimento (alternativa ao `python -m http.server`).
// Diferença: acrescenta ?v=<última alteração> nos imports, para o navegador nunca usar módulo velho.
// Uso: node tools/servir.mjs [porta]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const raiz = path.resolve(import.meta.dirname, '..');
const porta = +process.argv[2] || 8137;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function ultimaAlteracao(dir) {
  let m = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'tests') continue;
    const p = path.join(dir, e.name);
    m = Math.max(m, e.isDirectory() ? ultimaAlteracao(p) : fs.statSync(p).mtimeMs);
  }
  return m;
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(raiz, p);
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  const ext = path.extname(f);
  const cab = { 'Content-Type': tipos[ext] || 'application/octet-stream', 'Cache-Control': 'no-store, max-age=0' };
  if (ext === '.js' || ext === '.html') {
    // a versão vem do HTML (calculada a cada carregamento) e se propaga a todo o grafo de módulos
    const v = u.searchParams.get('v') || Math.round(ultimaAlteracao(raiz));
    let txt = fs.readFileSync(f, 'utf8');
    if (ext === '.js') txt = txt.replace(/((?:from\s+|import\(\s*)['"])(\.{1,2}\/[^'"?]+?\.js)(['"])/g, `$1$2?v=${v}$3`);
    else txt = txt.replace(/(href|src)="((?:css|js)\/[^"?]+)"/g, `$1="$2?v=${v}"`);
    res.writeHead(200, cab); return res.end(txt);
  }
  res.writeHead(200, cab);
  fs.createReadStream(f).pipe(res);
}).listen(porta, () => console.log(`Atlas Fitness em http://localhost:${porta}`));
