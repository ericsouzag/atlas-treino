// Montagem de fichas: garante cobertura das porções de cada grupo e justifica cada escolha.
// Funções puras (sem DOM). Entrada: perfil + configuração dos dias. Saída: plano.
import {
  GRUPOS, PORCOES, EXERCICIOS, exPorId, ativacao, disponivel, temLesao, nomePorcao, NIVEL_EXPERIENCIA, EQUIPAMENTOS, LESOES,
} from './exercises.js';

const ORDEM_GRUPOS = ['quadriceps', 'peito', 'costas', 'posteriores', 'gluteos', 'ombros', 'triceps', 'biceps', 'lombar', 'panturrilha', 'antebraco', 'abdomen'];

// Volume semanal alvo (séries diretas) por grupo
const BASE_SERIES = { iniciante: 10, intermediario: 14, avancado: 17 };
const MULT_GRUPO = { peito: 1, costas: 1.1, quadriceps: 1, posteriores: 0.8, gluteos: 0.8, ombros: 1, biceps: 0.75, triceps: 0.75, panturrilha: 0.7, abdomen: 0.6, lombar: 0.4, antebraco: 0.4 };
const MULT_OBJETIVO = { perder: 0.85, ganhar: 1, recomp: 0.95, manter: 0.7 };

export function metaSeriesSemana(grupo, perfil) {
  const exp = perfil.experiencia || 'intermediario';
  const alvo = BASE_SERIES[exp] * (MULT_GRUPO[grupo] ?? 0.7) * (MULT_OBJETIVO[perfil.objetivo] ?? 1);
  return { alvo: Math.round(alvo), min: Math.max(4, Math.round(alvo * 0.7)), max: Math.round(alvo * 1.3) };
}

// ---------------------------------------------------------------------------
// Divisões automáticas

const T = (titulo, blocos) => ({ titulo, blocos });
const B = (grupo, porcoes = null, nivel = 'principal') => ({ grupo, porcoes, nivel });

export function divisaoAutomatica(nDias, perfil = {}) {
  const exp = perfil.experiencia || 'intermediario';
  const fullA = { ...T('Corpo inteiro A', [B('quadriceps'), B('peito'), B('costas'), B('posteriores'), B('ombros'), B('triceps', null, 'complementar'), B('abdomen')]), corpoInteiro: true };
  const fullB = { ...T('Corpo inteiro B', [B('gluteos'), B('peito'), B('costas'), B('quadriceps'), B('ombros'), B('biceps', null, 'complementar'), B('panturrilha')]), corpoInteiro: true };
  const fullC = { ...T('Corpo inteiro C', [B('quadriceps'), B('posteriores'), B('costas'), B('peito'), B('ombros'), B('triceps', null, 'complementar'), B('abdomen')]), corpoInteiro: true };
  const push = T('Empurrar (peito, ombros, tríceps)', [B('peito'), B('ombros', ['delt_ant', 'delt_lat']), B('triceps')]);
  const pull = T('Puxar (costas, bíceps)', [B('costas'), B('ombros', ['delt_post']), B('biceps')]);
  const legs = T('Pernas', [B('quadriceps'), B('posteriores'), B('gluteos'), B('panturrilha'), B('abdomen')]);
  const upper = T('Superiores', [B('peito'), B('costas'), B('ombros'), B('biceps'), B('triceps')]);
  const lower = T('Inferiores', [B('quadriceps'), B('posteriores'), B('gluteos'), B('panturrilha'), B('abdomen')]);
  const rot = (t, nome) => ({ ...t, titulo: nome });
  switch (nDias) {
    case 1: return [{ ...fullA, titulo: 'Corpo inteiro' }];
    case 2: return [fullA, fullB];
    case 3: return exp === 'iniciante' ? [fullA, fullB, fullC] : [rot(push, 'Empurrar (A)'), rot(pull, 'Puxar (B)'), rot(legs, 'Pernas (C)')];
    case 4: return [rot(upper, 'Superiores A'), rot(lower, 'Inferiores A'), rot(upper, 'Superiores B'), rot(lower, 'Inferiores B')];
    case 5: return [rot(push, 'Empurrar'), rot(pull, 'Puxar'), rot(legs, 'Pernas'), rot(upper, 'Superiores'), rot(lower, 'Inferiores')];
    default: return [rot(push, 'Empurrar A'), rot(pull, 'Puxar A'), rot(legs, 'Pernas A'), rot(push, 'Empurrar B'), rot(pull, 'Puxar B'), rot(legs, 'Pernas B')];
  }
}

