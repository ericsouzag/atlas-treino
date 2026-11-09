// "Registrar um dia inteiro": para dias em que a pessoa não conseguiu registrar. Copia (ou escala) um dia REAL do histórico dela.
// Funções PURAS e testadas (tests/dia-estimado.test.mjs); a tela fica em views/dia-estimado.js.
//
// Decisões (também mostradas na tela e no README):
//  1. Histórico = dias com lançamentos reais dos últimos 60 dias ANTES do dia escolhido; lançamentos gerados por esta função
//     (origem 'dia-estimado') nunca entram na estatística (não realimenta). Mínimo de 5 dias com registro.
//  2. Dia incompleto = menos de 800 kcal ou menos de 50% da média de todos os dias do histórico (a pessoa provavelmente esqueceu de registrar).
//     Outlier = fora de 1,5×IQR (quartis por interpolação linear) entre os dias completos. Nenhum dos dois é candidato.
//  3. Dia abaixo/acima = o dia real elegível de menor/maior consumo (empate: o mais recente); copia refeições, tipos, horários e quantidades.
//  4. Dia normal = média das kcal dos dias elegíveis; usa o dia elegível mais próximo dela (empate: o mais recente) e ESCALA as quantidades
//     para a média, arredondando as gramas (<20 g: 1 g; <100 g: 5 g; demais: 10 g), mantendo a composição.
//  5. Destino com lançamentos: "adicionar" (padrão) ou "substituir só os gerados"; lançamentos reais nunca são apagados por aqui.
//  6. Desfazer apaga só o que foi gerado na operação (e restaura o que ela substituiu).
export const ORIGEM_ESTIMADO = 'dia-estimado';
export const JANELA_DIAS = 60;
export const MIN_DIAS = 5;
export const KCAL_MIN_COMPLETO = 800;
export const FRACAO_MIN_DA_MEDIA = 0.5;
export const MODOS = ['abaixo', 'normal', 'acima'];

const num = x => (Number.isFinite(+x) ? +x : 0);
const p2 = n => String(n).padStart(2, '0');
const diaDoTs = ts => String(ts).slice(0, 10);
const horaDoTs = ts => String(ts).slice(11, 16);
const somarDiasISO = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };

export const ehEstimado = r => !!r && r.origem === ORIGEM_ESTIMADO;
export const kcalDaRefeicao = r => ((r && r.itens) || []).reduce((s, i) => s + num(i.kcal), 0);
export function totaisDeRefeicoes(refeicoes) {
  const t = { kcal: 0, p: 0, c: 0, g: 0, f: 0 };
  for (const r of refeicoes || []) for (const i of r.itens || []) { t.kcal += num(i.kcal); t.p += num(i.p); t.c += num(i.c); t.g += num(i.g); t.f += num(i.f); }
  return t;
}

/** Média aritmética (0 se vazio) */
export const media = v => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);

/** Quartil por interpolação linear (q em 0..1) de uma lista; [] -> 0 */
export function quantil(valores, q) {
  const v = [...valores].sort((a, b) => a - b);
  if (!v.length) return 0;
  const pos = (v.length - 1) * q, i = Math.floor(pos), f = pos - i;
  return i + 1 < v.length ? v[i] * (1 - f) + v[i + 1] * f : v[i];
}
/** Limites do método IQR (1,5×IQR). Com menos de 4 valores não há como estimar: nada é outlier. */
export function limitesIQR(valores, k = 1.5) {
  if (valores.length < 4) return { q1: null, q3: null, iqr: null, min: -Infinity, max: Infinity };
  const q1 = quantil(valores, 0.25), q3 = quantil(valores, 0.75), iqr = q3 - q1;
  return { q1, q3, iqr, min: q1 - k * iqr, max: q3 + k * iqr };
}

