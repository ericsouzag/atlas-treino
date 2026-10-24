// Cálculos de nutrição e corpo (funções puras, sem DOM). Tudo é ESTIMATIVA.
import { arred } from './texto.js';

export const NIVEIS_ATIVIDADE = [
  { id: 'sedentario', rotulo: 'Sedentário', desc: 'Dia sentado (escritório, estudo, carro) e pouca caminhada', fator: 1.2 },
  { id: 'leve', rotulo: 'Pouco ativo', desc: 'Caminha um pouco no dia a dia, fica em pé parte do tempo', fator: 1.3 },
  { id: 'moderado', rotulo: 'Ativo', desc: 'Trabalho em pé ou em movimento, muitas caminhadas', fator: 1.4 },
  { id: 'alto', rotulo: 'Muito ativo', desc: 'Trabalho braçal ou esporte diário além do treino', fator: 1.55 },
  { id: 'extremo', rotulo: 'Extremamente ativo', desc: 'Trabalho físico pesado + esporte', fator: 1.7 },
];

export const OBJETIVOS = [
  { id: 'perder', rotulo: 'Perder gordura', desc: 'Déficit moderado, proteína alta para preservar músculo' },
  { id: 'ganhar', rotulo: 'Ganhar massa', desc: 'Pequeno superávit para construir músculo com pouca gordura' },
  { id: 'recomp', rotulo: 'Recomposição', desc: 'Perder gordura e ganhar músculo ao mesmo tempo (leve déficit)' },
  { id: 'manter', rotulo: 'Manter', desc: 'Manter peso e composição' },
];

export function idadeEm(nascimentoISO, hoje = new Date()) {
  if (!nascimentoISO) return null;
  const n = new Date(nascimentoISO + (nascimentoISO.length <= 10 ? 'T12:00:00' : ''));
  if (isNaN(n)) return null;
  let idade = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
  return idade;
}

/** Mifflin-St Jeor (kcal/dia). sexo: 'M' | 'F' */
export function tmbMifflin({ sexo, peso, altura, idade }) {
  return 10 * peso + 6.25 * altura - 5 * idade + (sexo === 'M' ? 5 : -161);
}

/** Katch-McArdle (kcal/dia), usa massa magra em kg */
export function tmbKatch(massaMagra) {
  return 370 + 21.6 * massaMagra;
}

export const imc = (peso, alturaCm) => peso / (alturaCm / 100) ** 2;

export function classeIMC(v) {
  if (v < 18.5) return 'abaixo do peso';
  if (v < 25) return 'peso normal';
  if (v < 30) return 'sobrepeso';
  if (v < 35) return 'obesidade grau I';
  if (v < 40) return 'obesidade grau II';
  return 'obesidade grau III';
}

/** Relação cintura-quadril */
export const rcq = (cintura, quadril) => (cintura && quadril ? cintura / quadril : null);

export function classeRCQ(v, sexo) {
  if (v == null) return null;
  const lim = sexo === 'M' ? [0.90, 1.0] : [0.80, 0.85];
  return v < lim[0] ? 'risco baixo' : v < lim[1] ? 'risco moderado' : 'risco elevado';
}

export function composicao(peso, gorduraPct) {
  if (peso == null || gorduraPct == null) return null;
  const massaGorda = peso * gorduraPct / 100;
  return { massaGorda, massaMagra: peso - massaGorda };
}

// ------------------------- % de gordura -------------------------------

/** Fórmula da Marinha dos EUA, versão métrica (medidas em cm) via densidade corporal + Siri. Retorna % ou null. */
export function gorduraMarinha({ sexo, altura, cintura, pescoco, quadril }) {
  if (!altura || !cintura || !pescoco) return null;
  let dens;
  if (sexo === 'M') {
    const d = cintura - pescoco;
    if (d <= 0) return null;
    dens = 1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(altura);
  } else {
    if (!quadril) return null;
    const d = cintura + quadril - pescoco;
    if (d <= 0) return null;
    dens = 1.29579 - 0.35004 * Math.log10(d) + 0.22100 * Math.log10(altura);
  }
  return 495 / dens - 450;
}

