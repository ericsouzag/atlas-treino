// Grau de processamento do dia (classificação NOVA do Guia Alimentar para a População Brasileira, Ministério da Saúde, 2014).
// Funções puras: recebem refeições (com itens que guardam alimentoId, kcal e gramas) e devolvem kcal, gramas e % por grupo.
// A classe vem do banco de alimentos NO MOMENTO DO CÁLCULO (refeições antigas não precisam de migração); se o alimento já não
// existir no banco, usa a classe guardada no próprio item (quando houver) e, na falta dela, o item fica "sem classificação".
import { alimentoPorId } from './foods.js';

export const GRUPOS_NOVA = [
  { id: 1, curto: 'In natura', nome: 'In natura / minimamente processado', exemplos: 'frutas, legumes, arroz, feijão, ovos, carne fresca, leite, café, água; inclui pratos caseiros' },
  { id: 2, curto: 'Ingredientes', nome: 'Ingredientes culinários', exemplos: 'óleos, azeite, açúcar, sal, manteiga, farinha de trigo' },
  { id: 3, curto: 'Processado', nome: 'Processado', exemplos: 'pães, queijos, conservas, carnes curadas simples' },
  { id: 4, curto: 'Ultraprocessado', nome: 'Ultraprocessado', exemplos: 'refrigerantes, salgadinhos, embutidos, biscoitos recheados, macarrão instantâneo, fast food' },
];
export const SEM_CLASSE = { id: 0, curto: 'Sem classificação', nome: 'Sem classificação', exemplos: 'sem correspondência no banco ou sem regra' };
export const grupoNova = id => (id === 0 ? SEM_CLASSE : GRUPOS_NOVA.find(g => g.id === id) || SEM_CLASSE);

const valida = n => (Number.isInteger(n) && n >= 1 && n <= 4 ? n : 0);

/** Classe NOVA de um item de refeição: 1 a 4, ou 0 (sem classificação). `buscar(id)` devolve o alimento do banco. */
export function classeNovaDoItem(item, buscar = alimentoPorId) {
  if (!item) return 0;
  const a = item.alimentoId ? buscar(item.alimentoId) : null;
  if (a && valida(a.nova)) return a.nova;
  return valida(item.nova);   // alimento fora do banco: usa a classe guardada no item, se existir
}

/**
 * Arredonda percentuais para inteiros somando exatamente 100 (maior resto). Entrada: números >= 0. Saída: inteiros.
 * Se tudo for zero, devolve zeros.
 */
