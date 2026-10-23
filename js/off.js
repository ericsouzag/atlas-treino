// Busca opcional de produtos industrializados no Open Food Facts (https://world.openfoodfacts.org).
// Dados abertos sob a licença ODbL: https://opendatacommons.org/licenses/odbl/1-0/ (atribuição em Ajustes > Créditos).
//
// Só roda quando a pessoa pede (botão "Buscar produto" ou código de barras). Nunca é chamada em segundo plano.
// Verificado em out/2026:
//   - Código de barras:  GET {host}/api/v2/product/{codigo}.json?fields=...      (CORS aberto, estável)
//   - Busca por texto:   GET {host}/cgi/search.pl?search_terms=...&json=1        (CORS aberto, mas INSTÁVEL: responde 503
//                        de tempos em tempos em um dos hosts; por isso tentamos world e br, com tempo limite)
//   - search.openfoodfacts.org (Search-a-licious) NÃO envia cabeçalhos CORS, então o navegador bloqueia: não usado.
//   - Limites da API: ~100 consultas/min por produto e ~10/min para buscas; o app só faz uma busca por toque.
//   - O navegador não permite definir User-Agent; usamos os parâmetros da própria URL e nada de dados pessoais.
const HOSTS = ['https://world.openfoodfacts.org', 'https://br.openfoodfacts.org'];
const CAMPOS = 'code,product_name,generic_name,brands,quantity,serving_size,serving_quantity,nutriments,countries_tags,nova_group';

export const AVISO_OFF = 'Dados do Open Food Facts, podem estar incompletos.';

const numero = v => { const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v; return typeof n === 'number' && Number.isFinite(n) ? n : null; };
const arred = (x, d = 1) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

/** fetch com tempo limite. Lança Error('timeout') / Error('http 503') / erro de rede. */
async function buscarJson(url, { ms = 7000, fetchImpl = globalThis.fetch } = {}) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = setTimeout(() => ctl && ctl.abort(), ms);
  try {
    const r = await fetchImpl(url, { signal: ctl ? ctl.signal : undefined, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('http ' + r.status);
    const tipo = (r.headers && r.headers.get && r.headers.get('content-type')) || 'application/json';
    if (!/json/i.test(tipo)) throw new Error('resposta inesperada');
    return await r.json();
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('timeout');
    throw e;
  } finally { clearTimeout(t); }
}

/** Só dígitos, 8 a 14 (EAN-8, UPC-A, EAN-13, GTIN-14) */
export function codigoValido(txt) {
  const d = String(txt ?? '').replace(/\D/g, '');
  return d.length >= 8 && d.length <= 14 ? d : null;
}

/**
 * Converte um produto do Open Food Facts para o nosso formato (valores por 100 g/ml).
 * Retorna { codigo, nome, marca, quantidade, kcal, p, c, g, f, acucar, porcaoG, liquido, avisos[], utilizavel }
 */
export function normalizarProduto(prod) {
  if (!prod || typeof prod !== 'object') return null;
  const n = prod.nutriments || {};
  const avisos = [];
  const nome = String(prod.product_name || prod.generic_name || '').trim();
  const marca = String(prod.brands || '').split(',')[0].trim();
  let kcal = numero(n['energy-kcal_100g']);
  if (kcal == null) { const kj = numero(n['energy-kj_100g']) ?? numero(n['energy_100g']); if (kj != null) { kcal = kj / 4.184; avisos.push('Calorias convertidas de kJ.'); } }
  const p = numero(n.proteins_100g), c = numero(n.carbohydrates_100g), g = numero(n.fat_100g);
  const f = numero(n.fiber_100g), acucar = numero(n.sugars_100g);
  if (kcal == null && p != null && c != null && g != null) { kcal = 4 * p + 4 * c + 9 * g; avisos.push('Calorias estimadas a partir dos macros (o rótulo cadastrado não informa).'); }
  const serv = String(prod.serving_size || '');
  const qtd = String(prod.quantity || '');
  const liquido = /\b(ml|l|litro|litros)\b/i.test(serv) || /\d\s*(ml|l|litros?)\b/i.test(qtd);
  const porcaoG = numero(prod.serving_quantity) ?? (() => { const m = serv.match(/(\d+[.,]?\d*)\s*(g|ml)\b/i); return m ? numero(m[1]) : null; })();
  const faltando = [];
  if (!nome) faltando.push('nome');
  if (kcal == null) faltando.push('calorias');
  if (p == null) faltando.push('proteína');
  if (c == null) faltando.push('carboidrato');
  if (g == null) faltando.push('gordura');
  if (faltando.length) avisos.push(`Faltam no cadastro: ${faltando.join(', ')}. Complete antes de usar.`);
  const ng = numero(prod.nova_group);   // grupo NOVA calculado pelo Open Food Facts (1 a 4), quando existe
  const out = {
    codigo: String(prod.code || ''), nome, marca, quantidade: qtd,
    kcal: arred(kcal, 0), p: arred(p), c: arred(c), g: arred(g), f: arred(f), acucar: arred(acucar),
    porcaoG: porcaoG && porcaoG > 0 && porcaoG < 2000 ? porcaoG : null, porcaoTexto: serv, liquido, avisos, nova: ng != null && Number.isInteger(ng) && ng >= 1 && ng <= 4 ? ng : null,
  };
  out.utilizavel = !!nome && kcal != null && kcal >= 0 && kcal <= 900;
  if (kcal != null && kcal > 900) avisos.push('Calorias fora do possível (provável erro de cadastro). Corrija os números.');
  return out;
}

/** Busca um produto pelo código de barras. Retorna produto normalizado ou null (não cadastrado). Lança erro se a rede falhar. */
export async function buscarPorCodigo(codigo, opcoes = {}) {
  const cod = codigoValido(codigo);
  if (!cod) throw new Error('Código inválido: digite os números do código de barras (8 a 14 dígitos).');
  let ultimoErro = null;
  for (const host of HOSTS) {
    try {
      const j = await buscarJson(`${host}/api/v2/product/${cod}.json?fields=${CAMPOS}`, opcoes);
      if (j && j.status === 0) return null;
      if (j && j.product) return normalizarProduto({ ...j.product, code: j.product.code || cod });
      return null;
    } catch (e) { ultimoErro = e; }
  }
  throw ultimoErro || new Error('Sem resposta');
}

/** Busca por texto. Retorna lista de produtos normalizados (só os que têm nome e algum número). Lança erro se a rede falhar. */
export async function buscarPorTexto(texto, { limite = 10, ...opcoes } = {}) {
  const q = String(texto ?? '').trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    search_terms: q, search_simple: '1', action: 'process', json: '1', page_size: String(Math.min(25, limite * 2)),
    sort_by: 'unique_scans_n', fields: CAMPOS, lc: 'pt',
    tagtype_0: 'countries', tag_contains_0: 'contains', tag_0: 'brazil',
  });
  let ultimoErro = null;
  for (const host of HOSTS) {
    try {
      const j = await buscarJson(`${host}/cgi/search.pl?${params}`, opcoes);
      const lista = (j.products || []).map(normalizarProduto).filter(x => x && x.nome && x.kcal != null);
      return lista.slice(0, limite);
    } catch (e) { ultimoErro = e; }
  }
  throw ultimoErro || new Error('Sem resposta');
}

