// Banco de alimentos brasileiro embutido (valores aproximados, estilo TACO).
// Todos os valores por 100 g (ou 100 ml, para líquidos). SÃO ESTIMATIVAS: marcas e preparos variam.
//
// Formato de cada linha:
//   nome | apelidos (;) | grupo | kcal prot carbo gord fibra | porções (nome:gramas;...) | flags
// A PRIMEIRA porção é a padrão quando a pessoa não informa quantidade.
// flags: u = ultraprocessado, b = bebida açucarada, l = líquido (ml), a=NN = açúcar g/100g, t = suplemento
import { normalizar, tokens } from './texto.js';

const LINHAS = `
arroz branco cozido|arroz;arroz branco;arroz soltinho|cereais|128 2.5 28.1 0.2 1.6|escumadeira:100;colher de sopa:25;concha:90;xicara:160;prato:220|
arroz integral cozido|arroz integral|cereais|124 2.6 25.8 1.0 2.7|escumadeira:100;colher de sopa:25;concha:90;xicara:160;prato:220|
macarrao cozido|macarrao;massa;espaguete;spaghetti;penne;talharim;macarrao cozido|cereais|102 3.4 19.9 0.5 1.5|pegador:110;prato:220;xicara:140|
macarrao integral cozido|macarrao integral;massa integral|cereais|124 5.3 26.5 0.5 3.9|pegador:110;prato:220|
macarrao instantaneo (miojo) preparado|miojo;macarrao instantaneo;lamen|cereais|150 3.6 21 5.8 1|pacote:250;prato:250|u
pao frances|pao frances;pao;paozinho;pao de sal;pao da padaria|cereais|300 8 58.6 3.1 2.3|unidade:50;metade:25|
pao de forma|pao de forma;pao de sanduiche;pao fatiado;pao branco|cereais|253 8 49.4 3.2 2.5|fatia:25;unidade:25|u
pao integral|pao integral;pao de forma integral|cereais|253 9.4 49.9 3.7 6.9|fatia:25;unidade:25|
pao de queijo|pao de queijo|cereais|363 5.1 34.2 22.6 0.6|unidade:25;grande:50|
tapioca (massa pronta)|tapioca;beiju;crepioca sem ovo|cereais|240 0.1 59.5 0.2 0.3|unidade:80;colher de sopa:20|
cuscuz de milho cozido|cuscuz;cuscuz nordestino;cuscuz de milho|cereais|113 2.2 25.3 0.7 2.1|prato:150;porcao:120;fatia:100|
aveia em flocos|aveia;flocos de aveia;aveia em flocao|cereais|394 13.9 66.6 8.5 9.1|porcao:30;colher de sopa:15;xicara:80|
granola|granola|cereais|420 8 68 13 6|porcao:40;colher de sopa:15;xicara:100|a=15
cereal matinal acucarado|cereal matinal;sucrilhos;sucrilho;cereal|cereais|380 6 85 2 3|xicara:30;tigela:40|u;a=35
barra de cereal|barra de cereal;barrinha de cereal;barrinha|cereais|390 6 70 10 4|unidade:25|u;a=28
pipoca de micro-ondas|pipoca;pipoca de microondas|cereais|460 9.5 55 22 10|saco:100;xicara:15;punhado:20|u
biscoito cream cracker|biscoito;bolacha;cream cracker;biscoito salgado;bolacha de agua e sal;biscoito de agua e sal|cereais|432 10.1 68.7 14.4 2.5|unidade:6;pacote:30|u
biscoito recheado|biscoito recheado;bolacha recheada;oreo;negresco|cereais|472 6.4 71 18 1.5|unidade:12;pacote:130|u;a=35
bolo simples|bolo;bolo caseiro;bolo de cenoura;bolo de fuba;bolo de laranja|doces|360 6 55 12 1|fatia:60;pedaco:60|a=25
torrada|torrada;torradinha|cereais|390 11 72 6 5|unidade:8;fatia:8|
batata inglesa cozida|batata;batata cozida;batata inglesa;pure de batata|feculentos|52 1.2 11.9 0 1.3|unidade:130;colher de sopa:30;porcao:150|
batata doce cozida|batata doce;batata-doce|feculentos|77 0.6 18.4 0.1 2.2|unidade:150;fatia:40;porcao:150|
mandioca cozida|mandioca;aipim;macaxeira|feculentos|125 0.6 30.1 0.3 1.6|porcao:120;pedaco:80|
inhame cozido|inhame;cara|feculentos|97 2.1 23.2 0.2 1.7|porcao:100;pedaco:80|
batata frita|batata frita;fritas;porcao de batata frita;batata frita mcdonalds|fastfood|312 3.7 41 15 3.8|porcao:120;pequena:75;media:115;grande:150;punhado:30|u
farofa pronta|farofa|feculentos|410 2.5 76 10.5 4.5|colher de sopa:20;porcao:50|
farinha de mandioca|farinha de mandioca;farinha;farinha de mandioca crua|feculentos|361 1.6 87.9 0.3 6.5|colher de sopa:15|
milho verde|milho;milho verde;milho cozido|feculentos|88 3.2 17.1 1.1 3.9|colher de sopa:25;lata:130;espiga:100|
feijao carioca cozido|feijao;feijao carioca;feijao marrom;caldo de feijao|leguminosas|76 4.8 13.6 0.5 8.5|concha:140;colher de sopa:30;prato:200|
feijao preto cozido|feijao preto|leguminosas|77 4.5 14 0.5 8.4|concha:140;colher de sopa:30;prato:200|
lentilha cozida|lentilha|leguminosas|93 6.3 16.3 0.5 7.9|colher de sopa:30;concha:120|
grao-de-bico cozido|grao de bico;grao-de-bico;homus|leguminosas|130 8.4 21 2.1 6|colher de sopa:25;xicara:160|
soja cozida|soja;edamame|leguminosas|141 12.5 9.9 6.4 5.6|colher de sopa:25;xicara:170|
ervilha|ervilha;ervilha em lata|leguminosas|78 5.4 14 0.4 5.5|colher de sopa:20;lata:130|
ovo cozido|ovo cozido;ovos cozidos|ovos|146 13.3 0.6 9.5 0|unidade:50|
ovo mexido|ovo mexido;ovos mexidos;mexido;ovo;ovos;ovo de galinha|ovos|175 11 1.5 13.5 0|unidade:55|
ovo frito|ovo frito;ovos fritos|ovos|240 15.6 1.2 18.6 0|unidade:50|
clara de ovo|clara;claras;clara de ovo;claras de ovo|ovos|52 11 0.7 0.2 0|unidade:33|
omelete simples|omelete;omelete de queijo|ovos|190 12.5 1.5 14.7 0|unidade:110|
peito de frango grelhado|frango;peito de frango;frango grelhado;file de frango;filé de frango;bife de frango|carnes|159 32 0 2.5 0|file:120;bife:100;porcao:100|
frango cozido desfiado|frango desfiado;frango cozido|carnes|163 31.5 0 3.2 0|colher de sopa:25;porcao:100|
frango assado (coxa e sobrecoxa)|coxa;sobrecoxa;coxa de frango;frango assado;frango com pele|carnes|215 26 0 12 0|unidade:90;porcao:100|
frango frito empanado|nuggets;nugget;frango empanado;frango a milanesa;empanado de frango|fastfood|296 15 18 18 1|unidade:20;porcao:100|u
patinho grelhado|patinho;bife de patinho;bife;carne;carne bovina;carne grelhada|carnes|219 35.9 0 7.3 0|bife:100;porcao:100|
alcatra grelhada|alcatra;bife de alcatra|carnes|241 31.9 0 11.5 0|bife:120;porcao:100|
contrafile grelhado|contrafile;contra file;bife de contrafile|carnes|258 30 0 15 0|bife:130;porcao:100|
picanha grelhada|picanha;churrasco;fraldinha|carnes|290 28 0 19 0|fatia:60;porcao:100|
carne moida refogada|carne moida;carne moída;moida|carnes|212 26.7 0 10.9 0|colher de sopa:30;porcao:100|
costela bovina assada|costela;costelinha|carnes|340 25 0 26 0|porcao:120;pedaco:100|
carne de porco lombo assado|lombo;carne de porco;porco;bisteca;lombo de porco|carnes|210 28 0 10 0|fatia:80;porcao:100|
linguica toscana grelhada|linguica;linguiça;linguica toscana;calabresa;linguica calabresa|carnes|280 17 1 23 0|unidade:80;gomo:60|u
salsicha|salsicha;salsichao;hot dog salsicha|carnes|260 11 3 22 0|unidade:50|u
bacon frito|bacon;toucinho|carnes|540 37 1.4 42 0|fatia:8;porcao:30|u
presunto|presunto;presunto fatiado;apresuntado|carnes|94 14.4 1.4 3.2 0|fatia:15|
peito de peru|peito de peru;blanquet;peru fatiado|carnes|105 17 3 3 0|fatia:15|
mortadela|mortadela|carnes|269 12 2.5 23 0|fatia:15|u
carne seca cozida|carne seca;charque;carne de sol|carnes|250 33 0 12 0|porcao:80|
tilapia grelhada|tilapia;peixe;peixe grelhado;file de peixe;pescada;merluza|peixes|128 26 0 2.7 0|file:120;porcao:100|
salmao grelhado|salmao;salmão|peixes|213 23 0 13 0|file:130;porcao:100|
atum em lata (natural)|atum;atum em lata;atum natural|peixes|118 26 0 1 0|lata:80;colher de sopa:20|
sardinha em lata|sardinha;sardinha em lata|peixes|208 24.6 0 11.5 0|lata:84;unidade:30|
camarao cozido|camarao;camarão|peixes|99 20 0.5 1.3 0|porcao:100;unidade:10|
sushi (uramaki)|sushi;uramaki;hossomaki;niguiri;nigiri;sushi roll|pratos|150 5 28 2 0.5|unidade:30;peca:30;porcao:240|
sashimi de salmao|sashimi;sashimi de salmao|peixes|142 20 0 6 0|fatia:20;porcao:100|
leite integral|leite;leite integral;copo de leite|laticinios|61 3.2 4.7 3.3 0|copo:200;xicara:240;colher de sopa:15|l
leite desnatado|leite desnatado;leite zero lactose desnatado;leite light|laticinios|35 3.4 5 0.1 0|copo:200;xicara:240|l
leite com cafe|cafe com leite;cafe c/ leite;cafe com leite integral;leite com cafe|bebidas|40 1.7 2.4 1.7 0|xicara:150;copo:200;caneca:250|l
achocolatado pronto|achocolatado;toddynho;nescau pronto;caixinha de achocolatado;leite com chocolate|bebidas|70 2.5 11 2 0.3|caixinha:200;copo:200|l;b;u;a=9
iogurte natural integral|iogurte;iogurte natural|laticinios|61 3.5 4.7 3.3 0|pote:170;copo:170|
iogurte grego natural|iogurte grego;grego|laticinios|115 5.5 6 7.5 0|pote:100;copo:170|
iogurte com polpa de frutas|iogurte de fruta;iogurte de morango;iogurte com frutas;danone|laticinios|85 2.6 14 2 0.2|pote:170;copo:170|u;a=12
iogurte proteico (tipo skyr)|iogurte proteico;skyr;iogurte high protein;iogurte whey|laticinios|62 10 3.5 0.2 0|pote:170;copo:170|
queijo mussarela|mussarela;muçarela;queijo mussarela;queijo muçarela;queijo|laticinios|330 22.6 3 25.2 0|fatia:15;porcao:30|
queijo minas frescal|queijo minas;minas frescal;queijo branco;queijo fresco|laticinios|264 17.4 3.2 20.2 0|fatia:30;porcao:30|
queijo cottage|cottage;queijo cottage;ricota|laticinios|98 11 3.4 4.3 0|colher de sopa:30;porcao:100|
queijo prato|queijo prato;prato fatiado|laticinios|360 23 1.5 29 0|fatia:15|
queijo coalho|queijo coalho;coalho|laticinios|300 22 2 23 0|espetinho:70;fatia:40|
queijo parmesao ralado|parmesao;queijo ralado;parmesão|laticinios|453 36 1.7 33 0|colher de sopa:8|
requeijao cremoso|requeijao;requeijão|laticinios|257 9.6 2.4 23.4 0|colher de sopa:30;colher de cha:10|
cream cheese|cream cheese;catupiry|laticinios|342 6 4 34 0|colher de sopa:20|
manteiga|manteiga|gorduras|726 0.4 0.1 82 0|colher de cha:5;ponta de faca:5;colher de sopa:15|
margarina|margarina|gorduras|596 0.1 0.2 66 0|colher de cha:5;ponta de faca:5;colher de sopa:15|
creme de leite|creme de leite|laticinios|221 2.2 3.4 22 0|colher de sopa:15;caixinha:200|
leite condensado|leite condensado|doces|313 7 56 8 0|colher de sopa:20;lata:395|u;a=55
leite em po integral|leite em po|laticinios|497 25.4 39 26.9 0|colher de sopa:15|
whey protein|whey;whey protein;proteina em po;suplemento de proteina;shake de whey|suplementos|400 80 8 6 0|scoop:30;dose:30;colher de sopa:15|t
albumina|albumina;proteina de ovo|suplementos|370 80 5 1 0|scoop:30;colher de sopa:15|t
colageno hidrolisado|colageno;collagen|suplementos|360 90 0 0 0|scoop:10;colher de sopa:10|t
creatina|creatina;creatina monohidratada|suplementos|0 0 0 0 0|dose:5;colher de cha:5|t
maltodextrina|maltodextrina;dextrose;carbo em po|suplementos|380 0 95 0 0|scoop:30;colher de sopa:15|t
hipercalorico|hipercalorico;mass gainer;hipercalórico|suplementos|380 15 75 3 1|scoop:100;dose:100|t
barra de proteina|barra de proteina;protein bar;barrinha de proteina;bolinho proteico|suplementos|360 30 35 11 5|unidade:45|t;u;a=8
pasta de amendoim|pasta de amendoim;pasta de amendoin;amendoim pasta;manteiga de amendoim|oleaginosas|588 25 20 50 6|colher de sopa:15;colher de cha:5|
banana prata|banana;banana prata;banana nanica;banana-prata|frutas|98 1.3 26 0.1 2|unidade:70;grande:90|
maca|maca;maçã;maca fuji;maca gala|frutas|56 0.3 15.2 0 1.3|unidade:130|
laranja|laranja;laranja pera;laranja lima|frutas|46 1 11.5 0.1 1.1|unidade:140|
tangerina (mexerica)|mexerica;tangerina;bergamota;ponkan|frutas|38 0.8 9.6 0.1 1.2|unidade:100|
pera|pera|frutas|53 0.6 14 0.1 3|unidade:150|
mamao papaia|mamao;mamão;papaya|frutas|40 0.5 10.4 0.1 1|fatia:170;unidade:300|
melancia|melancia|frutas|33 0.9 8.1 0 0.1|fatia:200;xicara:150|
melao|melao;melão|frutas|29 0.7 7.5 0 0.3|fatia:150|
abacaxi|abacaxi|frutas|48 0.9 12.3 0.1 1|fatia:75;rodela:75|
manga|manga;manga palmer;manga tommy|frutas|72 0.4 19.4 0.2 1.6|unidade:200;fatia:100|
uva|uva;uvas|frutas|53 0.7 13.6 0.2 0.9|cacho:100;punhado:80;unidade:5|
morango|morango;morangos|frutas|30 0.9 6.8 0.3 1.7|unidade:12;xicara:150;porcao:100|
abacate|abacate;avocado|frutas|96 1.2 6 8.4 6.3|colher de sopa:30;unidade:300;fatia:60|
kiwi|kiwi|frutas|51 1.3 11.5 0.6 2.7|unidade:75|
goiaba|goiaba|frutas|54 1.1 13 0.4 6.2|unidade:170|
limao|limao;limão|frutas|32 0.9 10.5 0.1 1.5|unidade:60|
acai na tigela|acai;açaí;acai na tigela;tigela de acai;acai com granola|frutas|140 2 24 4 3|copo:300;tigela:300;porcao:300;pequeno:200|a=15
uva passa|uva passa;passas|frutas|299 3.1 79 0.5 3.7|colher de sopa:12;punhado:30|a=59
amendoim torrado|amendoim;amendoim torrado|oleaginosas|580 26 21 49 8|punhado:30;colher de sopa:10;pacotinho:50|
castanha de caju|castanha de caju;caju castanha|oleaginosas|570 18 30 46 3.3|unidade:3;punhado:30|
castanha-do-para|castanha do para;castanha-do-para;castanha do pará;castanha|oleaginosas|656 14.5 12.3 63.5 7.9|unidade:4;punhado:30|
nozes|nozes;noz|oleaginosas|620 14 18 59 6.7|unidade:5;punhado:30|
amendoas|amendoas;amêndoas;amendoa|oleaginosas|580 21 22 50 12|unidade:1.2;punhado:30|
chia|chia;semente de chia|oleaginosas|486 16.5 42 31 34|colher de sopa:12|
alface|alface;folhas;salada verde|verduras|15 1.4 2.9 0.2 2|prato:50;folha:8;porcao:50|
tomate|tomate;tomates|verduras|15 1.1 3.1 0.2 1.2|unidade:100;fatia:20;porcao:80|
cenoura|cenoura;cenoura crua;cenoura ralada|verduras|34 1.3 7.7 0.2 3.2|unidade:80;colher de sopa:20;porcao:60|
brocolis cozido|brocolis;brócolis|verduras|25 2.1 4.4 0.5 3.4|ramo:30;porcao:80;xicara:90|
couve refogada|couve;couve refogada;couve manteiga|verduras|90 3.2 8 5.5 4|colher de sopa:20;porcao:50|
couve-flor cozida|couve flor;couve-flor|verduras|23 1.9 4.5 0.2 2|porcao:80;ramo:30|
abobrinha cozida|abobrinha;abobrinha refogada|verduras|18 1.1 4.3 0.2 1|porcao:80;colher de sopa:25|
beterraba cozida|beterraba|verduras|32 1.3 7.2 0.1 1.9|unidade:100;colher de sopa:25;fatia:15|
pepino|pepino|verduras|10 0.9 2 0 0.7|unidade:150;fatia:10;porcao:60|
cebola|cebola;cebolas|verduras|39 1.7 8.9 0.2 2.2|unidade:100;fatia:10|
vagem cozida|vagem|verduras|25 1.8 5.4 0.2 3|porcao:70;colher de sopa:20|
espinafre refogado|espinafre|verduras|67 2.7 4.3 4.5 2|colher de sopa:20;porcao:50|
abobora cozida|abobora;abóbora;moranga|verduras|29 0.7 6.5 0.2 1.7|porcao:100;colher de sopa:30|
chuchu cozido|chuchu|verduras|19 0.4 4.8 0 1.3|porcao:80;colher de sopa:25|
berinjela|berinjela|verduras|20 1 4.4 0.2 2.5|porcao:100;fatia:30|
pimentao|pimentao;pimentão|verduras|28 1.2 6 0.3 2|unidade:120;tira:10|
salada mista|salada;salada de tomate e alface;salada de folhas e legumes|verduras|25 1.4 4.5 0.3 2|prato:100;porcao:100|
legumes cozidos|legumes;legumes refogados;mix de legumes;legumes no vapor|verduras|40 1.8 7.5 0.5 2.5|porcao:100;colher de sopa:30|
azeite de oliva|azeite;azeite de oliva|gorduras|884 0 0 100 0|colher de sopa:13;colher de cha:4;fio:5|
oleo de soja|oleo;óleo;oleo de soja;oleo de cozinha|gorduras|884 0 0 100 0|colher de sopa:13;colher de cha:4|
acucar refinado|acucar;açúcar;acucar refinado;acucar cristal|doces|387 0 99.5 0 0|colher de cha:5;colher de sopa:15;sache:5;colher de sobremesa:10|a=99.5
mel|mel|doces|309 0.4 84 0 0|colher de sopa:21;colher de cha:7|a=82
geleia de frutas|geleia;geleia de morango;geleia de uva|doces|250 0.4 64 0 0.7|colher de sopa:20;colher de cha:7|a=55
doce de leite|doce de leite|doces|315 5.5 59 7 0|colher de sopa:20;colher de cha:7|a=55
creme de avelã com cacau|nutella;creme de avela;creme de avelã;chocolate para passar|doces|539 6 58 31 3|colher de sopa:15;colher de cha:5|u;a=56
chocolate ao leite|chocolate;chocolate ao leite;barra de chocolate;bombom;bombons|doces|535 7.5 59 30 2|barra:25;quadrado:5;bombom:20;tablete:90|u;a=52
chocolate amargo 70%|chocolate amargo;chocolate 70%;chocolate meio amargo|doces|560 8 33 42 11|quadrado:10;barra:25|a=25
brigadeiro|brigadeiro;beijinho|doces|410 4 60 18 0.5|unidade:20|a=55
paçoca|pacoca;paçoca|doces|510 17 53 28 5|unidade:20;rolha:20|a=36
sorvete|sorvete;sorvete de creme;picole de leite;picolé de leite|doces|207 3.5 24 11 0.5|bola:60;picole:65;casquinha:90|u;a=22
pudim|pudim;pudim de leite|doces|150 4 25 4 0|fatia:100|a=22
gelatina|gelatina;gelatina pronta|doces|62 1.3 14 0 0|copo:150;pote:120|a=14
maionese|maionese|gorduras|302 0.6 8 30 0|colher de sopa:15;sache:10|u
ketchup|ketchup;catchup|gorduras|100 1.2 24 0.2 0.5|colher de sopa:15;sache:8|u;a=22
molho de tomate|molho de tomate;molho;molho de macarrao;extrato de tomate|gorduras|38 1.3 8 0.3 1.5|concha:60;colher de sopa:30|a=5
refrigerante|refrigerante;coca;coca cola;coca-cola;guarana;guaraná;fanta;pepsi;sprite;soda|bebidas|42 0 10.6 0 0|lata:350;copo:200;garrafa:600;garrafinha:290;litro:1000|l;b;u;a=10.6
refrigerante zero|refrigerante zero;coca zero;coca light;refrigerante diet;guarana zero|bebidas|1 0 0.1 0 0|lata:350;copo:200;garrafa:600;litro:1000|l
suco de laranja natural|suco de laranja;suco natural;suco de laranja natural|bebidas|45 0.7 10.4 0.2 0.2|copo:200;copo grande:300;xicara:240|l;a=8.4
suco de caixinha (nectar)|suco de caixinha;suco de caixa;nectar;suco industrializado;suco de uva;suco de pessego;del valle|bebidas|50 0.2 12 0 0|caixinha:200;copo:200;litro:1000|l;b;u;a=11
suco em po preparado|suco em po;tang;clight;refresco em po;refresco|bebidas|38 0 9.5 0 0|copo:200|l;b;u;a=9
agua de coco|agua de coco;água de coco|bebidas|22 0 5.3 0 0|copo:200;caixinha:200;coco:300|l
cerveja|cerveja;chopp;chope;cerveja long neck;cerva|bebidas|43 0.5 3.6 0 0|lata:350;long neck:355;copo:300;garrafa:600;tulipa:300|l
vinho tinto|vinho;vinho tinto;taca de vinho;vinho branco|bebidas|85 0.1 2.6 0 0|taca:150;copo:200|l
destilado (cachaca, vodka, whisky)|cachaca;vodka;whisky;pinga;gin;destilado;tequila;caipirinha sem acucar|bebidas|231 0 0 0 0|dose:30;copo:200|l
caipirinha|caipirinha;caipirinha de limao|bebidas|130 0 12 0 0|copo:250;unidade:250|l;a=11
cafe sem acucar|cafe;café;cafezinho;cafe preto;cafe coado|bebidas|2 0.1 0.4 0 0|xicara:50;cafezinho:50;caneca:200;copo:200|l
cafe com acucar|cafe com acucar;cafe adocado|bebidas|40 0.1 10 0 0|xicara:50;cafezinho:50;caneca:200|l;a=9.5
cappuccino|capuccino;cappuccino;cafe cremoso|bebidas|60 2 8 2.3 0|xicara:150;caneca:250|l;a=6
cha sem acucar|cha;chá;cha verde;cha de camomila;mate;cha mate|bebidas|1 0 0.2 0 0|xicara:200;caneca:250|l
energetico|energetico;red bull;monster;energético|bebidas|45 0 11 0 0|lata:250;lata grande:473|l;b;u;a=11
isotonico|isotonico;gatorade;powerade;isotônico|bebidas|25 0 6 0 0|garrafa:500;copo:200|l;b;u;a=5.5
vitamina de banana com leite|vitamina;vitamina de banana;vitamina de frutas;smoothie|bebidas|85 2.8 14 2.2 0.8|copo:300;copo pequeno:200|l;a=9
milk-shake|milk shake;milkshake;milk-shake|bebidas|130 3.3 21 3.5 0|copo:400;pequeno:300|l;u;a=19
agua|agua;água;agua mineral|bebidas|0 0 0 0 0|copo:200;garrafa:500;litro:1000|l
feijoada|feijoada|pratos|150 8.5 11 7.5 4|concha:130;prato:300|
strogonoff de frango|strogonoff;estrogonofe;strogonoff de carne|pratos|150 11 5 9.5 0.5|concha:130;prato:250|
lasanha a bolonhesa|lasanha;lasanha bolonhesa|pratos|165 9 17 7 1|porcao:250;pedaco:250|
pizza de mussarela|pizza;pizza mussarela;pizza de queijo;pizza de calabresa;pizza de frango;pizza de presunto;pizza portuguesa;pizza margherita;pizza marguerita;pizza quatro queijos;pizza de atum;pizza de bacon|fastfood|270 11 33 10 2|fatia:110;pedaco:110;broto:300|u
esfiha de carne|esfiha;esfirra|fastfood|250 11 29 10 1.5|unidade:90|
coxinha|coxinha;coxinha de frango|fastfood|275 7 29 14 1|unidade:90;mini:35|u
pastel frito|pastel;pastel de carne;pastel de queijo;pastel de feira|fastfood|300 9 30 16 1|unidade:100;grande:150|u
empada|empada;empadinha|fastfood|380 7 38 22 1|unidade:70;mini:30|u
hamburguer (sanduiche completo)|hamburguer;hamburger;x-burger;x burguer;xburguer;x-salada;lanche;sanduiche;cheeseburger|fastfood|260 13 24 12 1.2|unidade:200;grande:280|u
big mac|big mac;bigmac|fastfood|257 12.5 19.6 15.6 1.2|unidade:215|u
cachorro-quente|cachorro quente;cachorro-quente;hot dog;hotdog;completo|fastfood|250 9 25 12 1|unidade:150|u
misto quente|misto quente;misto;queijo quente;pao com queijo e presunto|fastfood|290 14 27 14 1.2|unidade:130|u
pao com manteiga|pao na chapa;pao com manteiga;pao com requeijao|fastfood|330 8 54 9 2|unidade:60|
acaraje|acaraje;acarajé|fastfood|290 8 28 16 3|unidade:120|
tapioca com queijo|tapioca com queijo;tapioca de queijo|pratos|230 8 36 6 0.2|unidade:130|
prato feito (arroz, feijao, carne e salada)|pf;prato feito;marmita;marmitex;quentinha;prato executivo|pratos|140 8 17 4 3|marmita:450;prato:400;pequena:300;grande:600|
`;

