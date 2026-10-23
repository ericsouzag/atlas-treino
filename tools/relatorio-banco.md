# Relatório do banco de alimentos

Gerado por `node tools/unificar-banco.mjs`. Prioridade ao desduplicar: **TACO > IBGE > banco embutido > USDA**.

## Contagem por fonte

| Fonte | Candidatos | Fundidos em outra | Descartados (inconsistência/nome) | Mantidos |
|---|---:|---:|---:|---:|
| TACO (4ª ed.) | 593 | 0 | 1 | 592 |
| IBGE (POF 2008-2009) | 855 | 92 | 28 | 735 |
| Embutido (js/foods.js) | 207 | 76 | 14 | 117 |
| USDA (FDC) | 902 | 134 | 26 | 742 |
| **Total** | 2557 | 302 | 69 | **2186** |

No app, o embutido (207 itens) carrega junto com o código; 90 deles foram absorvidos por registros de maior prioridade (TACO/IBGE) e saem do banco quando a camada carrega.
37 das fusões embutido->TACO vieram da lista revisada à mão (itens da TACO marcados como já existentes no embutido, casando também por apelido). 109 apelidos repetidos entre registros foram retirados (cada apelido tem um dono: o item curado à mão ou a fonte de maior prioridade).
Os candidatos da USDA já vêm filtrados por regras de seleção/tradução (tools/gerar-usda.mjs): de ~8 mil itens do FDC só entram os que têm tradução de qualidade.

## Fusões por par de fontes

- ibge -> taco: 69
- ibge -> ibge: 23
- base -> taco: 49
- base -> ibge: 27
- usda -> ibge: 46
- usda -> taco: 68
- usda -> base: 20

## Arquivos (descompactados)

- data/taco.json: 592 itens, 83 KB
- data/ibge.json: 735 itens, 86 KB
- data/usda.json: 742 itens, 75 KB
- Total das camadas: 244 KB (orçamento: 3 MB)

## Itens fundidos (amostra de cada par)

### ibge -> taco

- Arroz (cozido) (ibge-6300101-99, 136 kcal) -> Arroz tipo 2 (cozido) (taco-5, 130 kcal)
- Arroz integral (cozido) (ibge-6300201-99, 131 kcal) -> Arroz integral (cozido) (taco-1, 124 kcal)
- Amendoim (em grão) (in natura) (ibge-6301001-99, 567 kcal) -> Amendoim grão (cru) (taco-557, 544 kcal)
- Semente de linhaça (ibge-6302001-99, 534 kcal) -> Linhaça semente (taco-594, 495 kcal)
- Batata-inglesa (frita) (ibge-6400101-5, 264 kcal) -> Batata inglesa (frita) (taco-93, 267 kcal)
- Batata doce (cozida) (ibge-6400401-99, 76 kcal) -> Batata doce (cozida) (taco-88, 77 kcal)
- Inhame (ibge-6400501-1, 100 kcal) -> Inhame (cru) (taco-126, 97 kcal)
- Mandioca (cozida) (ibge-6400601-99, 125 kcal) -> Mandioca (cozida) (taco-129, 125 kcal)
- Mandioca (ibge-6400601-7, 163 kcal) -> Mandioca (crua) (taco-130, 151 kcal)
- Aipim (cozido) (ibge-6400609-99, 125 kcal) -> Mandioca (cozida) (taco-129, 125 kcal)
- Aipim (ibge-6400609-7, 163 kcal) -> Mandioca (crua) (taco-130, 151 kcal)
- Rabanete (cru) (ibge-6401001-1, 16 kcal) -> Rabanete (cru) (taco-148, 14 kcal)
- Beterraba (ibge-6401101-99, 43 kcal) -> Beterraba (crua) (taco-98, 49 kcal)
- Cenoura (cozida) (ibge-6401201-2, 35 kcal) -> Cenoura (cozida) (taco-109, 30 kcal)
- Aveia em flocos (ibge-6500401-99, 384 kcal) -> Aveia flocos (crua) (taco-7, 394 kcal)
- Farinha de mandioca (ibge-6501401-99, 361 kcal) -> Farinha de mandioca (crua) (taco-121, 361 kcal)
- Pinhão (cozido) (ibge-6600401-99, 174 kcal) -> Pinhão (cozido) (taco-595, 174 kcal)
- Coco (ibge-6602401-99, 354 kcal) -> Coco (cru) (taco-590, 406 kcal)
- Chicória (crua) (ibge-6700301-1, 17 kcal) -> Chicória (crua) (taco-111, 14 kcal)
- Couve flor (cozida) (ibge-6700601-99, 23 kcal) -> Couve-flor (cozida) (taco-118, 19 kcal)
- Cebolinha (ibge-6701101-99, 25 kcal) -> Cebolinha (crua) (taco-108, 20 kcal)
- Agrião (ibge-6701301-99, 25 kcal) -> Agrião (cru) (taco-75, 17 kcal)
- Taioba (crua) (ibge-6701401-1, 34 kcal) -> Taioba (crua) (taco-156, 34 kcal)
- Acelga (ibge-6701501-99, 19 kcal) -> Acelga (crua) (taco-74, 21 kcal)
- Almeirão (cru) (ibge-6701601-1, 17 kcal) -> Almeirão (cru) (taco-84, 18 kcal)
- Pepino (ibge-6704001-99, 15 kcal) -> Pepino (cru) (taco-142, 10 kcal)
- Chuchu (ibge-6704101-1, 24 kcal) -> Chuchu (cru) (taco-113, 17 kcal)
- Maxixe (cru) (ibge-6704301-1, 14 kcal) -> Maxixe (cru) (taco-134, 14 kcal)
- Tomate (ibge-6705101-99, 18 kcal) -> Tomate (com semente, cru) (taco-157, 15 kcal)
- Cebola (ibge-6705701-99, 40 kcal) -> Cebola (crua) (taco-107, 39 kcal)
- Abacaxi (ibge-6802601-99, 48 kcal) -> Abacaxi (cru) (taco-164, 48 kcal)
- Maçã (ibge-6803001-99, 52 kcal) -> Maçã Fuji (com casca, crua) (taco-222, 56 kcal)
- Melancia (ibge-6803401-99, 30 kcal) -> Melancia (crua) (taco-235, 33 kcal)
- Jaca (ibge-6804101-99, 94 kcal) -> Jaca (crua) (taco-204, 88 kcal)
- Ameixa (ibge-6804301-99, 46 kcal) -> Ameixa (crua) (taco-172, 53 kcal)
- Caju (ibge-6804401-99, 43 kcal) -> Caju (cru) (taco-186, 43 kcal)
- Graviola (ibge-6805001-99, 62 kcal) -> Graviola (crua) (taco-201, 62 kcal)
- Morango (ibge-6805201-99, 32 kcal) -> Morango (cru) (taco-239, 30 kcal)
- Jambo (ibge-6805301-99, 27 kcal) -> Jambo (cru) (taco-205, 27 kcal)
- Nêspera (ibge-6805801-99, 47 kcal) -> Nêspera (crua) (taco-240, 43 kcal)
- Tamarindo (ibge-6806201-99, 239 kcal) -> Tamarindo (cru) (taco-250, 276 kcal)
- Cacau (ibge-6806301-99, 74 kcal) -> Cacau (cru) (taco-183, 74 kcal)
- Pitanga (ibge-6806801-99, 41 kcal) -> Pitanga (crua) (taco-247, 41 kcal)
- Ciriguela (ibge-6806901-99, 76 kcal) -> Ciriguela (crua) (taco-191, 76 kcal)
- Cupuaçu (ibge-6807301-99, 49 kcal) -> Cupuaçu (cru) (taco-192, 49 kcal)
- Acerola (ibge-6807701-99, 32 kcal) -> Acerola (crua) (taco-169, 33 kcal)
- Abiu (ibge-6808001-99, 62 kcal) -> Abiu (cru) (taco-166, 62 kcal)
- Jurubeba (ibge-6808201-99, 126 kcal) -> Jurubeba (crua) (taco-128, 126 kcal)
- Achocolatado em pó (ibge-6900821-99, 400 kcal) -> Achocolatado pó (taco-491, 401 kcal)
- Marmelada (ibge-6901206-99, 278 kcal) -> Marmelada (taco-506, 257 kcal)
- Filé de frango (empanado) (ibge-7800402-6, 212 kcal) -> Frango filé (à milanesa) (taco-401, 221 kcal)
- Ovo de galinha (cozido) (ibge-7803301-99, 155 kcal) -> Ovo de galinha inteiro (cozido) (taco-488, 146 kcal)
- Ovo de galinha (frito) (ibge-7803301-5, 223 kcal) -> Ovo de galinha inteiro (frito) (taco-490, 240 kcal)
- Leite de cabra (ibge-7900301-99, 69 kcal) -> Leite de cabra (taco-454, 66 kcal)
- Leite em pó integral (ibge-7900601-99, 480 kcal) -> Leite de vaca integral pó (taco-459, 497 kcal)
- Leite em pó desnatado (ibge-7900710-99, 358 kcal) -> Leite em pó desnatado (taco-456, 362 kcal)
- Leite condensado (ibge-7900901-99, 320 kcal) -> Leite condensado (taco-453, 313 kcal)
- Leite achocolatado (ibge-7903102-99, 83 kcal) -> Leite de vaca achocolatado (taco-455, 83 kcal)
- Queijo de minas frescal (ibge-7907301-99, 240 kcal) -> Queijo minas frescal (taco-461, 264 kcal)
- Pão de sal (ibge-8000105-99, 300 kcal) -> Pão trigo francês (taco-53, 300 kcal)
- ... e mais 9

