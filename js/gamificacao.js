// Gamificação da Jornada: XP por DIA (idempotente, determinístico), níveis, sequências, missões e conquistas. Funções PURAS e testadas
// (tests/gamificacao.test.mjs). A parte impura (gravar no store, toast) está em js/jornada.js.
//
// DECISÕES (também na tela "Como funciona" e no README)
//  * XP não é acumulado por eventos: é RECALCULADO por dia a partir dos registros REAIS. Cada dia guarda o XP concedido e o total é a soma.
//    Se a pessoa apaga o registro, o XP do dia é recalculado. Dias até 7 dias atrás são recalculados; mais antigos ficam congelados
//    (só um primeiro preenchimento do histórico, dos últimos 60 dias, quando ainda não há XP guardado).
//  * Registros 'dia-estimado' (preenchimento automático ou "Registrar um dia inteiro") NUNCA geram XP, sequência, missão ou conquista
//    (usa contaParaGamificacao de js/preenchimento-automatico.js).
//  * Teto de XP por dia: 180. Sem punição: perder sequência não tira XP; há 1 "dia de graça" por janela de 7 dias na sequência de registro.
//  * Tabela de XP por dia: treino da ficha (40 x fração feita, mín. 10; teto 60 com atividades), atividade avulsa (1 por 2 min, até 30),
//    refeições registradas (2 ou mais lançamentos: 10), calorias dentro de ±10% da meta (20), proteína na meta (15), água na meta (10),
//    dia completo (+10 quando as quatro metas batem), peso/medidas na semana (10, uma vez por semana), sequência de registro (3 dias: 3,
//    7 dias: 5, 14 dias: 8), missões do dia (10 cada, até 30), domingo: semana completa de treino (50) e desafio semanal (40).
import { contaParaGamificacao } from './preenchimento-automatico.js';
import { somarDias, diaSemana, segundaDaSemana } from './datas.js';

export { contaParaGamificacao };
export const TETO_DIA = 180;
export const JANELA_RETRO = 7;
export const BACKFILL = 60;
export const NIVEL_MAX = 50;

const num = x => (Number.isFinite(+x) ? +x : 0);
const vivo = x => x && !x._d;
const diaDoTs = ts => String(ts).slice(0, 10);

// ----------------------------------------------------------------------------------------------- níveis e títulos
/** XP total necessário para ALCANÇAR o nível n (n=1 -> 0) */
export const xpParaNivel = n => (n <= 1 ? 0 : Math.round(100 * (n - 1) ** 1.6));
export function nivelDe(xpTotal) {
  const xp = Math.max(0, num(xpTotal));
  let n = 1; while (n < NIVEL_MAX && xp >= xpParaNivel(n + 1)) n++;
  const ini = xpParaNivel(n), fim = n < NIVEL_MAX ? xpParaNivel(n + 1) : ini;
  return { nivel: n, xpNoNivel: xp - ini, xpDoNivel: fim - ini, fracao: n >= NIVEL_MAX ? 1 : (xp - ini) / (fim - ini), proximo: fim, titulo: tituloDoNivel(n) };
}
export const PATENTES = ['Recruta', 'Explorador', 'Cabo', 'Sargento', 'Subtenente', 'Guia de Campo', 'Capitão de Campo', 'Comandante de Expedição', 'Mestre de Campanha', 'Lenda da Campanha'];
const ROMANOS = ['I', 'II', 'III', 'IV', 'V'];
export const tituloDoNivel = n => `${PATENTES[Math.min(PATENTES.length - 1, Math.floor((Math.max(1, n) - 1) / 5))]} ${ROMANOS[(Math.max(1, n) - 1) % 5]}`;

/** Acessórios desbloqueados por nível (ids usados por personagem-svg.js) */
export const ACESSORIOS = [
  { id: 'faixa', rotulo: 'Faixa de cabeça', nivel: 3 }, { id: 'relogio', rotulo: 'Relógio de pulso', nivel: 5 }, { id: 'bone', rotulo: 'Boné de campo', nivel: 8 },
  { id: 'medalha', rotulo: 'Medalha de campanha', nivel: 12 }, { id: 'luvas', rotulo: 'Luvas de treino', nivel: 18 }, { id: 'insignia', rotulo: 'Insígnia no peito', nivel: 25 },
];
export const acessoriosLiberados = nivel => ACESSORIOS.filter(a => nivel >= a.nivel);
/** Moldura do personagem por faixa de nível (0 a 4) */
export const molduraDoNivel = n => (n >= 40 ? 4 : n >= 30 ? 3 : n >= 20 ? 2 : n >= 10 ? 1 : 0);