export function descricaoDivisao(nDias, perfil = {}) {
  const exp = perfil.experiencia || 'intermediario';
  const base = {
    1: 'Corpo inteiro em um único dia: o mínimo para manter o que você já tem.',
    2: '2 dias de corpo inteiro (A/B): cada músculo é treinado 2 vezes por semana, ótimo com pouco tempo.',
    3: exp === 'iniciante' ? '3 dias de corpo inteiro (A/B/C): frequência alta para aprender os movimentos.' : '3 dias em empurrar/puxar/pernas (ABC): cada grupo 1 vez por semana com bastante volume.',
    4: '4 dias em superiores/inferiores: cada grupo 2 vezes por semana, uma das melhores relações volume/recuperação.',
    5: '5 dias: empurrar, puxar, pernas, superiores e inferiores. Alta frequência para quem tem tempo.',
    6: '6 dias em empurrar/puxar/pernas duas vezes (PPL x2): máximo de volume; exige sono e alimentação em dia.',
  };
  return base[Math.min(Math.max(nDias, 1), 6)];
}

// ---------------------------------------------------------------------------
// Janela de porções quando o grupo aparece k vezes na semana

export function janelaPorcoes(porcoes, j, k) {
  const n = porcoes.length;
  if (k <= 1 || n <= 2) return porcoes.slice();
  const w = Math.min(n, Math.max(2, Math.ceil(n * 2 / 3)));
  const ini = Math.floor(j * n / k);
  return Array.from({ length: w }, (_, i) => porcoes[(ini + i) % n]);
}

// ---------------------------------------------------------------------------
// Escolha de exercícios

function contexto(perfil) {
  return {
    equip: perfil.equipamento || 'academia',
    lesoes: perfil.lesoes || [],
    nivel: NIVEL_EXPERIENCIA[perfil.experiencia || 'intermediario'] ?? 2,
    objetivo: perfil.objetivo || 'manter',
  };
}

function elegivel(ex, ctx) {
  if (!disponivel(ex, ctx.equip)) return false;
  if (temLesao(ex, ctx.lesoes)) return false;
  const maxDif = ctx.nivel === 1 ? 2 : 3;
  return ex.dificuldade <= maxDif;
}

function pontuarEscolha(ex, bloco, ctx, estado) {
  let s = 0;
  const prim = ex.primarias.filter(p => estado.faltam.has(p)).length;
  s += prim * 10;
  s += ex.secundarias.filter(p => estado.faltam.has(p)).length * 1.5;
  if (ex.composto) s += 1.2;
  // evitar exercícios que gastam energia em outros grupos quando o bloco é pequeno (mantém o foco)
  const foraDoGrupo = ex.primarias.filter(p => PORCOES[p].grupo !== bloco.grupo).length;
  s -= foraDoGrupo * 0.3;
  if (estado.padroes.has(ex.padrao)) s -= 1.4;
  if (estado.usadosSemana.has(ex.id)) s -= 2.2;
  s -= Math.max(0, ex.dificuldade - ctx.nivel) * 0.6;
  if (ex.classe !== 'C' || ctx.equip === 'casa') s += 0.5;           // prefere carga progressiva quando há equipamento
  if (ctx.nivel === 1 && ex.dificuldade === 1) s += 0.5;
  s -= estado.ordem.get(ex.id) * 0.0001;                              // desempate estável
  return s;
}

