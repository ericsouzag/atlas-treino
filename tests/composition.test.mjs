import { teste, igual, perto, ok, fim } from './_t.mjs';
import * as C from '../js/composition.js';

console.log('p-ratio (metodologia)');
// Referências da metodologia 2.3 (sem Forbes: massaGorda omitida)
teste('déficit, treino 0, proteína 0,40 => 0,24 (cenário B)', () => perto(C.estimarPRatio({ balanco: -300, treino: 0, proteina: 0.40 }).p, 0.24, 1e-9));
teste('déficit, T=0,85 P=0,95 => 0,4225 (a fórmula; o doc arredondou para 0,35 por engano)', () => perto(C.estimarPRatio({ balanco: -200, treino: 0.85, proteina: 0.95 }).p, 0.4225, 1e-9));
teste('superávit 300, T=0,9 P=1 => 0,88 (cenário C)', () => perto(C.estimarPRatio({ balanco: 300, treino: 0.9, proteina: 1 }).p, 0.88, 1e-9));
teste('treino e proteína melhores aumentam p no déficit e no superávit', () => {
  ok(C.estimarPRatio({ balanco: -300, treino: 1, proteina: 1 }).p > C.estimarPRatio({ balanco: -300, treino: 0, proteina: 0 }).p);
  ok(C.estimarPRatio({ balanco: 300, treino: 1, proteina: 1 }).p > C.estimarPRatio({ balanco: 300, treino: 0, proteina: 0 }).p);
});
teste('déficit agressivo piora (p maior) e superávit enorme piora (p menor)', () => {
  ok(C.estimarPRatio({ balanco: -1000, treino: .5, proteina: .5 }).p > C.estimarPRatio({ balanco: -300, treino: .5, proteina: .5 }).p);
  ok(C.estimarPRatio({ balanco: 1000, treino: .5, proteina: .5 }).p < C.estimarPRatio({ balanco: 300, treino: .5, proteina: .5 }).p);
});
teste('Forbes: pessoa magra perde proporcionalmente mais massa magra no déficit', () => {
  const magro = C.estimarPRatio({ balanco: -400, treino: .6, proteina: .8, massaGorda: 8 }).p;
  const gordo = C.estimarPRatio({ balanco: -400, treino: .6, proteina: .8, massaGorda: 35 }).p;
  ok(magro > gordo, `${magro} vs ${gordo}`);
});
teste('p limitado entre 0,1 e 0,95', () => { const p = C.estimarPRatio({ balanco: 300, treino: 1, proteina: 1, massaGorda: 3 }).p; ok(p <= 0.95 && p >= 0.1); });

console.log('Simulação / projeção');
const perfil = { sexo: 'M', altura: 178, idade: 30, atividade: 'leve', experiencia: 'intermediario' };
const base = { perfil, peso: 80, gorduraPct: 25, protGPorKg: 2.0, treinoKcalDia: 250, sessoesSemana: 4, seriesSemana: 60 };
teste('déficit: perde peso, gordura cai mais que massa magra, % gordura cai', () => {
  const r = C.projetar({ ...base, ingestaoKcal: 2000 });
  const h = r.porHorizonte[12];
  ok(h.deltaPeso < 0, 'peso'); ok(h.deltaGordura < 0 && Math.abs(h.deltaGordura) > Math.abs(h.deltaMagra), 'fração');
  ok(h.central.pct < 25);
});
teste('superávit com treino: massa magra sobe, respeitando o teto biológico', () => {
  const r = C.projetar({ ...base, ingestaoKcal: 3000, gorduraPct: 15 });
  const h = r.porHorizonte[12];
  ok(h.deltaMagra > 0 && h.deltaMagra <= C.tetoGanhoMagraSemana(80, 'intermediario') * 12 * 1.5 + 0.01, 'magra ' + h.deltaMagra);
  ok(h.deltaPeso > 0);
});
teste('conservação de energia (déficit): energia perdida coerente com o balanço', () => {
  const r = C.simularComposicao({ ...base, ingestaoKcal: 2000, semanas: 8 });
  const p = r.pontos;
  const energia = (p[8].gordura - p[0].gordura) * C.RHO_GORDURA + (p[8].magra - p[0].magra) * C.RHO_MAGRA;
  ok(energia < 0 && Math.abs(energia) > 8 * 7 * 150, 'energia ' + energia);
});
teste('faixa de incerteza contém o valor central e tem largura', () => {
  const r = C.projetar({ ...base, ingestaoKcal: 2100 }); const h = r.porHorizonte[8];
  ok(h.peso[0] <= h.central.peso && h.central.peso <= h.peso[1]); ok(h.gordura[1] - h.gordura[0] > 0.1);
});

