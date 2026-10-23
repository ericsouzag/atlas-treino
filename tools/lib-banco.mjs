// Funções compartilhadas pelos geradores do banco de alimentos (TACO, IBGE, USDA) e pela unificação.
// Formato comum de um item candidato:
//   { id, nome, grupo, kcal, p, c, g, f, acucar, porcoes:[{nome,g}], apelidos:[], liquido, ultra, bebAc, supl, fonte }
import { normalizar, singular } from '../js/texto.js';

export const N = normalizar;
export const arred = (x, d = 1) => Math.round((x + Number.EPSILON) * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------------------------------------
// Estados de preparo: nunca se fundem entre si (cru != cozido != frito...)
const ESTADOS = {
  cru: 'cru', crua: 'cru', crus: 'cru', cruas: 'cru',
  cozido: 'cozido', cozida: 'cozido', cozidos: 'cozido', cozidas: 'cozido', fervido: 'cozido', fervida: 'cozido',
  frito: 'frito', frita: 'frito', fritos: 'frito', fritas: 'frito',
  grelhado: 'grelhado', grelhada: 'grelhado', grelhados: 'grelhado', grelhadas: 'grelhado', brasa: 'grelhado', churrasco: 'grelhado',
  assado: 'assado', assada: 'assado', assados: 'assado', assadas: 'assado',
  refogado: 'refogado', refogada: 'refogado', refogados: 'refogado',
  empanado: 'empanado', empanada: 'empanado', empanados: 'empanado', milanesa: 'empanado',
  conserva: 'conserva', enlatado: 'conserva', enlatada: 'conserva', lata: 'conserva',
  calda: 'calda', congelado: 'congelado', congelada: 'congelado', desidratado: 'seco', desidratada: 'seco', seco: 'seco', seca: 'seco',
  po: 'po', torrado: 'torrado', torrada: 'torrado', defumado: 'defumado', defumada: 'defumado',
  light: 'light', diet: 'light', dietetico: 'light', dietetica: 'light', desnatado: 'desnatado', desnatada: 'desnatado',
  integral: 'integral', suco: 'suco', polpa: 'polpa', ensopado: 'ensopado',
};
const STOP = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'as', 'os', 'em', 'no', 'na', 'ao', 'para', 'tipo', 'um', 'uma', 'ou', 'qualquer', 'sabor', 'comum', 'tradicional', 'natura', 'in', 'organico', 'organica', 'especificado', 'especificada', 'nao', 'cerca', 'media', 'medio', 'inteiro', 'inteira', 'extra', 'virgem']);
// frases reescritas antes de tokenizar (sinônimos pt-BR e variantes de grafia)
const FRASES = [
  [/\barroz (branco|polido|agulha|agulhinha|parboilizado|tipo \d)\b/g, 'arroz'],
  [/\bpao (de )?(trigo )?(frances|de sal|da padaria)\b/g, 'pao frances'], [/\bpao de sal\b/g, 'pao frances'],
  [/\b(macaxeira|aipim)\b/g, 'mandioca'], [/\b(mexerica|bergamota|poncan)\b/g, 'tangerina'],
  [/\bbolacha\b/g, 'biscoito'], [/\bfile\b/g, 'file'], [/\bfiambre\b/g, 'presunto'], [/\bjerimum\b/g, 'abobora'],
  [/\b(mucarela|muçarela|mozarela|mozzarella|muzzarela|muzarela|mussarela)\b/g, 'mussarela'], [/\bcalabreza\b/g, 'calabresa'], [/\bpresunto cozido\b/g, 'presunto'],
  [/\bovo de galinha\b/g, 'ovo'], [/\bleite de vaca\b/g, 'leite'], [/\bcarne de (boi|vaca)\b/g, 'carne bovina'],
  [/\b(suco|refresco|nectar) de\b/g, 'suco'], [/\bsalsicha de frango\b/g, 'salsicha'],
  [/\b(com|sem) (casca|pele|gordura|sal|acucar|semente|cabeca|farinha)\b/g, ''], [/\bso carne magra\b|\bmagra\b|\bmagro\b/g, ''],
  [/\b(aveia em flocos|flocos de aveia|aveia flocos)\b/g, 'aveia'], [/\bem (conserva|calda|po|lata)\b/g, '$1'],
  [/\bmilho verde\b/g, 'milho'], [/\bfeijao carioca\b/g, 'feijao carioca'], [/\bbatata inglesa\b/g, 'batata'],
  [/\bbatata frita\b/g, 'batata frita'], [/\bcoca[- ]?cola\b/g, 'refrigerante cola'], [/\brefrigerante de cola\b/g, 'refrigerante cola'],
  [/\bcafe (preparado|infusao|coado)\b/g, 'cafe'], [/\bcafe, ?infusao\b/g, 'cafe'],
  [/\bmaca (fuji|gala|argentina|verde|vermelha)\b/g, 'maca'],
];

