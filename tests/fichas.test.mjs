import { teste, igual, ok, fim } from './_t.mjs';
import { FICHAS, FICHA_PRINCIPAL, FICHA_SECUNDARIA, montarPlanoDaFicha, auditarFicha, avisosDaFicha, textoPrescricao } from '../js/fichas.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { exPorId } from '../js/exercises.js';
import { ILUSTRACOES } from '../js/ilustracoes-dados.js';
import { coberturaDia, volumeSemanal, alternativas, trocarExercicio } from '../js/planner.js';
import { COLECOES } from '../js/store.js';

console.log('Ficha Semanal Seg–Sáb (original)');
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

// ---------------------------------------------------------------------------
console.log('\nFicha Semanal Seg–Sáb (ajustada, principal)');
const V2 = FICHAS[FICHA_PRINCIPAL];
const imgDir = path.resolve(import.meta.dirname, '../img/ex');
const sha = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
// Seção 7 do relatório (docs/analise-ficha-semanal.md): [exercício, séries, reps, descanso, descansoMax, opcional]
const R = {
  1: [['mergulho-paralelas-triceps', 3, '6-10', 120, 150], ['triceps-testa-barra', 3, '8-12', 90], ['triceps-frances-polia', 3, '10-15', 75], ['triceps-unilateral-polia', 3, '10-15', 60, 75], ['abdominal-polia', 3, '10-15', 60], ['encolhimento-halteres', 3, '10-15', 75, 0, true], ['triceps-coice', 2, '12-15', 45, 0, true]],
  2: [['agachamento-livre', 4, '6-10', 150], ['leg-press-45', 3, '8-12', 120], ['stiff-unilateral-halter', 3, '8-12', 90, 120], ['cadeira-extensora-reclinada', 3, '10-15', 75], ['cadeira-adutora', 3, '10-15', 75], ['panturrilha-leg-press', 4, '10-15', 60, 75]],
  3: [['barra-fixa-pronada', 4, '5-10', 120, 150], ['remada-serrote-halter', 3, '8-12', 90, 120], ['remada-baixa-triangulo', 3, '8-12', 90], ['pullover-halter', 3, '10-15', 75], ['elevacao-lateral-polia', 3, '12-20', 60], ['face-pull', 3, '12-20', 60], ['crucifixo-inverso-polia', 3, '12-20', 60]],
  4: [['elevacao-pelvica-barra', 3, '8-12', 120], ['stiff-barra', 3, '8-12', 120], ['hack-squat', 3, '8-12', 120], ['cadeira-flexora', 4, '10-15', 75], ['cadeira-abdutora', 3, '12-15', 60], ['panturrilha-sentado-maquina', 4, '10-15', 60, 75]],
  5: [['barra-fixa-neutra', 4, '6-10', 120], ['arnold-press', 3, '8-12', 120], ['elevacao-lateral-halteres', 4, '12-20', 60, 75], ['rosca-martelo', 3, '10-12', 75], ['rosca-inclinada-halteres', 3, '10-15', 75], ['rosca-scott', 3, '10-15', 75]],
  6: [['supino-reto-barra', 4, '6-10', 150], ['supino-inclinado-barra', 3, '6-10', 150], ['crucifixo-inclinado-halteres', 3, '10-15', 90], ['voador-peck-deck', 3, '12-15', 75], ['crossover-polia-alta', 3, '12-15', 75], ['roda-abdominal', 3, '8-12', 60]],
};
const PERFIL = exp => ({ equipamento: 'academia', experiencia: exp, objetivo: 'ganhar', lesoes: [] });
teste('ids estáveis: ajustada com id novo (principal, primeira) e original com o id antigo', () => {
  igual(FICHA_PRINCIPAL, 'semanal-seg-sab-v2'); igual(FICHA_SECUNDARIA, 'semanal-seg-sab'); igual(Object.keys(FICHAS).join(), 'semanal-seg-sab-v2,semanal-seg-sab');
  igual(V2.nome, 'Semanal Seg–Sáb (ajustada)'); igual(F.nome, 'Semanal Seg–Sáb (original)');
});
teste('a ficha original permanece idêntica (dias, resumo e princípios) e sem prescrição fixa', () => {
  igual(sha(F.dias), '4922ff0402e579c04a3155f0b8cce1494d698db1b97225337c0d481033ff7487');
  igual(sha([F.resumo, F.principios]), '1f8e2141dd3a3da065a08829fa94b2d440b02cf5e908e259a203e9977b1ed1bd');
  ok(F.dias.every(d => d.itens.every(it => it.series == null && it.reps == null && it.descanso == null)));
});
teste('seis dias de segunda a sábado, com os mesmos grupos da original', () => {
  igual(V2.dias.map(d => d.dow).join(''), '123456');
  for (const d of V2.dias) igual(d.blocos.map(b => b.grupo).join(), F.dias.find(x => x.dow === d.dow).blocos.map(b => b.grupo).join(), d.titulo);
});
teste('todo exercício da ajustada existe no banco e tem foto em disco', () => {
  for (const d of V2.dias) for (const it of d.itens) {
    const arqs = ILUSTRACOES[it.ex] || []; ok(exPorId(it.ex), 'falta ' + it.ex); ok(arqs.length >= 1, 'sem foto ' + it.ex);
    for (const a of arqs) ok(fs.existsSync(path.join(imgDir, a)) && fs.statSync(path.join(imgDir, a)).size > 2000, `${it.ex}: ${a}`);
  }
});
teste('exercícios novos cadastrados (porções, instrução, erro comum) e mergulho de tríceps com foto própria', () => {
  const m = exPorId('mergulho-paralelas-triceps'); ok(m && m.primarias.includes('tri_longa') && m.secundarias.includes('peit_costal') && !m.primarias.includes('peit_costal'));
  const e = exPorId('cadeira-extensora-reclinada'); ok(e && e.primarias.includes('reto_fem') && e.focoCod === 'a');
  ok(ILUSTRACOES['mergulho-paralelas-triceps'][0].startsWith('dips-triceps-version'));
  for (const x of [m, e]) ok(x.instrucao.length > 20 && x.erro.length > 10, x.id);
});
teste('cada exercício cobre a porção listada como primária', () => igual(auditarFicha(V2).join('; '), ''));
teste('terça: stiff unilateral no lugar da mesa flexora; isquiotibiais: quadril 3 + 3 em dois dias, joelho 4 séries na quinta', () => {
  const ids = d => V2.dias.find(x => x.dow === d).itens.map(i => i.ex);
  ok(!ids(2).includes('mesa-flexora') && !V2.dias.some(d => d.itens.some(i => i.ex === 'mesa-flexora')));
  igual(ids(2).join(), 'agachamento-livre,leg-press-45,stiff-unilateral-halter,cadeira-extensora-reclinada,cadeira-adutora,panturrilha-leg-press');
  ok(ids(4).includes('stiff-barra') && ids(4).includes('cadeira-flexora'));
  const u = exPorId('stiff-unilateral-halter'); ok(u.primarias.includes('isq_quadril') && u.primarias.includes('glut_max') && ['adutores', 'lombar', 'glut_med'].every(p => u.secundarias.includes(p)) && u.classe === 'H');
  const ser = (dow, ex) => V2.dias.find(x => x.dow === dow).itens.find(i => i.ex === ex).series;
  igual(ser(2, 'stiff-unilateral-halter') + ser(4, 'stiff-barra'), 6); igual(ser(4, 'cadeira-flexora'), 4);
  ok(V2.mudancas.join(' ').includes('mesa flexora'));
});
teste('prescrição fixa bate com a seção 7 do relatório (ordem, séries, reps, descanso, opcionais)', () => {
  for (const d of V2.dias) {
    const esp = R[d.dow]; igual(d.itens.length, esp.length, d.titulo);
    d.itens.forEach((it, i) => {
      const [ex, ser, reps, desc, max, opc] = esp[i];
      igual(it.ex, ex, `${d.titulo} #${i + 1}`); igual(it.series, ser, ex); igual(it.reps, reps, ex); igual(it.descanso, desc, ex); igual(it.descansoMax || 0, max || 0, ex); igual(!!it.opcional, !!opc, ex);
    });
  }
});
teste('total semanal: 116 séries (15, 20, 22, 20, 20, 19); a original tem 114', () => {
  igual(V2.dias.map(d => d.itens.filter(i => !i.opcional).reduce((a, i) => a + i.series, 0)).join(), '15,20,22,20,20,19');
});
teste('cada exercício tem porção e justificativa; as trocas dizem o que mudou; há a nota "O que mudou"', () => {
  for (const d of V2.dias) for (const it of d.itens) ok(it.porcao.length > 3 && it.por.length > 15, it.ex);
  const mud = V2.dias.flatMap(d => d.itens).filter(i => i.mudou).map(i => i.ex);
  for (const x of ['triceps-frances-polia', 'abdominal-polia', 'cadeira-extensora-reclinada', 'elevacao-lateral-polia', 'rosca-inclinada-halteres', 'crucifixo-inclinado-halteres', 'roda-abdominal', 'encolhimento-halteres', 'triceps-coice', 'panturrilha-leg-press', 'panturrilha-sentado-maquina']) ok(mud.includes(x), 'sem "mudou": ' + x);
  ok(V2.mudancas.length >= 6); const txt = V2.mudancas.join(' '); for (const k of ['corda', 'coice', 'reclinado', 'inclinada', 'crucifixo', 'roda abdominal', 'encolhimento']) ok(txt.includes(k), k);
});
for (const exp of ['iniciante', 'intermediario', 'avancado']) teste(`adotar a ajustada (${exp}) monta a semana certa, com prescrição fixa e cobertura completa`, () => {
  const { plano, config } = montarPlanoDaFicha(V2, PERFIL(exp));
  igual(config.ficha, 'semanal-seg-sab-v2'); igual(config.dias.join(), 'false,true,true,true,true,true,true'); igual(Object.keys(plano.dias).length, 6); igual(plano.ficha, 'semanal-seg-sab-v2');
  for (const [dow, dia] of Object.entries(plano.dias)) {
    const esp = R[dow].filter(r => !r[5]); igual(dia.exercicios.length, esp.length, dow);
    dia.exercicios.forEach((e, i) => { igual(e.exId, esp[i][0]); igual(e.series, esp[i][1]); igual(e.reps, esp[i][2]); igual(e.descanso, esp[i][3]); ok(e.justificativa.startsWith('Na sua ficha:')); });
    for (const g of coberturaDia(dia)) for (const p of g.porcoes) igual(p.nivel, 'ok', `${dow} ${p.nome}`);
    igual(dia.totalSeries, esp.reduce((a, r) => a + r[1], 0));
  }
  igual(Object.values(plano.dias).reduce((s, d) => s + d.totalSeries, 0), 116);
});
teste('plano da ajustada: opcionais ficam de fora; faixa de descanso e observação são preservadas', () => {
  const { plano } = montarPlanoDaFicha(V2, PERFIL('intermediario'));
  ok(!plano.dias[1].exercicios.some(e => ['encolhimento-halteres', 'triceps-coice'].includes(e.exId)));
  const p = plano.dias[2].exercicios.at(-1); igual(p.descansoMax, 75); igual(p.obs, 'pausa de 1 a 2 s embaixo');
  igual(textoPrescricao(p), '4 séries × 10-15 repetições · descanso 60–75 s · pausa de 1 a 2 s embaixo');
  igual(textoPrescricao({ series: 3, reps: '8-12', descanso: 90 }), '3 séries × 8-12 repetições · descanso 90 s');
});
teste('retrocompatibilidade: a original continua usando o planner (114 séries, sem faixa nem observação)', () => {
  const { plano, config } = montarPlanoDaFicha(F, PERFIL('intermediario'));
  igual(config.ficha, 'semanal-seg-sab'); igual(Object.values(plano.dias).reduce((s, d) => s + d.totalSeries, 0), 114);
  for (const dia of Object.values(plano.dias)) for (const e of dia.exercicios) ok(e.descansoMax === undefined && e.obs === undefined);
});
teste('troca por porção e avisos de equipamento/lesão valem na ajustada', () => {
  const { plano } = montarPlanoDaFicha(V2, PERFIL('intermediario')); const dia = plano.dias[1];
  const alts = alternativas(dia.exercicios[1], dia, PERFIL('intermediario')); ok(alts.length >= 2);
  const r = trocarExercicio(plano, 1, 1, alts[0].ex.id, PERFIL('intermediario')); ok(r.item.trocado && r.item.justificativa.startsWith('Trocado por você') && r.item.series === 3);
  ok(avisosDaFicha(V2, { equipamento: 'casa' }).length === 1); ok(avisosDaFicha(V2, { equipamento: 'academia', lesoes: ['ombro'] }).some(a => a.includes('limitações'))); igual(avisosDaFicha(V2, { equipamento: 'academia', lesoes: [] }).length, 0);
});
fim();
