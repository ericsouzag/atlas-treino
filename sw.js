// Service worker do Atlas Fitness: funciona offline. Atualize VERSAO a cada publicação para renovar o cache.
const VERSAO = 'atlas-v1.4.0';
const ARQUIVOS = [
  './',
  './css/app.css',
  './css/fonts.css',
  './firebase-config.js',
  './fonts/bricolage-grotesque.woff2',
  './fonts/figtree.woff2',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './index.html',
  './js/atividades.js',
  './js/charts.js',
  './js/composition.js',
  './js/dados.js',
  './js/datas.js',
  './js/entrada.js',
  './js/estimador.js',
  './js/exercises.js',
  './js/fichas.js',
  './js/firebase.js',
  './js/foods.js',
  './js/ilustracao.js',
  './js/ilustracoes-dados.js',
  './js/images.js',
  './js/main.js',
  './js/nutrition.js',
  './js/parser.js',
  './js/planner.js',
  './js/store.js',
  './js/texto.js',
  './js/tips.js',
  './js/ui.js',
  './js/views/alimentacao.js',
  './js/views/config.js',
  './js/views/corpo.js',
  './js/views/entrada.js',
  './js/views/onboarding.js',
  './js/views/registro-treino.js',
  './js/views/relatorios.js',
  './js/views/treino.js',
  './manifest.webmanifest',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Arquivos do próprio app: cache primeiro, atualizando em segundo plano. Firebase/CDN: sempre rede.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSAO).then(async c => {
    const emCache = await c.match(req, { ignoreSearch: true });
    const rede = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (emCache) { rede.catch(() => {}); return emCache; }
    const r = await rede;
    if (r) return r;
    if (req.mode === 'navigate') return (await c.match('./index.html')) || Response.error();
    return Response.error();
  }));
});