/** Seleciona exercícios de um bloco cobrindo todas as porções como primárias */
function escolherBloco(bloco, nSeries, ctx, usadosSemana, usadosDia = new Set()) {
  const porcoes = bloco.porcoes && bloco.porcoes.length ? bloco.porcoes : GRUPOS[bloco.grupo].porcoes;
  const pool = EXERCICIOS.filter(e => elegivel(e, ctx) && !usadosDia.has(e.id) && e.primarias.some(p => porcoes.includes(p)));
  const ordem = new Map(EXERCICIOS.map((e, i) => [e.id, i]));
  // porções já cobertas (como primárias) por exercícios escolhidos antes no mesmo dia
  const jaCobertas = new Set();
  usadosDia.forEach(id => { const x = exPorId(id); x && x.primarias.forEach(p => jaCobertas.add(p)); });
  const estado = { faltam: new Set(porcoes.filter(p => !jaCobertas.has(p))), padroes: new Set(), usadosSemana, ordem };
  const escolhidos = [];
  const lacunas = [];
  // 1) cobertura primária
  while (estado.faltam.size) {
    let melhor = null, ms = -Infinity;
    for (const e of pool) {
      if (escolhidos.includes(e)) continue;
      if (!e.primarias.some(p => estado.faltam.has(p))) continue;
      const sc = pontuarEscolha(e, bloco, ctx, estado);
      if (sc > ms) { ms = sc; melhor = e; }
    }
    if (!melhor) { lacunas.push(...estado.faltam); break; }
    escolhidos.push(melhor);
    melhor.primarias.forEach(p => estado.faltam.delete(p));
    estado.padroes.add(melhor.padrao);
  }
  const obrigatorios = escolhidos.length;
  // 2) exercícios extras conforme volume
  const alvoEx = Math.min(5, Math.max(1, escolhidos.length, Math.ceil(nSeries / 3.5)));
  while (escolhidos.length < alvoEx) {
    const ativ = {};
    porcoes.forEach(p => { ativ[p] = escolhidos.reduce((s, e) => s + ativacao(e, p), 0); });
    const focos = new Set(escolhidos.map(e => e.focoCod));
    let melhor = null, ms = -Infinity;
    for (const e of EXERCICIOS) {
      if (escolhidos.includes(e) || usadosDia.has(e.id) || !elegivel(e, ctx)) continue;
      const toca = e.primarias.filter(p => porcoes.includes(p));
      if (!toca.length) continue;
      let sc = toca.reduce((s, p) => s + 1 / (1 + ativ[p]), 0) * 3;
      if (!focos.has(e.focoCod) && e.focoCod !== 'm') sc += 1.5;           // traz alongamento/pico que faltava
      if (!estado.padroes.has(e.padrao)) sc += 1;
      if (usadosSemana.has(e.id)) sc -= 2.2;
      sc -= Math.max(0, e.dificuldade - ctx.nivel) * 0.6;
      if (e.classe !== 'C' || ctx.equip === 'casa') sc += 0.4;
      sc -= ordem.get(e.id) * 0.0001;
      if (sc > ms) { ms = sc; melhor = e; }
    }
    if (!melhor) break;
    escolhidos.push(melhor);
    estado.padroes.add(melhor.padrao);
  }
  return { escolhidos, lacunas, porcoes, obrigatorios };
}

function ordenarBloco(exs) {
  const peso = e => (e.composto ? 0 : 1) * 10 + (e.focoCod === 'a' ? 0 : e.focoCod === 'm' ? 1 : 2) + (e.classe === 'C' ? 0.5 : 0);
  return [...exs].sort((a, b) => peso(a) - peso(b));
}

