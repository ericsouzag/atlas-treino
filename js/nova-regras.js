// Classificação NOVA dos alimentos do banco (Guia Alimentar para a População Brasileira, MS 2014).
// Regras transparentes e revisáveis: categoria da fonte + palavras-chave pt-BR/en + a flag `ultra` + exceções explícitas.
// A documentação das regras e das decisões discutíveis está em tools/regras-nova.md. É uma ESTIMATIVA por regras:
// a classe real de um produto varia com a marca e o preparo.
//
//   1 = in natura ou minimamente processado (inclui preparações caseiras feitas só com alimentos dos grupos 1 e 2)
//   2 = ingredientes culinários (óleos, gorduras, açúcar, sal, farinhas/amidos de uso culinário, vinagre)
//   3 = processado (conservas, queijos, pães, carnes curadas simples, frutas em calda...)
//   4 = ultraprocessado
//   null = sem classificação (nunca se inventa)
//
// Usado em Node (tools/unificar-banco.mjs grava a classe nos JSON de data/) e no navegador (embutido de js/foods.js).
import { normalizar } from './texto.js';

export const NOVA_ROTULOS = {
  1: 'In natura / minimamente processado',
  2: 'Ingrediente culinário',
  3: 'Processado',
  4: 'Ultraprocessado',
};

// Cada regra: [id, nova, teste, { revisar?: motivo }]. A primeira que casar vale. `teste` é RegExp (sobre o nome normalizado, sem acento)
// ou função (ctx) => boolean, com ctx = { n, g, fonte, u (flag ultra), b, t (suplemento), ac (açúcar g/100g) }.
const re = (r, nao) => c => r.test(c.n) && !(nao && nao.test(c.n));
const grupoIn = (...gs) => c => gs.includes(c.g);

/** Grupos da fonte em que a categoria já diz muito (a flag `ultra` é só dica e NÃO sobrepõe o padrão do grupo) */
const GRUPOS_NATURAIS = new Set(['frutas', 'verduras', 'feculentos', 'leguminosas', 'oleaginosas', 'ovos', 'peixes', 'carnes', 'pratos']);

const CONSERVA = /conserva|petit pois|enlatad|em lata|\blata\b|em calda|salmoura|picles|chucrute|azeitona|palmito.*conserva|seleta|tomate (extrato|molho|pure)|extrato de tomate|massa de tomate|tomate seco|molho de tomate/;
const SAL_OLEO = /(amendoim|castanha|noz|nozes|amendoa|pistache|macadamia|semente|mix de castanhas|pinoli|pepita|girassol).*(com sal|salgad|no oleo)/;