### ibge -> ibge

- Abobrinha (ibge-6703701-2, 20 kcal) -> Abobrinha (crua) (ibge-6703701-1, 16 kcal)
- Seleta (jardineira) (ibge-6706102-99, 47 kcal) -> Jardineira (seleta) (ibge-6706101-99, 47 kcal)
- Mexerica (ibge-6802202-99, 53 kcal) -> Tangerina (ibge-6802201-99, 53 kcal)
- Bergamota (ibge-6802217-99, 53 kcal) -> Tangerina (ibge-6802201-99, 53 kcal)
- Barra de chocolate diet (ibge-6910102-99, 540 kcal) -> Barra de chocolate light (ibge-6910002-99, 540 kcal)
- Achocolatado em pó diet (ibge-6910321-99, 338 kcal) -> Achocolatado em pó light (ibge-6910221-99, 338 kcal)
- Doce de leite diet (ibge-6911301-99, 292 kcal) -> Doce de leite light (ibge-6911201-99, 292 kcal)
- Leite achocolatado diet (ibge-7906802-99, 73 kcal) -> Leite achocolatado light (ibge-7906702-99, 63 kcal)
- Bebida achocolatada diet (ibge-7906810-99, 73 kcal) -> Bebida achocolatada light (ibge-7906710-99, 63 kcal)
- Bolacha doce (ibge-8002334-99, 443 kcal) -> Biscoito doce (ibge-8002301-99, 443 kcal)
- Bolo de macaxeira (ibge-8002703-99, 324 kcal) -> Bolo de aipim (ibge-8002701-99, 324 kcal)
- Pão light (de forma industrializado) (ibge-8006601-99, 198 kcal) -> Pão diet (de forma industrializado) (ibge-8006501-99, 198 kcal)
- Filhos (bolinho de farinha de trigo e ovos) diet (ibge-8007402-99, 427 kcal) -> Filhos (bolinho de farinha de trigo e ovos) light (ibge-8007302-99, 427 kcal)
- Bolo de chocolate diet (ibge-8007601-99, 299 kcal) -> Bolo de chocolate light (ibge-8007501-99, 299 kcal)
- Wafer (biscoito) light (ibge-8008307-99, 399 kcal) -> Biscoito wafer light (ibge-8008305-99, 399 kcal)
- Biscoito recheado diet (ibge-8008401-99, 405 kcal) -> Biscoito recheado light (ibge-8008301-99, 433 kcal)
- Bolacha recheada diet (ibge-8008410-99, 405 kcal) -> Bolacha recheada light (ibge-8008310-99, 433 kcal)
- Bolacha doce light (ibge-8010434-99, 395 kcal) -> Biscoito doce light (ibge-8010401-99, 395 kcal)
- Bolacha doce diet (ibge-8010534-99, 454 kcal) -> Biscoito doce diet (ibge-8010501-99, 454 kcal)
- Coca cola light (ibge-8200702-99, 2 kcal) -> Refrigerante de cola light (ibge-8200701-99, 2 kcal)
- Refrigerante de cola diet (ibge-8200801-99, 2 kcal) -> Refrigerante de cola light (ibge-8200701-99, 2 kcal)
- Café cappuccino solúvel diet (ibge-8212501-99, 13 kcal) -> Café cappuccino solúvel light (ibge-8212401-99, 13 kcal)
- Água tônica diet (ibge-8212902-99, 40 kcal) -> Água tônica light (ibge-8209002-99, 40 kcal)

### base -> taco