// ----------------------------------------------------------------------------------------------- dados do dia
/** Filtra só os registros REAIS e indexa por dia. `dados`: { refeicoes, treinos, atividades, corpo, agua:{dia:ml}, plano, metas, favoritos } */
export function indexar(dados) {
  const idx = { ref: new Map(), tre: new Map(), atv: new Map(), corpo: new Map(), agua: dados.agua || {}, plano: dados.plano || null, metas: dados.metas || {}, favoritos: dados.favoritos || 0 };
  const poe = (m, d, x) => { if (!m.has(d)) m.set(d, []); m.get(d).push(x); };
  for (const r of dados.refeicoes || []) if (vivo(r) && r.ts && contaParaGamificacao(r)) poe(idx.ref, diaDoTs(r.ts), r);
  for (const t of dados.treinos || []) if (vivo(t) && t.concluido && t.data && contaParaGamificacao(t)) poe(idx.tre, t.data, t);
  for (const a of dados.atividades || []) if (vivo(a) && a.ts && contaParaGamificacao(a)) poe(idx.atv, diaDoTs(a.ts), a);
  for (const c of dados.corpo || []) if (vivo(c) && c.data && contaParaGamificacao(c)) poe(idx.corpo, c.data, c);
  return idx;
}
const totaisDia = (rs = []) => { const t = { kcal: 0, p: 0, f: 0 }; for (const r of rs) for (const i of r.itens || []) { t.kcal += num(i.kcal); t.p += num(i.p); t.f += num(i.f); } return t; };
export const fracaoTreino = t => {
  const series = (t.exercicios || []).flatMap(e => e.series || []);
  if (!series.length) return t.parcial ? 0.5 : 1;
  return series.filter(s => s.feito).length / series.length;
};
const programado = (plano, dia) => !!(plano && plano.plano && plano.plano.dias && plano.plano.dias[diaSemana(dia)]);
const minutosAtv = idx => dia => (idx.atv.get(dia) || []).reduce((s, a) => s + num(a.durMin), 0);
/** O dia teve treino (concluído da ficha) ou atividade de pelo menos 20 min? */
export const diaDeTreino = (idx, dia) => (idx.tre.get(dia) || []).some(t => fracaoTreino(t) > 0) || minutosAtv(idx)(dia) >= 20;

// ----------------------------------------------------------------------------------------------- sequências
/** Sequência de registro (dias seguidos com refeição real) até `ate`, com 1 dia de graça por janela de 7 dias */
export function sequenciaRegistro(idx, ate, { hoje = ate } = {}) {
  let d = ate; if (!idx.ref.has(d) && d === hoje) d = somarDias(d, -1);   // hoje ainda aberto não quebra
  let dias = 0, ultimaGraca = null, graca = 0;
  for (let i = 0; i < 400; i++) {
    if (idx.ref.has(d)) dias++;
    else if (dias > 0 && (ultimaGraca === null || dias - ultimaGraca >= 7)) { ultimaGraca = dias; graca++; }
    else break;
    d = somarDias(d, -1);
  }
  return { dias, graca };
}
/** Sequência de treino: dias PROGRAMADOS seguidos que foram feitos (dias de descanso programados não quebram) */
export function sequenciaTreino(idx, ate, hoje = ate) {
  let n = 0;
  for (let i = 0, d = ate; i < 400; i++, d = somarDias(d, -1)) {
    if (!programado(idx.plano, d)) continue;
    if (diaDeTreino(idx, d)) n++;
    else if (d === hoje) continue;   // o treino de hoje ainda pode acontecer
    else break;
  }
  return n;
}
/** A semana (segunda a domingo) de `dia` teve todos os treinos programados feitos? (precisa de ao menos 1 programado) */
export function semanaCompletaDeTreino(idx, dia) {
  const seg = segundaDaSemana(dia); let prog = 0, feitos = 0;
  for (let i = 0; i < 7; i++) { const d = somarDias(seg, i); if (programado(idx.plano, d)) { prog++; if (diaDeTreino(idx, d)) feitos++; } }
  return prog > 0 && feitos === prog;
}