function parseFlags(s = '') {
  const f = { ultra: false, bebidaAcucarada: false, liquido: false, suplemento: false, acucar: 0 };
  for (const p of s.split(';').map(x => x.trim()).filter(Boolean)) {
    if (p === 'u') f.ultra = true;
    else if (p === 'b') f.bebidaAcucarada = true;
    else if (p === 'l') f.liquido = true;
    else if (p === 't') f.suplemento = true;
    else if (p.startsWith('a=')) f.acucar = parseFloat(p.slice(2));
  }
  return f;
}

// Os nomes das linhas acima são escritos sem acento (facilita a busca); aqui voltam a ser exibidos com acento.
const ACENTOS = { pao: 'pão', paes: 'pães', frances: 'francês', feijao: 'feijão', macarrao: 'macarrão', acucar: 'açúcar', acucarado: 'açucarado', cafe: 'café', grao: 'grão', cha: 'chá', agua: 'água', mamao: 'mamão', melao: 'melão', maca: 'maçã', limao: 'limão', acai: 'açaí', pacoca: 'paçoca', linguica: 'linguiça', tilapia: 'tilápia', salmao: 'salmão', camarao: 'camarão', hamburguer: 'hambúrguer', abobora: 'abóbora', brocolis: 'brócolis', pure: 'purê', proteina: 'proteína', hipercalorico: 'hipercalórico', colageno: 'colágeno', isotonico: 'isotônico', energetico: 'energético', amendoas: 'amêndoas', para: 'pará', nectar: 'néctar', acaraje: 'acarajé', requeijao: 'requeijão', parmesao: 'parmesão', contrafile: 'contrafilé', moida: 'moída', po: 'pó', file: 'filé', ate: 'até', caju: 'caju', 'avela': 'avelã', 'caipirinha': 'caipirinha', mussarela: 'mussarela', 'barrinha': 'barrinha', coalho: 'coalho', 'ovos': 'ovos', 'cacau': 'cacau', 'doce': 'doce', 'tangerina': 'tangerina', 'grande': 'grande', 'sobremesa': 'sobremesa', 'ervilha': 'ervilha', 'kiwi': 'kiwi', 'sardinha': 'sardinha', 'inhame': 'inhame', 'cuscuz': 'cuscuz', 'proteico': 'proteico', 'zero': 'zero', 'lasanha': 'lasanha', 'bolonhesa': 'bolonhesa', 'feijoada': 'feijoada', 'sushi': 'sushi', 'uramaki': 'uramaki', 'refrigerante': 'refrigerante', 'queijo': 'queijo', 'manteiga': 'manteiga', 'margarina': 'margarina', 'granola': 'granola', 'torrada': 'torrada', 'pizza': 'pizza', 'esfiha': 'esfiha' };
const acentuar = txt => txt.replace(/[a-z]+/g, w => ACENTOS[w] || w);
const capitalizar = t => t.charAt(0).toUpperCase() + t.slice(1);

