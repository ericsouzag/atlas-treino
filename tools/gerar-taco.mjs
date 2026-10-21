// Converte a TACO (4ª ed., NEPA/UNICAMP) para o banco compacto do Atlas Fitness: data/taco.json
// Uso: node tools/gerar-taco.mjs            (lê tools/fonte/taco4-extrato.json)
//      node tools/gerar-taco.mjs --relatorio (lista duplicatas prováveis e itens ignorados)
//
// Fonte dos dados: https://github.com/IgorFZ/taco-br (MIT), arquivo data/taco4.json, que transcreve a TACO.
// Do arquivo original guardamos só o necessário em tools/fonte/taco4-extrato.json (id, descrição, grupo,
// kcal, proteína, lipídeos, carboidrato, fibra). A TACO permite reprodução citando a fonte.
// Tudo o que NÃO é da TACO (porções caseiras, apelidos, estimativa de açúcar, flags) é decisão do app e
// está neste arquivo, de forma reprodutível.
import fs from 'node:fs';
import path from 'node:path';
import { ALIMENTOS as BASE } from '../js/foods.js';
import { normalizar } from '../js/texto.js';

const raiz = path.resolve(import.meta.dirname, '..');
const fonte = JSON.parse(fs.readFileSync(path.join(raiz, 'tools/fonte/taco4-extrato.json'), 'utf8'));
const RELATORIO = process.argv.includes('--relatorio');

// ---------------------------------------------------------------------------------------------
// 1) Itens que já existem no banco base (mesmo alimento, mesmo preparo): não entram de novo.
const DUPLICADOS = new Set([
  1, 3, 53, 52, 7, 13, 63, 88, 91, 129, 140, 561, 567, 577, 488, 490, 410, 377, 346, 383, 370, 424, 439,
  463, 461, 468, 467, 447, 453, 459, 458, 261, 260, 272, 494, 507, 495, 498, 478, 525, 540, 538, 389, 390, 386,
  474, 471, 477, 524, 164, 163, 182, 235, 236, 239, 207, 220, 142, 107, 110, 120,
]);
// Sem valor de energia na TACO e sem como calcular: ignorados (coco verde). Sal vira zero.
const ZERO = /^sal, /i;

// 2) Apelidos extras para alimentos que já existem no banco base (id do base -> apelidos).
const EXTRAS_BASE = {
  'peito-de-frango-grelhado': ['frango', 'frango grelhado', 'file de frango', 'bife de frango', 'peito de frango'],
  'mandioca-cozida': ['aipim', 'aipim cozido', 'macaxeira', 'macaxeira cozida', 'mandioca', 'castelinha'],
  'biscoito-cream-cracker': ['bolacha salgada', 'biscoito de sal'],
  'batata-doce-cozida': ['batata doce', 'batata-doce'],
  'ovo-cozido': ['ovo de galinha cozido', 'ovo duro'],
  'aveia-em-flocos': ['farinha de aveia', 'aveia em po'],
  'queijo-mussarela': ['queijo muçarela', 'mucarela', 'mozarela', 'queijo mozarela'],
};

// 3) Sinônimos regionais/populares (gera variações de apelido trocando uma palavra por outra).
const SINONIMOS = [
  ['biscoito', 'bolacha'], ['mandioca', 'aipim', 'macaxeira'], ['mexerica', 'tangerina', 'bergamota'],
  ['jilo', 'jiló'], ['presunto', 'fiambre'],
  ['linguica', 'salsicha caseira'], ['pao de queijo', 'pao de queijo mineiro'], ['cana', 'garapa'],
  ['polvilho', 'goma'], ['fecula de mandioca', 'goma de tapioca'], ['amendoim', 'mendoim'],
];

