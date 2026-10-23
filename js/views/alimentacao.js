// Aba Alimentação: texto livre -> estimativa local -> confirmação -> dia em formato de piso de ladrilhos + lista.
import { h, limpar, icone, iconeCheio, campo, entradaNum, selecao, lerNumero, n0, n1, aviso, folha, confirmar, caixaAviso, debounce } from '../ui.js';
import { store } from '../store.js';
import { estimarRefeicao } from '../estimador.js';
import { alimentoPorId, buscarAlimentos, nutrientesPara, porcaoPadrao } from '../foods.js';
import { dataISO, horaHM, somarDias, rotuloDia, tsLocal, diaDoTs, horaDoTs } from '../datas.js';
import { refeicoesDoDia, metas, aguaDoDia, setAgua, montarItemRefeicao, resumoItens, onboardingFeito, atividadesDoDia, gastoAtivoDoDia, treinosConcluidos } from '../dados.js';
import { escolherAlimento } from './buscar-alimento.js';
import { abrirRegistroTreino } from './registro-treino.js';
import { descricaoAtividade } from '../atividades.js';
import { totaisDoDia, alertasAlimentares, intervalos, avaliarIntervalo, tipoRefeicaoPorHora, TIPOS_REFEICAO } from '../nutrition.js';
import { salvarFoto, urlFoto } from '../images.js';

let diaSel = null;               // dia exibido (persiste entre re-renders)
let rascunho = { texto: '', foto: null, fotoURL: null, data: null, hora: null, tipoManual: null, editandoHora: false };
let niveisAnteriores = { kcal: 0, p: 0, c: 0, g: 0, f: 0, agua: 0 };

const pctN = (v, meta) => Math.max(0, Math.min(100, meta > 0 ? (v / meta) * 100 : 0));