/** Repetições e descanso */
export function prescricao(ex, perfil) {
  const pequeno = ['panturrilha', 'abdomen', 'antebraco', 'lombar'].includes(ex.grupoPrincipal);
  const exp = perfil.experiencia || 'intermediario';
  let reps, descanso;
  if (pequeno) { reps = '12-20'; descanso = 60; }
  else if (ex.composto && ex.dificuldade >= 2 && ex.classe !== 'C') { reps = exp === 'iniciante' ? '8-12' : '6-10'; descanso = exp === 'iniciante' ? 120 : 150; }
  else if (ex.composto) { reps = '8-12'; descanso = 105; }
  else { reps = '10-15'; descanso = 75; }
  if (ex.classe === 'C') reps = ex.padrao === 'isometria' ? '30-60 s' : (ex.dificuldade >= 3 ? '5-10' : '10-20');
  if (ex.padrao === 'isometria' && ex.classe === 'C') descanso = 60;
  if (perfil.objetivo === 'manter' && !pequeno && ex.classe !== 'C') reps = '8-12';
  return { reps, descanso };
}

// ---------------------------------------------------------------------------
// Justificativas

function listaPorcoes(ids) { return ids.map(nomePorcao).join(', '); }

function motivoDescarte(alt, ex, ctx, papeis, usadosSemana) {
  if (!disponivel(alt, ctx.equip)) return `exige ${alt.equipamento}, que você não tem`;
  if (temLesao(alt, ctx.lesoes)) return `evitado por causa de ${alt.lesoes.filter(l => ctx.lesoes.includes(l)).map(l => (LESOES[l] || l).toLowerCase()).join(', ')}`;
  if (alt.dificuldade > (ctx.nivel === 1 ? 2 : 3)) return 'técnica avançada demais para seu nível';
  const falta = ex.primarias.filter(p => papeis.includes(p) && !alt.primarias.includes(p));
  if (alt.padrao === ex.padrao && !falta.length) return 'repete o mesmo padrão de movimento e as mesmas porções';
  if (falta.length) return `não cobre ${listaPorcoes(falta)}`;
  if (usadosSemana.has(alt.id)) return 'já entra em outro dia da semana, então aqui variamos';
  if (alt.focoCod === ex.focoCod && alt.padrao === ex.padrao) return 'estimula do mesmo jeito; fica como opção de troca';
  return `cobre ${listaPorcoes(alt.primarias.filter(p => papeis.includes(p)))} em outro ângulo (${alt.foco}); fica como opção de troca`;
}

/** Ordena alternativas por sobreposição de ativação com o exercício original (0..1) */
export function sobreposicao(orig, alt) {
  const todas = new Set([...orig.primarias, ...orig.secundarias]);
  let num = 0, den = 0;
  for (const p of todas) {
    const a = ativacao(orig, p), b = ativacao(alt, p);
    num += Math.min(a, b); den += a;
  }
  return den ? num / den : 0;
}

function justificar({ ex, bloco, indiceNoBloco, escolhidosBloco, ctx, usadosSemana, posicaoDia, totalDia, porcoesAlvo, dia }) {
  const papeis = ex.primarias.filter(p => porcoesAlvo.includes(p));
  const partes = [];
  const unicos = papeis.filter(p => escolhidosBloco.filter(o => o !== ex && o.primarias.includes(p)).length === 0);
  if (unicos.length) partes.push(`Cobre ${listaPorcoes(unicos)} como estímulo principal; nenhum outro exercício deste bloco faz isso.`);
  else partes.push(`Reforça ${listaPorcoes(papeis)} em um ângulo diferente dos outros exercícios do bloco.`);
  const sec = ex.secundarias.filter(p => porcoesAlvo.includes(p) && !ex.primarias.includes(p));
  if (sec.length) partes.push(`Ajuda de quebra em ${listaPorcoes(sec)}.`);
  if (ex.focoCod === 'a' && escolhidosBloco.filter(o => o !== ex && o.focoCod === 'a').length === 0) partes.push('Trabalha o músculo alongado, ângulo que os demais não cobrem.');
  if (ex.focoCod === 'p' && escolhidosBloco.filter(o => o !== ex && o.focoCod === 'p').length === 0) partes.push('Entra para o pico de contração, que os demais exercícios do bloco não enfatizam.');
  if (ex.composto) partes.push(posicaoDia <= 2 ? 'Fica no início da sessão porque é composto e rende mais com energia e carga máxima.' : 'É composto e vem antes dos isolados do bloco para você usar mais carga.');
  else partes.push('É isolado e vem depois dos compostos para não limitar a carga deles.');
  // alternativas descartadas
  const alts = EXERCICIOS
    .filter(a => a.id !== ex.id && a.primarias.some(p => papeis.includes(p)) && !escolhidosBloco.includes(a))
    .map(a => ({ a, s: sobreposicao(ex, a), disp: disponivel(a, ctx.equip) && !temLesao(a, ctx.lesoes) }))
    .sort((x, y) => (y.disp - x.disp) || (y.s - x.s));
  const vistos = new Set();
  const top = [];
  for (const { a } of alts) { if (top.length >= 2) break; if (vistos.has(a.padrao + a.classe)) continue; vistos.add(a.padrao + a.classe); top.push(a); }
  if (top.length) partes.push('Ficaram de fora: ' + top.map(a => `${a.nome} (${motivoDescarte(a, ex, ctx, papeis, usadosSemana)})`).join('; ') + '.');
  return partes.join(' ');
}

