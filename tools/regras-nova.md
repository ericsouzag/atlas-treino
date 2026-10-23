# Regras da classificação NOVA

Fonte do critério: *Guia Alimentar para a População Brasileira* (Ministério da Saúde, 2014) e a classificação NOVA (NUPENS/USP). Implementação: `js/nova-regras.js` (função `classificarNova`). A classe é gravada nos dados por `node tools/unificar-banco.mjs` (flag `n=1..4` em `data/taco|ibge|usda.json`) e calculada na carga para o embutido (`js/foods.js`). Nada é editado à mão nos JSON: mudou uma regra, rode o unificador de novo.

É uma **estimativa por regras**. O nome de um alimento do banco não diz se é a versão caseira ou a industrial, nem a marca. Em dúvida entre dois grupos, a regra escolhe o mais provável e marca o item como "limítrofe" no relatório (`tools/relatorio-nova.md`). Item sem regra e sem flag fica **sem classificação** (hoje: 0 itens; nunca se inventa).

## Grupos

| Grupo | Nome | Exemplos no banco |
|---|---|---|
| 1 | In natura / minimamente processado | frutas, legumes, raízes, arroz, feijão, macarrão (farinha e água), aveia, ovos, carne/peixe/frango frescos ou cozidos, leite, iogurte natural, café, chá, água, suco natural, castanhas sem sal, polpas congeladas, frutas secas, **pratos caseiros** |
| 2 | Ingrediente culinário | óleos, azeite, manteiga, açúcar, mel, melado, rapadura, sal, vinagre, fermento, farinha de trigo, amidos, polvilho |
| 3 | Processado | pães, queijos, creme de leite, conservas (palmito, azeitona, milho em lata, atum em lata), frutas em calda, doces de fruta (goiabada), carnes salgadas/curadas simples (charque, carne seca, toucinho, presunto cru), castanhas salgadas, cerveja e vinho |
| 4 | Ultraprocessado | refrigerantes, sucos de caixinha, energéticos, salgadinhos, biscoitos, bolos prontos, cereal matinal, barras, sorvete, chocolate, balas, embutidos (presunto, salsicha, mortadela, salame, linguiça, bacon), nuggets, hambúrguer industrial, macarrão instantâneo, margarina, maionese, ketchup, shoyu, fast food e pizza, iogurte com sabor, requeijão, bebidas lácteas, destilados, suplementos |

## Ordem de decisão (a primeira que casar vale)

1. **Exceções exatas** (nomes que enganam a palavra-chave): `caqui chocolate` = 1, `água com gás` = 1, `levedo de cerveja` = 1, hambúrguer de carne moída da USDA ("90% magra") = 1.
2. **Regras por palavra-chave** (pt-BR e inglês) sobre o nome sem acento, em ordem: suplementos, embutidos, bebidas industrializadas, doces/biscoitos/salgadinhos, gorduras e molhos, laticínios, pães e farinhas, conservas, bebidas simples, pratos.
3. **Padrão da categoria da fonte** (`grupo`): frutas, verduras, feculentos, leguminosas, oleaginosas, ovos, peixes, carnes, pratos = 1; fast food e doces = 4.
4. **Flag `ultra`** das fontes: só decide nos grupos ambíguos (cereais, laticínios, bebidas, outros, gorduras), onde vira 4.
5. Sem regra e sem flag: **sem classificação**.

A flag `ultra` antiga é uma dica imprecisa (ela marcava "batata doce" por conter "doce"), por isso **não** sobrepõe a regra nos grupos naturais. As divergências aparecem listadas no relatório.

## Decisões discutíveis (revise se discordar)