- Arroz branco cozido (arroz-branco-cozido, 128 kcal) -> Arroz tipo 1 (cozido) (taco-3, 128 kcal)
- Arroz integral cozido (arroz-integral-cozido, 124 kcal) -> Arroz integral (cozido) (taco-1, 124 kcal)
- Pão francês (pao-frances, 300 kcal) -> Pão trigo francês (taco-53, 300 kcal)
- Cuscuz de milho cozido (cuscuz-de-milho-cozido, 113 kcal) -> Cuscuz de milho (cozido com sal) (taco-533, 113 kcal)
- Aveia em flocos (aveia-em-flocos, 394 kcal) -> Aveia flocos (crua) (taco-7, 394 kcal)
- Batata inglesa cozida (batata-inglesa-cozida, 52 kcal) -> Batata inglesa (cozida) (taco-91, 52 kcal)
- Batata doce cozida (batata-doce-cozida, 77 kcal) -> Batata doce (cozida) (taco-88, 77 kcal)
- Mandioca cozida (mandioca-cozida, 125 kcal) -> Mandioca (cozida) (taco-129, 125 kcal)
- Batata frita (batata-frita, 312 kcal) -> Batata inglesa (frita) (taco-93, 267 kcal)
- Farinha de mandioca (farinha-de-mandioca, 361 kcal) -> Farinha de mandioca (crua) (taco-121, 361 kcal)
- Feijão carioca cozido (feijao-carioca-cozido, 76 kcal) -> Feijão carioca (cozido) (taco-561, 76 kcal)
- Feijão preto cozido (feijao-preto-cozido, 77 kcal) -> Feijão preto (cozido) (taco-567, 77 kcal)
- Lentilha cozida (lentilha-cozida, 93 kcal) -> Lentilha (cozida) (taco-577, 93 kcal)
- Ovo cozido (ovo-cozido, 146 kcal) -> Ovo de galinha inteiro (cozido) (taco-488, 146 kcal)
- Ovo frito (ovo-frito, 240 kcal) -> Ovo de galinha inteiro (frito) (taco-490, 240 kcal)
- Peito de frango grelhado (peito-de-frango-grelhado, 159 kcal) -> Frango peito (sem pele, grelhado) (taco-410, 159 kcal)
- Mortadela (mortadela, 269 kcal) -> Mortadela (taco-424, 269 kcal)
- Queijo mussarela (queijo-mussarela, 330 kcal) -> Queijo mozarela (taco-463, 330 kcal)
- Queijo minas frescal (queijo-minas-frescal, 264 kcal) -> Queijo minas frescal (taco-461, 264 kcal)
- Queijo prato (queijo-prato, 360 kcal) -> Queijo prato (taco-467, 360 kcal)
- Manteiga (manteiga, 726 kcal) -> Manteiga (com sal) (taco-261, 726 kcal)
- Creme de leite (creme-de-leite, 221 kcal) -> Creme de Leite (taco-447, 221 kcal)
- Leite condensado (leite-condensado, 313 kcal) -> Leite condensado (taco-453, 313 kcal)
- Leite em pó integral (leite-em-po-integral, 497 kcal) -> Leite de vaca integral pó (taco-459, 497 kcal)
- Banana prata (banana-prata, 98 kcal) -> Banana prata (crua) (taco-182, 98 kcal)
- Maçã (maca, 56 kcal) -> Maçã Fuji (com casca, crua) (taco-222, 56 kcal)
- Mamão papaia (mamao-papaia, 40 kcal) -> Mamão Papaia (cru) (taco-226, 40 kcal)
- Melancia (melancia, 33 kcal) -> Melancia (crua) (taco-235, 33 kcal)
- Melão (melao, 29 kcal) -> Melão (cru) (taco-236, 29 kcal)
- Abacaxi (abacaxi, 48 kcal) -> Abacaxi (cru) (taco-164, 48 kcal)
- Morango (morango, 30 kcal) -> Morango (cru) (taco-239, 30 kcal)
- Abacate (abacate, 96 kcal) -> Abacate (cru) (taco-163, 96 kcal)
- Kiwi (kiwi, 51 kcal) -> Kiwi (cru) (taco-207, 51 kcal)
- Nozes (nozes, 620 kcal) -> Noz (crua) (taco-597, 620 kcal)
- Tomate (tomate, 15 kcal) -> Tomate (com semente, cru) (taco-157, 15 kcal)
- Cenoura (cenoura, 34 kcal) -> Cenoura (crua) (taco-110, 34 kcal)
- Brócolis cozido (brocolis-cozido, 25 kcal) -> Brócolis (cozido) (taco-100, 25 kcal)
- Couve-flor cozida (couve-flor-cozida, 23 kcal) -> Couve-flor (cozida) (taco-118, 19 kcal)
- Beterraba cozida (beterraba-cozida, 32 kcal) -> Beterraba (cozida) (taco-97, 32 kcal)
- Pepino (pepino, 10 kcal) -> Pepino (cru) (taco-142, 10 kcal)
- Cebola (cebola, 39 kcal) -> Cebola (crua) (taco-107, 39 kcal)
- Chuchu cozido (chuchu-cozido, 19 kcal) -> Chuchu (cozido) (taco-112, 19 kcal)
- Berinjela (berinjela, 20 kcal) -> Berinjela (crua) (taco-96, 20 kcal)
- Azeite de oliva (azeite-de-oliva, 884 kcal) -> Azeite de oliva extra virgem (taco-260, 884 kcal)
- Oleo de soja (oleo-de-soja, 884 kcal) -> Óleo de soja (taco-272, 884 kcal)
- Açúcar refinado (acucar-refinado, 387 kcal) -> Açúcar refinado (taco-494, 387 kcal)
- Chocolate ao leite (chocolate-ao-leite, 535 kcal) -> Chocolate ao leite (taco-495, 540 kcal)
- Água de coco (agua-de-coco, 22 kcal) -> Água de coco (taco-478, 22 kcal)
- Acarajé (acaraje, 290 kcal) -> Acarajé (taco-525, 289 kcal)

### base -> ibge

