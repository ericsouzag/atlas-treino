// Previsão de composição corporal: modelo p-ratio (ver body-composition-prediction-methodology.md)
// + Forbes (a fração magra da variação depende da gordura corporal) + limite biológico de ganho muscular.
// Funções puras. TUDO É ESTIMATIVA com faixa de incerteza.
import { tmbKatch, tmbMifflin, NIVEIS_ATIVIDADE, idadeEm, kcalTreino, composicao } from './nutrition.js';
import { diasEntre, somarDias, dataISO } from './datas.js';

// Densidades energéticas (kcal/kg). Metodologia: gordura ~7.700 kcal/kg, massa magra ~1.800 kcal/kg
export const RHO_GORDURA = 7700;
export const RHO_MAGRA = 1800;

/** Lei de Forbes: fração da variação de peso que é massa magra, dada a massa gorda F (kg). dL/dF = 10,4/F */
export function fracaoForbes(massaGorda) {
  const F = Math.max(massaGorda, 3);
  return 10.4 / (F + 10.4);
}

/** 0..1 : estímulo de treino a partir de sessões/semana e séries/semana */
export function pontuacaoTreino({ sessoesSemana = 0, seriesSemana = 0 }) {
  const a = Math.min(sessoesSemana / 4, 1);       // 4 sessões/semana = máximo
  const b = Math.min(seriesSemana / 60, 1);       // ~60 séries/semana = bom volume geral
  return Math.max(0, Math.min(1, 0.5 * a + 0.5 * b));
}

export const pontuacaoProteina = gPorKg => Math.max(0, Math.min((gPorKg || 0) / 2.2, 1));

/**
 * P-ratio estimado = fração (em massa) da variação de peso que é massa magra.
 * balanco: kcal/dia (ingestão - gasto). Retorna { p, tipo, base, forbes }
 */
export function estimarPRatio({ balanco, treino, proteina, massaGorda = null }) {
  const T = Math.max(0, Math.min(1, treino ?? 0));
  const P = Math.max(0, Math.min(1, proteina ?? 0));
  const defP = 0.20 + 0.15 * T + 0.10 * P;   // faixa 0,20..0,45 (metodologia 2.3)
  const surP = 0.60 + 0.20 * T + 0.10 * P;   // faixa 0,60..0,90
  let p, tipo;
  const b = balanco ?? 0;
  if (b <= -75) {
    tipo = 'deficit'; p = defP;
    if (b < -500) p += 0.10 * (Math.min(-b, 1200) - 500) / 700;     // déficit agressivo: perde mais músculo
  } else if (b >= 75) {
    tipo = 'superavit'; p = surP;
    if (b > 500) p -= 0.15 * (Math.min(b, 1200) - 500) / 700;       // superávit grande: mais gordura
  } else {
    tipo = 'manutencao';
    const w = (b + 75) / 150;                                       // mistura suave entre déficit e superávit
    p = defP * (1 - w) + surP * w;
  }
  let forbes = 1;
  if (massaGorda != null) {
    const pf = fracaoForbes(massaGorda), ref = fracaoForbes(20);
    if (tipo === 'deficit') forbes = Math.max(0.6, Math.min(1.5, pf / ref));          // magro perde proporcionalmente mais massa magra
    else forbes = 1 + (pf - ref) * 0.3;                                                // magro ganha proporcionalmente mais massa magra
    p *= forbes;
  }
  return { p: Math.max(0.1, Math.min(0.95, p)), tipo, base: tipo === 'deficit' ? defP : surP, forbes };
}

/** Ganho máximo de massa magra por semana (kg), conforme experiência. Fonte: faixas usuais de literatura (Aragon/McDonald). */
export function tetoGanhoMagraSemana(peso, experiencia = 'intermediario') {
  const mensal = { iniciante: 0.010, intermediario: 0.005, avancado: 0.0025 }[experiencia] ?? 0.005;
  return peso * mensal / 4.33;
}

function gastoDiario({ sexo, altura, idade, atividade, peso, massaMagra, treinoKcalDia }) {
  const nivel = NIVEIS_ATIVIDADE.find(n => n.id === atividade) || NIVEIS_ATIVIDADE[1];
  const tmb = massaMagra != null ? tmbKatch(massaMagra) : tmbMifflin({ sexo, peso, altura, idade });
  return tmb * nivel.fator + treinoKcalDia;
}

/**
 * Simulação semanal. entrada:
 *  perfil {sexo, altura, idade, atividade, experiencia}, peso, gorduraPct, ingestaoKcal, protGPorKg,
 *  treinoKcalDia, sessoesSemana, seriesSemana, semanas, ajusteBalanco (kcal/dia, p/ cenários), ajusteP
 */
