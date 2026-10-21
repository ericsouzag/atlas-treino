// Escolha de alimento: busca local (embutido + TACO + os meus), busca opcional no Open Food Facts,
// leitura de código de barras e "Criar meu alimento". Usada na tela de confirmação da refeição e em Ajustes.
import { h, limpar, icone, campo, entradaNum, lerNumero, aviso, folha, confirmar, caixaAviso, debounce } from '../ui.js';
import { buscarAlimentos, alimentoPorId } from '../foods.js';
import { montarDocAlimento, validarNutrientes, salvarAlimentoPersonalizado, removerAlimentoPersonalizado, listarMeusAlimentos, listarProdutosSalvos } from '../banco.js';
import { buscarPorCodigo, buscarPorTexto, codigoValido, mensagemErro, leitorDisponivel, lerCodigoPelaCamera, AVISO_OFF } from '../off.js';

const n0 = x => (x == null || isNaN(x) ? '–' : Math.round(x).toLocaleString('pt-BR'));
const rotuloOrigem = a => (a.origem === 'meu' ? 'meu alimento' : a.origem === 'off' ? 'produto' : a.origem === 'usda' ? 'USDA' : '');
const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

// ---------------------------------------------------------------------------------------------
// Formulário comum (alimento próprio ou produto do Open Food Facts)

function formularioAlimento({ doc = null, inicial = {}, modo = 'meu', aoSalvar, aoCancelar }) {
  const d = doc || {};
  const nome = h('input', { type: 'text', value: d.nome ?? inicial.nome ?? '', maxlength: 80, autocomplete: 'off', placeholder: 'Ex.: Pão da padaria do bairro' });
  const marca = h('input', { type: 'text', value: d.marca ?? inicial.marca ?? '', maxlength: 60, autocomplete: 'off', placeholder: 'Opcional' });
  const apelidos = h('input', { type: 'text', value: (d.apelidos || []).join(', '), autocomplete: 'off', placeholder: 'Ex.: pãozinho, pão do seu zé' });
  const ehOff = modo === 'off';
  let base = '100';
  const valores = (src) => ({ kcal: src.kcal, p: src.p, c: src.c, g: src.g, f: src.f, acucar: src.acucar });
  const v0 = valores({ ...inicial, ...d });
  const kcal = entradaNum(v0.kcal, { 'aria-label': 'Calorias' });
  const p = entradaNum(v0.p, { 'aria-label': 'Proteína' });
  const c = entradaNum(v0.c, { 'aria-label': 'Carboidrato' });
  const g = entradaNum(v0.g, { 'aria-label': 'Gordura' });
  const f = entradaNum(v0.f, { 'aria-label': 'Fibra' });
  const acucar = entradaNum(v0.acucar, { 'aria-label': 'Açúcar' });
  const porc0 = (d.porcoes && d.porcoes[0]) || (inicial.porcaoG ? { nome: 'porção do rótulo', g: inicial.porcaoG } : null);
  const porcNome = h('input', { type: 'text', value: porc0 ? porc0.nome : 'porção', maxlength: 30, autocomplete: 'off' });
  const porcG = entradaNum(porc0 ? porc0.g : '', { 'aria-label': 'Tamanho da porção' });
  const liquido = h('input', { type: 'checkbox', id: 'f-liq', checked: !!(d.liquido ?? inicial.liquido) });
  const unidade = () => (liquido.checked ? 'ml' : 'g');
  const errosBox = h('div', { 'aria-live': 'polite' });
  const rotBase = h('span', { class: 'mudo' });
  const radios = ['100', 'porcao'].map(v => h('input', { type: 'radio', name: 'f-base', value: v, checked: v === '100', onchange: () => { base = v; atualizar(); } }));
  function atualizar() {
    const u = unidade();
    rotBase.textContent = base === '100' ? `Valores para 100 ${u}.` : `Valores para uma porção. Informe abaixo o tamanho da porção em ${u}.`;
  }
  liquido.addEventListener('change', atualizar);

  const grade = h('div', { class: 'grade-2' }, campo('Calorias (kcal)', kcal), campo('Proteína (g)', p), campo('Carboidrato (g)', c), campo('Gordura (g)', g), campo('Fibra (g, opcional)', f), campo('Açúcar (g, opcional)', acucar));
  const porcBloco = h('div', { class: 'grade-2' }, campo('Nome da porção', porcNome, 'Ex.: fatia, unidade, pote.'), campo('Tamanho da porção (g ou ml)', porcG, 'Obrigatório se os valores forem por porção. Se for por 100 g, é opcional e facilita registrar "1 fatia".'));

  function ler() {
    return montarDocAlimento({
      tipo: ehOff ? 'off' : 'meu', id: d.id, codigo: d.codigo ?? inicial.codigo, marca: marca.value, nome: nome.value, base,
      porcaoG: lerNumero(porcG.value), porcaoNome: porcNome.value, kcal: lerNumero(kcal.value), p: lerNumero(p.value), c: lerNumero(c.value), g: lerNumero(g.value),
      f: lerNumero(f.value), acucar: lerNumero(acucar.value), liquido: liquido.checked,
      apelidos: apelidos.value.split(',').map(x => x.trim()).filter(Boolean),
    });
  }
  async function salvar() {
    limpar(errosBox);
    let doc2;
    try {
      if (!nome.value.trim()) throw new Error('Dê um nome ao alimento.');
      doc2 = ler();
    } catch (e) { errosBox.append(caixaAviso('alto', null, e.message)); return; }
    const { erros, avisos } = validarNutrientes(doc2);
    if (erros.length) { errosBox.append(caixaAviso('alto', 'Confira os números', erros.join(' '))); return; }
    if (avisos.length && !(await confirmar('Os números parecem estranhos', avisos.join(' '), { sim: 'Salvar mesmo assim', nao: 'Voltar e corrigir' }))) return;
    aoSalvar(salvarAlimentoPersonalizado(doc2));
  }
  atualizar();
  return h('div', { class: 'pilha' },
    ehOff ? caixaAviso('medio', AVISO_OFF, 'Confira o rótulo do produto e corrija o que estiver errado antes de usar. Os valores abaixo são por 100 g (ou 100 ml).') : null,
    inicial.avisos && inicial.avisos.length ? caixaAviso('medio', null, inicial.avisos.join(' ')) : null,
    campo('Nome', nome), campo('Marca', marca), ehOff ? null : campo('Outros nomes (separados por vírgula)', apelidos, 'O texto livre da refeição passa a reconhecer esses nomes.'),
    ehOff ? null : h('fieldset', { class: 'pilha', style: { border: 'none', padding: 0, margin: 0 } },
      h('legend', { class: 'rotulo-grupo' }, 'Os valores nutricionais são'),
      h('label', { class: 'opcao' }, radios[0], h('span', null, h('strong', null, 'Por 100 g (ou 100 ml)'), h('span', { class: 'd' }, 'Como na tabela nutricional do rótulo.'))),
      h('label', { class: 'opcao' }, radios[1], h('span', null, h('strong', null, 'Por porção'), h('span', { class: 'd' }, 'O app converte para 100 g usando o tamanho da porção.')))),
    h('label', { class: 'opcao', for: 'f-liq' }, liquido, h('span', null, h('strong', null, 'É uma bebida (medida em ml)'))),
    rotBase, grade, porcBloco, errosBox,
    h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: aoCancelar }, 'Cancelar'), h('button', { class: 'btn btn-primario', type: 'button', onclick: salvar }, icone('ok', 18), ehOff ? 'Usar este produto' : 'Salvar alimento')));
}