| Caso | Decisão | Por quê |
|---|---|---|
| Pão francês, de forma de padaria, integral, pão de queijo | **3** | farinha, água, sal e fermento: processado. |
| Pão de forma industrial, bisnaguinha, pão de hambúrguer, pão doce, panetone, versões light/diet | **4** | aditivos (emulsificantes, conservantes). TACO "pão de forma" entra aqui. |
| Presunto cozido, apresuntado, blanquet, mortadela, salame, salsicha, linguiça, bacon | **4** | pedido do Eric (embutidos = 4); o Guia os lista entre os ultraprocessados. Linguiça fresca artesanal poderia ser 3. |
| Presunto cru curado | **3** | salga simples, sem aditivos típicos; marcado limítrofe. |
| Queijos (frescal, minas, prato, mussarela, parmesão, ricota) | **3** | leite + sal (+ coalho). Requeijão, cream cheese, queijo processado/fatiado americano, petit suisse: **4**. |
| Iogurte natural, kefir, coalhada | **1**; com sabor/fruta/polpa/proteico | **4**. |
| Farinha de trigo, amidos, fécula, polvilho, farinhas de amêndoa/soja/arroz | **2** | uso culinário. O Guia põe farinhas entre os minimamente processados; aqui as de base alimentar (**mandioca, milho/fubá, aveia, tapioca**) ficam em **1**. |
| Macarrão (cozido ou cru) e massas frescas | **1** | farinha e água, como no Guia. Instantâneo: 4. |
| Pratos caseiros do IBGE/TACO (feijoada, estrogonofe, risoto, moqueca...) | **1** | preparação culinária de ingredientes 1 e 2; os eventuais ingredientes industrializados do prato não são decompostos. Pratos "prontos"/congelados/de lata: 4. |
| Salgados de lanchonete (coxinha, pastel, quibe, empada, esfiha), pizza, hambúrguer/sanduíches | **4** | padrão fast food. Versões artesanais poderiam ser 3. Acarajé: 1. Sanduíche natural: 3. |
| Doces e sobremesas (brigadeiro, cocada, paçoca, sorvete, pudim, chocolate) | **4** | confeitaria. Exceções: açúcar/mel/melado/rapadura (2); goiabada, marmelada, doces de fruta e frutas em calda (3). Bolo/torta sem flag ultra: 3. |
| Chocolate amargo 70% | **3** | pode ser 4 conforme a marca (lecitina, aromas). |
| Granola tradicional (industrializada), barra de granola/cereal, cereal matinal | **4** | açúcar, xarope e aditivos são o padrão de mercado. |
| Granola sem açúcar / caseira (aveia, castanhas, mel, óleo) | **3** | o Guia não cita granola; pela definição, alimentos in natura com óleo/mel adicionados e tostados = processado (3). Se a embalagem trouxer xarope, aromatizantes ou emulsificantes, é 4. |
| Muesli sem açúcar adicionado (flocos, frutas secas, castanhas) | **1** | mistura de alimentos minimamente processados. Com açúcar/xarope adicionado: 4 (não modelado, use Meus alimentos). |
| Pipoca de panela/sem óleo | **1**; de micro-ondas/sabores: **4**. |
| Castanhas e sementes torradas **com sal ou óleo** | **3**; sem sal: 1. Pastas de amendoim/amêndoa/tahine: 3 (dependem da marca). |
| Tofu, tempeh | **3**; proteína de soja texturizada, "carne vegetal", extrato de soja em pó: **4**. |
| Leites vegetais industrializados (soja, aveia, amêndoa, arroz) | **4**; leite de coco: 1. |
| Sucos "de laranja", "de uva integral" etc. | **1**; néctar, concentrado envasado, suco em pó, coquetel: **4**. |
| Cerveja e vinho | **3**; destilados (cachaça, vodca, whisky) e caipirinha: **4** (NOVA coloca destilados no grupo 4). |
| Shoyu, ketchup, maionese, molhos de salada, tempero em pó | **4**; mostarda, molho de pimenta, pesto, molho/extrato de tomate: **3** (variam com a marca). |
| Margarina | **4**; manteiga, ghee: **2**. |
| Açaí na tigela (embutido) | **4** (xarope de guaraná, granola); polpa de açaí pura: 1. |
| Suplementos (whey, albumina, creatina, maltodextrina, barras proteicas) | **4** | isolados e formulações industriais. |

