// Preenchimento automático de dias sem registro: funções puras de js/preenchimento-automatico.js.
import { teste, igual, perto, ok, fim } from './_t.mjs';
import {
  planejarPreenchimento, aplicarMarcas, diasCandidatos, primeiroRegistroReal, lerAuto, idsAutomaticos, diasDoLote, fracaoDiasEstimados, podarMarcas,
  ehEstimado, ehAutomatico, contaParaGamificacao, montarTreinoEstimado, treinoProgramado, ORIGEM_ESTIMADO, MODO_AUTOMATICO, JANELA_AUTO,
} from '../js/preenchimento-automatico.js';

const HOJE = '2026-11-19';
const p2 = n => String(n).padStart(2, '0');
const somar = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const dow = iso => new Date(iso + 'T12:00:00').getDay();
let seq = 0;
const real = (dia, kcal, extra = {}) => [
  { id: `r${++seq}`, ts: `${dia}T08:00:00`, tipo: 'Café da manhã', itens: [{ nome: 'Pão', gramas: 100, kcal: kcal * 0.3, p: 10, c: 40, g: 5, f: 1 }], ...extra },
  { id: `r${++seq}`, ts: `${dia}T12:30:00`, tipo: 'Almoço', itens: [{ nome: 'Arroz', gramas: 150, kcal: kcal * 0.7, p: 20, c: 80, g: 10, f: 2 }], ...extra },
];
// 8 dias reais de hoje-13 a hoje-6 (sempre completos), deixando hoje-5..hoje-1 sem registro
const KC = [2000, 2100, 1900, 2050, 1950, 2100, 2000, 1980];
const historico = () => KC.flatMap((k, i) => real(somar(HOJE, -13 + i), k));
const cfg = (extra = {}) => ({ auto: { ativo: true, alimentacao: true, treino: true, ativadoEm: somar(HOJE, -13), processados: {}, ...extra } });
const planoTodos = () => ({ plano: { dias: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, { titulo: `Treino ${d}`, exercicios: [{ exId: 'supino', series: 3, reps: '8-12', descanso: 90 }, { exId: 'remada', series: 4, reps: '8-12', descanso: 90 }] }])) } });
const plan = (o = {}) => planejarPreenchimento({ hoje: HOJE, config: cfg(), refeicoes: historico(), treinos: [], atividades: [], plano: null, peso: 80, lote: 'LA', ...o });