/**
 * Dias reais do histórico: agrupa por data os lançamentos NÃO gerados, na janela [dia - janela, dia) (o próprio dia de destino e o futuro ficam de fora).
 * @returns {{data:string, kcal:number, p:number, c:number, g:number, refeicoes:object[]}[]} ordenado por data (antigo -> recente)
 */
export function diasDoHistorico(refeicoes, { dia, janela = JANELA_DIAS } = {}) {
  const ini = somarDiasISO(dia, -janela), mapa = new Map();
  for (const r of refeicoes || []) {
    if (!r || !r.ts || ehEstimado(r) || r._d) continue;
    const d = diaDoTs(r.ts);
    if (d >= dia || d < ini) continue;
    if (!mapa.has(d)) mapa.set(d, []);
    mapa.get(d).push(r);
  }
  return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([data, rs]) => {
    const t = totaisDeRefeicoes(rs);
    return { data, kcal: t.kcal, p: t.p, c: t.c, g: t.g, refeicoes: rs.sort((a, b) => a.ts.localeCompare(b.ts)) };
  }).filter(d => d.kcal > 0);
}

/**
 * Separa os dias em incompletos, outliers e elegíveis. Média geral usada no corte de "incompleto"; IQR só entre os completos.
 * @returns {{elegiveis, incompletos, outliers, mediaGeral:number, mediaElegiveis:number, limites:object}}
 */
export function classificarDias(dias) {
  const mediaGeral = media(dias.map(d => d.kcal));
  const incompletos = dias.filter(d => d.kcal < KCAL_MIN_COMPLETO || d.kcal < FRACAO_MIN_DA_MEDIA * mediaGeral);
  const completos = dias.filter(d => !incompletos.includes(d));
  const limites = limitesIQR(completos.map(d => d.kcal));
  const outliers = completos.filter(d => d.kcal < limites.min || d.kcal > limites.max);
  const elegiveis = completos.filter(d => !outliers.includes(d));
  return { elegiveis, incompletos, outliers, mediaGeral, mediaElegiveis: media(elegiveis.map(d => d.kcal)), limites };
}

/** Escolhe o dia de origem. 'normal' devolve também a média e o fator de escala (média / kcal do dia escolhido). */
export function escolherDia(elegiveis, modo, mediaAlvo = media(elegiveis.map(d => d.kcal))) {
  if (!elegiveis.length) return null;
  const maisRecente = (a, b) => b.data.localeCompare(a.data);
  const ord = [...elegiveis];
  if (modo === 'abaixo') ord.sort((a, b) => a.kcal - b.kcal || maisRecente(a, b));
  else if (modo === 'acima') ord.sort((a, b) => b.kcal - a.kcal || maisRecente(a, b));
  else ord.sort((a, b) => Math.abs(a.kcal - mediaAlvo) - Math.abs(b.kcal - mediaAlvo) || maisRecente(a, b));
  const dia = ord[0];
  return { dia, fator: modo === 'normal' && dia.kcal > 0 ? mediaAlvo / dia.kcal : 1, mediaAlvo };
}

/** Arredonda gramas de forma limpa: <20 g -> 1 g; <100 g -> 5 g; senão 10 g (mínimo 1) */
export function arredondarGramas(g) {
  const passo = g < 20 ? 1 : g < 100 ? 5 : 10;
  return Math.max(1, Math.round(g / passo) * passo);
}

/** Escala um item pelo fator, com gramas "limpas" e nutrientes proporcionais às gramas finais */
export function escalarItem(item, fator) {
  if (!(fator > 0) || Math.abs(fator - 1) < 1e-9 || !(num(item.gramas) > 0)) return { ...item };
  const g = arredondarGramas(num(item.gramas) * fator), k = g / num(item.gramas);
  const { unidadeTexto, quantidade, ...resto } = item;   // "2 ovos" deixaria de bater com a nova quantidade em gramas
  return { ...resto, gramas: g, kcal: num(item.kcal) * k, p: num(item.p) * k, c: num(item.c) * k, g: num(item.g) * k, f: num(item.f) * k, acucar: num(item.acucar) * k };
}

