// Seleciona e traduz alimentos do USDA FoodData Central (Foundation Foods + SR Legacy) para o banco do Atlas Fitness.
//
// Fonte: USDA, Agricultural Research Service. FoodData Central. https://fdc.nal.usda.gov
// Licença: domínio público (CC0 1.0). Pede-se citar o FoodData Central como fonte.
//   https://fdc.nal.usda.gov/download-datasets  (FoodData_Central_foundation_food_csv_2026-04-30.zip e
//                                                FoodData_Central_sr_legacy_food_csv_2018-04.zip)
//
// Não importamos os ~8 mil itens: só os que casam com uma regra de tradução abaixo (cortes de carne, peixes e frutos do mar,
// oleaginosas, laticínios e queijos, sucos, bebidas, suplementos, importados comuns...). O que não tem tradução de qualidade
// é descartado. Os que têm equivalente brasileiro são fundidos depois por tools/unificar-banco.mjs.
//
// Uso:
//   node tools/gerar-usda.mjs --csv <pasta-foundation> <pasta-sr-legacy>   (lê os CSV baixados; grava tools/fonte/usda-extrato.json)
//   node tools/gerar-usda.mjs                                               (usa o extrato guardado; grava tools/fonte/usda-itens.json)
import fs from 'node:fs';
import path from 'node:path';
import { N, arred, generoFem, flexionar, MEDIDA_PARA_UNIDADE, problemasNutri } from './lib-banco.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const fonteDir = path.join(raiz, 'tools/fonte');
const argv = process.argv.slice(2);

// ---------------------------------------------------------------------------------------------
// Leitura de CSV (aspas, vírgulas e quebras dentro de campos)
function csv(file) {
  const t = fs.readFileSync(file, 'utf8');
  const rows = []; let f = '', r = [], q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f.replace(/\r$/, '')); rows.push(r); r = []; f = ''; }
    else f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}

// ---------------------------------------------------------------------------------------------
// Estados de preparo e qualificadores
function estadoDe(d) {
  if (/\bdried\b|dehydrated/.test(d) && !/\bcooked\b|roasted/.test(d)) return 'seco';
  if (/\bfried\b|pan-fried|deep-fat|stir-fried|french fried/.test(d)) return 'frito';
  if (/broiled|grilled|charbroiled|pan-broiled/.test(d)) return 'grelhado';
  if (/roasted|baked|rotisserie|oven|dry heat|fast roasted/.test(d)) return 'assado';
  if (/boiled|steamed|poached|simmered|stewed|braised|moist heat|microwaved|\bcooked\b|\bprepared with water\b/.test(d)) return 'cozido';
  if (/\braw\b|\buncooked\b|\bunprepared\b/.test(d)) return 'cru';
  return '';
}
const QUAL = {
  pele: d => /meat and skin|with skin/.test(d) ? 'com pele' : /meat only|skinless|without skin|breast, boneless/.test(d) ? 'sem pele' : '',
  magra: d => /separable lean only|lean only/.test(d) ? 'só carne magra' : '',
  gordura: d => /nonfat|skim|fat free|fat-free|fat free/.test(d) ? 'desnatado' : /lowfat|low fat|reduced fat|\b1%|\b2%|part skim|low-fat|light/.test(d) ? 'semidesnatado' : /whole|full fat|3\.25%/.test(d) ? 'integral' : '',
  acucar: d => /unsweetened|no sugar added|sugar free|sugar-free|zero/.test(d) ? 'sem açúcar' : /sweetened|with sugar|syrup/.test(d) ? 'com açúcar' : '',
  sal: d => /unsalted|without salt|no salt|low sodium|lightly salted/.test(d) ? '' : /(?<!un)salted|with salt|salt added/.test(d) ? 'com sal' : '',
  torra: d => /dry roasted/.test(d) ? 'torrada' : /oil roasted/.test(d) ? 'torrada no óleo' : '',
  diet: d => /\bdiet\b|low calorie|reduced calorie|sugar free|sugar-free|zero|light/.test(d) ? 'diet' : '',
  casca: d => /with skin/.test(d) ? 'com casca' : /without skin|peeled/.test(d) ? 'sem casca' : '',
};

// ---------------------------------------------------------------------------------------------
// Regras de seleção/tradução. [regex sobre a descrição em minúsculas, nome pt-BR, grupo, opções]
//   opções: q = qualificadores (chaves de QUAL), est = false (não mostra estado), estSo = lista de estados aceitos, nao = regex de exclusão,
//           l = líquido, u = ultraprocessado, b = bebida açucarada, t = suplemento, ac = true (conta açúcar total), apel = apelidos
const CARNE_ESTADOS = ['cru', 'grelhado', 'assado', 'cozido', 'frito'];
const R = [];
const add = (re, nome, grupo, o = {}) => R.push({ re, nome, grupo, ...o });

