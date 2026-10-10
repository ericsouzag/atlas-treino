import { teste, igual, perto, ok, fim } from './_t.mjs';
import * as A from '../js/atividades.js';
import * as C from '../js/composition.js';
import { store } from '../js/store.js';
import { gastoAtivoDoDia } from '../js/dados.js';

console.log('Catálogo completo de atividades, balanço do dia e estímulo de força');
const casos = [];
for (const [id, a] of Object.entries(A.ATIVIDADES)) for (const [inten] of a.intensidades) {
  const vars = a.variacoes ? Object.keys(a.variacoes) : a.estilos ? Object.keys(a.estilos) : [null];
  for (const v of vars) {
    casos.push({ atividade: id, intensidade: inten, variacao: a.variacoes ? v : undefined, estilo: a.estilos ? v : undefined });
    if (a.tipo === 'bike') casos.push({ atividade: id, intensidade: inten, indoor: true });
    if (a.terreno) casos.push({ atividade: id, intensidade: inten, terrenoSubida: true });
  }
}
const hojeIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

teste('pilates e crossfit existem, e yoga ficou separada', () => {
  ok(A.ATIVIDADES.pilates && A.ATIVIDADES.crossfit && A.ATIVIDADES.yoga); igual(A.ATIVIDADES.yoga.nome, 'Yoga');
  ok(Object.keys(A.ATIVIDADES.pilates.variacoes).length >= 3);
  ok(A.ATIVIDADES.crossfit.variacoes.wod && A.ATIVIDADES.crossfit.variacoes.amrap && A.ATIVIDADES.crossfit.variacoes.emom && A.ATIVIDADES.crossfit.variacoes.forca && A.ATIVIDADES.crossfit.variacoes.tecnica);
});
teste('MET de referência: pilates 3,0 a 4,0 (aparelhos 3,0 a 3,8); crossfit 6 a 12', () => {
  perto(A.metDaAtividade({ atividade: 'pilates', intensidade: 'leve', variacao: 'mat' }), 3.0, 1e-9);
  perto(A.metDaAtividade({ atividade: 'pilates', intensidade: 'intensa', variacao: 'mat' }), 4.0, 1e-9);
  for (const v of ['reformer', 'cadillac']) for (const i of ['leve', 'moderada', 'intensa']) { const m = A.metDaAtividade({ atividade: 'pilates', intensidade: i, variacao: v }); ok(m >= 3.0 && m <= 3.8, v + i + m); }
  perto(A.metDaAtividade({ atividade: 'crossfit', intensidade: 'leve', variacao: 'wod' }), 8.0, 1e-9);
  perto(A.metDaAtividade({ atividade: 'crossfit', intensidade: 'intensa', variacao: 'wod' }), 12, 1e-9);
  ok(A.metDaAtividade({ atividade: 'crossfit', intensidade: 'leve', variacao: 'forca' }) >= 6);
});
teste('TODAS as atividades do catálogo geram kcal > 0 e entram no total do dia', () => {
  store._reset(); const iso = hojeIso(); let soma = 0;
  ok(casos.length > 60, 'casos ' + casos.length);
  casos.forEach((c, i) => {
    const r = A.calcularAtividade({ ...c, durMin: 40 }, 75);
    ok(r.kcal > 0, JSON.stringify(c)); ok(r.met >= 1.5 && r.met <= 20, JSON.stringify(c) + ' ' + r.met);
    soma += Math.round(r.kcal);
    store.salvar('atividades', { id: 'a' + i, ts: iso + 'T07:00:00', atividade: c.atividade, durMin: 40, kcal: Math.round(r.kcal) });
  });
  igual(gastoAtivoDoDia(iso).atividades, soma); ok(gastoAtivoDoDia(iso).total > 0);
});
teste('duração 0 não gera kcal', () => { for (const c of casos.slice(0, 20)) igual(A.calcularAtividade({ ...c, durMin: 0 }, 75).kcal, 0); });
teste('crossfit e pilates dão pouco estímulo de força; cardio e yoga não', () => {
  ok(A.seriesEquivalentes('crossfit', 60) > A.seriesEquivalentes('pilates', 60)); ok(A.seriesEquivalentes('pilates', 60) > 0);
  igual(A.seriesEquivalentes('corrida', 60), 0); igual(A.seriesEquivalentes('yoga', 60), 0); ok(A.seriesEquivalentes('crossfit', 60) < 12, 'não infla');
});
teste('previsão: forcaEq aumenta o estímulo, com teto de 30 séries equivalentes', () => {
  const hoje = '2026-10-09'; const corpo = [{ data: '2026-09-01', peso: 82, gordura: 26 }, { data: '2026-10-08', peso: 81, gordura: 25 }];
  const dias = {}; for (let i = 0; i < 10; i++) { const d = new Date('2026-10-09T12:00:00'); d.setDate(d.getDate() - i); dias[d.toISOString().slice(0, 10)] = { kcal: 2000, p: 150, c: 200, g: 60, f: 25 }; }
  const perfil = { sexo: 'M', nascimento: '1996-05-01', altura: 178, atividade: 'leve', objetivo: 'recomp', experiencia: 'intermediario' };
  const base = C.analisarComposicao({ perfil, corpo, totaisPorDia: dias, treinos: [], atividades: [], hoje });
  const cf = Array.from({ length: 4 }, (_, i) => ({ ts: `2026-10-0${i + 1}T07:00:00`, kcal: 600, forcaEq: A.seriesEquivalentes('crossfit', 60) }));
  const com = C.analisarComposicao({ perfil, corpo, totaisPorDia: dias, treinos: [], atividades: cf, hoje });
  ok(com.projecao.treino > base.projecao.treino, 'estímulo sobe'); ok(com.treino.seriesEquivalentes <= 30);
  const muitos = Array.from({ length: 40 }, () => ({ ts: '2026-10-05T07:00:00', kcal: 100, forcaEq: 20 }));
  igual(C.analisarComposicao({ perfil, corpo, totaisPorDia: dias, treinos: [], atividades: muitos, hoje }).treino.seriesEquivalentes, 30);
});
fim();