/** Estimativa baseada em IMC (Deurenberg). Margem de erro grande (±5 p.p.). */
export function gorduraPorIMC({ sexo, peso, altura, idade }) {
  const v = imc(peso, altura);
  const s = sexo === 'M' ? 1 : 0;
  if (idade < 18) return 1.51 * v - 0.70 * idade - 3.6 * s + 1.4;
  return 1.20 * v + 0.23 * idade - 10.8 * s - 5.4;
}

/** Siri a partir da densidade corporal */
export const siri = d => 495 / d - 450;

/**
 * Jackson-Pollock. dobras em mm.
 * 3 dobras: homens (peitoral, abdominal, coxa); mulheres (tríceps, supra-ilíaca, coxa)
 * 7 dobras: peitoral, axilar média, tríceps, subescapular, abdominal, supra-ilíaca, coxa
 */
export function gorduraJacksonPollock({ sexo, idade, dobras, protocolo = 3 }) {
  const d = dobras || {};
  let soma, dens;
  if (protocolo === 7) {
    const campos = ['peitoral', 'axilar', 'triceps', 'subescapular', 'abdominal', 'suprailiaca', 'coxa'];
    if (!campos.every(k => d[k] > 0)) return null;
    soma = campos.reduce((s, k) => s + d[k], 0);
    dens = sexo === 'M'
      ? 1.112 - 0.00043499 * soma + 0.00000055 * soma ** 2 - 0.00028826 * idade
      : 1.097 - 0.00046971 * soma + 0.00000056 * soma ** 2 - 0.00012828 * idade;
  } else {
    const campos = sexo === 'M' ? ['peitoral', 'abdominal', 'coxa'] : ['triceps', 'suprailiaca', 'coxa'];
    if (!campos.every(k => d[k] > 0)) return null;
    soma = campos.reduce((s, k) => s + d[k], 0);
    dens = sexo === 'M'
      ? 1.10938 - 0.0008267 * soma + 0.0000016 * soma ** 2 - 0.0002574 * idade
      : 1.0994921 - 0.0009929 * soma + 0.0000023 * soma ** 2 - 0.0001392 * idade;
  }
  return siri(dens);
}

export const DOBRAS_CAMPOS = {
  3: { M: ['peitoral', 'abdominal', 'coxa'], F: ['triceps', 'suprailiaca', 'coxa'] },
  7: { M: ['peitoral', 'axilar', 'triceps', 'subescapular', 'abdominal', 'suprailiaca', 'coxa'], F: ['peitoral', 'axilar', 'triceps', 'subescapular', 'abdominal', 'suprailiaca', 'coxa'] },
};

export function faixaGordura(pct, sexo) {
  if (pct == null) return null;
  const f = sexo === 'M' ? [6, 14, 18, 25] : [14, 21, 25, 32];
  if (pct < f[0]) return 'muito baixo';
  if (pct < f[1]) return 'atlético';
  if (pct < f[2]) return 'em forma';
  if (pct < f[3]) return 'médio';
  return 'elevado';
}

// ------------------------- metas ----------------------------------------

/** Piso de segurança de calorias */
export function pisoKcal(sexo) { return sexo === 'M' ? 1500 : 1200; }

/** gasto líquido de um treino de musculação (kcal) = (MET - 1) * kg * horas */
export function kcalTreino(pesoKg, minutos, mets = 4.5) {
  return Math.max(0, (mets - 1) * pesoKg * (minutos / 60));
}

/** Duração estimada de um treino a partir das séries e do descanso (min) */
export function duracaoEstimada(series, descansoSeg = 90) {
  return Math.round((series * (45 + descansoSeg)) / 60 + 8);
}

/**
 * Calcula metas diárias.
 * perfil: { sexo, nascimento, altura, atividade, objetivo, diasTreino }
 */
const vir = x => String(x).replace('.', ',');