/**
 * Lançamentos novos (sem id) para o dia de destino, a partir das refeições do dia de origem.
 * Mantêm tipo, hora e itens; levam origem 'dia-estimado' e o lote da operação (para desfazer).
 */
export function gerarLancamentos({ refeicoesOrigem, dia, fator = 1, lote, dataOrigem, modo }) {
  return refeicoesOrigem.map(r => ({
    ts: `${dia}T${horaDoTs(r.ts) || '12:00'}:00`, tipo: r.tipo, texto: r.texto || '',
    itens: (r.itens || []).map(i => escalarItem(i, fator)),
    origem: ORIGEM_ESTIMADO, estimadoLote: lote, estimadoDe: dataOrigem, estimadoModo: modo,
  }));
}

/** Prévia completa de uma opção: tudo que a tela mostra e o que será gravado */
export function preverDia({ refeicoes, dia, modo, lote = 'previa', janela = JANELA_DIAS }) {
  const hist = diasDoHistorico(refeicoes, { dia, janela });
  if (hist.length < MIN_DIAS) return { ok: false, motivo: 'poucos-dias', diasComRegistro: hist.length, faltam: MIN_DIAS - hist.length, modo };
  const cl = classificarDias(hist);
  const esc = escolherDia(cl.elegiveis, modo, cl.mediaElegiveis);
  if (!esc) return { ok: false, motivo: 'sem-dia-elegivel', diasComRegistro: hist.length, faltam: 0, modo, descartados: { incompletos: cl.incompletos.length, outliers: cl.outliers.length } };
  const lancamentos = gerarLancamentos({ refeicoesOrigem: esc.dia.refeicoes, dia, fator: esc.fator, lote, dataOrigem: esc.dia.data, modo });
  const totais = totaisDeRefeicoes(lancamentos);
  return {
    ok: true, modo, dataOrigem: esc.dia.data, kcalOrigem: esc.dia.kcal, fator: esc.fator, kcalResultado: totais.kcal, totais,
    media: cl.mediaElegiveis, nDiasConsiderados: cl.elegiveis.length, nDiasComRegistro: hist.length,
    descartados: { incompletos: cl.incompletos.length, outliers: cl.outliers.length }, lancamentos,
    menor: Math.min(...cl.elegiveis.map(d => d.kcal)), maior: Math.max(...cl.elegiveis.map(d => d.kcal)),
  };
}

/** Situação do dia de destino: o que já tem e quais opções existem. Reais nunca são apagados por esta função. */
export function situacaoDestino(refeicoes, dia) {
  const doDia = (refeicoes || []).filter(r => r && !r._d && r.ts && diaDoTs(r.ts) === dia);
  const geradas = doDia.filter(ehEstimado), reais = doDia.filter(r => !ehEstimado(r));
  const opcoes = [{ id: 'adicionar', rotulo: 'Adicionar aos existentes' }];
  if (geradas.length) opcoes.push({ id: 'substituir-gerados', rotulo: 'Substituir só os dias estimados' });
  return { reais, geradas, temLancamentos: doDia.length > 0, opcoes };
}
/** Ids que "substituir só os gerados" pode apagar: apenas lançamentos com origem 'dia-estimado' */
export const idsSubstituiveis = (refeicoes, dia) => situacaoDestino(refeicoes, dia).geradas.map(r => r.id);
/** Ids gerados em uma operação (lote), para desfazer */
export const idsDoLote = (refeicoes, lote) => (refeicoes || []).filter(r => r && !r._d && r.estimadoLote === lote).map(r => r.id);
/** Datas (AAAA-MM-DD) que têm algum lançamento estimado, para o selo "dia estimado" e a nota em Relatórios */
export const diasComEstimado = refeicoes => [...new Set((refeicoes || []).filter(r => r && !r._d && ehEstimado(r)).map(r => diaDoTs(r.ts)))].sort();