// 4) Apelidos manuais por id TACO.
const EXTRAS = {
  8: ['bolacha maisena', 'biscoito maisena', 'maisena'], 11: ['wafer de chocolate', 'bolacha wafer'], 12: ['wafer de morango'],
  9: ['biscoito recheado de chocolate', 'bolacha recheada de chocolate'], 10: ['biscoito recheado de morango'],
  39: ['miojo cru', 'macarrao instantaneo cru'], 56: ['pastel de carne', 'pastel frito de carne'], 58: ['pastel de queijo', 'pastel frito de queijo'],
  61: ['pipoca caseira', 'pipoca de panela'], 90: ['batata chips', 'chips', 'batata ruffles', 'salgadinho de batata'],
  132: ['mandioca frita', 'aipim frito', 'macaxeira frita'], 131: ['farofa de mandioca', 'farofa'],
  167: ['acai com guarana', 'acai com xarope'], 168: ['acai puro', 'polpa de acai'],
  175: ['banana da terra', 'banana comprida'], 179: ['banana nanica', 'banana d agua'], 180: ['banana ouro'], 182: [],
  208: ['laranja baia', 'laranja'], 209: ['suco de laranja baia'], 215: ['suco de laranja pera'],
  232: ['maracuja', 'fruta do maracuja'], 233: ['polpa de maracuja', 'suco de maracuja'], 230: ['polpa de manga', 'suco de manga'],
  191: ['seriguela', 'ciriguela'], 204: ['jaca'], 246: ['fruta do conde', 'ata'],
  262: ['manteiga sem sal'], 263: ['margarina com sal'], 264: ['margarina sem sal'], 259: ['dende', 'oleo de dende'], 260: [],
  277: ['atum em oleo', 'atum', 'atum em lata'], 319: ['sardinha em oleo', 'sardinha enlatada'],
  323: ['apresuntado', 'presunto apresuntado'], 324: ['caldo knorr', 'caldo de carne', 'tablete de caldo'], 325: ['caldo de galinha', 'tablete de caldo de galinha'],
  386: [], 387: ['croquete'], 388: ['croquete frito', 'bolinho de carne frito'], 424: [], 443: ['salame', 'salaminho'],
  415: ['hamburguer cru', 'hamburguer de carne'], 417: ['hamburguer', 'hamburguer grelhado', 'hamburguer de carne grelhado'],
  416: ['hamburguer frito'], 419: ['linguica de frango frita'], 420: ['linguica de frango', 'linguica de frango grelhada'],
  423: ['linguica de porco', 'linguica de porco grelhada', 'linguica'], 422: ['linguica de porco frita'],
  340: ['bife a milanesa', 'bife empanado', 'contra file a milanesa'], 401: ['file de frango empanado', 'frango a milanesa', 'file de frango a milanesa'],
  396: ['coxa assada', 'coxa de frango assada'], 411: ['sobrecoxa assada', 'sobrecoxa de frango assada'], 408: ['frango cozido', 'peito de frango cozido'],
  398: ['coxa cozida', 'coxa de frango cozida'], 391: ['asa de frango', 'asinha', 'asinha de frango'], 395: ['coracao de frango', 'espetinho de coracao'],
  400: ['figado de frango'], 356: ['figado', 'figado de boi', 'figado acebolado'], 330: ['almondega', 'almondegas'], 331: ['almondega frita', 'almondegas fritas'],
  347: ['costela assada', 'costela de boi'], 353: ['cupim assado', 'cupim'], 361: ['fraldinha', 'fraldinha cozida'], 368: ['maminha', 'maminha grelhada'],
  338: ['charque', 'carne de sol', 'jabá'], 384: ['carne seca', 'jabá'], 429: ['bisteca de porco', 'bisteca suina', 'bisteca grelhada'], 428: ['bisteca frita'],
  432: ['lombo assado', 'lombo suino'], 435: ['pernil', 'pernil assado'], 430: ['costela de porco', 'costelinha de porco', 'costelinha'],
  444: ['toucinho', 'torresmo cru'], 445: ['toucinho frito', 'torresmo'],
  421: ['linguica de porco crua'], 440: ['quibe assado', 'kibe assado'], 442: ['quibe frito', 'kibe frito', 'quibe', 'kibe'],
  448: ['iogurte natural'], 449: ['iogurte desnatado', 'iogurte natural desnatado', 'iogurte light'], 451: ['iogurte de morango'], 452: ['iogurte de pessego'],
  446: ['bebida lactea', 'yakult de pessego'], 460: ['leite fermentado', 'yakult', 'yakult tipo'], 454: ['leite de cabra'],
  455: ['achocolatado de caixinha', 'leite com chocolate'], 456: ['leite em po desnatado', 'leite desnatado em po'],
  466: ['petit suisse', 'danoninho', 'danone petit suisse'], 465: ['queijo processado', 'queijo fatiado', 'queijo cremoso em fatia', 'queijo tipo cheddar'],
  462: ['queijo minas meia cura', 'queijo curado'], 464: ['queijo parmesao', 'parmesao'], 469: ['ricota', 'ricota fresca'],
  470: ['gatorade', 'isotonico', 'powerade'], 472: ['cachaca', 'pinga', 'aguardente'], 473: ['caldo de cana', 'garapa'],
  479: ['agua tonica', 'tonica'], 480: ['refrigerante de cola'], 481: ['guarana antarctica', 'refrigerante guarana'], 482: ['refrigerante de laranja', 'fanta laranja'],
  483: ['refrigerante de limao', 'sprite', 'refrigerante limao'], 476: ['cha mate', 'mate', 'cha de mate'], 475: ['cha de erva doce'],
  484: ['omelete de queijo', 'omelete com queijo'], 485: ['ovo de codorna', 'ovos de codorna'], 486: ['clara cozida', 'clara de ovo cozida'], 487: ['gema cozida', 'gema'],
  489: ['ovo cru', 'ovo crú'], 491: ['achocolatado em po', 'nescau', 'toddy', 'chocolate em po', 'achocolatado'],
  492: ['acucar cristal', 'acucar'], 493: ['acucar mascavo', 'acucar demerara', 'acucar demerara'], 497: ['chocolate diet', 'chocolate dietetico'],
  496: ['chocolate com castanha'], 499: ['cocada', 'cocada branca'], 501: ['doce de leite', 'doce de leite cremoso'], 502: ['geleia de mocoto'],
  504: ['maria mole'], 509: ['quindim'], 510: ['rapadura'], 508: ['melado', 'melaco', 'melado de cana'], 500: ['doce de abobora', 'doce de abobora com coco'],
  511: ['cafe em po', 'po de cafe'], 512: ['capuccino', 'cappuccino em po', 'capuccino em po'], 515: ['gelatina em po', 'gelatina'],
  518: ['shoyu', 'molho shoyu', 'molho de soja', 'soja molho'], 520: ['azeitona preta', 'azeitonas pretas'], 521: ['azeitona', 'azeitona verde', 'azeitonas'],
  522: ['chantilly', 'chantilly spray'], 523: ['leite de coco'], 524: [],
  526: ['arroz carreteiro', 'carreteiro'], 527: ['baiao de dois', 'baiao'], 529: ['bife a cavalo', 'bife com ovo'], 530: ['bolinho de arroz'],
  533: ['cuscuz com sal', 'cuscuz de milho com sal'], 534: ['cuscuz paulista', 'cuscuz de sardinha'], 537: ['estrogonofe de carne', 'strogonoff de carne', 'estrogonofe'],
  539: ['feijao tropeiro', 'tropeiro'], 542: ['macarrao a bolonhesa', 'macarrao com molho bolonhesa', 'espaguete a bolonhesa', 'macarronada'],
  544: ['quibebe', 'quibebe de abobora'], 545: ['maionese de legumes', 'salada de maionese', 'salada com maionese'], 547: ['salpicao', 'salpicao de frango'],
  549: ['tabule', 'tabule libanes'], 551: ['tapioca com manteiga', 'tapioca de manteiga'], 553: ['vaca atolada'], 554: ['vatapa'], 555: ['virado a paulista', 'virado'], 556: ['yakisoba', 'macarrao yakisoba'],
  557: ['amendoim cru'], 558: ['amendoim salgado', 'amendoim torrado salgado'], 563: ['feijao fradinho cozido', 'feijao fradinho', 'feijao de corda cozido'],
  565: ['feijao jalo cozido', 'feijao jalo'], 569: ['feijao rajado cozido', 'feijao rajado'], 571: ['feijao rosinha cozido', 'feijao rosinha'],
  573: ['feijao roxo cozido', 'feijao roxo'], 579: ['pacoca de amendoim', 'pacoca de rolha'], 580: ['pe de moleque', 'pe-de-moleque'],
  582: ['leite de soja', 'bebida de soja'], 584: ['tofu', 'queijo de soja'], 575: ['grao de bico cru'], 585: ['tremoco', 'tremoço cru'], 586: ['tremoco em conserva', 'tremoco'],
  587: ['amendoa torrada', 'amendoas torradas salgadas'], 588: ['castanha de caju torrada', 'castanha de caju salgada'], 589: ['castanha do para', 'castanha-do-brasil'],
  590: ['coco fresco', 'coco', 'coco ralado'], 593: ['gergelim', 'semente de gergelim'], 594: ['linhaca', 'semente de linhaca'], 595: ['pinhao', 'pinhao cozido'], 596: ['pupunha'], 597: ['noz crua', 'nozes cruas'],
  34: ['farinha de rosca', 'farinha panko'], 35: ['farinha de trigo', 'trigo'], 33: ['farinha de milho', 'flocao', 'farinha de milho amarela'], 43: ['fuba', 'fuba de milho'],
  42: ['maisena', 'amido de milho'], 124: ['fecula de mandioca', 'goma de tapioca', 'polvilho azedo'], 146: ['polvilho doce', 'polvilho'], 121: ['farinha de mandioca crua'], 122: ['farinha de mandioca torrada', 'farinha de mandioca', 'farinha'],
  44: ['milho verde cru', 'espiga de milho'], 45: ['milho de lata', 'milho verde enlatado', 'milho em conserva', 'milho'], 29: ['curau', 'curau de milho'], 20: ['canjica', 'canjica com leite', 'mungunza'],
  47: ['pamonha', 'pamonha cozida'], 37: ['massa de lasanha cozida', 'massa fresca de lasanha'], 40: ['macarrao cru', 'massa crua'], 136: ['nhoque', 'nhoque de batata'],
  93: ['batata frita', 'batata inglesa frita'], 94: ['batata sauté', 'batata sote', 'batata sautee'],
  62: ['polenta', 'polenta pre cozida'],
  158: ['extrato de tomate', 'massa de tomate'], 159: ['molho de tomate pronto', 'molho de tomate industrializado', 'molho de tomate'], 160: ['pure de tomate', 'polpa de tomate'],
  161: ['salada de tomate'], 138: ['palmito', 'palmito juçara'], 139: ['palmito pupunha', 'palmito'], 154: ['seleta de legumes', 'legumes em lata'],
  198: ['goiabada', 'doce de goiaba', 'goiaba em pasta'], 199: ['goiabada cascao', 'cascao de goiaba'],
  176: ['bananada', 'doce de banana', 'banana em barra'], 517: ['sal', 'sal grosso', 'sal de cozinha'], 516: ['sal dietetico', 'sal light'],
  108: ['cebolinha', 'cebolinha verde', 'cheiro verde'], 114: ['coentro seco'], 153: ['salsinha'],
};