// ----------------------------------------------------------------------------------------------- missões
const POOL_MISSOES = [
  { id: 'cafe', rotulo: 'Registrar o café da manhã', teste: (idx, d) => (idx.ref.get(d) || []).some(r => /caf[eé] da manh/i.test(r.tipo || '')) },
  { id: 'jantar', rotulo: 'Registrar o jantar', teste: (idx, d) => (idx.ref.get(d) || []).some(r => /jantar/i.test(r.tipo || '')) },
  { id: 'agua', rotulo: 'Beber 1,5 L de água', teste: (idx, d) => num(idx.agua[d]) >= 1500 },
  { id: 'mexer', rotulo: 'Se mexer por 20 minutos (treino ou atividade)', teste: (idx, d) => diaDeTreino(idx, d) },
  { id: 'tres', rotulo: 'Registrar 3 refeições', teste: (idx, d) => (idx.ref.get(d) || []).length >= 3 },
  { id: 'proteina', rotulo: 'Bater a meta de proteína', teste: (idx, d) => idx.metas.prot > 0 && totaisDia(idx.ref.get(d)).p >= idx.metas.prot },
  { id: 'peso', rotulo: 'Registrar seu peso', teste: (idx, d) => (idx.corpo.get(d) || []).some(c => c.peso != null) },
  { id: 'fibra', rotulo: 'Chegar a 20 g de fibra', teste: (idx, d) => totaisDia(idx.ref.get(d)).f >= 20 },
];
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
/** 3 missões leves do dia (sorteio determinístico pela data) com o estado de cada uma */
export function missoesDoDia(dia, idx) {
  const ord = [...POOL_MISSOES].sort((a, b) => hash(dia + a.id) - hash(dia + b.id)).slice(0, 3);
  return ord.map(m => ({ id: m.id, rotulo: m.rotulo, feito: !!m.teste(idx, dia) }));
}
const POOL_DESAFIOS = [
  { id: 'treinar3', rotulo: 'Treinar em 3 dias desta semana', meta: 3, conta: (idx, dias) => dias.filter(d => diaDeTreino(idx, d)).length },
  { id: 'registro5', rotulo: 'Registrar refeições em 5 dias desta semana', meta: 5, conta: (idx, dias) => dias.filter(d => idx.ref.has(d)).length },
  { id: 'agua4', rotulo: 'Beber 2 L de água em 4 dias desta semana', meta: 4, conta: (idx, dias) => dias.filter(d => num(idx.agua[d]) >= 2000).length },
  { id: 'proteina4', rotulo: 'Bater a meta de proteína em 4 dias desta semana', meta: 4, conta: (idx, dias) => dias.filter(d => idx.metas.prot > 0 && totaisDia(idx.ref.get(d)).p >= idx.metas.prot).length },
];
/** Desafio da semana (1), sorteado pela segunda-feira */
export function desafioSemanal(dia, idx) {
  const seg = segundaDaSemana(dia), dias = Array.from({ length: 7 }, (_, i) => somarDias(seg, i));
  const d = POOL_DESAFIOS[hash(seg) % POOL_DESAFIOS.length], atual = d.conta(idx, dias);
  return { id: d.id, rotulo: d.rotulo, meta: d.meta, atual: Math.min(atual, d.meta), feito: atual >= d.meta, semana: seg };
}

// ----------------------------------------------------------------------------------------------- XP do dia
/**
 * XP concedido por um dia, a partir dos registros reais. Retorna { xp, itens:[{k, rotulo, xp}] } (itens com xp 0 não aparecem).
 * `hoje` só importa para a sequência (o dia de hoje ainda aberto).
 */
