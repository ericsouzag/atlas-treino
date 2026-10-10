// Aba Corpo: peso, % de gordura (manual / Marinha / dobras / IMC), medidas, fotos, histórico e variação.
import { h, limpar, icone, campo, entradaNum, selecao, lerNumero, n0, n1, n2, sinal, aviso, folha, confirmar, caixaAviso, vazio } from '../ui.js';
import { store } from '../store.js';
import { perfil as getPerfil, corpoOrdenado, idadeAtual } from '../dados.js';
import { imc, classeIMC, rcq, classeRCQ, composicao, gorduraMarinha, gorduraPorIMC, gorduraJacksonPollock, DOBRAS_CAMPOS, faixaGordura } from '../nutrition.js';
import { dataISO, dataCurta, dataLonga } from '../datas.js';
import { salvarFoto, urlFoto, removerFoto } from '../images.js';

const MEDIDAS = [['pescoco', 'Pescoço'], ['ombros', 'Ombros'], ['peito', 'Peito'], ['cintura', 'Cintura'], ['abdomen', 'Abdômen'], ['quadril', 'Quadril'],
  ['braco_d', 'Braço direito'], ['braco_e', 'Braço esquerdo'], ['antebraco_d', 'Antebraço direito'], ['antebraco_e', 'Antebraço esquerdo'],
  ['coxa_d', 'Coxa direita'], ['coxa_e', 'Coxa esquerda'], ['panturrilha_d', 'Panturrilha direita'], ['panturrilha_e', 'Panturrilha esquerda']];
const NOMES_DOBRAS = { peitoral: 'Peitoral', abdominal: 'Abdominal', coxa: 'Coxa', triceps: 'Tríceps', suprailiaca: 'Supra-ilíaca', axilar: 'Axilar média', subescapular: 'Subescapular' };
const METODOS = { manual: 'manual', marinha: 'Marinha', jp3: 'dobras (3)', jp7: 'dobras (7)', imc: 'IMC' };

let edicao = null; // registro em edição