// ---------------------------------------------------------------------------------------------
// 5) Nomes: correções de grafia antiga/erros de digitação da transcrição.
const GRAFIA = [[/Lingüiça/g, 'Linguiça'], [/Geléia/g, 'Geleia'], [/mingnon/g, 'mignon'], [/Abobora/g, 'Abóbora'], [/Corimba,/g, 'Corimbatá,'],
  [/Cajá-Manga/g, 'Cajá-manga'], [/cozido\/10minutos/g, 'cozido'], [/cozida\/10minutos/g, 'cozida'], [/,cozido/g, ', cozido'], [/Caldo de$/, 'Caldo de cana']];
const arruma = s => GRAFIA.reduce((t, [r, v]) => t.replace(r, v), s).replace(/\s+/g, ' ').trim();

const N = s => normalizar(s);
const ESTADO = /^(cru|crua|cruo|cozid|grelhad|assad|frit|refogad|pre ?-?cozid|enlatad|congelad|em conserva|em calda|drenad|empanad|milanesa|a milanesa|desidratad|suco|polpa|torrad|salgad|infusao)/;
const QUALIF = /^(sem|com) (gordura|pele|casca|sal|capa|semente|cabeca|farinha|acucar)|^com (pele|gordura)/;
const RANK = [[/^(cozid|grelhad)/, 0], [/^(assad|refogad)/, 1], [/^(suco|polpa)/, 5], [/^(pre ?-?cozid|enlatad|em conserva|congelad)/, 2], [/^(empanad|milanesa|a milanesa|frit)/, 3], [/^(cru|crua|cruo)/, 4]];
const rankEstado = e => { for (const [r, v] of RANK) if (r.test(e)) return v; return 2; };

