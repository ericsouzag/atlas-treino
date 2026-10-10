// Catálogo de atividades, MET e conversões de ritmo (pace, velocidade, distância, duração). Funções puras.
// MET: Compêndio de Atividades Físicas (Ainsworth 2011), valores arredondados. Gasto = ESTIMATIVA líquida:
// (MET - 1) x peso x horas, porque o gasto de repouso já está no metabolismo basal (evita contar duas vezes).

export const KM_POR_MI = 1.609344;

// ---------------------------------------------------------------- conversões de ritmo
/** "5:30" -> 5.5 (min); "5,5" -> 5.5. Retorna null se inválido. */
export function lerPace(txt) {
  if (txt == null) return null;
  const s = String(txt).trim().replace(',', '.');
  if (!s) return null;
  const m = s.match(/^(\d+):(\d{1,2})$/);
  if (m) { const seg = +m[2]; if (seg >= 60) return null; return +m[1] + seg / 60; }
  const n = parseFloat(s);
  return isNaN(n) || n <= 0 ? null : n;
}
/** 5.5 -> "5:30" */
export function formatarPace(min) {
  if (min == null || !isFinite(min) || min <= 0) return '';
  let m = Math.floor(min), s = Math.round((min - m) * 60);
  if (s === 60) { m++; s = 0; }
  return `${m}:${String(s).padStart(2, '0')}`;
}
export const kmParaMi = km => km / KM_POR_MI;
export const miParaKm = mi => mi * KM_POR_MI;
/** pace em min/km <-> min/mi */
export const paceKmParaMi = p => p * KM_POR_MI;
export const paceMiParaKm = p => p / KM_POR_MI;
/** velocidade km/h <-> pace min/km */
export const velParaPace = v => (v > 0 ? 60 / v : null);
export const paceParaVel = p => (p > 0 ? 60 / p : null);

/**
 * Completa o campo que falta a partir de dois dos três: distKm, durMin, paceMinKm.
 * Entradas nulas = desconhecidas. Retorna { distKm, durMin, paceMinKm, velKmh } ou com nulls se não der.
 */
export function resolverRitmo({ distKm = null, durMin = null, paceMinKm = null }) {
  const ok = x => x != null && isFinite(x) && x > 0;
  if (ok(distKm) && ok(durMin)) paceMinKm = durMin / distKm;
  else if (ok(distKm) && ok(paceMinKm)) durMin = distKm * paceMinKm;
  else if (ok(durMin) && ok(paceMinKm)) distKm = durMin / paceMinKm;
  return { distKm: ok(distKm) ? distKm : null, durMin: ok(durMin) ? durMin : null, paceMinKm: ok(paceMinKm) ? paceMinKm : null, velKmh: ok(paceMinKm) ? 60 / paceMinKm : null };
}

/** Natação: distância em metros, duração em min, pace em min/100 m */
export function resolverNatacao({ metros = null, durMin = null, pace100 = null }) {
  const ok = x => x != null && isFinite(x) && x > 0;
  if (ok(metros) && ok(durMin)) pace100 = durMin / (metros / 100);
  else if (ok(metros) && ok(pace100)) durMin = pace100 * (metros / 100);
  else if (ok(durMin) && ok(pace100)) metros = (durMin / pace100) * 100;
  return { metros: ok(metros) ? metros : null, durMin: ok(durMin) ? durMin : null, pace100: ok(pace100) ? pace100 : null };
}