- Pão integral (pao-integral, 253 kcal) -> Pão integral (ibge-8001401-99, 247 kcal)
- Pão de queijo (pao-de-queijo, 363 kcal) -> Pão de queijo (ibge-8000801-99, 363 kcal)
- Barra de cereal (barra-de-cereal, 390 kcal) -> Barra de cereais (ibge-6907201-99, 353 kcal)
- Biscoito recheado (biscoito-recheado, 472 kcal) -> Biscoito recheado (ibge-8004801-99, 472 kcal)
- Farofa pronta (farofa-pronta, 410 kcal) -> Farofa pronta (ibge-8502901-99, 406 kcal)
- Leite integral (leite-integral, 61 kcal) -> Leite de vaca integral (ibge-7900101-99, 60 kcal)
- Leite desnatado (leite-desnatado, 35 kcal) -> Leite de vaca desnatado (ibge-7903601-99, 34 kcal)
- Pasta de amendoim (pasta-de-amendoim, 588 kcal) -> Pasta de amendoim (ibge-6901203-99, 588 kcal)
- Laranja (laranja, 46 kcal) -> Laranja (ibge-6801801-99, 47 kcal)
- Pera (pera, 53 kcal) -> Pêra (ibge-6803601-99, 58 kcal)
- Manga (manga, 72 kcal) -> Manga (ibge-6803201-99, 65 kcal)
- Limão (limao, 32 kcal) -> Limão (ibge-6802001-99, 30 kcal)
- Uva passa (uva-passa, 299 kcal) -> Uva passa (ibge-6803912-99, 299 kcal)
- Castanha-do-pará (castanha-do-para, 656 kcal) -> Castanha do pará (ibge-6600701-99, 656 kcal)
- Alface (alface, 15 kcal) -> Alface (ibge-6700101-99, 15 kcal)
- Pimentao (pimentao, 28 kcal) -> Pimentão (ibge-6704501-99, 20 kcal)
- Paçoca (pacoca, 510 kcal) -> Paçoca (ibge-6903203-99, 472 kcal)
- Ketchup (ketchup, 100 kcal) -> Ketchup (ibge-7004802-99, 97 kcal)
- Caipirinha (caipirinha, 130 kcal) -> Caipirinha (ibge-8303101-99, 144 kcal)
- Café sem açúcar (cafe-sem-acucar, 2 kcal) -> Café (ibge-8501302-99, 1 kcal)
- Pizza de mussarela (pizza-de-mussarela, 270 kcal) -> Pizza mussarela (ibge-8500915-99, 281 kcal)
- Pizza de calabresa (pizza-de-calabresa, 285 kcal) -> Pizza calabresa (ibge-8500914-99, 285 kcal)
- Pizza de presunto (pizza-de-presunto, 262 kcal) -> Pizza presunto (ibge-8500916-99, 285 kcal)
- Pizza portuguesa (pizza-portuguesa, 255 kcal) -> Pizza portuguesa (ibge-8500917-99, 247 kcal)
- Coxinha (coxinha, 275 kcal) -> Coxinha (ibge-8500205-99, 275 kcal)
- Cachorro-quente (cachorro-quente, 250 kcal) -> Cachorro quente (ibge-8500302-99, 272 kcal)
- Pão com manteiga (pao-com-manteiga, 330 kcal) -> Pão com manteiga (ibge-8570328-99, 370 kcal)

### usda -> ibge

- Leite (semidesnatado) (usda-f322228, 43 kcal) -> Leite de vaca semidesnatado (ibge-7903702-99, 42 kcal)
- Leite (desnatado) (usda-f322559, 34 kcal) -> Leite de vaca desnatado (ibge-7903601-99, 34 kcal)
- Leite (integral) (usda-f322892, 60 kcal) -> Leite de vaca integral (ibge-7900101-99, 60 kcal)
- Pasta de amendoim (com sal) (usda-f324860, 597 kcal) -> Pasta de amendoim (ibge-6901203-99, 588 kcal)
- Nectarina (crua) (usda-f327357, 39 kcal) -> Nectarina (ibge-6807401-99, 44 kcal)
- Laranja (crua) (usda-f746771, 47 kcal) -> Laranja (ibge-6801801-99, 47 kcal)
- Pera (crua) (usda-f746773, 57 kcal) -> Pêra (ibge-6803601-99, 58 kcal)
- Pão integral (usda-f335240, 254 kcal) -> Pão integral (ibge-8001401-99, 247 kcal)
- Alho (cru) (usda-f1104647, 143 kcal) -> Alho (ibge-6706201-99, 149 kcal)
- Cenoura (crua) (usda-f2258586, 48 kcal) -> Cenoura (ibge-6401201-99, 41 kcal)
- Pasta de amendoim (usda-f2262072, 632 kcal) -> Pasta de amendoim (ibge-6901203-99, 588 kcal)
- Castanha-do-pará (usda-f2515373, 664 kcal) -> Castanha do pará (ibge-6600701-99, 656 kcal)
- Avelãs (usda-f2515375, 641 kcal) -> Avela (ibge-6600601-99, 628 kcal)
- Pistache (usda-f2515379, 598 kcal) -> Pistache (ibge-6602201-99, 557 kcal)
- Queijo provolone (usda-f2647440, 357 kcal) -> Queijo provolone (ibge-7902501-99, 351 kcal)
- Abobrinha (crua) (usda-f2685569, 22 kcal) -> Abobrinha (crua) (ibge-6703701-1, 16 kcal)
- Néctar de manga (usda-s167785, 51 kcal) -> Suco de manga (ibge-8500413-99, 51 kcal)
- Limão (cru) (usda-s168155, 30 kcal) -> Limão (ibge-6802001-99, 30 kcal)
- Néctar de pêssego (usda-s168185, 50 kcal) -> Suco de pêssego (ibge-8500417-99, 54 kcal)
- Suco de abacaxi (sem açúcar) (usda-s168187, 53 kcal) -> Suco de abacaxi (ibge-8500402-99, 53 kcal)
- Alcachofra (cozida) (usda-s169311, 51 kcal) -> Alcachofra (cozida) (ibge-6702301-99, 53 kcal)
- Abóbora (crua) (usda-s168448, 26 kcal) -> Jerimum (ibge-6703805-1, 20 kcal)
- Abóbora (cozida) (usda-s170526, 18 kcal) -> Abóbora (cozida) (ibge-6703901-99, 20 kcal)
- Rabanete (cozido) (usda-s170122, 17 kcal) -> Rabanete (cozido) (ibge-6401001-2, 18 kcal)
- Espinafre (cozido) (usda-s170531, 23 kcal) -> Espinafre (cozido) (ibge-6700701-99, 23 kcal)
- Batata-doce (assada) (usda-s170134, 90 kcal) -> Batata doce (assada) (ibge-6400401-4, 90 kcal)
- Quinoa (cozida) (usda-s168917, 120 kcal) -> Quinoa (cozida) (ibge-6304901-99, 135 kcal)
- Suco de laranja (usda-s169100, 49 kcal) -> Suco de laranja (ibge-8500407-99, 42 kcal)
- Suco de laranja (sem açúcar) (usda-s169099, 47 kcal) -> Suco de laranja (ibge-8500407-99, 42 kcal)
- Néctar de mamão (usda-s169107, 57 kcal) -> Suco de mamão (ibge-8500412-99, 57 kcal)
- Vagem (cozida) (usda-s169965, 33 kcal) -> Vagem (cozida) (ibge-6705201-99, 35 kcal)
- Quiabo (cozido) (usda-s170098, 22 kcal) -> Quiabo (cozido) (ibge-6705001-99, 22 kcal)
- Rúcula (crua) (usda-s169387, 25 kcal) -> Rúcula (ibge-6702001-99, 25 kcal)
- Manga (crua) (usda-s169910, 60 kcal) -> Manga (ibge-6803201-99, 65 kcal)
- Amora (crua) (usda-s169913, 43 kcal) -> Amora (ibge-6809901-99, 43 kcal)
- Mamão (cru) (usda-s169926, 43 kcal) -> Mamão (ibge-6803101-99, 39 kcal)
- Nabo (cozido) (usda-s170547, 22 kcal) -> Nabo (cozido) (ibge-6401301-2, 22 kcal)
- Gergelim (usda-s170150, 573 kcal) -> Gergelim (ibge-7009102-99, 631 kcal)
- Abacate (cru) (usda-s171707, 120 kcal) -> Abacate (ibge-6802701-99, 120 kcal)
- Água tônica (usda-s171869, 34 kcal) -> Água tônica tradicional (ibge-8204902-99, 40 kcal)
- Café preparado (usda-s171881, 2 kcal) -> Café (ibge-8501302-99, 1 kcal)
- Tofu (usda-s172461, 62 kcal) -> Tofu (ibge-7903402-99, 61 kcal)
- Figo (cru) (usda-s173021, 74 kcal) -> Figo (ibge-6802901-99, 74 kcal)
- Grão-de-bico (cozido) (usda-s173757, 164 kcal) -> Grão de bico (cozido) (ibge-6302801-99, 188 kcal)
- Banana (crua) (usda-s173944, 89 kcal) -> Banana (ibge-6801101-99, 89 kcal)
- Croissant (usda-s174987, 406 kcal) -> Croissant (ibge-8000240-99, 455 kcal)