export function renderizar(raiz, ctx) {
  ctx.faixa('Corpo');
  const P = getPerfil();
  const registros = corpoOrdenado();
  const redesenhar = () => ctx.redesenhar();
  const ultimo = registros.filter(r => r.peso != null).at(-1);
  const primeiro = registros.filter(r => r.peso != null)[0];
  const ultG = registros.filter(r => r.gordura != null).at(-1);
  const priG = registros.filter(r => r.gordura != null)[0];
  const ultM = registros.filter(r => r.medidas && (r.medidas.cintura && r.medidas.quadril)).at(-1);

  // -------------------------------------------- resumo
  const resumo = [];
  if (ultimo) {
    const comp = ultG ? composicao(ultimo.peso, ultG.gordura) : null;
    const compIni = priG ? composicao(priG.peso, priG.gordura) : null;
    const v = imc(ultimo.peso, P.altura || 170);
    const r = ultM ? rcq(ultM.medidas.cintura, ultM.medidas.quadril) : null;
    const d = (a, b, un, dec = 1) => (a != null && b != null ? `${sinal(a - b, dec)} ${un} desde o início` : 'sem base de comparação');
    resumo.push(h('div', { class: 'stats' },
      stat('Peso', `${n1(ultimo.peso)} kg`, primeiro && primeiro !== ultimo ? d(ultimo.peso, primeiro.peso, 'kg') : dataCurta(ultimo.data), deltaClasse(ultimo.peso - (primeiro?.peso ?? ultimo.peso), true)),
      stat('% de gordura', ultG ? `${n1(ultG.gordura)}%` : '–', ultG ? (priG !== ultG ? d(ultG.gordura, priG.gordura, 'p.p.') : faixaGordura(ultG.gordura, P.sexo)) : 'registre abaixo'),
      stat('Massa gorda', comp ? `${n1(comp.massaGorda)} kg` : '–', comp && compIni && priG !== ultG ? d(comp.massaGorda, compIni.massaGorda, 'kg') : ''),
      stat('Massa magra', comp ? `${n1(comp.massaMagra)} kg` : '–', comp && compIni && priG !== ultG ? d(comp.massaMagra, compIni.massaMagra, 'kg') : ''),
      stat('IMC', n1(v), classeIMC(v)),
      stat('Cintura/quadril', r ? n2(r) : '–', r ? classeRCQ(r, P.sexo) : 'meça cintura e quadril')));
  }

  // -------------------------------------------- formulário
  const f = edicao ? JSON.parse(JSON.stringify(edicao)) : { data: dataISO(), peso: ultimo?.peso ?? null, gordura: null, metodoGordura: null, medidas: {}, dobras: {}, fotos: [] };
  f.medidas ||= {}; f.dobras ||= {}; f.fotos ||= [];
  const novasFotos = [];
  let protocolo = f.protocolo || 3;
  const msgG = h('div', { 'aria-live': 'polite' });
  const inpPeso = entradaNum(f.peso, { 'aria-label': 'Peso em kg' });
  const inpData = h('input', { type: 'date', value: f.data, max: dataISO() });
  const inpG = entradaNum(f.gordura, { 'aria-label': '% de gordura', oninput: () => { f.metodoGordura = 'manual'; } });
  const inpsMed = {};
  const gradeMed = h('div', { class: 'medidas-grid' }, MEDIDAS.map(([k, r]) => { inpsMed[k] = entradaNum(f.medidas[k]); return campo(`${r} (cm)`, inpsMed[k]); }));
  const lerMed = () => { const o = {}; for (const [k] of MEDIDAS) { const v = lerNumero(inpsMed[k].value); if (v != null) o[k] = v; } return o; };
  const idade = () => idadeAtual() ?? 30;

  const blocoDobras = h('div', { class: 'pilha' });
  const inpsDobra = {};
  function desenharDobras() {
    limpar(blocoDobras);
    const campos = DOBRAS_CAMPOS[protocolo][P.sexo === 'F' ? 'F' : 'M'];
    blocoDobras.append(
      h('div', { class: 'chips' }, [3, 7].map(n => h('button', { class: `chip ${protocolo === n ? 'ativo' : ''}`, type: 'button', onclick: () => { protocolo = n; desenharDobras(); } }, `Jackson-Pollock ${n} dobras`))),
      h('div', { class: 'medidas-grid' }, campos.map(k => { inpsDobra[k] = entradaNum(f.dobras[k]); return campo(`${NOMES_DOBRAS[k]} (mm)`, inpsDobra[k]); })),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        const dobras = {}; campos.forEach(k => { const v = lerNumero(inpsDobra[k].value); if (v != null) dobras[k] = v; });
        const g = gorduraJacksonPollock({ sexo: P.sexo === 'F' ? 'F' : 'M', idade: idade(), dobras, protocolo });
        if (g == null) { mostrarG('alto', 'Faltam dobras', 'Preencha todas as dobras do protocolo.'); return; }
        f.dobras = dobras; f.protocolo = protocolo; aplicarG(g, protocolo === 3 ? 'jp3' : 'jp7', 'Dobras cutâneas (Jackson-Pollock), erro típico de 3 a 5 pontos percentuais.');
      } }, 'Calcular com dobras'));
  }
  function mostrarG(tipo, t, txt) { limpar(msgG).appendChild(caixaAviso(tipo, t, txt)); }
  function aplicarG(g, metodo, nota) {
    g = Math.round(g * 10) / 10;
    if (g < 2 || g > 65) { mostrarG('alto', 'Valor fora do esperado', `O cálculo deu ${n1(g)}%. Confira as medidas.`); return; }
    inpG.value = String(g).replace('.', ','); f.gordura = g; f.metodoGordura = metodo;
    mostrarG('info', `Estimativa: ${n1(g)}% de gordura (${faixaGordura(g, P.sexo)})`, nota + ' Use sempre o mesmo método para acompanhar a tendência.');
  }
  const detalhesDobras = h('details', { class: 'cartao', style: { padding: '8px 14px' } }, h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '600' } }, 'Calcular % de gordura com dobras cutâneas (adipômetro)'), blocoDobras);
  desenharDobras();

  const btnMarinha = h('button', { class: 'btn', type: 'button', onclick: () => {
    const m = lerMed(); const sexo = P.sexo === 'F' ? 'F' : 'M';
    const g = gorduraMarinha({ sexo, altura: P.altura, cintura: m.cintura, pescoco: m.pescoco, quadril: m.quadril });
    if (g == null) { mostrarG('alto', 'Faltam medidas', sexo === 'F' ? 'Preencha pescoço, cintura e quadril abaixo (e a altura no perfil).' : 'Preencha pescoço e cintura abaixo (e a altura no perfil).'); return; }
    aplicarG(g, 'marinha', 'Fórmula da Marinha dos EUA, erro típico de 3 a 4 pontos percentuais.');
  } }, icone('fita', 18), 'Estimar com fita (Marinha)');
  const btnIMC = h('button', { class: 'btn', type: 'button', onclick: () => {
    const peso = lerNumero(inpPeso.value); if (!peso || !P.altura) { mostrarG('alto', 'Faltam dados', 'Informe o peso e a altura (no perfil).'); return; }
    aplicarG(gorduraPorIMC({ sexo: P.sexo === 'F' ? 'F' : 'M', peso, altura: P.altura, idade: idade() }), 'imc', 'Estimativa pelo IMC: bem aproximada (±5 pontos), ignora o músculo.');
  } }, 'Estimar pelo IMC');

  const arquivo = h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'so-leitor', tabindex: '-1', onchange: e => { [...e.target.files].forEach(x => novasFotos.push(x)); desenharFotosForm(); e.target.value = ''; } });
  const boxFotos = h('div', { class: 'fotos-prog' });
  async function desenharFotosForm() {
    limpar(boxFotos);
    for (const id of f.fotos) { const u = await urlFoto(id); boxFotos.appendChild(h('div', { class: 'foto-mini' }, u ? h('img', { src: u, alt: 'Foto de progresso salva' }) : null, h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Remover foto', style: { position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,.6)', color: '#fff', width: '28px', height: '28px' }, onclick: () => { f.fotos = f.fotos.filter(x => x !== id); desenharFotosForm(); } }, icone('x', 14)))); }
    novasFotos.forEach((x, i) => boxFotos.appendChild(h('div', { class: 'foto-mini' }, h('img', { src: URL.createObjectURL(x), alt: 'Nova foto de progresso' }), h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Remover foto', style: { position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,.6)', color: '#fff', width: '28px', height: '28px' }, onclick: () => { novasFotos.splice(i, 1); desenharFotosForm(); } }, icone('x', 14)))));
  }
  desenharFotosForm();

  async function salvar() {
    const peso = lerNumero(inpPeso.value), g = lerNumero(inpG.value), m = lerMed();
    if (peso == null && g == null && !Object.keys(m).length && !novasFotos.length && !f.fotos.length) { aviso('Preencha pelo menos peso, medida ou foto.'); return; }
    if (peso != null && (peso < 25 || peso > 400)) { aviso('Confira o peso (entre 25 e 400 kg).'); return; }
    if (g != null && (g < 2 || g > 65)) { aviso('Confira o % de gordura (entre 2 e 65).'); return; }
    const fotos = [...f.fotos];
    for (const x of novasFotos) { try { fotos.push(await salvarFoto(x, { tipo: 'progresso' })); } catch (e) { console.warn(e); aviso('Não consegui guardar uma das fotos.'); } }
    const dobras = {}; if (detalhesDobras.open) Object.entries(inpsDobra).forEach(([k, el]) => { const v = lerNumero(el.value); if (v != null) dobras[k] = v; });
    store.salvar('corpo', { ...(edicao ? { id: edicao.id } : {}), data: inpData.value || dataISO(), peso, gordura: g, metodoGordura: g != null ? (f.metodoGordura || 'manual') : null, medidas: m, dobras: Object.keys(dobras).length ? dobras : f.dobras, fotos, ...(edicao?.origem ? { origem: edicao.origem } : {}) });
    edicao = null; aviso('Registro salvo.'); redesenhar();
  }

  const cartaoForm = h('section', { class: 'cartao pilha', 'aria-label': 'Novo registro' },
    h('h2', { style: { marginBottom: 0 } }, edicao ? 'Editar registro' : 'Novo registro'),
    h('div', { class: 'grade-2' }, campo('Data', inpData), campo('Peso (kg)', inpPeso)),
    h('div', { class: 'pilha' }, campo('% de gordura (opcional)', inpG, 'Digite o valor medido, ou use uma estimativa abaixo.'),
      h('div', { class: 'linha-botoes' }, btnMarinha, btnIMC), msgG, detalhesDobras),
    h('details', { class: 'cartao', open: Object.keys(f.medidas).length > 0, style: { padding: '8px 14px' } }, h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '600' } }, 'Medidas corporais (opcional)'), gradeMed),
    h('div', null, h('div', { class: 'rotulo' }, 'Fotos de progresso (opcional)'), h('p', { class: 'ajuda' }, 'Ficam só neste aparelho, redimensionadas. Não são analisadas nem enviadas à nuvem.'), boxFotos, arquivo, h('button', { class: 'btn', type: 'button', style: { marginTop: '8px' }, onclick: () => arquivo.click() }, icone('camera', 20), 'Adicionar fotos')),
    h('div', { class: 'linha-botoes' }, edicao ? h('button', { class: 'btn', type: 'button', onclick: () => { edicao = null; redesenhar(); } }, 'Cancelar') : null, h('button', { class: 'btn btn-primario', type: 'button', onclick: salvar }, icone('ok', 18), edicao ? 'Salvar alterações' : 'Salvar registro')));

  // -------------------------------------------- histórico
  const hist = [...registros].reverse();
  const cartaoHist = h('section', { class: 'pilha' }, h('h2', { class: 'titulo-sec' }, 'Histórico'),
    hist.length ? h('div', { class: 'hist' }, hist.map(r => {
      const comp = r.peso != null && r.gordura != null ? composicao(r.peso, r.gordura) : null;
      const partes = [r.peso != null ? `${n1(r.peso)} kg` : null, r.gordura != null ? `${n1(r.gordura)}% gordura (${METODOS[r.metodoGordura] || 'manual'})` : null, comp ? `magra ${n1(comp.massaMagra)} kg` : null].filter(Boolean).join(' · ');
      const med = Object.entries(r.medidas || {}).map(([k, v]) => `${(MEDIDAS.find(m => m[0] === k) || [k, k])[1]} ${n1(v)}`).slice(0, 4).join(' · ');
      const fotosBox = h('div', { class: 'fotos-prog' });
      (r.fotos || []).forEach(id => urlFoto(id).then(u => { if (u) fotosBox.appendChild(h('button', { type: 'button', 'aria-label': 'Ver foto ampliada', onclick: () => folha('Foto de progresso', () => h('img', { src: u, alt: `Foto de progresso de ${dataLonga(r.data)}`, style: { width: '100%', borderRadius: '12px' } })) }, h('img', { src: u, alt: '' }))); }));
      return h('div', { class: 'hist-item' }, h('div', null, h('div', { class: 't' }, dataLonga(r.data)), h('div', { class: 's' }, partes || 'Só medidas/fotos'), med ? h('div', { class: 's mudo' }, med) : null, fotosBox),
        h('div', { class: 'flex', style: { gap: 0 } },
          h('button', { class: 'btn-icone', type: 'button', 'aria-label': `Editar registro de ${dataCurta(r.data)}`, onclick: () => { edicao = r; redesenhar(); window.scrollTo(0, 0); } }, icone('lapis')),
          h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': `Excluir registro de ${dataCurta(r.data)}`, onclick: async () => { if (await confirmar('Excluir registro?', `Remove o registro de ${dataLonga(r.data)}, incluindo as fotos dele.`, { sim: 'Excluir', perigo: true })) { for (const id of r.fotos || []) await removerFoto(id); store.remover('corpo', r.id); redesenhar(); } } }, icone('lixo'))));
    })) : vazio('Nenhum registro ainda', ['Informe peso, % de gordura e medidas no formulário.', 'Quanto mais regular, melhores ficam os gráficos e a previsão.']));

  raiz.append(h('div', { class: 'pilha-g' }, resumo.length ? resumo : null, h('div', { class: 'layout-2' }, cartaoForm, cartaoHist)));
}

function stat(r, v, d, cls = '') { return h('div', { class: 'stat' }, h('span', { class: 'r' }, r), h('span', { class: 'v' }, v), h('span', { class: `d ${cls}` }, d)); }
const deltaClasse = () => '';
