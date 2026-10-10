// Casca do app: roteamento por hash, navegação, tema e registro do service worker.
import { store } from './store.js';
import { h, limpar, icone, aviso } from './ui.js';
import { onboardingFeito, config, perfil } from './dados.js';
import { iniciarNuvem } from './firebase.js';

const ROTAS = {
  alimentacao: { rotulo: 'Alimentação', icone: 'talher', carregar: () => import('./views/alimentacao.js') },
  treino: { rotulo: 'Treino', icone: 'halter', carregar: () => import('./views/treino.js') },
  corpo: { rotulo: 'Corpo', icone: 'fita', carregar: () => import('./views/corpo.js') },
  relatorios: { rotulo: 'Relatórios', icone: 'grafico', carregar: () => import('./views/relatorios.js') },
  config: { rotulo: 'Ajustes', icone: 'engrenagem', carregar: () => import('./views/config.js') },
  onboarding: { rotulo: 'Começar', icone: 'alvo', carregar: () => import('./views/onboarding.js'), oculta: true },
};

const el = { faixa: null, abas: null, main: null };
let rotaAtual = null;
let limpeza = null;
let seqRender = 0;

function rotaDoHash() {
  const m = (location.hash || '').match(/^#\/([a-z]+)/);
  return m && ROTAS[m[1]] ? m[1] : 'alimentacao';
}

export function navegar(rota) { location.hash = `#/${rota}`; }

function aplicarTema() {
  const t = config().tema;
  if (t === 'claro' || t === 'escuro') document.documentElement.dataset.tema = t;
  else delete document.documentElement.dataset.tema;
}

function desenharAbas(rota) {
  limpar(el.abas);
  Object.entries(ROTAS).filter(([, r]) => !r.oculta).forEach(([id, r]) => {
    el.abas.appendChild(h('a', { class: 'aba', href: `#/${id}`, 'aria-current': id === rota ? 'page' : null }, icone(r.icone, 24), h('span', null, r.rotulo)));
  });
}

const ctx = {
  navegar,
  redesenhar: () => renderizar(true),
  /** Define título e controles da faixa superior */
  faixa(titulo, ...controles) {
    limpar(el.faixa);
    el.faixa.append(h('span', { class: 'marca', 'aria-hidden': 'true' }, 'Atlas'), h('h1', { id: 'titulo-pagina' }, titulo), ...controles);
    document.title = `${titulo} · Atlas Fitness`;
  },
};

async function renderizar(manter = false) {
  let rota = rotaDoHash();
  if (!onboardingFeito() && !perfil().onbPulado && rota !== 'onboarding') { rota = 'onboarding'; history.replaceState(null, '', '#/onboarding'); }
  const minha = ++seqRender;
  const sy = manter ? window.scrollY : 0;
  if (limpeza) { try { limpeza(); } catch (e) { console.error(e); } limpeza = null; }
  desenharAbas(rota);
  let mod;
  try { mod = await ROTAS[rota].carregar(); }
  catch (e) { console.error(e); limpar(el.main).append(h('p', { class: 'aviso aviso-alto' }, 'Não foi possível carregar esta tela. Verifique sua conexão e recarregue.')); return; }
  if (minha !== seqRender) return;
  limpar(el.main);
  try { limpeza = mod.renderizar(el.main, ctx) || null; }
  catch (e) { console.error(e); el.main.append(h('div', { class: 'aviso aviso-alto' }, h('div', null, h('strong', null, 'Algo deu errado nesta tela'), h('p', null, 'Seus dados estão salvos. Tente recarregar a página.')))); }
  if (rota !== rotaAtual && !manter) { window.scrollTo(0, 0); }
  else if (manter) window.scrollTo(0, sy);
  rotaAtual = rota;
}

function iniciar() {
  store.iniciar();
  window.__atlas = { store };   // útil para depuração no console
  el.faixa = document.getElementById('faixa'); el.abas = document.getElementById('abas'); el.main = document.getElementById('principal');
  aplicarTema();
  window.addEventListener('hashchange', () => renderizar(false));
  document.addEventListener('atlas:atualizar', () => renderizar(true));
  // mudanças vindas da nuvem: redesenha quando seguro
  store.assinar(ev => {
    if (ev.tipo === 'erro-gravacao') aviso('Armazenamento do aparelho cheio: faça um backup em Ajustes e libere espaço.', { duracao: 8000 });
    if (ev.tipo === 'tudo' || (ev.tipo === 'item' && ev.id === null) || (ev.tipo === 'unico' && ev.nome === 'config')) {
      if (ev.nome === 'config') aplicarTema();
      const a = document.activeElement;
      if (!document.querySelector('dialog[open]') && !(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) renderizar(true);
    }
  });
  renderizar(false);
  iniciarNuvem();
  // Em localhost o service worker só liga com ?sw (evita cache velho durante o desenvolvimento)
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && ((location.protocol === 'https:' && !local) || (local && location.search.includes('sw')))) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker não registrado', e));
  }
}

iniciar();