### usda -> taco

- Ovo de galinha cru (usda-f323604, 150 kcal) -> Ovo de galinha inteiro (cru) (taco-489, 143 kcal)
- Queijo parmesão (usda-f325036, 421 kcal) -> Queijo parmesão (taco-464, 453 kcal)
- Morango (cru) (usda-f327699, 31 kcal) -> Morango (cru) (taco-239, 30 kcal)
- Frango, coxa (sem pele, cozido) (usda-f331897, 156 kcal) -> Frango coxa (sem pele, cozida) (taco-398, 167 kcal)
- Frango, peito (sem pele, cozido) (usda-f331960, 166 kcal) -> Frango peito (sem pele, cozido) (taco-408, 163 kcal)
- Açúcar refinado (usda-f334247, 385 kcal) -> Açúcar refinado (taco-494, 387 kcal)
- Alface americana (crua) (usda-f2346388, 17 kcal) -> Alface americana (crua) (taco-77, 9 kcal)
- Aveia (usda-f2346397, 381 kcal) -> Aveia flocos (crua) (taco-7, 394 kcal)
- Pepino (cru) (usda-f2346406, 16 kcal) -> Pepino (cru) (taco-142, 10 kcal)
- Repolho roxo (cru) (usda-f2346408, 34 kcal) -> Repolho roxo (cru) (taco-150, 31 kcal)
- Grão-de-bico (usda-f2644282, 383 kcal) -> Grão-de-bico (cru) (taco-575, 355 kcal)
- Lentilha (usda-f2644283, 360 kcal) -> Lentilha (crua) (taco-578, 339 kcal)
- Frango, peito (sem pele, cru) (usda-f2646170, 106 kcal) -> Frango peito (sem pele, cru) (taco-409, 119 kcal)
- Frango, sobrecoxa (sem pele, cru) (usda-f2646171, 144 kcal) -> Frango sobrecoxa (sem pele, crua) (taco-414, 162 kcal)
- Couve-flor (crua) (usda-f2685573, 28 kcal) -> Couve-flor (crua) (taco-117, 23 kcal)
- Beterraba (crua) (usda-f2685576, 45 kcal) -> Beterraba (crua) (taco-98, 49 kcal)
- Berinjela (crua) (usda-f2685577, 26 kcal) -> Berinjela (crua) (taco-96, 20 kcal)
- Rabanete (cru) (usda-f2747665, 20 kcal) -> Rabanete (cru) (taco-148, 14 kcal)
- Chocolate ao leite (usda-s167587, 535 kcal) -> Chocolate ao leite (taco-495, 540 kcal)
- Óleo de milho (usda-s167737, 884 kcal) -> Óleo de milho (taco-270, 884 kcal)
- Tamarindo (cru) (usda-s167763, 239 kcal) -> Tamarindo (cru) (taco-250, 276 kcal)
- Melancia (crua) (usda-s167765, 30 kcal) -> Melancia (crua) (taco-235, 33 kcal)
- Maçã (com casca, crua) (usda-s168202, 57 kcal) -> Maçã Fuji (com casca, crua) (taco-222, 56 kcal)
- Alface roxa (crua) (usda-s168431, 13 kcal) -> Alface roxa (crua) (taco-80, 13 kcal)
- Batata-doce (cozida) (usda-s168484, 76 kcal) -> Batata doce (cozida) (taco-88, 77 kcal)
- Brócolis (cozido) (usda-s169392, 22 kcal) -> Brócolis (cozido) (taco-100, 25 kcal)
- Açúcar mascavo (usda-s168833, 380 kcal) -> Açúcar mascavo (taco-493, 369 kcal)
- Alface lisa (crua) (usda-s169249, 15 kcal) -> Alface lisa (crua) (taco-79, 14 kcal)
- Quiabo (cru) (usda-s169260, 33 kcal) -> Quiabo (cru) (taco-147, 30 kcal)
- Cenoura (cozida) (usda-s169339, 35 kcal) -> Cenoura (cozida) (taco-109, 30 kcal)
- Pimentão amarelo (cru) (usda-s169383, 27 kcal) -> Pimentão amarelo (cru) (taco-143, 28 kcal)
- Ameixa (crua) (usda-s169949, 46 kcal) -> Ameixa (crua) (taco-172, 53 kcal)
- Pimentão vermelho (cru) (usda-s170108, 26 kcal) -> Pimentão vermelho (cru) (taco-145, 23 kcal)
- Coco (usda-s170169, 354 kcal) -> Coco (cru) (taco-590, 406 kcal)
- Pimentão verde (cru) (usda-s170427, 20 kcal) -> Pimentão verde (cru) (taco-144, 21 kcal)
- Tomate (cru) (usda-s170457, 18 kcal) -> Tomate (com semente, cru) (taco-157, 15 kcal)
- Leite em pó (integral) (usda-s170876, 496 kcal) -> Leite de vaca integral pó (taco-459, 497 kcal)
- Leite em pó (desnatado) (usda-s171273, 354 kcal) -> Leite em pó desnatado (taco-456, 362 kcal)
- Óleo de girassol (usda-s171025, 884 kcal) -> Óleo de girassol (taco-269, 884 kcal)
- Frango inteiro sem pele (cru) (usda-s171052, 119 kcal) -> Frango inteiro (sem pele, cru) (taco-405, 129 kcal)
- Frango inteiro sem pele (assado) (usda-s171054, 190 kcal) -> Frango inteiro (sem pele, assado) (taco-403, 187 kcal)
- Fígado de frango (cru) (usda-s171060, 119 kcal) -> Frango fígado (cru) (taco-400, 106 kcal)
- Frango, peito (com pele, assado) (usda-s171075, 197 kcal) -> Frango peito (com pele, assado) (taco-406, 212 kcal)
- Frango, peito (com pele, cozido) (usda-s171076, 184 kcal) -> Frango peito (sem pele, cozido) (taco-408, 163 kcal)
- Leite de cabra (usda-s171278, 69 kcal) -> Leite de cabra (taco-454, 66 kcal)
- Frango inteiro (cru) (usda-s171447, 215 kcal) -> Frango inteiro (com pele, cru) (taco-402, 226 kcal)
- Frango inteiro sem pele (cozido) (usda-s171451, 177 kcal) -> Frango inteiro (sem pele, cozido) (taco-404, 170 kcal)
- Frango, peito (com pele, cru) (usda-s171474, 172 kcal) -> Frango peito (com pele, cru) (taco-407, 149 kcal)
- Frango, peito (sem pele, grelhado) (usda-s171534, 151 kcal) -> Frango peito (sem pele, grelhado) (taco-410, 159 kcal)
- Maçã (sem casca, crua) (usda-s171689, 48 kcal) -> Maçã Fuji (com casca, crua) (taco-222, 56 kcal)
- Caranguejo (cozido) (usda-s174205, 83 kcal) -> Caranguejo (cozido) (taco-287, 83 kcal)
- Ovo de codorna (usda-s172191, 158 kcal) -> Ovo de codorna inteiro (cru) (taco-485, 177 kcal)
- Óleo de canola (usda-s172336, 884 kcal) -> Óleo de canola (taco-268, 884 kcal)
- Manteiga (usda-s173430, 717 kcal) -> Manteiga (com sal) (taco-261, 726 kcal)
- Frango, coxa (com pele, cru) (usda-s172373, 161 kcal) -> Frango coxa (com pele, crua) (taco-397, 161 kcal)
- Frango, sobrecoxa (com pele, cru) (usda-s172385, 221 kcal) -> Frango sobrecoxa (com pele, crua) (taco-412, 255 kcal)
- Frango, asa (com pele, cru) (usda-s172390, 191 kcal) -> Frango asa (com pele, crua) (taco-391, 213 kcal)
- Lentilha (crua) (usda-s172420, 352 kcal) -> Lentilha (crua) (taco-578, 339 kcal)
- Refrigerante de limão (usda-s173205, 41 kcal) -> Refrigerante tipo limão (taco-483, 40 kcal)
- Manteiga (com sal) (usda-s173410, 717 kcal) -> Manteiga (com sal) (taco-261, 726 kcal)
- ... e mais 8

