// Escolha de alimento: busca local (embutido + TACO + os meus), busca opcional no Open Food Facts,
// leitura de código de barras e "Criar meu alimento". Usada na tela de confirmação da refeição e em Ajustes.
import { h, limpar, icone, campo, entradaNum, lerNumero, aviso, folha, confirmar, caixaAviso, debounce, selecao } from '../ui.js';
import { buscarAlimentos, alimentoPorId } from '../foods.js';
import { montarDocAlimento, validarNutrientes, salvarAlimentoPersonalizado, removerAlimentoPersonalizado, listarMeusAlimentos, listarProdutosSalvos } from '../banco.js';
import { abrirLerTabela } from './ler-tabela.js';
import { ROTULO_CAMPO } from '../tabela-nutricional.js';
import { salvarFoto, urlFoto } from '../images.js';
import { buscarPorCodigo, buscarPorTexto, codigoValido, mensagemErro, leitorDisponivel, lerCodigoPelaCamera, AVISO_OFF } from '../off.js';

const n0 = x => (x == null || isNaN(x) ? '–' : Math.round(x).toLocaleString('pt-BR'));
const rotuloOrigem = a => (a.origem === 'meu' ? 'meu alimento' : a.origem === 'off' ? 'produto' : a.origem === 'usda' ? 'USDA' : '');
const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

// ---------------------------------------------------------------------------------------------
// Formulário comum (alimento próprio ou produto do Open Food Facts)

