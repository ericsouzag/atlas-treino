// Gamificação: XP por dia (idempotente), tetos, estimados não contam, sequências, retroativo de 7 dias, níveis, missões e conquistas.
import { teste, igual, perto, ok, fim } from './_t.mjs';
import {
  indexar, xpDoDia, reconciliarXP, totalXP, nivelDe, xpParaNivel, tituloDoNivel, acessoriosLiberados, molduraDoNivel, sequenciaRegistro, sequenciaTreino,
  semanaCompletaDeTreino, missoesDoDia, desafioSemanal, estatisticas, novasConquistas, CONQUISTAS, TETO_DIA, fracaoTreino, contaParaGamificacao, PATENTES,
} from '../js/gamificacao.js';

const p2 = n => String(n).padStart(2, '0');
const somar = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const dow = iso => new Date(iso + 'T12:00:00').getDay();
let HOJE = '2026-11-18'; while (dow(HOJE) !== 3) HOJE = somar(HOJE, 1);   // uma quarta-feira
let DOM = somar(HOJE, -3); while (dow(DOM) !== 0) DOM = somar(DOM, -1);    // um domingo anterior
const METAS = { kcal: 2000, prot: 120, agua: 2500 };
let seq = 0;
const ref = (dia, kcal, p, tipo = 'Almoço', extra = {}) => ({ id: `r${++seq}`, ts: `${dia}T12:00:00`, tipo, itens: [{ nome: 'x', gramas: 100, kcal, p, f: 3 }], ...extra });
const diaCheio = (dia, extra = {}) => [ref(dia, 1000, 60, 'Café da manhã', extra), ref(dia, 1000, 65, 'Jantar', extra)];   // 2000 kcal, 125 g de proteína
const treino = (dia, extra = {}) => ({ id: `t${++seq}`, data: dia, concluido: true, titulo: 'T', exercicios: [{ series: [{ feito: true }, { feito: true }, { feito: true }, { feito: true }] }], ...extra });
const planoTodos = () => ({ plano: { dias: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, { titulo: 'T' }])) } });
const D = (o = {}) => ({ refeicoes: [], treinos: [], atividades: [], corpo: [], agua: {}, plano: null, metas: METAS, favoritos: 0, ...o });
const xp = (dia, dados) => xpDoDia(dia, indexar(dados), HOJE);
const k = (r, chave) => (r.itens.find(i => i.k === chave) || {}).xp || 0;