## Itens de "Meus alimentos" e do Open Food Facts

- Meus alimentos: seletor opcional "Tipo (NOVA)", padrão "Não sei" (sem classificação). Se a pessoa escolhe 4, a flag antiga `ultra` também acende.
- Produto do Open Food Facts: usa `nova_group` do cadastro (1 a 4) quando existe; senão "Sem classificação" (e a flag antiga continua tratando produto industrializado como ultra). A pessoa pode corrigir ao conferir o produto.
- Refeições já salvas guardam só `alimentoId`; a classe é consultada no banco na hora do cálculo (`js/nova.js`), então não há migração. Se o alimento foi apagado do banco, vale a classe guardada no item, se houver; senão o item vai para "sem classificação".

## Revisão por amostragem

Revisão manual feita sobre (a) a listagem completa dos grupos 2, 3 e 4 e dos grupos 1 de categorias ambíguas (cereais, doces, outros, bebidas, laticínios, fast food, pratos) e (b) a amostra aleatória de 200 itens do relatório (semente fixa 20260123), total muito acima dos 150 pedidos. Erros encontrados e corrigidos nas regras:

- "Caqui chocolate" caía em chocolate (4): exceção explícita (1).
- "Nectarina" caía em néctar (4), "Maricota" em ricota (queijo, 3), "Fruta-pão" em pão (3), "Vinagreira" em vinagre (2), "Quibebe" em quibe (4): palavras agora casam por palavra inteira ou início de nome.
- "Pastel/omelete/esfirra/pão de queijo de queijo" e "pizza de mussarela" eram puxados para queijo (3): a regra de queijo agora só vale para nomes que começam por queijo/mussarela/ricota etc.
- "Castanhas/amêndoas (torrada)" e "Farinha de mandioca (torrada)" caíam em pão por causa de "torrada": só vale "torrada" no início do nome.
- "Cação/pescada com farinha de trigo" caíam em farinha (2): farinhas só valem no início do nome.
- "Milho verde (enlatado)" ficava em 1: conserva agora vence a regra de cereais (3).
- "Tapioca (massa pronta)" e "Panqueca americana de leitelho" eram classificadas pela palavra "pronta" e "leitelho": corrigidas.
- "Amendoim amanteigado" caía em biscoito (4): corrigido (3).
- "Pão de hambúrguer" aparecia como carne industrial: mesma classe (4), regra corrigida.
- "Frango Kung Pao" caía em pão (3): exceção.
- "Fermento biológico" caía em embutido ("tablete"): restrito a caldo em tablete.

Depois das correções, a segunda leitura da amostra de 200 não encontrou erro de classe. Restam, por natureza, os casos da tabela acima (dependem de marca ou preparo).


## Granola: decisão (23/10/2026)

O banco tinha quatro granolas divergentes (embutido 420 kcal, IBGE 388, USDA 489, "Musli" do IBGE copiado da granola), todas em NOVA 4. Passaram a ser variantes separadas no embutido (valores, porções e justificativa em tools/relatorio-banco.md, seção Curadoria): **Granola tradicional (industrializada)** = 4, **Granola sem açúcar (caseira)** = 3, **Barra de granola** = 4, **Muesli (sem açúcar adicionado)** = 1. Regras: granola-sem-acucar (3), muesli-simples (1), granola-industrializada (4), antes de cereal-matinal-barra. "Granola" sem qualificação cai na tradicional (4); a tela de confirmação mostra "Trocar por" com as irmãs (FAMILIAS_VARIANTES em js/foods.js). "Açaí com granola" permanece 4. Os ids antigos (granola, ibge-6504101-99, usda-s171646...) resolvem para a variante correspondente.
