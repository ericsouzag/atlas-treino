// Banco de alimentos unificado (TACO + IBGE + embutido + USDA): validação, desduplicação, camadas e parser.
import fs from 'node:fs';
import path from 'node:path';
import { teste, igual, perto, ok, fim } from './_t.mjs';
import { ALIMENTOS, aplicarCamada, alimentoPorId, idCanonico, nutrientesPara, buscarAlimentos, camadasProntas, registrarAlimentos, removerAlimentoDoBanco, aplicarCamadaEmFatias } from '../js/foods.js';
import { interpretarRefeicao, encontrarAlimento, somarItens } from '../js/parser.js';
import { para100, validarNutrientes, montarDocAlimento, alimentoDeDoc } from '../js/banco.js';
import { normalizar } from '../js/texto.js';
import { chaveNome, mesmoAlimento } from '../tools/lib-banco.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const lerCamada = n => JSON.parse(fs.readFileSync(path.join(raiz, 'data', `${n}.json`), 'utf8'));
const embutidos = ALIMENTOS.map(a => a.id);     // antes de carregar as camadas

console.log('Nutrientes: conversão e validação');
teste('para100 converte por porção para 100 g', () => {
  const v = para100({ kcal: 150, p: 3, c: 30, g: 1.5 }, 50);
  igual(v.kcal, 300); igual(v.p, 6); igual(v.c, 60); igual(v.g, 3);
  const w = para100({ kcal: 90, p: null }, 30); igual(w.kcal, 300); igual(w.p, null);
});
teste('validarNutrientes: erros e avisos', () => {
  ok(validarNutrientes({ kcal: 130, p: 2.5, c: 28, g: 0.3 }).erros.length === 0, 'arroz deveria passar');
  ok(validarNutrientes({ kcal: null, p: 1, c: 1, g: 1 }).erros.length > 0, 'sem kcal');
  ok(validarNutrientes({ kcal: 950, p: 0, c: 0, g: 100 }).erros.length > 0, 'acima de 900 kcal');
  ok(validarNutrientes({ kcal: 100, p: -1, c: 10, g: 1 }).erros.length > 0, 'negativo');
  ok(validarNutrientes({ kcal: 300, p: 60, c: 50, g: 10 }).erros.length > 0, 'macros somam mais de 100 g');
  ok(validarNutrientes({ kcal: 500, p: 1, c: 5, g: 1 }).avisos.length > 0, 'kcal incoerente com macros vira aviso');
  ok(validarNutrientes({ kcal: 100, p: 1, c: 10, g: 1, acucar: 15 }).avisos.length > 0, 'açúcar maior que carboidrato');
});
teste('montarDocAlimento por 100 g e por porção', () => {
  const a = montarDocAlimento({ nome: ' Meu bolo ', kcal: '350', p: '6', c: '50', g: '14', f: '2', acucar: '20', base: '100', porcaoG: '60', porcaoNome: 'fatia' });
  igual(a.nome, 'Meu bolo'); igual(a.kcal, 350); igual(a.porcoes[0].nome, 'fatia'); igual(a.porcoes[0].g, 60);
  const b = montarDocAlimento({ nome: 'Barra', kcal: '100', p: '5', c: '12', g: '3', base: 'porcao', porcaoG: '40' });
  igual(b.kcal, 250); igual(b.p, 12.5); igual(b.c, 30); igual(b.g, 7.5);
  let erro = null; try { montarDocAlimento({ nome: 'X', kcal: 100, base: 'porcao' }); } catch (e) { erro = e; }
  ok(erro, 'porção sem gramas deve falhar');
});
teste('alimentoDeDoc gera um alimento igual aos do banco', () => {
  const a = alimentoDeDoc({ id: 'meu-teste', tipo: 'meu', nome: 'Bolo da vovó', kcal: 340, p: 5, c: 52, g: 12, f: 1, acucar: 25, porcoes: [{ nome: 'fatia', g: 70 }], apelidos: ['bolo vovo'] });
  igual(a.origem, 'meu'); igual(a.id, 'meu-teste'); igual(a.unidadeBase, 'g');
  ok(a.aliasNorm.includes('bolo vovo') && a.aliasNorm.includes('bolo da vovo'), 'apelidos normalizados');
  const p = alimentoDeDoc({ id: 'off-1', tipo: 'off', nome: 'Iogurte X', marca: 'Marca', codigo: '789', kcal: 80, p: 3, c: 12, g: 2, liquido: false });
  igual(p.origem, 'off'); ok(p.ultra, 'produto industrializado conta como ultraprocessado'); igual(p.codigo, '789');
  perto(nutrientesPara(a, 70).kcal, 238, 0.01);
});

