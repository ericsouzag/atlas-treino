// Renderização do personagem em SVG (ilustração própria, parametrizada, sem imagens externas; funciona offline).
// Função pura: recebe o personagem (nome, pele, cabelo, rosto, roupa, silhueta), o corpo efetivo (0,15 a 0,85) e o nível, e devolve uma string SVG.
// Estilo: formas simples e acolhedoras, na paleta Campanha. Acessórios e moldura vêm do nível. Testes em tests/personagem.test.mjs.
import { lerPersonagem, PADRAO_CORPO, limitar } from './personagem.js';
import { acessoriosLiberados, molduraDoNivel } from './gamificacao.js';

export const PELES = ['#F6D5BD', '#EFC09E', '#D9A074', '#B97B50', '#8A5634', '#5E3A22'];
export const NOMES_PELE = ['Muito clara', 'Clara', 'Morena clara', 'Morena', 'Escura', 'Muito escura'];
export const CORES_CABELO = ['#1C1A17', '#3B2A1E', '#6B4A2B', '#A67C3A', '#C9C9C4', '#7A2E22'];
export const NOMES_CABELO = ['Preto', 'Castanho escuro', 'Castanho', 'Loiro escuro', 'Grisalho', 'Ruivo'];
export const ESTILOS_CABELO = [['curto', 'Curto'], ['medio', 'Médio'], ['longo', 'Longo'], ['coque', 'Coque'], ['cacheado', 'Cacheado'], ['raspado', 'Raspado']];
export const EXPRESSOES = [['sorriso', 'Sorriso'], ['alegre', 'Alegre'], ['neutra', 'Tranquila'], ['determinada', 'Determinada']];
export const CAMISAS = { verde: '#4B5320', oliva: '#7E9140', gelo: '#C2CCCB', areia: '#B9A57A', azul: '#3F7FA3', laranja: '#D9772B' };
export const CALCAS = { escuro: '#1F2819', cinza: '#566355', areia: '#8B7B55', azul: '#2D4B63' };
const MOLDURAS = [null, '#8A9F55', '#C2CCCB', '#B7C97E', '#E8EEF0'];
const BASE = { masc: { sw: 34, ww: 27, hw: 28 }, fem: { sw: 28, ww: 22, hw: 32 }, neutro: { sw: 31, ww: 25, hw: 30 } };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f = n => Math.round(n * 10) / 10;

/** Medidas do desenho (em unidades do viewBox) a partir do corpo; exposta para teste */
export function geometria(corpoIn, silhueta = 'neutro') {
  const c = { ...PADRAO_CORPO, ...(corpoIn || {}) }; for (const k of Object.keys(c)) c[k] = limitar(c[k]);
  const b = BASE[silhueta] || BASE.neutro, s = 0.9 + 0.2 * c.altura;
  return {
    sw: b.sw + c.ombros * 14, ww: b.ww + c.volume * 16 - c.definicao * 3, hw: b.hw + c.volume * 10 + c.pernas * 4,
    braco: 14 + c.bracos * 8, perna: 18 + c.pernas * 8 + c.volume * 4, pernaLen: 78 * s, abs: Math.max(0, (c.definicao - 0.4) * 1.3),
    total: 214 + 78 * s + 10,
  };
}

