// "Registrar um dia inteiro": estatística (IQR), escolha do dia, escala, geração, destino e desfazer. Funções puras de js/dia-estimado.js.
import { teste, igual, perto, ok, fim } from './_t.mjs';
import {
  ORIGEM_ESTIMADO, quantil, limitesIQR, diasDoHistorico, classificarDias, escolherDia, arredondarGramas, escalarItem, gerarLancamentos,
  preverDia, situacaoDestino, idsSubstituiveis, idsDoLote, diasComEstimado, totaisDeRefeicoes, media,
} from '../js/dia-estimado.js';

const DIA = '2026-11-09';
let seq = 0;
// um dia com `kcal` total em 2 refeições (café 30% e almoço 70%), itens de 100 g
const dia = (data, kcal, extra = {}) => [
  { id: `r${++seq}`, ts: `${data}T07:30:00`, tipo: 'Café da manhã', itens: [{ alimentoId: 'a', nome: 'Pão', gramas: 100, kcal: kcal * 0.3, p: kcal * 0.01, c: kcal * 0.05, g: kcal * 0.005, f: 1 }], ...extra },
  { id: `r${++seq}`, ts: `${data}T12:30:00`, tipo: 'Almoço', itens: [{ alimentoId: 'b', nome: 'Arroz', gramas: 150, kcal: kcal * 0.7, p: kcal * 0.02, c: kcal * 0.1, g: kcal * 0.01, f: 2 }], ...extra },
];
const hist = kcals => kcals.flatMap((k, i) => dia(`2026-10-${String(10 + i).padStart(2, '0')}`, k));
const ds = (refs, d = DIA) => diasDoHistorico(refs, { dia: d });

console.log('Estatística');
teste('quantil e limites IQR (1,5×IQR); com menos de 4 valores nada é outlier', () => {
  igual(quantil([1, 2, 3, 4, 5], 0.5), 3); perto(quantil([10, 20, 30, 40], 0.25), 17.5, 1e-9); igual(quantil([], 0.5), 0);
  const l = limitesIQR([1800, 1900, 2000, 2100, 2200]); perto(l.q1, 1900, 1e-9); perto(l.q3, 2100, 1e-9); perto(l.min, 1600, 1e-9); perto(l.max, 2400, 1e-9);
  igual(limitesIQR([1, 100, 1000]).max, Infinity);
  igual(media([2, 4]), 3);
});
teste('arredondarGramas e escalarItem: gramas limpas, nutrientes proporcionais, quantidade textual descartada', () => {
  igual(arredondarGramas(13.4), 13); igual(arredondarGramas(47), 45); igual(arredondarGramas(163), 160); igual(arredondarGramas(0.2), 1);
  const i = escalarItem({ nome: 'Arroz', gramas: 150, kcal: 192, p: 4, c: 42, g: 0.3, unidadeTexto: '1 prato', quantidade: 1 }, 1.1);
  igual(i.gramas, 170); perto(i.kcal, 192 * 170 / 150, 1e-9); ok(!('unidadeTexto' in i) && !('quantidade' in i));
  igual(escalarItem({ gramas: 150, kcal: 192 }, 1).kcal, 192); igual(escalarItem({ gramas: 0, kcal: 5 }, 2).kcal, 5);
});