// ---------------------------------------------------------------------------------------------
// 6) Porções caseiras por tipo de alimento (primeira que casar). Formato "nome:gramas;...". A 1ª é a padrão.
//    Valores são estimativas de tamanhos médios (medidas caseiras usuais).
const PORCOES = [
  // cereais
  [/^arroz.*cozid/, 'escumadeira:100;colher de sopa:25;prato:200;xicara:160'],
  [/^arroz|^canjica, branca|^milho, fuba|^milho, amido|^farinha, de (arroz|centeio)|^creme de (arroz|milho)/, 'colher de sopa:15;xicara:150'],
  [/^farinha|^polvilho|^fecula/, 'colher de sopa:10;xicara:120'],
  [/^aveia/, 'colher de sopa:15;porcao:30'],
  [/^biscoito, doce, maisena/, 'unidade:6;pacote:30'],
  [/^biscoito, doce, wafer/, 'unidade:10;pacote:140'],
  [/^biscoito, doce/, 'unidade:12;pacote:130'],
  [/^biscoito, polvilho/, 'unidade:5;punhado:30'],
  [/^biscoito/, 'unidade:6;pacote:30'],
  [/^bolo, mistura/, 'colher de sopa:15;porcao:40'],
  [/^bolo, pronto/, 'fatia:60;pedaco:60'],
  [/^canjica, com leite|^curau, milho verde$|^mingau|^cereais, mingau|^farinha, lactea/, 'tigela:200;xicara:150'],
  [/^curau/, 'colher de sopa:15;porcao:40'],
  [/^cereal matinal|^cereais, milho, flocos/, 'xicara:30;tigela:40'],
  [/^cereais, mistura/, 'colher de sopa:15;porcao:30'],
  [/^lasanha.*cozid/, 'pedaco:150;prato:250'],
  [/^lasanha/, 'porcao:80;unidade:25'],
  [/^macarrao, instantaneo/, 'pacote:80;porcao:80'],
  [/^macarrao/, 'porcao:80;prato:100'],
  [/^milho, verde, cru/, 'espiga:100;porcao:100'],
  [/^milho, verde/, 'colher de sopa:15;porcao:100;xicara:140'],
  [/^pamonha/, 'unidade:150'],
  [/^pao, de queijo/, 'unidade:25;grande:50'],
  [/^pao, (aveia|de soja|gluten|milho|trigo, forma)/, 'fatia:25;unidade:25'],
  [/^pao, trigo, sovado|^pao/, 'unidade:50;fatia:25'],
  [/^pastel, massa/, 'unidade:40'],
  [/^pastel/, 'unidade:80;pedaco:80'],
  [/^pipoca/, 'xicara:15;saco:100;punhado:20'],
  [/^polenta/, 'fatia:80;porcao:100'],
  [/^torrada/, 'unidade:8;fatia:8'],
  // hortaliças
  [/^(alface|agriao|rucula|acelga|almeirao|chicoria|couve, manteiga, crua|espinafre.*cru|mostarda|taioba|serralha|catalonha, crua|repolho.*cru|caruru|aipo)/, 'porcao:60;prato:80;folha:8'],
  [/^(coentro|salsa|cebolinha|manjericao|alfavaca)/, 'colher de sopa:5;ramo:5'],
  [/^alho, cru/, 'dente:5;colher de cha:5'],
  [/^cebola/, 'unidade:110;rodela:15'],
  [/^tomate, (extrato|molho|pure)/, 'colher de sopa:20;porcao:50'],
  [/^tomate/, 'unidade:100;fatia:15;porcao:80'],
  [/^cenoura, crua/, 'unidade:80;colher de sopa:15;porcao:60'],
  [/^beterraba/, 'unidade:100;fatia:15;porcao:60'],
  [/^batata, (inglesa|baroa|doce)/, 'unidade:130;porcao:100'],
  [/^batata, frita, tipo chips/, 'pacote:40;porcao:30'],
  [/^batata, frita|^mandioca, frita/, 'porcao:100;punhado:50'],
  [/^batata|^cara|^inhame|^mandioca, (cozida|crua)/, 'pedaco:100;porcao:100'],
  [/^mandioca, farofa/, 'colher de sopa:20;porcao:50'],
  [/^nhoque/, 'porcao:120;prato:200'],
  [/^palmito/, 'unidade:25;porcao:50'],
  [/^pepino/, 'rodela:5;porcao:60'],
  [/^pimentao/, 'unidade:100;rodela:10;porcao:40'],
  [/^seleta|^feijao, broto/, 'porcao:100;colher de sopa:20'],
  [/^(abobora|abobrinha|berinjela|brocolis|couve|chuchu|jilo|maxixe|nabo|quiabo|rabanete|vagem|jurubeba)/, 'porcao:80;colher de sopa:25;xicara:100'],
  // frutas
  [/^(doce|mamao.*doce|goiaba, doce|figo, enlatado|ameixa.*calda|ameixa, em calda|banana, doce|pessego, enlatado)/, 'colher de sopa:30;porcao:50'],
  [/^macauba/, 'porcao:50'],
  [/^banana, ouro/, 'unidade:40'], [/^banana, nanica/, 'unidade:90'], [/^banana, da terra/, 'unidade:150'], [/^banana, pacova/, 'unidade:100'],
  [/^banana, figo/, 'unidade:60'], [/^banana/, 'unidade:70'],
  [/^acai, polpa/, 'porcao:100;tigela:200'],
  [/^abacate/, 'porcao:100;colher de sopa:25;unidade:200'],
  [/^abacaxi, polpa|, polpa, congelada|, polpa$/, 'porcao:100;copo:200'],
  [/^abacaxi/, 'fatia:75;rodela:75'],
  [/, suco/, 'copo:200;xicara:240'],
  [/^(laranja|tangerina|mexerica)/, 'unidade:150'],
  [/^(maca|pera|caqui|ata|atemoia|pinha)/, 'unidade:130'],
  [/^(ameixa|pessego|nespera|caju|caja|goiaba|carambola|figo|romã|roma|kiwi|limao)/, 'unidade:70'],
  [/^(mamao, (formosa|papaia))/, 'fatia:150;porcao:150'],
  [/^manga/, 'unidade:200;fatia:100;porcao:100'],
  [/^melancia/, 'fatia:200'], [/^melao/, 'fatia:150'],
  [/^morango/, 'unidade:12;porcao:100'],
  [/^(uva)/, 'porcao:100;cacho:150;punhado:50'],
  [/^(acerola|jabuticaba|pitanga|umbu|jambo|jamelao|ciriguela)/, 'porcao:60;punhado:50'],
  [/^(jaca|pequi|tucuma|macauba|tamarindo|abiu|fruta-pao|graviola|cupuacu|cacau|maracuja)/, 'porcao:100;unidade:50'],
  // gorduras
  [/^(azeite|oleo)/, 'colher de sopa:13;colher de cha:5;fio:5'],
  [/^(manteiga|margarina)/, 'colher de cha:5;colher de sopa:15;ponta de faca:5'],
  // pescados
  [/^(atum, conserva|sardinha, conserva)/, 'lata:120;colher de sopa:25'],
  [/^camarao/, 'porcao:100;unidade:15'],
  [/^(lambari|manjuba|porquinho|sardinha, (frita|assada|inteira))/, 'porcao:100;unidade:30'],
  [/^(bacalhau|cacao|corvina|dourada|merluza|pescada|pescadinha|pintado|salmao|tucunare|abadejo|atum, fresco|corimba|caranguejo|sardinha)/, 'file:120;porcao:100'],
  // carnes
  [/^caldo/, 'tablete:10'],
  [/^(apresuntado|presunto|mortadela)/, 'fatia:15;porcao:30'],
  [/^salame|^toucinho/, 'fatia:10;porcao:30'],
  [/^(coxinha|croquete|empada)/, 'unidade:60'],
  [/^quibe/, 'unidade:80'],
  [/^hamburguer/, 'unidade:90;porcao:100'],
  [/^linguica/, 'unidade:70;gomo:70;porcao:100'],
  [/^carne, bovina, almondegas/, 'unidade:25;porcao:100'],
  [/^carne, bovina, (acem, moido|charque|seca)/, 'colher de sopa:30;porcao:100'],
  [/^carne, bovina, (costela|cupim|fraldinha)/, 'pedaco:150;porcao:100'],
  [/^carne, bovina|^porco, (bisteca|lombo|pernil)/, 'bife:100;porcao:100;file:120'],
  [/^porco/, 'pedaco:100;porcao:100'],
  [/^frango, (coxa)/, 'unidade:90;porcao:100'],
  [/^frango, sobrecoxa/, 'unidade:120;porcao:100'],
  [/^frango, asa/, 'unidade:40;porcao:100'],
  [/^frango, (coracao|figado)/, 'porcao:100;unidade:15'],
  [/^frango, (peito|filé|file)/, 'file:120;porcao:100'],
  [/^frango|^peru/, 'pedaco:100;porcao:100'],
  // laticínios
  [/^leite, de (vaca, (achocolatado|desnatado, uht|integral$)|cabra)|^leite, fermentado|^bebida lactea/, 'copo:200;xicara:240'],
  [/^leite, de vaca, .*po$|^leite, de vaca, .*, po/, 'colher de sopa:15;porcao:30'],
  [/^iogurte/, 'pote:170;copo:170'],
  [/^queijo, (minas|ricota|requeijao)/, 'fatia:30;porcao:50'],
  [/^queijo, parmesao/, 'colher de sopa:10;porcao:20'],
  [/^queijo, petit suisse/, 'unidade:45'],
  [/^queijo/, 'fatia:20;porcao:30'],
  [/^creme de leite|^leite, condensado/, 'colher de sopa:20'],
  // bebidas
  [/^bebida isotonica/, 'garrafa:500;copo:200'],
  [/^cafe/, 'xicara:50;cafezinho:50;caneca:200'],
  [/^cana, aguardente/, 'dose:50;copo:200'],
  [/^cana, caldo/, 'copo:300;copo pequeno:200'],
  [/^cerveja/, 'lata:350;long neck:355;copo:300'],
  [/^cha/, 'xicara:200;copo:200'],
  [/^coco, agua/, 'copo:200;coco:300'],
  [/^refrigerante/, 'lata:350;copo:200;garrafa:600;litro:1000'],
  // ovos
  [/^omelete/, 'unidade:100'],
  [/^ovo, de codorna/, 'unidade:10;porcao:50'],
  [/^ovo, de galinha, clara/, 'unidade:30'],
  [/^ovo, de galinha, gema/, 'unidade:17'],
  [/^ovo/, 'unidade:50'],
  // açucarados e miscelânea
  [/^achocolatado/, 'colher de sopa:15;colher de sobremesa:10'],
  [/^acucar/, 'colher de cha:5;colher de sobremesa:10;colher de sopa:15'],
  [/^chocolate/, 'barra:25;quadrado:5;tablete:90'],
  [/^cocada/, 'unidade:30;pedaco:30'],
  [/^(maria mole|quindim)/, 'unidade:40;pedaco:40'],
  [/^(doce, de|marmelada)/, 'colher de sopa:30;fatia:30'],
  [/^(gelei|glicose|melado|mel)/, 'colher de sopa:20'],
  [/^rapadura/, 'pedaco:25'],
  [/^capuccino/, 'colher de sopa:15;sache:20'],
  [/^gelatina/, 'sache:35'],
  [/^(fermento)/, 'colher de cha:5'],
  [/^(shoyu|tempero)/, 'colher de sopa:15;pitada:1'],
  [/^sal/, 'pitada:1;colher de cha:6;colher de sopa:18'],
  [/^azeitona/, 'unidade:4;porcao:30'],
  [/^chantilly/, 'colher de sopa:10'],
  [/^leite, de coco/, 'colher de sopa:15;copo:200'],
  [/^tapioca/, 'unidade:90'],
  [/^bolinho/, 'unidade:40'],
  [/^salada|^salpicao|^tabule|^charuto/, 'porcao:100;colher de sopa:25'],
  // leguminosas / oleaginosas
  [/^feijao, .*cozid/, 'concha:80;colher de sopa:25;porcao:100'],
  [/^(feijao|lentilha|grao|guandu)/, 'colher de sopa:15;xicara:190'],
  [/^ervilha/, 'colher de sopa:20;porcao:100'],
  [/^amendoim/, 'punhado:30;porcao:30'],
  [/^pacoca/, 'unidade:20'], [/^pe de moleque/, 'unidade:25'],
  [/^soja, extrato soluvel, natural/, 'copo:200;xicara:240'],
  [/^soja, queijo/, 'fatia:60;porcao:100'],
  [/^soja|^tremoco/, 'colher de sopa:10;porcao:50'],
  [/^(amendoa|noz|castanha de caju)/, 'punhado:30;unidade:4'],
  [/^castanha do brasil/, 'unidade:5;punhado:30'],
  [/^coco/, 'colher de sopa:10;porcao:30'],
  [/^(gergelim|linhaca)/, 'colher de sopa:10;colher de cha:3'],
  [/^(pinhao|pupunha)/, 'porcao:50;unidade:10'],
  // preparados (pratos)
  [/./, 'porcao:100'],
];
const PRATOS = 'prato:250;porcao:150;concha:120';