// ---------------------------------------------------------------------------
// Montagem do plano

function ordenarBlocos(blocos) {
  return [...blocos].sort((a, b) => ORDEM_GRUPOS.indexOf(a.grupo) - ORDEM_GRUPOS.indexOf(b.grupo));
}

/**
 * config: { dias: [bool x7] (0=dom), modo: 'auto'|'manual'|'livre', gruposPorDia: {0:[grupos]}, duracao: minutos }
 */
export function gerarPlano(config, perfil) {
  const ctx = contexto(perfil);
  const diasSel = [0, 1, 2, 3, 4, 5, 6].filter(d => config.dias?.[d]);
  const duracao = config.duracao || 75;
  const capSeries = Math.round(duracao / 2.6);
  const avisos = [];
  const plano = { modo: config.modo || 'auto', duracao, criadoEm: new Date().toISOString(), dias: {}, avisos };
  if (!diasSel.length) return plano;

  // 1) Definir blocos por dia
  const diasDef = {};
  if (plano.modo === 'livre') {
    diasSel.forEach(d => { diasDef[d] = { titulo: 'Treino livre', blocos: [], livre: true }; });
  } else if (plano.modo === 'manual') {
    diasSel.forEach(d => {
      const gs = (config.gruposPorDia?.[d] || []).filter(g => GRUPOS[g]);
      if (!gs.length) diasDef[d] = { titulo: 'Treino livre', blocos: [], livre: true };
      else diasDef[d] = { titulo: gs.map(g => GRUPOS[g].nome.split(' ')[0]).join(' + '), blocos: gs.map(g => B(g)) };
    });
  } else {
    const div = divisaoAutomatica(diasSel.length, perfil);
    diasSel.forEach((d, i) => { diasDef[d] = { titulo: div[i].titulo, corpoInteiro: !!div[i].corpoInteiro, blocos: div[i].blocos.map(b => ({ ...b })) }; });
    plano.divisao = descricaoDivisao(diasSel.length, perfil);
  }

  // 2) Ocorrências por grupo (para janelas de porções e divisão de volume)
  const ocorr = {};
  diasSel.forEach(d => diasDef[d].blocos.forEach(b => { (ocorr[b.grupo] ||= []).push({ d, b }); }));
  Object.entries(ocorr).forEach(([g, lista]) => {
    const k = lista.length;
    lista.forEach(({ b, d }, j) => {
      b.k = k; b.j = j;
      const kJanela = diasDef[d].corpoInteiro && diasSel.length === 1 ? 2 : k;   // 1 dia só: não dá para cobrir tudo
      if (plano.modo === 'auto' && !b.porcoes) b.porcoes = janelaPorcoes(GRUPOS[g].porcoes, j, kJanela);
    });
  });

  // 3) Montar cada dia
  const usadosSemana = new Set();
  for (const d of diasSel) {
    const def = diasDef[d];
    const dia = { titulo: def.titulo, livre: !!def.livre, blocos: [], exercicios: [], lacunas: [] };
    if (def.livre) { plano.dias[d] = dia; continue; }
    const blocosOrd = ordenarBlocos(def.blocos);
    // séries por bloco
    const seriesBloco = blocosOrd.map(b => {
      const meta = metaSeriesSemana(b.grupo, perfil).alvo;
      let s = meta / b.k;
      if (b.nivel === 'complementar') s *= 0.6;
      if (b.porcoes && b.porcoes.length < GRUPOS[b.grupo].porcoes.length && b.k === 1) s = Math.min(s, meta * 0.6);
      return Math.max(3, Math.round(s));
    });
    const usadosDia = new Set();
    const escolhas = blocosOrd.map((b, i) => {
      const r = escolherBloco(b, seriesBloco[i], ctx, usadosSemana, usadosDia);
      r.escolhidos.forEach(e => usadosDia.add(e.id));
      return r;
    });
    // corta exercícios extras (além dos obrigatórios para cobrir porções) se a sessão passar do tempo
    const maxEx = Math.max(8, Math.floor(capSeries / 2.4));
    const contar = () => escolhas.reduce((s, e) => s + e.escolhidos.length, 0);
    const todasPorcoesDia = new Set(blocosOrd.flatMap(b => (b.porcoes && b.porcoes.length ? b.porcoes : GRUPOS[b.grupo].porcoes)));
    const removivel = ex => {
      const outros = escolhas.flatMap(e => e.escolhidos).filter(o => o !== ex);
      return ex.primarias.filter(p => todasPorcoesDia.has(p)).every(p => outros.some(o => o.primarias.includes(p)));
    };
    while (contar() > maxEx) {
      let feito = false;
      for (const e of [...escolhas].sort((a, b) => (b.escolhidos.length - b.obrigatorios) - (a.escolhidos.length - a.obrigatorios))) {
        if (e.escolhidos.length <= 1) continue;
        const idx = [...e.escolhidos.keys()].reverse().find(i => i >= e.obrigatorios && removivel(e.escolhidos[i]));
        if (idx != null) { e.escolhidos.splice(idx, 1); feito = true; break; }
      }
      if (!feito) break;
    }
    const nEx = contar();
    let total = seriesBloco.reduce((s, x) => s + x, 0);
    let fator = total > capSeries ? capSeries / total : 1;
    let pos = 0;
    blocosOrd.forEach((b, i) => {
      const { escolhidos, lacunas, porcoes } = escolhas[i];
      lacunas.forEach(p => dia.lacunas.push(p));
      const ordenados = ordenarBloco(escolhidos);
      const nEsc = ordenados.length;
      let sb = Math.max(nEsc * 2, Math.round(seriesBloco[i] * fator));
      // distribui séries: primeiro composto recebe mais
      const sets = ordenados.map(() => Math.min(4, Math.max(2, Math.floor(sb / nEsc))));
      let resto = sb - sets.reduce((s, x) => s + x, 0);
      for (let r = 0; resto > 0 && r < 20; r++, resto--) sets[r % nEsc] = Math.min(4, sets[r % nEsc] + 1);
      dia.blocos.push({ grupo: b.grupo, porcoes, nivel: b.nivel || 'principal', k: b.k });
      ordenados.forEach((ex, idx) => {
        pos++;
        const pr = prescricao(ex, perfil);
        dia.exercicios.push({
          exId: ex.id, bloco: b.grupo, series: sets[idx], reps: pr.reps, descanso: pr.descanso, porcoesAlvo: porcoes,
          justificativa: justificar({ ex, bloco: b, indiceNoBloco: idx, escolhidosBloco: ordenados, ctx, usadosSemana, posicaoDia: pos, totalDia: nEx, porcoesAlvo: porcoes, dia }),
        });
      });
      ordenados.forEach(e => usadosSemana.add(e.id));
    });
    const totalSeries = dia.exercicios.reduce((s, e) => s + e.series, 0);
    dia.totalSeries = totalSeries;
    if (totalSeries > capSeries * 1.2) avisos.push(`${def.titulo}: sessão longa (${totalSeries} séries, ~${Math.round(totalSeries * 2.6)} min). Reduza grupos no dia ou aumente o tempo disponível.`);
    if (dia.lacunas.length) avisos.push(`${def.titulo}: sem exercício seguro para ${listaPorcoes([...new Set(dia.lacunas)])} com seu equipamento/limitações. Consulte um profissional para alternativas.`);
    plano.dias[d] = dia;
  }
  // cobertura semanal: porções dos grupos treinados sem nenhum estímulo direto
  const vol = volumeSemanal(plano, perfil);
  const semEstimulo = [];
  new Set(Object.values(plano.dias).flatMap(d => d.blocos.map(b => b.grupo))).forEach(g => GRUPOS[g].porcoes.forEach(p => { if (!(vol.porcao[p] > 0)) semEstimulo.push(p); }));
  plano.semEstimulo = semEstimulo;
  if (semEstimulo.length && !Object.values(plano.dias).some(d => d.lacunas.length)) avisos.push('Com ' + diasSel.length + ' dia(s) por semana, estas porções ficam sem estímulo direto: ' + listaPorcoes(semEstimulo) + '. Adicionar um dia de treino resolve.');
  if ((perfil.lesoes || []).length) avisos.push('Exercícios que costumam sobrecarregar ' + perfil.lesoes.map(l => (LESOES[l] || l).toLowerCase()).join(', ') + ' foram evitados. Isso não substitui orientação de fisioterapeuta ou médico.');
  return plano;
}