/** "Criar meu alimento" (ou editar um existente). Retorna o alimento salvo ou undefined. */
export function abrirCriarAlimento({ doc = null, nomeInicial = '' } = {}) {
  return folha(doc ? 'Editar meu alimento' : 'Criar meu alimento', fechar =>
    formularioAlimento({ doc, inicial: { nome: nomeInicial }, modo: 'meu', aoSalvar: a => { aviso(doc ? 'Alimento atualizado.' : 'Alimento criado. O texto livre já reconhece esse nome.'); fechar(a); }, aoCancelar: () => fechar(undefined) }), { larga: true });
}

/** Confirma/edita um produto do Open Food Facts antes de usar. Retorna o alimento salvo (cache local) ou undefined. */
export function confirmarProduto(prod) {
  return folha('Conferir produto', fechar =>
    formularioAlimento({ inicial: prod, modo: 'off', aoSalvar: a => { aviso('Produto guardado neste aparelho.'); fechar(a); }, aoCancelar: () => fechar(undefined) }), { larga: true });
}

// ---------------------------------------------------------------------------------------------
// Leitura por câmera

function abrirLeitor() {
  return folha('Ler código de barras', fechar => {
    const video = h('video', { class: 'leitor-video', muted: true, playsinline: true, 'aria-label': 'Imagem da câmera' });
    const msg = h('p', { class: 'mudo' }, 'Aponte a câmera para o código de barras do produto.');
    const leitor = lerCodigoPelaCamera(video);
    leitor.promessa.then(cod => { if (cod) fechar(cod); }).catch(e => {
      limpar(msg).append(caixaAviso('medio', null, e && e.name === 'NotAllowedError' ? 'Sem permissão para usar a câmera. Digite o código manualmente.' : 'Não consegui abrir a câmera. Digite o código manualmente.'));
    });
    const dlgFecha = () => leitor.parar();
    setTimeout(() => { const dlg = video.closest('dialog'); if (dlg) dlg.addEventListener('close', dlgFecha); }, 0);
    return h('div', { class: 'pilha' }, video, msg, h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => { leitor.parar(); fechar(undefined); } }, 'Cancelar')));
  });
}