export function calcularMetas(perfil, peso, gorduraPct = null, hoje = new Date()) {
  const idade = idadeEm(perfil.nascimento, hoje) ?? perfil.idade ?? 30;
  const menor = idade < 18;
  const comp = gorduraPct != null ? composicao(peso, gorduraPct) : null;
  const tmbM = tmbMifflin({ sexo: perfil.sexo, peso, altura: perfil.altura, idade });
  let tmb = tmbM, formula = 'Mifflin-St Jeor';
  if (comp) { tmb = tmbKatch(comp.massaMagra); formula = 'Katch-McArdle (usa sua massa magra)'; }
  const nivel = NIVEIS_ATIVIDADE.find(n => n.id === perfil.atividade) || NIVEIS_ATIVIDADE[1];
  const dias = perfil.diasTreino ?? 3;
  const treinoSemana = dias * kcalTreino(peso, 60, 4.5);
  const tdee = tmb * nivel.fator + treinoSemana / 7;

  const explic = [];
  explic.push(`Metabolismo basal (${formula}): cerca de ${Math.round(tmb)} kcal/dia, o que o corpo gasta em repouso.`);
  explic.push(`Multiplicamos por ${vir(nivel.fator)} (${nivel.rotulo.toLowerCase()}) e somamos ${Math.round(treinoSemana / 7)} kcal/dia de média dos treinos (${dias} treinos/semana). Gasto total estimado: ${Math.round(tdee)} kcal/dia.`);

  // Ajuste por objetivo
  const obj = perfil.objetivo || 'manter';
  let ajuste = { perder: -0.20, ganhar: 0.10, recomp: -0.05, manter: 0 }[obj] ?? 0;
  const avisos = [];
  if (menor) {
    if (ajuste < -0.10) { ajuste = -0.10; avisos.push('Você tem menos de 18 anos: limitamos o déficit a no máximo 10% e recomendamos acompanhamento de pediatra ou nutricionista. Corpo em crescimento precisa de energia.'); }
    else if (obj === 'perder') avisos.push('Menor de 18 anos: déficit limitado a 10%. Converse com um profissional de saúde.');
  }
  let kcal = tdee * (1 + ajuste);
  const piso = Math.max(pisoKcal(perfil.sexo), menor ? tmb : 0);
  let limitado = false;
  if (kcal < piso && ajuste < 0) { kcal = Math.max(piso, Math.min(tdee, piso)); limitado = true; avisos.push(`A meta ficou limitada ao piso de segurança de ${Math.round(piso)} kcal/dia. Déficits maiores só com acompanhamento profissional.`); }
  const rotuloAj = ajuste === 0 ? 'sem ajuste' : `${ajuste > 0 ? '+' : ''}${Math.round(ajuste * 100)}%`;
  explic.push(`Objetivo "${(OBJETIVOS.find(o => o.id === obj) || {}).rotulo}": ${rotuloAj} sobre o gasto${limitado ? ' (limitado pelo piso de segurança)' : ''} => meta de ${Math.round(kcal)} kcal/dia.`);

  // Macros
  let gkg = { perder: 2.0, ganhar: 1.8, recomp: 2.2, manter: 1.6 }[obj] ?? 1.6;
  if (obj === 'perder' && gorduraPct != null && gorduraPct < 18) gkg = 2.2;
  if (menor) gkg = Math.min(gkg, 1.8);
  let prot = gkg * peso;
  let gord = Math.max(0.8 * peso, 0.25 * kcal / 9);
  if ((prot * 4 + gord * 9) > kcal * 0.95) { gord = Math.max(0.6 * peso, (kcal * 0.95 - prot * 4) / 9); }
  const carb = Math.max(0, (kcal - prot * 4 - gord * 9) / 4);
  explic.push(`Proteína: ${vir(gkg.toFixed(1))} g por kg (${Math.round(prot)} g/dia). Faixa de 1,6 a 2,2 g/kg ajuda a manter e construir músculo, principalmente em déficit.`);
  explic.push(`Gordura: cerca de ${Math.round(gord)} g (mínimo de 0,8 g/kg para hormônios e vitaminas). Carboidrato: o restante, ${Math.round(carb)} g, que abastece o treino.`);

  return {
    idade, menor, tmb: Math.round(tmb), formula, tdee: Math.round(tdee), gastoBase: Math.round(tmb * nivel.fator), fatorAtividade: nivel.fator, ajuste, kcal: Math.round(kcal),
    prot: Math.round(prot), carb: Math.round(carb), gord: Math.round(gord),
    fibra: Math.round(14 * kcal / 1000), agua: Math.round(35 * peso / 50) * 50,
    protPorKg: gkg, explicacao: explic, avisos,
  };
}

// ------------------------- dia / refeições ------------------------------