export function simularComposicao(e) {
  const semanas = e.semanas ?? 12;
  let F = e.peso * e.gorduraPct / 100;
  let L = e.peso - F;
  const peso0 = e.peso;
  const T = pontuacaoTreino({ sessoesSemana: e.sessoesSemana, seriesSemana: e.seriesSemana });
  const P = pontuacaoProteina(e.protGPorKg);
  const pontos = [{ semana: 0, peso: F + L, gordura: F, magra: L, pct: 100 * F / (F + L), p: null }];
  let ultimoP = null;
  for (let s = 1; s <= semanas; s++) {
    const peso = F + L;
    const idade = e.perfil.idade;
    let gasto = gastoDiario({ ...e.perfil, idade, peso, massaMagra: L, treinoKcalDia: e.treinoKcalDia });
    const perdaRel = Math.max(0, (peso0 - peso) / peso0);
    gasto *= 1 - Math.min(0.08, perdaRel * 0.5);                       // adaptação metabólica leve
    gasto *= 1 + (e.ajusteGasto || 0);
    const bal = e.ingestaoKcal - gasto + (e.ajusteBalanco || 0);
    const est = estimarPRatio({ balanco: bal, treino: T, proteina: P, massaGorda: F });
    let p = Math.max(0.05, Math.min(0.97, est.p + (e.ajusteP || 0)));
    ultimoP = { ...est, p };
    const E = bal * 7;
    if (E < 0) {
      const dm = E / (p * RHO_MAGRA + (1 - p) * RHO_GORDURA);       // negativo
      L += dm * p; F += dm * (1 - p);
    } else {
      const dm = E / (p * RHO_MAGRA + (1 - p) * RHO_GORDURA);
      let ganhoL = dm * p;
      const teto = tetoGanhoMagraSemana(peso, e.perfil.experiencia) * (0.6 + 0.8 * T);
      if (ganhoL > teto) {
        ganhoL = teto;
        const resto = Math.max(0, E - ganhoL * RHO_MAGRA);
        L += ganhoL; F += resto / RHO_GORDURA;
      } else { L += ganhoL; F += dm * (1 - p); }
    }
    F = Math.max(F, 2); L = Math.max(L, 10);
    pontos.push({ semana: s, peso: F + L, gordura: F, magra: L, pct: 100 * F / (F + L), p: ultimoP.p });
  }
  return { pontos, ultimoP, T, P };
}

/** Projeção central + faixa (cenários baixo/alto) em N semanas */
export function projetar(entrada, horizontes = [4, 8, 12]) {
  const max = Math.max(...horizontes);
  const base = simularComposicao({ ...entrada, semanas: max });
  // Incerteza: p-ratio ±0,12, ingestão subestimada/superestimada (±10% do gasto), medição
  const gastoRef = gastoDiario({ ...entrada.perfil, peso: entrada.peso, massaMagra: entrada.peso * (1 - entrada.gorduraPct / 100), treinoKcalDia: entrada.treinoKcalDia });
  const cen = [
    { ajusteBalanco: -0.1 * gastoRef, ajusteP: -0.12 }, { ajusteBalanco: -0.1 * gastoRef, ajusteP: 0.12 },
    { ajusteBalanco: 0.1 * gastoRef, ajusteP: -0.12 }, { ajusteBalanco: 0.1 * gastoRef, ajusteP: 0.12 },
  ].map(c => simularComposicao({ ...entrada, ...c, semanas: max }));
  const res = {};
  for (const h of horizontes) {
    const c = base.pontos[h];
    const todos = cen.map(s => s.pontos[h]).concat([c]);
    const faixa = k => [Math.min(...todos.map(x => x[k])), Math.max(...todos.map(x => x[k]))];
    res[h] = {
      central: c,
      peso: faixa('peso'), gordura: faixa('gordura'), magra: faixa('magra'), pct: faixa('pct'),
      deltaGordura: c.gordura - base.pontos[0].gordura, deltaMagra: c.magra - base.pontos[0].magra, deltaPeso: c.peso - base.pontos[0].peso,
    };
  }
  return { inicio: base.pontos[0], porHorizonte: res, serie: base.pontos, serieBaixa: cen.map(s => s.pontos), p: base.ultimoP, treino: base.T, proteina: base.P };
}

// ----------------------------- análise com dados reais ----------------------

/** Regressão linear simples (x em dias, y em kg). Retorna inclinação em kg/dia */
export function inclinacao(pontos) {
  const n = pontos.length;
  if (n < 2) return null;
  const mx = pontos.reduce((s, p) => s + p.x, 0) / n, my = pontos.reduce((s, p) => s + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of pontos) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  return den ? num / den : null;
}