export function xpDoDia(dia, idx, hoje = dia) {
  const itens = [], add = (k, rotulo, xp) => { if (xp > 0) itens.push({ k, rotulo, xp: Math.round(xp) }); };
  // treino da ficha e atividade avulsa
  const trs = idx.tre.get(dia) || [], atvs = idx.atv.get(dia) || [];
  const xT = Math.min(60, trs.reduce((s, t) => { const f = fracaoTreino(t); return s + (f > 0 ? Math.max(10, 40 * f) : 0); }, 0));
  const xA = Math.min(30, 60 - xT, atvs.reduce((s, a) => s + Math.min(30, num(a.durMin) / 2), 0));
  add('treino', trs.some(t => fracaoTreino(t) < 1) ? 'Treino (parcial conta proporcional)' : 'Treino feito', xT); add('atividade', 'Atividade registrada', xA);
  // metas do dia
  const rs = idx.ref.get(dia) || [], t = totaisDia(rs), m = idx.metas || {};
  const registrou = rs.length >= 2 && t.kcal >= 800;
  if (rs.length >= 2) add('registro', 'Refeições do dia registradas', 10);
  const kcalOk = registrou && m.kcal > 0 && t.kcal >= 0.9 * m.kcal && t.kcal <= 1.1 * m.kcal; if (kcalOk) add('kcal', 'Calorias dentro da meta (±10%)', 20);
  const protOk = registrou && m.prot > 0 && t.p >= m.prot; if (protOk) add('proteina', 'Meta de proteína', 15);
  const aguaOk = m.agua > 0 && num(idx.agua[dia]) >= m.agua; if (aguaOk) add('agua', 'Meta de água', 10);
  if (kcalOk && protOk && aguaOk) add('completo', 'Dia completo', 10);
  // peso/medidas: uma vez por semana (no primeiro dia da semana com registro)
  const cs = idx.corpo.get(dia) || [];
  if (cs.length) { const seg = segundaDaSemana(dia); let primeiro = true; for (let i = 0; i < 7; i++) { const d = somarDias(seg, i); if (d < dia && idx.corpo.has(d)) { primeiro = false; break; } } if (primeiro) add('corpo', 'Peso/medidas da semana', 10); }
  // sequência de registro
  if (rs.length) { const q = sequenciaRegistro(idx, dia, { hoje }).dias; add('sequencia', `Sequência de ${q} dias`, q >= 14 ? 8 : q >= 7 ? 5 : q >= 3 ? 3 : 0); }
  // missões do dia (10 cada)
  const feitas = missoesDoDia(dia, idx).filter(x => x.feito).length; add('missoes', `Missões do dia (${feitas}/3)`, feitas * 10);
  // domingo: semana de treino completa e desafio semanal
  if (diaSemana(dia) === 0) {
    if (semanaCompletaDeTreino(idx, dia)) add('semana', 'Semana de treino completa', 50);
    const d = desafioSemanal(dia, idx); if (d.feito) add('desafio', 'Desafio da semana', 40);
  }
  // teto diário
  let resto = TETO_DIA; const final = [];
  for (const i of itens) { if (resto <= 0) break; const xp = Math.min(i.xp, resto); resto -= xp; final.push({ ...i, xp }); }
  return { xp: final.reduce((s, i) => s + i.xp, 0), itens: final };
}

/**
 * Compara o XP calculado com o guardado e diz o que gravar. `existentes`: { 'AAAA-MM-DD': { xp, itens } }.
 * Hoje e os últimos 7 dias são recalculados (inclusive remover quando o registro sumiu). Mais antigos: só preenche o que não existe.
 */
export function reconciliarXP({ hoje, dados, existentes = {} }) {
  const idx = indexar(dados), atualizar = [], remover = [];
  for (let i = BACKFILL; i >= 0; i--) {
    const dia = somarDias(hoje, -i), ex = existentes[dia], calc = xpDoDia(dia, idx, hoje);
    if (i <= JANELA_RETRO) {
      if (calc.xp > 0 && (!ex || ex.xp !== calc.xp || JSON.stringify(ex.itens) !== JSON.stringify(calc.itens))) atualizar.push({ dia, xp: calc.xp, itens: calc.itens });
      else if (calc.xp === 0 && ex && ex.xp > 0) remover.push(dia);
    } else if (!ex && calc.xp > 0) atualizar.push({ dia, xp: calc.xp, itens: calc.itens });
  }
  return { atualizar, remover };
}
export const totalXP = existentes => Object.values(existentes || {}).reduce((s, x) => s + (x && !x._d ? num(x.xp) : 0), 0);