console.log('XP por dia');
teste('treino da ficha: completo = 40; parcial proporcional (mín. 10); atividade por duração com teto', () => {
  igual(k(xp(HOJE, D({ treinos: [treino(HOJE)] })), 'treino'), 40);
  const parcial = treino(HOJE, { exercicios: [{ series: [{ feito: true }, { feito: false }, { feito: false }, { feito: false }] }] });
  igual(fracaoTreino(parcial), 0.25); igual(k(xp(HOJE, D({ treinos: [parcial] })), 'treino'), 10);
  igual(k(xp(HOJE, D({ treinos: [treino(HOJE, { exercicios: [{ series: [{ feito: true }, { feito: true }, { feito: false }, { feito: false }] }] })] })), 'treino'), 20);
  igual(k(xp(HOJE, D({ atividades: [{ id: 'a', ts: `${HOJE}T18:00:00`, durMin: 40 }] })), 'atividade'), 20);
  igual(k(xp(HOJE, D({ atividades: [{ id: 'a', ts: `${HOJE}T18:00:00`, durMin: 120 }] })), 'atividade'), 30, 'teto da atividade');
  const junto = xp(HOJE, D({ treinos: [treino(HOJE), treino(HOJE)], atividades: [{ id: 'a', ts: `${HOJE}T18:00:00`, durMin: 120 }] }));
  igual(k(junto, 'treino') + k(junto, 'atividade'), 60, 'teto combinado de 60');
});
teste('metas do dia: registro, calorias ±10%, proteína, água e dia completo', () => {
  const r = xp(HOJE, D({ refeicoes: diaCheio(HOJE), agua: { [HOJE]: 2500 } }));
  igual(k(r, 'registro'), 10); igual(k(r, 'kcal'), 20); igual(k(r, 'proteina'), 15); igual(k(r, 'agua'), 10); igual(k(r, 'completo'), 10);
  const baixo = xp(HOJE, D({ refeicoes: [ref(HOJE, 900, 40), ref(HOJE, 500, 20)] }));   // 1400 kcal: fora da faixa
  igual(k(baixo, 'kcal'), 0); igual(k(baixo, 'proteina'), 0); igual(k(baixo, 'registro'), 10);
  igual(k(xp(HOJE, D({ refeicoes: [ref(HOJE, 2000, 130)] })), 'registro'), 0, 'um lançamento só não é "dia registrado"');
});
teste('peso/medidas: 10 XP uma vez por semana (no primeiro dia da semana com registro)', () => {
  const seg = somar(HOJE, -2), c = [{ id: 'c1', data: seg, peso: 80 }, { id: 'c2', data: somar(seg, 2), peso: 79.8 }];
  igual(k(xp(seg, D({ corpo: c })), 'corpo'), 10); igual(k(xp(somar(seg, 2), D({ corpo: c })), 'corpo'), 0);
});
teste('REGRA CRÍTICA: lançamentos "dia-estimado" (inclusive automáticos) nunca geram XP, sequência, missão nem conquista', () => {
  const est = { origem: 'dia-estimado', estimadoModo: 'automatico' };
  const dados = D({ refeicoes: diaCheio(HOJE, est), treinos: [treino(HOJE, est)], atividades: [{ id: 'a', ts: `${HOJE}T18:00:00`, durMin: 60, ...est }], corpo: [{ id: 'c', data: HOJE, peso: 80, ...est }], plano: planoTodos() });
  const r = xp(HOJE, dados); igual(r.xp, 0, JSON.stringify(r.itens));
  ok(!contaParaGamificacao(est) && contaParaGamificacao({ id: 'x' }));
  igual(sequenciaRegistro(indexar(dados), HOJE).dias, 0); igual(missoesDoDia(HOJE, indexar(dados)).filter(m => m.feito).length, 0);
  const st = estatisticas(dados, {}); igual(st.refeicoes, 0); igual(st.sessoes, 0); igual(novasConquistas(st, []).length, 0);
  // misturado: o real conta, o estimado não
  const mix = D({ refeicoes: [...diaCheio(HOJE), ...diaCheio(somar(HOJE, -1), est)], plano: null });
  igual(sequenciaRegistro(indexar(mix), HOJE).dias, 1);
});
teste('teto diário de 180 XP (domingo com tudo: treino, metas, semana, desafio, missões)', () => {
  const sem = Array.from({ length: 7 }, (_, i) => somar(DOM, -6 + i));   // segunda a domingo
  const dados = D({ refeicoes: sem.flatMap(d => diaCheio(d)), treinos: sem.map(d => treino(d)), agua: Object.fromEntries(sem.map(d => [d, 3000])), plano: planoTodos(), corpo: [{ id: 'c', data: DOM, peso: 70 }], atividades: [{ id: 'a', ts: `${DOM}T08:00:00`, durMin: 60 }] });
  const r = xp(DOM, dados); ok(r.xp <= TETO_DIA, 'xp ' + r.xp); igual(r.xp, TETO_DIA);
  ok(k(r, 'semana') >= 0);
});