console.log('\nCamadas do banco (offline, sob demanda)');
const CAMADAS = { taco: lerCamada('taco'), ibge: lerCamada('ibge'), usda: lerCamada('usda') };
teste('os arquivos das camadas existem e têm o formato esperado', () => {
  for (const [n, j] of Object.entries(CAMADAS)) {
    ok(j.meta && j.meta.fonte && j.meta.licenca, `${n}: meta com fonte e licença`);
    ok(Array.isArray(j.itens) && j.itens.length > 100, `${n}: itens`);
    for (const r of j.itens) { igual(r.length, 11, `${n} linha ${r[0]}`); ok(r[0].startsWith(n + '-'), `${n}: id com prefixo (${r[0]})`); }
  }
});
teste('orçamento de tamanho: camadas somam até 3 MB', () => {
  const total = ['taco', 'ibge', 'usda'].reduce((s, n) => s + fs.statSync(path.join(raiz, 'data', `${n}.json`)).size, 0);
  ok(total <= 3 * 1024 * 1024, `tamanho ${total}`);
});
teste('todas as camadas carregam e registram alimentos', () => {
  const antes = ALIMENTOS.length;
  for (const n of ['taco', 'ibge', 'usda']) ok(aplicarCamada(CAMADAS[n]) > 100, `camada ${n}`);
  ok(ALIMENTOS.length > antes + 1500, `total ${ALIMENTOS.length}`);
  igual(camadasProntas().length, 0, 'camadasProntas só conta o que veio do fetch (aqui as camadas foram aplicadas direto)');
});
teste('aplicar a mesma camada de novo é idempotente', () => {
  const n = ALIMENTOS.length;
  aplicarCamada(CAMADAS.taco); igual(ALIMENTOS.length, n);
});
teste('ids únicos e com a origem certa', () => {
  const ids = new Set();
  for (const a of ALIMENTOS) {
    ok(!ids.has(a.id), 'id repetido ' + a.id); ids.add(a.id);
    if (/^(taco|ibge|usda)-/.test(a.id)) igual(a.origem, a.id.split('-')[0], a.id);
  }
});
teste('ids antigos do embutido continuam resolvendo (refeições e favoritos já salvos)', () => {
  const absorvidos = Object.entries({ ...CAMADAS.taco.meta.legado, ...CAMADAS.ibge.meta.legado });
  ok(absorvidos.length > 40, 'houve fusões do embutido com TACO/IBGE: ' + absorvidos.length);
  for (const [antigo, novo] of absorvidos) {
    ok(embutidos.includes(antigo), 'era um id do embutido: ' + antigo);
    ok(alimentoPorId(novo), 'destino existe: ' + novo);
    igual(alimentoPorId(antigo).id, novo, antigo); igual(idCanonico(antigo), novo);
  }
  ok(alimentoPorId('arroz-branco-cozido').origem === 'taco', 'arroz branco agora é o registro da TACO');
  ok(alimentoPorId('arroz-branco-cozido').porcoes.some(p => p.nome === 'escumadeira'), 'e herdou as porções caseiras');
  ok(alimentoPorId('ovo-mexido'), 'o que não tem equivalente continua com o próprio id');
});
teste('o registro fundido herda apelidos e porções do embutido', () => {
  const a = alimentoPorId('pao-frances');
  ok(a.aliasNorm.includes('paozinho') || a.aliasNorm.includes('pao da padaria'), 'apelido do embutido: ' + a.aliasNorm.join(','));
  ok(a.porcoes.some(p => p.nome === 'unidade' && p.g === 50), 'unidade de 50 g');
});

