// Agrupamento da lista "Refeições de hoje" por tipo de refeição (função pura).
import { teste, igual, ok, perto, fim } from './_t.mjs';
import { agruparRefeicoes, tipoEfetivo, faixaHorario } from '../js/grupos-refeicao.js';

const it = (nome, kcal, p = 0, c = 0, g = 0) => ({ nome, kcal, p, c, g, gramas: 100 });
const L = (id, ts, tipo, itens) => ({ id, ts: '2026-10-24T' + ts, tipo, itens });

teste('dois lançamentos do mesmo tipo viram um grupo, com faixa, itens e total somados', () => {
  const gs = agruparRefeicoes([L('b', '07:45', 'Café da manhã', [it('Pão', 150, 5, 30, 1)]), L('a', '07:10', 'Café da manhã', [it('Café', 5), it('Ovo', 90, 6, 1, 7)])]);
  igual(gs.length, 1); igual(gs[0].tipo, 'Café da manhã'); igual(faixaHorario(gs[0]), '07:10–07:45');
  igual(gs[0].itens.map(i => i.nome).join(','), 'Café,Ovo,Pão', 'itens por horário do lançamento');
  igual(gs[0].itens[0].hora, '07:10'); igual(gs[0].itens[2].refId, 'b');
  igual(gs[0].totais.kcal, 245); igual(gs[0].totais.p, 11); igual(gs[0].totais.c, 31); igual(gs[0].totais.g, 8);
  igual(gs[0].refeicoes.length, 2);
});
teste('tipos diferentes ficam em grupos separados, ordenados pelo primeiro lançamento', () => {
  const gs = agruparRefeicoes([L('3', '19:30', 'Jantar', [it('Sopa', 100)]), L('1', '07:00', 'Café da manhã', [it('Pão', 150)]), L('2', '12:30', 'Almoço', [it('Arroz', 130)]), L('4', '07:40', 'Café da manhã', [it('Fruta', 60)])]);
  igual(gs.map(g => g.tipo).join('|'), 'Café da manhã|Almoço|Jantar');
  igual(faixaHorario(gs[1]), '12:30');
});
teste('tipo ausente é derivado do horário; tipo desconhecido é mantido; sem horário vira Outro', () => {
  igual(tipoEfetivo({ ts: '2026-10-24T07:30' }), 'Café da manhã'); igual(tipoEfetivo({ ts: '2026-10-24T13:00', tipo: '' }), 'Almoço');
  igual(tipoEfetivo({ ts: '2026-10-24T22:30', tipo: null }), 'Ceia'); igual(tipoEfetivo({ ts: 'x' }), 'Outro');
  igual(tipoEfetivo({ ts: '2026-10-24T08:00', tipo: 'cafe da manha' }), 'Café da manhã', 'sem acento/caixa casa com o tipo padrão');
  igual(tipoEfetivo({ ts: '2026-10-24T08:00', tipo: 'Brunch' }), 'Brunch');
  const gs = agruparRefeicoes([L('1', '07:10', undefined, [it('A', 10)]), L('2', '07:50', 'Café da manhã', [it('B', 20)])]);
  igual(gs.length, 1, 'antigo sem tipo agrupa com o café da manhã'); igual(gs[0].totais.kcal, 30);
});
teste('dia vazio, lançamento sem itens e ordem independente da entrada', () => {
  igual(agruparRefeicoes([]).length, 0); igual(agruparRefeicoes(null).length, 0);
  const gs = agruparRefeicoes([L('1', '10:00', 'Lanche da manhã', [])]);
  igual(gs.length, 1); igual(gs[0].itens.length, 0); igual(gs[0].totais.kcal, 0); igual(faixaHorario(gs[0]), '10:00');
  const a = [L('2', '16:00', 'Lanche da tarde', [it('X', 1)]), L('1', '09:00', 'Café da manhã', [it('Y', 1)])];
  igual(agruparRefeicoes(a)[0].tipo, 'Café da manhã'); igual(a[0].id, '2', 'não altera a lista original');
});
fim();