### usda -> base

- Bacon frito (usda-f749420, 500 kcal) -> Bacon frito (bacon-frito, 540 kcal)
- Amêndoas (usda-f2346393, 626 kcal) -> Amêndoas (amendoas, 580 kcal)
- Castanha de caju (usda-f2515374, 565 kcal) -> Castanha de caju (castanha-de-caju, 570 kcal)
- Maionese (usda-s167695, 322 kcal) -> Maionese (maionese, 302 kcal)
- Abobrinha (cozida) (usda-s170533, 16 kcal) -> Abobrinha cozida (abobrinha-cozida, 18 kcal)
- Alcatra (grelhada) (usda-s168633, 206 kcal) -> Alcatra grelhada (alcatra-grelhada, 241 kcal)
- Cerveja (usda-s168746, 43 kcal) -> Cerveja (cerveja, 43 kcal)
- Queijo cottage (usda-s169078, 95 kcal) -> Queijo cottage (queijo-cottage, 98 kcal)
- Mel (usda-s169640, 304 kcal) -> Mel (mel, 309 kcal)
- Geleia de frutas (usda-s169641, 278 kcal) -> Geleia de frutas (geleia-de-frutas, 250 kcal)
- Chia (usda-s170554, 486 kcal) -> Chia (chia, 486 kcal)
- Camarão (cozido) (usda-s175180, 99 kcal) -> Camarão cozido (camarao-cozido, 99 kcal)
- Ovo de galinha mexido (usda-s172187, 149 kcal) -> Ovo mexido (ovo-mexido, 175 kcal)
- Contrafilé (grelhado) (usda-s173064, 253 kcal) -> Contrafilé grelhado (contrafile-grelhado, 258 kcal)
- Vinho tinto (usda-s173190, 85 kcal) -> Vinho tinto (vinho-tinto, 85 kcal)
- Água (usda-s175096, 0 kcal) -> Água (agua, 0 kcal)
- Cream cheese (usda-s173418, 350 kcal) -> Cream cheese (cream-cheese, 342 kcal)
- Doce de leite (usda-s173461, 315 kcal) -> Doce de leite (doce-de-leite, 315 kcal)
- Frango, coxa e sobrecoxa (com pele, assado) (usda-s173617, 184 kcal) -> Frango assado (coxa e sobrecoxa) (frango-assado-coxa-e-sobrecoxa, 215 kcal)
- Sardinha em lata (usda-s175139, 208 kcal) -> Sardinha em lata (sardinha-em-lata, 208 kcal)

## Curadoria: granola, barra de granola e muesli

Revisão de 23/10/2026. Antes havia registros divergentes para "granola" (embutido 420 kcal; IBGE 388; USDA 489; "Musli" do IBGE = cópia da granola) e todos caíam em NOVA 4. Agora são variantes curadas no embutido (js/foods.js), por 100 g:

