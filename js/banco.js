// Camada que junta as três origens de alimentos além do banco embutido:
//   1. TACO (data/taco.json, carregada sob demanda);
//   2. "Meus alimentos" (criados pela pessoa) e 3. produtos escolhidos no Open Food Facts.
// As duas últimas ficam na coleção sincronizada `alimentos` do store (entram em backup e nuvem).
import { store, novoId } from './store.js';
import { carregarBancoCompleto, montarAlimento, registrarAlimentos, removerAlimentoDoBanco, alimentoPorId } from './foods.js';

// ---------------------------------------------------------------------------------------------
// Validação e conversão (funções puras, testadas em tests/alimentos.test.mjs)

const num = v => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const arred = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

/** Converte valores informados "por porção" para "por 100 g/ml". */
export function para100(valores, porcaoG) {
  const k = 100 / porcaoG;
  const out = {};
  for (const [c, v] of Object.entries(valores)) out[c] = v == null ? v : arred(v * k, 2);
  return out;
}

/**
 * Confere os números de um alimento (por 100 g/ml). Retorna { erros, avisos }.
 * erros impedem salvar; avisos só pedem atenção (dados de rótulo costumam ter erros).
 */
export function validarNutrientes({ kcal, p, c, g, f = 0, acucar = 0 }) {
  const erros = [], avisos = [];
  if (kcal == null || kcal < 0) erros.push('Informe as calorias (kcal).');
  else if (kcal > 900) erros.push('Calorias acima de 900 kcal por 100 g não são possíveis. Confira se o valor é por 100 g e não por embalagem.');
  for (const [nome, v] of [['proteína', p], ['carboidrato', c], ['gordura', g], ['fibra', f], ['açúcar', acucar]]) {
    if (v != null && v < 0) erros.push(`A ${nome} não pode ser negativa.`);
  }
  const soma = (p || 0) + (c || 0) + (g || 0);
  if (soma > 105) erros.push('Proteína + carboidrato + gordura passam de 100 g por 100 g. Confira os valores.');
  if ((acucar || 0) > (c || 0) + 0.5) avisos.push('O açúcar informado é maior que o carboidrato.');
  if (!erros.length && kcal != null && kcal >= 20) {
    const calc = 4 * (p || 0) + 4 * (c || 0) + 9 * (g || 0);
    if (Math.abs(calc - kcal) > Math.max(40, kcal * 0.35)) avisos.push(`As calorias (${Math.round(kcal)}) não batem com os macros (≈ ${Math.round(calc)} kcal). Confira.`);
  }
  return { erros, avisos };
}

/** Monta o documento guardado no store a partir do formulário */
export function montarDocAlimento({ tipo = 'meu', id, nome, marca = '', codigo = '', base = '100', porcaoG = null, kcal, p, c, g, f, acucar, liquido = false, porcaoNome = 'porção', apelidos = [] }) {
  const nm = String(nome || '').trim();
  let v = { kcal: num(kcal), p: num(p) ?? 0, c: num(c) ?? 0, g: num(g) ?? 0, f: num(f) ?? 0, acucar: num(acucar) ?? 0 };
  const pg = num(porcaoG);
  if (base === 'porcao') {
    if (!pg || pg <= 0) throw new Error('Informe o tamanho da porção em gramas (ou ml).');
    v = para100(v, pg);
  }
  const porcoes = [];
  if (pg && pg > 0) porcoes.push({ nome: String(porcaoNome || 'porção').trim() || 'porção', g: pg });
  return {
    ...(id ? { id } : {}),
    tipo, nome: nm, ...(marca ? { marca: String(marca).trim() } : {}), ...(codigo ? { codigo: String(codigo).trim() } : {}),
    kcal: arred(v.kcal ?? 0, 1), p: arred(v.p, 1), c: arred(v.c, 1), g: arred(v.g, 1), f: arred(v.f, 1), acucar: arred(v.acucar, 1),
    liquido: !!liquido, porcoes, apelidos: apelidos.map(x => String(x).trim()).filter(Boolean),
  };
}

/** Documento do store -> alimento do banco (mesmo formato de qualquer outro) */
export function alimentoDeDoc(d) {
  const nomeExib = d.marca && !d.nome.toLowerCase().includes(d.marca.toLowerCase()) ? `${d.nome} (${d.marca})` : d.nome;
  const aliases = [...(d.apelidos || []), d.nome, ...(d.marca ? [`${d.nome} ${d.marca}`] : [])];
  return montarAlimento({
    id: d.id, nome: nomeExib, grupo: d.tipo === 'off' ? 'produtos' : 'meus', kcal: d.kcal, p: d.p, c: d.c, g: d.g, f: d.f || 0,
    acucar: d.acucar || 0, liquido: !!d.liquido, ultra: d.tipo === 'off', porcoes: d.porcoes || [],
    aliases, origem: d.tipo === 'off' ? 'off' : 'meu', extra: { codigo: d.codigo || null, marca: d.marca || null },
  });
}

// ---------------------------------------------------------------------------------------------
// Ligação com o store

/** Registra no banco todos os alimentos da pessoa; remove os apagados. */
export function sincronizarAlimentosSalvos() {
  const bruto = store.bruto().alimentos || {};
  const vivos = [];
  for (const d of Object.values(bruto)) {
    if (d._d) { const a = alimentoPorId(d.id); if (a && (a.origem === 'meu' || a.origem === 'off')) removerAlimentoDoBanco(d.id); }
    else if (d.nome) vivos.push(alimentoDeDoc(d));
  }
  registrarAlimentos(vivos);
  return vivos.length;
}

let iniciado = false;
/** Chamar uma vez na abertura do app (depois de store.iniciar). */
export function iniciarBanco({ carregarTaco = true } = {}) {
  if (!iniciado) {
    iniciado = true;
    sincronizarAlimentosSalvos();
    store.assinar(ev => { if (ev.tipo === 'tudo' || (ev.tipo === 'item' && (ev.col === 'alimentos' || ev.id === null))) sincronizarAlimentosSalvos(); });
  }
  if (carregarTaco) {
    const ocioso = globalThis.requestIdleCallback || (f => setTimeout(f, 800));
    ocioso(() => carregarBancoCompleto());
  }
}

/**
 * Espera (no máximo `ms`) a TACO ficar pronta. Nunca falha: sem rede e sem cache, segue só com o embutido.
 */
export async function garantirBanco(ms = 4000) {
  sincronizarAlimentosSalvos();
  await Promise.race([carregarBancoCompleto(), new Promise(r => setTimeout(r, ms))]);
}

/** Cria ou atualiza um alimento (próprio ou de produto). Retorna o alimento já registrado. */
export function salvarAlimentoPersonalizado(dados) {
  const prefixo = dados.tipo === 'off' ? 'off-' : 'meu-';
  const id = dados.id || (dados.tipo === 'off' && dados.codigo ? `off-${dados.codigo}` : prefixo + novoId('').slice(0, 12));
  const doc = store.salvar('alimentos', { ...dados, id });
  const a = alimentoDeDoc(doc);
  registrarAlimentos([a]);
  return a;
}

export function removerAlimentoPersonalizado(id) {
  store.remover('alimentos', id);
  removerAlimentoDoBanco(id);
}

export const listarMeusAlimentos = () => store.listar('alimentos', d => d.tipo !== 'off').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
export const listarProdutosSalvos = () => store.listar('alimentos', d => d.tipo === 'off').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
