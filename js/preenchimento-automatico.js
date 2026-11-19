// Preenchimento automático de dias sem registro (v1.11): funções PURAS e testadas (tests/preenchimento-automatico.test.mjs).
// O que roda ao abrir o app está em js/preenchimento-auto.js; a tela de Ajustes em views/config.js.
//
// DECISÕES (também mostradas em Ajustes e no README)
//  1. Quando: só dias ANTERIORES a hoje, no máximo 14 dias para trás, nunca antes do primeiro registro real da pessoa nem antes da
//     data em que o recurso foi ligado (auto.ativadoEm). Cada dia é avaliado UMA vez por tipo (auto.processados[dia]): rodar de novo não
//     duplica, e se a pessoa apagar o lançamento estimado ele NÃO volta. Sem histórico suficiente o dia não é marcado (tenta de novo depois).
//  2. Alimentação: dia sem NENHUM lançamento de comida (real ou estimado) recebe o "Dia normal" de js/dia-estimado.js (média dos dias reais
//     elegíveis, quantidades escaladas), com o mínimo de 5 dias reais; sem isso não faz nada. Qualquer lançamento real, mesmo pequeno, conta
//     como "registrado" e o dia não é tocado (completar até o alvo continua só no botão manual "Registrar um dia inteiro").
//  3. Treino: só com ficha (plano) e treino programado para aquele dia da semana, sem treino concluído nem atividade no dia: cria o treino
//     programado como concluído-estimado (séries nominais, gasto por MET 4,5 como no "treino programado feito"). Sem ficha, não faz nada.
//  4. Transparência: tudo leva origem 'dia-estimado' + estimadoModo 'automatico' (+ selo "estimado"); nunca entra no histórico das médias e
//     NUNCA conta para XP, streaks, conquistas ou metas batidas: use `contaParaGamificacao(item)` / `ehEstimado(item)`.
//  5. Previsão: os dias automáticos contam normalmente, mas a nota de confiança cai quando mais de 20% dos últimos 30 dias são estimados.
import { preverDia, ehEstimado, ORIGEM_ESTIMADO } from './dia-estimado.js';
import { kcalTreino, duracaoEstimada } from './nutrition.js';

export { ehEstimado, ORIGEM_ESTIMADO };
export const MODO_AUTOMATICO = 'automatico';
export const JANELA_AUTO = 14;
export const LIMITE_CONFIANCA = 0.2;
export const MET_TREINO = 4.5;

/** Estimativas (inclusive as automáticas) nunca contam para XP, sequências (streaks), conquistas ou metas batidas */
export const contaParaGamificacao = item => !ehEstimado(item);
/** Foi gerado pelo preenchimento automático (e não pelo botão manual)? */
export const ehAutomatico = item => ehEstimado(item) && item.estimadoModo === MODO_AUTOMATICO;

export const AUTO_PADRAO = { ativo: true, alimentacao: true, treino: true, ativadoEm: null, processados: {}, explicado: false, ultimo: null };
/** Configuração com padrões (ligado por padrão, como o Eric pediu); `config` é o singleton 'config' do store */
export function lerAuto(config) {
  const a = (config && config.auto) || {};
  return { ...AUTO_PADRAO, ...a, processados: { ...(a.processados || {}) } };
}

const p2 = n => String(n).padStart(2, '0');
const somarDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const diaDoTs = ts => String(ts).slice(0, 10);
const diaSemana = iso => new Date(iso + 'T12:00:00').getDay();
const vivo = x => x && !x._d;

/** Data (AAAA-MM-DD) do primeiro registro REAL (refeição, treino concluído ou atividade); estimados não contam. null se não há */
export function primeiroRegistroReal({ refeicoes = [], treinos = [], atividades = [] }) {
  const datas = [
    ...refeicoes.filter(r => vivo(r) && r.ts && !ehEstimado(r)).map(r => diaDoTs(r.ts)),
    ...treinos.filter(t => vivo(t) && t.concluido && t.data && !ehEstimado(t)).map(t => t.data),
    ...atividades.filter(a => vivo(a) && a.ts && !ehEstimado(a)).map(a => diaDoTs(a.ts)),
  ];
  return datas.length ? datas.sort()[0] : null;
}

/** Dias a avaliar: de max(hoje-14, ativadoEm, primeiro registro real) até ontem, em ordem. Nunca hoje nem futuro. */
export function diasCandidatos({ hoje, auto, primeiro }) {
  if (!auto || !auto.ativo || !auto.ativadoEm || !primeiro) return [];
  const ini = [somarDias(hoje, -JANELA_AUTO), auto.ativadoEm, primeiro].sort().pop();
  const out = [];
  for (let d = ini; d < hoje; d = somarDias(d, 1)) out.push(d);
  return out;
}

/** Treino programado da ficha para aquele dia (ou null) */
export const treinoProgramado = (plano, dia) => (plano && plano.plano && plano.plano.dias && plano.plano.dias[diaSemana(dia)]) || null;

