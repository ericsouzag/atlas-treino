// Converte as tabelas do IBGE (POF 2008-2009) em candidatos do banco do Atlas Fitness: tools/fonte/ibge-itens.json
//
// Fontes (IBGE, Pesquisa de Orçamentos Familiares 2008-2009, domínio público para citação da fonte):
//   - "Tabelas de Composição Nutricional dos Alimentos Consumidos no Brasil" (tabelacompleta.xls)
//     https://ftp.ibge.gov.br/Orcamentos_Familiares/Pesquisa_de_Orcamentos_Familiares_2008_2009/Tabelas_de_Composicao_Nutricional_dos_Alimentos_Consumidos_no_Brasil/
//   - "Tabela de Medidas Referidas para os Alimentos Consumidos no Brasil" (tabelamedidas_bd.xls, com os nomes por extenso)
//     https://ftp.ibge.gov.br/Orcamentos_Familiares/Pesquisa_de_Orcamentos_Familiares_2008_2009/Tabela_de_Medidas_Referidas_para_os_Alimentos_Consumidos_no_Brasil/
//
// Uso:
//   node tools/gerar-ibge.mjs --xls <tabelacompleta.xls> <tabelamedidas_bd.xls>   (lê as planilhas baixadas e grava tools/fonte/ibge-extrato.json)
//   node tools/gerar-ibge.mjs                                                       (usa o extrato já guardado e grava tools/fonte/ibge-itens.json)
// Só o extrato pequeno fica no projeto; as planilhas originais não.
import fs from 'node:fs';
import path from 'node:path';
import { lerXls } from './ler-xls.mjs';
import { N, arred, construirLexico, acentuarCom, capitalizar, generoFem, flexionar, MEDIDA_PARA_UNIDADE, problemasNutri } from './lib-banco.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const fonteDir = path.join(raiz, 'tools/fonte');
const argv = process.argv.slice(2);

// ---------------------------------------------------------------------------------------------
// 1) Extrato a partir das planilhas
const PREPS_OK = ['NAO SE APLICA', 'CRU(A)', 'COZIDO(A)', 'GRELHADO(A)/BRASA/CHURRASCO', 'ASSADO(A)', 'REFOGADO(A)', 'FRITO(A)', 'EMPANADO(A)/A MILANESA'];
const VAGO = /QUALQUER|NAO ESPECIFICAD|OUTROS ANIMAIS|PRATO DE COMIDA|SALADA OU VERDURA|DE PRIMEIRA|DE SEGUNDA|\bSE\b$|NAO SE ESPECIFICA|PARTE DE GALINHA|ESPECIFICADA/;

function extrair(xlsComp, xlsMed) {
  const comp = lerXls(fs.readFileSync(xlsComp))['Tabela de Composição '];
  const linhas = comp.filter(r => typeof r[0] === 'number' && PREPS_OK.includes(String(r[3]).trim()));
  const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const itens = [];
  for (const r of linhas) {
    const nome = String(r[1]).replace(/\s+/g, ' ').trim();
    if (VAGO.test(N(nome).toUpperCase()) || VAGO.test(nome)) continue;
    let kcal = num(r[6]); const p = num(r[7]), g = num(r[8]), c = num(r[9]), f = num(r[10]);
    if (kcal == null && p != null && g != null && c != null) kcal = Math.round(4 * p + 4 * c + 9 * g);
    if (kcal == null || p == null || g == null || c == null) continue;
    itens.push([r[0], nome, r[2], String(r[3]).trim(), kcal, p, g, c, f ?? 0, num(r[42]) ?? 0, String(r[5] || '')]);
  }
  const chaves = new Set(itens.map(i => `${i[0]}/${i[2]}`));
  const med = lerXls(fs.readFileSync(xlsMed))['Tab_Medidas Caseiras'];
  const medidas = [];
  for (const r of med) {
    if (typeof r[0] !== 'number' || !chaves.has(`${r[0]}/${r[2]}`)) continue;
    const un = MEDIDA_PARA_UNIDADE[N(String(r[5]))];
    if (!un || !(r[8] > 0)) continue;
    medidas.push([r[0], r[2], N(String(r[5])), r[8]]);
  }
  const extrato = {
    metadados: {
      fonte: 'IBGE. Pesquisa de Orçamentos Familiares 2008-2009. Tabelas de Composição Nutricional dos Alimentos Consumidos no Brasil; Tabela de Medidas Referidas para os Alimentos Consumidos no Brasil. Rio de Janeiro: IBGE, 2011/2012.',
      campos_itens: ['codigo', 'descricao', 'codPreparacao', 'preparacao', 'kcal', 'proteina', 'lipideos', 'carboidrato', 'fibra', 'acucarAdicao', 'referencia'],
      campos_medidas: ['codigo', 'codPreparacao', 'medida', 'gramas'],
    },
    itens, medidas,
  };
  fs.writeFileSync(path.join(fonteDir, 'ibge-extrato.json'), JSON.stringify(extrato));
  console.log(`ibge-extrato.json: ${itens.length} linhas de composição, ${medidas.length} medidas`);
}
const iXls = argv.indexOf('--xls');
if (iXls >= 0) extrair(argv[iXls + 1], argv[iXls + 2]);