/** Texto amigável para um erro de rede/serviço */
export function mensagemErro(e) {
  const m = String((e && e.message) || e || '');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'Sem internet no momento. A busca de produtos precisa de conexão; o restante do app funciona normalmente.';
  if (/timeout/i.test(m)) return 'O Open Food Facts demorou demais para responder. Tente de novo em instantes, digite o código de barras ou crie o alimento manualmente.';
  if (/http 5|http 429/i.test(m)) return 'O Open Food Facts está indisponível ou limitando consultas agora. Tente de novo em alguns minutos, ou crie o alimento manualmente.';
  if (/Código inválido/.test(m)) return m;
  return 'Não consegui consultar o Open Food Facts agora. Você pode tentar de novo ou criar o alimento manualmente.';
}

// ---------------------------------------------------------------------------------------------
// Leitura de código de barras pela câmera (BarcodeDetector, Chrome/Android e alguns outros). Opcional.

export const leitorDisponivel = () => typeof globalThis.BarcodeDetector === 'function' && !!(globalThis.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

/**
 * Abre a câmera traseira dentro de `video` e resolve com o primeiro código lido.
 * Retorna { parar() , promessa } para o chamador poder cancelar.
 */
export function lerCodigoPelaCamera(video) {
  let parado = false, stream = null, raf = 0;
  const parar = () => { parado = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); if (video) video.srcObject = null; };
  const promessa = (async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    if (parado) { parar(); return null; }
    video.srcObject = stream; video.setAttribute('playsinline', ''); await video.play();
    const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    return new Promise(resolve => {
      const quadro = async () => {
        if (parado) return resolve(null);
        try {
          const r = await det.detect(video);
          const cod = r.map(x => codigoValido(x.rawValue)).find(Boolean);
          if (cod) { parar(); return resolve(cod); }
        } catch { /* próximo quadro */ }
        raf = requestAnimationFrame(quadro);
      };
      quadro();
    });
  })();
  return { parar, promessa };
}