// ---------------------------------------------------------------- MET
function interpolar(pontos, x) {
  if (x <= pontos[0][0]) return pontos[0][1];
  for (let i = 1; i < pontos.length; i++) {
    if (x <= pontos[i][0]) { const [x0, y0] = pontos[i - 1], [x1, y1] = pontos[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  }
  return pontos[pontos.length - 1][1];
}
const MET_CORRIDA = [[6.4, 6.0], [8.0, 8.3], [9.7, 9.8], [11.3, 11.0], [12.9, 11.8], [14.5, 12.8], [16.1, 14.5], [17.7, 16], [19.3, 19]];
const MET_CAMINHADA = [[3.2, 2.8], [4.0, 3.0], [4.8, 3.5], [5.6, 4.3], [6.4, 5.0], [7.2, 7.0], [8.0, 8.3]];
const MET_BIKE = [[10, 3.5], [16, 5.8], [19.3, 6.8], [22.5, 8.0], [25.7, 10.0], [30, 12.0], [35, 15.8]];
export const metCorrida = v => interpolar(MET_CORRIDA, v);
export const metCaminhada = v => interpolar(MET_CAMINHADA, v);
export const metBike = v => interpolar(MET_BIKE, v);

/** Velocidades padrão (km/h) quando a pessoa só informa a intensidade */
const VEL_PADRAO = {
  corrida: { leve: 8.0, moderada: 10.0, intensa: 12.5 },
  caminhada: { leve: 4.0, moderada: 5.6, intensa: 6.8 },
  ciclismo: { leve: 16, moderada: 20, intensa: 27 },
};

export const INTENSIDADES = [['leve', 'Leve'], ['moderada', 'Moderada'], ['intensa', 'Intensa']];

// ---------------------------------------------------------------- catálogo
// campos: quais controles a tela mostra. MET fixo por intensidade: [leve, moderada, intensa]
export const ATIVIDADES = {
  corrida: { nome: 'Corrida', tipo: 'ritmo', met: null, intensidades: [['leve', 'Leve'], ['moderada', 'Moderada'], ['intensa', 'Intensa'], ['intervalada', 'Intervalada (tiros)']], metIntervalada: 10.0 },
  caminhada: { nome: 'Caminhada', tipo: 'ritmo', met: null, terreno: true, intensidades: INTENSIDADES },
  ciclismo: { nome: 'Ciclismo', tipo: 'bike', met: null, intensidades: INTENSIDADES, metIndoor: [3.5, 6.8, 8.8] },
  natacao: { nome: 'Natação', tipo: 'natacao', intensidades: INTENSIDADES,
    estilos: { crawl: ['Crawl (livre)', 5.8, 8.3, 9.8], costas: ['Costas', 4.8, 7.0, 9.5], peito: ['Peito', 5.3, 8.3, 10.3], borboleta: ['Borboleta', 8.0, 11.0, 13.8], medley: ['Medley / misto', 6.0, 8.5, 10.0] } },
  hiit: { nome: 'HIIT / funcional', tipo: 'simples', met: [4.5, 6.5, 8.8], intensidades: INTENSIDADES },
  musculacao: { nome: 'Musculação avulsa', tipo: 'simples', met: [3.5, 5.0, 6.0], intensidades: INTENSIDADES },
  futebol: { nome: 'Futebol', tipo: 'simples', grupo: 'Esportes', met: [5.0, 7.0, 10.0], intensidades: INTENSIDADES },
  volei: { nome: 'Vôlei', tipo: 'simples', grupo: 'Esportes', met: [3.0, 4.0, 8.0], intensidades: INTENSIDADES },
  basquete: { nome: 'Basquete', tipo: 'simples', grupo: 'Esportes', met: [4.5, 6.5, 8.0], intensidades: INTENSIDADES },
  tenis: { nome: 'Tênis', tipo: 'simples', grupo: 'Esportes', met: [5.0, 7.3, 8.0], intensidades: INTENSIDADES },
  luta: { nome: 'Luta / artes marciais', tipo: 'simples', grupo: 'Esportes', met: [5.0, 10.3, 12.8], intensidades: INTENSIDADES },
  danca: { nome: 'Dança', tipo: 'simples', grupo: 'Esportes', met: [4.5, 6.5, 8.0], intensidades: INTENSIDADES },
  yoga: { nome: 'Yoga / pilates', tipo: 'simples', grupo: 'Esportes', met: [2.5, 3.0, 4.0], intensidades: INTENSIDADES },
  remo: { nome: 'Remo (ergômetro)', tipo: 'simples', grupo: 'Esportes', met: [4.8, 7.0, 8.5], intensidades: INTENSIDADES },
  eliptico: { nome: 'Elíptico', tipo: 'simples', grupo: 'Esportes', met: [4.6, 6.5, 8.0], intensidades: INTENSIDADES },
  escada: { nome: 'Escada (stair)', tipo: 'simples', grupo: 'Esportes', met: [6.0, 9.0, 11.0], intensidades: INTENSIDADES },
  corda: { nome: 'Pular corda', tipo: 'simples', grupo: 'Esportes', met: [8.8, 11.8, 12.3], intensidades: INTENSIDADES },
  outro: { nome: 'Outra atividade', tipo: 'simples', grupo: 'Esportes', met: [3.0, 5.0, 8.0], intensidades: INTENSIDADES, pedeNome: true },
};
export const ATIVIDADES_DESTAQUE = ['corrida', 'caminhada', 'ciclismo', 'natacao', 'hiit', 'musculacao'];

const idxInt = i => (i === 'leve' ? 0 : i === 'moderada' ? 1 : 2);

/**
 * MET da atividade. dados: { atividade, intensidade, velKmh, indoor, estilo, terrenoSubida }
 */
export function metDaAtividade(dados) {
  const a = ATIVIDADES[dados.atividade];
  if (!a) return 4.0;
  const ii = idxInt(dados.intensidade);
  switch (a.tipo) {
    case 'ritmo': {
      if (dados.atividade === 'corrida') {
        if (dados.intensidade === 'intervalada' && !dados.velKmh) return a.metIntervalada;
        const v = dados.velKmh || VEL_PADRAO.corrida[dados.intensidade] || 10;
        return metCorrida(v);
      }
      const v = dados.velKmh || VEL_PADRAO.caminhada[dados.intensidade] || 5.6;
      let met = metCaminhada(v);
      if (dados.terrenoSubida) met = Math.max(met, 6.0) + (dados.intensidade === 'intensa' ? 1 : 0);
      return met;
    }
    case 'bike': {
      if (dados.indoor) return a.metIndoor[ii];
      return metBike(dados.velKmh || VEL_PADRAO.ciclismo[dados.intensidade] || 20);
    }
    case 'natacao': { const e = a.estilos[dados.estilo] || a.estilos.crawl; return e[1 + ii]; }
    default: return a.met[ii];
  }
}

/** kcal líquidas = (MET - 1) x kg x horas */
export function kcalAtividade(met, pesoKg, durMin) {
  if (!pesoKg || !durMin) return 0;
  return Math.max(0, (met - 1) * pesoKg * (durMin / 60));
}

/** Resumo textual curto de uma atividade registrada */
export function descricaoAtividade(a) {
  const base = (ATIVIDADES[a.atividade] || { nome: a.nome || 'Atividade' }).nome;
  const nome = a.atividade === 'outro' && a.nomeLivre ? a.nomeLivre : base;
  const p = [];
  if (a.distKm) p.push(a.unidade === 'mi' ? `${(a.distKm / KM_POR_MI).toFixed(2).replace('.', ',')} mi` : `${a.distKm.toFixed(2).replace('.', ',')} km`);
  if (a.metros) p.push(`${Math.round(a.metros)} m`);
  if (a.durMin) p.push(`${Math.round(a.durMin)} min`);
  if (a.intensidade) p.push(a.intensidade === 'intervalada' ? 'intervalada' : a.intensidade);
  return { nome, detalhe: p.join(' · ') };
}