console.log('Alimentação');
teste('dia sem nada de comida recebe o "Dia normal" marcado como estimado/automático', () => {
  const r = plan();
  const dias = [...new Set(r.refeicoes.map(l => l.ts.slice(0, 10)))].sort();
  igual(dias.join(), [-5, -4, -3, -2, -1].map(n => somar(HOJE, n)).join());
  for (const l of r.refeicoes) { igual(l.origem, ORIGEM_ESTIMADO); igual(l.estimadoModo, MODO_AUTOMATICO); igual(l.estimadoLote, 'LA'); ok(!('id' in l)); }
  const doDia = r.refeicoes.filter(l => l.ts.startsWith(somar(HOJE, -1)));
  const kcal = doDia.reduce((s, l) => s + l.itens.reduce((a, i) => a + i.kcal, 0), 0);
  perto(kcal, 2010, 60, 'perto da média dos dias reais'); ok(doDia.length === 2);
  igual(r.marcas[somar(HOJE, -1)].alim, 'gerado'); igual(r.marcas[somar(HOJE, -10)].alim, 'registrado');
});
teste('dia com UM lançamento pequeno já é "registrado": não é preenchido', () => {
  const peq = { id: 'p1', ts: `${somar(HOJE, -2)}T10:00:00`, tipo: 'Café da manhã', itens: [{ nome: 'Café', gramas: 100, kcal: 5, p: 0, c: 1, g: 0, f: 0 }] };
  const r = plan({ refeicoes: [...historico(), peq] });
  ok(!r.refeicoes.some(l => l.ts.startsWith(somar(HOJE, -2)))); igual(r.marcas[somar(HOJE, -2)].alim, 'registrado');
  ok(r.refeicoes.some(l => l.ts.startsWith(somar(HOJE, -1))), 'os outros dias sem nada continuam sendo preenchidos');
});
teste('hoje (e o futuro) nunca são preenchidos', () => {
  const r = plan();
  ok(!r.refeicoes.some(l => l.ts.slice(0, 10) >= HOJE)); ok(!(HOJE in r.marcas));
  igual(diasCandidatos({ hoje: HOJE, auto: cfg().auto, primeiro: somar(HOJE, -13) }).pop(), somar(HOJE, -1));
});
teste('olha no máximo 14 dias para trás', () => {
  const c = diasCandidatos({ hoje: HOJE, auto: { ativo: true, ativadoEm: somar(HOJE, -60) }, primeiro: somar(HOJE, -90) });
  igual(c[0], somar(HOJE, -JANELA_AUTO)); igual(c.length, JANELA_AUTO);
});
teste('nunca antes do primeiro registro real nem antes de o recurso ser ligado', () => {
  const c1 = diasCandidatos({ hoje: HOJE, auto: { ativo: true, ativadoEm: somar(HOJE, -60) }, primeiro: somar(HOJE, -4) });
  igual(c1[0], somar(HOJE, -4)); igual(c1.length, 4);
  const c2 = diasCandidatos({ hoje: HOJE, auto: { ativo: true, ativadoEm: somar(HOJE, -2) }, primeiro: somar(HOJE, -10) });
  igual(c2[0], somar(HOJE, -2));
  igual(diasCandidatos({ hoje: HOJE, auto: { ativo: true, ativadoEm: null }, primeiro: somar(HOJE, -3) }).length, 0, 'sem data de ativação nada roda');
  igual(diasCandidatos({ hoje: HOJE, auto: { ativo: true, ativadoEm: somar(HOJE, -3) }, primeiro: null }).length, 0, 'sem registro real nada roda');
  igual(primeiroRegistroReal({ refeicoes: real('2026-11-01', 2000, { origem: ORIGEM_ESTIMADO }), treinos: [], atividades: [] }), null, 'estimados não contam como primeiro registro');
});
teste('sem o mínimo de 5 dias reais de histórico: não faz nada e não marca (tenta de novo depois)', () => {
  const pouco = [-8, -7, -6, -5].flatMap((n, i) => real(somar(HOJE, n), 2000));   // só 4 dias reais
  const r = plan({ refeicoes: pouco, config: cfg({ ativadoEm: somar(HOJE, -8) }) });
  igual(r.refeicoes.length, 0);
  ok(!Object.values(r.marcas).some(m => m.alim === 'gerado'));
  ok(!(somar(HOJE, -1) in r.marcas) || r.marcas[somar(HOJE, -1)].alim === undefined, 'dia sem dados suficientes fica sem marca');
});
teste('idempotente: aplicar as marcas e rodar de novo não duplica nada', () => {
  const c1 = cfg(), r1 = plan({ config: c1 });
  const c2 = { auto: aplicarMarcas(lerAuto(c1), r1.marcas) };
  const r2 = plan({ config: c2, refeicoes: [...historico(), ...r1.refeicoes.map((l, i) => ({ ...l, id: 'g' + i }))] });
  igual(r2.refeicoes.length, 0); igual(r2.treinos.length, 0);
  igual(plan({ config: c1 }).refeicoes.length, r1.refeicoes.length, 'a mesma entrada dá o mesmo plano (função pura)');
});
teste('respeita "ignorado": dia já processado cujo lançamento estimado foi apagado NÃO é recriado', () => {
  const dia = somar(HOJE, -1);
  const c = cfg({ processados: { [dia]: { alim: 'gerado' } } });
  // o estimado foi apagado (tombstone só guarda id/_d/_u) e o dia está vazio de novo
  const r = plan({ config: { auto: c.auto }, refeicoes: [...historico(), { id: 'gx', _d: true, _u: 1 }] });
  ok(!r.refeicoes.some(l => l.ts.startsWith(dia)), 'não recria'); ok(r.refeicoes.some(l => l.ts.startsWith(somar(HOJE, -2))), 'os demais seguem');
});
teste('estimados (automáticos ou manuais) não entram no histórico das médias', () => {
  const a = plan();
  const geradas = a.refeicoes.map((l, i) => ({ ...l, id: 'g' + i, itens: l.itens.map(x => ({ ...x, kcal: x.kcal * 5 })) }));
  const b = plan({ refeicoes: [...historico(), ...geradas.filter(g => g.ts.startsWith(somar(HOJE, -5)))], config: cfg({ processados: { [somar(HOJE, -5)]: { alim: 'gerado' } } }) });
  const k = r => r.refeicoes.filter(l => l.ts.startsWith(somar(HOJE, -1))).reduce((s, l) => s + l.itens.reduce((x, i) => x + i.kcal, 0), 0);
  perto(k(a), k(b), 1);
});
teste('recurso desligado, ou só uma das partes ligada', () => {
  igual(plan({ config: cfg({ ativo: false }), plano: planoTodos() }).refeicoes.length, 0);
  const so = plan({ config: cfg({ alimentacao: false }), plano: planoTodos() }); igual(so.refeicoes.length, 0); ok(so.treinos.length > 0);
  const so2 = plan({ config: cfg({ treino: false }), plano: planoTodos() }); ok(so2.refeicoes.length > 0); igual(so2.treinos.length, 0);
});