// ---------------------------------------------------------------------------------------------
const GRUPO = { 'Cereais e derivados': 'cereais', 'Verduras, hortaliças e derivados': 'verduras', 'Frutas e derivados': 'frutas',
  'Gorduras e óleos': 'gorduras', 'Pescados e frutos do mar': 'peixes', 'Carnes e derivados': 'carnes', 'Leite e derivados': 'laticinios',
  'Bebidas (alcoólicas e não alcoólicas)': 'bebidas', 'Ovos e derivados': 'ovos', 'Produtos açucarados': 'doces', 'Miscelâneas': 'outros',
  'Outros alimentos industrializados': 'outros', 'Alimentos preparados': 'pratos', 'Leguminosas e derivados': 'leguminosas', 'Nozes e sementes': 'oleaginosas' };

function grupoDe(a, d) {
  const g = GRUPO[a.grupo] || 'outros';
  if (g === 'verduras' && /^(batata|cara|inhame|mandioca|nhoque|biscoito|farinha|fecula|polvilho|pao)/.test(d)) return /^(biscoito|pao|farinha|fecula|polvilho)/.test(d) ? 'cereais' : 'feculentos';
  if (g === 'carnes' && /^(coxinha|croquete|empada|quibe|hamburguer)/.test(d)) return 'fastfood';
  if (g === 'cereais' && /^pastel/.test(d)) return 'fastfood';
  return g;
}