function tokensChave(txt) {
  let t = ' ' + N(txt).replace(/[,()/]/g, ' ').replace(/\s+/g, ' ') + ' ';
  for (const [r, v] of FRASES) t = t.replace(r, v);
  const nuc = [], est = [];
  for (const w0 of t.split(' ').filter(Boolean)) {
    const w = singular(w0);
    if (STOP.has(w0) || STOP.has(w)) continue;
    if (/^\d+$/.test(w0)) continue;
    const e = ESTADOS[w0] || ESTADOS[w];
    if (e) est.push(e); else nuc.push(w);
  }
  return { nuc: [...new Set(nuc)].sort(), est: [...new Set(est)].sort() };
}

/** Chave de comparação de um nome: { nuc: tokens do núcleo, est: estados } */
export const chaveNome = tokensChave;

const jacc = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i || 1); };

function estadosCompat(a, b) {
  const A = a.filter(x => x !== 'cru'), B = b.filter(x => x !== 'cru');
  if (A.join() !== B.join()) return false;
  // "cru" explícito de um lado e nada do outro só é compatível se o outro lado não tem estado nenhum (fruta/hortaliça in natura)
  return true;
}

export const kcalProximo = (a, b) => {
  const d = Math.abs(a - b);
  return d <= Math.max(8, 0.15 * Math.max(a, b)) && (a < 30 && b < 30 ? true : d <= 0.15 * Math.max(a, b) + 0.001);
};
export const macrosProximos = (x, y) => {
  if (!kcalProximo(x.kcal, y.kcal)) return false;
  // proteína e gordura não podem divergir demais (evita fundir "frito" com "cozido" de mesmo nome)
  const dp = Math.abs(x.p - y.p), dg = Math.abs(x.g - y.g);
  return dp <= Math.max(5, 0.5 * Math.max(x.p, y.p)) && dg <= Math.max(5, 0.5 * Math.max(x.g, y.g));
};