// ---------------------------------------------------------------------------------------------
// Busca de alimento (folha principal)

/**
 * Abre a folha de busca. Retorna o alimento escolhido (objeto do banco) ou undefined.
 * @param {{titulo?:string, consulta?:string, candidatos?:string[]}} opc
 */
export function escolherAlimento({ titulo = 'Buscar alimento', consulta = '', candidatos = [] } = {}) {
  return folha(titulo, fechar => {
    const resultados = h('div', { class: 'resultados-busca' });
    const caixaProdutos = h('div', { class: 'pilha' });
    const entrada = h('input', { type: 'search', placeholder: 'Ex.: arroz, frango, banana, ou o código de barras', 'aria-label': 'Buscar alimento', value: consulta, autocomplete: 'off' });
    let seq = 0;

    function mostrarLocal() {
      limpar(resultados);
      const q = entrada.value.trim();
      const lista = q ? buscarAlimentos(q, 12) : candidatos.map(alimentoPorId).filter(Boolean);
      if (!lista.length) resultados.appendChild(h('p', { class: 'ajuda' }, q ? 'Nada encontrado no banco de alimentos.' : 'Digite para buscar no banco de alimentos.'));
      lista.forEach(a => resultados.appendChild(h('button', { type: 'button', onclick: () => fechar(a) },
        h('strong', null, a.nome), rotuloOrigem(a) ? h('span', { class: 'etiqueta' }, rotuloOrigem(a)) : null,
        h('div', { class: 'mudo peq' }, `${n0(a.kcal)} kcal por 100 ${a.liquido ? 'ml' : 'g'}`))));
      return lista.length;
    }

    function mostrarProdutos(lista, extra) {
      limpar(caixaProdutos);
      caixaProdutos.append(h('p', { class: 'mudo peq' }, AVISO_OFF, ' Fonte: Open Food Facts (ODbL).'));
      if (extra) caixaProdutos.append(extra);
      const caixa = h('div', { class: 'resultados-busca' });
      lista.forEach(pr => caixa.appendChild(h('button', { type: 'button', onclick: async () => { const a = await confirmarProduto(pr); if (a) fechar(a); } },
        h('strong', null, pr.nome), pr.marca ? h('span', { class: 'etiqueta' }, pr.marca) : null,
        h('div', { class: 'mudo peq' }, `${pr.kcal != null ? n0(pr.kcal) : '?'} kcal por 100 ${pr.liquido ? 'ml' : 'g'}${pr.quantidade ? ' · ' + pr.quantidade : ''}`))));
      caixaProdutos.append(caixa);
    }

    async function buscarProduto() {
      const q = entrada.value.trim();
      const meu = ++seq;
      if (!q) { limpar(caixaProdutos).append(h('p', { class: 'ajuda' }, 'Digite o nome do produto ou o código de barras.')); return; }
      if (!online()) { limpar(caixaProdutos).append(caixaAviso('medio', null, mensagemErro(new Error('offline')))); return; }
      limpar(caixaProdutos).append(h('p', { class: 'mudo', role: 'status' }, 'Buscando no Open Food Facts…'));
      try {
        const cod = codigoValido(q);
        if (cod && /^[\d\s.-]+$/.test(q)) {
          const prod = await buscarPorCodigo(cod);
          if (meu !== seq) return;
          if (!prod) { limpar(caixaProdutos).append(caixaAviso('info', null, `O código ${cod} não está cadastrado no Open Food Facts. Você pode criar o alimento manualmente.`)); return; }
          mostrarProdutos([prod]);
        } else {
          const lista = await buscarPorTexto(q);
          if (meu !== seq) return;
          if (!lista.length) { limpar(caixaProdutos).append(caixaAviso('info', null, 'Nenhum produto encontrado. Tente outro nome, o código de barras, ou crie o alimento manualmente.')); return; }
          mostrarProdutos(lista);
        }
      } catch (e) {
        if (meu !== seq) return;
        limpar(caixaProdutos).append(caixaAviso('medio', null, mensagemErro(e)),
          h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: buscarProduto }, 'Tentar de novo')));
      }
    }

    // sem resultado local: oferece (e, se houver internet, já tenta) a busca de produtos
    const autoProduto = debounce(() => {
      const q = entrada.value.trim();
      if (q.length >= 3 && !buscarAlimentos(q, 1).length && online() && !caixaProdutos.childElementCount) buscarProduto();
    }, 900);
    entrada.addEventListener('input', debounce(() => { mostrarLocal(); autoProduto(); }, 120));
    entrada.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const q = entrada.value.trim(); if (codigoValido(q) && /^[\d\s.-]+$/.test(q)) buscarProduto(); } });
    mostrarLocal();
    const vazioLocal = !resultados.querySelector('button');
    if (consulta && vazioLocal) autoProduto();
    setTimeout(() => entrada.focus(), 50);

    const botaoLer = leitorDisponivel() ? h('button', { class: 'btn', type: 'button', onclick: async () => { const cod = await abrirLeitor(); if (cod) { entrada.value = cod; mostrarLocal(); buscarProduto(); } } }, icone('camera', 18), 'Ler código de barras') : null;
    return h('div', { class: 'pilha' }, entrada, resultados,
      h('div', { class: 'pilha' },
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn', type: 'button', onclick: buscarProduto }, icone('busca', 18), 'Buscar produto'),
          botaoLer,
          h('button', { class: 'btn', type: 'button', onclick: async () => { const a = await abrirCriarAlimento({ nomeInicial: entrada.value.trim() }); if (a) fechar(a); } }, icone('mais', 18), 'Criar meu alimento')),
        h('p', { class: 'ajuda' }, 'Buscar produto consulta o Open Food Facts pela internet (só quando você toca). Aceita o nome ou o código de barras.')),
      caixaProdutos);
  }, { larga: true });
}