function formularioAlimento({ doc = null, inicial = {}, modo = 'meu', aoSalvar, aoCancelar, lerFoto = false }) {
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
  const novaSel = selecao([['', 'Não sei'], ['1', '1 · In natura / minimamente processado'], ['2', '2 · Ingrediente culinário (óleo, açúcar, sal...)'], ['3', '3 · Processado (pão, queijo, conserva...)'], ['4', '4 · Ultraprocessado (refrigerante, biscoito recheado...)']], String(d.nova ?? inicial.nova ?? ''), { 'aria-label': 'Tipo NOVA (grau de processamento)' });
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

  // leitura da tabela nutricional por foto (OCR local): campos duvidosos ficam destacados, com a foto à vista para conferir
  let duvidosos = new Set(), fotoTabela = null;
  const leituraBox = h('div', { class: 'pilha', 'aria-live': 'polite' });
  const guardarFoto = h('input', { type: 'checkbox', id: 'f-guardar-foto' });
  const grade = h('div', { class: 'grade-2' });
  const rot = (t, k) => (duvidosos.has(k) ? t + ' · conferir' : t);
  const cls = k => (duvidosos.has(k) ? 'campo-duvidoso' : '');
  function desenharGrade() {
    limpar(grade).append(
      campo(rot('Calorias (kcal)', 'kcal'), kcal, null, { classe: cls('kcal') }), campo(rot('Proteína (g)', 'p'), p, null, { classe: cls('p') }),
      campo(rot('Carboidrato (g)', 'c'), c, null, { classe: cls('c') }), campo(rot('Gordura (g)', 'g'), g, null, { classe: cls('g') }),
      campo(rot('Fibra (g, opcional)', 'f'), f, null, { classe: cls('f') }), campo(rot('Açúcar (g, opcional)', 'acucar'), acucar, null, { classe: cls('acucar') }));
  }
  desenharGrade();
  const fmt = v => (v == null ? '' : String(v).replace('.', ','));
  function mostrarFoto(blobOuUrl) {
    const src = typeof blobOuUrl === 'string' ? blobOuUrl : URL.createObjectURL(blobOuUrl);
    leituraBox.append(h('figure', { class: 'foto-tabela-fig' }, h('img', { src, alt: 'Foto da tabela nutricional, para conferir os valores', class: 'foto-tabela' }), h('figcaption', { class: 'ajuda' }, 'A foto fica só na memória deste aparelho; nada é enviado.')));
  }
  function aplicarLeitura(res) {
    if (!res) return;
    limpar(leituraBox); duvidosos = new Set(); fotoTabela = res.foto || null;
    if (res.foto) {
      mostrarFoto(res.foto);
      leituraBox.append(h('label', { class: 'opcao', for: 'f-guardar-foto' }, guardarFoto, h('span', null, h('strong', null, 'Guardar a foto neste aparelho com o alimento'), h('span', { class: 'd' }, 'Opcional. Não vai para a nuvem nem para o backup.'))));
    }
    if (res.erro) { leituraBox.append(caixaAviso('medio', 'Leitura não concluída', res.erro)); desenharGrade(); return; }
    const r = res.parsed;
    const por100 = r.origem !== '';
    const src = por100 ? r.por100 : (r.extras && r.extras.porPorcao) || {};
    if (!por100 && !Object.values(src).some(x => x != null)) {
      leituraBox.append(caixaAvisoLista('medio', 'Não reconheci a tabela', r.avisos, 'Digite os valores olhando a foto.')); desenharGrade(); return;
    }
    kcal.value = fmt(src.kcal); p.value = fmt(src.p); c.value = fmt(src.c); g.value = fmt(src.g); f.value = fmt(src.f); acucar.value = fmt(src.acucar);
    if (por100) {
      base = '100'; radios[0].checked = true;
    } else { base = 'porcao'; radios[1].checked = true; }   // sem tamanho de porção legível: valores por porção, a pessoa informa o tamanho
    liquido.checked = !!r.liquido;
    if (r.porcao) { porcNome.value = r.porcao.nome; porcG.value = fmt(r.porcao.g); }
    duvidosos = new Set(r.duvidosos);
    if (!por100) for (const k of ['kcal', 'p', 'c', 'g']) duvidosos.add(k);
    desenharGrade(); atualizar();
    const lista = [...duvidosos].map(k => ROTULO_CAMPO[k]).filter(Boolean);
    leituraBox.append(caixaAvisoLista(r.ok && !lista.length ? 'info' : 'medio', 'Valores lidos pela foto', r.avisos,
      'Confira cada número com a foto antes de salvar.' + (lista.length ? ' Campos para conferir: ' + lista.join(', ') + '.' : '')));
  }
  function caixaAvisoLista(nivel, titulo, avisos, fim) { return caixaAviso(nivel, titulo, [...avisos, fim].filter(Boolean).join(' ')); }
  const lerPelaFoto = async () => aplicarLeitura(await abrirLerTabela());
  if (d.fotoTabelaId) urlFoto(d.fotoTabelaId).then(u => { if (u) mostrarFoto(u); }).catch(() => {});
  if (lerFoto && !doc) setTimeout(lerPelaFoto, 150);
  const porcBloco = h('div', { class: 'grade-2' }, campo('Nome da porção', porcNome, 'Ex.: fatia, unidade, pote.'), campo('Tamanho da porção (g ou ml)', porcG, 'Obrigatório se os valores forem por porção. Se for por 100 g, é opcional e facilita registrar "1 fatia".'));

  function ler() {
    return montarDocAlimento({
      tipo: ehOff ? 'off' : 'meu', id: d.id, codigo: d.codigo ?? inicial.codigo, marca: marca.value, nome: nome.value, base,
      porcaoG: lerNumero(porcG.value), porcaoNome: porcNome.value, kcal: lerNumero(kcal.value), p: lerNumero(p.value), c: lerNumero(c.value), g: lerNumero(g.value),
      f: lerNumero(f.value), acucar: lerNumero(acucar.value), liquido: liquido.checked, nova: novaSel.value,
      apelidos: apelidos.value.split(',').map(x => x.trim()).filter(Boolean),
    });
  }
  async function salvar() {
    limpar(errosBox);
    let doc2;
    try {
      if (!nome.value.trim()) throw new Error('Dê um nome ao alimento.');
      doc2 = ler();
      if (d.fotoTabelaId) doc2.fotoTabelaId = d.fotoTabelaId;
    } catch (e) { errosBox.append(caixaAviso('alto', null, e.message)); return; }
    const { erros, avisos } = validarNutrientes(doc2);
    if (erros.length) { errosBox.append(caixaAviso('alto', 'Confira os números', erros.join(' '))); return; }
    if (avisos.length && !(await confirmar('Os números parecem estranhos', avisos.join(' '), { sim: 'Salvar mesmo assim', nao: 'Voltar e corrigir' }))) return;
    if (guardarFoto.checked && fotoTabela) { try { doc2.fotoTabelaId = await salvarFoto(fotoTabela, { tipo: 'tabela-nutricional' }); } catch { aviso('Não consegui guardar a foto, mas o alimento foi salvo.'); } }
    aoSalvar(salvarAlimentoPersonalizado(doc2));
  }
  atualizar();
  return h('div', { class: 'pilha' },
    ehOff ? caixaAviso('medio', AVISO_OFF, 'Confira o rótulo do produto e corrija o que estiver errado antes de usar. Os valores abaixo são por 100 g (ou 100 ml).') : null,
    inicial.avisos && inicial.avisos.length ? caixaAviso('medio', null, inicial.avisos.join(' ')) : null,
    ehOff || doc ? null : h('div', { class: 'pilha' }, h('button', { class: 'btn btn-escuro', type: 'button', id: 'btn-ler-tabela', onclick: lerPelaFoto }, icone('camera', 20), 'Ler tabela nutricional por foto'), h('p', { class: 'ajuda' }, 'Abre a câmera do celular, lê a tabela no próprio aparelho e preenche o formulário. Você confere antes de salvar.')),
    leituraBox,
    campo('Nome', nome), campo('Marca', marca), ehOff ? null : campo('Outros nomes (separados por vírgula)', apelidos, 'O texto livre da refeição passa a reconhecer esses nomes.'),
    ehOff ? null : h('fieldset', { class: 'pilha', style: { border: 'none', padding: 0, margin: 0 } },
      h('legend', { class: 'rotulo-grupo' }, 'Os valores nutricionais são'),
      h('label', { class: 'opcao' }, radios[0], h('span', null, h('strong', null, 'Por 100 g (ou 100 ml)'), h('span', { class: 'd' }, 'Como na tabela nutricional do rótulo.'))),
      h('label', { class: 'opcao' }, radios[1], h('span', null, h('strong', null, 'Por porção'), h('span', { class: 'd' }, 'O app converte para 100 g usando o tamanho da porção.')))),
    h('label', { class: 'opcao', for: 'f-liq' }, liquido, h('span', null, h('strong', null, 'É uma bebida (medida em ml)'))),
    rotBase, grade, porcBloco,
    campo('Tipo (NOVA)', novaSel, ehOff && inicial.nova ? 'Vem do Open Food Facts; corrija se não bater com o rótulo.' : 'Opcional. Alimenta o gráfico "grau de processamento" da aba Alimentação. Em dúvida, deixe "Não sei".'),
    errosBox,
    h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: aoCancelar }, 'Cancelar'), h('button', { class: 'btn btn-primario', type: 'button', onclick: salvar }, icone('ok', 18), ehOff ? 'Usar este produto' : 'Salvar alimento')));
}