// --- bovinos
const BOV = [
  ['ribeye|rib eye|rib steak|rib, small end|rib, large end|ribs, prime', 'Ancho (ribeye)'], ['tenderloin', 'Filé mignon bovino'], ['top loin|new york strip|strip steak|loin, strip', 'Contrafilé'],
  ['top sirloin|sirloin', 'Alcatra'], ['bottom sirloin|tri-tip|tri tip', 'Fraldinha'], ['t-bone', 'T-bone'], ['porterhouse', 'Porterhouse'], ['flank', 'Flank steak'],
  ['skirt', 'Entranha bovina'], ['brisket', 'Peito bovino'], ['chuck', 'Acém'], ['eye of round', 'Lagarto'], ['top round', 'Coxão mole'], ['bottom round', 'Coxão duro'],
  ['short ribs', 'Costela bovina (short ribs)'], ['shank', 'Músculo bovino'], ['rump', 'Maminha'], ['liver', 'Fígado bovino'], ['tongue', 'Língua bovina'], ['heart', 'Coração bovino'], ['kidney', 'Rim bovino'], ['tripe', 'Dobradinha (bucho)'],
];
for (const [re, nome] of BOV) add(new RegExp(`^beef, (?!ground|cured|dried|canned|new zealand|australian|variety)[^,]*(${re})`), nome, 'carnes', { q: ['magra'], estSo: CARNE_ESTADOS, nao: /imported|wagyu|\bprime\b|new zealand|australian|marble|restructured|patty|sausage|jerky|stew meat|variety meats/ });
add(/^beef, variety meats and by-products, liver/, 'Fígado bovino', 'carnes', { estSo: CARNE_ESTADOS });
add(/^beef, variety meats and by-products, (tongue)/, 'Língua bovina', 'carnes', { estSo: CARNE_ESTADOS });
add(/^beef, variety meats and by-products, (heart)/, 'Coração bovino', 'carnes', { estSo: CARNE_ESTADOS });
add(/^beef, variety meats and by-products, (kidneys)/, 'Rim bovino', 'carnes', { estSo: CARNE_ESTADOS });
add(/^beef, variety meats and by-products, (tripe)/, 'Dobradinha (bucho bovino)', 'carnes', { estSo: CARNE_ESTADOS });
add(/^beef, ground, (\d+)% lean meat \/ (\d+)% fat/, (m) => `Carne moída bovina ${m[1]}% magra`, 'carnes', { estSo: ['cru', 'grelhado', 'cozido', 'assado', 'frito'], nao: /patty, cooked|crumbles|loaf/ });
add(/^beef, ground, (\d+)% lean meat \/ (\d+)% fat, patty/, (m) => `Hambúrguer de carne ${m[1]}% magra`, 'carnes', { estSo: ['cru', 'grelhado', 'frito', 'cozido'], apel: ['hamburguer caseiro'] });
add(/^beef, ground, (\d+)% lean/, (m) => `Carne moída bovina ${m[1]}% magra`, 'carnes', { estSo: CARNE_ESTADOS, nao: /crumbles|loaf|patty/ });
add(/^beef jerky|^snacks, beef jerky|beef, dried, chipped/, 'Carne seca tipo jerky', 'carnes', { u: true, est: false, apel: ['jerky', 'beef jerky', 'carne seca'] });
add(/^beef, cured, corned beef, canned|^corned beef/, 'Carne enlatada (corned beef)', 'carnes', { est: false, u: true });
// --- suínos
const PORCO = [['tenderloin', 'Lombinho suíno'], ['loin, center loin|chop|center cut', 'Bisteca suína'], ['loin', 'Lombo suíno'], ['shoulder', 'Paleta suína'], ['leg|ham, fresh', 'Pernil suíno'], ['spareribs|backribs|ribs', 'Costelinha suína'], ['belly', 'Barriga suína'], ['bacon', 'Bacon'], ['ham', 'Presunto cru/curado'], ['ground', 'Carne moída suína']];
for (const [re, nome] of PORCO) add(new RegExp(`^pork, (?:fresh, |cured, )?(${re})`), nome, 'carnes', { q: ['magra'], estSo: CARNE_ESTADOS, nao: /variety|cured, bacon|bacon|ham|canned|sausage/ , ...(nome === 'Bacon' ? {} : {}) });
add(/^pork, cured, bacon, cooked/, 'Bacon frito', 'carnes', { est: false, u: true, apel: ['bacon', 'bacon frito', 'bacon crocante'] });
add(/^pork, cured, bacon, raw|^pork, cured, bacon, unprepared/, 'Bacon cru', 'carnes', { est: false, u: true });
add(/^pork, cured, ham, (?!.*(canned|patties))/, 'Presunto cru (ham curado)', 'carnes', { q: ['magra'], est: false, u: true });
add(/^canadian bacon/, 'Bacon canadense', 'carnes', { est: false, u: true });
add(/^pork, ground, (\d+)% lean/, (m) => `Carne moída suína ${m[1]}% magra`, 'carnes', { estSo: ['cru', 'cozido', 'grelhado'] });
// --- cordeiro, vitela, caça
add(/^lamb, domestic, (leg|loin|shoulder|rib|shank|foreshank|composite)/, 'Cordeiro', 'carnes', { q: ['magra'], estSo: CARNE_ESTADOS, nao: /imported|new zealand|australian/ });
add(/^lamb, ground/, 'Carne moída de cordeiro', 'carnes', { estSo: CARNE_ESTADOS });
add(/^veal, (leg|loin|shoulder|sirloin|rib|composite|ground)/, 'Vitela', 'carnes', { q: ['magra'], estSo: CARNE_ESTADOS, nao: /australian|new zealand|imported/ });
add(/^(bison|game meat, bison), (ground|top sirloin|ribeye|chuck|flank|shoulder)/, 'Búfalo (bisão)', 'carnes', { estSo: CARNE_ESTADOS });
add(/^game meat, (venison|deer)/, 'Carne de veado', 'carnes', { estSo: CARNE_ESTADOS });
add(/^(rabbit), (domesticated|wild)/, 'Coelho', 'carnes', { estSo: CARNE_ESTADOS, q: [] });
// --- aves
const AVES = [['breast', 'Frango, peito'], ['drumstick', 'Frango, sobrecoxa/coxa (drumstick)'], ['thigh', 'Frango, sobrecoxa'], ['wing', 'Frango, asa'], ['leg', 'Frango, coxa e sobrecoxa'], ['back', 'Frango, costas'], ['liver', 'Fígado de frango'], ['heart', 'Coração de frango'], ['gizzard', 'Moela de frango'], ['ground', 'Frango moído']];
for (const [re, nome] of AVES) add(new RegExp(`^chicken, (?:broilers? or fryers?, |broiler, |roasting, |stewing, |dark meat, |light meat, )*(${re})(?:,|$)`), nome.replace('Frango, sobrecoxa/coxa (drumstick)', 'Frango, coxa'), 'carnes', { q: ['pele'], estSo: CARNE_ESTADOS, nao: /breaded|nugget|patty|tender|imitation|giblets|neck|rotisserie|restaurant|canned|dark meat, drumstick|dark meat, thigh/ });
add(/^chicken, broilers or fryers, meat and skin, (cooked|raw)/, 'Frango inteiro', 'carnes', { estSo: CARNE_ESTADOS });
add(/^chicken, broilers or fryers, meat only, (cooked|raw)/, 'Frango inteiro sem pele', 'carnes', { estSo: CARNE_ESTADOS });
add(/^chicken, rotisserie|^chicken, broilers or fryers, rotisserie, bbq, breast/, 'Frango de padaria (assado em espeto)', 'carnes', { est: false, apel: ['frango assado de padaria', 'frango de rotisserie'] });
add(/^turkey, (?!ground|from whole|canned|pre-basted|young)(breast|thigh|drumstick|wing|dark meat|light meat|all classes)/, 'Peru', 'carnes', { q: ['pele'], estSo: CARNE_ESTADOS, nao: /canned|sausage|ham|bacon|roll|patties|stuffed|smoked|fryer|gravy/ });
add(/^turkey, ground, (\d+)% lean/, (m) => `Peru moído ${m[1]}% magro`, 'carnes', { estSo: ['cru', 'cozido', 'grelhado'], nao: /crumbles|patties/ });
add(/^duck, (domesticated|young duckling)/, 'Pato', 'carnes', { q: ['pele'], estSo: ['cru', 'assado', 'cozido'] });
add(/^(goose|quail|pheasant|ostrich), /, null, 'carnes', { estSo: ['cru', 'assado', 'cozido', 'grelhado'], q: [], trad: { goose: 'Ganso', quail: 'Codorna', pheasant: 'Faisão', ostrich: 'Avestruz' }, nao: /liver|ground|giblet|wild|mechanically|round|oyster|tip|fan|strip|leg|inside|outside|tenderloin|top loin/ });
// --- peixes e frutos do mar
const PEIXES = {
  'salmon, atlantic, farmed': 'Salmão do Atlântico (de cativeiro)', 'salmon, atlantic, wild': 'Salmão do Atlântico (selvagem)', 'salmon, sockeye': 'Salmão sockeye', 'salmon, coho': 'Salmão coho', 'salmon, chinook': 'Salmão chinook',
  'salmon, pink': 'Salmão rosa', 'salmon, chum': 'Salmão chum', 'salmon, atlantic': 'Salmão do Atlântico', 'tuna, fresh, bluefin': 'Atum azul', 'tuna, fresh, yellowfin': 'Atum albacora', 'tuna, fresh, skipjack': 'Atum bonito-listrado',
  'tuna, light, canned in water': 'Atum em lata ao natural', 'tuna, light, canned in oil': 'Atum em lata em óleo', 'tuna, white, canned in water': 'Atum branco em lata ao natural', 'tuna, white, canned in oil': 'Atum branco em lata em óleo',
  'cod, atlantic': 'Bacalhau fresco (cod do Atlântico)', 'cod, pacific': 'Bacalhau fresco (cod do Pacífico)', 'haddock': 'Hadoque', 'halibut': 'Halibute', 'tilapia': 'Tilápia', 'trout, rainbow': 'Truta arco-íris', 'trout': 'Truta',
  'mackerel, atlantic': 'Cavala do Atlântico', 'mackerel, king': 'Cavala-rei', 'mackerel': 'Cavala', 'herring, atlantic': 'Arenque do Atlântico', 'sardine, atlantic': 'Sardinha em lata', 'swordfish': 'Peixe-espada', 'catfish, channel': 'Bagre (catfish)', 'pollock, alaska': 'Merluza-do-alasca', 'pollock, atlantic': 'Escamudo do Atlântico',
  'mahimahi': 'Dourado (mahi-mahi)', 'snapper': 'Pargo', 'sea bass': 'Robalo', 'bass, striped': 'Robalo listrado', 'bass, freshwater': 'Black bass', 'perch': 'Perca', 'pike': 'Lúcio', 'flatfish': 'Linguado', 'sole': 'Linguado', 'grouper': 'Garoupa', 'monkfish': 'Tamboril',
  'anchovy': 'Anchova em conserva', 'eel': 'Enguia', 'shark': 'Tubarão', 'sturgeon': 'Esturjão', 'caviar': 'Caviar', 'roe': 'Ovas de peixe', 'whiting': 'Pescada-branca', 'carp': 'Carpa', 'surimi': 'Surimi (kani)', 'fish sticks': 'Peixe empanado (fish sticks)',
};
for (const [k, nome] of Object.entries(PEIXES)) add(new RegExp(`^fish, ${k}(?:,|$)`), nome, 'peixes', { estSo: ['cru', 'assado', 'cozido', 'grelhado', 'frito', ''], nao: /smoked|kippered|pickled|salad|spread|cake|loaf|imitation|raw, wild, canned|restaurant|breaded|cooked, dry heat, sliced|\bsmoke/ });
add(/^fish, salmon, (smoked|chinook, smoked)|^fish, salmon, chinook, smoked/, 'Salmão defumado', 'peixes', { est: false });
add(/^fish, tuna, light, canned in water|^fish, tuna, canned in water/, 'Atum em lata ao natural', 'peixes', { est: false, apel: ['atum ao natural', 'atum em agua'] });
add(/^fish, sardine, atlantic, canned in oil/, 'Sardinha em lata em óleo', 'peixes', { est: false });
add(/^crustaceans, shrimp, (mixed species|farmed|cooked)/, 'Camarão', 'peixes', { estSo: ['cru', 'cozido', 'assado', 'frito', ''], nao: /imitation|canned|breaded|fried/ });
add(/^crustaceans, crab, (blue|alaska king|dungeness|queen)/, 'Caranguejo', 'peixes', { estSo: ['cru', 'cozido', ''], nao: /imitation|cakes|canned/ });
add(/^crustaceans, lobster, northern|^crustaceans, spiny lobster/, 'Lagosta', 'peixes', { estSo: ['cru', 'cozido', ''] });
add(/^crustaceans, crayfish/, 'Lagostim de água doce', 'peixes', { estSo: ['cru', 'cozido', ''] });
add(/^mollusks, squid/, 'Lula', 'peixes', { estSo: ['cru', 'frito', 'cozido', ''] });
add(/^mollusks, octopus/, 'Polvo', 'peixes', { estSo: ['cru', 'cozido', ''] });
add(/^mollusks, (oyster)/, 'Ostra', 'peixes', { estSo: ['cru', 'cozido', 'frito', ''], nao: /canned|breaded/ });
add(/^mollusks, (mussel)/, 'Mexilhão', 'peixes', { estSo: ['cru', 'cozido', ''] });
add(/^mollusks, (clam)/, 'Marisco (amêijoa)', 'peixes', { estSo: ['cru', 'cozido', ''], nao: /canned|breaded/ });
add(/^mollusks, (scallop)/, 'Vieira', 'peixes', { estSo: ['cru', 'cozido', ''], nao: /imitation|breaded/ });
// --- ovos
add(/^egg, whole, (raw|cooked, hard-boiled|cooked, poached|cooked, scrambled|cooked, fried|cooked, omelet)/, null, 'ovos', { est: false, ovo: true });
add(/^egg, quail/, 'Ovo de codorna', 'ovos', { est: false });
add(/^egg, duck/, 'Ovo de pata', 'ovos', { est: false });
// --- laticínios
add(/^milk, (whole|reduced fat|lowfat|nonfat|fluid, whole)/, 'Leite', 'laticinios', { l: true, q: ['gordura'], est: false, nao: /dry|evaporated|condensed|chocolate|buttermilk|canned|goat|sheep|human|indian|producer|substitute|imitation|filled|low sodium|lactose|protein/ });
add(/^milk, (nonfat|dry), (fluid|powder)|^milk, dry, (whole|nonfat)/, 'Leite em pó', 'laticinios', { q: ['gordura'], est: false, apel: ['leite em po'] , nao: /instant/ });
add(/^milk, goat, fluid/, 'Leite de cabra', 'laticinios', { l: true, est: false });
add(/^milk, evaporated, (whole|2% fat|nonfat)/, 'Leite evaporado', 'laticinios', { q: ['gordura'], est: false });
add(/^milk, buttermilk, fluid, (whole|cultured lowfat)|^milk, buttermilk/, 'Leitelho (buttermilk)', 'laticinios', { l: true, est: false });
add(/^milk, chocolate, fluid, commercial, (whole|reduced fat|lowfat)/, 'Leite com chocolate (achocolatado pronto)', 'laticinios', { l: true, q: ['gordura'], est: false, b: true, ac: true });
add(/^yogurt, greek, plain/, 'Iogurte grego natural', 'laticinios', { q: ['gordura'], est: false });
add(/^yogurt, (plain|plain, skim milk|plain, low fat|plain, whole milk)/, 'Iogurte natural', 'laticinios', { q: ['gordura'], est: false });
add(/^yogurt, greek, (strawberry|vanilla|fruit|blueberry)(?!.*chobani|.*dannon)/, 'Iogurte grego com fruta', 'laticinios', { q: ['gordura'], est: false, ac: true, u: true });
add(/^yogurt, (fruit|vanilla|chocolate)/, 'Iogurte com sabor', 'laticinios', { q: ['gordura'], est: false, ac: true, u: true, nao: /dessert|bar/ });
add(/^kefir/, 'Kefir', 'laticinios', { est: false, l: true });
const QUEIJOS = { cheddar: 'Queijo cheddar', mozzarella: 'Queijo mussarela', swiss: 'Queijo suíço', parmesan: 'Queijo parmesão', feta: 'Queijo feta', 'cream cheese': 'Cream cheese', cream: 'Cream cheese', brie: 'Queijo brie', camembert: 'Queijo camembert', gouda: 'Queijo gouda', gruyere: 'Queijo gruyère', provolone: 'Queijo provolone', edam: 'Queijo edam', roquefort: 'Queijo roquefort', blue: 'Queijo azul (gorgonzola)', colby: 'Queijo colby', muenster: 'Queijo muenster', romano: 'Queijo romano', fontina: 'Queijo fontina', monterey: 'Queijo monterey jack', ricotta: 'Ricota', cottage: 'Queijo cottage', goat: 'Queijo de cabra', 'queso fresco': 'Queijo fresco (queso fresco)', cotija: 'Queijo cotija', oaxaca: 'Queijo oaxaca', american: 'Queijo tipo americano (fatiado)', neufchatel: 'Queijo neufchâtel' };
for (const [k, nome] of Object.entries(QUEIJOS)) add(new RegExp(`^cheese, (?:pasteurized process, )?${k}(?:,|$)`), nome, 'laticinios', { q: ['gordura'], est: false, nao: /imitation|substitute|spread|food|sauce|topping|low sodium|dietetic|\bfat free\b.*(?!cottage)|kraft|foundation/ , ...(k === 'american' ? { u: true } : {}) });
add(/^cheese, cottage, (creamed|lowfat|nonfat)|^cheese, cottage(?:,|$)/, 'Queijo cottage', 'laticinios', { q: ['gordura'], est: false });
add(/^cream, (fluid, heavy whipping|heavy)|^cream, heavy/, 'Creme de leite fresco (heavy cream)', 'laticinios', { est: false });
add(/^cream, sour, (cultured|regular)|^cream, sour(?:,|$)/, 'Creme azedo (sour cream)', 'laticinios', { est: false });
add(/^cream, fluid, half and half|^cream, half and half/, 'Half and half (leite e creme)', 'laticinios', { est: false });
add(/^butter, (salted|without salt)|^butter(?:,|$)/, 'Manteiga', 'gorduras', { q: ['sal'], est: false, nao: /whipped|oil|clarified/ });
add(/^butter, clarified|ghee/, 'Manteiga clarificada (ghee)', 'gorduras', { est: false });
add(/^ice creams?, (vanilla|chocolate|strawberry)(?!.*(bar|cone|sandwich|sundae|soft))/, 'Sorvete de creme', 'doces', { est: false, u: true, ac: true });
add(/^dulce de leche/, 'Doce de leite', 'doces', { est: false, u: true, ac: true });
add(/^milk, condensed, sweetened|^sweetened condensed milk/, 'Leite condensado', 'laticinios', { est: false, u: true, ac: true });
add(/^whey, (sweet|acid), (dried|fluid)/, 'Soro de leite (whey) em pó', 'laticinios', { est: false, t: true, nao: /fluid/ });
// --- suplementos e bebidas funcionais
add(/^beverages, protein powder whey based|^beverages, whey protein/, 'Whey protein em pó', 'suplementos', { est: false, t: true, apel: ['whey', 'whey protein', 'proteina do soro do leite'] });
add(/^beverages, protein powder soy based|^beverages, abbott, ead soy protein powder|^beverages, abbott, eas soy protein/, 'Proteína de soja em pó (suplemento)', 'suplementos', { est: false, t: true, apel: ['proteina de soja', 'soy protein'] });
add(/^protein supplement, milk based, muscle milk, powder/, 'Suplemento proteico Muscle Milk (pó)', 'suplementos', { est: false, t: true });
add(/^protein supplement, milk based, muscle milk light, powder/, 'Suplemento proteico Muscle Milk Light (pó)', 'suplementos', { est: false, t: true });
add(/^beverages, abbott, ensure plus|^beverages, abbott, ensure, /, 'Ensure (suplemento nutricional pronto)', 'suplementos', { est: false, t: true, l: true });
add(/^beverages, nestle, boost plus/, 'Boost Plus (suplemento nutricional pronto)', 'suplementos', { est: false, t: true, l: true });
add(/^beverages, unilever, slimfast shake mix, powder/, 'SlimFast (pó para shake)', 'suplementos', { est: false, t: true });
add(/^beverages, energy drink, (monster|rockstar|red bull|amp)(?!.*sugar free)|^beverages, energy drink, red bull/, 'Energético (lata)', 'bebidas', { est: false, l: true, b: true, ac: true });
add(/^beverages, (energy drink|energy drink,.*sugar free)/, 'Energético zero açúcar', 'bebidas', { est: false, l: true, nao: /^(?!.*(sugar free|zero))/ });
add(/^beverages, quaker oats, gatorade|^beverages, powerade|^beverages, gatorade/, 'Isotônico', 'bebidas', { est: false, l: true, b: true, ac: true, nao: /zero|powder/ });
add(/^snacks, (granola bars|granola bar), (hard|soft)(?!.*(kashi|quaker))/, 'Barra de granola', 'cereais', { est: false, u: true, ac: true });
add(/^snacks, (protein bar|energy bar|nutri-grain|clif)|^snacks, clif/, 'Barra de cereal/energia', 'cereais', { est: false, u: true, ac: true });
add(/^snacks, kashi.*protein|^snacks, protein bar|^snacks, pure protein/, 'Barra de proteína', 'suplementos', { est: false, t: true, u: true, ac: true });
// --- oleaginosas e sementes
const NOZES = { almonds: 'Amêndoas', 'cashew nuts': 'Castanha de caju', walnuts: 'Nozes', 'brazilnuts': 'Castanha-do-pará', 'brazil nuts': 'Castanha-do-pará', hazelnuts: 'Avelãs', macadamia: 'Macadâmia', pecans: 'Noz-pecã', 'pistachio nuts': 'Pistache', 'pine nuts': 'Pinoli (pinhão-europeu)', peanuts: 'Amendoim', chestnuts: 'Castanha portuguesa', 'mixed nuts': 'Mix de castanhas e nozes', coconut: 'Coco' };
for (const [k, nome] of Object.entries(NOZES)) add(new RegExp(`^nuts, ${k}`), nome, 'oleaginosas', { q: ['torra', 'sal'], est: false, nao: /butter|milk|cream|water|flour|chocolate|candy|glazed|honey|yogurt|oriental|flavor|coated|pinyon|dried \(desiccated\), (sweetened|toasted)|meat, dried|shredded|sweetened|japanese|chinese|european|italian|spanish|stuffed|brand|planters|blanched|raw, dried|paste/ });
add(/^peanuts, all types, (raw|dry-roasted, without salt|dry-roasted, with salt|oil-roasted)/, 'Amendoim', 'oleaginosas', { q: ['torra', 'sal'], est: false });
add(/^peanut butter, (smooth|chunk), (style|without salt)|^peanut butter, smooth style|^peanut butter, creamy/, 'Pasta de amendoim', 'oleaginosas', { est: false, q: ['sal'], apel: ['pasta de amendoim', 'manteiga de amendoim', 'peanut butter'] });
add(/^nuts, almond butter, plain/, 'Pasta de amêndoa', 'oleaginosas', { est: false, apel: ['pasta de amendoa', 'manteiga de amendoa'] });
add(/^seeds, (sunflower seed kernels|sunflower seed kernel)/, 'Semente de girassol', 'oleaginosas', { q: ['torra', 'sal'], est: false });
add(/^seeds, pumpkin and squash seed kernels/, 'Semente de abóbora (pepita)', 'oleaginosas', { q: ['torra', 'sal'], est: false, apel: ['pepita', 'semente de abobora'] });
add(/^seeds, chia seeds/, 'Chia', 'oleaginosas', { est: false, apel: ['semente de chia'] });
add(/^seeds, flaxseed/, 'Linhaça', 'oleaginosas', { est: false });
add(/^seeds, sesame seeds/, 'Gergelim', 'oleaginosas', { est: false, q: [] });
add(/^seeds, hemp seed/, 'Semente de cânhamo', 'oleaginosas', { est: false });
add(/^seeds, sesame butter, (paste|tahini)|^seeds, sesame butter/, 'Tahine (pasta de gergelim)', 'oleaginosas', { est: false });
add(/^hummus/, 'Homus (pasta de grão-de-bico)', 'leguminosas', { est: false, apel: ['homus', 'hummus', 'pasta de grao de bico'] });
// --- legumes e grãos internacionais
add(/^tofu, (raw, firm|raw, regular|firm|extra firm|silken|regular)|^tofu, (raw|fried|salted)|^mori-nu, tofu/, 'Tofu', 'leguminosas', { est: false, nao: /yogurt|fried|prepared with|nigari/ });
add(/^soymilk, (original|unsweetened|plain)|^soy milk, (original|unsweetened)/, 'Leite de soja (bebida)', 'bebidas', { l: true, est: false, q: ['acucar'] });
add(/^beverages, almond milk, (unsweetened|sweetened)/, 'Leite de amêndoas (bebida)', 'bebidas', { l: true, est: false, q: ['acucar'], nao: /chocolate|vanilla/ });
add(/^beverages, oat milk|^oat milk/, 'Leite de aveia (bebida)', 'bebidas', { l: true, est: false });
add(/^beverages, rice milk/, 'Leite de arroz (bebida)', 'bebidas', { l: true, est: false, q: ['acucar'], nao: /chocolate|vanilla/ });
add(/^beverages, coconut milk/, 'Leite de coco (bebida)', 'bebidas', { l: true, est: false, q: ['acucar'], nao: /chocolate|vanilla/ });
add(/^edamame|^soybeans, green, (raw|cooked)/, 'Edamame', 'leguminosas', { estSo: ['cru', 'cozido', ''] });
add(/^tempeh/, 'Tempeh', 'leguminosas', { est: false });
add(/^quinoa/, 'Quinoa', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^oats(?:,|$)|^cereals, oats, regular and quick, not fortified, dry|^cereals, oats, instant/, 'Aveia', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^couscous|^cereals, couscous/, 'Cuscuz marroquino', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^bulgur/, 'Trigo bulgur', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^buckwheat(?:,| groats)|^buckwheat groats/, 'Trigo sarraceno', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^millet/, 'Painço (milheto)', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^amaranth/, 'Amaranto', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^barley, pearled/, 'Cevada', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^rice, wild/, 'Arroz selvagem', 'cereais', { estSo: ['cru', 'cozido', ''] });
add(/^pasta, (whole-wheat|spinach)/, null, 'cereais', { estSo: ['cru', 'cozido', ''], trad2: { 'whole-wheat': 'Macarrão integral', spinach: 'Macarrão de espinafre' } });
add(/^noodles, (egg|rice|soba|udon|chinese|japanese|spaghetti|flat)/, null, 'cereais', { estSo: ['cru', 'cozido', ''], trad2: { egg: 'Macarrão de ovos', rice: 'Macarrão de arroz', soba: 'Macarrão soba', udon: 'Macarrão udon', chinese: 'Macarrão chinês', japanese: 'Macarrão japonês', spaghetti: 'Espaguete', flat: 'Macarrão achatado' } });
add(/^tortillas?, (ready-to-bake or -fry, )?(corn|flour)/, null, 'cereais', { est: false, trad2: { corn: 'Tortilha de milho', flour: 'Tortilha de trigo' } });
add(/^bread, (naan|pita|bagel|english muffin|croissant|rye|whole-wheat|multi-grain|oat bran|pumpernickel|french or vienna|italian|cornbread)|^bagels, plain|^croissants, butter|^english muffins, plain/, null, 'cereais', { est: false, u: false, trad2: { naan: 'Pão naan', pita: 'Pão sírio (pita)', bagel: 'Bagel', 'english muffin': 'English muffin', croissant: 'Croissant', rye: 'Pão de centeio', 'whole-wheat': 'Pão integral', 'multi-grain': 'Pão multigrãos', 'oat bran': 'Pão de farelo de aveia', pumpernickel: 'Pão pumpernickel', 'french or vienna': 'Pão tipo francês/vienense', italian: 'Pão italiano', cornbread: 'Pão de milho (cornbread)' }, nao: /crumbs|stuffing|mix|dry|toasted|toast|raisin|sweet|egg|cinnamon|gluten/ });
add(/^cereals ready-to-eat,.*(corn flakes|froot loops|cheerios|special k|rice krispies|raisin bran|frosted flakes|frosted mini-wheats|honey nut cheerios|apple jacks|honey smacks|cap'?n crunch|lucky charms|cocoa puffs|trix|fruity)/, null, 'cereais', { est: false, u: true, ac: true, trad2: { 'corn flakes': 'Corn Flakes (cereal matinal)', 'froot loops': 'Froot Loops (cereal matinal)', cheerios: 'Cheerios (cereal matinal)', 'special k': 'Special K (cereal matinal)', 'rice krispies': 'Rice Krispies (cereal matinal)', 'raisin bran': 'Raisin Bran (cereal matinal)', 'frosted flakes': 'Sucrilhos (Frosted Flakes)', 'frosted mini-wheats': 'Mini-Wheats (cereal matinal)', 'honey nut cheerios': 'Honey Nut Cheerios', 'apple jacks': 'Apple Jacks (cereal matinal)', "cap'n crunch": "Cap'n Crunch (cereal matinal)", "capn crunch": "Cap'n Crunch (cereal matinal)", 'lucky charms': 'Lucky Charms (cereal matinal)', 'cocoa puffs': 'Cocoa Puffs (cereal matinal)', trix: 'Trix (cereal matinal)' } });
const FARELHOS = [[/^oat bran/, 'Farelo de aveia'], [/^wheat bran/, 'Farelo de trigo'], [/^wheat germ/, 'Germe de trigo (USDA)'], [/^(soy flour|flour, soy)/, 'Farinha de soja'], [/^flour, almond|^nuts, almond flour/, 'Farinha de amêndoa'], [/^flour, coconut|^nuts, coconut flour/, 'Farinha de coco'], [/^flour, oat|^oat flour/, 'Farinha de aveia (USDA)'], [/^(rice flour|flour, rice), (white|brown)/, 'Farinha de arroz (USDA)'], [/^rye flour/, 'Farinha de centeio'], [/^flour, (chickpea|garbanzo)|^chickpea flour/, 'Farinha de grão-de-bico'], [/^flour, quinoa/, 'Farinha de quinoa'], [/^flour, buckwheat|^buckwheat flour/, 'Farinha de trigo sarraceno'], [/^cereals, oats, regular and quick/, 'Aveia em flocos (USDA)'], [/^granola|^cereals ready-to-eat, granola/, 'Granola (USDA)']];
for (const [re, nome] of FARELHOS) add(re, nome, 'cereais', { est: false, nao: /enriched|kashi|quaker|prepared|cooked|instant|cinnamon|apple|raisin|mix|fortified|restaurant|peach/ });
// --- frutas e sucos (as que não têm equivalente na TACO entram; as demais são fundidas)
const FRUTAS = { blueberries: 'Mirtilo (blueberry)', raspberries: 'Framboesa', blackberries: 'Amora-preta', cranberries: 'Cranberry', kiwifruit: 'Kiwi', pomegranates: 'Romã', cherries: 'Cereja', apricots: 'Damasco', nectarines: 'Nectarina', peaches: 'Pêssego', plums: 'Ameixa', pears: 'Pera', apples: 'Maçã', grapes: 'Uva', 'grapefruit': 'Toranja (grapefruit)', lemons: 'Limão-siciliano', limes: 'Limão', oranges: 'Laranja', tangerines: 'Tangerina', melons: 'Melão', avocados: 'Abacate', figs: 'Figo', dates: 'Tâmara', raisins: 'Uva-passa', prunes: 'Ameixa seca', papayas: 'Mamão', mangos: 'Manga', pineapple: 'Abacaxi', strawberries: 'Morango', bananas: 'Banana', watermelon: 'Melancia', plantains: 'Banana-da-terra', persimmons: 'Caqui', guavas: 'Goiaba', 'passion-fruit': 'Maracujá', cantaloupe: 'Melão cantalupe', 'dried apricots': 'Damasco seco', 'currants': 'Groselha', 'elderberries': 'Sabugueiro (frutos)', gooseberries: 'Groselha-espinhosa', lychees: 'Lichia', rhubarb: 'Ruibarbo', tamarinds: 'Tamarindo', mulberries: 'Amora' };
for (const [k, nome] of Object.entries(FRUTAS)) add(new RegExp(`^${k}, (raw|dried|frozen)(?:,|$)`), nome, 'frutas', { estSo: ['cru', 'seco', 'congelado', ''], q: ['casca'], nao: /canned|syrup|juice|sauce|concentrate|baby|glaze|candied|infused|sweetened/ });
const SUCOS = { 'orange juice': 'Suco de laranja', 'apple juice': 'Suco de maçã', 'grape juice': 'Suco de uva', 'grapefruit juice': 'Suco de toranja', 'pineapple juice': 'Suco de abacaxi', 'cranberry juice cocktail': 'Coquetel de cranberry', 'cranberry juice': 'Suco de cranberry', 'tomato juice': 'Suco de tomate', 'prune juice': 'Suco de ameixa seca', 'lemon juice': 'Suco de limão', 'lime juice': 'Suco de limão (lima)', 'carrot juice': 'Suco de cenoura', 'pomegranate juice': 'Suco de romã', 'passion-fruit juice': 'Suco de maracujá', 'papaya nectar': 'Néctar de mamão', 'mango nectar': 'Néctar de manga', 'peach nectar': 'Néctar de pêssego', 'pear nectar': 'Néctar de pera', 'apricot nectar': 'Néctar de damasco', 'coconut water': 'Água de coco', 'vegetable juice': 'Suco de vegetais (V8)' };
for (const [k, nome] of Object.entries(SUCOS)) add(new RegExp(`^${k}, (canned or bottled|chilled|raw|canned|bottled|ready-to-drink|unsweetened|frozen concentrate, unsweetened, diluted|from concentrate)`), nome, 'bebidas', { est: false, l: true, ac: true, q: ['acucar'], nao: /undiluted|baby|with added (calcium|vitamin)|light|low acid/ });
add(/^beverages, coconut water, ready-to-drink, unsweetened/, 'Água de coco', 'bebidas', { est: false, l: true });
// --- bebidas
add(/^beverages, carbonated, (cola|root beer|ginger ale|lemon-lime|orange|grape|tonic water|club soda)/, null, 'bebidas', { est: false, l: true, b: true, ac: true, trad2: { cola: 'Refrigerante de cola', 'root beer': 'Root beer (refrigerante)', 'ginger ale': 'Ginger ale', 'lemon-lime': 'Refrigerante de limão', orange: 'Refrigerante de laranja', grape: 'Refrigerante de uva', 'tonic water': 'Água tônica', 'club soda': 'Água com gás' }, nao: /low calorie|diet|sugar-free|aspartame|sucralose|zero|decaf|without caffeine|high caffeine|sweetener|contains/ });
add(/^beverages, carbonated, (cola|lemon-lime), (low calorie|diet).*aspartame|^beverages, carbonated, cola, low calorie, with aspartame/, 'Refrigerante de cola zero/diet', 'bebidas', { est: false, l: true });
add(/^beverages, (coffee, brewed, (breakfast blend|prepared with tap water|espresso, restaurant-prepared)|coffee, brewed)/, 'Café preparado', 'bebidas', { est: false, l: true, nao: /decaf|instant|ready/ , apel: ['cafe preto'] });
add(/^beverages, coffee, brewed, espresso, restaurant-prepared(?!.*decaf)/, 'Café expresso', 'bebidas', { est: false, l: true });
add(/^beverages, tea, (black|green), brewed, prepared with tap water(?!.*decaf)/, null, 'bebidas', { est: false, l: true, trad2: { black: 'Chá preto preparado', green: 'Chá verde preparado' }, apel2: { black: ['cha preto'], green: ['cha verde'] } });
add(/^beverages, tea, (black|green), ready-to-drink, (lemon, )?sweetened|^beverages, tea, black, ready to drink, lemon, sweetened/, null, 'bebidas', { est: false, l: true, b: true, ac: true, trad2: { black: 'Chá gelado adoçado (preto)', green: 'Chá gelado adoçado (verde)' } });
add(/^alcoholic beverage, beer, (regular|light), all|^alcoholic beverages?, beer, (regular|light)/, null, 'bebidas', { est: false, l: true, trad2: { regular: 'Cerveja', light: 'Cerveja light' } });
add(/^alcoholic beverage, wine, table, (red|white|rose)(?!,)/, null, 'bebidas', { est: false, l: true, trad2: { red: 'Vinho tinto', white: 'Vinho branco', rose: 'Vinho rosé' } });
add(/^alcoholic beverage, distilled, all \(gin, rum, vodka, whiskey\) 80 proof/, 'Destilado 40% (vodca, gin, rum, uísque)', 'bebidas', { est: false, l: true, apel: ['vodka', 'vodca', 'gin', 'rum', 'whisky', 'uisque'] });
add(/^alcoholic beverage, (pina colada|daiquiri|whiskey sour|tequila sunrise|cosmopolitan|margarita)/, null, 'bebidas', { est: false, l: true, ac: true, trad2: { 'pina colada': 'Piña colada', daiquiri: 'Daiquiri', 'whiskey sour': 'Whiskey sour', 'tequila sunrise': 'Tequila sunrise', cosmopolitan: 'Cosmopolitan', margarita: 'Margarita' }, nao: /mix|canned|powder/ });
add(/^beverages, lemonade, (powder|frozen)/, 'Limonada (preparada)', 'bebidas', { est: false, l: true, b: true, ac: true, nao: /powder|frozen/ });
add(/^beverages, water, (bottled|tap)/, 'Água', 'bebidas', { est: false, l: true, nao: /flavor|vitamin|berry|yumberry|tonic|carbonated|zero|Perrier/ });
add(/^beverages, cocoa mix, powder|^beverages, chocolate-flavor beverage mix for milk, powder/, 'Achocolatado em pó', 'doces', { est: false, u: true, ac: true });
add(/^beverages, (malted drink mix, chocolate|ovaltine, classic malt)|^beverages, ovaltine/, 'Ovomaltine/Ovaltine (pó)', 'doces', { est: false, u: true, ac: true, apel: ['ovomaltine', 'ovaltine'] });
// --- doces e snacks importados comuns
add(/^candies, (snickers bar|mars snackfood us, snickers bar)/, 'Snickers (barra)', 'doces', { est: false, u: true, ac: true, apel: ['snickers'] });
add(/^candies, (mars snackfood us, )?(m&m'?s|m&m mars)(?!.*(peanut butter|almond|mint|pretzel|crispy))/, 'M&M\'s', 'doces', { est: false, u: true, ac: true, apel: ['m&ms', 'mms'] });
add(/^candies, (m&m'?s|m&m mars), peanut(?!.*butter)/, 'M&M\'s de amendoim', 'doces', { est: false, u: true, ac: true });
add(/^candies, milk chocolate(?!.*(coated|with))/, 'Chocolate ao leite', 'doces', { est: false, u: true, ac: true });
add(/^candies, (semisweet chocolate|dark chocolate)(?!.*(coated|made with))|^candies, chocolate, dark, 70-85% cacao solids|^candies, dark chocolate, 45- 59% cacao solids|^candies, dark chocolate, 60-69% cacao/, null, 'doces', { est: false, u: true, ac: true, ttl: 'dark', nao: /syrup/ });
add(/^candies, white chocolate/, 'Chocolate branco', 'doces', { est: false, u: true, ac: true });
add(/^candies, kit kat|^candies, nestle, crunch bar/, 'Kit Kat', 'doces', { est: false, u: true, ac: true, nao: /^(?!.*kit kat)/ });
add(/^candies, reese'?s peanut butter cups|^candies, hershey'?s, reese'?s peanut butter cups|^candies, reese's, peanut butter cups/, 'Reese\'s (copinhos de pasta de amendoim)', 'doces', { est: false, u: true, ac: true });
add(/^candies, twix/, 'Twix', 'doces', { est: false, u: true, ac: true });
add(/^candies, (mars snackfood us, )?milky way bar|^candies, milky way/, 'Milky Way', 'doces', { est: false, u: true, ac: true, nao: /caramel|dark/ });
add(/^candies, (hershey'?s |hersheys )?(milk chocolate|special dark)|^candies, hershey/, 'Chocolate Hershey\'s', 'doces', { est: false, u: true, ac: true, nao: /^(?!.*(milk chocolate|special dark)).*$/ });
add(/^candies, gumdrops|^candies, jellybeans|^candies, gummy bears|^candies, jelly beans/, 'Balas de goma (jelly beans)', 'doces', { est: false, u: true, ac: true });
add(/^candies, marshmallows/, 'Marshmallow', 'doces', { est: false, u: true, ac: true });
add(/^candies, hard/, 'Bala dura', 'doces', { est: false, u: true, ac: true });
add(/^candies, caramels/, 'Caramelo (bala mole)', 'doces', { est: false, u: true, ac: true });
add(/^candies, fudge, chocolate(?!.*(nuts))/, 'Fudge de chocolate', 'doces', { est: false, u: true, ac: true });
add(/^candies, truffles/, 'Trufa de chocolate', 'doces', { est: false, u: true, ac: true });
add(/^snacks, potato chips, (plain|barbecue|sour|salted)|^snacks, potato chips, plain, salted/, null, 'fastfood', { est: false, u: true, trad2: { plain: 'Batata chips', barbecue: 'Batata chips sabor churrasco', sour: 'Batata chips sabor cebola e creme azedo', salted: 'Batata chips salgada' } });
add(/^snacks, tortilla chips, (plain|nacho|ranch)|^snacks, tortilla chips/, 'Tortilla chips (nachos)', 'fastfood', { est: false, u: true, nao: /^(?!.*plain)/ });
add(/^snacks, popcorn, (air-popped|oil-popped)/, null, 'cereais', { est: false, trad2: { 'air-popped': 'Pipoca sem óleo (estourada no ar)', 'oil-popped': 'Pipoca de panela (com óleo)' } });
add(/^snacks, pretzels, hard, plain/, 'Pretzel', 'fastfood', { est: false, u: true, nao: /whole|unenriched|gluten|low sodium|unsalted/ });
add(/^snacks, rice cakes, brown rice, plain/, 'Bolinho de arroz integral (rice cake)', 'cereais', { est: false, apel: ['rice cake', 'bolacha de arroz'] });
add(/^cookies, (chocolate chip|oatmeal|sugar|butter|fortune|gingersnaps|peanut butter|shortbread|chocolate sandwich)(?!.*(dough|refrigerated|dietetic|raisin|reduced|low))/, null, 'doces', { est: false, u: true, ac: true, trad2: { 'chocolate chip': 'Cookie com gotas de chocolate', oatmeal: 'Cookie de aveia', sugar: 'Cookie de açúcar', butter: 'Biscoito amanteigado', fortune: 'Biscoito da sorte', gingersnaps: 'Biscoito de gengibre', 'peanut butter': 'Cookie de pasta de amendoim', shortbread: 'Shortbread (biscoito amanteigado)', 'chocolate sandwich': 'Biscoito recheado de chocolate (tipo Oreo)' }, nao: /dough|refrigerated|dietetic|sandwich, with extruded|raisin|reduced|low|fat free|snack|cream filling|vanilla|oreo/ });
add(/^cake, (chocolate|yellow|angelfood|pound|carrot|cheesecake|sponge|white)(?!.*(dry mix|frozen|with|from|prepared from))/, null, 'doces', { est: false, u: true, ac: true, trad2: { chocolate: 'Bolo de chocolate', yellow: 'Bolo amarelo', angelfood: 'Bolo pão de ló (angel food)', pound: 'Bolo inglês (pound cake)', carrot: 'Bolo de cenoura com cobertura', cheesecake: 'Cheesecake', sponge: 'Pão de ló', white: 'Bolo branco' }, nao: /mix|dietetic|gluten|bimbo|box|dry|rich|commercially prepared, (chocolate|vanilla)/ });
add(/^pie, (apple|pumpkin|pecan|lemon meringue|blueberry|cherry)(?!.*(frozen|dietetic|mix))/, null, 'doces', { est: false, u: true, ac: true, trad2: { apple: 'Torta de maçã', pumpkin: 'Torta de abóbora', pecan: 'Torta de noz-pecã', 'lemon meringue': 'Torta de limão com merengue', blueberry: 'Torta de mirtilo', cherry: 'Torta de cereja' } });
add(/^pancakes, plain|^pancakes, buttermilk|^syrups?, maple|^syrup, maple/, null, 'doces', { est: false, trad3: true });
add(/^honey(?:,|$)/, 'Mel', 'doces', { est: false, ac: true });
add(/^peanut spread|^chocolate-flavor hazelnut spread|^spread, chocolate hazelnut|^nutella/, 'Creme de avelã com cacau (Nutella)', 'doces', { est: false, u: true, ac: true });
add(/^jams and preserves|^jams, preserves/, 'Geleia de frutas', 'doces', { est: false, u: true, ac: true, nao: /reduced|sugar|low|dietetic/ });
add(/^sugars, (granulated|brown|powdered)/, null, 'doces', { est: false, ac: true, trad2: { granulated: 'Açúcar refinado', brown: 'Açúcar mascavo', powdered: 'Açúcar de confeiteiro' } });
add(/^cookies, brownies, commercially prepared/, 'Brownie', 'doces', { est: false, u: true, ac: true });
add(/^crackers, (saltines|water biscuits|melba toast, plain)/, 'Biscoito salgado tipo água e sal/saltine', 'cereais', { est: false, u: true, nao: /unsalted|low/ });
add(/^sauce, pesto, ready-to-serve, refrigerated/, 'Molho pesto', 'outros', { est: false });
add(/^margarine, regular, 80% fat, composite, stick/, 'Margarina 80% de gordura', 'gorduras', { est: false, u: true, nao: /without salt/ });
add(/^snacks, popcorn, cheese-flavor/, 'Pipoca sabor queijo', 'cereais', { est: false, u: true });
add(/^snacks, corn-based, extruded, chips, plain/, 'Salgadinho de milho extrusado', 'fastfood', { est: false, u: true });
add(/^french toast, prepared from recipe/, 'Rabanada (French toast)', 'doces', { est: false, nao: /low fat/ });
add(/^restaurant, italian, (spaghetti with meat sauce|spaghetti with pomodoro sauce \(no meat\)|lasagna|fettuccine alfredo)/, null, 'pratos', { est: false, trad3: true });
add(/^olive garden, lasagna classico/, 'Lasanha à bolonhesa (restaurante)', 'pratos', { est: false });
// --- gorduras e molhos
const OLEOS = { olive: 'Azeite de oliva', canola: 'Óleo de canola', corn: 'Óleo de milho', soybean: 'Óleo de soja', sunflower: 'Óleo de girassol', coconut: 'Óleo de coco', peanut: 'Óleo de amendoim', sesame: 'Óleo de gergelim', safflower: 'Óleo de cártamo', palm: 'Óleo de palma', 'avocado': 'Óleo de abacate', 'flaxseed': 'Óleo de linhaça' };
for (const [k, nome] of Object.entries(OLEOS)) add(new RegExp(`^oil, ${k}(?:,|$)`), nome, 'gorduras', { est: false, nao: /industrial|salad or cooking|high oleic|with|spray|partially|hydrogenated|nutrasweet|mid/ });
add(/^salad dressing, mayonnaise, regular|^mayonnaise(?:,|$)/, 'Maionese', 'gorduras', { est: false, u: true, nao: /light|low|reduced|fat free|soybean|imitation/ });
add(/^salad dressing, (ranch|italian|caesar|blue or roquefort|french|thousand island)(?!.*(fat free|reduced|low|light|diet))|^dressing, ranch|^salad dressing, italian dressing/, null, 'gorduras', { est: false, u: true, trad2: { ranch: 'Molho ranch', italian: 'Molho italiano (salada)', caesar: 'Molho caesar', 'blue or roquefort': 'Molho de queijo azul', french: 'Molho francês (salada)', 'thousand island': 'Molho mil ilhas' } });
add(/^sauce, (barbecue|teriyaki|hoisin|pizza|pasta, spaghetti|salsa|soy sauce|fish sauce|worcestershire|sweet and sour|hot chile|tartar)|^soy sauce made from soy|^sauce, salsa/, null, 'outros', { est: false, trad2: { barbecue: 'Molho barbecue', teriyaki: 'Molho teriyaki', hoisin: 'Molho hoisin', pizza: 'Molho de pizza', 'pasta, spaghetti': 'Molho de tomate para massa', salsa: 'Molho salsa (tomate e pimenta)', 'soy sauce': 'Molho de soja (shoyu)', 'fish sauce': 'Molho de peixe', worcestershire: 'Molho inglês', 'sweet and sour': 'Molho agridoce', 'hot chile': 'Molho de pimenta', tartar: 'Molho tártaro' }, nao: /low sodium|reduced|dry|mix|canned|homemade|instant/ });
add(/^catsup|^ketchup/, 'Ketchup', 'outros', { est: false, u: true });
add(/^mustard, prepared, yellow/, 'Mostarda', 'outros', { est: false });
add(/^vinegar, (cider|balsamic|distilled|red wine)/, null, 'outros', { est: false, trad2: { cider: 'Vinagre de maçã', balsamic: 'Vinagre balsâmico', distilled: 'Vinagre branco', 'red wine': 'Vinagre de vinho tinto' } });
// --- vegetais que a TACO não tem (ou tem só alguns)
const VEG = { asparagus: 'Aspargo', 'brussels sprouts': 'Couve-de-bruxelas', cauliflower: 'Couve-flor', broccoli: 'Brócolis', kale: 'Couve kale', spinach: 'Espinafre', zucchini: 'Abobrinha italiana', 'squash, summer': 'Abobrinha', 'squash, winter, butternut': 'Abóbora cabotiá (butternut)', 'squash, winter, spaghetti': 'Abóbora-espaguete', celery: 'Salsão (aipo)', cucumber: 'Pepino', mushrooms: 'Cogumelo', 'mushrooms, white': 'Champignon', 'mushrooms, shiitake': 'Cogumelo shiitake', 'mushrooms, portabella': 'Cogumelo portobello', 'peppers, sweet, red': 'Pimentão vermelho', 'peppers, sweet, green': 'Pimentão verde', 'peppers, sweet, yellow': 'Pimentão amarelo', 'peppers, jalapeno': 'Pimenta jalapeño', 'lettuce, cos or romaine': 'Alface romana', 'lettuce, iceberg': 'Alface americana', 'lettuce, green leaf': 'Alface lisa', 'lettuce, red leaf': 'Alface roxa', 'cabbage, chinese (pak-choi)': 'Acelga chinesa (pak choi)', 'cabbage, red': 'Repolho roxo', 'cabbage, napa': 'Repolho chinês (napa)', 'sweet potato': 'Batata-doce', 'peas, green': 'Ervilha verde', 'corn, sweet, yellow': 'Milho-doce amarelo', artichokes: 'Alcachofra', leeks: 'Alho-poró', 'onions, sweet': 'Cebola doce', 'onions, spring or scallions': 'Cebolinha (cebolinha verde)', radishes: 'Rabanete', turnips: 'Nabo', beets: 'Beterraba', eggplant: 'Berinjela', okra: 'Quiabo', parsnips: 'Pastinaca', fennel: 'Erva-doce (funcho)', arugula: 'Rúcula', 'bamboo shoots': 'Broto de bambu', 'bean sprouts': 'Broto de feijão', 'seaweed, kelp': 'Alga kelp', 'seaweed, nori': 'Alga nori', 'seaweed, wakame': 'Alga wakame', 'pumpkin': 'Abóbora', 'carrots': 'Cenoura', 'tomatoes, red, ripe': 'Tomate', 'potatoes, russet': 'Batata russet', 'potatoes, red': 'Batata vermelha', 'potatoes, white': 'Batata branca', 'potatoes, baked': 'Batata assada', 'avocados': 'Abacate', garlic: 'Alho', ginger: 'Gengibre', 'olives, ripe': 'Azeitona preta', 'pickles, cucumber': 'Picles de pepino', sauerkraut: 'Chucrute', kimchi: 'Kimchi' };
for (const [k, nome] of Object.entries(VEG)) add(new RegExp(`^${k.replace(/[()]/g, '\\$&')}(?:, |$)`), nome, 'verduras', { estSo: ['cru', 'cozido', 'assado', 'frito', 'conserva', ''], q: [], nao: /canned|frozen|dehydrated|dried|baby|babyfood|juice|puree|sauce|flour|chips|mashed|au gratin|stuffed|french fries|hash|salad|soup|infant|pickled|leaves|sprouted|immature|lye/ });
add(/^potatoes, (french fried|frozen, french fried)|^potato, french fries|^potatoes, french fried, all types, salt added in processing, frozen, (home-prepared, )?oven heated/, 'Batata frita congelada (assada no forno)', 'fastfood', { est: false, u: true });
add(/^potatoes, mashed, (home-prepared|dehydrated, prepared)/, 'Purê de batata', 'feculentos', { est: false });
add(/^beans, (kidney|pinto|navy|black|great northern|cannellini|lima|white|garbanzo|fava|adzuki|mung|snap, green)|^chickpeas|^lentils|^peas, (split|green)/, null, 'leguminosas', { estSo: ['cru', 'cozido', 'conserva', ''], nao: /canned|frozen|sprouted|immature|babyfood|dry mix|chili|baked|refried|flour|soup|young|french|yardlong|pods|yellow|, with salt|sauce/, trad3: true });
// --- fast food e restaurantes (marcas comuns no Brasil)
add(/^mcdonald's, big mac$/, 'Big Mac (McDonald\'s, USDA)', 'fastfood', { est: false, u: true });
add(/^mcdonald's, cheeseburger$/, 'McDonald\'s Cheeseburger', 'fastfood', { est: false, u: true });
add(/^mcdonald's, hamburger$/, 'McDonald\'s Hambúrguer', 'fastfood', { est: false, u: true });
add(/^mcdonald's, double cheeseburger$/, 'McDonald\'s Duplo Cheeseburger', 'fastfood', { est: false, u: true });
add(/^mcdonald's, mcchicken sandwich$|^mcdonald's, mcchicken/, 'McDonald\'s McChicken', 'fastfood', { est: false, u: true });
add(/^mcdonald's, filet-o-fish$|^mcdonald's, filet-o-fish \(without tartar sauce\)/, 'McDonald\'s Filet-o-Fish', 'fastfood', { est: false, u: true });
add(/^mcdonald's, hash brown/, 'McDonald\'s Hash Brown (batata rösti)', 'fastfood', { est: false, u: true });
add(/^mcdonald's, mcflurry with oreo cookies/, 'McFlurry com Oreo (McDonald\'s)', 'doces', { est: false, u: true, ac: true });
add(/^mcdonald's, sausage mcmuffin$/, 'McDonald\'s Sausage McMuffin', 'fastfood', { est: false, u: true });
add(/^mcdonald's, bacon, egg & cheese biscuit/, 'McDonald\'s Bacon, Ovo e Queijo no biscoito', 'fastfood', { est: false, u: true });
add(/^burger king, whopper$|^burger king, whopper, no cheese/, 'Burger King Whopper', 'fastfood', { est: false, u: true });
add(/^burger king, whopper, with cheese/, 'Burger King Whopper com queijo', 'fastfood', { est: false, u: true });
add(/^burger king, double whopper$|^burger king, double whopper, no cheese/, 'Burger King Duplo Whopper', 'fastfood', { est: false, u: true });
add(/^burger king, hamburger$/, 'Burger King Hambúrguer', 'fastfood', { est: false, u: true });
add(/^burger king, cheeseburger$/, 'Burger King Cheeseburger', 'fastfood', { est: false, u: true });
add(/^burger king, double cheeseburger$/, 'Burger King Duplo Cheeseburger', 'fastfood', { est: false, u: true });
add(/^burger king, premium fish sandwich/, 'Burger King sanduíche de peixe', 'fastfood', { est: false, u: true });
add(/^wendy's, classic single hamburger, with cheese/, 'Wendy\'s Classic Single com queijo', 'fastfood', { est: false, u: true });
add(/^wendy's, frosty dairy dessert/, 'Wendy\'s Frosty (sobremesa gelada)', 'doces', { est: false, u: true, ac: true });
add(/^subway, (oven roasted chicken|tuna|black forest ham|turkey breast|steak & cheese|meatball marinara|roast beef|b\.l\.t\.|veggie delite|italian b\.m\.t\.)[^,]* sub/, null, 'fastfood', { est: false, u: true, subway: true });
add(/^kfc, fried chicken, original recipe, (breast|thigh|drumstick|wing), meat and skin with breading/, null, 'fastfood', { est: false, u: true, kfc: true });
add(/^kfc, coleslaw|^kfc, mashed potatoes/, null, 'fastfood', { est: false, u: true, trad3: true });
add(/^(domino's|pizza hut) 14" (cheese|pepperoni|sausage) pizza, (classic hand-tossed crust|hand-tossed crust|thin 'n crispy crust|crunchy thin crust|pan crust)/, null, 'fastfood', { est: false, u: true, pizza: true });
add(/^fast foods?, (french fries|potato, french fried|fish sandwich|hamburger|cheeseburger|chicken tenders|onion rings|nachos|coleslaw|taco|burrito|egg, scrambled|submarine)/, null, 'fastfood', { est: false, u: true, ff: true, nao: /condiments|large|double/ });
add(/^fast foods?, onion rings, breaded and fried|^fast foods?, french fries/, null, 'fastfood', { est: false, u: true, ff: true });
add(/^pizza, (cheese|pepperoni|meat and vegetable|meat) topping, (regular|thin|rising|thick) crust, frozen, cooked|^pizza, cheese topping, rising crust, frozen, cooked/, null, 'fastfood', { est: false, u: true, pizzaCongelada: true });
add(/^fast foods?, nuggets|^chicken, nuggets|^fast foods?, chicken, breaded and fried, boneless pieces, plain/, 'Nuggets de frango (fast food)', 'fastfood', { est: false, u: true });
add(/^restaurant, chinese, (fried rice, without meat|orange chicken|sweet and sour pork|general tso)|^restaurant, chinese, kung pao|^restaurant, latino, tamale/, null, 'pratos', { est: false, trad3: true });
add(/^soup, (chicken noodle|tomato|chicken broth|beef broth|minestrone|vegetable)[^,]*, canned, (condensed|prepared with equal volume water|ready-to-serve)/, null, 'pratos', { est: false, l: true, trad2b: true, nao: /low sodium|reduced|chunky|healthy|with/ });
add(/^macaroni and cheese, (box mix with cheese sauce, prepared|canned entree)/, 'Macarrão com queijo (mac and cheese)', 'pratos', { est: false, u: true });
add(/^egg rolls, (chicken|pork)|^pizza rolls|^dumpling/, null, 'pratos', { est: false, u: true, nada: true });

export const REGRAS = R;
// (as regras que dependem de tradução de captura ficam resolvidas em nomeDe)

// ---------------------------------------------------------------------------------------------
const OVO_EST = { raw: 'Ovo de galinha cru', 'cooked, hard-boiled': 'Ovo de galinha cozido', 'cooked, poached': 'Ovo de galinha pochê', 'cooked, scrambled': 'Ovo de galinha mexido', 'cooked, fried': 'Ovo de galinha frito', 'cooked, omelet': 'Omelete' };
const SUBWAY = { 'oven roasted chicken': 'Subway sanduíche de frango assado', tuna: 'Subway sanduíche de atum', 'black forest ham': 'Subway sanduíche de presunto', 'turkey breast': 'Subway sanduíche de peito de peru', 'steak & cheese': 'Subway sanduíche de bife com queijo', 'meatball marinara': 'Subway sanduíche de almôndegas', 'roast beef': 'Subway sanduíche de rosbife', 'b.l.t.': 'Subway sanduíche de bacon, alface e tomate', 'veggie delite': 'Subway sanduíche vegetariano', 'italian b.m.t.': 'Subway sanduíche italiano' };
const FF = { 'french fries': 'Batata frita de fast food', 'potato, french fried': 'Batata frita de fast food', 'fish sandwich': 'Sanduíche de peixe (fast food)', hamburger: 'Hambúrguer (fast food)', cheeseburger: 'Cheeseburger (fast food)', 'chicken tenders': 'Tiras de frango empanado (fast food)', 'onion rings': 'Anéis de cebola empanados (onion rings)', nachos: 'Nachos com queijo', coleslaw: 'Salada de repolho (coleslaw)', taco: 'Taco', burrito: 'Burrito', 'egg, scrambled': 'Ovo mexido (fast food)', submarine: 'Sanduíche submarino' };
const TRAD3 = [
  [/^pancakes, plain/, 'Panqueca americana'], [/^pancakes, buttermilk/, 'Panqueca americana de leitelho'], [/^syrups?, maple/, 'Xarope de bordo (maple syrup)'],
  [/^kfc, coleslaw/, 'KFC salada de repolho (coleslaw)'], [/^kfc, mashed potatoes/, 'KFC purê de batata'],
  [/^restaurant, chinese, fried rice, without meat/, 'Arroz frito chinês (sem carne)'], [/^restaurant, chinese, orange chicken/, 'Frango à laranja (restaurante chinês)'], [/^restaurant, chinese, sweet and sour pork/, 'Porco agridoce (restaurante chinês)'],
  [/^restaurant, italian, spaghetti with meat sauce/, 'Espaguete à bolonhesa (restaurante)'], [/^restaurant, italian, spaghetti with pomodoro/, 'Espaguete ao sugo (restaurante)'], [/^restaurant, italian, lasagna/, 'Lasanha (restaurante)'], [/^restaurant, italian, fettuccine alfredo/, 'Fettuccine Alfredo'],
  [/^restaurant, chinese, general tso/, 'Frango General Tso (restaurante chinês)'], [/^restaurant, chinese, kung pao/, 'Frango Kung Pao'], [/^restaurant, latino, tamale/, 'Tamale (restaurante latino)'],
  [/^beans, kidney/, 'Feijão-vermelho (kidney)'], [/^beans, pinto/, 'Feijão-pinto'], [/^beans, navy/, 'Feijão-branco pequeno (navy)'], [/^beans, black/, 'Feijão-preto'], [/^beans, great northern/, 'Feijão-branco (great northern)'],
  [/^beans, cannellini/, 'Feijão cannellini'], [/^beans, lima/, 'Feijão-fava (lima)'], [/^beans, white/, 'Feijão-branco'], [/^beans, garbanzo|^chickpeas/, 'Grão-de-bico'], [/^beans, fava/, 'Fava'], [/^beans, adzuki/, 'Feijão-azuki'], [/^beans, mung/, 'Feijão-mungo'],
  [/^beans, snap, green/, 'Vagem'], [/^lentils/, 'Lentilha'], [/^peas, split/, 'Ervilha partida'], [/^peas, green/, 'Ervilha verde'],
];
const DARK = (d) => /70-85%|85%/.test(d) ? 'Chocolate amargo 70-85% cacau' : /60-69%/.test(d) ? 'Chocolate amargo 60-69% cacau' : /45- ?59%/.test(d) ? 'Chocolate amargo 45-59% cacau' : /semisweet/.test(d) ? 'Chocolate meio amargo (gotas)' : 'Chocolate amargo';

function nomeDe(r, d, m) {
  if (typeof r.nome === 'function') return r.nome(m);
  if (r.nome) return r.nome;
  if (r.ovo) { const k = Object.keys(OVO_EST).find(x => d.includes(x)); return OVO_EST[k]; }
  if (r.trad) { const k = Object.keys(r.trad).find(x => d.startsWith(x)); return r.trad[k]; }
  if (r.trad2) { const k = Object.keys(r.trad2).sort((a, b) => b.length - a.length).find(x => d.includes(x)); return k ? r.trad2[k] : null; }
  if (r.subway) { const k = Object.keys(SUBWAY).find(x => d.includes(x)); return k ? SUBWAY[k] : null; }
  if (r.kfc) { const k = ['breast', 'thigh', 'drumstick', 'wing'].find(x => d.includes(x)); return { breast: 'KFC frango frito peito', thigh: 'KFC frango frito sobrecoxa', drumstick: 'KFC frango frito coxa', wing: 'KFC frango frito asa' }[k]; }
  if (r.ff) { const k = Object.keys(FF).sort((a, b) => b.length - a.length).find(x => d.includes(x)); return k ? FF[k] : null; }
  if (r.pizza) { const marca = d.startsWith("domino's") ? "Domino's" : 'Pizza Hut'; const sab = d.includes('pepperoni') ? 'pepperoni' : d.includes('sausage') ? 'calabresa (sausage)' : 'queijo'; const mass = /thin/.test(d) ? 'massa fina' : /pan crust/.test(d) ? 'massa pan' : 'massa tradicional'; return `Pizza de ${sab} ${marca} (${mass})`; }
  if (r.pizzaCongelada) return `Pizza congelada de ${/pepperoni/.test(d) ? 'pepperoni' : /meat and vegetable|meat/.test(d) ? 'carne e vegetais' : 'queijo'}`;
  if (r.trad3 || r.nada) { const x = TRAD3.find(([re]) => re.test(d)); return x ? x[1] : null; }
  if (r.ttl === 'dark') return DARK(d);
  if (r.trad2b) { const k = [['chicken noodle', 'Sopa de macarrão com frango (lata)'], ['tomato', 'Sopa de tomate (lata)'], ['minestrone', 'Sopa minestrone (lata)'], ['vegetable', 'Sopa de legumes (lata)'], ['chicken broth', 'Caldo de galinha (lata)'], ['beef broth', 'Caldo de carne (lata)']].find(([x]) => d.includes(x)); return k ? k[1] : null; }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Casa uma descrição com uma regra; devolve { nome, chave, grupo, estado, ... } ou null
const GLOBAL_NAO = /babyfood|infant formula|gerber|usda commodity|school lunch|alaska native|northern plains|navajo|hopi|apache|shoshone|\bmre\b|dietetic|imitation|restaurant, family|latino, bunuelos|diet shake/;
// apelidos que as pessoas realmente digitam (a regra do parser só vê o nome traduzido)
const APEL_NOME = {
  'Torta de limão com merengue': ['torta de limao'], 'Mix de castanhas e nozes': ['mix de castanhas', 'mix de nuts', 'castanhas mistas', 'mix de oleaginosas'],
  'Leite de amêndoas (bebida)': ['leite de amendoas'], 'Leite de aveia (bebida)': ['leite de aveia'], 'Leite de arroz (bebida)': ['leite de arroz'], 'Leite de coco (bebida)': ['leite de coco'], 'Leite de soja (bebida)': ['leite de soja'],
  'Torta de maçã': ['torta de maca'], 'Torta de abóbora': ['torta de abobora'],
};
export function casar(desc) {
  const d = desc.toLowerCase();
  if (GLOBAL_NAO.test(d)) return null;
  for (const r of R) {
    const m = d.match(r.re);
    if (!m) continue;
    if (r.nao && r.nao.test(d)) continue;
    const base = nomeDe(r, d, m);
    if (!base) continue;
    let estado = estadoDe(d);
    if (r.estSo && !r.estSo.includes(estado)) continue;
    if (r.est === false) estado = '';
    const quals = (r.q || []).map(k => QUAL[k](d)).filter(Boolean);
    return { base, quals, estado, grupo: r.grupo, l: !!r.l, u: !!r.u, b: !!r.b, t: !!r.t, ac: !!r.ac, apel: [...(r.apel || []), ...(APEL_NOME[base] || [])] };
  }
  return null;
}
function nomeFinal(c) {
  const par = [...c.quals];
  if (c.estado) par.push(flexionar(c.estado, generoFem(c.base)));
  return par.length ? `${c.base} (${par.join(', ')})` : c.base;
}

// ---------------------------------------------------------------------------------------------
// 1) CSV -> extrato
function carregarFonte(dir, tipoDesejado) {
  const food = csv(path.join(dir, 'food.csv')).slice(1).filter(r => r[1] === tipoDesejado);
  const cats = Object.fromEntries(csv(path.join(dir, 'food_category.csv')).slice(1).map(r => [r[0], r[2]]));
  const pick = new Map();
  for (const r of food) { const c = casar(r[2]); if (c) pick.set(r[0], { id: r[0], desc: r[2], cat: cats[r[3]] || '', tipo: tipoDesejado }); }
  const nutr = { 1008: 'kcal', 2047: 'kcalA', 2048: 'kcalB', 1003: 'p', 1004: 'g', 1005: 'c', 1079: 'f', 2000: 'acucar' };
  const itens = new Map();
  for (const r of csv(path.join(dir, 'food_nutrient.csv')).slice(1)) {
    const f = pick.get(r[1]); const k = nutr[r[2]];
    if (!f || !k) continue;
    (f.n ||= {})[k] = parseFloat(r[3]);
  }
  const mu = Object.fromEntries(csv(path.join(dir, 'measure_unit.csv')).slice(1).map(r => [r[0], r[1]]));
  for (const r of csv(path.join(dir, 'food_portion.csv')).slice(1)) {
    const f = pick.get(r[1]); if (!f) continue;
    const gw = parseFloat(r[7]), am = parseFloat(r[3]) || 1;
    if (!(gw > 0)) continue;
    (f.por ||= []).push([`${mu[r[4]] && mu[r[4]] !== 'undetermined' ? mu[r[4]] + ' ' : ''}${r[5]} ${r[6]}`.replace(/\s+/g, ' ').trim(), Math.round((gw / am) * 10) / 10]);
  }
  for (const f of pick.values()) itens.set(f.id, f);
  return [...itens.values()];
}
const iCsv = argv.indexOf('--csv');
if (iCsv >= 0) {
  const todos = [...carregarFonte(argv[iCsv + 1], 'foundation_food'), ...carregarFonte(argv[iCsv + 2], 'sr_legacy_food')];
  const meta = { fonte: 'USDA, Agricultural Research Service. FoodData Central, Foundation Foods (2026-04-30) e SR Legacy (2018-04). https://fdc.nal.usda.gov', licenca: 'Domínio público (CC0 1.0 Universal)' };
  fs.writeFileSync(path.join(fonteDir, 'usda-extrato.json'), JSON.stringify({ meta, itens: todos }));
  console.log(`usda-extrato.json: ${todos.length} itens casaram com regras`);
}

// ---------------------------------------------------------------------------------------------
// 2) extrato -> candidatos
const ext = JSON.parse(fs.readFileSync(path.join(fonteDir, 'usda-extrato.json'), 'utf8'));
const UNID = [[/^(cup|cups)(?![a-z])/, 'xicara'], [/^tbsp|^tablespoon/, 'colher de sopa'], [/^tsp|^teaspoon/, 'colher de cha'], [/^slice/, 'fatia'], [/^(fillet|filet)/, 'file'], [/^steak|^chop/, 'bife'], [/^(medium|unit|item|egg|whole|fruit|each)/, 'unidade'], [/^large/, 'grande'], [/^small/, 'pequena'], [/^(piece|pieces)/, 'pedaco'], [/^can/, 'lata'], [/^bar/, 'barra'], [/^scoop/, 'scoop'], [/^patty|^sandwich|^cookie|^roll|^pizza|^taco|^burrito/, 'unidade'], [/^serving|^portion/, 'porcao'], [/^packet|^pouch|^package/, 'pacote'], [/^bottle/, 'garrafa'], [/^(nugget|wing|drumstick|thigh|breast)/, 'unidade'], [/^fl oz|^ounce|^oz|^lb|^cubic|^quart|^pint/, null]];
function porcoesDe(it, liquido, grupo = '', nomeItem = '') {
  const out = new Map();
  for (const [txt, g] of it.por || []) {
    const t = txt.toLowerCase().replace(/^undetermined\s*/, '');
    // "cup" com variações (chopped, sliced...) não entra; só "cup" puro ou "cup (8 fl oz)"
    if (/^cup/.test(t) && !/^cup(\s*\(.*\))?\s*$/.test(t.replace(/\s+/g, ' '))) continue;
    const u = UNID.find(([re]) => re.test(t));
    if (!u || !u[1]) continue;
    let un = u[1];
    if (liquido && un === 'xicara') un = 'copo';
    if (!out.has(un)) out.set(un, g);
  }
  if (it.por && !out.size) {
    const oz = it.por.find(([t]) => /(^|\s)oz\b/.test(t));
    if (oz && !liquido) out.set('porcao', Math.round(oz[1]));
  }
  const prefer = ['unidade', 'grande', 'pequena', 'fatia', 'file', 'bife', 'pedaco', 'barra', 'lata', 'scoop', 'porcao', 'copo', 'xicara', 'colher de sopa', 'colher de cha'];
  let arr = [...out].filter(([n, g]) => g > 0 && g <= 1200).sort((a, b) => prefer.indexOf(a[0]) - prefer.indexOf(b[0]));
  if (liquido) arr = arr.sort((a, b) => (a[0] === 'copo' ? -1 : 0) - (b[0] === 'copo' ? -1 : 0));
  arr = arr.filter(([n]) => n !== 'grande' && n !== 'pequena').slice(0, 5);
  let res = arr.map(([nome, g]) => ({ nome, g }));
  if (grupo === 'oleaginosas' && !/pasta|tahine|creme|manteiga/.test(nomeItem.toLowerCase())) res = [{ nome: 'punhado', g: 30 }, ...res.filter(p => p.nome !== 'punhado')].slice(0, 5);
  else if (grupo === 'oleaginosas') res = [{ nome: 'colher de sopa', g: 15 }, ...res.filter(p => p.nome !== 'colher de sopa')].slice(0, 5);
  return res;
}

const candidatos = [], descartados = [];
for (const it of ext.itens) {
  const c = casar(it.desc);
  if (!c) continue;
  const n = it.n || {};
  const kcal = n.kcal ?? n.kcalA ?? n.kcalB;
  if (kcal == null || n.p == null || n.g == null || n.c == null) { descartados.push([it.id, it.desc, 'sem energia ou macros']); continue; }
  const nome = nomeFinal(c);
  const acucar = c.ac ? Math.min(n.acucar ?? 0, n.c) : 0;
  const item = {
    id: `${it.tipo === 'foundation_food' ? 'f' : 's'}${it.id}`, nome, grupo: c.grupo, kcal: arred(kcal, 0), p: arred(n.p), c: arred(n.c), g: arred(n.g), f: arred(n.f ?? 0), acucar: arred(acucar),
    liquido: c.l, ultra: c.u, bebAc: c.b, supl: c.t, porcoes: [], apelidos: c.apel.slice(), fonte: 'usda', chave: c.base, fund: it.tipo === 'foundation_food', len: it.desc.length,
  };
  // validação do USDA: kcal ~ 4p+4c+9g com tolerância de 15% (+10 kcal) fora álcool/fibra
  const alcool = /beer|wine|distill|alcoholic|cerveja|vinho|vodca|destilado|margarita|daiquiri|colada|sour|cosmopolitan|tequila|licor/i.test(it.desc);
  const calc = 4 * item.p + 4 * item.c + 9 * item.g;
  if (!alcool && kcal >= 20 && Math.abs(calc - kcal) > 0.15 * kcal + 12 && Math.abs(calc - kcal) > 0.15 * calc + 12) { descartados.push([item.id, nome, `kcal ${kcal} vs macros ${Math.round(calc)}`]); continue; }
  const pr = problemasNutri(item).filter(x => !/^kcal \d+ vs macros/.test(x) || alcool === false && false);
  if (pr.length) { descartados.push([item.id, nome, pr.join('; ')]); continue; }
  item.porcoes = porcoesDe(it, c.l, c.grupo, nome);
  if (!item.porcoes.length) item.porcoes = [{ nome: 'porcao', g: c.l ? 200 : 100 }];
  candidatos.push(item);
}
// um por nome: prefere Foundation Foods, depois a descrição mais curta (mais genérica)
const porNome = new Map();
for (const it of candidatos) {
  const k = N(it.nome);
  const o = porNome.get(k);
  if (!o || (it.fund && !o.fund) || (it.fund === o.fund && it.len < o.len)) porNome.set(k, it);
}
const final = [...porNome.values()];
for (const it of final) { delete it.fund; delete it.len; }
fs.writeFileSync(path.join(fonteDir, 'usda-itens.json'), JSON.stringify({ meta: ext.meta, itens: final, descartados }));
console.log(`usda-itens.json: ${final.length} candidatos únicos (${candidatos.length} antes de agrupar por nome; ${descartados.length} descartados)`);
if (argv.includes('--relatorio')) {
  const g = {}; final.forEach(i => (g[i.grupo] ||= []).push(i.nome));
  for (const [k, l] of Object.entries(g)) console.log(`## ${k} (${l.length})\n` + l.join(' | '));
}
