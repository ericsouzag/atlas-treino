// Personagem da Jornada: parâmetros corporais SUGERIDOS a partir dos dados da pessoa, edição manual por parâmetro e histórico do desenho.
// Funções PURAS e testadas (tests/personagem.test.mjs). A renderização em SVG está em js/personagem-svg.js.
//
// Princípios (produto público, saúde): o desenho é POSITIVO e realista. Todos os parâmetros ficam numa faixa limitada e saudável
// (0,15 a 0,85, nunca extremos), não há rótulos de "gordo/magro" e o desenho nunca "piora" como punição. Com IMC abaixo de 18,5 o desenho
// não fica mais magro (piso de volume). Para menores de 18 anos as mudanças corporais são sutis. "Ocultar mudanças corporais" congela o corpo.
// A silhueta base (masculina/feminina/neutra) é escolha da pessoa e independe do sexo biológico usado nas estimativas.

export const PARAMS = ['altura', 'volume', 'definicao', 'ombros', 'bracos', 'pernas'];
export const ROTULOS_PARAMS = { altura: 'Altura', volume: 'Volume do corpo', definicao: 'Definição do abdômen', ombros: 'Ombros e peito', bracos: 'Braços', pernas: 'Pernas' };
export const LIM_MIN = 0.15, LIM_MAX = 0.85;
export const SILHUETAS = ['neutro', 'fem', 'masc'];
export const PADRAO_CORPO = { altura: 0.5, volume: 0.4, definicao: 0.4, ombros: 0.45, bracos: 0.45, pernas: 0.45 };

export const limitar = v => Math.max(LIM_MIN, Math.min(LIM_MAX, Number.isFinite(+v) ? +v : 0.5));
const c01 = v => Math.max(0, Math.min(1, v));
const mapa = (t, a, b) => a + (b - a) * c01(t);
const media = (a, b) => (a + b) / 2;

/** Personagem padrão (criado = false até a pessoa concluir o fluxo de criação; dá para pular) */
export function personagemPadrao() {
  return {
    versao: 1, criado: false, nome: 'Meu personagem', silhueta: 'neutro', pele: 2, cabelo: { estilo: 'curto', cor: 2 }, expressao: 'sorriso',
    roupa: { camisa: 'verde', calca: 'escuro' }, acessorios: [], modo: 'auto', manual: {}, porParametro: {}, ocultarMudancas: false, corpoFixo: null, historico: [],
  };
}
/** Junta o que foi guardado com os padrões (tolera dados antigos ou incompletos) */
export function lerPersonagem(guardado) {
  const p = personagemPadrao(), g = guardado || {};
  return { ...p, ...g, cabelo: { ...p.cabelo, ...(g.cabelo || {}) }, roupa: { ...p.roupa, ...(g.roupa || {}) }, manual: { ...(g.manual || {}) }, porParametro: { ...(g.porParametro || {}) }, historico: Array.isArray(g.historico) ? g.historico : [], acessorios: Array.isArray(g.acessorios) ? g.acessorios : [] };
}

/**
 * Corpo SUGERIDO. Entrada: { sexo:'M'|'F'|null (biológico, só para as estimativas), alturaCm, pesoKg, gordura (% medido/estimado ou null), idade,
 * medidas:{cintura,ombros,peito,braco_d,coxa_d} }. Saída: { altura, volume, definicao, ombros, bracos, pernas } (0,15 a 0,85) + `estimado` (true se a gordura foi estimada).
 */
export function sugerirCorpo({ sexo = null, alturaCm = null, pesoKg = null, gordura = null, idade = null, medidas = {} } = {}) {
  const out = { ...PADRAO_CORPO, estimado: false };
  if (alturaCm > 100) out.altura = mapa((alturaCm - 150) / 40, 0.2, 0.8);
  if (!(alturaCm > 100) || !(pesoKg > 25)) return finalizar(out, idade);
  const m = alturaCm / 100, imc = pesoKg / (m * m), homem = sexo === 'M';
  let g = Number.isFinite(+gordura) && gordura > 0 ? +gordura : null;
  if (g == null) { g = 1.2 * imc + 0.23 * (idade ?? 30) - 10.8 * (homem ? 1 : 0) - 5.4; out.estimado = true; }   // Deurenberg (estimativa por IMC)
  g = Math.max(5, Math.min(50, g));
  const [lo, hi] = homem ? [8, 32] : [16, 42], t = c01((g - lo) / (hi - lo));
  out.volume = mapa(t, 0.2, 0.75);
  out.definicao = mapa(1 - t, 0.15, 0.75);
  // massa muscular por FFMI (massa magra / altura²)
  const ffmi = pesoKg * (1 - g / 100) / (m * m), [fl, fh] = homem ? [16, 23] : [13, 19], mus = mapa((ffmi - fl) / (fh - fl), 0.25, 0.75);
  out.ombros = out.bracos = out.pernas = mus;
  const { cintura, ombros, peito, braco_d, coxa_d } = medidas || {};
  if (cintura > 0 && (ombros > 0 || peito > 0)) out.ombros = media(mus, mapa(((ombros || peito) / cintura - 1.1) / 0.5, 0.2, 0.8));
  if (braco_d > 0) out.bracos = media(mus, mapa((braco_d - 24) / 18, 0.2, 0.8));
  if (coxa_d > 0) out.pernas = media(mus, mapa((coxa_d - 45) / 25, 0.2, 0.8));
  // IMC abaixo de 18,5: o desenho não fica mais magro nem mais "seco" (sem incentivo a emagrecer além do saudável)
  if (imc < 18.5) { out.volume = Math.max(out.volume, 0.35); out.definicao = Math.min(out.definicao, 0.55); }
  return finalizar(out, idade);
}
function finalizar(o, idade) {
  const r = { estimado: !!o.estimado };
  for (const p of PARAMS) {
    let v = limitar(o[p]);
    if (idade != null && idade < 18 && p !== 'altura') v = 0.5 + (v - 0.5) * 0.35;   // menores: variações sutis
    r[p] = Math.round(limitar(v) * 1000) / 1000;
  }
  return r;
}