| Variante (id) | kcal | P | C | G | Fibra | Açúcar | NOVA | Porções |
|---|---:|---:|---:|---:|---:|---:|:-:|---|
| Granola tradicional (industrializada) (granola-tradicional-industrializada) | 388 | 9,5 | 73,8 | 6,3 | 8,5 | 19 | 4 | porção 40 g, colher de sopa 10 g, xícara 100 g |
| Granola sem açúcar (caseira) (granola-sem-acucar-caseira) | 440 | 11 | 58 | 18 | 9 | 6 | 3 | porção 40 g, colher de sopa 10 g, xícara 100 g |
| Barra de granola (barra-de-granola) | 410 | 6,5 | 68 | 12 | 4 | 30 | 4 | barra 25 g |
| Muesli (sem açúcar adicionado) (muesli-sem-acucar-adicionado) | 365 | 10 | 66 | 6,5 | 8 | 14 | 1 | porção 40 g, colher de sopa 10 g, xícara 90 g |

Por quê: a tradicional adota o valor do IBGE (POF, produto brasileiro). Seus 388 kcal ficam no meio da faixa que rótulos de marcas brasileiras mostram (130 a 175 kcal por 40 g, ou 325 a 437 kcal por 100 g). A sem açúcar leva mais castanha e óleo e menos açúcar, por isso mais gordura e kcal; é estimativa por composição típica (aveia, castanhas, mel, óleo), abaixo da granola caseira da USDA (489, com muita castanha). A barra (~100 kcal por barra de 25 g) fica entre a "Barra de cereais" do IBGE (353) e a barra dura da USDA (471). O muesli do IBGE era cópia da granola; o novo vem de composição típica (flocos, frutas secas, castanhas). Tudo é estimativa: a marca muda o valor, e quem souber o rótulo pode criar em Meus alimentos.

Registros substituídos (somem da busca; os ids antigos continuam resolvendo para a variante indicada):

- ibge-6504101-99 -> granola-tradicional-industrializada: Granola do IBGE: valores adotados na granola tradicional curada
- ibge-6504601-99 -> muesli-sem-acucar-adicionado: Musli do IBGE é cópia exata da Granola (mesmos valores); muesli tem item próprio
- usda-s171646 -> granola-sem-acucar-caseira: granola caseira dos EUA (489 kcal, muita castanha): serve de referência da variante sem açúcar/caseira, que tem valor próprio
- usda-s167542 -> barra-de-granola: barra dura dos EUA (471 kcal) distante dos rótulos brasileiros; a barra de granola curada (410 kcal) a substitui

"Açaí com granola" (IBGE, 110 kcal) segue como está e em NOVA 4 (açaí na tigela costuma levar xarope de guaraná). Aveia em flocos (TACO) segue em 1.

## Descartados

- valores inconsistentes: 4
- substituídos pela curadoria (granola/muesli): 4
- mesmo nome com valores diferentes de fonte de maior prioridade: 61