/** Mesmo alimento? nomes equivalentes (sem acento, plural, ordem, sinônimos) e valores próximos. */
export function mesmoAlimento(a, b, { aliasB = null } = {}) {
  if (N(a.nome) === N(b.nome)) return kcalProximo(a.kcal, b.kcal);   // mesmo nome: só o valor calórico decide (±15%)
  if (!macrosProximos(a, b)) return false;
  const ka = a._k || (a._k = chaveNome(a.nome)), kb = b._k || (b._k = chaveNome(b.nome));
  if (ka.est.includes('light') !== kb.est.includes('light')) return false;
  const nomeIgual = (x, y) => {
    if (!estadosCompat(x.est, y.est)) return false;
    // item sem estado vs item "cru": só se o sem estado for fruta/hortaliça (kcal já é próximo) -> aceito
    if (!x.nuc.length || !y.nuc.length) return false;
    if (x.nuc.join() === y.nuc.join()) return true;
    return Math.min(x.nuc.length, y.nuc.length) >= 2 && jacc(x.nuc, y.nuc) >= 0.8;
  };
  if (nomeIgual(ka, kb)) return true;
  // apelido do item de menor prioridade (b) igual ao nome do de maior prioridade (a); os valores já foram conferidos
  if (aliasB) for (const al of aliasB) { const k = tokensChave(al); if (nomeIgual(k, ka) && (ka.est.length || !k.est.length)) return true; }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Acentuação e capitalização de nomes sem acento (IBGE vem em caixa alta sem acento)
export function construirLexico(textos) {
  const cont = new Map();
  for (const t of textos) for (const w of String(t).toLowerCase().match(/[a-zà-ÿçãõ]+/g) || []) {
    if (!/[à-ÿ]/.test(w)) continue;
    const k = N(w);
    const m = cont.get(k) || new Map(); m.set(w, (m.get(w) || 0) + 1); cont.set(k, m);
  }
  const lex = {};
  for (const [k, m] of cont) lex[k] = [...m].sort((a, b) => b[1] - a[1])[0][0];
  return lex;
}
export const acentuarCom = (lex, txt) => txt.replace(/[a-z]+/g, w => lex[w] || w);
export const capitalizar = t => t.charAt(0).toUpperCase() + t.slice(1);

// gênero (para "cozido/cozida"): palavra-núcleo
const FEM_E = new Set(['carne', 'couve', 'alface', 'ave', 'noz', 'pele', 'gordura', 'folha', 'sopa', 'torta', 'massa', 'vitamina', 'salada', 'farofa', 'canja', 'pizza', 'paçoca', 'pacoca', 'água', 'agua', 'cerveja', 'caipirinha', 'geleia', 'gelatina', 'mistura', 'bebida', 'batata', 'berinjela']);
const MASC_A = new Set(['dia', 'mapa', 'cha', 'chá', 'sofa', 'tapioca_', 'guarana', 'cará', 'cara', 'creme', 'leite', 'suco', 'molho', 'pernil', 'patê', 'peixe']);
export function generoFem(nome) {
  const w = N(nome).split(' ').filter(x => !['de', 'do', 'da', 'dos', 'das'].includes(x))[0] || '';
  if (FEM_E.has(w)) return true;
  if (MASC_A.has(w)) return false;
  return /a$/.test(w) || /(cao|dade|gem)$/.test(w) && !/(feijao|macarrao|mamao|melao|limao|salmao|camarao|pao|pinhao|tomatao|brigadeirao|sabao|figado|alcatraz)$/.test(w);
}
export const flexionar = (estado, fem) => {
  const [m, f] = { cru: ['cru', 'crua'], cozido: ['cozido', 'cozida'], frito: ['frito', 'frita'], grelhado: ['grelhado', 'grelhada'], assado: ['assado', 'assada'], refogado: ['refogado', 'refogada'], empanado: ['empanado', 'empanada'], seco: ['seco', 'seca'], congelado: ['congelado', 'congelada'], conserva: ['em conserva', 'em conserva'] }[estado] || [estado, estado];
  return fem ? f : m;
};

// ---------------------------------------------------------------------------------------------
// Medidas caseiras -> unidades que o parser conhece (nome canônico)
export const MEDIDA_PARA_UNIDADE = {
  'colher de sopa': 'colher de sopa', 'colher de cha': 'colher de cha', 'colher de sobremesa': 'colher de sobremesa', 'colher de cafe': 'colher de cafe',
  'concha': 'concha', 'escumadeira': 'escumadeira', 'pegador': 'pegador', 'xicara de cha': 'xicara', 'xicara': 'xicara', 'caneca': 'caneca', 'copo americano': 'copo',
  'copo grande': 'copo', 'copo medio': 'copo', 'copo': 'copo', 'taca': 'taca', 'lata': 'lata', 'garrafa': 'garrafa', 'prato fundo': 'prato', 'prato raso': 'prato', 'prato': 'prato',
  'fatia': 'fatia', 'fatia media': 'fatia', 'fatia grande': 'fatia', 'fatia pequena': 'fatia', 'pedaco': 'pedaco', 'pedaco medio': 'pedaco', 'unidade': 'unidade', 'unidade media': 'unidade',
  'porcao': 'porcao', 'tigela': 'tigela', 'pote': 'pote', 'pacote': 'pacote', 'sache': 'sache', 'barra': 'barra', 'bife': 'bife', 'file': 'file', 'rodela': 'rodela', 'gomo': 'gomo',
  'espiga': 'espiga', 'punhado': 'punhado', 'dose': 'dose', 'fio': 'fio', 'tablete': 'tablete', 'caixinha': 'caixinha', 'bola': 'bola', 'folha': 'folha', 'ramo': 'ramo',
  'colher de servir': 'colher de servir', 'colher de arroz/servir': 'colher de sopa', 'cacho': 'cacho', 'bombom': 'bombom', 'espetinho': 'espetinho', 'picole': 'picole',
};

export const formatarPorcoes = ps => ps.map(p => `${p.nome}:${arred(p.g, 1)}`).join(';');
export const lerPorcoes = txt => (txt || '').split(';').filter(Boolean).map(x => { const i = x.lastIndexOf(':'); return { nome: x.slice(0, i), g: parseFloat(x.slice(i + 1)) }; });
export function flagsDe(it) {
  const f = [];
  if (it.liquido) f.push('l'); if (it.bebAc) f.push('b'); if (it.ultra) f.push('u'); if (it.supl) f.push('t');
  if (it.acucar > 0) f.push('a=' + arred(it.acucar, 1));
  if (it.nova >= 1 && it.nova <= 4) f.push('n=' + it.nova);   // grau de processamento NOVA (js/nova-regras.js); ausente = sem classificação
  return f.join(';');
}

/** Valida nutrientes por 100 g. Retorna lista de problemas ([] = ok). */
export function problemasNutri(it) {
  const pr = [];
  for (const k of ['kcal', 'p', 'c', 'g', 'f']) if (typeof it[k] !== 'number' || !Number.isFinite(it[k])) pr.push(`${k} inválido`); else if (it[k] < 0) pr.push(`${k} negativo`);
  if (pr.length) return pr;
  if (it.kcal > 900) pr.push('kcal > 900');
  if (it.p + it.c + it.g > 105) pr.push('macros somam > 100 g');
  if (it.kcal >= 20) {
    const calc = 4 * it.p + 4 * it.c + 9 * it.g;
    const alcool = /cerveja|vinho|uisque|vodka|cachaca|caipirinha|licor|destilad|aguardente|rum|champanhe|chopp|bebida alcoolica|conhaque|gin\b/.test(N(it.nome));
    if (!alcool && Math.abs(calc - it.kcal) > Math.max(30, 0.35 * it.kcal)) pr.push(`kcal ${it.kcal} vs macros ${Math.round(calc)}`);
  }
  if (it.acucar > it.c + 0.6) pr.push('açúcar > carboidrato');
  return pr;
}
