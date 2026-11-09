// "Registrar um dia inteiro" com o destino JÁ lançado: o total do dia (já lançado + gerado) não passa do alvo.
import { teste, igual, perto, ok, fim } from './_t.mjs';
import { ORIGEM_ESTIMADO, preverDia, completarDia, mantidosNoDestino, totaisDeRefeicoes } from '../js/dia-estimado.js';

const DIA = '2026-11-09';
let seq = 0;
const dia = (data, kcal, extra = {}) => [
  { id: `r${++seq}`, ts: `${data}T07:30:00`, tipo: 'Café da manhã', itens: [{ alimentoId: 'a', nome: 'Pão', gramas: 100, kcal: kcal * 0.3, p: kcal * 0.01, c: kcal * 0.05, g: kcal * 0.005, f: 1 }], ...extra },
  { id: `r${++seq}`, ts: `${data}T12:30:00`, tipo: 'Almoço', itens: [{ alimentoId: 'b', nome: 'Arroz', gramas: 150, kcal: kcal * 0.7, p: kcal * 0.02, c: kcal * 0.1, g: kcal * 0.01, f: 2 }], ...extra },
];
const hist = kcals => kcals.flatMap((k, i) => dia(`2026-10-${String(10 + i).padStart(2, '0')}`, k));
const H = () => hist([1900, 2000, 2100, 2000, 1950, 2050]);
const lanc = (id, hora, tipo, kcal, extra = {}) => ({ id, ts: `${DIA}T${hora}:00`, tipo, itens: [{ nome: 'x', gramas: 100, kcal, p: kcal * 0.05, c: kcal * 0.1, g: kcal * 0.02, f: 1 }], ...extra });