// ---------------------------------------------------------------------------------------------
// Ajustes: gerenciar meus alimentos e produtos guardados

export function cartaoMeusAlimentos(redesenhar) {
  const meus = listarMeusAlimentos(), produtos = listarProdutosSalvos();
  const linha = (d, editar) => h('li', { style: { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' } },
    h('span', null, h('strong', null, d.nome), d.marca ? ` · ${d.marca}` : '', h('span', { class: 'mudo peq' }, ` · ${n0(d.kcal)} kcal/100 ${d.liquido ? 'ml' : 'g'}`)),
    h('span', { style: { display: 'flex', gap: '4px' } },
      h('button', { class: 'btn-icone', type: 'button', 'aria-label': `Editar ${d.nome}`, onclick: async () => { const a = editar ? await (d.tipo === 'off' ? folha('Editar produto', fechar => formularioAlimento({ doc: d, modo: 'off', aoSalvar: x => fechar(x), aoCancelar: () => fechar(undefined) }), { larga: true }) : abrirCriarAlimento({ doc: d })) : null; if (a) redesenhar(); } }, icone('lapis')),
      h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': `Excluir ${d.nome}`, onclick: async () => {
        if (await confirmar('Excluir alimento?', `"${d.nome}" deixa de ser reconhecido no texto livre. Refeições já salvas não mudam.`, { sim: 'Excluir', perigo: true })) { removerAlimentoPersonalizado(d.id); aviso('Alimento excluído.'); redesenhar(); }
      } }, icone('lixo'))));
  return h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Meus alimentos'),
    h('p', { class: 'mudo' }, 'Alimentos que você criou e produtos que escolheu no Open Food Facts. Entram no backup e na sincronização.'),
    meus.length ? h('ul', { class: 'lista-simples' }, meus.map(d => linha(d, true))) : h('p', { class: 'ajuda' }, 'Você ainda não criou nenhum alimento.'),
    produtos.length ? h('div', null, h('h3', { style: { fontSize: '1rem' } }, 'Produtos guardados'), h('ul', { class: 'lista-simples' }, produtos.map(d => linha(d, true)))) : null,
    h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: async () => { const a = await abrirCriarAlimento(); if (a) redesenhar(); } }, icone('mais', 18), 'Criar meu alimento')));
}
