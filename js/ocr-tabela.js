// OCR da tabela nutricional NO PRÓPRIO APARELHO: a imagem nunca sai do navegador (decisão do produto: sem IA em nuvem).
// Tesseract.js (Apache-2.0) é carregado sob demanda do jsDelivr, em versão fixa; o núcleo WASM e o idioma (por + eng) são baixados
// na primeira leitura (alguns MB) e o service worker (sw.js) guarda os arquivos para as leituras seguintes funcionarem offline.
// Funções de navegador (canvas, createImageBitmap); o parse do texto fica em js/tabela-nutricional.js (puro e testado).

export const TESSERACT_VERSAO = '5.1.1';
export const TESSERACT_URL = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSAO}/dist/tesseract.min.js`;

let carregando = null;
/** Carrega o script do Tesseract.js uma vez. Rejeita com Error('offline') se não conseguir baixar. */
export function carregarTesseract() {
  if (typeof window !== 'undefined' && window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!carregando) carregando = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = TESSERACT_URL; s.crossOrigin = 'anonymous'; s.async = true;
    s.onload = () => (window.Tesseract ? res(window.Tesseract) : (carregando = null, rej(new Error('ocr-indisponivel'))));
    s.onerror = () => { carregando = null; s.remove(); rej(new Error('offline')); };
    document.head.appendChild(s);
  });
  return carregando;
}

/** Abre a imagem respeitando a rotação EXIF (celulares gravam a foto "deitada" com um carimbo de orientação) */
async function abrirBitmap(blob) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { /* navegador sem a opção: cai no <img>, que já aplica o EXIF */ }
  }
  const url = URL.createObjectURL(blob);
  try { return await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
}

/**
 * Prepara a foto para o OCR: ajusta a escala (lado maior entre 1400 e 2200 px), converte para tons de cinza e estica o contraste
 * (percentis 2 e 98 do histograma). Retorna { ocr: canvas para leitura, vista: Blob JPEG colorido e leve para conferência }.
 */
export async function prepararImagem(blob, { ladoMin = 1400, ladoMax = 2200 } = {}) {
  const bmp = await abrirBitmap(blob);
  const w0 = bmp.width, h0 = bmp.height, maior = Math.max(w0, h0);
  const esc = maior > ladoMax ? ladoMax / maior : maior < ladoMin ? Math.min(2, ladoMin / maior) : 1;
  const w = Math.round(w0 * esc), h = Math.round(h0 * esc);
  const vista = document.createElement('canvas'); vista.width = w; vista.height = h;
  vista.getContext('2d').drawImage(bmp, 0, 0, w, h);
  const ocr = document.createElement('canvas'); ocr.width = w; ocr.height = h;
  const ctx = ocr.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(vista, 0, 0);
  const img = ctx.getImageData(0, 0, w, h), d = img.data, hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) { const y = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]); d[i] = d[i + 1] = d[i + 2] = y; hist[y]++; }
  const total = w * h; let acc = 0, lo = 0, hi = 255;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * 0.02) { lo = i; break; } }
  acc = 0; for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= total * 0.02) { hi = i; break; } }
  const faixa = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) { const y = Math.max(0, Math.min(255, Math.round(((d[i] - lo) * 255) / faixa))); d[i] = d[i + 1] = d[i + 2] = y; }
  ctx.putImageData(img, 0, 0);
  const vistaLeve = await new Promise(res => vista.toBlob(b => res(b), 'image/jpeg', 0.82));
  return { ocr, vista: vistaLeve, largura: w, altura: h };
}

const ROTULOS = {
  'loading tesseract core': 'Preparando o leitor (a primeira vez baixa alguns MB)…',
  'initializing tesseract': 'Preparando o leitor…',
  'loading language traineddata': 'Baixando o idioma (só na primeira vez)…',
  'initializing api': 'Preparando o leitor…',
  'recognizing text': 'Lendo a tabela…',
};

/**
 * Inicia o OCR local. Retorna { promessa, cancelar }. A promessa resolve com o texto lido e rejeita com
 * Error('offline') (não baixou o leitor), Error('cancelado') ou outro erro.
 * @param {HTMLCanvasElement} canvas imagem preparada
 * @param {(p:{fracao:number, texto:string})=>void} aoProgredir
 */
export function lerTextoDaImagem(canvas, aoProgredir = () => {}) {
  let worker = null, cancelado = false;
  const promessa = (async () => {
    aoProgredir({ fracao: 0, texto: 'Carregando o leitor (internet só na primeira vez)…' });
    const T = await carregarTesseract();
    if (cancelado) throw new Error('cancelado');
    try {
      worker = await T.createWorker(['por', 'eng'], 1, {
        logger: m => { if (!cancelado) aoProgredir({ fracao: Math.max(0, Math.min(1, m.progress || 0)), texto: ROTULOS[m.status] || 'Lendo…' }); },
      });
      if (cancelado) throw new Error('cancelado');
      await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
      const r = await worker.recognize(canvas);
      if (cancelado) throw new Error('cancelado');
      return (r && r.data && r.data.text) || '';
    } catch (e) {
      if (cancelado) throw new Error('cancelado');
      // falha ao baixar núcleo/idioma sem internet aparece como erro de rede dentro do worker
      if (/network|fetch|load|failed|importScripts/i.test(String(e && (e.message || e)))) throw new Error('offline');
      throw e;
    } finally { try { if (worker) await worker.terminate(); } catch { /* ok */ } }
  })();
  return { promessa, cancelar: () => { cancelado = true; try { if (worker) worker.terminate(); } catch { /* ok */ } } };
}
