import { teste, igual, ok, fim } from './_t.mjs';
import { gerarPlano, coberturaDia, volumeSemanal, alternativas, trocarExercicio, janelaPorcoes, divisaoAutomatica } from '../js/planner.js';
import { GRUPOS, EXERCICIOS, exPorId, PORCOES, EQUIPAMENTOS } from '../js/exercises.js';

const DIAS = { 1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };
const mkDias = n => { const a = Array(7).fill(false); DIAS[n].forEach(d => a[d] = true); return a; };

console.log('Banco de exercícios');
teste('pelo menos 120 exercícios', () => ok(EXERCICIOS.length >= 120, String(EXERCICIOS.length)));
teste('todo exercício tem instrução, erro comum e porções válidas', () => {
  for (const e of EXERCICIOS) {
    ok(e.instrucao && e.instrucao.length > 20, e.id + ' instrução'); ok(e.erro, e.id + ' erro');
    ok(e.primarias.length > 0, e.id + ' sem primária');
    [...e.primarias, ...e.secundarias].forEach(p => ok(PORCOES[p], e.id + ' porção ' + p));
  }
});
teste('toda porção tem exercício primário em cada tipo de equipamento (sem lesões)', () => {
  for (const eq of Object.keys(EQUIPAMENTOS)) for (const p of Object.keys(PORCOES)) {
    ok(EXERCICIOS.some(e => e.primarias.includes(p) && EQUIPAMENTOS[eq].classes.includes(e.classe)), `${eq}/${p}`);
  }
});

