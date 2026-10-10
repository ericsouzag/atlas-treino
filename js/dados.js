// Consultas e agregações sobre o store (usadas pelas telas).
import { store } from './store.js';
import { calcularMetas, totaisDoDia, composicao, idadeEm } from './nutrition.js';
import { alimentoPorId, nutrientesPara } from './foods.js';
import { dataISO, diaDoTs, somarDias } from './datas.js';

export const perfil = () => store.obterUnico('perfil') || {};
export const config = () => store.obterUnico('config') || {};
export const onboardingFeito = () => !!perfil().onbConcluido;

export function corpoOrdenado() {
  return store.listar('corpo').sort((a, b) => a.data.localeCompare(b.data) || (a._u - b._u));
}
export function ultimoCorpoCom(campo) {
  const l = corpoOrdenado().filter(r => r[campo] != null);
  return l.length ? l[l.length - 1] : null;
}
export function pesoAtual() {
  const r = ultimoCorpoCom('peso');
  return r ? r.peso : perfil().peso ?? null;
}
export function gorduraAtual() {
  const r = ultimoCorpoCom('gordura');
  return r ? r.gordura : perfil().gorduraInicial ?? null;
}

const METAS_PADRAO = { kcal: 2000, prot: 120, carb: 230, gord: 65, fibra: 28, agua: 2500, padrao: true, explicacao: ['Complete seu perfil para calcular metas personalizadas.'], avisos: [], tdee: null, tmb: null };

/** Metas atuais (calculadas do perfil + peso/%G atuais, com ajustes manuais opcionais) */
export function metas() {
  const p = perfil();
  const peso = pesoAtual();
  if (!p.sexo || !p.altura || !peso || !(p.nascimento || p.idade)) return METAS_PADRAO;
  const dias = diasTreinoPlano();
  const m = calcularMetas({ ...p, diasTreino: dias }, peso, gorduraAtual());
  const man = config().metasManuais;
  if (man) return { ...m, ...man, manual: true };
  return m;
}

export function diasTreinoPlano() {
  const pl = store.obterUnico('plano');
  const dias = pl?.config?.dias;
  if (dias) return dias.filter(Boolean).length;
  return perfil().diasTreinoDesejados ?? 3;
}

// ------- alimentação
export function refeicoesDoDia(data) {
  return store.listar('refeicoes', r => diaDoTs(r.ts) === data).sort((a, b) => a.ts.localeCompare(b.ts));
}
export function totaisData(data) { return totaisDoDia(refeicoesDoDia(data)); }

export function totaisPorDia(dias = 45, ate = dataISO()) {
  const mapa = {};
  const desde = somarDias(ate, -dias);
  for (const r of store.listar('refeicoes')) {
    const d = diaDoTs(r.ts);
    if (d < desde || d > ate) continue;
    (mapa[d] ||= []).push(r);
  }
  const out = {};
  for (const [d, lista] of Object.entries(mapa)) out[d] = totaisDoDia(lista);
  return out;
}

export function aguaDoDia(data) {
  const a = store.obter('agua', data);
  return a ? a.ml : 0;
}
export function setAgua(data, ml) { store.salvar('agua', { id: data, data, ml: Math.max(0, ml) }); }

/** Item de refeição calculado a partir do parser/edição */
export function montarItemRefeicao({ alimentoId, nome, gramas, unidadeTexto, quantidade }) {
  const a = alimentoId ? alimentoPorId(alimentoId) : null;
  if (!a) return { alimentoId: null, nome: nome || 'Item sem correspondência', gramas, kcal: 0, p: 0, c: 0, g: 0, f: 0, acucar: 0, ultra: false, bebidaAcucarada: false, unidadeTexto, quantidade };
  const n = nutrientesPara(a, gramas);
  return {
    alimentoId: a.id, nome: a.nome, gramas, unidadeTexto, quantidade, grupo: a.grupo, liquido: a.liquido,
    kcal: n.kcal, p: n.p, c: n.c, g: n.g, f: n.f, acucar: n.acucar, ultra: a.ultra, bebidaAcucarada: a.bebidaAcucarada,
  };
}

export function resumoItens(itens) {
  return itens.map(i => i.nome).join(', ');
}

// ------- corpo
export function composicaoAtual() {
  const peso = pesoAtual(), g = gorduraAtual();
  return peso != null && g != null ? { peso, gordura: g, ...composicao(peso, g) } : null;
}
export function primeiroRegistro() {
  const l = corpoOrdenado().filter(r => r.peso != null);
  return l.length ? l[0] : null;
}
export function idadeAtual() { return idadeEm(perfil().nascimento) ?? perfil().idade ?? null; }

// ------- atividades (cardio, esportes etc.)
export function atividadesDoDia(data) { return store.listar('atividades', a => diaDoTs(a.ts) === data).sort((a, b) => a.ts.localeCompare(b.ts)); }
export const kcalAtividades = (lista) => lista.reduce((s, a) => s + (a.kcal || 0), 0);

/** Gasto ativo do dia: treinos concluídos (musculação) + outras atividades */
export function gastoAtivoDoDia(data) {
  const t = treinosConcluidos().filter(x => x.data === data).reduce((s, x) => s + (x.kcal || 0), 0);
  const a = kcalAtividades(atividadesDoDia(data));
  return { treino: t, atividades: a, total: t + a };
}

// ------- treinos
export function treinosConcluidos() { return store.listar('treinos', t => t.concluido).sort((a, b) => a.data.localeCompare(b.data)); }
export function ultimoDesempenho(exId, antesDe = '9999') {
  const lista = treinosConcluidos().filter(t => t.data < antesDe).reverse();
  for (const t of lista) {
    const ex = (t.exercicios || []).find(e => e.exId === exId);
    const feitas = ex ? ex.series.filter(s => s.feito) : [];
    if (feitas.length) return { data: t.data, series: feitas };
  }
  return null;
}