// ---------------------------------------------------------------------------
// Cobertura e volume

/** Cobertura por grupo/porção de um dia. Retorna [{grupo, porcoes:[{id, nome, nivel:'ok'|'parcial'|'falta', exercicios:[nome]}]}] */
export function coberturaDia(dia) {
  const res = [];
  for (const b of dia.blocos || []) {
    const exs = dia.exercicios.map(e => exPorId(e.exId)).filter(Boolean);
    const lista = b.porcoes.map(p => {
      const prim = exs.filter(e => e.primarias.includes(p));
      const soma = exs.reduce((s, e) => s + ativacao(e, p), 0);
      return { id: p, nome: nomePorcao(p), nivel: prim.length ? 'ok' : soma >= 0.8 ? 'parcial' : 'falta', exercicios: prim.map(e => e.nome) };
    });
    res.push({ grupo: b.grupo, nome: GRUPOS[b.grupo].nome, porcoes: lista });
  }
  return res;
}

/** Volume semanal direto por grupo (séries) e cobertura semanal de todas as porções */
export function volumeSemanal(plano, perfil) {
  const direto = {}, indireto = {}, porcao = {};
  for (const dia of Object.values(plano.dias || {})) {
    for (const item of dia.exercicios || []) {
      const ex = exPorId(item.exId);
      if (!ex) continue;
      const gp = new Set(ex.primarias.map(p => PORCOES[p].grupo));
      gp.forEach(g => { direto[g] = (direto[g] || 0) + item.series; });
      new Set(ex.secundarias.map(p => PORCOES[p].grupo)).forEach(g => { if (!gp.has(g)) indireto[g] = (indireto[g] || 0) + item.series * 0.5; });
      ex.primarias.forEach(p => { porcao[p] = (porcao[p] || 0) + item.series; });
    }
  }
  const grupos = Object.keys(direto).map(g => {
    const m = metaSeriesSemana(g, perfil);
    const d = direto[g];
    return { grupo: g, nome: GRUPOS[g].nome, series: d, indireto: Math.round(indireto[g] || 0), ...m, status: d < m.min ? 'abaixo' : d > m.max ? 'acima' : 'na faixa' };
  });
  grupos.sort((a, b) => ORDEM_GRUPOS.indexOf(a.grupo) - ORDEM_GRUPOS.indexOf(b.grupo));
  return { grupos, porcao };
}

