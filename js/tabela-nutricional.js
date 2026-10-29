// Leitura de tabela nutricional (texto vindo do OCR local) -> valores por 100 g/ml. Funções puras, testadas em
// tests/tabela-nutricional.test.mjs. Nada aqui acessa rede, câmera ou DOM.
//
// Tabelas brasileiras costumam ter colunas "100 g (ou ml)", "porção de X g" e "%VD". Regra: se houver a coluna de 100 g, ela vale;
// senão a porção é convertida para 100 g (para100, de banco.js). Tolera erros comuns de OCR: O/o lido no lugar do 0, l/I/| no lugar
// do 1, vírgula decimal, "kcal" mal lido (kcai, kca1, keal...) e "g" lido como "9" (quando solto, depois do número).
// A leitura NUNCA é salva sozinha: devolve também `duvidosos` (campos a destacar no formulário) e `avisos`.
import { para100 } from './banco.js';

const CAMPOS = ['kcal', 'p', 'c', 'g', 'f', 'acucar'];
export const ROTULO_CAMPO = { kcal: 'Calorias', p: 'Proteína', c: 'Carboidrato', g: 'Gordura', f: 'Fibra', acucar: 'Açúcar' };

const sem = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Corrige confusões de OCR dentro de tokens numéricos: O->0, l/I/|->1, S->5 (só colados a dígitos) */
export function corrigirNumero(tok) {
  if (!/\d/.test(tok) && !/^[oOlI|]+$/.test(tok)) return tok;
  return tok.replace(/[oO]/g, '0').replace(/[lI|]/g, '1');
}
/** "1.596" (milhar) e "8,5" (decimal) -> número */
export function lerNum(tok) {
  const t = String(tok).trim();
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return parseFloat(t.replace(/\./g, '').replace(',', '.'));
  const n = parseFloat(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Normaliza o texto: minúsculas sem acento, unidades coladas separadas, "kcal" e "g" mal lidos corrigidos */
export function normalizarTexto(txt) {
  let t = sem(txt).replace(/\r/g, '').replace(/[‘’“”`´]/g, '').replace(/(?<=\s|^)\|(?=\s|$)/gm, ' ').replace(/[|]/g, '1').replace(/[_~]/g, ' ');
  // "kcal" mal lido: kcai, kca1, kcaI, keal, kcol, kcl, kca|, kcai.
  t = t.replace(/\bk[ce][a-z1]?[l1i]\b/g, 'kcal').replace(/\bkca[a-z1]\b/g, 'kcal').replace(/\bkcai\b/g, 'kcal');
  // tokens numéricos com O/l/I trocados
  t = t.replace(/(?<![a-z])[0-9oli]{1,6}(?:[.,][0-9oli]{1,3})?(?![a-z])/g, m => (/\d/.test(m) ? corrigirNumero(m) : m));
  // junta número e unidade: "12g" -> "12 g", "30ml" -> "30 ml"
  t = t.replace(/(\d)(kcal|kj|mg|mcg|g|ml|%)/g, '$1 $2');
  return t;
}

const NUM = '\\d+(?:[.,]\\d+)?';

function tokensNumericos(linha, { permitirNoveComoG = false } = {}) {
  // tira o rótulo (letras antes do primeiro número), mantendo só a parte numérica da linha
  const re = new RegExp(`(${NUM})\\s*(kcal|kj|mg|mcg|g|ml|%)?`, 'g');
  const out = []; let m;
  const temG = /\d\s*g\b/.test(linha);
  while ((m = re.exec(linha))) {
    let un = m[2] || '';
    const ini = m.index;
    // "9" solto depois de um número = "g" mal lido (só se a linha não tiver nenhum g de verdade)
    if (permitirNoveComoG && !temG && !un && m[1] === '9' && out.length && !out[out.length - 1].un && /\s$/.test(linha.slice(0, ini))) { out[out.length - 1].un = 'g'; out[out.length - 1].noveG = true; continue; }
    out.push({ v: lerNum(m[1]), un, bruto: m[1], ini });
  }
  return out;
}

/** Porção: "Porção de 30 g (3 colheres de sopa)", "Porção: 200 ml (1 copo)". Retorna {g, liquido, nome} ou null */
export function lerPorcao(texto) {
  const t = normalizarTexto(texto);
  const re = new RegExp(`por[cç]a?o?\\s*(?:de|:|=)?\\s*(${NUM})\\s*(g|ml|9)\\b(?:\\s*\\(([^)]{1,40})\\))?`);
  let m = re.exec(t);
  if (!m) m = new RegExp(`(?:quantidade por )?por[cç][a-z]*\\s*[^\\d\\n]{0,12}(${NUM})\\s*(g|ml)\\b(?:\\s*\\(([^)]{1,40})\\))?`).exec(t);
  if (!m) {
    // cabeçalho "30 g (1 porção)" ou "30 g (3 colheres de sopa)"
    const c = new RegExp(`(${NUM})\\s*(g|ml)\\s*\\(([^)]{1,40})\\)`).exec(t);
    if (c && !/^100\b/.test(c[1])) m = c;
  }
  if (!m) return null;
  const g = lerNum(m[1]);
  if (!(g > 0)) return null;
  let medida = (m[3] || '').replace(/\s+/g, ' ').trim();
  medida = medida.replace(/^1\s+por[cç]ao$/, '').replace(/^\d+\s*por[cç]/, '');
  return { g, liquido: m[2] === 'ml', nome: medida || 'porção do rótulo' };
}

const TIPOS = [
  // [campo, teste sobre a linha normalizada, unidade esperada]
  ['kcal', /valor energ|energia|energet|calorias/],
  ['acucarAdic', /acucar(es)?\s+adicion/],
  ['acucar', /acucar(es)?(\s+totais|\s+total)?\b/],
  ['f', /fibra/],
  ['p', /prote[ií]n/],
  ['gSat', /(?<!in)saturad/],
  ['gTrans', /\btrans\b/],
  ['gMono', /monoinsaturad|poli-?insaturad|poliinsaturad/],
  ['g', /gordura|lipid|lipidio/],
  ['c', /carbo[ih]?idrat|carbohid|carboidr/],
  ['sodioMg', /s[oó]dio|sodio/],
];

function tipoDaLinha(linha) {
  const soLetras = linha.replace(/[0-9]/g, ' ');
  // "Carboidratos ... dos quais açúcares" não ocorre numa linha só, mas "Açúcares" pode vir após "carboidratos" em linhas vizinhas
  for (const [campo, re] of TIPOS) if (re.test(soLetras)) {
    if (campo === 'g' && /\bsaturad|\btrans\b|\binsaturad/.test(soLetras)) continue;
    return campo;
  }
  return null;
}

function energiaKcal(linha) {
  const t = linha;
  const kcals = [...t.matchAll(new RegExp(`(${NUM})\\s*kcal`, 'g'))].map(m => lerNum(m[1])).filter(v => v != null);
  if (kcals.length) return { vals: kcals, daKj: false };
  // "150/630" (kcal/kJ)
  const par = new RegExp(`(${NUM})\\s*/\\s*(${NUM})`).exec(t);
  if (par) { const a = lerNum(par[1]), b = lerNum(par[2]); if (a && b && b / a > 3.8 && b / a < 4.6) return { vals: [a], daKj: false }; }
  // "Valor energético (kcal) 466 140 7": a unidade está no rótulo e as colunas vêm só com números
  if (/\(\s*kcal\s*\)/.test(t)) {
    const resto = t.slice(t.indexOf(')') + 1);
    const ns = [...resto.matchAll(new RegExp(`(${NUM})`, 'g'))].map(m => lerNum(m[1])).filter(v => v != null);
    if (ns.length) return { vals: ns, daKj: false };
  }
  const kjs = [...t.matchAll(new RegExp(`(${NUM})\\s*kj`, 'g'))].map(m => lerNum(m[1])).filter(v => v != null);
  if (kjs.length) return { vals: kjs.map(v => Math.round(v / 4.184)), daKj: true };
  return null;
}

/**
 * Interpreta o texto do OCR.
 * @param {string} texto
 * @returns {{ ok:boolean, layout:string, porcao:{g:number,liquido:boolean,nome:string}|null, liquido:boolean,
 *   por100:{kcal:number|null,p:number|null,c:number|null,g:number|null,f:number|null,acucar:number|null}, extras:object,
 *   origem:'100'|'porcao'|'', duvidosos:string[], avisos:string[], coerente:boolean|null }}
 */
export function interpretarTabela(texto) {
  const linhas = normalizarTexto(texto).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const avisos = [], duvidosos = new Set();
  const porcao = lerPorcao(texto);
  const cabecalho = linhas.slice(0, Math.max(6, Math.min(linhas.length, 12))).join(' ');
  const tem100 = /100\s*(g|ml)\b/.test(sem(texto));
  const temColPorcao = /por[cç]ao|porcao/.test(sem(texto));
  let liquido = !!(porcao && porcao.liquido) || /100\s*ml\b/.test(sem(texto)) && !/100\s*g\b/.test(sem(texto));

  // 1) coleta, para cada nutriente, a lista de números da linha (ou da linha seguinte, se a do rótulo veio sem números)
  const achados = {};
  for (let i = 0; i < linhas.length; i++) {
    const campo = tipoDaLinha(linhas[i]);
    if (!campo || achados[campo]) continue;
    let linha = linhas[i];
    const semNum = !/\d/.test(linha.replace(/[a-z ]*\bporcao\b[^\d]*/g, ''));
    if (semNum && linhas[i + 1] && !/[a-z]{4,}/.test(linhas[i + 1].replace(/\b(kcal|kj|mg|mcg|ml)\b/g, ''))) linha = linha + ' ' + linhas[i + 1];
    if (campo === 'kcal') {
      const e = energiaKcal(linha);
      if (e) { achados.kcal = { vals: e.vals, un: 'kcal', daKj: e.daKj, linha, vd: null }; if (e.daKj) duvidosos.add('kcal'); }
      continue;
    }
    // remove o que vem antes do primeiro dígito (o nome do nutriente) e "dos quais"
    const dig = linha.search(/\d/);
    if (dig < 0) continue;
    const resto = linha.slice(dig);
    const toks = tokensNumericos(resto, { permitirNoveComoG: campo !== 'sodioMg' });
    if (!toks.length) continue;
    achados[campo] = { toks, linha };
  }

  // 2) separa colunas
  const vals = {}, valsPorcao = {};   // por 100 g e por porção
  const valorDe = (campo, idxCol) => {
    const a = achados[campo]; if (!a) return null;
    const un = campo === 'sodioMg' ? 'mg' : 'g';
    const nums = a.toks.filter(t => t.un !== '%' && t.v != null);
    return { nums, n: nums.length, un };
  };
  // layout: '100+porcao' (n >= 2 números úteis por linha, o último pode ser %VD sem unidade), 'porcao' ou '100'
  const kcalA = achados.kcal;
  let layout = '';
  const testeCons = (a100, aPor) => porcao && a100 > 0 && aPor > 0 && Math.abs(a100 * porcao.g / 100 - aPor) / aPor < 0.25;
  const candidatos = ['c', 'p', 'g', 'f'].map(valorDe).concat([]);
  const duasCol = (campo) => { const x = valorDe(campo); return x && x.n >= 2 ? x : null; };
  if (tem100 && temColPorcao) layout = '100+porcao';
  else if (tem100 && !temColPorcao) layout = '100';
  else if (temColPorcao || porcao) layout = 'porcao';
  else layout = '100';
  // heurística de consistência: se o rótulo não disse colunas mas há dois números por linha com razão da porção, são 100 g + porção
  if (layout === 'porcao' && porcao && porcao.g !== 100) {
    // sem cabeçalho de colunas: se vários nutrientes têm dois números cuja razão bate com a porção (e nenhum contradiz), são 100 g + porção
    const pares = ['c', 'p', 'g'].map(duasCol).filter(Boolean).map(x => [x.nums[0].v, x.nums[1].v]);
    if (kcalA && kcalA.vals.length >= 2) pares.push([kcalA.vals[0], kcalA.vals[1]]);
    const relev = pares.filter(([x]) => x >= 5);
    if (relev.length >= 2 && relev.every(([x, y]) => testeCons(x, y))) layout = '100+porcao';
  }
  if (layout === '100+porcao' && !porcao) layout = '100';

  const pega = (campo) => {
    const x = valorDe(campo); if (!x || !x.n) return;
    const [a, b] = x.nums;
    if (layout === '100+porcao') {
      if (x.n >= 2) {
        vals[campo] = a.v; valsPorcao[campo] = b.v;
        if (porcao && a.v > 0 && b.v > 0 && !testeCons(a.v, b.v)) duvidosos.add(campo === 'sodioMg' ? 'sodioMg' : campo);
        // nem sempre a 2ª coluna existe: se só um número, vale como 100 g
      } else vals[campo] = a.v;
    } else if (layout === 'porcao') {
      valsPorcao[campo] = a.v;
      if (a.noveG) duvidosos.add(campo);
    } else { vals[campo] = a.v; }
    if (x.nums.some(t => t.noveG)) duvidosos.add(campo);
  };
  for (const c of ['p', 'c', 'g', 'f', 'acucar', 'gSat', 'gTrans', 'sodioMg']) pega(c);
  if (kcalA) {
    const v = kcalA.vals;
    if (layout === '100+porcao') { if (v.length >= 2) { vals.kcal = v[0]; valsPorcao.kcal = v[1]; if (porcao && !testeCons(v[0], v[1])) duvidosos.add('kcal'); } else vals.kcal = v[0]; }
    else if (layout === 'porcao') valsPorcao.kcal = v[0];
    else vals.kcal = v[0];
  }

  // 3) decide a origem: 100 g quando houver, senão converte a porção
  const por100 = { kcal: null, p: null, c: null, g: null, f: null, acucar: null };
  const extras = { gSat: null, gTrans: null, sodioMg: null, porPorcao: valsPorcao };
  let origem = '';
  const campos = [...CAMPOS, 'gSat', 'gTrans', 'sodioMg'];
  const temTodos100 = ['kcal', 'p', 'c', 'g'].filter(c => vals[c] != null).length;
  const temTodosPorc = ['kcal', 'p', 'c', 'g'].filter(c => valsPorcao[c] != null).length;
  if (temTodos100 >= 2 || (temTodos100 >= temTodosPorc && temTodos100 > 0)) {
    origem = '100';
    for (const c of campos) { const v = vals[c] ?? (valsPorcao[c] != null && porcao ? para100({ x: valsPorcao[c] }, porcao.g).x : null); if (CAMPOS.includes(c)) por100[c] = v; else extras[c] = v; }
  } else if (temTodosPorc > 0) {
    if (!porcao) { avisos.push('Não achei o tamanho da porção na tabela, então não dá para converter para 100 g. Informe o tamanho da porção e marque "Por porção".'); }
    else {
      origem = 'porcao';
      for (const c of campos) { const v = valsPorcao[c] != null ? para100({ x: valsPorcao[c] }, porcao.g).x : null; if (CAMPOS.includes(c)) por100[c] = v; else extras[c] = v; }
      avisos.push(`Os valores estavam por porção de ${porcao.g} ${porcao.liquido ? 'ml' : 'g'}; foram convertidos para 100 ${porcao.liquido ? 'ml' : 'g'}.`);
    }
  }
  if (origem === '' && !avisos.length) avisos.push('Não consegui reconhecer a tabela nutricional na foto.');

  // 4) coerência: kcal ≈ 4p + 4c + 9g (±20%)
  let coerente = null;
  const { kcal, p, c, g } = por100;
  if (kcal == null && p != null && c != null && g != null) { por100.kcal = Math.round(4 * p + 4 * c + 9 * g); duvidosos.add('kcal'); avisos.push('As calorias não foram lidas; o valor mostrado foi calculado pelos macros (4 por g de proteína e carboidrato, 9 por g de gordura). Confira no rótulo.'); }
  if (por100.kcal != null && p != null && c != null && g != null) {
    const calc = 4 * p + 4 * c + 9 * g;
    const ref = Math.max(por100.kcal, 1);
    coerente = Math.abs(calc - por100.kcal) / ref <= 0.2 || Math.abs(calc - por100.kcal) <= 12;
    if (!coerente) { for (const k of ['kcal', 'p', 'c', 'g']) duvidosos.add(k); avisos.push(`Os números não batem (${por100.kcal} kcal informados, ${Math.round(calc)} kcal pelos macros). A leitura pode ter errado algum valor: confira com o rótulo.`); }
  }
  if (por100.kcal != null && por100.kcal > 900) { duvidosos.add('kcal'); avisos.push('Calorias acima de 900 por 100 g: confira se a coluna lida é a de 100 g.'); }
  for (const k of ['p', 'c', 'g']) if (por100[k] != null && por100[k] > 100) duvidosos.add(k);
  // campos essenciais ausentes
  for (const k of ['kcal', 'p', 'c', 'g']) if (por100[k] == null && origem) duvidosos.add(k);
  if (por100.acucar != null && por100.c != null && por100.acucar > por100.c + 0.5) duvidosos.add('acucar');

  const ok = origem !== '' && por100.kcal != null && ['p', 'c', 'g'].filter(k => por100[k] != null).length >= 2;
  for (const k of Object.keys(por100)) if (por100[k] != null) por100[k] = Math.round(por100[k] * 10) / 10;
  if (!ok && origem) avisos.push('A leitura ficou incompleta: preencha os campos vazios olhando a foto.');
  return { ok, layout, porcao, liquido, por100, extras, origem, duvidosos: [...duvidosos], avisos, coerente };
}