// ---------------------------------------------------------------------------------------------
// 2) Extrato -> candidatos
const ext = JSON.parse(fs.readFileSync(path.join(fonteDir, 'ibge-extrato.json'), 'utf8'));

// léxico de acentos: nomes da TACO (acentuados) + palavras comuns
const taco = JSON.parse(fs.readFileSync(path.join(fonteDir, 'taco4-extrato.json'), 'utf8'));
const EXTRA_PALAVRAS = 'açaí açúcar água alface alcatra amendoim amêndoa aveia bacalhau banana batata beterraba biscoito bolacha brigadeiro brócolis café caju caldo cará carne castanha cenoura chá chuchu coentro coração couve cuscuz doce feijão figo frango fígado geléia geleia goiaba hambúrguer hortelã inhame jabuticaba jiló laranja leite lentilha limão linguiça lingüiça macarrão maçã mamão mandioca manteiga margarina maracujá melão milho morango mostarda nozes ovo palmito pão paçoca pé pêra pêssego pimentão pipoca pizza purê queijo quibe quiabo refrigerante requeijão salmão sanduíche sardinha sorvete sopa tapioca tilápia tomate tucumã uísque uva vagem vinagre xícara yakisoba lasanha estrogonofe feijoada cachaça água-de-coco peixe frutos caqui pêra tâmara ameixa abóbora abobrinha açafrão ervilha grão grão-de-bico maionese mandioquinha mingau achocolatado nescau toddynho cappuccino capuccino espaguete macarrão salsicha mortadela presunto torrada panetone pudim torta cobertura chocolate bombom bala chiclete picolé sorvete';
const lex = construirLexico([...taco.alimentos.map(a => a.descricao), EXTRA_PALAVRAS]);
Object.assign(lex, { linguica: 'linguiça', contrafile: 'contrafilé', bobo: 'bobó', waffer: 'wafer', calabreza: 'calabresa', muzzarela: 'mussarela', hamburguer: 'hambúrguer', refrigerante: 'refrigerante', cappuccino: 'cappuccino', capuccino: 'cappuccino', uisque: 'uísque', cafe: 'café', acucar: 'açúcar', agua: 'água', coracao: 'coração', file: 'filé', mignon: 'mignon', pure: 'purê', proteina: 'proteína', sanduiche: 'sanduíche', toddynho: 'Toddynho' });

const GRUPO_PREFIXO = { 63: 'cereais', 64: 'feculentos', 65: 'cereais', 66: 'oleaginosas', 67: 'verduras', 68: 'frutas', 69: 'doces', 70: 'outros', 71: 'carnes', 72: 'peixes', 74: 'peixes', 76: 'peixes', 77: 'outros', 78: 'carnes', 79: 'laticinios', 80: 'cereais', 81: 'carnes', 82: 'bebidas', 83: 'bebidas', 84: 'gorduras', 85: 'pratos', 88: 'verduras' };
function grupoDe(cod, d) {
  let g = GRUPO_PREFIXO[String(cod).slice(0, 2)] || 'outros';
  if (/^(suco|refresco|vitamina|cafe|cha |cha$|agua|caldo de cana|leite de coco|batida|capuccino)/.test(d) && !/em po|po/.test(d)) return 'bebidas';
  if (g === 'feculentos' && !/batata|mandioca|macaxeira|inhame|cara|mandioquinha|taro|aipim|nhoque/.test(d)) g = 'verduras';
  if (/^ovo/.test(d)) return 'ovos';
  if (/feijao|lentilha|grao de bico|soja|tremoco|ervilha seca|guandu|fava/.test(d) && !/molho|oleo|leite|suco|bebida|iogurte/.test(d)) return 'leguminosas';
  if (g === 'pratos' && /pizza|hamburguer|sanduiche|hot dog|coxinha|pastel|empada|salgad|esfiha|quibe|kibe|croquete|nugget|batata frita|cachorro quente|x-|eggsburguer|bauru|misto quente|enrolad|risole|bolinha de queijo/.test(d)) return 'fastfood';
  if (g === 'pratos' && /bolo|torta doce|sorvete|brigadeiro|pudim|doce|paçoca|pacoca|mousse|gelatina|picole|sorvete|chocolate|bombom|barra de cereal/.test(d)) return 'doces';
  if (g === 'cereais' && /bolo|panetone|biscoito|wafer|waffer|rosca|doce|sonho|cuca|torta|chocolate|pao doce|cueca/.test(d) && !/pao de queijo/.test(d)) return 'doces';
  if (g === 'outros' && /azeitona|palmito|picles|ervilha|milho|seleta|cogumelo|champignon/.test(d)) return 'verduras';
  return g;
}