console.log('\nIdempotência e retroativo');
teste('reconciliar é idempotente e determinístico: segunda rodada não muda nada', () => {
  const dados = D({ refeicoes: [...diaCheio(HOJE), ...diaCheio(somar(HOJE, -1))], treinos: [treino(HOJE)], agua: { [HOJE]: 2500 } });
  const a = reconciliarXP({ hoje: HOJE, dados, existentes: {} }); ok(a.atualizar.length >= 2);
  const ex = Object.fromEntries(a.atualizar.map(x => [x.dia, { xp: x.xp, itens: x.itens }]));
  const b = reconciliarXP({ hoje: HOJE, dados, existentes: ex }); igual(b.atualizar.length, 0); igual(b.remover.length, 0);
  igual(totalXP(ex), a.atualizar.reduce((s, x) => s + x.xp, 0));
});
teste('apagar o registro recalcula: o XP do dia some; editar (mesmo dia várias vezes) não acumula', () => {
  const dados = D({ refeicoes: diaCheio(HOJE), treinos: [treino(HOJE)] });
  const a = reconciliarXP({ hoje: HOJE, dados, existentes: {} }), ex = Object.fromEntries(a.atualizar.map(x => [x.dia, { xp: x.xp, itens: x.itens }]));
  const dup = D({ refeicoes: [...diaCheio(HOJE), ...diaCheio(HOJE)], treinos: [treino(HOJE), treino(HOJE)] });
  const c = reconciliarXP({ hoje: HOJE, dados: dup, existentes: ex });
  const novoHoje = c.atualizar.find(x => x.dia === HOJE); ok(!novoHoje || novoHoje.xp <= a.atualizar.find(x => x.dia === HOJE).xp + 60, 'duplicar não multiplica o XP');
  const vazio = reconciliarXP({ hoje: HOJE, dados: D(), existentes: ex }); ok(vazio.remover.includes(HOJE));
});
teste('retroativo: dias até 7 atrás recalculam; mais antigos ficam congelados (e só preenchem o que não existe)', () => {
  const velho = somar(HOJE, -20), recente = somar(HOJE, -5);
  const ex = { [velho]: { xp: 77, itens: [] }, [recente]: { xp: 77, itens: [] } };
  const r = reconciliarXP({ hoje: HOJE, dados: D({ refeicoes: [...diaCheio(velho), ...diaCheio(recente)] }), existentes: ex });
  ok(!r.atualizar.some(x => x.dia === velho), 'dia antigo existente não muda'); ok(r.atualizar.some(x => x.dia === recente), 'dia recente recalcula');
  const apagado = reconciliarXP({ hoje: HOJE, dados: D(), existentes: ex }); ok(!apagado.remover.includes(velho) && apagado.remover.includes(recente));
  const primeiro = reconciliarXP({ hoje: HOJE, dados: D({ refeicoes: diaCheio(velho) }), existentes: {} }); ok(primeiro.atualizar.some(x => x.dia === velho), 'primeiro preenchimento do histórico');
  const longe = somar(HOJE, -90); ok(!reconciliarXP({ hoje: HOJE, dados: D({ refeicoes: diaCheio(longe) }), existentes: {} }).atualizar.some(x => x.dia === longe), 'além de 60 dias não entra');
});

