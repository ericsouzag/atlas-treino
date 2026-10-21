// Parser de texto livre em português -> itens de refeição (banco local, sem IA).
// Ex.: "2 ovos mexidos, 150g de arroz, 1 banana, café com leite"
import { ALIMENTOS, alimentoPorId, porcaoPadrao, nutrientesPara, versaoBanco } from './foods.js';
import { normalizar, singular, levenshtein } from './texto.js';

const PALAVRAS_NUM = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, meio: 0.5, meia: 0.5, metade: 0.5, dezena: 10, duzia: 12,
};

// Unidades caseiras reconhecidas (já normalizadas, no singular). Chave -> nome canônico.
const UNIDADES = {
  'colher de sopa': 'colher de sopa', 'colher sopa': 'colher de sopa', 'cs': 'colher de sopa', 'colher': 'colher de sopa',
  'colher de cha': 'colher de cha', 'colher cha': 'colher de cha', 'cc': 'colher de cha',
  'colher de sobremesa': 'colher de sobremesa', 'colher de cafe': 'colher de cafe',
  'ponta de faca': 'ponta de faca', 'fio': 'fio', 'pitada': 'pitada',
  'concha': 'concha', 'escumadeira': 'escumadeira', 'pegador': 'pegador',
  'xicara': 'xicara', 'xic': 'xicara', 'chavena': 'xicara', 'caneca': 'caneca', 'cafezinho': 'cafezinho',
  'copo': 'copo', 'taca': 'taca', 'lata': 'lata', 'garrafa': 'garrafa', 'garrafinha': 'garrafinha', 'litro': 'litro',
  'caixinha': 'caixinha', 'long neck': 'long neck', 'dose': 'dose', 'scoop': 'scoop', 'medida': 'scoop',
  'prato': 'prato', 'tigela': 'tigela', 'porcao': 'porcao', 'pote': 'pote', 'pacote': 'pacote', 'pacotinho': 'pacotinho',
  'sache': 'sache', 'saco': 'saco', 'marmita': 'marmita', 'marmitex': 'marmita',
  'fatia': 'fatia', 'pedaco': 'pedaco', 'rodela': 'rodela', 'tira': 'tira', 'folha': 'folha', 'ramo': 'ramo',
  'bola': 'bola', 'bolinha': 'bola', 'quadrado': 'quadrado', 'barra': 'barra', 'tablete': 'tablete',
  'unidade': 'unidade', 'un': 'unidade', 'und': 'unidade', 'u': 'unidade', 'pedacinho': 'pedaco', 'bife': 'bife', 'file': 'file',
  'punhado': 'punhado', 'cacho': 'cacho', 'espiga': 'espiga', 'gomo': 'gomo', 'espetinho': 'espetinho', 'picole': 'picole',
  'casquinha': 'casquinha', 'bombom': 'bombom', 'metade': 'metade',
};

// Porções genéricas (g ou ml) usadas quando o alimento não define a unidade
const GENERICA = {
  'colher de sopa': 15, 'colher de cha': 5, 'colher de sobremesa': 10, 'colher de cafe': 2, 'ponta de faca': 5, fio: 5,
  pitada: 1, concha: 100, escumadeira: 100, pegador: 110, xicara: 160, caneca: 250, cafezinho: 50, copo: 200, taca: 150,
  lata: 350, garrafa: 500, garrafinha: 290, litro: 1000, caixinha: 200, 'long neck': 355, dose: 30, scoop: 30, prato: 250,
  tigela: 250, porcao: 100, pote: 170, pacote: 100, pacotinho: 50, sache: 8, saco: 100, marmita: 450, fatia: 25,
  pedaco: 60, rodela: 15, tira: 10, folha: 8, ramo: 30, bola: 60, quadrado: 10, barra: 25, tablete: 90, unidade: 100,
  bife: 100, file: 120, punhado: 30, cacho: 100, espiga: 100, gomo: 60, espetinho: 70, picole: 65, casquinha: 90, bombom: 20,
};
const LIQUIDA = { xicara: 240, caneca: 250, copo: 200 };