function flagsDe(a, d, c) {
  const f = [];
  const liquido = /^(bebida|cafe|cana, (caldo|aguardente)|cerveja|cha|coco, agua|refrigerante)|, suco|^leite, de (cabra|coco)|^leite, de vaca, (achocolatado|desnatado, uht|integral$)|^leite, fermentado|extrato soluvel, natural|^soja, extrato soluvel, natural/.test(d);
  if (liquido) f.push('l');
  if (/^(refrigerante|bebida isotonica|cana, caldo)|achocolatado$|suco concentrado|bebida lactea/.test(d) || /^leite, de vaca, achocolatado/.test(d)) f.push('b');
  if (/^(refrigerante|biscoito|bolo|cereal matinal|macarrao, instantaneo|batata, frita, tipo chips|apresuntado|mortadela|salame|linguica|hamburguer|caldo|margarina|chantilly|achocolatado|bebida|queijo, petit|queijo, pasteurizado|iogurte, sabor|coxinha|croquete|empada|gelatina|capuccino|leite, de vaca, achocolatado|farinha, lactea|mingau|cereais, mingau|curau, milho verde, mistura|pastel, massa|maria mole|chocolate|goiaba, doce|doce)/.test(d)) f.push('u');
  // estimativa de açúcar (g/100g), por fração do carboidrato; só para produtos açucarados/bebidas doces
  const frac = [
    [/^refrigerante|^bebida isotonica|^cana, caldo/, 1], [/^acucar/, 1], [/^achocolatado, po/, 0.75], [/^leite, de vaca, achocolatado/, 0.8],
    [/^chocolate/, 0.85], [/^biscoito, doce, wafer/, 0.45], [/^biscoito, doce, recheado/, 0.4], [/^biscoito, doce/, 0.3], [/^bolo, (pronto|mistura)/, 0.4],
    [/^cereal matinal, milho, acucar/, 0.35], [/^iogurte, sabor/, 0.85], [/^bebida lactea/, 0.8], [/^queijo, petit/, 0.7],
    [/suco concentrado|, suco$|polpa.*xarope/, 0.9], [/^(cocada|doce|goiaba, doce|mamao.*doce|banana, doce|maria mole|marmelada|quindim|geleia|melado|rapadura|glicose|ameixa.*calda|figo, enlatado|pessego, enlatado|ameixa, calda)/, 0.9],
    [/^capuccino/, 0.7], [/^gelatina/, 0.85], [/^curau, milho verde, mistura|^mingau|^farinha, lactea|^cereais, mingau/, 0.3], [/^paçoca|^pacoca|^pe-de-moleque/, 0.45], [/^chantilly/, 0.1],
  ];
  let acucar = 0;
  for (const [r, x] of frac) if (r.test(d)) { acucar = Math.round(c * x * 10) / 10; break; }
  if (/^acucar, (cristal|refinado)/.test(d)) acucar = 99.5;
  if (acucar > 0) f.push('a=' + acucar);
  return f.join(';');
}