console.log('\nTreino');
teste('sem ficha ativa: não faz nada de treino', () => {
  const r = plan({ plano: null }); igual(r.treinos.length, 0); igual(r.marcas[somar(HOJE, -1)].treino, 'sem-ficha');
  igual(plan({ plano: { plano: null } }).treinos.length, 0);
});
teste('com ficha: só nos dias da semana programados, sem treino concluído nem atividade no dia', () => {
  const alvo = somar(HOJE, -3);
  const plano = { plano: { dias: { [dow(alvo)]: { titulo: 'Peito e tríceps', exercicios: [{ exId: 'supino', series: 3, reps: '8-12', descanso: 90 }] } } } };
  const r = plan({ plano, peso: 80 });
  igual(r.treinos.length, 2, 'o mesmo dia da semana aparece 2 vezes na janela'); const t = r.treinos.find(x => x.data === alvo);
  igual(t.data, alvo); igual(t.titulo, 'Peito e tríceps'); igual(t.concluido, true); igual(t.origem, ORIGEM_ESTIMADO); igual(t.estimadoModo, MODO_AUTOMATICO); igual(t.mets, 4.5);
  igual(t.exercicios[0].series.length, 3); ok(t.exercicios[0].series.every(s => s.feito && s.carga === null), 'séries nominais, sem cargas inventadas');
  perto(t.kcal, Math.round(3.5 * 80 * t.duracaoMin / 60), 1); igual(t.diaPlano, dow(alvo));
  igual(r.marcas[alvo].treino, 'gerado'); igual(r.marcas[somar(HOJE, -2)].treino, 'sem-programado');
  // se já fez treino ou atividade nesse dia, não gera
  const feito = { id: 't1', data: alvo, concluido: true, titulo: 'x', kcal: 300 }, atv = { id: 'a1', ts: `${alvo}T18:00:00`, kcal: 200 };
  ok(!plan({ plano, treinos: [feito] }).treinos.some(x => x.data === alvo)); ok(!plan({ plano, atividades: [atv] }).treinos.some(x => x.data === alvo));
  igual(plan({ plano, treinos: [feito] }).marcas[alvo].treino, 'registrado');
});
teste('montarTreinoEstimado / treinoProgramado usam o dia da semana da ficha', () => {
  const plano = planoTodos();
  igual(treinoProgramado(plano, '2026-11-18').titulo, `Treino ${dow('2026-11-18')}`); igual(treinoProgramado(null, '2026-11-18'), null);
  const t = montarTreinoEstimado({ dia: '2026-11-18', programado: plano.plano.dias[3], peso: 70, lote: 'z' });
  igual(t.exercicios.length, 2); ok(t.duracaoMin >= 10); igual(t.estimadoLote, 'z');
});