export function arredondarPercentuais(valores) {
  const soma = valores.reduce((s, v) => s + Math.max(0, v), 0);
  if (!(soma > 0)) return valores.map(() => 0);
  const exatos = valores.map(v => (100 * Math.max(0, v)) / soma);
  const base = exatos.map(Math.floor);
  let falta = 100 - base.reduce((s, v) => s + v, 0);
  const ordem = exatos.map((e, i) => [e - base[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; k < falta; k++) base[ordem[k % ordem.length][1]]++;
  return base;
}

/**
 * Resumo do dia por grupo NOVA.
 * refeicoes: [{ itens: [{ alimentoId, nome, kcal, gramas, nova? }] }]
 * opcoes: { buscar, base: 'total' | 'classificados' }
 *   base 'total' (padrão): os percentuais usam todo o dia, e "sem classificação" aparece como fatia própria;
 *   base 'classificados': itens sem classificação saem do denominador (continuam listados à parte).
 * Retorna { kcalTotal, gramasTotal, kcalClassificado, gramasClassificado, base,
 *           grupos: { 0..4: { id, kcal, gramas, pctKcal, pctGramas, itens: [{ alimentoId, nome, kcal, gramas }] } },
 *           pctSemClasse: { kcal, gramas } (sempre sobre o total do dia), temDados }
 */
export function resumoNova(refeicoes, { buscar = alimentoPorId, base = 'total' } = {}) {
  const grupos = {};
  for (const id of [0, 1, 2, 3, 4]) grupos[id] = { id, kcal: 0, gramas: 0, pctKcal: 0, pctGramas: 0, itens: [] };
  const acumulado = new Map();   // mesmo alimento repetido no dia vira uma linha só
  for (const r of refeicoes || []) {
    for (const it of r.itens || []) {
      const kcal = Number(it.kcal) || 0, gramas = Number(it.gramas) || 0;
      if (kcal <= 0 && gramas <= 0) continue;   // item sem correspondência e sem valores: nada a somar
      const cl = classeNovaDoItem(it, buscar);
      const chave = `${cl}|${it.alimentoId || it.nome || '?'}`;
      let l = acumulado.get(chave);
      if (!l) { l = { alimentoId: it.alimentoId || null, nome: it.nome || 'Item', liquido: !!it.liquido, kcal: 0, gramas: 0, cl }; acumulado.set(chave, l); }
      l.kcal += kcal; l.gramas += gramas;
    }
  }
  for (const l of acumulado.values()) {
    const g = grupos[l.cl];
    g.kcal += l.kcal; g.gramas += l.gramas;
    g.itens.push({ alimentoId: l.alimentoId, nome: l.nome, liquido: l.liquido, kcal: l.kcal, gramas: l.gramas });
  }
  for (const g of Object.values(grupos)) g.itens.sort((a, b) => b.kcal - a.kcal || b.gramas - a.gramas);
  const kcalClassificado = [1, 2, 3, 4].reduce((s, i) => s + grupos[i].kcal, 0);
  const gramasClassificado = [1, 2, 3, 4].reduce((s, i) => s + grupos[i].gramas, 0);
  const kcalTotal = kcalClassificado + grupos[0].kcal, gramasTotal = gramasClassificado + grupos[0].gramas;
  const dk = base === 'classificados' ? kcalClassificado : kcalTotal;
  const dg = base === 'classificados' ? gramasClassificado : gramasTotal;
  for (const g of Object.values(grupos)) {
    const fora = base === 'classificados' && g.id === 0;
    g.pctKcal = !fora && dk > 0 ? (100 * g.kcal) / dk : 0;
    g.pctGramas = !fora && dg > 0 ? (100 * g.gramas) / dg : 0;
  }
  return {
    kcalTotal, gramasTotal, kcalClassificado, gramasClassificado, base, grupos,
    pctSemClasse: { kcal: kcalTotal > 0 ? (100 * grupos[0].kcal) / kcalTotal : 0, gramas: gramasTotal > 0 ? (100 * grupos[0].gramas) / gramasTotal : 0 },
    temDados: kcalTotal > 0 || gramasTotal > 0,
  };
}

/** Percentuais inteiros (soma 100) na ordem [1, 2, 3, 4, 0] para a métrica 'kcal' ou 'gramas'. */
export function percentuaisInteiros(resumo, metrica = 'kcal') {
  const ids = resumo.base === 'classificados' ? [1, 2, 3, 4] : [1, 2, 3, 4, 0];
  const chave = metrica === 'gramas' ? 'gramas' : 'kcal';
  const arr = arredondarPercentuais(ids.map(i => resumo.grupos[i][chave]));
  const out = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  ids.forEach((i, k) => { out[i] = arr[k]; });
  return out;
}

/**
 * Resumo por dia para os relatórios. porDia: { 'AAAA-MM-DD': [refeicoes] }. Retorna lista ordenada por data:
 * [{ data, kcal, pct: { 0..4 } (inteiros, % das calorias do dia), pctUltra }]
 */
export function resumoNovaPorDia(porDia, opcoes = {}) {
  return Object.keys(porDia).sort().map(data => {
    const r = resumoNova(porDia[data], opcoes);
    const pct = percentuaisInteiros(r, 'kcal');
    return { data, kcal: r.kcalTotal, pct, pctUltra: r.kcalTotal > 0 ? (100 * r.grupos[4].kcal) / (r.base === 'classificados' ? r.kcalClassificado || 1 : r.kcalTotal) : 0, resumo: r };
  }).filter(d => d.kcal > 0);
}

/**
 * Texto curto de leitura do dia, sem julgamento. `quando`: 'hoje', 'ontem', 'neste dia'...
 * Retorna string, ou null quando não há calorias registradas.
 */
export function textoLeitura(resumo, { quando = 'hoje', metrica = 'kcal' } = {}) {
  if (!resumo || !resumo.temDados) return null;
  const p = percentuaisInteiros(resumo, metrica);
  const medida = metrica === 'gramas' ? 'do peso' : 'das calorias';
  const meta = 'a meta do Guia é priorizar alimentos in natura ou minimamente processados';
  let t = p[4] === 0 ? `Nenhum ultraprocessado ${quando}` : `${p[4]}% ${medida} ${quando === 'neste dia' ? 'do dia' : 'de ' + quando} vieram de ultraprocessados`;
  if (p[4] > 33 && metrica === 'kcal') t += ' (mais de um terço do dia)';
  t += `; ${meta} (eles somam ${p[1]}%).`;
  const sem = Math.round(resumo.pctSemClasse[metrica === 'gramas' ? 'gramas' : 'kcal']);
  if (sem > 0) t += ` ${sem}% sem classificação${resumo.base === 'classificados' ? ' ficou de fora da conta' : ''}.`;
  return t;
}
