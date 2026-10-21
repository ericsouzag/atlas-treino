// Utilidades de interface: criação de DOM, ícones, formatação, toasts, folhas (dialog) e campos.

/** Cria elementos. h('div', {class:'x', onclick: fn}, 'texto', outroNo) */
export function h(tag, attrs, ...filhos) {
  const el = tag === 'svg' || tag === 'path' || tag === 'circle' || tag === 'rect' || tag === 'line' || tag === 'g' || tag === 'text' || tag === 'polyline' || tag === 'title' || tag === 'defs' || tag === 'pattern' || tag === 'clipPath'
    ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') { for (const [p, val] of Object.entries(v)) { if (p.startsWith('--')) el.style.setProperty(p, val); else el.style[p] = val; } }
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'hidden') { el[k] = v; if (k === 'disabled' || k === 'hidden') el.setAttribute(k, ''); }
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  const add = f => {
    if (f == null || f === false) return;
    if (Array.isArray(f)) f.forEach(add);
    else if (f instanceof Node) el.appendChild(f);
    else el.appendChild(document.createTextNode(String(f)));
  };
  filhos.forEach(add);
  return el;
}

export const limpar = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

// ------------------------------- Ícones (traço 2px, 24x24) --------------------------------
const ICONES = {
  talher: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 12h9|M12 12V4.5A7.5 7.5 0 0 1 19.5 12z',
  halter: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12|M9 9.5h6v5H9z',
  fita: 'M4 17 17 4l3 3L7 20H4zM8 13l2 2M11 10l2 2M14 7l2 2|M4 17l3 3H4z',
  grafico: 'M4 20V4M4 20h16|M7.5 11h3v9h-3zM13 6.5h3V20h-3z',
  engrenagem: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z|M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  mais: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  lapis: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  estrela: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  gota: 'M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.800 6-11 6-11z',
  trocar: 'M7 7h12l-3-3M17 17H5l3 3',
  ok: 'M5 12.5l4.5 4.5L19 7.5',
  esq: 'M15 5l-7 7 7 7',
  dir: 'M9 5l7 7-7 7',
  baixo: 'M5 9l7 7 7-7',
  cima: 'M5 15l7-7 7 7',
  x: 'M6 6l12 12M18 6L6 18',
  baixar: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  subir: 'M12 16V5M7 9l5-5 5 5M5 20h14',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.500v.01',
  alerta: 'M12 4 3 20h18zM12 10v5M12 17.500v.01',
  pessoa: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  nuvem: 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9.500 4 4 0 0 1 17 18z',
  chama: 'M12 3c1 4 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.500 1 2 2 2 0-3-1-5 1-8z',
  repetir: 'M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4',
  play: 'M8 5l11 7-11 7z',
  busca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  imagem: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.500v.01',
  balanca: 'M5 4h14l2 16H3zM9 9a3 3 0 0 1 6 0',
  escudo: 'M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z',
  livro: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
  alvo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12v.01',
  cronometro: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6',
  olho: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
};
export function icone(nome, tam = 22, extra = '') {
  const svg = h('svg', { class: 'ic ' + extra, viewBox: '0 0 24 24', width: tam, height: tam, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' });
  const [tracos, acento] = (ICONES[nome] || '').split('|');
  if (acento) svg.appendChild(h('path', { d: acento, fill: 'currentColor', 'fill-opacity': '.28', stroke: 'none' }));
  svg.appendChild(h('path', { d: tracos || '' }));
  return svg;
}
/** Versão cheia (para favorito marcado) */
export function iconeCheio(nome, tam = 22) {
  const s = icone(nome, tam); s.setAttribute('fill', 'currentColor'); return s;
}

// ------------------------------- Formatação (pt-BR) ---------------------------------------
const nf = (d) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const nfs = [nf(0), nf(1), nf(2)];
export const n0 = x => (x == null || isNaN(x) ? '–' : nfs[0].format(x));
export const n1 = x => (x == null || isNaN(x) ? '–' : nfs[1].format(x));
export const n2 = x => (x == null || isNaN(x) ? '–' : nfs[2].format(x));
export const sinal = (x, d = 1) => (x == null || isNaN(x) ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '') + nf(d).format(Math.abs(x)));
export const kg = (x, d = 1) => (x == null || isNaN(x) ? '–' : nf(d).format(x) + ' kg');
export const pct = (x, d = 1) => (x == null || isNaN(x) ? '–' : nf(d).format(x) + '%');
/** Converte texto digitado ("80,5") em número */
export function lerNumero(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ------------------------------- Toasts ---------------------------------------------------
let regiao;
function garantirRegiao() {
  if (!regiao) {
    regiao = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(regiao);
  }
  return regiao;
}
export function aviso(texto, { acao, aoAcao, duracao = 4500 } = {}) {
  const r = garantirRegiao();
  const t = h('div', { class: 'toast' }, h('span', null, texto),
    acao ? h('button', { class: 'toast-acao', type: 'button', onclick: () => { aoAcao && aoAcao(); t.remove(); } }, acao) : null);
  r.appendChild(t);
  setTimeout(() => t.remove(), duracao);
  return t;
}

// ------------------------------- Folhas (dialog) ------------------------------------------
/**
 * Abre uma folha modal acessível. `montar(fechar)` retorna o conteúdo.
 * Retorna uma Promise resolvida com o valor passado a fechar(valor).
 */
export function folha(titulo, montar, { larga = false, classe = '' } = {}) {
  return new Promise(resolve => {
    const dlg = h('dialog', { class: `folha ${larga ? 'folha-larga' : ''} ${classe}`, 'aria-labelledby': 'folha-t' });
    let resolvido = false;
    const fechar = (v) => { if (resolvido) return; resolvido = true; dlg.close(); resolve(v); };
    const corpo = montar(fechar);
    dlg.append(
      h('header', { class: 'folha-cab' },
        h('h2', { id: 'folha-t' }, titulo),
        h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar(undefined) }, icone('x'))),
      h('div', { class: 'folha-corpo' }, corpo),
    );
    dlg.addEventListener('close', () => { dlg.remove(); if (!resolvido) { resolvido = true; resolve(undefined); } });
    dlg.addEventListener('click', e => { if (e.target === dlg) fechar(undefined); });
    document.body.appendChild(dlg);
    dlg.showModal();
  });
}