/** Modo efetivo de um parâmetro: 'auto' (segue os dados) ou 'manual' (mantém o desenho da pessoa) */
export const modoDoParametro = (p, param) => (p.porParametro && p.porParametro[param]) || p.modo || 'auto';

/** Corpo efetivo: congelado se "ocultar mudanças"; senão, por parâmetro, o manual ou o sugerido */
export function corpoEfetivo(personagem, sugerido) {
  const p = lerPersonagem(personagem), s = sugerido || PADRAO_CORPO, out = {};
  for (const k of PARAMS) {
    if (p.ocultarMudancas && p.corpoFixo && p.corpoFixo[k] != null) { out[k] = limitar(p.corpoFixo[k]); continue; }
    out[k] = modoDoParametro(p, k) === 'manual' && p.manual[k] != null ? limitar(p.manual[k]) : limitar(s[k] ?? PADRAO_CORPO[k]);
  }
  return out;
}
/** Edita um parâmetro: passa só ele para manual (os demais continuam seguindo os dados) */
export function editarParametro(personagem, param, valor) {
  const p = lerPersonagem(personagem);
  return { ...p, manual: { ...p.manual, [param]: limitar(valor) }, porParametro: { ...p.porParametro, [param]: 'manual' } };
}
/** "Voltar a seguir meus dados": um parâmetro ou todos */
export function seguirDados(personagem, param = null) {
  const p = lerPersonagem(personagem);
  if (param) { const pp = { ...p.porParametro }; delete pp[param]; const man = { ...p.manual }; delete man[param]; return { ...p, porParametro: pp, manual: man, modo: p.modo === 'manual' ? 'auto' : p.modo }; }
  return { ...p, modo: 'auto', porParametro: {}, manual: {} };
}
/** "Manter o meu desenho": congela TODOS os parâmetros no valor efetivo atual */
export function manterDesenho(personagem, sugerido) {
  const p = lerPersonagem(personagem), atual = corpoEfetivo(p, sugerido), porParametro = {};
  for (const k of PARAMS) porParametro[k] = 'manual';
  return { ...p, modo: 'manual', manual: { ...atual }, porParametro };
}
/** Liga/desliga "Ocultar mudanças corporais": ao ligar, congela o corpo atual */
export function definirOcultarMudancas(personagem, sugerido, ocultar) {
  const p = lerPersonagem(personagem);
  return ocultar ? { ...p, ocultarMudancas: true, corpoFixo: corpoEfetivo({ ...p, ocultarMudancas: false }, sugerido) } : { ...p, ocultarMudancas: false, corpoFixo: null };
}

/** Distância máxima entre dois corpos (para saber se mudou de verdade) */
export const diferencaCorpo = (a, b) => Math.max(...PARAMS.map(k => Math.abs((a?.[k] ?? 0) - (b?.[k] ?? 0))));

/**
 * Linha do tempo do desenho: acrescenta um instantâneo quando o corpo mudou (>= 0,04 em algum parâmetro) e já passaram >= 7 dias do último.
 * Mantém no máximo 12. Guarda só o desenho (nenhum número de peso ou medida).
 */
export function registrarHistorico(historico, data, corpo) {
  const h = [...(historico || [])], ult = h[h.length - 1];
  if (!ult) return [{ data, corpo: { ...corpo } }];
  const dias = Math.round((new Date(data + 'T12:00:00') - new Date(ult.data + 'T12:00:00')) / 864e5);
  if (dias >= 7 && diferencaCorpo(ult.corpo, corpo) >= 0.04) h.push({ data, corpo: { ...corpo } });
  return h.slice(-12);
}

/** Dados do store (perfil + registros de corpo) -> entrada de sugerirCorpo (usa o último peso, gordura e medidas registrados) */
export function entradaDoPerfil({ perfil = {}, corpo = [], idade = null }) {
  const reg = [...corpo].sort((a, b) => String(a.data).localeCompare(String(b.data)));
  const ult = k => { for (let i = reg.length - 1; i >= 0; i--) if (reg[i][k] != null) return reg[i][k]; return null; };
  const medidas = {};
  for (const r of reg) Object.assign(medidas, r.medidas || {});
  return { sexo: perfil.sexo || null, alturaCm: perfil.altura || null, pesoKg: ult('peso') ?? perfil.peso ?? null, gordura: ult('gordura') ?? perfil.gorduraInicial ?? null, idade, medidas };
}