- [taco] Fermento em pó químico (taco-513): inconsistente: kcal 90 vs macros 179
- [usda] Piña colada (usda-s168752): inconsistente: kcal 174 vs macros 109
- [usda] Daiquiri (usda-s169574): inconsistente: kcal 186 vs macros 29
- [usda] Whiskey sour (usda-s173662): inconsistente: kcal 149 vs macros 53
- [ibge] Granola (ibge-6504101-99): substituído pela curadoria (granola-tradicional-industrializada): Granola do IBGE: valores adotados na granola tradicional curada
- [ibge] Musli (ibge-6504601-99): substituído pela curadoria (muesli-sem-acucar-adicionado): Musli do IBGE é cópia exata da Granola (mesmos valores); muesli tem item próprio
- [usda] Barra de granola (usda-s167542): substituído pela curadoria (barra-de-granola): barra dura dos EUA (471 kcal) distante dos rótulos brasileiros; a barra de granola curada (410 kcal) a substitui
- [usda] Granola (USDA) (usda-s171646): substituído pela curadoria (granola-sem-acucar-caseira): granola caseira dos EUA (489 kcal, muita castanha): serve de referência da variante sem açúcar/caseira, que tem valor próprio
- [ibge] Lentilha (cozida) (ibge-6302901-99): mesmo nome de taco-577 (taco) com valores diferentes (136 vs 93 kcal)
- [ibge] Batata-inglesa (cozida) (ibge-6400101-99): mesmo nome de taco-91 (taco) com valores diferentes (86 vs 52 kcal)
- [ibge] Cará (cozido) (ibge-6400701-2): mesmo nome de taco-102 (taco) com valores diferentes (100 vs 78 kcal)
- [ibge] Beterraba (cozida) (ibge-6401101-2): mesmo nome de taco-97 (taco) com valores diferentes (44 vs 32 kcal)
- [ibge] Macarrão instantâneo (ibge-6504802-99): mesmo nome de taco-39 (taco) com valores diferentes (190 vs 436 kcal)
- [ibge] Almeirão (refogado) (ibge-6701601-7): mesmo nome de taco-85 (taco) com valores diferentes (53 vs 65 kcal)
- [ibge] Brócolis (cozido) (ibge-6701704-99): mesmo nome de taco-100 (taco) com valores diferentes (35 vs 25 kcal)
- [ibge] Brócolis (cru) (ibge-6701704-1): mesmo nome de taco-101 (taco) com valores diferentes (34 vs 25 kcal)
- [ibge] Berinjela (cozida) (ibge-6705401-99): mesmo nome de taco-95 (taco) com valores diferentes (35 vs 19 kcal)
- [ibge] Berinjela (crua) (ibge-6705401-1): mesmo nome de taco-96 (taco) com valores diferentes (33 vs 20 kcal)
- [ibge] Ervilha em vagem (ibge-6705501-2): mesmo nome de taco-559 (taco) com valores diferentes (67 vs 88 kcal)
- [ibge] Catalonha (refogada) (ibge-6705801-7): mesmo nome de taco-106 (taco) com valores diferentes (43 vs 63 kcal)
- [ibge] Maria mole (ibge-6903001-99): mesmo nome de taco-504 (taco) com valores diferentes (445 vs 301 kcal)
- [ibge] Quindim (ibge-6904105-99): mesmo nome de taco-509 (taco) com valores diferentes (131 vs 411 kcal)
- [ibge] Leite de coco (ibge-7003801-99): mesmo nome de taco-523 (taco) com valores diferentes (202 vs 166 kcal)
- [ibge] Feijoada (ibge-7701901-99): mesmo nome de taco-540 (taco) com valores diferentes (182 vs 117 kcal)
- [ibge] Creme de leite (ibge-7901001-99): mesmo nome de taco-447 (taco) com valores diferentes (292 vs 221 kcal)
- [ibge] Iogurte natural (ibge-7901204-99): mesmo nome de taco-448 (taco) com valores diferentes (61 vs 51 kcal)
- [ibge] Leite fermentado (ibge-7901304-99): mesmo nome de taco-460 (taco) com valores diferentes (50 vs 70 kcal)
- [ibge] Queijo prato (ibge-7901701-99): mesmo nome de taco-467 (taco) com valores diferentes (302 vs 360 kcal)
- [ibge] Queijo ricota (ibge-7902201-99): mesmo nome de taco-469 (taco) com valores diferentes (174 vs 140 kcal)
- [ibge] Salame (ibge-8102701-99): mesmo nome de taco-443 (taco) com valores diferentes (336 vs 398 kcal)
- [ibge] Tacacá (ibge-8502401-99): mesmo nome de taco-550 (taco) com valores diferentes (16 vs 47 kcal)
- [ibge] Quibebe (ibge-8506701-99): mesmo nome de taco-544 (taco) com valores diferentes (36 vs 86 kcal)
- [ibge] Maniçoba (ibge-8507201-99): mesmo nome de taco-543 (taco) com valores diferentes (182 vs 134 kcal)
- [ibge] Vaca atolada (ibge-8508301-99): mesmo nome de taco-553 (taco) com valores diferentes (245 vs 145 kcal)
- [base] Grão-de-bico cozido (grao-de-bico-cozido): mesmo nome de ibge-6302801-99 (ibge) com valores diferentes (130 vs 188 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Presunto (presunto): mesmo nome de ibge-8102901-99 (ibge) com valores diferentes (94 vs 226 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Uva (uva): mesmo nome de ibge-6803901-99 (ibge) com valores diferentes (53 vs 69 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Goiaba (goiaba): mesmo nome de ibge-6804201-99 (ibge) com valores diferentes (54 vs 68 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Vagem cozida (vagem-cozida): mesmo nome de ibge-6705201-99 (ibge) com valores diferentes (25 vs 35 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Espinafre refogado (espinafre-refogado): mesmo nome de ibge-6700701-7 (ibge) com valores diferentes (67 vs 45 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Abóbora cozida (abobora-cozida): mesmo nome de ibge-6703901-99 (ibge) com valores diferentes (29 vs 20 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Brigadeiro (brigadeiro): mesmo nome de ibge-6903601-99 (ibge) com valores diferentes (410 vs 334 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Molho de tomate (molho-de-tomate): mesmo nome de ibge-7004801-99 (ibge) com valores diferentes (38 vs 24 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Suco de acerola (suco-de-acerola): mesmo nome de ibge-8500403-99 (ibge) com valores diferentes (36 vs 23 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Suco de maracuja (suco-de-maracuja): mesmo nome de ibge-8500414-99 (ibge) com valores diferentes (48 vs 60 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Milk-shake (milk-shake): mesmo nome de ibge-6907501-99 (ibge) com valores diferentes (130 vs 161 kcal); o registro de ibge prevalece e herda apelidos e porções
- [base] Feijoada (feijoada): mesmo nome de taco-540 (taco) com valores diferentes (150 vs 117 kcal); o registro de taco prevalece e herda apelidos e porções
- [base] Empada (empada): mesmo nome de ibge-8500206-99 (ibge) com valores diferentes (380 vs 154 kcal); o registro de ibge prevalece e herda apelidos e porções
- [usda] Brócolis (cru) (usda-f321900): mesmo nome de taco-101 (taco) com valores diferentes (32 vs 25 kcal)
- [usda] Ketchup (usda-f747693): mesmo nome de ibge-7004802-99 (ibge) com valores diferentes (117 vs 97 kcal)
- [usda] Iogurte natural (integral) (usda-f2259793): mesmo nome de iogurte-natural-integral (base) com valores diferentes (78 vs 61 kcal)
- [usda] Abacaxi (cru) (usda-f2346398): mesmo nome de taco-164 (taco) com valores diferentes (60 vs 48 kcal)
- [usda] Vagem (crua) (usda-f2346400): mesmo nome de taco-162 (taco) com valores diferentes (40 vs 25 kcal)
- [usda] Iogurte natural (desnatado) (usda-f2647437): mesmo nome de taco-449 (taco) com valores diferentes (50 vs 41 kcal)
- [usda] Nabo (cru) (usda-f2747674): mesmo nome de taco-137 (taco) com valores diferentes (34 vs 18 kcal)
- [usda] Alho-poró (cozido) (usda-s168535): mesmo nome de ibge-6706301-99 (ibge) com valores diferentes (31 vs 54 kcal)
- [usda] Batata-doce (crua) (usda-s168482): mesmo nome de taco-89 (taco) com valores diferentes (86 vs 118 kcal)
- [usda] Beterraba (cozida) (usda-s169146): mesmo nome de taco-97 (taco) com valores diferentes (44 vs 32 kcal)
- [usda] Couve-flor (cozida) (usda-s169391): mesmo nome de taco-118 (taco) com valores diferentes (32 vs 19 kcal)
- [usda] Purê de batata (usda-s170493): mesmo nome de ibge-6503501-99 (ibge) com valores diferentes (83 vs 115 kcal)
- [usda] Macarrão integral (cozido) (usda-s168910): mesmo nome de macarrao-integral-cozido (base) com valores diferentes (149 vs 124 kcal)
- [usda] Romã (crua) (usda-s169134): mesmo nome de taco-249 (taco) com valores diferentes (83 vs 56 kcal)
- [usda] Berinjela (cozida) (usda-s169352): mesmo nome de taco-95 (taco) com valores diferentes (33 vs 19 kcal)
- [usda] Alho-poró (cru) (usda-s169246): mesmo nome de taco-83 (taco) com valores diferentes (61 vs 32 kcal)
- [usda] Ostra (cozida) (usda-s174250): mesmo nome de ibge-7264101-2 (ibge) com valores diferentes (163 vs 137 kcal)
- [usda] Omelete (usda-s172185): mesmo nome de ibge-8506501-99 (ibge) com valores diferentes (154 vs 242 kcal)
- [usda] Lentilha (cozida) (usda-s172421): mesmo nome de taco-577 (taco) com valores diferentes (116 vs 93 kcal)
- [usda] Pescada-branca (crua) (usda-s173713): mesmo nome de taco-304 (taco) com valores diferentes (90 vs 111 kcal)
- [usda] Feijão-preto (cozido) (usda-s173735): mesmo nome de taco-567 (taco) com valores diferentes (132 vs 77 kcal)

Extras do gerador da USDA (sem energia/macros ou incoerentes): 32. Do gerador do IBGE: 42.
