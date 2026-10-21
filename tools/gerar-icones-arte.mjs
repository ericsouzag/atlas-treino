// Gera os ícones PNG do app a partir da arte oficial (tools/arte/icone-original.png: halter + A).
// Recolore: fundo verde militar, símbolo gelo (usa a luminosidade da arte como máscara, mantendo o serrilhado suave).
// Sem dependências. Uso: node tools/gerar-icones-arte.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const FUNDO = hex('#4B5320'); // verde militar
const SIMBOLO = hex('#E8EEF0'); // gelo

// ---- leitura do PNG (8 bits, RGB ou RGBA, sem entrelaçamento) ----
function lerPng(buf) {
  let p = 8, w, h, tipo; const dados = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); tipo = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('PNG não suportado'); }
    if (t === 'IDAT') dados.push(d);
    p += 12 + len;
  }
  const bpp = tipo === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(dados)), stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      let r;
      if (f === 0) r = v; else if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1);
      else { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      out[y * stride + x] = r & 255;
    }
  }
  // máscara 0..1: 0 = fundo escuro da arte, 1 = símbolo claro
  const lum = i => 0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2];
  const lumFundo = lum(0), lumSimb = lum((Math.floor(h / 2) * w + Math.floor(w * 0.5)) * bpp) ; // ponto de referência provisório
  let max = 0; for (let i = 0; i < w * h; i++) max = Math.max(max, lum(i * bpp));
  const m = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = Math.min(1, Math.max(0, (lum(i * bpp) - lumFundo) / (max - lumFundo)));
  return { w, h, m };
}

const dentroArredondado = (x, y, r) => { const dx = Math.abs(x - 0.5) - (0.5 - r), dy = Math.abs(y - 0.5) - (0.5 - r); return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) <= r; };

function render(arte, tam, { escala, arredondado }) {
  const SS = 3, px = Buffer.alloc(tam * tam * 4);
  for (let j = 0; j < tam; j++) for (let i = 0; i < tam; i++) {
    let rr = 0, gg = 0, bb = 0, aa = 0;
    for (let sj = 0; sj < SS; sj++) for (let si = 0; si < SS; si++) {
      const x = (i + (si + 0.5) / SS) / tam, y = (j + (sj + 0.5) / SS) / tam;
      if (arredondado && !dentroArredondado(x, y, 0.22)) continue;
      // posição na arte (escala em torno do centro)
      const u = (x - 0.5) / escala + 0.5, v = (y - 0.5) / escala + 0.5;
      let t = 0;
      if (u >= 0 && u < 1 && v >= 0 && v < 1) {
        // média de bloco para reduzir bem (arte 1024 -> tamanho pequeno)
        const fx = u * arte.w, fy = v * arte.h, bloco = Math.max(1, Math.floor(arte.w / tam / escala / 2));
        let s = 0, n = 0;
        for (let dy = -bloco; dy <= bloco; dy++) for (let dx = -bloco; dx <= bloco; dx++) {
          const xx = Math.min(arte.w - 1, Math.max(0, Math.floor(fx + dx))), yy = Math.min(arte.h - 1, Math.max(0, Math.floor(fy + dy)));
          s += arte.m[yy * arte.w + xx]; n++;
        }
        t = s / n;
      }
      rr += FUNDO[0] + (SIMBOLO[0] - FUNDO[0]) * t; gg += FUNDO[1] + (SIMBOLO[1] - FUNDO[1]) * t; bb += FUNDO[2] + (SIMBOLO[2] - FUNDO[2]) * t; aa += 1;
    }
    const o = (j * tam + i) * 4;
    if (aa) { px[o] = rr / aa; px[o + 1] = gg / aa; px[o + 2] = bb / aa; px[o + 3] = 255 * aa / (SS * SS); }
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

const arte = lerPng(fs.readFileSync(new URL('./arte/icone-original.png', import.meta.url)));
fs.mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });
const saida = (nome, buf) => fs.writeFileSync(new URL('../icons/' + nome, import.meta.url), buf);
// "any": cantos arredondados, símbolo um pouco maior; maskable/apple: sangria total, símbolo dentro da zona segura (80%)
saida('icon-192.png', render(arte, 192, { escala: 1.15, arredondado: true }));
saida('icon-512.png', render(arte, 512, { escala: 1.15, arredondado: true }));
saida('icon-maskable-512.png', render(arte, 512, { escala: 1.1, arredondado: false }));
saida('apple-touch-icon.png', render(arte, 180, { escala: 1.1, arredondado: false }));
saida('favicon-32.png', render(arte, 32, { escala: 1.25, arredondado: true }));
saida('icon-48-teste.png', render(arte, 48, { escala: 1.15, arredondado: true }));
console.log('Ícones gerados em app/icons/ a partir de tools/arte/icone-original.png');
