// Cartão "Seu dia por grau de processamento" (aba Alimentação): barra empilhada por grupo NOVA, com rótulos diretos,
// alternância calorias/gramas, toque no grupo para ver os alimentos do dia e leitura em uma frase.
// Classificação NOVA do Guia Alimentar para a População Brasileira (Ministério da Saúde, 2014); estimativa por regras.
import { h, limpar, icone, n0 } from '../ui.js';
import { GRUPOS_NOVA, SEM_CLASSE, resumoNova, percentuaisInteiros, textoLeitura } from '../nova.js';

const CHAVE = 'atlas.nova.ui';
const lerPref = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } };
const gravarPref = p => { try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch { /* sem armazenamento: segue sem lembrar */ } };

let pref = null;   // { metrica: 'kcal'|'gramas', soClassificados: bool, aberto: bool|undefined }
let grupoAberto = null;   // grupo cujo detalhe está aberto (não persiste entre telas)

export const AVISO_NOVA = 'Classificação NOVA do Guia Alimentar para a População Brasileira (Ministério da Saúde, 2014). É uma estimativa por regras e pode variar conforme a marca e o preparo.';

/**
 * @param {{refeicoes: object[], quando: 'hoje'|'ontem'|'neste dia'}} p
 */
export function cartaoNova({ refeicoes, quando = 'hoje' }) {
  if (!pref) pref = { metrica: 'kcal', soClassificados: false, ...lerPref() };
  const abertoPadrao = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(min-width: 900px)').matches : true;   // no celular nasce recolhido: não empurra a entrada de refeição
  const aberto = pref.aberto ?? abertoPadrao;

  const resumoDe = () => resumoNova(refeicoes, { base: pref.soClassificados ? 'classificados' : 'total' });
  const corpo = h('div', { class: 'nova-corpo' });
  const resumoCurto = h('span', { class: 'nova-curto' });
  const det = h('details', { class: 'cartao nova-card o3', open: aberto },
    h('summary', null, h('h2', null, 'Seu dia por grau de processamento'), resumoCurto, icone('baixo', 20)),
    corpo);
  // só o toque da pessoa grava a preferência (o evento 'toggle' também dispara na criação)
  det.querySelector('summary').addEventListener('click', () => setTimeout(() => { pref.aberto = det.open; gravarPref(pref); }, 0));

  function desenhar() {
    const r = resumoDe();
    const m = pref.metrica;
    const p = percentuaisInteiros(r, m);
    const total = m === 'gramas' ? r.gramasTotal : r.kcalTotal;
    const valorDe = g => (m === 'gramas' ? r.grupos[g].gramas : r.grupos[g].kcal);
    const un = m === 'gramas' ? 'g' : 'kcal';
    resumoCurto.textContent = r.temDados ? `${p[4]}% ultraprocessados · ${p[1]}% in natura` : 'sem registros';
    limpar(corpo);

    if (!r.temDados) {
      corpo.append(
        h('p', { class: 'mudo' }, `Nada registrado ${quando === 'neste dia' ? 'neste dia' : quando} ainda. Registre as refeições e veja aqui quanto do que você comeu é in natura, processado ou ultraprocessado.`),
        h('ul', { class: 'nova-lista nova-lista-vazia' }, GRUPOS_NOVA.map(g => h('li', null, h('span', { class: `nova-chave n${g.id}`, 'aria-hidden': 'true' }, String(g.id)), h('span', null, h('strong', null, g.nome), h('small', null, g.exemplos))))),
        h('p', { class: 'ajuda' }, AVISO_NOVA));
      return;
    }

    // alternância calorias / gramas (calorias é o padrão do Guia)
    const chip = (v, rot) => h('button', { class: `chip ${m === v ? 'ativo' : ''}`, type: 'button', 'aria-pressed': String(m === v), onclick: () => { pref.metrica = v; gravarPref(pref); desenhar(); } }, rot);
    const ordemBarra = r.base === 'classificados' ? [1, 2, 3, 4] : [1, 2, 3, 4, 0];
    const segs = ordemBarra.filter(g => valorDe(g) > 0).map(g => h('span', { class: `nova-seg n${g}`, style: { flexGrow: String(valorDe(g)) }, title: `${(g ? GRUPOS_NOVA[g - 1] : SEM_CLASSE).curto}: ${p[g]}%` },
      p[g] >= 12 ? h('b', null, `${p[g]}%`) : null));
    const barra = h('div', { class: 'nova-barra', 'aria-hidden': 'true' }, segs);
    const resumoTxt = ordemBarra.map(g => `${(g ? GRUPOS_NOVA[g - 1] : SEM_CLASSE).nome} ${p[g]}%`).join('; ');

    const linha = g => {
      const info = g ? GRUPOS_NOVA[g - 1] : SEM_CLASSE;
      const v = valorDe(g);
      const vazio = !(v > 0);
      const painel = h('div', { class: 'nova-itens', id: `nova-itens-${g}`, hidden: grupoAberto !== g || vazio });
      if (!vazio && grupoAberto === g) {
        painel.append(h('ul', null, r.grupos[g].itens.map(i => h('li', null, h('span', { class: 'nm' }, i.nome), h('span', { class: 'vl' }, m === 'gramas' ? `${n0(i.gramas)} ${i.liquido ? 'ml' : 'g'}` : `${n0(i.kcal)} kcal`)))));
        if (g === 0) painel.append(h('p', { class: 'ajuda' }, 'Sem correspondência no banco ou sem regra de classificação. Em "Meus alimentos" você pode informar o tipo (NOVA).'));
      }
      const btn = h('button', { class: `nova-linha n${g}`, type: 'button', 'aria-expanded': String(!vazio && grupoAberto === g), 'aria-controls': painel.id, disabled: vazio,
        'aria-label': `${info.nome}: ${p[g]}% ${m === 'gramas' ? 'do peso' : 'das calorias'}, ${n0(r.grupos[g].kcal)} kcal, ${n0(r.grupos[g].gramas)} gramas. ${vazio ? '' : 'Toque para ver os alimentos.'}`,
        onclick: () => { grupoAberto = grupoAberto === g ? null : g; desenhar(); const novo = corpo.querySelector(`.nova-linha.n${g}`); if (novo) novo.focus(); } },
        h('span', { class: `nova-chave n${g}`, 'aria-hidden': 'true' }, g ? String(g) : '?'),
        h('span', { class: 'nova-nome' }, h('strong', null, info.curto), h('small', null, info.exemplos)),
        h('span', { class: 'nova-num' }, h('strong', null, g === 0 && r.base === 'classificados' ? '–' : `${p[g]}%`), h('small', null, `${n0(v)} ${un}`)));
      return h('li', null, btn, painel);
    };

    const leitura = textoLeitura(r, { quando, metrica: m });
    const alto = m === 'kcal' && p[4] > 33;
    corpo.append(...[
      h('div', { class: 'chips', role: 'group', 'aria-label': 'Medir por' }, chip('kcal', 'Calorias'), chip('gramas', 'Gramas')),
      h('div', { role: 'img', 'aria-label': `Barra do dia por grau de processamento, ${m === 'gramas' ? 'em gramas' : 'em calorias'}: ${resumoTxt}`, class: 'nova-fig' }, barra),
      h('ul', { class: 'nova-lista' }, [1, 2, 3, 4, ...(r.grupos[0].kcal > 0 || r.grupos[0].gramas > 0 ? [0] : [])].map(linha)),
      h('p', { class: `nova-leitura ${alto ? 'alto' : ''}`, 'aria-live': 'polite' }, leitura),
      r.pctSemClasse.kcal > 0 || r.pctSemClasse.gramas > 0
        ? h('label', { class: 'opcao nova-opcao' }, h('input', { type: 'checkbox', checked: pref.soClassificados, onchange: e => { pref.soClassificados = e.target.checked; gravarPref(pref); desenhar(); } }),
          h('span', null, h('strong', null, 'Contar só o que foi classificado'), h('span', { class: 'd' }, `${Math.round(r.pctSemClasse[m === 'gramas' ? 'gramas' : 'kcal'])}% do dia está sem classificação.`)))
        : null,
      m === 'gramas' ? h('p', { class: 'ajuda' }, 'Em gramas, líquidos (água, café, suco) pesam bastante: 1 ml conta como 1 g.') : null,
      h('p', { class: 'ajuda' }, AVISO_NOVA)].filter(Boolean));
  }
  desenhar();
  return det;
}