teste('destino vazio: igual ao comportamento anterior (alvo = dia escolhido, nada descontado)', () => {
  const r = preverDia({ refeicoes: H(), dia: DIA, modo: 'acima', mantidos: [] });
  igual(r.jaLancado, 0); perto(r.alvo, 2100, 0.01); perto(r.kcalResultado, 2100, 0.01); igual(r.comExistentes, false); igual(r.lancamentos.length, 2); igual(r.estrategia, 'completa');
});
teste('café da manhã real no destino: pula o café do dia de origem e escala o resto para o que falta', () => {
  const real = [lanc('e1', '08:00', 'Café da manhã', 600)];
  const r = preverDia({ refeicoes: [...H(), ...real], dia: DIA, modo: 'acima', mantidos: real });
  igual(r.comExistentes, true); perto(r.alvo, 2100, 0.01); igual(r.jaLancado, 600); perto(r.restante, 1500, 0.01);
  igual(r.pulados.join(), 'Café da manhã'); igual(r.estrategia, 'pulando-tipos'); igual(r.lancamentos.length, 1); igual(r.lancamentos[0].tipo, 'Almoço');
  ok(r.totalDia.kcal <= r.alvo + 1e-9, 'total do dia ' + r.totalDia.kcal); ok(r.totalDia.kcal >= r.alvo * 0.95, 'perto do alvo: ' + r.totalDia.kcal);
  perto(r.totalDia.kcal, 600 + r.kcalResultado, 1e-9); ok(r.fator > 1 && r.fator < 1.1);
});
teste('destino já acima (ou colado) do alvo: nada é gerado e a prévia explica', () => {
  const acima = [lanc('e1', '08:00', 'Café da manhã', 2300)];
  let r = preverDia({ refeicoes: [...H(), ...acima], dia: DIA, modo: 'acima', mantidos: acima });
  igual(r.semGeracao, true); igual(r.lancamentos.length, 0); ok(r.restante < 0); igual(r.jaLancado, 2300);
  const quase = [lanc('e2', '08:00', 'Café da manhã', 2070)];   // falta 30 kcal (< 50)
  r = preverDia({ refeicoes: [...H(), ...quase], dia: DIA, modo: 'acima', mantidos: quase });
  igual(r.semGeracao, true); igual(r.lancamentos.length, 0);
});
teste('modo "substituir só os estimados": desconta só os reais; "adicionar" desconta tudo', () => {
  const real = lanc('e1', '08:00', 'Café da manhã', 500), gerado = lanc('e2', '12:00', 'Almoço', 1500, { origem: ORIGEM_ESTIMADO, estimadoLote: 'L0' });
  const todos = [...H(), real, gerado];
  const m1 = mantidosNoDestino(todos, DIA, 'adicionar'), m2 = mantidosNoDestino(todos, DIA, 'substituir-gerados');
  igual(m1.length, 2); igual(m2.length, 1); igual(m2[0].id, 'e1');
  const a = preverDia({ refeicoes: todos, dia: DIA, modo: 'acima', mantidos: m1 }), b = preverDia({ refeicoes: todos, dia: DIA, modo: 'acima', mantidos: m2 });
  igual(a.jaLancado, 2000); igual(b.jaLancado, 500); perto(b.restante, 1600, 0.01); ok(a.semGeracao || a.restante < 150);
  ok(b.totalDia.kcal <= b.alvo + 1e-9); ok(!b.lancamentos.some(l => l.tipo === 'Café da manhã'), 'o café real continua sendo o único');
});
teste('todos os tipos do dia de origem já lançados: gera um único "Complemento do dia" proporcional', () => {
  const reais = [lanc('e1', '08:00', 'Café da manhã', 400), lanc('e2', '12:30', 'Almoço', 400)];
  const r = preverDia({ refeicoes: [...H(), ...reais], dia: DIA, modo: 'acima', mantidos: reais });
  igual(r.estrategia, 'complemento'); igual(r.lancamentos.length, 1); igual(r.lancamentos[0].texto, 'Complemento do dia');
  ok(r.lancamentos[0].itens.length >= 2, 'usa o dia de origem inteiro'); ok(r.totalDia.kcal <= r.alvo + 1e-9); ok(r.totalDia.kcal > 1400);
  ok(r.lancamentos[0].origem === ORIGEM_ESTIMADO && r.lancamentos[0].estimadoLote);
});
teste('escala extrema (< 0,25×) cai no complemento; (> 2,5×) idem', () => {
  // origem: café 600 + almoço 1400; já tem o almoço (1900): falta 200; o café escalaria 0,33× -> dentro; com 2090 faltam < 50
  const c1 = completarDia({ refeicoesOrigem: dia('2026-10-01', 2000), mantidos: [lanc('m1', '12:30', 'Almoço', 1960)], alvo: 2100, dia: DIA, lote: 'L', dataOrigem: '2026-10-01', modo: 'acima' });
  igual(c1.estrategia, 'complemento', 'falta 140 de um café de 600 = 0,23x: complemento'); ok(c1.totalDia.kcal <= 2100);
  const c2 = completarDia({ refeicoesOrigem: dia('2026-10-01', 2000), mantidos: [lanc('m2', '08:00', 'Café da manhã', 10)], alvo: 4500, dia: DIA, lote: 'L', dataOrigem: '2026-10-01', modo: 'acima' });
  igual(c2.estrategia, 'complemento', 'falta 4490 de um almoço de 1400 = 3,2x: complemento'); ok(c2.totalDia.kcal <= 4500);
});
teste('PROPRIEDADE: em centenas de casos aleatórios o total do dia (já lançado + gerado) nunca passa do alvo', () => {
  let s0 = 12345; const rnd = () => { s0 |= 0; s0 = (s0 + 0x6D2B79F5) | 0; let t = Math.imul(s0 ^ (s0 >>> 15), 1 | s0); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const TIPOS = ['Café da manhã', 'Almoço', 'Café da tarde', 'Jantar'];
  let gerou = 0, nada = 0;
  for (let n = 0; n < 400; n++) {
    const kc = Array.from({ length: 6 + Math.floor(rnd() * 5) }, () => 1700 + Math.floor(rnd() * 1200));
    const refs = hist(kc);
    const existentes = Array.from({ length: Math.floor(rnd() * 4) }, (_, i) => lanc('x' + n + '_' + i, ['08:00', '12:00', '16:00', '20:00'][i], TIPOS[Math.floor(rnd() * 4)], 50 + Math.floor(rnd() * 1500)));
    const modo = ['abaixo', 'normal', 'acima'][Math.floor(rnd() * 3)];
    const r = preverDia({ refeicoes: [...refs, ...existentes], dia: DIA, modo, mantidos: existentes });
    if (!r.ok) continue;
    const ja = existentes.reduce((a, l) => a + l.itens[0].kcal, 0);
    if (r.semGeracao) { nada++; ok(r.lancamentos.length === 0, 'semGeracao sem lançamentos'); continue; }
    gerou++;
    const finalKcal = ja + totaisDeRefeicoes(r.lancamentos).kcal;
    if (existentes.length) ok(finalKcal <= r.alvo + 1e-6, `caso ${n}: total ${finalKcal.toFixed(1)} > alvo ${r.alvo.toFixed(1)} (${r.estrategia})`);
    if (existentes.length) ok(Math.abs(r.totalDia.kcal - finalKcal) < 1e-6, 'totalDia coerente');
    if (existentes.length && r.estrategia !== 'complemento') { const tipos = new Set(existentes.map(l => l.tipo)); ok(r.lancamentos.every(l => !tipos.has(l.tipo)), 'não duplica tipo já lançado'); }
    for (const l of r.lancamentos) { igual(l.origem, ORIGEM_ESTIMADO); for (const i of l.itens) ok(i.gramas >= 1 && Number.isFinite(i.kcal)); }
  }
  ok(gerou > 100 && nada > 5, `casos com geração: ${gerou}, sem geração: ${nada}`);
});
teste('estimados no destino não entram no histórico nem mudam o alvo', () => {
  const gerados = [lanc('g1', '08:00', 'Café da manhã', 5000, { origem: ORIGEM_ESTIMADO, estimadoLote: 'L' })];
  const m = [lanc('q', '20:00', 'Jantar', 300)];
  const a = preverDia({ refeicoes: H(), dia: DIA, modo: 'acima', mantidos: m });
  const b = preverDia({ refeicoes: [...H(), ...gerados, ...dia('2026-10-30', 6000, { origem: ORIGEM_ESTIMADO })], dia: DIA, modo: 'acima', mantidos: m });
  igual(a.alvo, b.alvo); igual(a.dataOrigem, b.dataOrigem);
});
fim();