export function renderizar(raiz, ctx) {
  const hoje = dataISO();
  if (!diaSel) diaSel = hoje;
  const ehHoje = diaSel === hoje;

  const redesenhar = () => ctx.redesenhar();
  const irPara = d => { diaSel = d; rascunho.data = null; redesenhar(); };

  // ---------- faixa: navegação de dia
  const seletorData = h('input', { type: 'date', class: 'so-leitor', 'aria-label': 'Escolher data', value: diaSel, max: hoje, tabindex: '-1', onchange: e => e.target.value && irPara(e.target.value) });
  ctx.faixa('Alimentação',
    h('div', { class: 'nav-dia' },
      h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Dia anterior', onclick: () => irPara(somarDias(diaSel, -1)) }, icone('esq')),
      h('button', { class: 'rotulo-dia', type: 'button', 'aria-label': `Dia: ${rotuloDia(diaSel, hoje)}. Escolher outra data`, onclick: () => { try { seletorData.showPicker(); } catch { seletorData.click(); } } }, rotuloDia(diaSel, hoje)),
      seletorData,
      h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Próximo dia', disabled: ehHoje, onclick: () => irPara(somarDias(diaSel, 1)) }, icone('dir'))));

  const refeicoes = refeicoesDoDia(diaSel);
  const tot = totaisDoDia(refeicoes);
  const m = metas();
  const agua = aguaDoDia(diaSel);

  // ---------- piso do dia (ladrilhos que se acendem)
  const restante = m.kcal - tot.kcal;
  const prev = niveisAnteriores;
  const piso = [];   // [elemento, quantos acender, total]
  const fileira = (id, total, valor, meta, pequeno) => {
    const n = Math.max(0, Math.min(total, Math.round(total * (meta > 0 ? valor / meta : 0))));
    const antes = Math.max(0, Math.min(total, Math.round(total * (meta > 0 ? (prev[id] ?? 0) / meta : 0))));
    const caixa = h('span', { class: `ladrilhos ${pequeno ? 'ladrilhos-p' : ''} ${valor > meta * 1.05 ? 'estourou' : ''}`, 'aria-hidden': 'true', style: { '--col': Math.min(total, 10) } });
    const lista = Array.from({ length: total }, (_, i) => { const t = h('i', { class: `ladr ${i < antes ? 'on' : ''}` }); caixa.appendChild(t); return t; });
    piso.push([lista, antes, n]);
    return caixa;
  };
  const cKcal = h('div', { class: `bloco bloco-kcal ${tot.kcal > m.kcal * 1.05 ? 'estourou' : ''}` },
    h('span', { class: 'leg' }, restante >= 0 ? 'kcal restantes' : 'kcal acima da meta'),
    h('span', { class: 'grande' }, n0(Math.abs(restante))),
    h('span', { class: 'sub' }, `${n0(tot.kcal)} de ${n0(m.kcal)} kcal`),
    fileira('kcal', 30, tot.kcal, m.kcal, false));
  const macro = (cls, nome, valor, meta, id) => h('div', { class: `bloco bloco-macro ${cls} ${valor > meta * 1.05 ? 'estourou' : ''}` },
    h('span', { class: 'nome' }, nome), h('span', { class: 'valor' }, n0(valor), h('small', null, ` / ${n0(meta)} g`)), fileira(id, 10, valor, meta, true));
  const cP = macro('macro-prot', 'Proteína', tot.p, m.prot, 'p'), cC = macro('macro-carb', 'Carboidrato', tot.c, m.carb, 'c'), cG = macro('macro-gord', 'Gordura', tot.g, m.gord, 'g');
  const bandeja = h('div', { class: 'piso o1', role: 'group', 'aria-label': `Resumo do dia: ${n0(tot.kcal)} de ${n0(m.kcal)} calorias, proteína ${n0(tot.p)} de ${n0(m.prot)} gramas, carboidrato ${n0(tot.c)} de ${n0(m.carb)}, gordura ${n0(tot.g)} de ${n0(m.gord)}` }, cKcal, cP, cC, cG);
  // acende em sequência só os ladrilhos novos (a animação é desligada por prefers-reduced-motion no CSS)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    piso.forEach(([lista, antes, n]) => lista.forEach((t, i) => { if (i >= antes && i < n) { t.style.transitionDelay = ((i - antes) * 28) + 'ms'; t.classList.add('on'); } }));
  }));
  niveisAnteriores = { kcal: tot.kcal, p: tot.p, c: tot.c, g: tot.g, f: tot.f, agua };

  const fibraMeta = m.fibra || 28, aguaMeta = m.agua || 2500;
  const miniF = h('div', { class: 'mini mini-fibra' }, h('div', { class: 'topo' }, h('span', null, 'Fibra'), h('span', null, `${n0(tot.f)} / ${n0(fibraMeta)} g`)), fileira('f', 10, tot.f, fibraMeta, true));
  const miniA = h('div', { class: 'mini mini-agua' }, h('div', { class: 'topo' }, h('span', null, 'Água'), h('span', null, `${n1(agua / 1000)} / ${n1(aguaMeta / 1000)} L`)), fileira('agua', 10, agua, aguaMeta, true));

  const blocoAgua = h('div', { class: 'flex-entre cartao o6', style: { padding: '8px 8px 8px 14px', flexWrap: 'wrap' } },
    h('div', { class: 'flex nowrap' }, icone('gota', 20), h('strong', null, 'Água'), h('span', { class: 'mudo nowrap' }, `${n0(agua)} ml`)),
    h('div', { class: 'flex', style: { gap: '4px', width: '100%' } },
      [-100, 100, 200, 500].map(v => h('button', { class: 'btn btn-peq', type: 'button', style: { flex: '1 1 0', minWidth: 0, paddingInline: '4px' }, 'aria-label': v < 0 ? 'Tirar 100 ml' : `Adicionar ${v} ml`, onclick: () => { setAgua(diaSel, agua + v); redesenhar(); } }, icone(v < 0 ? 'menos' : 'mais', 18), String(Math.abs(v))))));

  // ---------- treino do dia: botão, balanço e lista
  const abrirTreino = async (editar = null) => {
    const r = await abrirRegistroTreino({ data: diaSel, editar });
    if (r && r.detalhar) { const { abrirExecucao } = await import('./treino.js'); await abrirExecucao(r.detalhar.dow, r.detalhar.dia, redesenhar); return; }
    if (r && r.salvo) { if (r.data && r.data !== diaSel) diaSel = r.data; redesenhar(); }
  };
  const botaoTreino = h('button', { class: 'btn btn-escuro btn-treino-dia o2', type: 'button', onclick: () => abrirTreino() }, icone('halter', 22), 'Registrar treino do dia');
  const ativo = gastoAtivoDoDia(diaSel);
  const gastoBase = m.padrao ? 0 : (m.gastoBase || 0);
  const gastoTotal = gastoBase + ativo.total;
  const saldo = tot.kcal - gastoTotal;
  const cartaoBalanco = (tot.kcal > 0 || ativo.total > 0) ? h('div', { class: 'cartao o2', style: { padding: '12px 14px' } },
    h('div', { class: 'balanco' },
      h('div', null, h('div', { class: 'v' }, n0(tot.kcal)), h('div', { class: 'r' }, 'Comeu')),
      h('div', null, h('div', { class: 'v' }, n0(gastoTotal)), h('div', { class: 'r' }, 'Gasto estimado')),
      h('div', null, h('div', { class: 'v', style: { color: saldo > 0 ? 'var(--alerta)' : 'var(--ok)' } }, (saldo > 0 ? '+' : saldo < 0 ? '−' : '') + n0(Math.abs(saldo))), h('div', { class: 'r' }, 'Saldo'))),
    h('p', { class: 'mudo peq', style: { marginTop: '6px', textAlign: 'center' } }, gastoBase ? `Gasto = ${n0(gastoBase)} do dia a dia + ${n0(ativo.total)} de treino e atividades. Meta do dia: ${n0(m.kcal)} kcal. Estimativa.` : `Treino e atividades de hoje: ${n0(ativo.total)} kcal (estimativa).`)) : null;
  const treinosDia = treinosConcluidos().filter(x => x.data === diaSel);
  const atividadesDia = atividadesDoDia(diaSel);
  const listaAtiv = (treinosDia.length || atividadesDia.length) ? h('div', { class: 'o7' }, h('div', { class: 'cab-lista' }, h('h2', { class: 'titulo-sec' }, 'Treino e atividades'), h('span', { class: 'mudo peq' }, `${n0(ativo.total)} kcal`)),
    h('div', { class: 'comanda' }, [
      ...treinosDia.map(t => h('article', { class: 'refeicao' }, h('header', null, h('span', { class: 'tipo', style: { flex: 1 } }, `Musculação · ${t.titulo || 'Treino'}${t.parcial ? ' (parcial)' : ''}`), h('span', { class: 'total' }, `${n0(t.kcal)} kcal`)),
        h('div', { class: 'item-linha' }, h('span', { class: 'qt' }, `${n0(t.duracaoMin)} min · ${(t.exercicios || []).reduce((s, e) => s + e.series.filter(x => x.feito).length, 0)} séries`)),
        h('div', { class: 'acoes' }, h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': 'Remover treino', onclick: () => { store.remover('treinos', t.id); aviso('Treino removido.', { acao: 'Desfazer', aoAcao: () => { store.salvar('treinos', t); redesenhar(); } }); redesenhar(); } }, icone('lixo'))))),
      ...atividadesDia.map(a => { const d = descricaoAtividade(a); return h('article', { class: 'refeicao' }, h('header', null, h('span', { class: 'hora' }, a.ts.slice(11, 16)), h('span', { class: 'tipo' }, d.nome), h('span', { class: 'total' }, `${n0(a.kcal)} kcal`)),
        h('div', { class: 'item-linha' }, h('span', { class: 'qt' }, d.detalhe)), a.obs ? h('div', { class: 'mudo peq' }, a.obs) : null,
        h('div', { class: 'acoes' }, h('button', { class: 'btn-icone', type: 'button', 'aria-label': `Editar ${d.nome}`, onclick: () => abrirTreino(a) }, icone('lapis')),
          h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': `Excluir ${d.nome}`, onclick: () => { store.remover('atividades', a.id); aviso('Atividade removida.', { acao: 'Desfazer', aoAcao: () => { store.salvar('atividades', a); redesenhar(); } }); redesenhar(); } }, icone('lixo')))); })])) : null;

  // ---------- alertas
  const alertas = alertasAlimentares(tot, m.kcal).map(a => caixaAviso(a.nivel, a.titulo, a.texto));
  if (ehHoje) {
    const msg = avaliarIntervalo(intervalos(refeicoes, new Date(), true), 5.5, new Date());
    if (msg && refeicoes.length) alertas.push(caixaAviso('medio', 'Intervalo longo sem comer', msg));
  }
  if (!ehHoje) { const iv = avaliarIntervalo(intervalos(refeicoes, new Date(), false), 5.5, new Date()); if (iv) alertas.push(caixaAviso('medio', 'Intervalo longo entre refeições', iv)); }
  if (!onboardingFeito()) alertas.push(caixaAviso('info', 'Metas padrão', 'Complete seu perfil para calcular metas de calorias e macros personalizadas.', h('a', { class: 'btn btn-peq', href: '#/onboarding', style: { marginTop: '8px' } }, 'Completar perfil')));

  // ---------- entrada
  const dataEntrada = () => rascunho.data || diaSel;
  const horaEntrada = () => rascunho.hora || horaHM();
  const ta = h('textarea', { id: 'texto-refeicao', rows: 2, placeholder: 'Ex.: 2 ovos mexidos, 150 g de arroz, 1 banana, café com leite', 'aria-describedby': 'aj-texto', value: rascunho.texto, oninput: e => { rascunho.texto = e.target.value; } });
  const arquivo = h('input', { type: 'file', accept: 'image/*', class: 'so-leitor', tabindex: '-1', onchange: e => { const f = e.target.files[0]; if (f) { rascunho.foto = f; if (rascunho.fotoURL) URL.revokeObjectURL(rascunho.fotoURL); rascunho.fotoURL = URL.createObjectURL(f); desenharMini(); } } });
  const mini = h('div');
  function desenharMini() {
    limpar(mini);
    if (rascunho.foto) mini.appendChild(h('div', { class: 'flex' }, h('div', { class: 'foto-mini' }, h('img', { src: rascunho.fotoURL, alt: 'Foto anexada à refeição' })),
      h('button', { class: 'btn btn-fantasma btn-peq', type: 'button', onclick: () => { rascunho.foto = null; rascunho.fotoURL = null; arquivo.value = ''; desenharMini(); } }, 'Remover foto'),
      h('span', { class: 'ajuda' }, 'A foto fica guardada com a refeição, mas não é analisada.')));
  }
  desenharMini();
  const quando = h('div', { class: 'quando' });
  function desenharQuando() {
    limpar(quando);
    quando.appendChild(icone('relogio', 18));
    if (!rascunho.editandoHora) {
      quando.append(h('span', null, `${rotuloDia(dataEntrada(), hoje)}, ${horaEntrada()}`), h('button', { class: 'btn btn-fantasma btn-peq', type: 'button', onclick: () => { rascunho.editandoHora = true; rascunho.data = dataEntrada(); rascunho.hora = horaEntrada(); desenharQuando(); } }, 'Alterar'));
    } else {
      quando.append(
        h('input', { type: 'date', 'aria-label': 'Data da refeição', value: dataEntrada(), max: hoje, style: { width: 'auto' }, onchange: e => { rascunho.data = e.target.value; } }),
        h('input', { type: 'time', 'aria-label': 'Horário da refeição', value: horaEntrada(), style: { width: 'auto' }, onchange: e => { rascunho.hora = e.target.value; rascunho.tipoManual = null; } }));
    }
  }
  desenharQuando();

  async function estimar() {
    const texto = ta.value.trim();
    if (!texto) {
      aviso(rascunho.foto ? 'A foto não é analisada nesta versão. Escreva o que comeu para estimar as calorias.' : 'Escreva o que você comeu primeiro.');
      ta.focus(); return;
    }
    const res = await estimarRefeicao(texto, rascunho.foto);
    if (!res.itens.length) { aviso('Não entendi nada nesse texto. Tente algo como "150 g de arroz, 1 banana".'); return; }
    const hr = horaEntrada();
    const ts = tsLocal(dataEntrada(), hr);
    const r = await abrirConfirmacao({ itens: res.itens, ts, tipo: rascunho.tipoManual || tipoRefeicaoPorHora(+hr.slice(0, 2) + +hr.slice(3) / 60), texto, foto: rascunho.foto, aviso: res.aviso });
    if (r) {
      rascunho = { texto: '', foto: null, fotoURL: null, data: null, hora: null, tipoManual: null, editandoHora: false };
      if (r.data !== diaSel) diaSel = r.data;
      aviso(`Refeição salva: ${n0(r.kcal)} kcal (estimativa).`, { acao: 'Desfazer', aoAcao: () => { store.remover('refeicoes', r.id); redesenhar(); } });
      redesenhar();
    }
  }

  const caixaEntrada = h('div', { class: 'cartao entrada o4' },
    h('label', { for: 'texto-refeicao', class: 'titulo-sec', style: { display: 'block', marginBottom: '8px' } }, 'O que você comeu?'),
    ta, h('p', { class: 'ajuda', id: 'aj-texto' }, 'Escreva em português, com as quantidades. Pode misturar gramas, unidades e medidas caseiras.'),
    mini, quando,
    h('div', { class: 'acoes' },
      h('button', { class: 'btn', type: 'button', onclick: () => arquivo.click() }, icone('camera', 20), rascunho.foto ? 'Trocar foto' : 'Foto'),
      arquivo,
      h('button', { class: 'btn btn-primario', type: 'button', onclick: estimar }, icone('busca', 20), 'Estimar calorias')),
    h('div', { style: { marginTop: '8px' } }, h('span', { class: 'estimativa' }, 'Valores estimados pelo banco local')));
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) estimar(); });

  // ---------- favoritos / repetir
  const favoritos = store.listar('favoritos').sort((a, b) => (b._u || 0) - (a._u || 0));
  const todas = store.listar('refeicoes').sort((a, b) => b.ts.localeCompare(a.ts));
  const recentes = []; const vistos = new Set(favoritos.map(f => f.nome));
  for (const r of todas) { const k = resumoItens(r.itens).slice(0, 60); if (!vistos.has(k) && r.itens.length) { vistos.add(k); recentes.push({ id: 'r' + r.id, nome: k, itens: r.itens, tipo: r.tipo, recente: true }); } if (recentes.length >= 4) break; }
  function repetir(f) {
    const hr = ehHoje ? horaHM() : horaHM();
    const r = store.salvar('refeicoes', { ts: tsLocal(diaSel, hr), tipo: tipoRefeicaoPorHora(+hr.slice(0, 2) + +hr.slice(3) / 60), texto: f.nome, itens: f.itens.map(i => ({ ...i })), repetida: true });
    const k = f.itens.reduce((s, i) => s + (i.kcal || 0), 0);
    aviso(`Adicionado: ${n0(k)} kcal.`, { acao: 'Desfazer', aoAcao: () => { store.remover('refeicoes', r.id); redesenhar(); } });
    redesenhar();
  }
  const barraFavs = (favoritos.length || recentes.length) ? h('div', { class: 'pilha o5', style: { gap: '6px' } },
    h('h2', { class: 'titulo-sec', style: { fontSize: '18px' } }, 'Repetir com 1 toque'),
    h('div', { class: 'favs', role: 'list' }, [...favoritos.map(f => ({ ...f, fav: true })), ...recentes].map(f => h('button', { class: 'chip', type: 'button', role: 'listitem', title: resumoItens(f.itens), onclick: () => repetir(f) }, f.fav ? iconeCheio('estrela', 16) : icone('repetir', 16), f.nome.length > 34 ? f.nome.slice(0, 33) + '…' : f.nome)))) : null;

  // ---------- comanda
  const kcalDe = r => r.itens.reduce((s, i) => s + (i.kcal || 0), 0);
  const cartaoRef = r => {
    const fotoBox = h('div');
    if (r.fotoId) urlFoto(r.fotoId).then(u => { if (u) fotoBox.appendChild(h('div', { class: 'foto-mini' }, h('img', { src: u, alt: 'Foto da refeição' }))); });
    const ehFav = favoritos.some(f => f.origemId === r.id);
    return h('article', { class: 'refeicao', 'aria-label': `${r.tipo} às ${horaDoTs(r.ts)}` },
      h('header', null, h('span', { class: 'hora' }, horaDoTs(r.ts)), h('span', { class: 'tipo' }, r.tipo), h('span', { class: 'total' }, `${n0(kcalDe(r))} kcal`)),
      r.itens.map(i => h('div', { class: 'item-linha' }, h('span', { class: 'nm' }, i.nome), h('span', { class: 'qt' }, `${n0(i.gramas)} ${i.liquido ? 'ml' : 'g'}`), h('span', { class: 'pt', 'aria-hidden': 'true' }), h('span', { class: 'kc' }, n0(i.kcal)))),
      fotoBox,
      h('div', { class: 'acoes' },
        h('button', { class: `btn-icone ${ehFav ? 'ativo' : ''}`, type: 'button', 'aria-pressed': String(ehFav), 'aria-label': ehFav ? 'Remover dos favoritos' : 'Favoritar refeição', onclick: () => { alternarFavorito(r, favoritos); redesenhar(); } }, ehFav ? iconeCheio('estrela') : icone('estrela')),
        h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Repetir agora', onclick: () => repetir({ nome: resumoItens(r.itens), itens: r.itens }) }, icone('repetir')),
        h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Editar refeição', onclick: async () => { const x = await abrirConfirmacao({ itens: r.itens.map(i => ({ ...i, trecho: i.nome, confianca: 'alta' })), ts: r.ts, tipo: r.tipo, texto: r.texto, id: r.id, fotoId: r.fotoId, edicao: true }); if (x) redesenhar(); } }, icone('lapis')),
        h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': 'Excluir refeição', onclick: () => { store.remover('refeicoes', r.id); aviso('Refeição excluída.', { acao: 'Desfazer', aoAcao: () => { store.salvar('refeicoes', r); redesenhar(); } }); redesenhar(); } }, icone('lixo'))));
  };
  const comanda = refeicoes.length
    ? h('div', { class: 'comanda' }, refeicoes.map(cartaoRef))
    : h('div', { class: 'vazio' }, h('h3', null, ehHoje ? 'Nada registrado hoje' : 'Nada registrado neste dia'), h('ul', null, h('li', null, 'Escreva acima o que comeu e toque em "Estimar calorias".'), h('li', null, 'Confira a tradução em kcal e macros antes de salvar.')));

  raiz.append(h('div', { class: 'layout-2' },
    h('section', { class: 'pilha', 'aria-label': 'Resumo do dia' }, bandeja, h('div', { class: 'sub-bandeja o2' }, miniF, miniA), botaoTreino, cartaoBalanco, alertas.length ? h('div', { class: 'pilha o3' }, alertas) : null, blocoAgua),
    h('section', { class: 'pilha' }, caixaEntrada, barraFavs,
      h('div', { class: 'o7' }, h('div', { class: 'cab-lista' }, h('h2', { class: 'titulo-sec' }, ehHoje ? 'Refeições de hoje' : `Refeições · ${rotuloDia(diaSel, hoje)}`), h('span', { class: 'mudo peq' }, `${refeicoes.length} ${refeicoes.length === 1 ? 'registro' : 'registros'}`)), comanda), listaAtiv)));
}

function alternarFavorito(r, favoritos) {
  const f = favoritos.find(x => x.origemId === r.id);
  if (f) { store.remover('favoritos', f.id); aviso('Removido dos favoritos.'); }
  else { store.salvar('favoritos', { nome: resumoItens(r.itens).slice(0, 60), tipo: r.tipo, itens: r.itens.map(i => ({ ...i })), origemId: r.id }); aviso('Favoritado. Aparece em "Repetir com 1 toque".'); }
}

// =============================================================================
// Folha de confirmação: a pessoa corrige item/quantidade antes de salvar
// =============================================================================
export async function abrirConfirmacao({ itens, ts, tipo, texto, foto = null, fotoId = null, id = null, edicao = false, aviso: avisoTxt = '' }) {
  // trabalha com {alimentoId, gramas}
  let linhas = itens.map(i => { const a0 = i.alimentoId ? alimentoPorId(i.alimentoId) : null; const un = a0 && i.unidade && !i.quantidadePadrao ? (a0.porcoes.find(p => p.nome === i.unidade) || {}).nome : (a0 && i.quantidadePadrao && a0.porcoes[0] ? a0.porcoes[0].nome : null); return { alimentoId: i.alimentoId || null, nome: i.nome || i.trecho || '', gramas: i.gramas ?? 0, confianca: i.confianca || 'alta', trecho: i.trecho || '', candidatos: i.candidatos || [], unidadeSel: un || null }; });
  let data = diaDoTs(ts), hora = horaDoTs(ts), tipoSel = tipo, favoritar = false;
  return folha(edicao ? 'Editar refeição' : 'Confira antes de salvar', fechar => {
    const lista = h('div'); const totais = h('div', { class: 'totais-conf', 'aria-live': 'polite' });
    const unidadesDe = a => {
      const base = a ? (a.liquido ? 'ml' : 'g') : 'g';
      return [[base, base, 1], ...(a ? a.porcoes.map(p => [p.nome, p.nome, p.g]) : [])];
    };
    function recalc() {
      const t = linhas.reduce((s, l) => { const a = l.alimentoId ? alimentoPorId(l.alimentoId) : null; if (!a) return s; const n = nutrientesPara(a, l.gramas); return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, g: s.g + n.g, f: s.f + n.f }; }, { kcal: 0, p: 0, c: 0, g: 0, f: 0 });
      limpar(totais).append(h('span', null, h('b', null, n0(t.kcal)), ' kcal'), h('span', null, h('b', null, n0(t.p)), ' g prot.'), h('span', null, h('b', null, n0(t.c)), ' g carbo'), h('span', null, h('b', null, n0(t.g)), ' g gord.'), h('span', null, h('b', null, n0(t.f)), ' g fibra'));
      return t;
    }
    function desenhar() {
      limpar(lista);
      linhas.forEach((l, idx) => {
        const a = l.alimentoId ? alimentoPorId(l.alimentoId) : null;
        const unids = unidadesDe(a);
        const sel = l.unidadeSel && unids.find(u => u[0] === l.unidadeSel) ? l.unidadeSel : unids[0][0];
        const fator = unids.find(u => u[0] === sel)[2];
        const qtd = entradaNum(Math.round((l.gramas / fator) * 10) / 10, { 'aria-label': `Quantidade de ${l.nome}`, onchange: e => { const v = lerNumero(e.target.value); if (v != null && v >= 0) { l.gramas = v * fator; desenhar(); } } });
        const un = selecao(unids.map(u => [u[0], u[1] + (u[2] !== 1 ? ` (${u[2]} g)` : '')]), sel, { 'aria-label': 'Unidade', onchange: e => { l.unidadeSel = e.target.value; l.gramas = (lerNumero(qtd.value) ?? 1) * unids.find(u => u[0] === e.target.value)[2]; desenhar(); } });
        const n = a ? nutrientesPara(a, l.gramas) : null;
        lista.appendChild(h('div', { class: 'linha-item' },
          h('div', null,
            h('button', { class: 'nome-btn', type: 'button', 'aria-label': `Trocar alimento: ${l.nome}`, onclick: () => trocarAlimento(idx) }, a ? a.nome : (l.nome ? `“${l.nome}”: escolha um alimento` : 'Escolher alimento')),
            !a ? h('div', { class: 'confianca-baixa' }, 'Não encontrei esse alimento no banco. Toque no nome para buscar, procurar o produto ou criar o seu.') : (l.confianca === 'baixa' ? h('div', { class: 'confianca-baixa' }, 'Correspondência incerta: confira o alimento.') : null),
            n ? h('div', { class: 'mudo peq' }, `${n0(n.kcal)} kcal · P ${n1(n.p)} · C ${n1(n.c)} · G ${n1(n.g)} · F ${n1(n.f)}`) : null),
          h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': `Remover ${l.nome}`, onclick: () => { linhas.splice(idx, 1); desenhar(); } }, icone('lixo')),
          h('div', { class: 'qtd' }, campo('Quantidade', qtd), campo('Unidade', un))));
      });
      recalc();
    }
    async function trocarAlimento(idx) {
      const l0 = linhas[idx];
      const escolhido = await escolherAlimento({ titulo: 'Buscar alimento', consulta: l0.nome && !l0.alimentoId ? l0.nome : '', candidatos: l0.candidatos || [] });
      if (escolhido) {
        const l = linhas[idx]; const velho = l.alimentoId ? alimentoPorId(l.alimentoId) : null;
        l.alimentoId = escolhido.id; l.nome = escolhido.nome; l.unidadeSel = null; l.confianca = 'alta';
        if (!velho || !l.gramas) l.gramas = porcaoPadrao(escolhido);
        desenhar();
      }
    }
    async function adicionar() {
      const escolhido = await escolherAlimento({ titulo: 'Adicionar alimento' });
      if (escolhido) { linhas.push({ alimentoId: escolhido.id, nome: escolhido.nome, gramas: porcaoPadrao(escolhido), confianca: 'alta', candidatos: [], unidadeSel: null }); desenhar(); }
    }
    desenhar();
    const selTipo = selecao(TIPOS_REFEICAO, tipoSel, { onchange: e => { tipoSel = e.target.value; } });
    const inpData = h('input', { type: 'date', value: data, max: dataISO(), onchange: e => { data = e.target.value; } });
    const inpHora = h('input', { type: 'time', value: hora, onchange: e => { hora = e.target.value; } });
    const chkFav = h('input', { type: 'checkbox', id: 'chk-fav', onchange: e => { favoritar = e.target.checked; } });
    const salvar = async () => {
      const validas = linhas.filter(l => l.alimentoId && l.gramas > 0);
      if (!validas.length) { aviso('Adicione pelo menos um alimento com quantidade.'); return; }
      const semId = linhas.filter(l => !l.alimentoId).length;
      if (semId && !(await confirmar('Itens sem alimento', `${semId} item(ns) sem correspondência ficarão de fora do cálculo. Salvar mesmo assim?`, { sim: 'Salvar assim mesmo' }))) return;
      let fid = fotoId;
      if (foto) { try { fid = await salvarFoto(foto, { tipo: 'refeicao' }); } catch (e) { console.warn(e); aviso('Não consegui guardar a foto, mas a refeição foi salva.'); } }
      const itensFinal = validas.map(l => montarItemRefeicao({ alimentoId: l.alimentoId, gramas: l.gramas }));
      const r = store.salvar('refeicoes', { ...(id ? { id } : {}), ts: tsLocal(data, hora), tipo: tipoSel, texto: texto || '', itens: itensFinal, ...(fid ? { fotoId: fid } : {}) });
      if (favoritar) store.salvar('favoritos', { nome: resumoItens(itensFinal).slice(0, 60), tipo: tipoSel, itens: itensFinal.map(i => ({ ...i })), origemId: r.id });
      fechar({ id: r.id, kcal: itensFinal.reduce((s, i) => s + i.kcal, 0), data });
    };
    return h('div', { class: 'pilha' },
      avisoTxt ? caixaAviso('info', null, avisoTxt) : null,
      h('p', { class: 'mudo' }, 'Corrija o alimento (toque no nome) e a quantidade. ', h('span', { class: 'estimativa' }, 'Valores estimados')),
      lista, h('button', { class: 'btn', type: 'button', onclick: adicionar }, icone('mais', 18), 'Adicionar item'), totais,
      h('div', { class: 'grade-2' }, campo('Tipo', selTipo), campo('Data', inpData)), campo('Horário', inpHora),
      edicao ? null : h('label', { class: 'opcao', for: 'chk-fav' }, chkFav, h('span', null, h('strong', null, 'Salvar como favorita'), h('span', { class: 'd' }, 'Para repetir com 1 toque depois.'))),
      h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => fechar(undefined) }, 'Cancelar'), h('button', { class: 'btn btn-primario', type: 'button', onclick: salvar }, icone('ok', 18), 'Salvar refeição')));
  }, { larga: true });
}