console.log('\nValidade dos valores');
teste('nenhum item com valor inválido (NaN, negativo, > 900 kcal, macros > 100 g)', () => {
  for (const a of ALIMENTOS) {
    for (const k of ['kcal', 'p', 'c', 'g', 'f', 'acucar']) ok(Number.isFinite(a[k]) && a[k] >= 0, `${a.id} ${k}=${a[k]}`);
    ok(a.kcal <= 900, `${a.id} kcal ${a.kcal}`);
    ok(a.p + a.c + a.g <= 105, `${a.id} macros ${a.p + a.c + a.g}`);
    ok(a.acucar <= a.c + 0.6, `${a.id} açúcar ${a.acucar} > carboidrato ${a.c}`);
    ok(a.nome && a.nome.trim() === a.nome && a.nome.length >= 2, `${a.id} nome`);
    ok(a.porcoes.length >= 1 && a.porcoes.every(p => p.nome && p.g > 0 && Number.isFinite(p.g)), `${a.id} porções`);
    ok(a.aliases.length >= 1 && a.aliasNorm.length === a.aliases.length, `${a.id} apelidos`);
  }
});
teste('kcal coerente com os macros (4p+4c+9g)', () => {
  for (const a of ALIMENTOS) {
    if (a.kcal < 20) continue;
    const calc = 4 * a.p + 4 * a.c + 9 * a.g;
    const alcool = /cerveja|vinho|chopp|caipirinha|cachaca|destilad|uisque|vodca|licor|batida|margarita|daiquiri|colada|whiskey|champanhe|aguardente|bebida alcool|drink/.test(normalizar(a.nome));
    const tol = alcool ? 250 : a.origem === 'usda' ? Math.max(0.15 * a.kcal, 0.15 * calc) + 12 : Math.max(35, a.kcal * 0.35);
    ok(Math.abs(calc - a.kcal) <= tol, `${a.nome} (${a.id}): kcal ${a.kcal} vs ${calc.toFixed(0)}`);
  }
});

console.log('\nDesduplicação');
teste('sem repetidos por nome: nome igual só com valores diferentes (>15% de kcal)', () => {
  const por = new Map();
  for (const a of ALIMENTOS) { const k = normalizar(a.nome); (por.get(k) || por.set(k, []).get(k)).push(a); }
  for (const [k, l] of por) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) {
    const d = Math.abs(l[i].kcal - l[j].kcal);
    ok(d > 0.15 * Math.max(l[i].kcal, l[j].kcal) + 0.001, `repetido: ${l[i].nome} (${l[i].id}) e ${l[j].nome} (${l[j].id}) com ${l[i].kcal}/${l[j].kcal} kcal`);
  }
});
teste('sem repetidos por nome equivalente + valores próximos entre fontes diferentes', () => {
  const por = new Map();
  for (const a of ALIMENTOS) { if (a.origem === 'meu' || a.origem === 'off') continue; const k = chaveNome(a.nome); const h = k.nuc[0] || a.nome; (por.get(h) || por.set(h, []).get(h)).push(a); }
  let pares = 0;
  for (const l of por.values()) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) {
    const x = l[i], y = l[j];
    if (x.origem === 'taco' && y.origem === 'taco') continue;          // a TACO diferencia variedades de propósito
    if (x.origem === 'usda' && y.origem === 'usda') continue;          // a USDA já vem agrupada por nome completo
    pares++;
    const px = { nome: x.nome, kcal: x.kcal, p: x.p, c: x.c, g: x.g }, py = { nome: y.nome, kcal: y.kcal, p: y.p, c: y.c, g: y.g };
    ok(!mesmoAlimento(px, py), `equivalentes: ${x.nome} [${x.origem}] e ${y.nome} [${y.origem}]`);
  }
  ok(pares > 1000, 'comparou pares: ' + pares);
});
teste('a busca não devolve o mesmo nome duas vezes', () => {
  for (const q of ['arroz', 'frango', 'leite', 'pao', 'queijo', 'batata', 'carne', 'suco', 'ovo', 'banana', 'pizza', 'cafe']) {
    const r = buscarAlimentos(q, 12).map(a => normalizar(a.nome));
    igual(new Set(r).size, r.length, 'busca ' + q + ': ' + r.join(' | '));
  }
});
teste('preparos diferentes continuam separados (cru, cozido, frito, grelhado)', () => {
  const nomes = ALIMENTOS.map(a => normalizar(a.nome));
  ok(nomes.some(n => /batata.*frita/.test(n)) && nomes.some(n => /batata.*cozida/.test(n)), 'batata frita e cozida');
  const arroz = ALIMENTOS.filter(a => /^arroz/.test(normalizar(a.nome)));
  ok(arroz.some(a => /cru/.test(normalizar(a.nome))) && arroz.some(a => /cozid/.test(normalizar(a.nome))), 'arroz cru e cozido');
  const frango = ALIMENTOS.filter(a => /frango.*peito/.test(normalizar(a.nome)));
  ok(['cru', 'grelhad', 'cozid', 'assad'].every(e => frango.some(a => normalizar(a.nome).includes(e))), 'peito de frango em vários preparos');
});
teste('a TACO vence em empate: mesmo alimento da TACO e do IBGE/embutido fica com um registro só', () => {
  const arroz = ALIMENTOS.filter(a => /^arroz integral/.test(normalizar(a.nome)) && /cozid/.test(normalizar(a.nome)));
  igual(arroz.length, 1, arroz.map(a => a.nome + a.id).join(' | ')); igual(arroz[0].origem, 'taco');
});