function cabelo(estilo, cor, cx) {
  const t = `fill="${cor}"`;
  switch (estilo) {
    case 'longo': return `<path ${t} d="M${cx - 27},52 Q${cx - 28},22 ${cx},22 Q${cx + 28},22 ${cx + 27},52 L${cx + 30},100 L${cx + 20},100 L${cx + 20},56 Q${cx},40 ${cx - 20},56 L${cx - 20},100 L${cx - 30},100 Z"/>`;
    case 'medio': return `<path ${t} d="M${cx - 27},56 Q${cx - 28},22 ${cx},22 Q${cx + 28},22 ${cx + 27},56 L${cx + 26},74 L${cx + 20},62 Q${cx},42 ${cx - 20},62 L${cx - 26},74 Z"/>`;
    case 'coque': return `<circle ${t} cx="${cx}" cy="20" r="11"/><path ${t} d="M${cx - 25},50 Q${cx - 26},26 ${cx},26 Q${cx + 26},26 ${cx + 25},50 Q${cx},36 ${cx - 25},50 Z"/>`;
    case 'cacheado': return [[-20, 34, 12], [-8, 26, 13], [8, 26, 13], [20, 34, 12], [-26, 48, 9], [26, 48, 9]].map(([dx, y, r]) => `<circle ${t} cx="${cx + dx}" cy="${y}" r="${r}"/>`).join('');
    case 'raspado': return `<path fill="${cor}" opacity=".35" d="M${cx - 24},48 Q${cx - 24},28 ${cx},28 Q${cx + 24},28 ${cx + 24},48 Q${cx},38 ${cx - 24},48 Z"/>`;
    default: return `<path ${t} d="M${cx - 26},50 Q${cx - 27},24 ${cx},24 Q${cx + 27},24 ${cx + 26},50 Q${cx + 20},36 ${cx},36 Q${cx - 20},36 ${cx - 26},50 Z"/>`;
  }
}
function rosto(expr, cx) {
  const olhos = `<circle cx="${cx - 9}" cy="54" r="2.6" fill="#1C1A17"/><circle cx="${cx + 9}" cy="54" r="2.6" fill="#1C1A17"/>`;
  const sobr = expr === 'determinada' ? `<path d="M${cx - 14},47 L${cx - 5},49 M${cx + 14},47 L${cx + 5},49" stroke="#1C1A17" stroke-width="2" stroke-linecap="round"/>` : '';
  const boca = { sorriso: `<path d="M${cx - 8},64 Q${cx},71 ${cx + 8},64" fill="none" stroke="#1C1A17" stroke-width="2.2" stroke-linecap="round"/>`,
    alegre: `<path d="M${cx - 9},63 Q${cx},75 ${cx + 9},63 Z" fill="#7A2E22"/>`, neutra: `<path d="M${cx - 6},66 L${cx + 6},66" stroke="#1C1A17" stroke-width="2.2" stroke-linecap="round"/>`,
    determinada: `<path d="M${cx - 7},65 Q${cx},69 ${cx + 7},65" fill="none" stroke="#1C1A17" stroke-width="2.2" stroke-linecap="round"/>` }[expr] || '';
  return olhos + sobr + boca;
}

/**
 * @param {{personagem?:object, corpo?:object, nivel?:number, tamanho?:number, rotulo?:string}} o
 * @returns {string} SVG completo (role="img", com <title> descritivo)
 */