/** Tendência do peso nos últimos `dias` dias. corpo: [{data, peso}] */
export function tendenciaPeso(corpo, hoje = dataISO(), dias = 21) {
  const ini = somarDias(hoje, -dias);
  const pts = corpo.filter(r => r.peso && r.data >= ini && r.data <= hoje).map(r => ({ x: diasEntre(ini, r.data), y: r.peso }));
  if (pts.length < 3) return { ok: false, n: pts.length };
  const span = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x));
  const s = inclinacao(pts);
  return { ok: span >= 7, n: pts.length, span, kgPorSemana: s * 7, pctPorSemana: null };
}

/** Plateau: peso estável por >= 14 dias fora do objetivo "manter" */
export function detectarPlato(corpo, objetivo, hoje = dataISO()) {
  if (objetivo === 'manter') return { plato: false };
  const t = tendenciaPeso(corpo, hoje, 21);
  if (!t.ok || t.span < 14 || t.n < 4) return { plato: false, motivo: 'poucos dados' };
  const ultimo = corpo.filter(r => r.peso).sort((a, b) => a.data.localeCompare(b.data)).at(-1);
  const lim = Math.max(0.08, 0.001 * (ultimo?.peso || 70));  // ~0,1% do peso por semana
  const plato = Math.abs(t.kgPorSemana) < lim;
  return { plato, kgPorSemana: t.kgPorSemana, dias: t.span };
}

/** Resumo de treinos executados em uma janela */
export function resumoTreinos(treinos, desde, ate) {
  let sessoes = 0, series = 0, volume = 0, kcal = 0, minutos = 0;
  for (const t of treinos) {
    if (!t.concluido || t.data < desde || t.data > ate) continue;
    sessoes++; kcal += t.kcal || 0; minutos += t.duracaoMin || 0;
    for (const ex of t.exercicios || []) for (const s of ex.series || []) {
      if (!s.feito) continue;
      series++; volume += (s.carga || 0) * (s.reps || 0);
    }
  }
  return { sessoes, series, volume, kcal, minutos };
}

/** Média de ingestão em dias com registro "suficiente". dias: { 'AAAA-MM-DD': {kcal,p,...} } */
export function mediaIngestao(totaisPorDia, hoje, janela = 14, minKcal = 600) {
  const itens = [];
  for (let i = 0; i < janela; i++) {
    const d = somarDias(hoje, -i);
    const t = totaisPorDia[d];
    if (t && t.kcal >= minKcal) itens.push(t);
  }
  if (!itens.length) return { dias: 0, kcal: 0, p: 0, c: 0, g: 0 };
  const m = k => itens.reduce((s, t) => s + (t[k] || 0), 0) / itens.length;
  return { dias: itens.length, kcal: m('kcal'), p: m('p'), c: m('c'), g: m('g') };
}

/**
 * Análise completa. Entradas:
 *  perfil, corpo (registros), totaisPorDia (por data), treinos, hoje
 * Retorna { faltando[], atual, ingestao, treino, balanco, p, projecao, observado, plato, implicito, avisos[] }
 */