// ---------------------------------------------------------------------------------------------
const baseAlias = new Set(BASE.flatMap(a => a.aliasNorm));
const usados = new Set(baseAlias);          // apelidos já ocupados (base primeiro; depois TACO por ordem de preferência)
const num = x => (x == null || Number.isNaN(x) ? 0 : Math.round(x * 10) / 10);

// pré-processamento: partes, estado, qualificador, núcleo
const itens = [];
const ignorados = [];
for (const a of fonte.alimentos) {
  const descricao = arruma(a.descricao);
  const partes = descricao.split(',').map(s => s.trim()).filter(Boolean);
  const d = N(descricao).replace(/ ?, ?/g, ', ');
  let kcal = a.kcal;
  const p = num(a.proteina), c = num(a.carboidrato), g = num(a.lipideos), f = num(a.fibra);
  if (ZERO.test(descricao)) kcal = 0;
  if (kcal == null) {
    if (a.proteina != null && a.carboidrato != null && a.lipideos != null) kcal = Math.round(4 * a.proteina + 4 * a.carboidrato + 9 * a.lipideos);
    else { ignorados.push([a.id, descricao, 'sem energia na TACO']); continue; }
  }
  if (DUPLICADOS.has(a.id)) { ignorados.push([a.id, descricao, 'já existe no banco base']); continue; }
  const pn = partes.map(N);
  const estados = [], quals = [], nucleo = [];
  pn.forEach((x, i) => {
    if (i > 0 && ESTADO.test(x)) estados.push(partes[i]);
    else if (i > 0 && QUALIF.test(x)) quals.push(partes[i]);
    else nucleo.push(partes[i]);
  });
  itens.push({ a, descricao, d, partes, pn, estados, quals, nucleo, kcal, p, c, g, f });
}

const NOMES = { 14: 'Mistura para bolo', 23: 'Mingau de milho infantil', 24: 'Mistura para vitamina (trigo, cevada e aveia)', 46: 'Mingau tradicional (pó)',
  456: 'Leite em pó desnatado', 473: 'Caldo de cana', 472: 'Cachaça (aguardente de cana)', 478: 'Água de coco', 36: 'Farinha láctea de cereais',
  27: 'Creme de arroz (pó)', 28: 'Creme de milho (pó)', 30: 'Mistura para curau de milho verde', 454: 'Leite de cabra', 460: 'Leite fermentado' };

// núcleo curto ("patinho", "frango peito", "arroz tipo 1") e ranking dentro de cada núcleo
for (const it of itens) {
  let nuc = it.nucleo.map(N);
  if (nuc[0] === 'carne' && nuc[1] === 'bovina') it.curto = nuc.slice(2).join(' ') || 'carne bovina';
  else if (nuc[0] === 'carne') it.curto = nuc.slice(1).join(' ');
  else it.curto = nuc.join(' ');
  if (['seca', 'peito', 'paleta', 'flanco', 'charque'].includes(it.curto) && nuc[0] === 'carne') it.curto = 'carne ' + it.curto;
  it.estado = it.estados.length ? N(it.estados[0]) : '';
  it.pesoQual = it.quals.some(q => /^com (pele|gordura)/.test(N(q))) ? 10 : 0;
  it.rk = it.pesoQual + (it.estado ? rankEstado(it.estado) : 2);
  it.nomeExib = nomeExibicao(it);
}

