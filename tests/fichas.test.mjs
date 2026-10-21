import { teste, igual, ok, fim } from './_t.mjs';
import { FICHAS, montarPlanoDaFicha, auditarFicha, avisosDaFicha } from '../js/fichas.js';
import { exPorId } from '../js/exercises.js';
import { ILUSTRACOES } from '../js/ilustracoes-dados.js';
import { coberturaDia, volumeSemanal, alternativas, trocarExercicio } from '../js/planner.js';
import { COLECOES } from '../js/store.js';

console.log('Ficha Semanal Seg–Sáb');
const F = FICHAS['semanal-seg-sab'];
teste('seis dias, segunda a sábado, 6 exercícios cada', () => { igual(F.dias.length, 6); igual(F.dias.map(d => d.dow).join(''), '123456'); for (const d of F.dias) igual(d.itens.length, 6, d.titulo); });
teste('todo exercício da ficha existe no banco e tem foto', () => { for (const d of F.dias) for (const it of d.itens) { ok(exPorId(it.ex), 'falta ' + it.ex); ok((ILUSTRACOES[it.ex] || []).length >= 1, 'sem foto ' + it.ex); } });
teste('cada exercício cobre a porção listada como primária', () => igual(auditarFicha(F).join('; '), ''));
teste('cada exercício tem porção original e justificativa', () => { for (const d of F.dias) for (const it of d.itens) { ok(it.porcao.length > 3 && it.por.length > 15, it.ex); } });
for (const exp of ['iniciante', 'intermediario', 'avancado']) teste(`plano montado (${exp}): séries, reps, descanso e cobertura completa de cada dia`, () => {
  const perfil = { equipamento: 'academia', experiencia: exp, objetivo: 'recomp', lesoes: [] };
  const { plano, config } = montarPlanoDaFicha(F, perfil);
  igual(Object.keys(plano.dias).length, 6); igual(config.dias.filter(Boolean).length, 6); igual(config.dias[0], false);
  for (const [dow, dia] of Object.entries(plano.dias)) {
    ok(dia.exercicios.length === 6); for (const e of dia.exercicios) { ok(e.series >= 2 && e.series <= 4, 'séries'); ok(e.reps && e.descanso > 0); ok(e.justificativa.startsWith('Na sua ficha:')); }
    for (const g of coberturaDia(dia)) for (const p of g.porcoes) igual(p.nivel, 'ok', `${dow} ${p.nome}`);
    ok(dia.totalSeries <= 26, 'sessão longa ' + dia.totalSeries);
  }
});
teste('a troca por porção continua valendo na ficha adotada', () => {
  const perfil = { equipamento: 'academia', experiencia: 'intermediario', objetivo: 'ganhar', lesoes: [] };
  const { plano } = montarPlanoDaFicha(F, perfil); const dia = plano.dias[1];
  const alts = alternativas(dia.exercicios[0], dia, perfil); ok(alts.length >= 2);
  const r = trocarExercicio(plano, 1, 0, alts[0].ex.id, perfil); ok(r.item.trocado && r.item.justificativa.startsWith('Trocado por você'));
});
teste('avisos de equipamento e lesão', () => {
  ok(avisosDaFicha(F, { equipamento: 'casa' }).length === 1); ok(avisosDaFicha(F, { equipamento: 'academia', lesoes: ['ombro'] }).some(a => a.includes('limitações'))); igual(avisosDaFicha(F, { equipamento: 'academia', lesoes: [] }).length, 0);
});
teste('marcações de "feito" são uma coleção sincronizada', () => ok(COLECOES.includes('marcas')));
fim();