export const REGRAS = [
  // ---------- exceções exatas e itens que a palavra-chave enganaria
  ['caqui-chocolate', 1, re(/caqui chocolate/)],
  ['agua-com-gas', 1, re(/^agua com gas$/)],
  ['levedo-cevada', 1, re(/^levedo de cerveja|^cevada em po/)],
  ['hamburguer-carne-usda', 1, c => c.fonte === 'usda' && /^hamburguer de carne \d+% magra/.test(c.n), { revisar: 'carne moída moldada (USDA, só carne); marcas industriais variam' }],
  ['pao-com-margarina', 4, re(/margarina/)],
  ['pao-com-manteiga-ovo', 3, re(/^pao (com|na chapa)/)],
  ['chocolate-70', 3, re(/^chocolate amargo 70/), { revisar: 'chocolate amargo 70% sem lecitina/aromas pode ser 3; marcas variam' }],
  ['acai-tigela', 4, re(/^acai (na tigela|com granola)|^tigela de acai/), { revisar: 'açaí na tigela leva xarope de guaraná/granola/leite condensado' }],
  ['acai-xarope', 4, re(/acai com xarope/)],

  // ---------- suplementos e produtos formulados
  ['suplemento', 4, c => c.g === 'suplementos' || c.t],
  ['proteina-texturizada', 4, re(/^(bife|carne) vegetal|^carne de soja|^proteina (de soja|vegetal)|^pasta de soja|^soja extrato soluvel po/), { revisar: 'proteína de soja texturizada é formulada; tofu e tempeh ficam em 3' }],

  // ---------- embutidos e carnes reconstituídas (decisão: presunto e embutidos = 4)
  ['presunto-cru-curado', 3, re(/presunto cru|ham curado/), { revisar: 'presunto cru curado só com sal pode ser 3; o cozido/apresuntado é 4' }],
  ['embutido', 4, re(/presunto|apresuntado|mortadela|salame|salaminho|copa de porco|linguica|calabresa|salsicha|bacon|blanquet|chourico|morcela|morcilha|^pate\b|pasta de (carne|galinha|presunto)|peito de peru|peru fatiado/), { revisar: 'linguiça fresca artesanal e bacon podem ser vistos como 3; o Guia agrupa embutidos entre os ultraprocessados' }],
  ['carne-industrial', 4, re(/hamburguer|nugget|steak de frango|mini chicken|tiras de frango empanado|fish sticks|surimi|kani|corned beef|carne enlatada|jerky|almondega ao molho em conserva|caldo de (carne|galinha) tablete|caldo (de carne|de galinha) \(?lata/, /^pao /)],
  ['pacoca-de-carne', 3, re(/^pacoca de carne/), { revisar: 'prato com carne de sol (salgada) e farinha' }],
  ['tempero-natural', 1, re(/^(coentro|pimenta em po|gergelim|tucupi)/)],
  ['empanado-industrial', 4, c => /empanad/.test(c.n) && c.u],
  ['macarrao-instantaneo', 4, re(/macarrao instantaneo|miojo|lamen|yakissoba .*desidratada/)],

  // ---------- bebidas industrializadas e misturas prontas
  ['bebida-industrial', 4, re(/refrigerante|agua tonica|ginger ale|root beer|tubaina|minuano|sprit|quinino|energetic|isotonic|bebida lactea|achocolatad|toddynho|chocomilk|ovomaltine|ovaltine|leite com chocolate|leite aromatizado|leite com sabor|leite fermentado|milk ?shake|\bnectar\b|envasado|concentrado|coquetel|cha gelado adocado|suco em po|refresco|capuccino|cappuccino|diet shake|sustagem|\bades\b|leite beijinho|bebida vegetal|^leite (de (soja|aveia|amendoas|arroz)|de coco bebida)|leite de soja em po|leite em po com sabor|extrato soluvel/), { revisar: 'bebidas vegetais industrializadas (soja, aveia, amêndoas...) são 4 pelos aditivos; versão caseira seria 1' }],
  ['alcool-destilado', 4, re(/cachaca|vodca|vodka|whisky|uisque|destilado|caipirinha|aguardente|\bgin\b|\brum\b/), { revisar: 'destilados: NOVA os coloca no grupo 4 (cerveja e vinho ficam em 3)' }],
  ['alcool-fermentado', 3, re(/cerveja|vinho|chopp|chope/, /^vinagre/)],

  // ---------- doces, biscoitos, salgadinhos e afins (sempre 4, exceto os casos tradicionais listados adiante)
  ['preparos-infantis-instantaneos', 4, re(/mucilon|arrozina|cremogema|vitamilho|vitaflocos|farinha lactea|mingau de milho infantil|mingau tradicional|mistura para|mistura de|curau.*mistura|^sustagem/)],
  // granola: depende do que leva. Com açúcar, xarope e aditivos (tradicional de mercado) = 4; só aveia, castanhas, mel e óleo (sem açúcar/caseira) = 3; muesli simples (flocos + frutas secas + castanhas) = 1
  ['granola-sem-acucar', 3, re(/^granola (sem acucar|caseira|zero|artesanal|fit)/), { revisar: 'granola sem açúcar: 3 (aveia, castanhas, mel e óleo); se a embalagem trouxer xarope, aromatizantes ou emulsificantes, é 4' }],
  ['muesli-simples', 1, re(/^(muesli|musli)/), { revisar: 'muesli só de flocos, frutas secas e castanhas = 1; muesli com açúcar/xarope adicionado = 4' }],
  ['granola-industrializada', 4, re(/^granola/), { revisar: 'granola de mercado costuma levar açúcar/xarope e aditivos (4); a sem açúcar/caseira é uma variante separada (3)' }],
  ['cereal-matinal-barra', 4, re(/cereal matinal|sucrilho|cap n crunch|cheerios|corn flakes|raisin bran|frosted|barra de (cereal|cereais|granola|proteina)|barrinha|^mix de cereais/), { revisar: 'barras e cereais matinais: açúcar e aditivos são o padrão' }],
  ['pipoca-industrial', 4, re(/pipoca.*(micro|queijo|doce ou salgada|light)/)],
  ['salgadinho-snack', 4, re(/salgadinho|\bchips\b|pretzel|nachos|tortilla|baconzito|presuntinho biscoito|batata palha|batata tipo chips|batata chips|anel de cebola|anéis de cebola|aneis de cebola|onion rings|hash brown/)],
  ['biscoito-artesanal', 3, re(/^(sequilho|tareco|brevidade|cavaco chines|quebra quebra|solda)\b/), { revisar: 'biscoitos de padaria/artesanais: podem ser 4 conforme a receita' }],
  ['biscoito', 4, re(/biscoito|bolacha|wafer|alfajor|cookie|shortbread/)],
  ['sorvete-gelatina-pudim', 4, re(/sorvete|picole|geladinho|gelatina|pudim|danette|manjar|frosty|mcflurry/)],
  ['bala-chocolate', 4, re(/\bbala\b|balas|caramelo|marshmallow|fudge|chocolate|bombom|kit kat|milky way|snickers|m m s|reese|trufa|confete|ioio|kinder|ovo de pascoa|nutella|creme de avela|brigadeiro|cocada|doce de amendoim|pacoca|pe de moleque|torrao|amendoim (caramelizado|achocolatado)|churro|quebra queixo|queijadinha|pessegada diet/), { revisar: 'doces tradicionais caseiros (brigadeiro, cocada, paçoca...) seriam preparações; aqui seguem o padrão de confeitaria = 4' }],
  ['bolo-pronto', 4, re(/bolo pronto|pao de lo|angel food/)],

  // ---------- gorduras, molhos e temperos
  ['gordura-oleo', 2, re(/^(oleo|azeite)\b|^manteiga( com| sem| de garrafa| clarificada)|^manteiga$|\bghee\b|^banha/), null],
  ['maionese-molhos-ultra', 4, re(/^maionese|molho (caesar|ranch|italiano|frances|mil ilhas|de queijo azul|agridoce|barbecue|hoisin|teriyaki|tartaro|ingles)|ketchup|catchup|molho de soja|shoyu|shoyo|tempero a base de sal/), { revisar: 'shoyu e molhos prontos: o grupo 4 é o mais comum, mas há fermentação tradicional' }],
  ['mostarda-pimenta-pesto', 3, re(/^mostarda$|^mostarda molho|molho de pimenta|molho pesto|alcaparra|molho salsa/), { revisar: 'varia com a marca (aditivos)' }],
  ['preparo-simples-outros', 1, re(/^vinagrete$|^cozido$|^almondega$|^strogonoff$|^yakissoba$|^caldo de (peixe|tomate)|^acaraje/)],
  ['sal-vinagre-fermento', 2, re(/^sal\b|^vinagre\b|^fermento/)],
  ['acucar-mel', 2, re(/^acucar|^mel\b|^mel de abelha|^melado|^rapadura|^glicose|^xarope de bordo|maple syrup/)],
  ['conserva-doce-fruta', 3, c => /goiabada|marmelada|pessegada|figada|caju em pasta|mariola|bananada|banana doce|goiaba doce|doce em pasta|doce de (abobora|frutas|mamao)|mamao .*doce em calda|doce em calda|^geleia|^geleia mocoto/.test(c.n) && !/diet|light/.test(c.n), { revisar: 'doces de fruta com açúcar: 3 pela definição (fruta + açúcar), mas versões industriais com aditivos seriam 4' }],
  ['doce-diet-light', 4, c => /diet|light/.test(c.n) && c.g === 'doces'],

  // ---------- laticínios
  ['queijo-ultra', 4, re(/requeijao|cream cheese|catupiry|polenguinho|queijo (cremoso|pasteurizado|tipo americano|fundido|processado)|neufchatel|creme de queijo|petit suisse/)],
  ['iogurte-com-sabor', 4, re(/iogurte.*(sabor|fruta|polpa|morango|pessego|proteico|skyr)|danone/)],
  ['iogurte-natural', 1, re(/^(iogurte|kefir|coalhada|leitelho)/)],
  ['leite-condensado-doce-leite', 4, re(/leite condensado|doce de leite|doce a base de leite|doce a base de ovos|leite geleificado|chantilly|doce de leite/)],
  ['queijo', 3, re(/^queijo|^mussarela|^mozarela|^muzarela|^ricota|^cottage|^gorgonzola|^parmesao|tofu|^tempeh|^quechimia/)],
  ['creme-de-leite-nata', 3, re(/creme de leite|^nata\b|creme azedo|sour cream|half and half|leite evaporado|creme de leite fresco/)],
  ['leite', 1, re(/^leite\b|^leite em po|^leite de (vaca|cabra|coco)|^leite de coco/)],

  // ---------- pães e farináceos
  ['pao-de-forma-industrial', 4, re(/pao .*forma|pao de hamburguer|pao de hot dog|bisnaguinha|pao doce|panetone|pao diet|pao integral light|pao de mel|rosca doce|rosquinha doce|rosquinha salgada/), { revisar: 'pão de forma industrial é 4 (aditivos); pão de padaria é 3' }],
  ['farinha-de-rosca', 3, re(/farinha de rosca/)],
  ['pao', 3, re(/\bpao\b|\bpaes\b|^torrada|^broa|bagel|english muffin|naan|\bpita\b|tortilha|croissant|brioche|chineque|rosca salgada/, /fruta pao|kung pao/), { revisar: 'pão: 3 pelo Guia (farinha, água, sal, fermento); varia com a marca' }],
  ['pastelaria-sem-flag', 3, c => /^(filhos|sonho|rocambole|amidomil|angusor|grustoli|brevidade)\b/.test(c.n) && !c.u],
  ['confeitaria', c => (c.u ? 4 : 3), re(/\bbolo\b|bolo de|torta|cheesecake|brownie|panqueca americana|cookie|rabanada|suspiro|merengue|mil folhas|ambrosia|mumu|fios de ovos|pasteis de santa clara|schimier|canudinho|doce de|arroz doce|quindim|maria mole|\bpave\b|pudim/), { revisar: 'bolos e doces sem flag de ultraprocessado ficam em 3; com flag, 4' }],
  ['farinha-amido-culinario', 2, re(/^soja farinha|^farinha de (trigo|amendoa|coco|soja|grao de bico|quinoa|centeio|arroz|trigo sarraceno)|^amido|^milho amido|^fecula|^polvilho|^maisena|^goma\b/), { revisar: 'o Guia lista farinhas entre os minimamente processados; aqui as de uso culinário (trigo, amidos) ficam em 2 e as de base alimentar (mandioca, milho) em 1' }],
  ['farinha-base', 1, re(/^farinha|^fuba|^puba|farinha de (mandioca|milho|puba|agua|copioba|aveia|tapioca)|flocao|cereais milho flocos|germe de trigo|farelo/)],
  ['pronto-industrial', 4, c => /\bpront[ao]\b/.test(c.n) && !/tapioca/.test(c.n) && (c.g === 'pratos' || c.g === 'feculentos' || c.g === 'cereais'), { revisar: 'prato/farofa "pronto" = industrializado' }],
  ['cereal-base', 1, c => (c.g === 'cereais' || c.g === 'doces') && !CONSERVA.test(c.n) && /arroz|aveia|milho|trigo|cevada|quinoa|amaranto|painco|centeio|bulgur|cuscuz|canjica|canjiquinha|xerem|polenta|angu|pamonha|curau|tapioca|sagu|beiju|macarrao|massa fresca|lasanha massa|espaguete|talharim|nhoque|crepe|panqueca|mingau|creme de|cereais|flocos|polpa de coco|amendoim cozido|\bandu\b|mangalo|ervilha|fava|broa|cruera|pure de batata|amendoim moido/.test(c.n)],

  // ---------- conservas, castanhas salgadas e cozidos industriais
  ['oleaginosa-salgada', 3, c => SAL_OLEO.test(c.n) || /^amendoim .*(salgado|apimentado|amanteigado)/.test(c.n), { revisar: 'castanhas torradas com sal/óleo: 3' }],
  ['pasta-oleaginosa', 3, re(/pasta de (amendoim|amendoa)|^tahine|^tahini|manteiga de amendoim/), { revisar: 'pasta de amendoim varia: 100% amendoim = 1; com açúcar/óleo = 3 ou 4' }],
  ['sopa-lata-desidratada', 4, re(/sopa.*(lata|desidratada)|creme de (cebola|legumes).*desidratada|caldo.*lata/)],
  ['sanduiche-natural', 3, re(/sanduiche (natural|de queijo minas)/)],
  ['pizza-lanche-pronto', 4, re(/pizza|mini pastel|^pastel|^pastel massa|coxinha|empada|empadao|croquete|enroladinho|esfirra|esfiha|\bquibe\b|hamburguer|cheeseburguer|cheesburguer|eggsburguer|cachorro quente|misto quente|bauru|^americano|cheese (egg|tudo)|sanduiche|burrito|^taco$|subway|mcdonald|burger king|wendy|kfc|big mac|lasanha pronta|macarrao pronto|macarrao com queijo|mac and cheese/), { revisar: 'salgados de lanchonete e pizzas podem ser artesanais (3); aqui = 4' }],

  // ---------- bebidas simples e naturais
  ['cafe-cha-agua', 1, re(/^cafe|^cha\b|^cha |^agua|agua de coco|^mate\b|caldo de cana|suco de clorofila|infusao/)],
  ['suco-natural', 1, re(/\bsuco\b|vitamina/), { revisar: 'suco "natural" vendido pronto ou com açúcar adicionado pode ser 4' }],

  // ---------- conservas de hortaliças, frutas, leguminosas e peixes
  ['peixe-conserva-salga', 3, c => c.g === 'peixes' && /conserva|em oleo|enlatad|em lata|salgad|defumad|caviar|escabeche|bacalhau \(salgado|atum.*lata|sardinha.*lata/.test(c.n)],
  ['carne-salgada-curada', 3, c => c.g === 'carnes' && /charque|carne seca|carne de sol|\bseca\b|salgad|toucinho|defumad|orelha|^porco rabo/.test(c.n), { revisar: 'carne salgada/seca e toucinho: 3 (salga simples)' }],
  ['conserva-vegetal-fruta', 3, c => CONSERVA.test(c.n) && !/^(pasta|sopa)/.test(c.n)],
  ['fruta-seca', 1, re(/\(seca\)|\(seco\)|\bseca\b|\bseco\b|passa\b|uva passa|fruta seca ou desidratada|damasco \(seco/)],
  ['pipoca-simples', 1, re(/^pipoca/)],

  // ---------- pratos: preparações culinárias caseiras (grupos 1 e 2) = 1; exceções industriais acima
  ['prato-caseiro', 1, c => c.g === 'pratos', { revisar: 'prato caseiro: classificado como preparação culinária de ingredientes 1 e 2 (os ingredientes industrializados do prato não são decompostos)' }],
];

/** Padrão por categoria da fonte quando nenhuma regra casou. Retorna [id, nova] ou null. */
function padraoDoGrupo(c) {
  const p = {
    frutas: ['grupo-frutas', 1], verduras: ['grupo-verduras', 1], feculentos: ['grupo-feculentos', 1],
    leguminosas: ['grupo-leguminosas', 1], oleaginosas: ['grupo-oleaginosas', 1], ovos: ['grupo-ovos', 1],
    peixes: ['grupo-peixes', 1], carnes: ['grupo-carnes', 1], fastfood: ['grupo-fastfood', 4], cereais: null, doces: ['grupo-doces', 4],
  }[c.g];
  return p || null;
}

/**
 * Classifica um alimento. Entrada: { nome, grupo, fonte, ultra, bebAc, supl, acucar }.
 * Retorna { nova: 1..4 | null, regra: id, revisar: motivo | null }.
 */
export function classificarNova(item) {
  const c = {
    n: normalizar(item.nome), g: item.grupo || '', fonte: item.fonte || '',
    u: !!item.ultra, b: !!item.bebAc, t: !!item.supl, ac: Number(item.acucar) || 0,
  };
  for (const [id, nova, teste, op] of REGRAS) {
    if (teste(c)) return { nova: typeof nova === 'function' ? nova(c) : nova, regra: id, revisar: op && op.revisar || null };
  }
  const pg = padraoDoGrupo(c);
  if (pg) {
    // grupos naturais não mudam por causa da flag (que é dica imprecisa); doces/fastfood são 4 por padrão
    return { nova: pg[1], regra: pg[0], revisar: c.u && pg[1] !== 4 ? 'flag ultraprocessado da fonte discorda' : null };
  }
  if (c.u) return { nova: 4, regra: 'flag-ultra', revisar: null };
  return { nova: null, regra: 'sem-regra', revisar: null };
}

export { GRUPOS_NATURAIS };