console.log('\nParser com o banco completo');
// [frase, regex (sobre o nome normalizado do 1º alimento reconhecido), origem opcional]
const FRASES = [
  // pizzas por sabor
  ['pizza de calabresa', /pizza.*calabresa/], ['pizza de presunto', /pizza.*presunto/], ['pizza portuguesa', /pizza portuguesa/],
  ['pizza margherita', /pizza margherita/], ['pizza quatro queijos', /pizza.*quatro queijos/], ['pizza de frango com catupiry', /pizza.*frango.*catupiry/],
  ['pizza de mussarela', /pizza.*(mussarela|muzzarela)/],
  // sucos
  ['suco de caju', /^suco de caju/], ['suco de laranja', /^suco de laranja/], ['1 copo de suco de manga', /^suco de manga/], ['suco de acerola', /acerola/], ['suco de uva', /suco.*(uva|caixinha)/],
  // café da manhã
  ['2 ovos mexidos', /ovo.*mexido/], ['café com leite', /cafe com leite/], ['1 pão francês', /pao.*frances/], ['2 fatias de pão de forma', /pao de forma/],
  ['tapioca com queijo', /tapioca com queijo/], ['cuscuz', /cuscuz/], ['iogurte natural', /iogurte natural/], ['1 banana', /banana/], ['aveia', /aveia/], ['leite desnatado', /leite.*desnatado/],
  // almoço
  ['150g de arroz branco', /arroz/], ['1 concha de feijão', /feijao/], ['200g de frango grelhado', /frango/], ['alcatra grelhada', /alcatra/], ['picanha', /picanha/],
  ['feijoada', /feijoada/], ['strogonoff de frango', /(strogonoff|estrogonofe).*frango/], ['lasanha', /lasanha/], ['batata frita', /batata.*frita/], ['farofa', /farofa/], ['mandioca', /mandioca/],
  ['salmão grelhado', /salmao/], ['tilápia', /tilapia/], ['moqueca', /moqueca/], ['brócolis', /brocolis/], ['tomate', /tomate/],
  // lanches e fast food
  ['big mac', /big mac/], ['1 coxinha', /coxinha/], ['pão de queijo', /pao de queijo/], ['misto quente', /misto quente/], ['cachorro quente', /cachorro.quente/], ['hambúrguer', /(hamburguer|hamburger)/],
  ['esfiha', /esfiha/], ['pastel de carne', /pastel/], ['barra de proteína', /barra de proteina/], ['barra de cereal', /barra de cerea/], ['biscoito recheado', /biscoito recheado/],
  // bebidas
  ['refrigerante', /refrigerante/], ['guaraná', /guarana/], ['coca cola zero', /refrigerante zero/], ['cerveja', /cerveja/], ['água de coco', /agua de coco/], ['caipirinha', /caipirinha/], ['isotônico', /isoton/], ['energético', /energetico/],
  // suplementos e outros
  ['1 scoop de whey', /whey/], ['creatina', /creatina/], ['pasta de amendoim', /pasta de amendoim/], ['azeite', /azeite de oliva/], ['castanha de caju', /castanha.*caju/],
  ['ricota', /ricota/], ['mirtilo', /mirtilo/], ['mel', /^mel/], ['nescau', /achocolatado/], ['leite condensado', /leite condensado/], ['mortadela', /mortadela/],
];
teste(`reconhece ${FRASES.length} frases do dia a dia`, () => {
  const falhas = [];
  for (const [frase, esperado] of FRASES) {
    const it = interpretarRefeicao(frase)[0];
    const a = it && it.alimentoId ? alimentoPorId(it.alimentoId) : null;
    if (!a || !esperado.test(normalizar(a.nome))) falhas.push(`"${frase}" => ${a ? a.nome + ' [' + a.origem + ']' : 'nada'}`);
  }
  ok(falhas.length === 0, '\n        ' + falhas.join('\n        '));
});
teste('quantidades e porções caseiras com alimentos das novas camadas', () => {
  perto(interpretarRefeicao('2 fatias de pizza de presunto')[0].gramas, 220, 2);
  perto(interpretarRefeicao('1 fatia de pizza de calabresa')[0].gramas, 110, 1);
  perto(interpretarRefeicao('1 copo de suco de caju')[0].gramas, 200, 40);
  perto(interpretarRefeicao('100g de picanha')[0].gramas, 100, 0);
  const t = somarItens(interpretarRefeicao('1 fatia de pizza de calabresa'));
  ok(t.kcal > 250 && t.kcal < 380, 'kcal ' + t.kcal);
});
teste('suco de caju não casa com polpa congelada (e polpa continua achando a polpa)', () => {
  const s = alimentoPorId(interpretarRefeicao('suco de caju')[0].alimentoId);
  ok(!/polpa/.test(normalizar(s.nome)), s.nome);
  const p = alimentoPorId(interpretarRefeicao('polpa de caju')[0].alimentoId);
  ok(/polpa/.test(normalizar(p.nome)), p.nome);
});
teste('nome com quantidade e unidade no começo ("barra de proteína") é um alimento só', () => {
  const it = interpretarRefeicao('barra de proteína');
  igual(it.length, 1); ok(/barra de proteina/.test(normalizar(alimentoPorId(it[0].alimentoId).nome)));
  const duas = interpretarRefeicao('2 barras de proteína')[0];
  perto(duas.gramas, 90, 1);
});
teste('desempate favorece a fonte brasileira e o que a pessoa criou', () => {
  const r = encontrarAlimento('mamao');
  ok(['taco', 'ibge', 'base'].includes(r.alimento.origem), r.alimento.nome + ' ' + r.alimento.origem);
  const meu = alimentoDeDoc({ id: 'meu-mamao', tipo: 'meu', nome: 'Mamão', kcal: 50, p: 1, c: 12, g: 0.1, porcoes: [{ nome: 'fatia', g: 150 }] });
  registrarAlimentos([meu]);
  try { igual(encontrarAlimento('mamao').alimento.id, 'meu-mamao'); } finally { removerAlimentoDoBanco('meu-mamao'); }
  ok(encontrarAlimento('mamao').alimento.id !== 'meu-mamao');
});
teste('busca por texto sem acerto não devolve alimentos aleatórios (nem por código de barras digitado)', () => {
  igual(buscarAlimentos('7891000100103', 12).length, 0);
  igual(buscarAlimentos('xyzzyqq', 12).length, 0);
  ok(buscarAlimentos('arroz', 12).length >= 6);
});
let fatias;
try {
  const mini = { meta: { legado: { 'id-antigo-de-teste': 'taco-999001' } }, itens: [['taco-999001', 'Mamão teste', 'frutas', 40, 0.5, 10, 0.1, 1, 'fatia:150', 'mamao teste', ''], ['taco-999002', 'Outro teste', 'frutas', 30, 0.5, 7, 0.1, 1, 'unidade:100', '', '']] };
  const n = await aplicarCamadaEmFatias(mini, 1);
  fatias = { n, origem: alimentoPorId('taco-999002')?.origem, antigo: alimentoPorId('id-antigo-de-teste')?.id };
  removerAlimentoDoBanco('taco-999001'); removerAlimentoDoBanco('taco-999002');
} catch (e) { fatias = e; }
teste('aplicarCamadaEmFatias registra tudo e resolve ids antigos (carregamento sem travar a tela)', () => {
  if (fatias instanceof Error) throw fatias;
  igual(fatias.n, 2); igual(fatias.origem, 'taco'); igual(fatias.antigo, 'taco-999001');
});
teste('interpretar 60 frases leva menos de 2 s (índice pré-calculado)', () => {
  const t0 = Date.now();
  for (let i = 0; i < 60; i++) interpretarRefeicao(FRASES[i % FRASES.length][0] + ', 100g de arroz');
  ok(Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
});
fim();