console.log('\nHistórico e classificação');
teste('poucos dados: menos de 5 dias com registro não gera nada e diz quantos faltam', () => {
  const r = preverDia({ refeicoes: hist([2000, 2100, 1900]), dia: DIA, modo: 'normal' });
  igual(r.ok, false); igual(r.motivo, 'poucos-dias'); igual(r.faltam, 2); igual(r.diasComRegistro, 3);
  igual(preverDia({ refeicoes: [], dia: DIA, modo: 'acima' }).faltam, 5);
});
teste('o dia de destino, o futuro e dias além da janela de 60 dias ficam fora do histórico', () => {
  const refs = [...dia('2026-11-09', 3000), ...dia('2026-11-10', 3000), ...dia('2026-08-01', 3000), ...dia('2026-11-01', 2000)];
  igual(ds(refs).map(d => d.data).join(), '2026-11-01');
});
teste('NÃO realimenta: lançamentos gerados (origem dia-estimado) e tombstones nunca entram na estatística', () => {
  const reais = hist([2000, 2100, 1900, 2050, 1950]);
  const gerados = dia('2026-10-30', 5000, { origem: ORIGEM_ESTIMADO }).concat(dia('2026-10-31', 100, { origem: ORIGEM_ESTIMADO }));
  const tomb = dia('2026-10-29', 4000, { _d: true });
  const h1 = ds([...reais, ...gerados, ...tomb]);
  igual(h1.length, 5);
  const a = preverDia({ refeicoes: reais, dia: DIA, modo: 'acima' }), b = preverDia({ refeicoes: [...reais, ...gerados, ...tomb], dia: DIA, modo: 'acima' });
  igual(a.kcalOrigem, b.kcalOrigem); igual(a.media, b.media);
});
teste('outlier ALTO é descartado: "Dia acima" usa o maior dia que não é outlier', () => {
  const r = preverDia({ refeicoes: hist([1900, 2000, 2100, 2000, 1950, 2050, 4800]), dia: DIA, modo: 'acima' });
  igual(r.ok, true); perto(r.kcalOrigem, 2100, 0.01); igual(r.descartados.outliers, 1); ok(r.kcalOrigem < 4000);
});
teste('outlier BAIXO (completo, mas fora do IQR) é descartado: "Dia abaixo" não o pega', () => {
  const r = preverDia({ refeicoes: hist([2000, 2100, 2000, 1950, 2050, 1900, 1250]), dia: DIA, modo: 'abaixo' });
  perto(r.kcalOrigem, 1900, 0.01); igual(r.descartados.outliers, 1); igual(r.descartados.incompletos, 0);
});
teste('dia incompleto (< 800 kcal ou < 50% da média) nunca é o "dia abaixo"', () => {
  const r = preverDia({ refeicoes: hist([2200, 2300, 2100, 2400, 2250, 700, 450]), dia: DIA, modo: 'abaixo' });
  igual(r.descartados.incompletos, 2); perto(r.kcalOrigem, 2100, 0.01);
  const cl = classificarDias(ds(hist([2200, 2300, 2100, 2400, 2250, 700, 450])));
  igual(cl.incompletos.length, 2); igual(cl.elegiveis.length, 5);
});
teste('empate: dois dias com o mesmo consumo -> vale o mais recente', () => {
  const refs = [...dia('2026-10-10', 2000), ...dia('2026-10-11', 2600), ...dia('2026-10-12', 2600), ...dia('2026-10-13', 2100), ...dia('2026-10-14', 2200), ...dia('2026-10-15', 2150)];
  const r = preverDia({ refeicoes: refs, dia: DIA, modo: 'acima' });
  igual(r.dataOrigem, '2026-10-12');
  const e = escolherDia([{ data: '2026-10-01', kcal: 1500, refeicoes: [] }, { data: '2026-10-05', kcal: 1500, refeicoes: [] }, { data: '2026-10-03', kcal: 2000, refeicoes: [] }], 'abaixo');
  igual(e.dia.data, '2026-10-05');
});
teste('"Dia normal": usa o dia elegível mais próximo da média e ESCALA para a média, mantendo a composição', () => {
  const r = preverDia({ refeicoes: hist([1900, 2000, 2150, 2300, 2000, 2100]), dia: DIA, modo: 'normal' });
  perto(r.media, 2075, 1); igual(r.nDiasConsiderados, 6);
  ok(Math.abs(r.kcalOrigem - r.media) <= 60, 'dia de origem perto da média');
  ok(Math.abs(r.kcalResultado - r.media) / r.media < 0.04, `kcal do resultado ${r.kcalResultado} perto da média ${r.media}`);
  ok(r.fator > 0.9 && r.fator < 1.1);
  for (const l of r.lancamentos) for (const i of l.itens) ok(i.gramas % 5 === 0 || i.gramas < 20, 'gramas limpas: ' + i.gramas);
  igual(r.lancamentos.map(l => l.tipo).join(), 'Café da manhã,Almoço', 'composição e tipos mantidos');
  const p0 = r.lancamentos[0].itens[0]; perto(p0.kcal / p0.gramas, 0.3 * r.kcalOrigem / 100 / 1, 0.01 * r.kcalOrigem);   // kcal por g preservado
});
teste('"Dia abaixo"/"Dia acima" copiam o dia real sem escalar: horários, tipos e quantidades', () => {
  const r = preverDia({ refeicoes: hist([1900, 2000, 2100, 2000, 1950, 2050]), dia: DIA, modo: 'abaixo', lote: 'L1' });
  igual(r.fator, 1); igual(r.lancamentos.length, 2); igual(r.lancamentos[0].ts, `${DIA}T07:30:00`); igual(r.lancamentos[1].ts, `${DIA}T12:30:00`);
  igual(r.lancamentos[0].itens[0].gramas, 100); igual(r.lancamentos[1].itens[0].gramas, 150);
  for (const l of r.lancamentos) { igual(l.origem, ORIGEM_ESTIMADO); igual(l.estimadoLote, 'L1'); igual(l.estimadoDe, r.dataOrigem); igual(l.estimadoModo, 'abaixo'); ok(!('id' in l)); }
  perto(r.kcalResultado, 1900, 0.01); perto(totaisDeRefeicoes(r.lancamentos).p, r.totais.p, 1e-9);
});
teste('gerarLancamentos não altera as refeições de origem', () => {
  const orig = dia('2026-10-10', 2000), copia = JSON.stringify(orig);
  gerarLancamentos({ refeicoesOrigem: orig, dia: DIA, fator: 1.2, lote: 'x', dataOrigem: '2026-10-10', modo: 'normal' });
  igual(JSON.stringify(orig), copia);
});