const STOP = new Set(['de', 'do', 'da', 'dos', 'das', 'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'no', 'na', 'em', 'bem', 'meu', 'minha', 'ao', 'tipo', 'mais', 'cerca', 'uns', 'aproximadamente', 'uns']);
const MODIF_TAM = { grande: 1.3, grandes: 1.3, pequeno: 0.7, pequena: 0.7, pequenos: 0.7, pequenas: 0.7, medio: 1, media: 1, medios: 1, medias: 1 };

// ---------------------------------------------------------------------------
function paraNumero(tok) {
  if (tok == null) return null;
  if (/^\d+([.,]\d+)?$/.test(tok)) return parseFloat(tok.replace(',', '.'));
  if (/^\d+\/\d+$/.test(tok)) { const [a, b] = tok.split('/').map(Number); return b ? a / b : null; }
  if (tok in PALAVRAS_NUM) return PALAVRAS_NUM[tok];
  return null;
}

function prepararTexto(texto) {
  let t = String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  t = t.replace(/(\d),(\d)/g, '$1.$2');            // vírgula decimal protegida
  t = t.replace(/\bagua e sal\b/g, 'agua sal');     // "bolacha de água e sal" não são dois itens
  t = t.replace(/(\d)\s*x\s+/g, '$1 ');             // "2x ovo"
  t = t.replace(/(\d+|um|uma)\s+e\s+(meio|meia)/g, (m, a) => `${paraNumero(a) + 0.5}`);
  t = t.replace(/\bum\s+e\s+(meio|meia)\b/g, '1.5');
  t = t.replace(/(\d)([a-z])/g, '$1 $2');            // 150g -> 150 g
  t = t.replace(/([a-z])(\d)/g, '$1 $2');
  t = t.replace(/[^a-z0-9/.,;+\n% ]/g, ' ');
  t = t.replace(/(?<!\d)\.|\.(?!\d)/g, ' ');
  return t.replace(/[ \t]+/g, ' ').trim();
}

/** Divide em trechos por vírgula, ponto-e-vírgula, +, quebra de linha e " e " */
function dividirTrechos(t) {
  return t.split(/[,;+\n]+|\s+e\s+|\s+mais\s+/).map(s => s.trim()).filter(Boolean);
}

function tokensUteis(s) {
  return s.split(' ').filter(w => w && !STOP.has(w)).map(singular);
}

function tokenSimilar(a, b) {
  if (a === b) return 1;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)) && Math.min(a.length, b.length) / Math.max(a.length, b.length) >= 0.7) return 0.85;
  const max = a.length >= 8 ? 2 : a.length >= 5 ? 1 : 0;
  if (max && levenshtein(a, b, max) <= max) return 0.8;
  return 0;
}

/** Pontuação 0..1 entre tokens da consulta e de um apelido */
function pontuarAlias(q, a) {
  if (!q.length || !a.length) return { s: 0, nao: q.length };
  let inter = 0, nao = 0;
  const usados = new Set();
  for (const t of q) {
    let melhor = 0, bi = -1;
    a.forEach((x, i) => { if (usados.has(i)) return; const s = tokenSimilar(t, x); if (s > melhor) { melhor = s; bi = i; } });
    if (melhor > 0) { inter += melhor; usados.add(bi); } else nao++;
  }
  return { s: (2 * inter) / (q.length + a.length), nao };
}

// Índice de tokens úteis dos apelidos. Reconstruído quando o banco muda (TACO carregada, alimento criado...).
let INDICE = [];
let versaoIndice = -1;
function indice() {
  if (versaoIndice !== versaoBanco()) {
    INDICE = ALIMENTOS.map(a => ({ a, aliases: a.aliasNorm.map(n => tokensUteis(n)) }));
    versaoIndice = versaoBanco();
  }
  return INDICE;
}
// Prioridade de desempate por origem: o que a pessoa criou/escolheu vale mais que o embutido, que vale mais que a TACO.
const PRIORIDADE = { meu: 0.06, off: 0.03, base: 0.004, taco: 0 };

/** Encontra o melhor alimento para um texto (sem quantidade). Retorna {alimento, score, candidatos[]} */
export function encontrarAlimento(texto) {
  const q = tokensUteis(normalizar(texto));
  if (!q.length) return { alimento: null, score: 0, candidatos: [] };
  const pont = [];
  for (const { a, aliases } of indice()) {
    let melhor = 0, naoM = q.length;
    aliases.forEach((al, i) => {
      const r = pontuarAlias(q, al);
      let s = r.s;
      // Em português o substantivo principal vem primeiro ("pizza de presunto" é pizza, não presunto)
      if (r.s > 0 && al.length <= q.length && al.some(x => tokenSimilar(q[0], x) > 0)) s += 0.12;
      if (i === 0) s += 0.002; // nome canônico desempata
      if (r.s > 0) s += PRIORIDADE[a.origem] || 0;
      if (s > melhor) { melhor = s; naoM = r.nao; }
    });
    if (melhor > 0.3) pont.push({ a, s: melhor, nao: naoM });
  }
  pont.sort((x, y) => y.s - x.s);
  const top = pont[0];
  return {
    alimento: top && top.s >= 0.5 ? top.a : null,
    score: top ? Math.min(top.s, 1) : 0,
    naoCasados: top ? top.nao : q.length,
    candidatos: pont.slice(0, 6).map(p => p.a),
  };
}