function nomeExibicao(it) {
  if (NOMES[it.a.id]) return NOMES[it.a.id];
  const nuc = it.nucleo.slice();
  if (N(nuc[0]) === 'carne' && N(nuc[1]) === 'bovina') nuc.splice(0, 2, 'Carne bovina');
  let nome = nuc.join(' ');
  const par = [...it.quals, ...it.estados];
  if (par.length) nome += ` (${par.map(x => x.toLowerCase() === x ? x : x[0].toLowerCase() + x.slice(1)).join(', ')})`;
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

// agrupa por núcleo curto: o melhor ranking recebe o apelido curto
const porCurto = new Map();
for (const it of itens) { if (!porCurto.has(it.curto)) porCurto.set(it.curto, []); porCurto.get(it.curto).push(it); }
for (const lista of porCurto.values()) lista.sort((x, y) => x.rk - y.rk || x.a.id - y.a.id);

// "família" = primeira palavra do nome ("banana", "feijao"): o melhor item da família ganha o apelido de uma palavra
const porFamilia = new Map();
for (const it of itens) {
  const fam = N(it.partes[0]);
  if (!porFamilia.has(fam)) porFamilia.set(fam, []);
  porFamilia.get(fam).push(it);
}
for (const lista of porFamilia.values()) lista.sort((x, y) => x.rk - y.rk || x.a.id - y.a.id);

function variacoes(alias) {
  const out = new Set([alias]);
  const n = ' ' + alias + ' ';
  for (const grupo of SINONIMOS) {
    for (const x of grupo) {
      const nx = ' ' + N(x) + ' ';
      if (n.includes(nx)) for (const y of grupo) if (y !== x) out.add(n.replace(nx, ' ' + N(y) + ' ').trim());
    }
  }
  return [...out];
}

const dono = new Map();
for (const [id, lista] of Object.entries(EXTRAS)) for (const x of lista) if (!dono.has(N(x))) dono.set(N(x), Number(id));
const ordemAlias = [...itens].sort((x, y) => x.quals.length - y.quals.length || x.rk - y.rk || x.a.id - y.a.id);
for (const it of ordemAlias) {
  const { a } = it;
  const als = [];
  const add = x => { const nx = N(x); if (nx && !als.includes(nx)) als.push(nx); };
  const ehTopo = porCurto.get(it.curto)[0] === it;
  const estadoTxt = it.estado;
  const sem = it.quals.map(N).join(' ');
  // 1) nome completo e curto
  if (ehTopo) add(it.curto);
  add(`${it.curto} ${sem} ${estadoTxt}`.replace(/\s+/g, ' '));
  add(`${it.curto} ${estadoTxt}`);
  add(it.partes.join(' '));
  if (it.partes[0] && N(it.partes[0]) === 'carne') add(`carne ${it.curto}`);
  if (/^frango/.test(it.d)) add(`${it.curto.replace('frango ', '')} de frango ${estadoTxt}`);
  // sucos e polpas: "suco de X"
  if (it.estados.some(e => /^suco/.test(N(e)))) add(`suco de ${it.nucleo.map(N).join(' ')}`);
  if (it.estados.some(e => /^polpa/.test(N(e)))) { add(`polpa de ${it.nucleo.map(N).join(' ')}`); add(`suco de ${it.nucleo.map(N).join(' ')}`); }
  // família: a palavra sozinha
  const fam = porFamilia.get(N(it.partes[0]));
  if (fam[0] === it) add(N(it.partes[0]));
  (EXTRAS[a.id] || []).forEach(add);
  // sinônimos
  [...als].forEach(x => variacoes(x).forEach(add));
  // remove apelidos já ocupados (base ou item anterior) e limita
  const finais = [];
  for (const x of als) {
    if (usados.has(x)) continue;
    if (dono.has(x) && dono.get(x) !== a.id) continue;   // apelido reservado a outro item por decisão manual
    usados.add(x);
    finais.push(x);
  }
  // nunca deixa o item sem o nome completo único
  const unico = N(it.descricao);
  if (!finais.length) finais.push(unico.replace(/,/g, ''));
  it.apelidos = finais.slice(0, 10);
}

function porcoesDe(it) {
  const d = it.d.replace(/-/g, '-');
  if (it.a.grupo === 'Alimentos preparados' && !/^(tapioca|bolinho|cuscuz|acaraje)/.test(d)) return PRATOS;
  for (const [r, v] of PORCOES) if (r.test(d)) return v;
  return 'porcao:100';
}

const linhas = itens.map(it => {
  const d = it.d;
  const grupo = grupoDe(it.a, d);
  const flags = flagsDe(it.a, d, it.c);
  return [it.a.id, it.nomeExib, grupo, it.kcal, it.p, it.c, it.g, it.f, porcoesDe(it), it.apelidos.join(';'), flags];
});

const meta = {
  fonte: fonte.metadados.fonte,
  licenca: 'Reprodução parcial ou total permitida, desde que citada a fonte (NEPA/UNICAMP). Transcrição em JSON: IgorFZ/taco-br, licença MIT.',
  homepage: fonte.metadados.homepage,
  base: 'valores por 100 g de parte comestível; porções caseiras, apelidos e açúcar são estimativas do Atlas Fitness',
  campos: ['id', 'nome', 'grupo', 'kcal', 'proteina', 'carboidrato', 'gordura', 'fibra', 'porcoes', 'apelidos', 'flags'],
  extras: EXTRAS_BASE,
};
fs.mkdirSync(path.join(raiz, 'data'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'data/taco.json'), JSON.stringify({ meta, itens: linhas }));
const tam = fs.statSync(path.join(raiz, 'data/taco.json')).size;
console.log(`taco.json: ${linhas.length} alimentos (${ignorados.length} ignorados), ${(tam / 1024).toFixed(0)} KB`);
if (RELATORIO) {
  console.log('--- ignorados'); ignorados.forEach(x => console.log(x.join(' | ')));
  console.log('--- exemplos');
  linhas.filter((_, i) => i % 9 === 0).forEach(l => console.log(JSON.stringify(l)));
}
