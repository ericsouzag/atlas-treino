// Gera os ícones PNG do app (sem dependências): bandeja de marmita com 4 compartimentos sobre fundo tomate.
// Uso: node tools/gerar-icones.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const TOMATE = hex('#C23A1E'), ALUM = hex('#E6E9E3'), SOMBRA = hex('#B9BFB4');
const CORES = [hex('#F4B3A2'), hex('#E7A6B2'), hex('#F4D27C'), hex('#CAD582')];

// retângulo arredondado: dentro? (coordenadas normalizadas 0..1)
const dentro = (x, y, r) => {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const dx = Math.abs(x - cx) - (r.w / 2 - r.r), dy = Math.abs(y - cy) - (r.h / 2 - r.r);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) <= r.r;
};

function camadas(maskable) {
  const e = maskable ? 0.54 : 0.64;           // largura da bandeja
  const w = e, h = e * 0.74, x = 0.5 - w / 2, y = 0.5 - h / 2 + 0.01;
  const g = w * 0.035, pad = w * 0.06;
  const iw = w - 2 * pad - g, ih = h - 2 * pad - 2 * g;
  const esq = { x: x + pad, y: y + pad, w: iw * 0.54, h: h - 2 * pad, r: w * 0.07 };
  const dw = iw * 0.46, dh = ih / 3;
  const dir = [0, 1, 2].map(i => ({ x: x + pad + esq.w + g, y: y + pad + i * (dh + g), w: dw, h: dh, r: w * 0.05 }));
  return {
    fundo: maskable ? null : { x: 0, y: 0, w: 1, h: 1, r: 0.22 },
    sombra: { x, y: y + h * 0.04, w, h, r: w * 0.14 },
    bandeja: { x, y, w, h, r: w * 0.14 },
    comps: [esq, ...dir],
  };
}

function render(tam, maskable) {
  const c = camadas(maskable), SS = 3, px = Buffer.alloc(tam * tam * 4);
  for (let j = 0; j < tam; j++) for (let i = 0; i < tam; i++) {
    let acc = [0, 0, 0, 0];
    for (let sj = 0; sj < SS; sj++) for (let si = 0; si < SS; si++) {
      const x = (i + (si + 0.5) / SS) / tam, y = (j + (sj + 0.5) / SS) / tam;
      let col = null;
      if (maskable || dentro(x, y, c.fundo)) col = TOMATE;
      if (col) {
        if (dentro(x, y, c.sombra)) col = SOMBRA;
        if (dentro(x, y, c.bandeja)) col = ALUM;
        c.comps.forEach((r, k) => { if (dentro(x, y, r)) col = CORES[k]; });
        // nível preenchido (marmita se enchendo) no compartimento grande
        const g = c.comps[0];
        if (dentro(x, y, g) && y > g.y + g.h * 0.38) col = TOMATE.map((v, n) => Math.round(v * 0.55 + CORES[0][n] * 0.45));
      }
      if (col) { acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255; }
    }
    const n = SS * SS, a = acc[3] / n, o = (j * tam + i) * 4;
    if (acc[3] > 0) { const k = acc[3] / 255; px[o] = acc[0] / k; px[o + 1] = acc[1] / k; px[o + 2] = acc[2] / k; px[o + 3] = a; }
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
console.log('Ícones gerados em app/icons/');
