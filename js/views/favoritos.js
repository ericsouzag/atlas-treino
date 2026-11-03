// "Meus favoritos": lista, busca, editar (nome, tipo, itens, quantidades), registrar agora, duplicar, remover (com desfazer) e reordenar.
// Um favorito é uma refeição (conjunto de itens) ou um alimento só. Funções puras de edição em js/favoritos.js.
import { h, limpar, icone, iconeCheio, campo, entradaNum, selecao, lerNumero, n0, n1, aviso, folha, confirmar, caixaAviso } from '../ui.js';
import { store } from '../store.js';
import { alimentoPorId, porcaoPadrao } from '../foods.js';
import { dataISO, horaHM, tsLocal } from '../datas.js';
import { TIPOS_REFEICAO, tipoRefeicaoPorHora } from '../nutrition.js';
import { escolherAlimento } from './buscar-alimento.js';
import {
  itemDeAlimento, totaisFavorito, resumoComQuantidades, migrarFavorito, definirTipo, trocarItem, alterarQuantidade,
  removerItem, adicionarItem, duplicar, favoritoValido, ordenarFavoritos, moverFavorito, filtrarFavoritos, favoritoDeAlimento, itensParaRegistro,
} from '../favoritos.js';

const lerTodos = () => ordenarFavoritos(store.listar('favoritos').map(migrarFavorito));
const unidadesDe = a => { const base = a ? (a.liquido ? 'ml' : 'g') : 'g'; return [[base, base, 1], ...(a ? a.porcoes.map(p => [p.nome, p.nome, p.g]) : [])]; };

/** Registra o favorito como refeição no dia/hora escolhidos. Retorna a refeição salva ou undefined. */
function abrirRegistrarAgora(fav, dia) {
  return folha('Registrar agora', fechar => {
    const hr = horaHM();
    const inpData = h('input', { type: 'date', value: dia || dataISO(), max: dataISO() });
    const inpHora = h('input', { type: 'time', value: hr });
    const selTipo = selecao(TIPOS_REFEICAO, fav.tipo && TIPOS_REFEICAO.includes(fav.tipo) ? fav.tipo : tipoRefeicaoPorHora(+hr.slice(0, 2) + +hr.slice(3) / 60));
    const t = totaisFavorito(fav);
    return h('div', { class: 'pilha' },
      h('p', null, h('strong', null, fav.nome), h('span', { class: 'mudo' }, ` · ${n0(t.kcal)} kcal · P ${n0(t.p)} C ${n0(t.c)} G ${n0(t.g)}`)),
      h('p', { class: 'mudo peq' }, resumoComQuantidades(fav)),
      h('div', { class: 'grade-2' }, campo('Data', inpData), campo('Horário', inpHora)), campo('Tipo de refeição', selTipo),
      h('div', { class: 'linha-botoes' },
        h('button', { class: 'btn', type: 'button', onclick: () => fechar(undefined) }, 'Cancelar'),
        h('button', { class: 'btn btn-primario', type: 'button', onclick: () => {
          if (!inpData.value || !inpHora.value) { aviso('Informe a data e o horário.'); return; }
          const r = store.salvar('refeicoes', { ts: tsLocal(inpData.value, inpHora.value), tipo: selTipo.value, texto: fav.nome, itens: itensParaRegistro(fav), repetida: true });
          fechar(r);
        } }, icone('ok', 18), 'Registrar')));
  });
}