export function renderPersonagemSVG({ personagem, corpo, nivel = 1, tamanho = 200, rotulo = null } = {}) {
  const p = lerPersonagem(personagem), g = geometria(corpo, p.silhueta), cx = 100;
  const pele = PELES[p.pele] || PELES[2], cabCor = CORES_CABELO[p.cabelo.cor] || CORES_CABELO[1];
  const camisa = CAMISAS[p.roupa.camisa] || CAMISAS.verde, calca = CALCAS[p.roupa.calca] || CALCAS.escuro;
  const libs = new Set(acessoriosLiberados(nivel).map(a => a.id)), usa = id => libs.has(id) && p.acessorios.includes(id);
  const W = 200, H = Math.round(g.total + 18), quadro = molduraDoNivel(nivel);
  const topY = 94, waistY = 160, hipY = 184, legY = 212;
  const bracoE = cx - g.sw + 3, bracoD = cx + g.sw - 3, maoY = 176;
  const texto = rotulo || `${p.nome}, nível ${nivel}`;
  const partes = [];
  if (MOLDURAS[quadro]) partes.push(`<ellipse cx="${cx}" cy="${f(H / 2)}" rx="96" ry="${f(H / 2 - 4)}" fill="none" stroke="${MOLDURAS[quadro]}" stroke-width="${quadro >= 4 ? 5 : 3}" stroke-dasharray="${quadro >= 2 ? '0' : '3 5'}" opacity=".9"/>`);
  // pernas (pele), calção, sapatos
  const lx = cx - g.hw * 0.48, rx = cx + g.hw * 0.48, fimPerna = legY + g.pernaLen;
  for (const x of [lx, rx]) partes.push(`<line x1="${f(x)}" y1="${legY - 6}" x2="${f(x)}" y2="${f(fimPerna)}" stroke="${pele}" stroke-width="${f(g.perna)}" stroke-linecap="round"/>`, `<ellipse cx="${f(x + (x < cx ? -3 : 3))}" cy="${f(fimPerna + 6)}" rx="${f(g.perna * 0.7)}" ry="6" fill="#1F2819"/>`);
  partes.push(`<path d="M${f(cx - g.hw)},${hipY} L${f(cx + g.hw)},${hipY} L${f(cx + g.hw - 1)},${legY + 6} L${f(cx + 3)},${legY + 6} L${cx},${legY - 4} L${f(cx - 3)},${legY + 6} L${f(cx - g.hw + 1)},${legY + 6} Z" fill="${calca}"/>`);
  // braços: antebraço (pele) e manga
  for (const [x, lado] of [[bracoE, -1], [bracoD, 1]]) {
    partes.push(`<line x1="${f(x)}" y1="${topY + 6}" x2="${f(x + lado * 6)}" y2="${maoY}" stroke="${pele}" stroke-width="${f(g.braco)}" stroke-linecap="round"/>`,
      `<line x1="${f(x)}" y1="${topY + 6}" x2="${f(x + lado * 2)}" y2="${topY + 34}" stroke="${camisa}" stroke-width="${f(g.braco + 3)}" stroke-linecap="round"/>`);
    if (usa('luvas')) partes.push(`<circle cx="${f(x + lado * 6)}" cy="${maoY + 2}" r="${f(g.braco / 2 + 2)}" fill="#1F2819"/>`);
  }
  if (usa('relogio')) partes.push(`<rect x="${f(bracoE - 8 - 4)}" y="${maoY - 12}" width="${f(g.braco + 2)}" height="6" rx="2" fill="#E8EEF0" stroke="#1F2819" stroke-width="1.2" transform="rotate(-6 ${bracoE} ${maoY})"/>`);
  // tronco
  partes.push(`<path d="M${f(cx - g.sw + 7)},${topY} L${f(cx + g.sw - 7)},${topY} Q${f(cx + g.sw)},${topY} ${f(cx + g.sw)},${topY + 9} L${f(cx + g.ww + 2)},${waistY} L${f(cx + g.hw)},${hipY} L${f(cx - g.hw)},${hipY} L${f(cx - g.ww - 2)},${waistY} L${f(cx - g.sw)},${topY + 9} Q${f(cx - g.sw)},${topY} ${f(cx - g.sw + 7)},${topY} Z" fill="${camisa}"/>`);
  if (g.abs > 0.02) partes.push(`<g stroke="#000" stroke-opacity="${f(Math.min(0.28, g.abs * 0.5))}" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M${cx},118 L${cx},${hipY - 8}"/><path d="M${cx - 9},134 Q${cx},137 ${cx + 9},134"/><path d="M${cx - 8},148 Q${cx},151 ${cx + 8},148"/><path d="M${cx - 7},162 Q${cx},165 ${cx + 7},162"/></g>`);
  if (usa('medalha')) partes.push(`<path d="M${cx - 6},${topY} L${cx},116 L${cx + 6},${topY}" fill="#C2CCCB"/><circle cx="${cx}" cy="122" r="6" fill="#B7C97E" stroke="#1F2819" stroke-width="1.2"/>`);
  if (usa('insignia')) partes.push(`<path d="M${f(cx - g.sw + 12)},108 l5,0 l0,7 l-2.5,2 l-2.5,-2 z" fill="#E8EEF0" stroke="#1F2819" stroke-width="1"/>`);
  // pescoço e cabeça
  partes.push(`<rect x="${cx - 8}" y="72" width="16" height="${topY - 68}" rx="5" fill="${pele}"/>`, `<circle cx="${cx}" cy="52" r="24" fill="${pele}"/>`, `<ellipse cx="${cx - 24}" cy="54" rx="3.5" ry="5" fill="${pele}"/><ellipse cx="${cx + 24}" cy="54" rx="3.5" ry="5" fill="${pele}"/>`);
  if (p.cabelo.estilo === 'longo') partes.unshift(cabelo('longo', cabCor, cx));   // atrás do corpo
  else partes.push(cabelo(p.cabelo.estilo, cabCor, cx));
  partes.push(rosto(p.expressao, cx));
  if (usa('bone')) partes.push(`<path d="M${cx - 27},44 Q${cx - 27},20 ${cx},20 Q${cx + 27},20 ${cx + 27},44 Z" fill="#4B5320"/><rect x="${cx + 8}" y="40" width="28" height="6" rx="3" fill="#3A4118"/>`);
  if (usa('faixa')) partes.push(`<rect x="${cx - 25}" y="38" width="50" height="7" rx="3" fill="#A3B86A"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pers-t" viewBox="0 0 ${W} ${H}" width="${tamanho}" height="${f(tamanho * H / W)}" class="personagem-svg"><title id="pers-t">${esc(texto)}</title>${partes.join('')}</svg>`;
}

/** Descrição curta e positiva do desenho, para leitores de tela */
export function descreverPersonagem(personagem, nivel = 1) {
  const p = lerPersonagem(personagem), libs = acessoriosLiberados(nivel).filter(a => p.acessorios.includes(a.id)).map(a => a.rotulo.toLowerCase());
  return `${p.nome}, nível ${nivel}. Pele ${NOMES_PELE[p.pele]?.toLowerCase() || ''}, cabelo ${(ESTILOS_CABELO.find(e => e[0] === p.cabelo.estilo) || [, 'curto'])[1].toLowerCase()} ${NOMES_CABELO[p.cabelo.cor]?.toLowerCase() || ''}${libs.length ? ', com ' + libs.join(', ') : ''}.`;
}