console.log('\nDestino e desfazer');
teste('destino vazio: só "adicionar"; com lançamentos reais: nunca apaga os reais', () => {
  igual(situacaoDestino([], DIA).temLancamentos, false);
  const reais = dia(DIA, 700), s = situacaoDestino(reais, DIA);
  igual(s.temLancamentos, true); igual(s.reais.length, 2); igual(s.geradas.length, 0); igual(s.opcoes.map(o => o.id).join(), 'adicionar');
  igual(idsSubstituiveis(reais, DIA).length, 0, 'nenhum lançamento real é substituível');
});
teste('destino com dia já estimado: oferece "substituir só os gerados" e só devolve ids gerados', () => {
  const reais = dia(DIA, 500), gerados = dia(DIA, 2000, { origem: ORIGEM_ESTIMADO, estimadoLote: 'L0' });
  const s = situacaoDestino([...reais, ...gerados], DIA);
  igual(s.opcoes.map(o => o.id).join(), 'adicionar,substituir-gerados');
  igual(idsSubstituiveis([...reais, ...gerados], DIA).sort().join(), gerados.map(r => r.id).sort().join());
  ok(!idsSubstituiveis([...reais, ...gerados], DIA).some(id => reais.some(r => r.id === id)));
});
teste('desfazer: idsDoLote devolve só o que foi gerado naquela operação', () => {
  const l1 = dia(DIA, 2000, { origem: ORIGEM_ESTIMADO, estimadoLote: 'A' }), l2 = dia(DIA, 1800, { origem: ORIGEM_ESTIMADO, estimadoLote: 'B' }), reais = dia(DIA, 600);
  const todos = [...l1, ...l2, ...reais];
  igual(idsDoLote(todos, 'A').sort().join(), l1.map(r => r.id).sort().join()); igual(idsDoLote(todos, 'zzz').length, 0);
  ok(!idsDoLote(todos, 'A').some(id => reais.some(r => r.id === id)));
});
teste('diasComEstimado marca as datas com lançamento gerado (selo "dia estimado")', () => {
  const todos = [...dia('2026-11-02', 2000), ...dia('2026-11-05', 2000, { origem: ORIGEM_ESTIMADO }), ...dia('2026-11-06', 2000, { origem: ORIGEM_ESTIMADO })];
  igual(diasComEstimado(todos).join(), '2026-11-05,2026-11-06'); igual(diasComEstimado([]).length, 0);
});
teste('sem dia elegível (todos incompletos) devolve motivo claro em vez de inventar', () => {
  const r = preverDia({ refeicoes: hist([300, 350, 400, 380, 320]), dia: DIA, modo: 'normal' });
  igual(r.ok, false); ok(r.motivo === 'sem-dia-elegivel' || r.motivo === 'poucos-dias');
});
fim();