function slug(s) {
  return normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Lista de alimentos já estruturados */
export const ALIMENTOS = LINHAS.split('\n').map(l => l.trim()).filter(Boolean).map(linha => {
  const [nome, apelidos, grupo, nums, porcoes, flags] = linha.split('|');
  const [kcal, p, c, g, f] = nums.trim().split(/\s+/).map(Number);
  const fl = parseFlags(flags);
  const porcs = (porcoes || '').split(';').filter(Boolean).map(x => {
    const i = x.lastIndexOf(':');
    return { nome: x.slice(0, i), g: parseFloat(x.slice(i + 1)) };
  });
  const aliases = [nome, ...(apelidos || '').split(';').filter(Boolean)];
  return {
    id: slug(nome), nome: capitalizar(acentuar(nome)), grupo, kcal, p, c, g, f,
    porcoes: porcs, ...fl,
    unidadeBase: fl.liquido ? 'ml' : 'g',
    aliases,
    aliasTokens: aliases.map(a => tokens(a)),
    aliasNorm: aliases.map(a => normalizar(a)),
  };
});

const POR_ID = new Map(ALIMENTOS.map(a => [a.id, a]));
export const alimentoPorId = id => POR_ID.get(id) || null;

/** Calcula nutrientes para uma quantidade em gramas/ml */
export function nutrientesPara(alimento, qtd) {
  const k = qtd / 100;
  return {
    kcal: alimento.kcal * k,
    p: alimento.p * k,
    c: alimento.c * k,
    g: alimento.g * k,
    f: alimento.f * k,
    acucar: (alimento.acucar || 0) * k,
  };
}

/** Porção padrão (gramas) */
export const porcaoPadrao = a => (a.porcoes[0] ? a.porcoes[0].g : 100);

/** Busca tolerante por texto (usada na tela de confirmação). Retorna lista ordenada por pontuação. */
export function buscarAlimentos(consulta, limite = 8) {
  const qn = normalizar(consulta);
  if (!qn) return [];
  const qt = tokens(consulta);
  const res = [];
  for (const a of ALIMENTOS) {
    let melhor = 0;
    for (let i = 0; i < a.aliases.length; i++) {
      const an = a.aliasNorm[i];
      let s = 0;
      if (an === qn) s = 100;
      else if (an.startsWith(qn)) s = 80;
      else if (an.includes(qn)) s = 65;
      else {
        const at = a.aliasTokens[i];
        const hit = qt.filter(t => at.some(x => x === t || x.startsWith(t))).length;
        if (hit) s = 40 * (hit / qt.length);
      }
      if (i === 0) s += 1;
      if (s > melhor) melhor = s;
    }
    if (melhor > 0) res.push({ alimento: a, score: melhor });
  }
  return res.sort((x, y) => y.score - x.score).slice(0, limite).map(r => r.alimento);
}