// ---------------------------------------------------------------------------
// Troca de exercício

/**
 * Sugere alternativas que ativem as mesmas porções (score de sobreposição).
 * item: entrada da ficha {exId, bloco, porcoesAlvo}; diaPlano: dia atual (para evitar repetidos).
 */
export function alternativas(item, diaPlano, perfil, limite = 8) {
  const ctx = contexto(perfil);
  const orig = exPorId(item.exId);
  if (!orig) return [];
  const noDia = new Set((diaPlano?.exercicios || []).map(e => e.exId));
  return EXERCICIOS
    .filter(e => e.id !== orig.id && !noDia.has(e.id) && elegivel(e, ctx))
    .map(e => ({ ex: e, score: sobreposicao(orig, e) }))
    .filter(r => r.score >= 0.25 && r.ex.primarias.some(p => orig.primarias.includes(p) || orig.secundarias.includes(p)))
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map(r => ({ ...r, ...diferenca(orig, r.ex, item.porcoesAlvo) }));
}

/** O que muda ao trocar a por b */
export function diferenca(a, b, porcoesAlvo = null) {
  const ids = new Set([...a.primarias, ...a.secundarias, ...b.primarias, ...b.secundarias]);
  const ganha = [], perde = [], mantem = [];
  for (const p of ids) {
    if (porcoesAlvo && !porcoesAlvo.includes(p) && !a.primarias.includes(p) && !b.primarias.includes(p)) continue;
    const x = ativacao(a, p), y = ativacao(b, p);
    if (y > x) ganha.push(p); else if (y < x) perde.push(p); else mantem.push(p);
  }
  return { ganha, perde, mantem };
}