console.log('\nTransparência e desfazer');
teste('ehEstimado / contaParaGamificacao: estimados (automáticos ou manuais) nunca contam para XP, streaks, conquistas ou metas', () => {
  const auto = { id: 'a', origem: ORIGEM_ESTIMADO, estimadoModo: MODO_AUTOMATICO }, manual = { id: 'm', origem: ORIGEM_ESTIMADO, estimadoModo: 'acima' }, normal = { id: 'n', ts: '2026-11-01T08:00:00' };
  ok(ehEstimado(auto) && ehEstimado(manual) && !ehEstimado(normal) && !ehEstimado(null));
  ok(!contaParaGamificacao(auto) && !contaParaGamificacao(manual) && contaParaGamificacao(normal));
  ok(ehAutomatico(auto) && !ehAutomatico(manual) && !ehAutomatico(normal));
  const r = plan({ plano: planoTodos() });
  ok(r.refeicoes.every(x => !contaParaGamificacao(x)) && r.treinos.every(x => !contaParaGamificacao(x)));
});
teste('desfazer: idsAutomaticos pega só os automáticos (do lote ou todos), nunca reais nem manuais', () => {
  const r = plan({ plano: planoTodos() });
  const rs = r.refeicoes.map((l, i) => ({ ...l, id: 'g' + i })), ts = r.treinos.map((t, i) => ({ ...t, id: 't' + i }));
  const manual = real(somar(HOJE, -20), 2000, { origem: ORIGEM_ESTIMADO, estimadoModo: 'abaixo', estimadoLote: 'M' }), reais = historico();
  const ids = idsAutomaticos({ refeicoes: [...reais, ...manual, ...rs], treinos: ts });
  igual(ids.refeicoes.length, rs.length); igual(ids.treinos.length, ts.length); ok(!ids.refeicoes.some(id => reais.some(x => x.id === id) || manual.some(x => x.id === id)));
  igual(idsAutomaticos({ refeicoes: rs, treinos: ts }, 'outro').refeicoes.length, 0); igual(idsAutomaticos({ refeicoes: rs, treinos: ts }, 'LA').refeicoes.length, rs.length);
  igual(diasDoLote({ refeicoes: rs, treinos: ts }, 'LA').length, 13, '5 dias de comida dentro de 13 de treino');
});
teste('fracaoDiasEstimados: confiança da previsão cai quando passa de 20% dos últimos 30 dias', () => {
  const doze = Array.from({ length: 7 }, (_, i) => real(somar(HOJE, -i - 1), 2000, { origem: ORIGEM_ESTIMADO, estimadoModo: MODO_AUTOMATICO })).flat();
  const a = fracaoDiasEstimados({ refeicoes: doze, treinos: [], hoje: HOJE });
  igual(a.dias, 7); perto(a.fracao, 7 / 30, 1e-9); igual(a.baixaConfianca, true);
  const b = fracaoDiasEstimados({ refeicoes: doze.slice(0, 8), treinos: [], hoje: HOJE }); igual(b.dias, 4); igual(b.baixaConfianca, false);
  igual(fracaoDiasEstimados({ refeicoes: [], treinos: [], hoje: HOJE }).fracao, 0);
});
teste('lerAuto: padrões (ligado) e poda das marcas antigas', () => {
  const a = lerAuto(null); igual(a.ativo, true); igual(a.alimentacao, true); igual(a.treino, true); igual(a.ativadoEm, null);
  const p = podarMarcas({ ...a, processados: { '2026-01-01': { alim: 'gerado' }, [somar(HOJE, -3)]: { alim: 'gerado' } } }, HOJE);
  igual(Object.keys(p.processados).join(), somar(HOJE, -3));
});
fim();
