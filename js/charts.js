// Gráficos próprios em SVG (sem dependências). Acessíveis (role=img + título + tabela opcional).
import { h, limpar } from './ui.js';
import { dataCurta } from './datas.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  filhos.forEach(f => f != null && e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f));
  return e;
};

/** Escala "bonita" (valores redondos) para o eixo Y */
export function escalaBonita(min, max, n = 4) {
  if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 1, passo: 0.25, ticks: [0, 1] };
  if (min === max) { min -= 1; max += 1; }
  const bruto = (max - min) / n;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / mag;
  const passo = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / passo) * passo, hi = Math.ceil(max / passo) * passo;
  const ticks = [];
  for (let v = lo; v <= hi + passo / 2; v += passo) ticks.push(+v.toFixed(10));
  return { min: lo, max: hi, passo, ticks };
}

const pad = { t: 12, r: 12, b: 26, l: 42 };

/**
 * Gráfico de linhas.
 * opts: { largura, altura, titulo, series:[{nome, classe, pts:[{x(dias ou ISO), y}], tracejado, pontos}], banda:{pts:[{x,lo,hi}], classe}, formatoY, metaY:{valor,rotulo}, ySemZero }
 * x pode ser string ISO (AAAA-MM-DD) ou número (semana).
 */
export function graficoLinhas(o) {
  const W = o.largura || 340, H = o.altura || 200;
  const pts = o.series.flatMap(s => s.pts);
  const xs = pts.map(p => xNum(p.x)).concat(o.banda ? o.banda.pts.map(p => xNum(p.x)) : []);
  const ys = pts.map(p => p.y).concat(o.banda ? o.banda.pts.flatMap(p => [p.lo, p.hi]) : []).concat(o.metaY ? [o.metaY.valor] : []);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': o.titulo, class: 'grafico' });
  svg.appendChild(el('title', {}, o.titulo));
  if (!pts.length) return svg;
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x0 === x1) { x0 -= 1; x1 += 1; }
  const esc = escalaBonita(Math.min(...ys), Math.max(...ys), 4);
  const X = v => pad.l + ((xNum(v) - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const Y = v => H - pad.b - ((v - esc.min) / (esc.max - esc.min)) * (H - pad.t - pad.b);
  const fy = o.formatoY || (v => String(v));
  // grade e rótulos Y
  esc.ticks.forEach(t => {
    svg.appendChild(el('line', { x1: pad.l, x2: W - pad.r, y1: Y(t), y2: Y(t), class: 'ch-grade' }));
    svg.appendChild(el('text', { x: pad.l - 6, y: Y(t) + 4, class: 'ch-txt', 'text-anchor': 'end' }, fy(t)));
  });
  // rótulos X
  const nT = Math.min(5, Math.max(2, Math.floor((W - pad.l - pad.r) / 70)));
  for (let i = 0; i < nT; i++) {
    const v = x0 + ((x1 - x0) * i) / (nT - 1);
    svg.appendChild(el('text', { x: X(v), y: H - 7, class: 'ch-txt', 'text-anchor': i === 0 ? 'start' : i === nT - 1 ? 'end' : 'middle' }, rotuloX(v, o.xTipo || (typeof pts[0].x === 'string' ? 'data' : 'num'), o.rotuloXNum)));
  }
  if (o.metaY) {
    svg.appendChild(el('line', { x1: pad.l, x2: W - pad.r, y1: Y(o.metaY.valor), y2: Y(o.metaY.valor), class: 'ch-meta' }));
    svg.appendChild(el('text', { x: W - pad.r, y: Y(o.metaY.valor) - 4, class: 'ch-txt ch-txt-meta', 'text-anchor': 'end' }, o.metaY.rotulo));
  }
  if (o.banda && o.banda.pts.length > 1) {
    const sup = o.banda.pts.map(p => `${X(p.x)},${Y(p.hi)}`);
    const inf = [...o.banda.pts].reverse().map(p => `${X(p.x)},${Y(p.lo)}`);
    svg.appendChild(el('polygon', { points: [...sup, ...inf].join(' '), class: 'ch-banda ' + (o.banda.classe || '') }));
  }
  o.series.forEach(s => {
    if (s.pts.length > 1) svg.appendChild(el('polyline', { points: s.pts.map(p => `${X(p.x)},${Y(p.y)}`).join(' '), class: `ch-linha ${s.classe || ''} ${s.tracejado ? 'ch-tracejado' : ''}`, fill: 'none' }));
    if (s.pontos !== false) s.pts.forEach(p => svg.appendChild(el('circle', { cx: X(p.x), cy: Y(p.y), r: s.pts.length > 40 ? 2 : 3.5, class: `ch-ponto ${s.classe || ''}` }, el('title', {}, `${s.nome}: ${fy(p.y)} (${rotuloX(xNum(p.x), typeof p.x === 'string' ? 'data' : 'num', o.rotuloXNum)})`))));
  });
  return svg;
}

const xNum = x => { if (typeof x !== 'string') return x; const [y, m, d] = x.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
function rotuloX(v, tipo, fnNum) {
  if (tipo === 'data') return dataCurta(new Date(Math.round(v) * 864e5).toISOString().slice(0, 10));
  return fnNum ? fnNum(v) : String(Math.round(v));
}

/**
 * Barras (opcionalmente empilhadas).
 * opts: { largura, altura, titulo, categorias:[{rotulo, partes:[{v, classe, nome}]}], formatoY, metaY:{valor,rotulo}, mostrarRotulos }
 */
export function graficoBarras(o) {
  const W = o.largura || 340, H = o.altura || 190;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': o.titulo, class: 'grafico' });
  svg.appendChild(el('title', {}, o.titulo));
  const cats = o.categorias;
  if (!cats.length) return svg;
  const totais = cats.map(c => c.partes.reduce((s, p) => s + Math.max(0, p.v), 0));
  const maxV = Math.max(...totais, o.metaY ? o.metaY.valor : 0);
  const esc = escalaBonita(0, maxV, 4);
  const fy = o.formatoY || (v => String(v));
  const Y = v => H - pad.b - (v / esc.max) * (H - pad.t - pad.b);
  esc.ticks.forEach(t => {
    svg.appendChild(el('line', { x1: pad.l, x2: W - pad.r, y1: Y(t), y2: Y(t), class: 'ch-grade' }));
    svg.appendChild(el('text', { x: pad.l - 6, y: Y(t) + 4, class: 'ch-txt', 'text-anchor': 'end' }, fy(t)));
  });
  const area = W - pad.l - pad.r, larg = area / cats.length, bw = Math.max(3, Math.min(34, larg * 0.7));
  const cada = Math.max(1, Math.ceil(cats.length / Math.floor(area / 38)));
  cats.forEach((c, i) => {
    const cx = pad.l + larg * i + larg / 2;
    let acc = 0;
    c.partes.forEach(p => {
      if (p.v <= 0) return;
      const y1 = Y(acc + p.v), y0 = Y(acc);
      svg.appendChild(el('rect', { x: cx - bw / 2, y: y1, width: bw, height: Math.max(0.5, y0 - y1), class: `ch-barra ${p.classe || ''}`, rx: 2 }, el('title', {}, `${c.rotulo} · ${p.nome || ''} ${fy(p.v)}`)));
      acc += p.v;
    });
    if (i % cada === 0) svg.appendChild(el('text', { x: cx, y: H - 7, class: 'ch-txt', 'text-anchor': 'middle' }, c.rotulo));
  });
  if (o.metaY) {
    svg.appendChild(el('line', { x1: pad.l, x2: W - pad.r, y1: Y(o.metaY.valor), y2: Y(o.metaY.valor), class: 'ch-meta' }));
    svg.appendChild(el('text', { x: W - pad.r, y: Y(o.metaY.valor) - 4, class: 'ch-txt ch-txt-meta', 'text-anchor': 'end' }, o.metaY.rotulo));
  }
  return svg;
}

/** Legenda simples */
export function legenda(itens) {
  return h('ul', { class: 'legenda' }, itens.map(i => h('li', null, h('span', { class: `leg-chave ${i.classe}`, 'aria-hidden': 'true' }), i.nome)));
}

/** Tabela alternativa (acessibilidade) dentro de <details> */
export function tabelaDados(titulo, colunas, linhas) {
  return h('details', { class: 'dados-tabela' },
    h('summary', null, 'Ver dados em tabela'),
    h('table', null, h('caption', { class: 'so-leitor' }, titulo),
      h('thead', null, h('tr', null, colunas.map(c => h('th', { scope: 'col' }, c)))),
      h('tbody', null, linhas.map(l => h('tr', null, l.map(c => h('td', null, c)))))));
}

/** Renderiza no container e re-renderiza quando a largura muda */
export function graficoResponsivo(container, fabrica) {
  let ult = 0;
  const desenhar = () => {
    const w = Math.max(260, Math.min(760, Math.floor(container.clientWidth || 340)));
    if (w === ult) return; ult = w;
    limpar(container); container.appendChild(fabrica(w));
  };
  container.classList.add('grafico-cx');
  desenhar();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => requestAnimationFrame(desenhar)).observe(container);
  return container;
}