function acharPorcao(alimento, unidade) {
  const norm = x => normalizar(x);
  const u = norm(unidade);
  return alimento.porcoes.find(p => norm(p.nome) === u)
    || alimento.porcoes.find(p => norm(p.nome).startsWith(u) || u.startsWith(norm(p.nome)));
}

/** Converte (quantidade, unidade, alimento) em gramas/ml. Retorna {gramas, estimado} */
export function paraGramas(alimento, n, unidade, fatorTam = 1) {
  if (unidade === 'g') return { gramas: n, estimado: false };
  if (unidade === 'kg') return { gramas: n * 1000, estimado: false };
  if (unidade === 'ml') return { gramas: n, estimado: false };
  if (unidade === 'l') return { gramas: n * 1000, estimado: false };
  if (unidade === 'metade') {
    return { gramas: n * (acharPorcao(alimento, 'unidade')?.g ?? porcaoPadrao(alimento)), estimado: true };
  }
  let por = acharPorcao(alimento, unidade);
  if (fatorTam > 1) { const g = acharPorcao(alimento, 'grande'); if (g) { por = g; fatorTam = 1; } }
  if (por) return { gramas: n * por.g * fatorTam, estimado: false };
  if (unidade === 'unidade') {
    return { gramas: n * porcaoPadrao(alimento) * fatorTam, estimado: true };
  }
  let base = GENERICA[unidade] ?? porcaoPadrao(alimento);
  if (alimento.liquido && LIQUIDA[unidade]) base = LIQUIDA[unidade];
  return { gramas: n * base * fatorTam, estimado: true };
}

/** Extrai quantidade/unidade de um trecho. Retorna {n, unidade, resto, tam} */
function extrairQuantidade(trecho) {
  let palavras = trecho.split(' ').filter(Boolean);
  let tam = 1;
  palavras = palavras.filter(w => { if (w in MODIF_TAM) { tam = MODIF_TAM[w]; return false; } return true; });

  const tentarUnidade = (ws, i) => {
    // tenta unidades de 3, 2 e 1 palavras a partir de i
    for (const len of [3, 2, 1]) {
      const cand = ws.slice(i, i + len).join(' ');
      const sing = ws.slice(i, i + len).map(singular).join(' ');
      for (const c of [cand, sing]) {
        if (c in UNIDADES) return { unidade: UNIDADES[c], len };
      }
    }
    return null;
  };
  const metricas = { g: 'g', gr: 'g', grs: 'g', grama: 'g', gramas: 'g', kg: 'kg', quilo: 'kg', quilos: 'kg', ml: 'ml', mililitro: 'ml', mililitros: 'ml', l: 'l', lt: 'l', litros: 'l', litro: 'l' };

  // Número no início
  let n = paraNumero(palavras[0]);
  if (n != null) {
    let i = 1; let unidade = null;
    const w1 = palavras[i];
    if (w1 && metricas[w1]) { unidade = metricas[w1]; i++; }
    else if (w1) {
      const u = tentarUnidade(palavras, i);
      if (u) { unidade = u.unidade; i += u.len; }
    }
    if (palavras[i] === 'de' || palavras[i] === 'do' || palavras[i] === 'da') i++;
    return { n, unidade: unidade || 'unidade', resto: palavras.slice(i).join(' '), tam, explicita: !!unidade };
  }
  // Unidade sem número ("colher de azeite", "xícara de leite") -> n = 1
  const u0 = tentarUnidade(palavras, 0);
  if (u0 && !(palavras.length === u0.len)) {
    let i = u0.len;
    if (palavras[i] === 'de' || palavras[i] === 'do' || palavras[i] === 'da') i++;
    return { n: 1, unidade: u0.unidade, resto: palavras.slice(i).join(' '), tam, explicita: true };
  }
  // Número no final ("arroz 150 g", "banana 2")
  const L = palavras.length;
  if (L >= 2) {
    const ult = palavras[L - 1];
    if (metricas[ult] && paraNumero(palavras[L - 2]) != null) {
      return { n: paraNumero(palavras[L - 2]), unidade: metricas[ult], resto: palavras.slice(0, L - 2).join(' '), tam, explicita: true };
    }
    if (/^\d+(\.\d+)?$/.test(ult)) {
      return { n: parseFloat(ult), unidade: 'unidade', resto: palavras.slice(0, L - 1).join(' '), tam, explicita: false };
    }
  }
  return { n: null, unidade: null, resto: palavras.join(' '), tam, explicita: false };
}