export async function confirmar(titulo, texto, { sim = 'Confirmar', nao = 'Cancelar', perigo = false } = {}) {
  const r = await folha(titulo, fechar => h('div', { class: 'pilha' },
    h('p', null, texto),
    h('div', { class: 'linha-botoes' },
      h('button', { class: 'btn', type: 'button', onclick: () => fechar(false) }, nao),
      h('button', { class: `btn ${perigo ? 'btn-perigo' : 'btn-primario'}`, type: 'button', onclick: () => fechar(true) }, sim))));
  return !!r;
}

// ------------------------------- Campos de formulário -------------------------------------
let seq = 0;
/** Campo com rótulo visível e ajuda opcional. `entrada` é um input/select/textarea já criado. */
export function campo(rotulo, entrada, ajuda = null, { classe = '' } = {}) {
  const id = entrada.id || `c${++seq}`;
  entrada.id = id;
  const ajudaEl = ajuda ? h('p', { class: 'ajuda', id: id + '-aj' }, ajuda) : null;
  if (ajudaEl) entrada.setAttribute('aria-describedby', id + '-aj');
  return h('div', { class: `campo ${classe}` }, h('label', { for: id }, rotulo), entrada, ajudaEl);
}
export const entradaNum = (valor, props = {}) => h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', value: valor == null ? '' : String(valor).replace('.', ','), ...props });
export const selecao = (opcoes, valor, props = {}) => {
  const s = h('select', props, opcoes.map(o => {
    const [v, r] = Array.isArray(o) ? o : [o, o];
    return h('option', { value: v, selected: String(v) === String(valor) }, r);
  }));
  s.value = valor ?? '';
  return s;
};

/** Grupo de chips de seleção única ou múltipla. */
export function chips(opcoes, selecionados, aoMudar, { multiplo = false, rotuloGrupo = '' } = {}) {
  let sel = new Set(multiplo ? selecionados : [selecionados]);
  const caixa = h('div', { class: 'chips', role: multiplo ? 'group' : 'radiogroup', 'aria-label': rotuloGrupo });
  const desenhar = () => {
    limpar(caixa);
    opcoes.forEach(o => {
      const [v, r, d] = Array.isArray(o) ? o : [o, o];
      const ativo = sel.has(v);
      caixa.appendChild(h('button', {
        type: 'button', class: `chip ${ativo ? 'ativo' : ''}`, role: multiplo ? 'checkbox' : 'radio', 'aria-checked': String(ativo), title: d || '',
        onclick: () => {
          if (multiplo) { sel.has(v) ? sel.delete(v) : sel.add(v); aoMudar([...sel]); }
          else { sel = new Set([v]); aoMudar(v); }
          desenhar();
        },
      }, r));
    });
  };
  desenhar();
  return caixa;
}

export function caixaAviso(tipo, titulo, texto, extra) {
  return h('div', { class: `aviso aviso-${tipo}`, role: tipo === 'alto' ? 'alert' : 'note' },
    icone(tipo === 'info' ? 'info' : 'alerta', 20),
    h('div', null, titulo ? h('strong', null, titulo) : null, texto ? h('p', null, texto) : null, extra || null));
}

/** Estado vazio útil: diz o que fazer para liberar */
export function vazio(titulo, passos = [], acao) {
  return h('div', { class: 'vazio' },
    h('h3', null, titulo),
    passos.length ? h('ul', null, passos.map(p => h('li', null, p))) : null,
    acao || null);
}

export function debounce(fn, ms = 250) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export const semAcento = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
