// Fotos (refeições e progresso) guardadas no IndexedDB, redimensionadas. NÃO são analisadas nem enviadas à nuvem.
const BD = 'atlas-fotos', LOJA = 'fotos';

function abrir() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB indisponível'));
    const req = indexedDB.open(BD, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(LOJA, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(modo, fn) {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const t = db.transaction(LOJA, modo);
    const r = fn(t.objectStore(LOJA));
    t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

/** Redimensiona para no máximo `lado` px e comprime em JPEG */
export async function redimensionar(file, lado = 1280, qualidade = 0.8) {
  const bmp = await (window.createImageBitmap ? createImageBitmap(file) : new Promise((res, rej) => {
    const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file);
  }));
  const w = bmp.width, h = bmp.height, esc = Math.min(1, lado / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * esc); c.height = Math.round(h * esc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(b => res(b), 'image/jpeg', qualidade));
}

export async function salvarFoto(file, meta = {}) {
  const blob = await redimensionar(file);
  const id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await tx('readwrite', s => s.put({ id, blob, criada: Date.now(), ...meta }));
  return id;
}
export async function obterFoto(id) {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const r = db.transaction(LOJA).objectStore(LOJA).get(id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}
const cacheURL = new Map();
export async function urlFoto(id) {
  if (cacheURL.has(id)) return cacheURL.get(id);
  const f = await obterFoto(id).catch(() => null);
  if (!f) return null;
  const u = URL.createObjectURL(f.blob);
  cacheURL.set(id, u);
  return u;
}
export async function removerFoto(id) {
  await tx('readwrite', s => s.delete(id)).catch(() => {});
  const u = cacheURL.get(id); if (u) { URL.revokeObjectURL(u); cacheURL.delete(id); }
}
export async function apagarTodasFotos() {
  await tx('readwrite', s => s.clear()).catch(() => {});
  cacheURL.forEach(u => URL.revokeObjectURL(u)); cacheURL.clear();
}
export async function exportarFotos(ids) {
  const out = {};
  for (const id of ids) {
    const f = await obterFoto(id).catch(() => null);
    if (!f) continue;
    out[id] = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f.blob); });
  }
  return out;
}
export async function importarFotos(mapa) {
  for (const [id, dataURL] of Object.entries(mapa || {})) {
    const blob = await (await fetch(dataURL)).blob();
    await tx('readwrite', s => s.put({ id, blob, criada: Date.now() }));
  }
}