// ----------------------------------------------------------------------------------------------- estatísticas e conquistas
/** Estatísticas dos registros REAIS usadas pelas conquistas */
export function estatisticas(dados, { xpTotal = 0, personagemCriado = false } = {}) {
  const idx = indexar(dados), dias = new Set([...idx.ref.keys(), ...idx.tre.keys(), ...idx.atv.keys(), ...idx.corpo.keys()]);
  const ord = [...dias].sort(), ini = ord[0], fim = ord[ord.length - 1];
  let diasProteina = 0, diasAgua = 0, diasKcal = 0, diasCompletos = 0, melhorSeqRegistro = 0, melhorSeqTreino = 0, semanasCompletas = 0, seqR = 0, seqT = 0;
  const semanas = new Set();
  if (ini) for (let d = ini; d <= fim; d = somarDias(d, 1)) {
    const rs = idx.ref.get(d) || [], t = totaisDia(rs), m = idx.metas, reg = rs.length >= 2 && t.kcal >= 800;
    const p = reg && m.prot > 0 && t.p >= m.prot, a = m.agua > 0 && num(idx.agua[d]) >= m.agua, k = reg && m.kcal > 0 && t.kcal >= 0.9 * m.kcal && t.kcal <= 1.1 * m.kcal;
    if (p) diasProteina++; if (a) diasAgua++; if (k) diasKcal++; if (p && a && k) diasCompletos++;
    seqR = idx.ref.has(d) ? seqR + 1 : 0; melhorSeqRegistro = Math.max(melhorSeqRegistro, seqR);
    if (programado(idx.plano, d)) { if (diaDeTreino(idx, d)) { seqT++; melhorSeqTreino = Math.max(melhorSeqTreino, seqT); } else seqT = 0; }
    const seg = segundaDaSemana(d); if (!semanas.has(seg) && diaSemana(d) === 0 && semanaCompletaDeTreino(idx, d)) { semanas.add(seg); semanasCompletas++; }
  }
  const corpoTodos = [...idx.corpo.values()].flat();
  const nTre = [...idx.tre.values()].reduce((s, l) => s + l.filter(t => fracaoTreino(t) > 0).length, 0), nAtv = [...idx.atv.values()].reduce((s, l) => s + l.length, 0);
  return {
    treinos: nTre, atividades: nAtv, sessoes: nTre + nAtv, refeicoes: [...idx.ref.values()].reduce((s, l) => s + l.length, 0), diasRegistro: idx.ref.size,
    melhorSeqRegistro, melhorSeqTreino, semanasCompletas, diasProteina, diasAgua, diasKcal, diasCompletos, registrosPeso: corpoTodos.filter(c => c.peso != null).length,
    comGordura: corpoTodos.some(c => c.gordura != null), comMedidas: corpoTodos.some(c => Object.keys(c.medidas || {}).length >= 3), xpTotal, nivel: nivelDe(xpTotal).nivel,
    favoritos: idx.favoritos, personagemCriado,
  };
}
export const CONQUISTAS = [
  { id: 'primeira-refeicao', rotulo: 'Primeiro registro', desc: 'Registre sua primeira refeição.', ok: s => s.refeicoes >= 1 },
  { id: 'primeiro-treino', rotulo: 'Primeiro treino', desc: 'Conclua seu primeiro treino ou atividade.', ok: s => s.sessoes >= 1 },
  { id: 'primeira-atividade', rotulo: 'Em movimento', desc: 'Registre uma atividade avulsa (corrida, caminhada, bike...).', ok: s => s.atividades >= 1 },
  { id: 'dez-treinos', rotulo: '10 treinos', desc: 'Conclua 10 treinos da ficha.', ok: s => s.treinos >= 10 },
  { id: 'vinte-cinco-treinos', rotulo: '25 treinos', desc: 'Conclua 25 treinos da ficha.', ok: s => s.treinos >= 25 },
  { id: 'cem-treinos', rotulo: '100 treinos', desc: 'Conclua 100 treinos da ficha.', ok: s => s.treinos >= 100 },
  { id: 'sete-dias', rotulo: '7 dias de registro', desc: 'Registre refeições por 7 dias seguidos.', ok: s => s.melhorSeqRegistro >= 7 },
  { id: 'catorze-dias', rotulo: '14 dias de registro', desc: 'Registre refeições por 14 dias seguidos.', ok: s => s.melhorSeqRegistro >= 14 },
  { id: 'trinta-dias', rotulo: '30 dias de registro', desc: 'Registre refeições por 30 dias seguidos.', ok: s => s.melhorSeqRegistro >= 30 },
  { id: 'cem-refeicoes', rotulo: '100 refeições', desc: 'Registre 100 refeições.', ok: s => s.refeicoes >= 100 },
  { id: 'proteina-5', rotulo: 'Proteína em dia', desc: 'Bata a meta de proteína em 5 dias.', ok: s => s.diasProteina >= 5 },
  { id: 'proteina-20', rotulo: 'Proteína constante', desc: 'Bata a meta de proteína em 20 dias.', ok: s => s.diasProteina >= 20 },
  { id: 'agua-5', rotulo: 'Hidratado', desc: 'Bata a meta de água em 5 dias.', ok: s => s.diasAgua >= 5 },
  { id: 'calorias-5', rotulo: 'No alvo', desc: 'Fique dentro da meta de calorias em 5 dias.', ok: s => s.diasKcal >= 5 },
  { id: 'dia-completo', rotulo: 'Dia completo', desc: 'Bata calorias, proteína e água no mesmo dia.', ok: s => s.diasCompletos >= 1 },
  { id: 'dez-dias-completos', rotulo: '10 dias completos', desc: 'Faça 10 dias completos.', ok: s => s.diasCompletos >= 10 },
  { id: 'semana-treino', rotulo: 'Semana completa', desc: 'Faça todos os treinos programados de uma semana.', ok: s => s.semanasCompletas >= 1 },
  { id: 'quatro-semanas', rotulo: '4 semanas completas', desc: 'Complete 4 semanas de treino.', ok: s => s.semanasCompletas >= 4 },
  { id: 'sequencia-treino', rotulo: 'Sequência de treino', desc: 'Faça 5 treinos programados seguidos.', ok: s => s.melhorSeqTreino >= 5 },
  { id: 'primeiro-peso', rotulo: 'Primeira pesagem', desc: 'Registre seu peso.', ok: s => s.registrosPeso >= 1 },
  { id: 'quatro-pesagens', rotulo: 'Acompanhamento', desc: 'Registre seu peso 4 vezes.', ok: s => s.registrosPeso >= 4 },
  { id: 'primeira-gordura', rotulo: 'Composição', desc: 'Registre seu % de gordura.', ok: s => s.comGordura },
  { id: 'medidas', rotulo: 'Medidas na fita', desc: 'Registre 3 ou mais medidas corporais.', ok: s => s.comMedidas },
  { id: 'favorito', rotulo: 'Atalho favorito', desc: 'Guarde um favorito.', ok: s => s.favoritos >= 1 },
  { id: 'personagem', rotulo: 'Meu personagem', desc: 'Crie o seu personagem.', ok: s => s.personagemCriado },
  { id: 'nivel-5', rotulo: 'Nível 5', desc: 'Chegue ao nível 5.', ok: s => s.nivel >= 5 },
  { id: 'nivel-10', rotulo: 'Nível 10', desc: 'Chegue ao nível 10.', ok: s => s.nivel >= 10 },
  { id: 'nivel-20', rotulo: 'Nível 20', desc: 'Chegue ao nível 20.', ok: s => s.nivel >= 20 },
  { id: 'xp-1000', rotulo: '1.000 XP', desc: 'Some 1.000 de XP.', ok: s => s.xpTotal >= 1000 },
];
/** Conquistas novas (ainda não guardadas) segundo as estatísticas. Nunca são revogadas. */
export const novasConquistas = (stats, jaTem = []) => CONQUISTAS.filter(c => !jaTem.includes(c.id) && c.ok(stats)).map(c => c.id);