/** Editor de um favorito (ou de um novo). Retorna o favorito salvo ou undefined. */
function abrirEditor(favInicial) {
  const novo = !favInicial.id;
  return folha(novo ? 'Novo favorito' : 'Editar favorito', fechar => {
    let fav = { ...favInicial, itens: favInicial.itens.map(i => ({ ...i })) };
    const nome = h('input', { type: 'text', value: fav.nome || '', maxlength: 80, autocomplete: 'off', placeholder: 'Ex.: Meu café da manhã', 'aria-label': 'Nome do favorito', oninput: e => { fav = { ...fav, nome: e.target.value }; } });
    const tipoSel = selecao(TIPOS_REFEICAO, fav.tipo, { 'aria-label': 'Tipo de refeição padrão', onchange: e => { fav = definirTipo(fav, e.target.value); } });
    const lista = h('div'), totais = h('div', { class: 'totais-conf', 'aria-live': 'polite' }), erros = h('div', { 'aria-live': 'polite' });
    function recalc() {
      const t = totaisFavorito(fav);
      limpar(totais).append(h('span', null, h('b', null, n0(t.kcal)), ' kcal'), h('span', null, h('b', null, n0(t.p)), ' g prot.'), h('span', null, h('b', null, n0(t.c)), ' g carbo'), h('span', null, h('b', null, n0(t.g)), ' g gord.'), h('span', null, h('b', null, n0(t.f)), ' g fibra'));
    }
    function desenhar() {
      limpar(lista);
      if (!fav.itens.length) lista.append(h('p', { class: 'ajuda' }, 'Nenhum item ainda. Toque em "Adicionar item".'));
      fav.itens.forEach((it, idx) => {
        const a = it.alimentoId ? alimentoPorId(it.alimentoId) : null;
        const unids = unidadesDe(a);
        const sel = it.unidadeSel && unids.find(u => u[0] === it.unidadeSel) ? it.unidadeSel : unids[0][0];
        const fator = unids.find(u => u[0] === sel)[2];
        const qtd = entradaNum(Math.round((it.gramas / fator) * 10) / 10, { 'aria-label': `Quantidade de ${it.nome}`, onchange: e => { const v = lerNumero(e.target.value); if (v != null && v > 0) { fav = alterarQuantidade(fav, idx, v * fator); fav.itens[idx].unidadeSel = sel; desenhar(); } } });
        const un = selecao(unids.map(u => [u[0], u[1] + (u[2] !== 1 ? ` (${u[2]} g)` : '')]), sel, { 'aria-label': 'Unidade', onchange: e => { const f2 = unids.find(u => u[0] === e.target.value)[2]; const v = lerNumero(qtd.value) ?? 1; fav = alterarQuantidade(fav, idx, v * f2); fav.itens[idx].unidadeSel = e.target.value; desenhar(); } });
        lista.append(h('div', { class: 'linha-item' },
          h('div', null,
            h('button', { class: 'nome-btn', type: 'button', 'aria-label': `Trocar alimento: ${it.nome}`, onclick: async () => {
              const esc = await escolherAlimento({ titulo: 'Trocar alimento', consulta: '' });
              if (esc) { const g0 = it.gramas > 0 ? it.gramas : porcaoPadrao(esc); fav = trocarItem(fav, idx, itemDeAlimento(esc, g0)); desenhar(); }
            } }, it.nome),
            h('div', { class: 'mudo peq' }, `${n0(it.kcal)} kcal · P ${n1(it.p)} · C ${n1(it.c)} · G ${n1(it.g)}`)),
          h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': `Remover ${it.nome}`, onclick: () => { fav = removerItem(fav, idx); desenhar(); } }, icone('lixo')),
          h('div', { class: 'qtd' }, campo('Quantidade', qtd), campo('Unidade', un))));
      });
      recalc();
    }
    desenhar();
    async function salvar() {
      limpar(erros);
      if (!String(fav.nome || '').trim()) { erros.append(caixaAviso('alto', null, 'Dê um nome ao favorito.')); nome.focus(); return; }
      if (!favoritoValido(fav)) { erros.append(caixaAviso('alto', null, 'Adicione pelo menos um item com quantidade.')); return; }
      const limpo = { ...fav, itens: fav.itens.map(({ unidadeSel, ...i }) => i), nome: fav.nome.trim() };
      fechar(store.salvar('favoritos', limpo));
    }
    return h('div', { class: 'pilha' },
      campo('Nome', nome), campo('Tipo de refeição padrão', tipoSel, 'Sugerido ao registrar; dá para mudar na hora.'),
      h('h3', { class: 'rotulo-grupo' }, 'Itens'), lista,
      h('button', { class: 'btn', type: 'button', onclick: async () => { const esc = await escolherAlimento({ titulo: 'Adicionar alimento' }); if (esc) { fav = adicionarItem(fav, itemDeAlimento(esc, porcaoPadrao(esc))); desenhar(); } } }, icone('mais', 18), 'Adicionar item'),
      totais, erros,
      h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => fechar(undefined) }, 'Cancelar'), h('button', { class: 'btn btn-primario', type: 'button', onclick: salvar }, icone('ok', 18), 'Salvar favorito')));
  }, { larga: true });
}

/**
 * Abre "Meus favoritos". `dia`: dia selecionado na Alimentação (padrão de "Registrar agora"). Retorna quando a folha fecha;
 * `aoMudar` é chamado a cada alteração (para a tela de trás se redesenhar ao fechar).
 */