export function tipoRefeicaoPorHora(hora) {
  if (hora < 5) return 'Ceia';
  if (hora < 10) return 'Café da manhã';
  if (hora < 12) return 'Lanche da manhã';
  if (hora < 15) return 'Almoço';
  if (hora < 18) return 'Lanche da tarde';
  if (hora < 21.5) return 'Jantar';
  return 'Ceia';
}
export const TIPOS_REFEICAO = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Pré-treino', 'Pós-treino', 'Jantar', 'Ceia', 'Outro'];

/** totais de um conjunto de refeições (cada refeição tem .itens com kcal/p/c/g/f/acucar) */
export function totaisDoDia(refeicoes) {
  const t = { kcal: 0, p: 0, c: 0, g: 0, f: 0, acucar: 0, kcalUltra: 0, mlBebidaAcucarada: 0 };
  for (const r of refeicoes) {
    for (const it of r.itens || []) {
      t.kcal += it.kcal || 0; t.p += it.p || 0; t.c += it.c || 0; t.g += it.g || 0; t.f += it.f || 0;
      t.acucar += it.acucar || 0;
      if (it.ultra) t.kcalUltra += it.kcal || 0;
      if (it.bebidaAcucarada) t.mlBebidaAcucarada += it.gramas || 0;
    }
  }
  return t;
}

/** Alertas de açúcar/ultraprocessados/bebidas açucaradas */
export function alertasAlimentares(tot, metaKcal) {
  const a = [];
  const limiteAcucar = Math.min(50, 0.10 * (metaKcal || 2000) / 4);
  if (tot.acucar > limiteAcucar) {
    a.push({ nivel: 'alto', titulo: 'Açúcar acima do limite', texto: `Estimamos ${Math.round(tot.acucar)} g de açúcar hoje (limite sugerido pela OMS: cerca de ${Math.round(limiteAcucar)} g, 10% das calorias). Açúcar em excesso aumenta calorias vazias e atrapalha a gordura corporal.` });
  }
  if (tot.mlBebidaAcucarada >= 350) {
    a.push({ nivel: 'alto', titulo: 'Bebidas açucaradas', texto: `${Math.round(tot.mlBebidaAcucarada)} ml de bebida açucarada hoje. Calorias líquidas saciam pouco; troque por água, café sem açúcar ou versão zero.` });
  }
  if (tot.kcal > 0 && tot.kcalUltra / tot.kcal > 0.35) {
    a.push({ nivel: 'medio', titulo: 'Muitos ultraprocessados', texto: `${Math.round(100 * tot.kcalUltra / tot.kcal)}% das calorias de hoje vêm de ultraprocessados. Tente manter abaixo de um terço, priorizando comida de verdade.` });
  }
  return a;
}

/**
 * Intervalos entre refeições. refeicoes: [{ts}] ordenadas ou não.
 * Retorna maior intervalo (h) entre refeições consecutivas do dia e, se for hoje, o tempo desde a última.
 */
export function intervalos(refeicoes, agora = new Date(), ehHoje = true) {
  const ts = refeicoes.map(r => new Date(r.ts).getTime()).sort((a, b) => a - b);
  const lacunas = [];
  for (let i = 1; i < ts.length; i++) lacunas.push((ts[i] - ts[i - 1]) / 3.6e6);
  const desdeUltima = ehHoje && ts.length ? (agora.getTime() - ts[ts.length - 1]) / 3.6e6 : null;
  return { maior: lacunas.length ? Math.max(...lacunas) : 0, lacunas, desdeUltima };
}

export function avaliarIntervalo(iv, limiteH = 5.5, agora = new Date()) {
  const hora = agora.getHours() + agora.getMinutes() / 60;
  if (iv.desdeUltima != null && iv.desdeUltima >= limiteH && hora >= 7 && hora < 22) {
    return `Faz ${iv.desdeUltima.toFixed(1).replace('.', ',')} h desde a última refeição. Intervalos longos aumentam a fome e o risco de exagero.`;
  }
  if (iv.maior >= limiteH + 1) {
    return `Hoje houve um intervalo de ${iv.maior.toFixed(1).replace('.', ',')} h entre refeições. Tente distribuir melhor a proteína ao longo do dia.`;
  }
  return null;
}

export { arred };