const ESTADO_DE = { 'CRU(A)': 'cru', 'COZIDO(A)': 'cozido', 'GRELHADO(A)/BRASA/CHURRASCO': 'grelhado', 'ASSADO(A)': 'assado', 'REFOGADO(A)': 'refogado', 'FRITO(A)': 'frito', 'EMPANADO(A)/A MILANESA': 'empanado' };
const ORDEM = ['NAO SE APLICA', 'CRU(A)', 'COZIDO(A)', 'GRELHADO(A)/BRASA/CHURRASCO', 'ASSADO(A)', 'REFOGADO(A)', 'FRITO(A)', 'EMPANADO(A)/A MILANESA'];

function limparNome(bruto) {
  let s = bruto.replace(/\s*\([^)]*(ETC|,)[^)]*\)/gi, '');     // "(OURO, PRATA, ETC)" -> nada
  s = s.replace(/[´`']/g, '').replace(/\s*\(([^)]*)\)/g, ' ($1)').replace(/\s+/g, ' ').trim();
  s = s.replace(/\bORGANIC[OA]\b/g, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
  return s;
}
const TYPOS = [[/calabreza/g, 'calabresa'], [/muzzarela/g, 'mussarela'], [/waffer/g, 'wafer'], [/chandele/g, 'chandelle']];
function titulo(s) {
  let t = acentuarCom(lex, TYPOS.reduce((x, [r, v]) => x.replace(r, v), s.toLowerCase()));
  return capitalizar(t).replace(/\(([a-zà-ÿ])/g, (m, c) => '(' + c);
}

const LIQUIDO = /^(suco|refresco|refrigerante|agua|cha |cha$|cafe|leite(?! em po| condensado| de coco)|bebida|vitamina|cerveja|chopp|vinho|cachaca|aguardente|uisque|caipirinha|batida|drink|iogurte liquido|mate|energetico|isotonico|nectar|caldo de cana|guarana|coca|fanta|sukita|q-suco|toddynho|toddy|achocolatado pronto|leite aromatizado|caldo de tomate|sopa|vitamina|capuccino|cafe tipo|agua de coco|gatorade)/;
const ULTRA = /refrigerante|guarana|coca|fanta|sukita|q-suco|biscoito|bolacha|wafer|waffer|salgadinho|macarrao instantaneo|salsicha|mortadela|linguica|hamburguer|nugget|presunto|blanquet|apresuntado|salame|mini pizza|pizza pronta|achocolatado|toddynho|toddy|bebida lactea|margarina|sorvete|picole|chocolate|bombom|bala|chiclete|caramelo|gelatina|pudim|doce de leite|barra de cereal|panetone|bolo|paes? de forma|pao de hamburguer|empanado|maionese|ketchup|catchup|refresco|leite aromatizado|cereal|sucrilho|cuca|rosquinha|baconzito|diet shake|requeijao|queijo (prato|processado)|iogurte (de )?(sabor|qualquer)|coxinha|pastel|empada|esfiha|croquete|kibe|quibe|batata (chips|frita)|salgado|torrada|pipoca (de micro|doce)|doce|geleia|goiabada|bananada|cocada|brigadeiro|paçoca/;
const BEBAC = /refrigerante|guarana|coca|fanta|sukita|q-suco|refresco|nectar|suco (de )?(.* )?(pronto|po|artificial|caixinha)|isotonico|energetico|achocolatado|toddy|caldo de cana|leite aromatizado|chope?p|vitamina|bebida lactea|cha (gelado|mate)|batida|drink/;

const medPor = new Map();
for (const [cod, prep, med, g] of ext.medidas) {
  const k = `${cod}/${prep}`;
  (medPor.get(k) || medPor.set(k, new Map()).get(k)).set(med, [...(medPor.get(k).get(med) || []), g]);
}
const PRIORIDADE_UN = ['unidade', 'fatia', 'porcao', 'pedaco', 'copo', 'lata', 'garrafa', 'prato', 'escumadeira', 'concha', 'pegador', 'colher de sopa', 'xicara', 'colher de sobremesa', 'colher de cha', 'tigela', 'pote', 'pacote', 'bife', 'file', 'rodela', 'barra', 'caneca', 'punhado', 'espiga', 'dose', 'gomo', 'fio', 'sache', 'tablete', 'bola', 'caixinha', 'folha', 'ramo', 'cacho', 'bombom', 'espetinho', 'picole', 'colher de cafe', 'taca'];
const TETO = { 'colher de cha': 15, 'colher de cafe': 8, 'colher de sobremesa': 30, 'colher de sopa': 60, copo: 350, xicara: 300, caneca: 400, taca: 400, concha: 250, escumadeira: 200, pegador: 150, fatia: 200, prato: 600, rodela: 100, folha: 60, ramo: 100, fio: 15, dose: 60, bombom: 40, picole: 120, punhado: 60, sache: 30, barra: 100, gomo: 150, tablete: 200, bife: 300, file: 300, espiga: 400, pedaco: 400, porcao: 600, tigela: 600, pote: 400, unidade: 1200, lata: 500, garrafa: 2000, pacote: 1000, caixinha: 500, bola: 200, cacho: 600, espetinho: 150 };
const mediana = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
function porcoesDe(cod, prep, liquido) {
  const m = medPor.get(`${cod}/${prep}`);
  if (!m) return [];
  const porUn = new Map();
  for (const [med, gs] of m) {
    const un = MEDIDA_PARA_UNIDADE[med]; if (!un) continue;
    (porUn.get(un) || porUn.set(un, []).get(un)).push(...gs);
  }
  const ord = [...porUn.keys()].sort((a, b) => PRIORIDADE_UN.indexOf(a) - PRIORIDADE_UN.indexOf(b));
  if (liquido) ord.sort((a, b) => (['copo', 'xicara', 'caneca', 'lata', 'garrafa'].includes(b) ? 1 : 0) - (['copo', 'xicara', 'caneca', 'lata', 'garrafa'].includes(a) ? 1 : 0));
  const lista = ord.slice(0, 7).map(un => ({ nome: un, g: arred(mediana(porUn.get(un)), 1) })).filter(p => p.g > 0 && p.g <= (TETO[p.nome] || 600));
  // a primeira porção é a padrão quando a pessoa não diz a quantidade: evita 1 uva (8 g) ou 1 castanha (3 g)
  const ord2 = [...lista.filter(p => p.g >= 15 && p.g <= 400), ...lista.filter(p => !(p.g >= 15 && p.g <= 400))];
  // fruta/hortaliça inteira muito grande (mamão 310 g, abacaxi 750 g): o padrão passa a ser a fatia/porção
  if (ord2[0] && ord2[0].g > 250) { const j = ord2.findIndex(p => p.g >= 15 && p.g <= 250 && ['fatia', 'porcao', 'pedaco', 'copo', 'rodela'].includes(p.nome)); if (j > 0) ord2.unshift(ord2.splice(j, 1)[0]); }
  return ord2.slice(0, 6);
}

// agrupa por alimento
const porAlimento = new Map();
for (const r of ext.itens) (porAlimento.get(r[0]) || porAlimento.set(r[0], []).get(r[0])).push(r);

const saida = [], descartados = [];
for (const [cod, linhas] of porAlimento) {
  linhas.sort((a, b) => ORDEM.indexOf(a[3]) - ORDEM.indexOf(b[3]));
  const nomeBase = limparNome(linhas[0][1]);
  const d = N(nomeBase);
  const grupo = grupoDe(cod, d);
  const pratoOuProduto = ['pratos', 'fastfood', 'doces', 'bebidas', 'laticinios', 'gorduras', 'outros'].includes(grupo) || ['65', '69', '77', '80', '81', '85'].includes(String(cod).slice(0, 2));
  // grupos de preparos com valores idênticos viram um item só
  const grupos = new Map();
  for (const r of linhas) {
    const k = [r[4], r[5], r[6], r[7]].map(x => Math.round(x * 10)).join('/');
    (grupos.get(k) || grupos.set(k, []).get(k)).push(r);
  }
  const unico = grupos.size === 1;
  for (const gr of grupos.values()) {
    const r = gr[0];
    let estado = null;
    const preps = gr.map(x => x[3]);
    if (!preps.includes('NAO SE APLICA') && gr.length === 1) estado = ESTADO_DE[r[3]];
    else if (!preps.includes('NAO SE APLICA') && gr.length > 1 && !unico) estado = null; // vários preparos iguais: nome neutro
    // "não se aplica" de alimento simples: o estado vem da referência (arroz = cozido)
    if (!estado && preps.includes('NAO SE APLICA') && !pratoOuProduto && String(cod).slice(0, 2) !== '68') {
      const ref = r[10] || '';
      if (/cooked|boiled|steamed|cozid/i.test(ref)) estado = 'cozido'; else if (/fried|frito/i.test(ref)) estado = 'frito';
      else if (/roast|baked|assad/i.test(ref)) estado = 'assado'; else if (/grill|broil|grelh/i.test(ref)) estado = 'grelhado';
    }
    if (estado === 'cru' && unico && grupos.size === 1) estado = null;
    let nome = titulo(nomeBase);
    if (estado) nome += ` (${flexionar(estado, generoFem(nomeBase))})`;
    const liquido = LIQUIDO.test(d) && !/em po|condensado|\bpo\b/.test(d);
    const it = {
      id: `${cod}-${r[2]}`, nome, grupo, kcal: arred(r[4], 0), p: arred(r[5]), g: arred(r[6]), c: arred(r[7]), f: arred(r[8]), acucar: arred(Math.min(r[9], r[7]), 1),
      liquido, ultra: ULTRA.test(d), bebAc: BEBAC.test(d) && r[4] > 20 && !/diet|light|zero/.test(d), supl: false,
      porcoes: [], apelidos: [], fonte: 'ibge',
    };
    // porções: do primeiro preparo do grupo que tiver medidas
    for (const x of gr) { it.porcoes = porcoesDe(cod, x[2], liquido); if (it.porcoes.length) break; }
    if (!it.porcoes.length) it.porcoes = [{ nome: 'porcao', g: liquido ? 200 : 100 }];
    const pr = problemasNutri({ ...it, nome });
    if (pr.length) { descartados.push([it.id, nome, pr.join('; ')]); continue; }
    saida.push(it);
  }
}

// nomes repetidos dentro do próprio IBGE (ex.: duas entradas "Arroz") -> mantém a de código menor, acrescenta o resto como apelido não; descarta
const vistos = new Map();
const final = [];
for (const it of saida) {
  const k = N(it.nome);
  const o = vistos.get(k);
  if (o && Math.abs(o.kcal - it.kcal) <= Math.max(5, 0.15 * o.kcal)) { descartados.push([it.id, it.nome, `repetido no IBGE (${o.id})`]); continue; }
  if (o) { descartados.push([it.id, it.nome, `nome ambíguo no IBGE (${o.id})`]); continue; }
  vistos.set(k, it); final.push(it);
}

// apelido: o nome sem parênteses ("Camarão"), só para a variante preferida de cada alimento (cozido > grelhado > assado > refogado > cru > frito > empanado)
const RANK_ESTADO = ['cozid', 'grelhad', 'assad', 'refogad', 'cru', 'frit', 'empanad'];
const rankNome = nome => { const m = nome.match(/\(([^)]*)\)\s*$/); if (!m) return -1; const i = RANK_ESTADO.findIndex(r => m[1].startsWith(r)); return i < 0 ? 99 : i; };
const grupos2 = new Map();
for (const it of final) {
  const sem = it.nome.replace(/\s*\((cozid|grelhad|assad|refogad|cru|frit|empanad)[^)]*\)\s*$/, '').trim();
  if (N(sem) === N(it.nome)) continue;
  (grupos2.get(N(sem)) || grupos2.set(N(sem), { sem, v: [] }).get(N(sem))).v.push(it);
}
for (const { sem, v } of grupos2.values()) {
  if (final.some(x => N(x.nome) === N(sem))) continue;           // já existe um item com esse nome
  v.sort((a, b) => rankNome(a.nome) - rankNome(b.nome));
  if (rankNome(v[0].nome) <= 4) v[0].apelidos.push(sem);   // frito e empanado nunca levam o nome "puro"
}

fs.writeFileSync(path.join(fonteDir, 'ibge-itens.json'), JSON.stringify({ meta: { fonte: ext.metadados.fonte, descartados }, itens: final }));
console.log(`ibge-itens.json: ${final.length} candidatos (${descartados.length} descartados) de ${porAlimento.size} alimentos`);
if (argv.includes('--relatorio')) { descartados.slice(0, 80).forEach(d => console.log('  desc', d.join(' | '))); final.filter((_, i) => i % 13 === 0).forEach(i => console.log(' ', i.id, i.nome, i.grupo, i.kcal, i.p, i.c, i.g, JSON.stringify(i.porcoes))); }