/** Registro de treino "concluído-estimado" a partir do treino programado (séries nominais, sem cargas) */
export function montarTreinoEstimado({ dia, programado, peso = 70, lote }) {
  const exercicios = (programado.exercicios || []).map(it => ({ exId: it.exId, descanso: it.descanso, reps: it.reps, series: Array.from({ length: it.series || 0 }, () => ({ carga: null, reps: null, rpe: null, feito: true })) }));
  const feitas = exercicios.reduce((s, e) => s + e.series.length, 0);
  const dur = Math.max(10, duracaoEstimada(feitas || 1, 90));
  return {
    data: dia, diaPlano: diaSemana(dia), titulo: programado.titulo, concluido: true, duracaoMin: dur, mets: MET_TREINO,
    kcal: Math.round(kcalTreino(peso, dur, MET_TREINO)), exercicios, origem: ORIGEM_ESTIMADO, parcial: false,
    estimadoModo: MODO_AUTOMATICO, estimadoLote: lote, fim: new Date(dia + 'T20:00:00').getTime(),
  };
}

/**
 * Planeja o preenchimento (sem gravar nada).
 * @returns {{refeicoes:object[], treinos:object[], marcas:Object<string,{alim?:string,treino?:string}>, dias:{dia:string, tipo:'alimentacao'|'treino'}[]}}
 */
export function planejarPreenchimento({ hoje, config, refeicoes = [], treinos = [], atividades = [], plano = null, peso = 70, lote = 'auto' }) {
  const auto = lerAuto(config), vazio = { refeicoes: [], treinos: [], marcas: {}, dias: [] };
  const primeiro = primeiroRegistroReal({ refeicoes, treinos, atividades });
  const cand = diasCandidatos({ hoje, auto, primeiro });
  if (!cand.length) return vazio;
  const out = { refeicoes: [], treinos: [], marcas: {}, dias: [] };
  const marcar = (dia, k, v) => { (out.marcas[dia] ||= {})[k] = v; };
  for (const dia of cand) {
    const proc = auto.processados[dia] || {};
    if (auto.alimentacao && !proc.alim) {
      const jaTem = refeicoes.some(r => vivo(r) && r.ts && diaDoTs(r.ts) === dia);
      if (jaTem) marcar(dia, 'alim', 'registrado');
      else {
        const prev = preverDia({ refeicoes, dia, modo: 'normal', lote });
        if (prev.ok && !prev.semGeracao && prev.lancamentos.length) {
          for (const l of prev.lancamentos) out.refeicoes.push({ ...l, estimadoModo: MODO_AUTOMATICO, estimadoBase: 'normal' });
          marcar(dia, 'alim', 'gerado'); out.dias.push({ dia, tipo: 'alimentacao' });
        }   // sem histórico mínimo: não finge e não marca (tenta de novo quando houver dados)
      }
    }
    if (auto.treino && !proc.treino) {
      const fez = treinos.some(t => vivo(t) && t.concluido && t.data === dia) || atividades.some(a => vivo(a) && a.ts && diaDoTs(a.ts) === dia);
      if (fez) marcar(dia, 'treino', 'registrado');
      else if (!plano || !plano.plano) marcar(dia, 'treino', 'sem-ficha');
      else {
        const prog = treinoProgramado(plano, dia);
        if (!prog) marcar(dia, 'treino', 'sem-programado');
        else { out.treinos.push(montarTreinoEstimado({ dia, programado: prog, peso, lote })); marcar(dia, 'treino', 'gerado'); out.dias.push({ dia, tipo: 'treino' }); }
      }
    }
  }
  return out;
}

/** Aplica as marcas ao estado `auto` (sem mutar) */
export function aplicarMarcas(auto, marcas) {
  const processados = { ...auto.processados };
  for (const [dia, m] of Object.entries(marcas || {})) processados[dia] = { ...(processados[dia] || {}), ...m };
  return { ...auto, processados };
}

/** Descarta marcas de dias fora da janela de interesse (mantém o estado pequeno) */
export function podarMarcas(auto, hoje, folga = 30) {
  const corte = somarDias(hoje, -(JANELA_AUTO + folga)), processados = {};
  for (const [d, m] of Object.entries(auto.processados || {})) if (d >= corte) processados[d] = m;
  return { ...auto, processados };
}

/** Ids dos registros automáticos (refeições e treinos), opcionalmente só de um lote, para "Desfazer" */
export function idsAutomaticos({ refeicoes = [], treinos = [] }, lote = null) {
  const sel = x => vivo(x) && ehAutomatico(x) && (!lote || x.estimadoLote === lote);
  return { refeicoes: refeicoes.filter(sel).map(r => r.id), treinos: treinos.filter(sel).map(t => t.id) };
}

/** Datas dos dias com algo automático num lote (para o aviso "Preenchemos N dias") */
export function diasDoLote({ refeicoes = [], treinos = [] }, lote) {
  const s = new Set();
  for (const r of refeicoes) if (vivo(r) && ehAutomatico(r) && r.estimadoLote === lote) s.add(diaDoTs(r.ts));
  for (const t of treinos) if (vivo(t) && ehAutomatico(t) && t.estimadoLote === lote) s.add(t.data);
  return [...s].sort();
}

/** Fração dos últimos `janela` dias que têm algum registro estimado (refeição ou treino); a previsão perde confiança acima de 20% */
export function fracaoDiasEstimados({ refeicoes = [], treinos = [], hoje, janela = 30 }) {
  const ini = somarDias(hoje, -(janela - 1)), dias = new Set();
  for (const r of refeicoes) if (vivo(r) && ehEstimado(r) && r.ts) { const d = diaDoTs(r.ts); if (d >= ini && d <= hoje) dias.add(d); }
  for (const t of treinos) if (vivo(t) && ehEstimado(t) && t.data && t.data >= ini && t.data <= hoje) dias.add(t.data);
  return { dias: dias.size, fracao: dias.size / janela, baixaConfianca: dias.size / janela > LIMITE_CONFIANCA };
}
