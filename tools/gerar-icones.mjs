// Gera os ícones PNG do app (sem dependências): quatro ladrilhos com quarto de círculo formando uma roseta, sobre verde militar (paleta Campanha; ícone provisório).
// Sem texto, legível em 48 px. Uso: node tools/gerar-icones.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const FUNDO = hex('#4B5320');   // verde militar
// [cor do ladrilho, cor do quarto de círculo, canto do círculo]
const LADRILHOS = [
  [hex('#E8EEF0'), hex('#4B5320'), 'tl'],
  [hex('#D9772B'), hex('#F6D2B0'), 'tr'],
  [hex('#A3B86A'), hex('#3A4118'), 'bl'],
  [hex('#C2CCCB'), hex('#4B5320'), 'br'],
];

// retângulo com cantos arredondados (coordenadas normalizadas)
const dentro = (x, y, r) => {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const dx = Math.abs(x - cx) - (r.w / 2 - r.r), dy = Math.abs(y - cy) - (r.h / 2 - r.r);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) <= r.r;
};

function layout(maskable) {
  const e = maskable ? 0.54 : 0.66;            // lado do conjunto (maskable respeita a zona segura de 80%)
  const g = e * 0.07, m = (e - g) / 2, x0 = 0.5 - e / 2, y0 = 0.5 - e / 2;
  const mods = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => ({ x: x0 + i * (m + g), y: y0 + j * (m + g), w: m, h: m, r: m * 0.1 }));
  return { fundo: maskable ? null : { x: 0, y: 0, w: 1, h: 1, r: 0.22 }, mods, raio: m * 0.78 };
}

function render(tam, maskable) {
  const L = layout(maskable), SS = 3, px = Buffer.alloc(tam * tam * 4);
  for (let j = 0; j < tam; j++) for (let i = 0; i < tam; i++) {
    let acc = [0, 0, 0, 0];
    for (let sj = 0; sj < SS; sj++) for (let si = 0; si < SS; si++) {
      const x = (i + (si + 0.5) / SS) / tam, y = (j + (sj + 0.5) / SS) / tam;
      let col = null;
      if (maskable || dentro(x, y, L.fundo)) col = FUNDO;
      if (col) L.mods.forEach((r, k) => {
        if (!dentro(x, y, r)) return;
        const [cor, quarto, canto] = LADRILHOS[k];
        col = cor;
        const cx = canto.includes('l') ? r.x : r.x + r.w, cy = canto.includes('t') ? r.y : r.y + r.h;
        if (Math.hypot(x - cx, y - cy) <= L.raio) col = quarto;
      });
      if (col) { acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255; }
    }
    const n = SS * SS, o = (j * tam + i) * 4;
    if (acc[3] > 0) { const k = acc[3] / 255; px[o] = acc[0] / k; px[o + 1] = acc[1] / k; px[o + 2] = acc[2] / k; px[o + 3] = acc[3] / n; }
  }
  return png(tam, px);
}

const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(tipo, dados) {
  const l = Buffer.alloc(4); l.writeUInt32BE(dados.length);
  const td = Buffer.concat([Buffer.from(tipo), dados]);
  const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td));
  return Buffer.concat([l, td, cr]);
}
function png(tam, rgba) {
  const raw = Buffer.alloc((tam * 4 + 1) * tam);
  for (let j = 0; j < tam; j++) { raw[j * (tam * 4 + 1)] = 0; rgba.copy(raw, j * (tam * 4 + 1) + 1, j * tam * 4, (j + 1) * tam * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(tam, 0); ihdr.writeUInt32BE(tam, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });
const saida = (nome, buf) => fs.writeFileSync(new URL('../icons/' + nome, import.meta.url), buf);
saida('icon-192.png', render(192, false));
saida('icon-512.png', render(512, false));
saida('icon-maskable-512.png', render(512, true));
saida('apple-touch-icon.png', render(180, true));
saida('favicon-32.png', render(32, false));
saida('icon-48-teste.png', render(48, false));
console.log('Ícones gerados em app/icons/');