export function analisarComposicao({ perfil, corpo, totaisPorDia, treinos, atividades = [], hoje = dataISO() }) {
  const faltando = [];
  const avisos = [];
  const regs = [...corpo].sort((a, b) => a.data.localeCompare(b.data));
  const comPeso = regs.filter(r => r.peso);
  const comGordura = regs.filter(r => r.peso && r.gordura != null);
  const ultimoPeso = comPeso.at(-1);
  if (!ultimoPeso) faltando.push('Registre seu peso na aba Corpo.');
  const ultimoG = comGordura.at(-1);
  if (!ultimoG) faltando.push('Registre um % de gordura (manual, Marinha ou dobras) na aba Corpo para separar gordura e massa magra.');

  const ing = mediaIngestao(totaisPorDia, hoje, 14);
  if (ing.dias < 3) faltando.push(`Registre suas refeições por pelo menos 3 dias (você tem ${ing.dias} nos últimos 14).`);

  const idade = idadeEm(perfil.nascimento, new Date(hoje + 'T12:00:00')) ?? 30;
  const ini = somarDias(hoje, -14);
  const rt = resumoTreinos(treinos, ini, hoje);
  const sessoesSemana = rt.sessoes / 2, seriesSemana = rt.series / 2;
  // Cardio e esportes entram só como GASTO de energia; o estímulo de treino (sessões/séries) vem só da musculação.
  const kcalAtiv = atividades.filter(a => a.ts && a.ts.slice(0, 10) >= ini && a.ts.slice(0, 10) <= hoje).reduce((s, a) => s + (a.kcal || 0), 0);
  const treinoKcalDia = (rt.kcal + kcalAtiv) / 14;
  const peso = ultimoPeso?.peso;
  // Se não houver %G, usar o último conhecido (ou estimativa por IMC no perfil)
  const gordura = ultimoG?.gordura ?? perfil.gorduraInicial ?? null;
  const fonteG = ultimoG ? 'medida' : (gordura != null ? 'estimada no cadastro' : null);

  const protGPorKg = peso ? ing.p / peso : 0;
  const entradaBase = peso && gordura != null ? {
    perfil: { sexo: perfil.sexo, altura: perfil.altura, idade, atividade: perfil.atividade, experiencia: perfil.experiencia || 'intermediario' },
    peso, gorduraPct: gordura, ingestaoKcal: ing.kcal, protGPorKg, treinoKcalDia, sessoesSemana, seriesSemana,
  } : null;

  let projecao = null, balanco = null, p = null, calibrado = null;
  const tend0 = tendenciaPeso(comPeso, hoje, 21);
  if (entradaBase && ing.dias >= 3) {
    const gasto = gastoDiario({ ...entradaBase.perfil, peso, massaMagra: peso * (1 - gordura / 100), treinoKcalDia });
    balanco = { gasto, ingestao: ing.kcal, saldo: ing.kcal - gasto };
    let entrada = entradaBase;
    // Calibração: quem registra comida costuma errar para menos. Se a balança mostra outro saldo,
    // a projeção usa a média entre o saldo registrado e o saldo que o peso indica.
    if (tend0.ok && tend0.n >= 4) {
      const prAprox = 0.35, kcalKg = prAprox * RHO_MAGRA + (1 - prAprox) * RHO_GORDURA;
      const saldoObs = tend0.kgPorSemana * kcalKg / 7;
      if (Math.abs(saldoObs - balanco.saldo) > 150) {
        const saldoUsado = 0.5 * balanco.saldo + 0.5 * saldoObs;
        entrada = { ...entradaBase, ingestaoKcal: gasto + saldoUsado };
        calibrado = { saldoRegistrado: balanco.saldo, saldoObservado: saldoObs, saldoUsado };
      }
    }
    projecao = projetar(entrada);
    p = projecao.p;
    if (rt.sessoes === 0) avisos.push('Sem treinos concluídos nas últimas 2 semanas: o modelo assume estímulo de treino zero, o que piora a projeção de massa magra.');
    if (ing.dias < 7) avisos.push('Poucos dias de refeições registrados: a projeção é pouco confiável até registrar mais dias.');
  }

  // Observado (medido)
  let observado = null;
  if (comGordura.length >= 2) {
    const a = comGordura[0], b = comGordura.at(-1);
    const ca = composicao(a.peso, a.gordura), cb = composicao(b.peso, b.gordura);
    observado = {
      de: a.data, ate: b.data, dias: diasEntre(a.data, b.data),
      dPeso: b.peso - a.peso, dGordura: cb.massaGorda - ca.massaGorda, dMagra: cb.massaMagra - ca.massaMagra,
      medido: true,
    };
  } else if (comPeso.length >= 2 && gordura != null) {
    const a = comPeso[0], b = comPeso.at(-1);
    const dPeso = b.peso - a.peso;
    const est = estimarPRatio({ balanco: balanco?.saldo ?? (dPeso > 0 ? 200 : -200), treino: pontuacaoTreino({ sessoesSemana, seriesSemana }), proteina: pontuacaoProteina(protGPorKg), massaGorda: peso * gordura / 100 });
    observado = { de: a.data, ate: b.data, dias: diasEntre(a.data, b.data), dPeso, dGordura: dPeso * (1 - est.p), dMagra: dPeso * est.p, medido: false };
  }

  const tend = tendenciaPeso(comPeso, hoje, 21);
  const plato = detectarPlato(comPeso, perfil.objetivo, hoje);
  let implicito = null;
  if (tend.ok && balanco) {
    const pr = p ? p.p : 0.3;
    const kcalKg = pr * RHO_MAGRA + (1 - pr) * RHO_GORDURA;
    const saldoObs = tend.kgPorSemana * kcalKg / 7;
    implicito = { saldoObservado: saldoObs, saldoRegistrado: balanco.saldo, diferenca: saldoObs - balanco.saldo };
    if (Math.abs(implicito.diferenca) > 350) avisos.push('O que a balança mostra não bate com o que você registrou: pode haver refeições sem registro, porções subestimadas ou retenção de água.');
  }

  return { calibrado, faltando, atual: peso ? { peso, gordura, fonteG, ...(gordura != null ? composicao(peso, gordura) : {}) } : null, ingestao: ing, treino: { ...rt, sessoesSemana, seriesSemana, treinoKcalDia, kcalAtividades: kcalAtiv }, balanco, p, projecao, observado, tendencia: tend, plato, implicito, avisos };
}
