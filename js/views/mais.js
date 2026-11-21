// "Mais": no celular a barra inferior tem 5 abas (Alimentação, Treino, Corpo, Jornada, Mais); Relatórios e Ajustes ficam aqui.
// No desktop o menu lateral mostra todas as telas e esta rota apenas redireciona para os Relatórios.
import { h, icone } from '../ui.js';

export function renderizar(raiz, ctx) {
  ctx.faixa('Mais');
  if (window.matchMedia && window.matchMedia('(min-width: 900px)').matches) { location.replace('#/relatorios'); return; }
  const item = (href, ic, titulo, desc) => h('a', { class: 'cartao mais-item', href }, icone(ic, 26), h('span', null, h('strong', null, titulo), h('small', null, desc)), icone('dir', 20));
  raiz.append(h('div', { class: 'pilha' },
    item('#/relatorios', 'grafico', 'Relatórios', 'Gráficos, previsão de composição e grau de processamento'),
    item('#/config', 'engrenagem', 'Ajustes', 'Perfil, metas, backup, favoritos, preenchimento automático e privacidade')));
}