function montarItem(trecho, original) {
  const q = extrairQuantidade(trecho);
  // "1 marmita", "uma porção": a própria unidade é o alimento quando não sobrou mais nada
  if (!q.resto && q.unidade && q.unidade !== 'unidade' && !['g', 'kg', 'ml', 'l'].includes(q.unidade)) q.resto = q.unidade;
  const achado = encontrarAlimento(q.resto);
  const item = {
    trecho: original ?? trecho,
    alimentoId: achado.alimento ? achado.alimento.id : null,
    nome: achado.alimento ? achado.alimento.nome : q.resto || trecho,
    quantidade: q.n ?? 1,
    unidade: q.unidade || 'porcao',
    gramas: 0,
    confianca: 'baixa',
    quantidadePadrao: q.n == null,
    candidatos: achado.candidatos.map(c => c.id),
  };
  if (!achado.alimento) return item;
  const a = achado.alimento;
  if (q.n == null) {
    item.gramas = porcaoPadrao(a);
    item.unidade = a.porcoes[0] ? a.porcoes[0].nome : (a.liquido ? 'ml' : 'g');
    item.quantidade = 1;
  } else {
    const r = paraGramas(a, q.n, q.unidade, q.tam);
    item.gramas = r.gramas;
    item.estimadoQtd = r.estimado;
  }
  item.confianca = achado.score >= 0.85 ? (q.n == null ? 'media' : 'alta') : achado.score >= 0.65 ? 'media' : 'baixa';
  return item;
}

/** Interpreta o texto completo. Retorna lista de itens (alguns podem ter alimentoId=null). */
export function interpretarRefeicao(texto) {
  const t = prepararTexto(texto);
  if (!t) return [];
  const itens = [];
  for (const trecho of dividirTrechos(t)) {
    // 1) tenta o trecho inteiro (ex.: "cafe com leite", "pao com manteiga")
    const q = extrairQuantidade(trecho);
    const inteiro = encontrarAlimento(q.resto);
    const temCom = /\bcom\b/.test(q.resto);
    if (temCom && (inteiro.score < 0.85 || inteiro.naoCasados > 0)) {
      // 2) divide por " com " e interpreta cada parte; a quantidade vale para a primeira parte
      const partes = q.resto.split(/\s+com\s+/).filter(Boolean);
      partes.forEach((p, i) => {
        const prefixo = i === 0 && q.n != null ? `${q.n} ${q.unidade && q.unidade !== 'unidade' ? q.unidade + ' de ' : ''}` : '';
        itens.push(montarItem(`${prefixo}${p}`.trim(), trecho));
      });
    } else {
      itens.push(montarItem(trecho));
    }
  }
  return itens;
}

/** Nutrientes de um item já resolvido */
export function nutrientesDoItem(item) {
  const a = item.alimentoId ? alimentoPorId(item.alimentoId) : null;
  if (!a) return { kcal: 0, p: 0, c: 0, g: 0, f: 0, acucar: 0 };
  return nutrientesPara(a, item.gramas);
}

/** Soma nutrientes de vários itens */
export function somarItens(itens) {
  const tot = { kcal: 0, p: 0, c: 0, g: 0, f: 0, acucar: 0 };
  for (const it of itens) {
    const n = it.kcal != null ? it : nutrientesDoItem(it);
    for (const k of Object.keys(tot)) tot[k] += n[k] || 0;
  }
  return tot;
}

/** Descrição curta da quantidade: "2 un." / "150 g" */
export function rotuloQuantidade(item) {
  const a = item.alimentoId ? alimentoPorId(item.alimentoId) : null;
  const base = a && a.liquido ? 'ml' : 'g';
  return `${Math.round(item.gramas)} ${base}`;
}