console.log('Análise com dados reais, tendência e platô');
const hoje = '2026-10-09';
function dias(n, kcal = 2000, p = 160) { const o = {}; for (let i = 0; i < n; i++) { const d = new Date('2026-10-09T12:00:00'); d.setDate(d.getDate() - i); o[d.toISOString().slice(0, 10)] = { kcal, p, c: 200, g: 60, f: 25 }; } return o; }
const perfilA = { sexo: 'M', nascimento: '1996-05-01', altura: 178, atividade: 'leve', objetivo: 'perder', experiencia: 'intermediario' };
teste('sem dados: lista o que falta', () => {
  const a = C.analisarComposicao({ perfil: perfilA, corpo: [], totaisPorDia: {}, treinos: [], hoje });
  ok(a.faltando.length >= 2); igual(a.projecao, null);
});
teste('com dados: projeta e compara observado', () => {
  const corpo = [{ data: '2026-09-01', peso: 82, gordura: 26 }, { data: '2026-10-08', peso: 80.5, gordura: 24.5 }];
  const treinos = Array.from({ length: 8 }, (_, i) => ({ concluido: true, data: `2026-10-0${i + 1}`, kcal: 250, duracaoMin: 60, exercicios: [{ series: Array(20).fill({ feito: true, carga: 40, reps: 10 }) }] }));
  const a = C.analisarComposicao({ perfil: perfilA, corpo, totaisPorDia: dias(10), treinos, hoje });
  ok(a.projecao, 'projecao'); ok(a.observado && a.observado.medido); ok(a.observado.dGordura < 0);
  igual(a.treino.sessoes, 8);
});
teste('platô: peso estável por 3 semanas em objetivo perder', () => {
  const corpo = [0, 5, 10, 15, 20].map(i => { const d = new Date('2026-10-09T12:00:00'); d.setDate(d.getDate() - i); return { data: d.toISOString().slice(0, 10), peso: 80 + (i % 2 ? 0.1 : -0.1) }; });
  ok(C.detectarPlato(corpo, 'perder', hoje).plato);
  igual(C.detectarPlato(corpo, 'manter', hoje).plato, false);
});
teste('sem platô quando o peso cai ~0,7 kg/semana', () => {
  const corpo = [0, 5, 10, 15, 20].map(i => { const d = new Date('2026-10-09T12:00:00'); d.setDate(d.getDate() - i); return { data: d.toISOString().slice(0, 10), peso: 80 + i * 0.1 }; });
  igual(C.detectarPlato(corpo, 'perder', hoje).plato, false);
});
teste('calibração: balança estável + déficit registrado grande => projeção usa a média e avisa', () => {
  const corpo = [20, 14, 8, 2, 0].map((i, k) => { const d = new Date('2026-10-09T12:00:00'); d.setDate(d.getDate() - i); return { data: d.toISOString().slice(0, 10), peso: 80 + (k % 2) * 0.1, gordura: 22 }; });
  const a = C.analisarComposicao({ perfil: perfilA, corpo, totaisPorDia: dias(14, 1500, 150), treinos: [], hoje });
  ok(a.calibrado, 'calibrado'); ok(a.calibrado.saldoUsado > a.calibrado.saldoRegistrado, 'usa saldo menos negativo que o registrado');
  const sem = C.projetar({ perfil: { sexo: 'M', altura: 178, idade: 30, atividade: 'leve', experiencia: 'intermediario' }, peso: 80, gorduraPct: 22, ingestaoKcal: 1500, protGPorKg: 1.9, treinoKcalDia: 0, sessoesSemana: 0, seriesSemana: 0 });
  ok(a.projecao.porHorizonte[12].deltaPeso > sem.porHorizonte[12].deltaPeso, 'projeção calibrada perde menos peso');
});
teste('atividades (cardio) entram como gasto, mas não como estímulo de treino', () => {
  const corpo = [{ data: '2026-09-01', peso: 82, gordura: 26 }, { data: '2026-10-08', peso: 81, gordura: 25 }];
  const ativ = Array.from({ length: 6 }, (_, i) => ({ ts: `2026-10-0${i + 1}T07:00:00`, kcal: 500 }));
  const sem = C.analisarComposicao({ perfil: perfilA, corpo, totaisPorDia: dias(10), treinos: [], atividades: [], hoje });
  const com = C.analisarComposicao({ perfil: perfilA, corpo, totaisPorDia: dias(10), treinos: [], atividades: ativ, hoje });
  ok(com.treino.treinoKcalDia > sem.treino.treinoKcalDia, 'gasto sobe'); igual(com.treino.sessoes, 0); igual(com.treino.series, 0);
  ok(com.balanco.gasto > sem.balanco.gasto, 'balanço usa o gasto das atividades');
  igual(com.projecao.treino, sem.projecao.treino, 'estímulo de treino não muda com cardio');
});
teste('Forbes e teto', () => { perto(C.fracaoForbes(20), 10.4 / 30.4, 1e-9); ok(C.tetoGanhoMagraSemana(80, 'iniciante') > C.tetoGanhoMagraSemana(80, 'avancado')); });
fim();