console.log('Planner');
teste('janelas de porções cobrem todas quando o grupo aparece k vezes', () => {
  for (const g of Object.keys(GRUPOS)) for (const k of [1, 2, 3]) {
    const por = GRUPOS[g].porcoes; const un = new Set();
    for (let j = 0; j < k; j++) janelaPorcoes(por, j, k).forEach(p => un.add(p));
    igual(un.size, por.length, `${g} k=${k}`);
  }
});
for (const equip of ['academia', 'halteres', 'casa']) for (const exp of ['iniciante', 'intermediario', 'avancado']) {
  teste(`auto 1..6 dias: ${equip}/${exp} cobre todas as porções de cada bloco (sem lacunas)`, () => {
    for (let n = 1; n <= 6; n++) {
      const perfil = { equipamento: equip, experiencia: exp, objetivo: 'recomp', lesoes: [] };
      const plano = gerarPlano({ dias: mkDias(n), modo: 'auto', duracao: 75 }, perfil);
      igual(Object.keys(plano.dias).length, n, 'dias');
      for (const [d, dia] of Object.entries(plano.dias)) {
        igual(dia.lacunas.length, 0, `lacunas n=${n} dia ${d}`);
        for (const g of coberturaDia(dia)) for (const p of g.porcoes) igual(p.nivel, 'ok', `${n}d ${dia.titulo} ${p.nome}`);
        const ids = dia.exercicios.map(e => e.exId); igual(new Set(ids).size, ids.length, 'repetidos no dia');
        for (const e of dia.exercicios) { ok(e.justificativa.length > 40, 'justificativa'); ok(e.series >= 2 && e.series <= 5, 'séries ' + e.series); ok(e.reps && e.descanso, 'reps/descanso'); }
        ok(dia.exercicios.length <= 16, 'exercícios no dia ' + dia.exercicios.length);
      }
      // cobertura semanal: todas as porções dos grupos treinados
      const vol = volumeSemanal(plano, perfil);
      const grupos = new Set(Object.values(plano.dias).flatMap(d => d.blocos.map(b => b.grupo)));
      if (n > 1) { for (const g of grupos) for (const p of GRUPOS[g].porcoes) ok((vol.porcao[p] || 0) > 0, `semana ${n}d falta ${p}`); } else ok(plano.semEstimulo.length > 0 && plano.avisos.some(a => a.includes('sem estímulo direto')), 'aviso 1 dia');
    }
  });
}
teste('respeita equipamento: casa só usa classe C', () => {
  const plano = gerarPlano({ dias: mkDias(4), modo: 'auto' }, { equipamento: 'casa', experiencia: 'intermediario', objetivo: 'ganhar', lesoes: [] });
  for (const dia of Object.values(plano.dias)) for (const e of dia.exercicios) igual(exPorId(e.exId).classe, 'C', e.exId);
});
teste('respeita lesão de ombro e joelho', () => {
  const plano = gerarPlano({ dias: mkDias(5), modo: 'auto' }, { equipamento: 'academia', experiencia: 'intermediario', objetivo: 'ganhar', lesoes: ['ombro', 'joelho'] });
  for (const dia of Object.values(plano.dias)) for (const e of dia.exercicios) { const x = exPorId(e.exId); ok(!x.lesoes.includes('ombro') && !x.lesoes.includes('joelho'), x.id); }
  ok(plano.avisos.some(a => a.includes('evitados')));
});
teste('modo manual: grupos escolhidos pelo usuário, cobertura total', () => {
  const plano = gerarPlano({ dias: mkDias(3), modo: 'manual', gruposPorDia: { 1: ['peito', 'triceps'], 3: ['costas', 'biceps'], 5: ['quadriceps', 'posteriores', 'panturrilha'] } }, { equipamento: 'academia', experiencia: 'intermediario', objetivo: 'ganhar', lesoes: [] });
  for (const dia of Object.values(plano.dias)) for (const g of coberturaDia(dia)) for (const p of g.porcoes) igual(p.nivel, 'ok', p.nome);
});
teste('modo livre: dias sem ficha', () => {
  const plano = gerarPlano({ dias: mkDias(3), modo: 'livre' }, { equipamento: 'academia' });
  for (const dia of Object.values(plano.dias)) { ok(dia.livre); igual(dia.exercicios.length, 0); }
});
teste('volume semanal fica na faixa para intermediário em 4 dias (maioria dos grupos)', () => {
  const perfil = { equipamento: 'academia', experiencia: 'intermediario', objetivo: 'ganhar', lesoes: [] };
  const plano = gerarPlano({ dias: mkDias(4), modo: 'auto', duracao: 90 }, perfil);
  const v = volumeSemanal(plano, perfil);
  const ok_ = v.grupos.filter(g => g.status === 'na faixa' || g.status === 'acima').length;
  ok(ok_ >= v.grupos.length - 2, JSON.stringify(v.grupos.map(g => [g.grupo, g.series, g.min])));
  ok(v.grupos.every(g => g.series <= 30), 'volume absurdo');
});
teste('troca de exercício: alternativas com sobreposição, diferença e justificativa atualizada', () => {
  const perfil = { equipamento: 'academia', experiencia: 'intermediario', objetivo: 'ganhar', lesoes: [] };
  const plano = gerarPlano({ dias: mkDias(3), modo: 'auto' }, perfil);
  const d = Object.keys(plano.dias)[0]; const dia = plano.dias[d];
  const item = dia.exercicios[0];
  const alts = alternativas(item, dia, perfil);
  ok(alts.length >= 3, 'alternativas ' + alts.length);
  ok(alts[0].score >= alts.at(-1).score, 'ordenadas');
  const r = trocarExercicio(plano, d, 0, alts[0].ex.id, perfil);
  igual(r.item.exId, alts[0].ex.id); ok(r.item.justificativa.startsWith('Trocado por você'));
  ok(r.item.trocado);
});
teste('iniciante com 3 dias usa corpo inteiro; 4 dias usa superior/inferior', () => {
  ok(divisaoAutomatica(3, { experiencia: 'iniciante' })[0].titulo.startsWith('Corpo inteiro'));
  ok(divisaoAutomatica(4, {})[0].titulo.startsWith('Superiores'));
});
fim();