/** Aplica a troca e recalcula a justificativa. Retorna nova entrada + avisos de cobertura. */
export function trocarExercicio(plano, diaIdx, idx, novoId, perfil) {
  const ctx = contexto(perfil);
  const dia = plano.dias[diaIdx];
  const item = dia.exercicios[idx];
  const antigo = exPorId(item.exId), novo = exPorId(novoId);
  if (!novo || !antigo) return null;
  const dif = diferenca(antigo, novo, item.porcoesAlvo);
  const bloco = dia.blocos.find(b => b.grupo === item.bloco);
  const doBloco = dia.exercicios.map((e, i) => (i === idx ? novo : exPorId(e.exId))).filter((e, i) => dia.exercicios[i].bloco === item.bloco);
  const usados = new Set(Object.values(plano.dias).flatMap(d => d.exercicios.map(e => e.exId)));
  let just = justificar({ ex: novo, bloco, indiceNoBloco: 0, escolhidosBloco: doBloco, ctx, usadosSemana: usados, posicaoDia: idx + 1, totalDia: dia.exercicios.length, porcoesAlvo: item.porcoesAlvo, dia });
  const trecho = [];
  if (dif.ganha.length) trecho.push(`ganha ${listaPorcoes(dif.ganha)}`);
  if (dif.perde.length) trecho.push(`perde ${listaPorcoes(dif.perde)}`);
  just = `Trocado por você: ${novo.nome} no lugar de ${antigo.nome}${trecho.length ? ' (' + trecho.join('; ') + ')' : ''}. ` + just;
  const pr = prescricao(novo, perfil);
  const novoItem = { ...item, exId: novo.id, reps: pr.reps, descanso: pr.descanso, justificativa: just, trocado: true };
  const aviso = [];
  const depois = dia.exercicios.map((e, i) => (i === idx ? novoItem : e));
  const cob = coberturaDia({ blocos: dia.blocos, exercicios: depois });
  cob.forEach(g => g.porcoes.forEach(p => { if (p.nivel === 'falta') aviso.push(`${p.nome} ficou sem exercício principal neste dia.`); }));
  return { item: novoItem, dif, avisos: aviso };
}

/** Texto curto para exibir o que uma alternativa muda */
export function textoDiferenca(d, score = 1) {
  const t = [];
  if (d.ganha.length) t.push('ganha ' + listaPorcoes(d.ganha));
  if (d.perde.length) t.push('perde ' + listaPorcoes(d.perde));
  if (!t.length) t.push(score < 0.85 ? 'mesmas porções, com ativação um pouco menor' : 'mesmas porções');
  return t.join(' · ');
}

export { ORDEM_GRUPOS };
