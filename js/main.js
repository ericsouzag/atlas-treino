// Casca do app: roteamento por hash, navegação, tema e registro do service worker.
import { store } from './store.js';
import { h, limpar, icone, aviso, confirmar } from './ui.js';
import { onboardingFeito, config, perfil } from './dados.js';
import { iniciarNuvem, usuarioAtual, aguardarUsuario, definirDecisorEnvio } from './firebase.js';
import { nuvemConfigurada } from '../firebase-config.js';
import { deveMostrarEntrada, lerEscolha } from './entrada.js';

const ROTAS = {
  alimentacao: { rotulo: 'Alimentação', icone: 'talher', carregar: () => import('./views/alimentacao.js') },
  treino: { rotulo: 'Treino', icone: 'halter', carregar: () => import('./views/treino.js') },
  corpo: { rotulo: 'Corpo', icone: 'fita', carregar: () => import('./views/corpo.js') },
  relatorios: { rotulo: 'Relatórios', icone: 'grafico', carregar: () => import('./views/relatorios.js') },
  config: { rotulo: 'Ajustes', icone: 'engrenagem', carregar: () => import('./views/config.js') },
  entrada: { rotulo: 'Bem-vindo', icone: 'pessoa', carregar: () => import('./views/entrada.js'), oculta: true },
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
  const precisaEntrada = deveMostrarEntrada({ nuvem: nuvemConfigurada(), usuario: usuarioAtual(), escolha: lerEscolha() });
  if (precisaEntrada && rota !== 'entrada') { rota = 'entrada'; history.replaceState(null, '', '#/entrada'); }
  else if (!precisaEntrada && rota === 'entrada' && !usuarioAtual()) { rota = onboardingFeito() || perfil().onbPulado ? 'alimentacao' : 'onboarding'; history.replaceState(null, '', `#/${rota}`); }
  else if (!precisaEntrada && !onboardingFeito() && !perfil().onbPulado && rota !== 'onboarding') { rota = 'onboarding'; history.replaceState(null, '', '#/onboarding'); }
  const minha = ++seqRender;
  const sy = manter ? window.scrollY : 0;
  if (limpeza) { try { limpeza(); } catch (e) { console.error(e); } limpeza = null; }
  document.body.classList.toggle('sem-abas', rota === 'entrada');
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

async function iniciar() {
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
  if (nuvemConfigurada()) {
    definirDecisorEnvio(() => confirmar('Enviar seus dados para a conta?', 'Esta conta é nova e neste aparelho já existem dados (perfil, refeições, treinos). Quer enviá-los para a nuvem?', { sim: 'Enviar para a nuvem', nao: 'Não enviar' }));
    iniciarNuvem();
    if (lerEscolha() !== 'local') { await aguardarUsuario(3500); }   // quem já está logado vai direto ao app
  }
  renderizar(false);
  // Em localhost o service worker só liga com ?sw (evita cache velho durante o desenvolvimento)
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && ((location.protocol === 'https:' && !local) || (local && location.search.includes('sw')))) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker não registrado', e));
  }
}

iniciar();