console.log('\nSequências, níveis, missões e conquistas');
teste('sequência de registro: dia de graça (1 a cada 7) e hoje aberto não quebra', () => {
  const dias = [0, 1, 2, 3, 4].map(n => somar(HOJE, -n));
  igual(sequenciaRegistro(indexar(D({ refeicoes: dias.flatMap(d => [ref(d, 500, 10)]) })), HOJE).dias, 5);
  const semHoje = [1, 2, 3].map(n => somar(HOJE, -n)); igual(sequenciaRegistro(indexar(D({ refeicoes: semHoje.map(d => ref(d, 500, 10)) })), HOJE).dias, 3, 'hoje ainda aberto');
  const comBuraco = [0, 1, 3, 4, 5].map(n => somar(HOJE, -n)); const s = sequenciaRegistro(indexar(D({ refeicoes: comBuraco.map(d => ref(d, 500, 10)) })), HOJE);
  igual(s.dias, 5); igual(s.graca, 1);
  const doisBuracos = [0, 2, 4].map(n => somar(HOJE, -n)); igual(sequenciaRegistro(indexar(D({ refeicoes: doisBuracos.map(d => ref(d, 500, 10)) })), HOJE).dias, 2, 'só 1 graça por janela');
});
teste('sequência de treino não quebra em dia de descanso programado nem no treino de hoje ainda por fazer', () => {
  // ficha: só segunda, quarta e sexta
  const plano = { plano: { dias: { 1: { titulo: 'A' }, 3: { titulo: 'B' }, 5: { titulo: 'C' } } } };
  const ate = somar(HOJE, 0);   // quarta
  const seg = somar(HOJE, -2), sexAnt = somar(HOJE, -5);
  const idx = indexar(D({ plano, treinos: [treino(seg), treino(sexAnt)] }));
  igual(sequenciaTreino(idx, ate, HOJE), 2, 'terça/quinta/sábado/domingo (descanso) não contam e hoje não quebra');
  const idx2 = indexar(D({ plano, treinos: [treino(sexAnt)] })); igual(sequenciaTreino(idx2, ate, HOJE), 0 + 0, 'segunda perdida quebra a sequência');
  const semana = indexar(D({ plano, treinos: [treino(seg), treino(somar(seg, 2)), treino(somar(seg, 4))] })); ok(semanaCompletaDeTreino(semana, seg));
  ok(!semanaCompletaDeTreino(indexar(D({ plano, treinos: [treino(seg)] })), seg)); ok(!semanaCompletaDeTreino(indexar(D({ plano: null })), seg));
});
teste('níveis 1 a 50: curva crescente, títulos de patente e desbloqueios', () => {
  igual(xpParaNivel(1), 0); igual(nivelDe(0).nivel, 1); igual(nivelDe(99).nivel, 1); igual(nivelDe(100).nivel, 2); igual(nivelDe(10 ** 9).nivel, 50); igual(nivelDe(10 ** 9).fracao, 1);
  for (let n = 2; n <= 50; n++) ok(xpParaNivel(n) > xpParaNivel(n - 1), 'curva estritamente crescente');
  igual(tituloDoNivel(1), 'Recruta I'); igual(tituloDoNivel(5), 'Recruta V'); igual(tituloDoNivel(6), 'Explorador I'); igual(tituloDoNivel(50), 'Lenda da Campanha V'); igual(PATENTES.length, 10);
  const n = nivelDe(xpParaNivel(7) + 10); igual(n.nivel, 7); igual(n.xpNoNivel, 10); ok(n.fracao > 0 && n.fracao < 1);
  igual(acessoriosLiberados(2).length, 0); ok(acessoriosLiberados(12).length >= 4); igual(molduraDoNivel(9), 0); igual(molduraDoNivel(10), 1); igual(molduraDoNivel(45), 4);
});
teste('missões: 3 por dia, determinísticas; desafio semanal fixo na semana e conta progresso', () => {
  const idx = indexar(D({ refeicoes: diaCheio(HOJE), agua: { [HOJE]: 2000 } }));
  const m1 = missoesDoDia(HOJE, idx), m2 = missoesDoDia(HOJE, idx); igual(m1.length, 3); igual(JSON.stringify(m1), JSON.stringify(m2));
  ok(new Set(m1.map(m => m.id)).size === 3); const outros = new Set(Array.from({ length: 10 }, (_, i) => missoesDoDia(somar(HOJE, i), idx).map(m => m.id).join())); ok(outros.size > 1, 'varia com a data');
  const d1 = desafioSemanal(HOJE, idx), d2 = desafioSemanal(somar(HOJE, 1), idx); igual(d1.id, d2.id, 'mesma semana, mesmo desafio'); ok(d1.meta > 0 && d1.atual >= 0 && d1.atual <= d1.meta);
});
teste('conquistas: 20 a 30, liberam por estatísticas e nunca são revogadas', () => {
  ok(CONQUISTAS.length >= 20 && CONQUISTAS.length <= 30, 'qtd ' + CONQUISTAS.length); igual(new Set(CONQUISTAS.map(c => c.id)).size, CONQUISTAS.length);
  const dados = D({ refeicoes: Array.from({ length: 8 }, (_, i) => ref(somar(HOJE, -i), 1500, 50)), treinos: [treino(HOJE)], corpo: [{ id: 'c', data: HOJE, peso: 80, gordura: 20 }], favoritos: 1 });
  const st = estatisticas(dados, { xpTotal: 150, personagemCriado: true });
  const n = novasConquistas(st, []); for (const id of ['primeira-refeicao', 'primeiro-treino', 'sete-dias', 'primeiro-peso', 'primeira-gordura', 'favorito', 'personagem']) ok(n.includes(id), id);
  ok(!n.includes('dez-treinos') && !n.includes('cem-refeicoes'));
  igual(novasConquistas(st, n).length, 0, 'já guardadas não repetem');
  igual(novasConquistas(estatisticas(D(), {}), n).length, 0, 'sem dados não revoga nem inventa');
});
fim();