/** "Criar meu alimento" (ou editar um existente). Retorna o alimento salvo ou undefined. */
export function abrirCriarAlimento({ doc = null, nomeInicial = '', lerFoto = false } = {}) {
  return folha(doc ? 'Editar meu alimento' : 'Criar meu alimento', fechar =>
    formularioAlimento({ doc, inicial: { nome: nomeInicial }, modo: 'meu', lerFoto, aoSalvar: a => { aviso(doc ? 'Alimento atualizado.' : 'Alimento criado. O texto livre já reconhece esse nome.'); fechar(a); }, aoCancelar: () => fechar(undefined) }), { larga: true });
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
          h('button', { class: 'btn', type: 'button', onclick: async () => { const a = await abrirCriarAlimento({ nomeInicial: entrada.value.trim() }); if (a) fechar(a); } }, icone('mais', 18), 'Criar meu alimento'),
          h('button', { class: 'btn', type: 'button', id: 'btn-busca-ler-tabela', onclick: async () => { const a = await abrirCriarAlimento({ nomeInicial: entrada.value.trim(), lerFoto: true }); if (a) fechar(a); } }, icone('camera', 18), 'Ler tabela nutricional por foto')),
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
    h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: async () => { const a = await abrirCriarAlimento(); if (a) redesenhar(); } }, icone('mais', 18), 'Criar meu alimento'),
      h('button', { class: 'btn', type: 'button', onclick: async () => { const a = await abrirCriarAlimento({ lerFoto: true }); if (a) redesenhar(); } }, icone('camera', 18), 'Ler tabela por foto')));
}