export function abrirFavoritos({ dia = null, aoMudar = () => {} } = {}) {
  let mudou = false;
  const mexeu = () => { mudou = true; };
  return folha('Meus favoritos', fechar => {
    const busca = h('input', { type: 'search', placeholder: 'Buscar por nome, tipo ou alimento', 'aria-label': 'Buscar nos favoritos', autocomplete: 'off', oninput: () => desenhar() });
    const caixa = h('div', { class: 'pilha', role: 'list', 'aria-label': 'Favoritos' });

    function cartao(f, todos, i) {
      const t = totaisFavorito(f);
      const mover = d => { const ups = moverFavorito(todos, f.id, d); if (!ups.length) return; for (const u of ups) { const orig = store.listar('favoritos').find(x => x.id === u.id); if (orig && orig.ordem !== u.ordem) store.salvar('favoritos', { ...orig, ordem: u.ordem }); } mexeu(); desenhar(); };
      return h('article', { class: 'refeicao fav-card', role: 'listitem', 'aria-label': f.nome },
        h('header', null, h('span', { class: 'tipo-grande' }, f.nome), h('span', { class: 'total' }, `${n0(t.kcal)} kcal`)),
        h('p', { class: 'macros-grupo' }, `${f.tipo} · P ${n0(t.p)} g · C ${n0(t.c)} g · G ${n0(t.g)} g`),
        h('p', { class: 'fav-itens' }, resumoComQuantidades(f) || 'Sem itens'),
        h('div', { class: 'acoes acoes-grupo' },
          h('button', { class: 'btn btn-peq btn-primario', type: 'button', onclick: async () => {
            const r = await abrirRegistrarAgora(f, dia);
            if (r) { mexeu(); aviso(`Registrado: ${n0(t.kcal)} kcal.`, { acao: 'Desfazer', aoAcao: () => { store.remover('refeicoes', r.id); mexeu(); aoMudar(); } }); }
          } }, icone('repetir', 18), 'Registrar agora'),
          h('button', { class: 'btn btn-peq', type: 'button', onclick: async () => { const s = await abrirEditor(f); if (s) { mexeu(); desenhar(); } } }, icone('lapis', 18), 'Editar')),
        h('div', { class: 'lanc-acoes fav-mais' },
          h('button', { class: 'btn-icone', type: 'button', 'aria-label': `Duplicar ${f.nome}`, onclick: () => { store.salvar('favoritos', duplicar(f)); mexeu(); aviso('Favorito duplicado.'); desenhar(); } }, icone('trocar')),
          h('button', { class: 'btn-icone', type: 'button', 'aria-label': `Subir ${f.nome}`, disabled: i === 0, onclick: () => mover(-1) }, icone('cima')),
          h('button', { class: 'btn-icone', type: 'button', 'aria-label': `Descer ${f.nome}`, disabled: i === todos.length - 1, onclick: () => mover(1) }, icone('baixo')),
          h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': `Remover ${f.nome} dos favoritos`, onclick: async () => {
            if (!(await confirmar('Remover dos favoritos?', `"${f.nome}" sai da lista de favoritos. As refeições já registradas não mudam.`, { sim: 'Remover', perigo: true }))) return;
            const bruto = store.listar('favoritos').find(x => x.id === f.id);
            store.remover('favoritos', f.id); mexeu(); desenhar();
            aviso('Removido dos favoritos.', { acao: 'Desfazer', aoAcao: () => { if (bruto) store.salvar('favoritos', bruto); mexeu(); desenhar(); aoMudar(); } });
          } }, icone('lixo'))));
    }

    function desenhar() {
      limpar(caixa);
      const todos = lerTodos();
      const lista = filtrarFavoritos(todos, busca.value);
      if (!todos.length) {
        caixa.append(h('div', { class: 'vazio' }, h('h3', null, 'Nenhum favorito ainda'),
          h('ul', null, h('li', null, 'Toque na estrela de uma refeição na lista "Refeições de hoje" para guardá-la aqui.'), h('li', null, 'Ou toque em "Novo favorito" e monte um com os alimentos que você mais come.'))));
        return;
      }
      if (!lista.length) { caixa.append(h('p', { class: 'ajuda' }, 'Nenhum favorito com esse texto.')); return; }
      lista.forEach(f => caixa.append(cartao(f, todos, todos.findIndex(x => x.id === f.id))));
    }
    desenhar();
    const dlgFecha = () => { if (mudou) aoMudar(); };
    setTimeout(() => { const dlg = caixa.closest('dialog'); if (dlg) dlg.addEventListener('close', dlgFecha); }, 0);
    return h('div', { class: 'pilha' },
      h('p', { class: 'mudo' }, 'Refeições (ou alimentos) que você marcou com a estrela. Registre com 1 toque, edite itens e quantidades, duplique ou remova.'),
      h('div', { class: 'linha-botoes' },
        h('button', { class: 'btn', type: 'button', onclick: async () => { const s = await abrirEditor({ nome: '', tipo: tipoRefeicaoPorHora(+horaHM().slice(0, 2) + +horaHM().slice(3) / 60), itens: [] }); if (s) { mexeu(); desenhar(); } } }, icone('mais', 18), 'Novo favorito'),
        h('button', { class: 'btn', type: 'button', onclick: async () => { const esc = await escolherAlimento({ titulo: 'Favoritar um alimento' }); if (esc) { store.salvar('favoritos', favoritoDeAlimento(esc, porcaoPadrao(esc), tipoRefeicaoPorHora(+horaHM().slice(0, 2) + +horaHM().slice(3) / 60))); mexeu(); aviso('Alimento favoritado.'); desenhar(); } } }, iconeCheio('estrela', 18), 'Favoritar um alimento')),
      busca, caixa);
  }, { larga: true });
}
