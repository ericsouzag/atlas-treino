# Relatório de cobertura da classificação NOVA

Gerado por `node tools/unificar-banco.mjs` (regras em `js/nova-regras.js`, descrição em `tools/regras-nova.md`). É uma **estimativa por regras**: a classe real de um produto varia com a marca e o preparo.

## Cobertura geral (2186 alimentos: data/*.json + embutido restante)

| Grupo NOVA | Itens | % |
|---|---:|---:|
| 1 In natura / minimamente processado | 1298 | 59,4% |
| 2 Ingrediente culinário | 51 | 2,3% |
| 3 Processado | 253 | 11,6% |
| 4 Ultraprocessado | 584 | 26,7% |
| Sem classificação | 0 | 0,0% |
| **Total** | 2186 | 100% |

### Por fonte

| Fonte | Itens | 1 | 2 | 3 | 4 | Sem classe |
|---|---:|---:|---:|---:|---:|---:|
| taco | 592 | 411 | 27 | 56 | 98 | 0 |
| ibge | 737 | 383 | 5 | 93 | 256 | 0 |
| base | 113 | 51 | 1 | 12 | 49 | 0 |
| usda | 744 | 453 | 18 | 92 | 181 | 0 |

### Por categoria da fonte

| Categoria | Itens | 1 | 2 | 3 | 4 | Sem classe |
|---|---:|---:|---:|---:|---:|---:|
| bebidas | 119 | 65 | 0 | 5 | 49 | 0 |
| carnes | 386 | 332 | 0 | 12 | 42 | 0 |
| cereais | 222 | 90 | 16 | 42 | 74 | 0 |
| doces | 195 | 7 | 10 | 30 | 148 | 0 |
| fastfood | 123 | 0 | 0 | 2 | 121 | 0 |
| feculentos | 34 | 33 | 0 | 0 | 1 | 0 |
| frutas | 165 | 151 | 0 | 9 | 5 | 0 |
| gorduras | 28 | 0 | 15 | 0 | 13 | 0 |
| laticinios | 144 | 21 | 3 | 71 | 49 | 0 |
| leguminosas | 68 | 54 | 1 | 6 | 7 | 0 |
| oleaginosas | 75 | 50 | 0 | 25 | 0 | 0 |
| outros | 68 | 13 | 6 | 18 | 31 | 0 |
| ovos | 17 | 15 | 0 | 0 | 2 | 0 |
| peixes | 181 | 161 | 0 | 15 | 5 | 0 |
| pratos | 130 | 105 | 0 | 2 | 23 | 0 |
| suplementos | 14 | 0 | 0 | 0 | 14 | 0 |
| verduras | 217 | 201 | 0 | 16 | 0 | 0 |

## Regras que mais classificaram

| Regra -> grupo | Itens |
|---|---:|
| grupo-carnes -> 1 | 324 |
| grupo-verduras -> 1 | 200 |
| grupo-peixes -> 1 | 161 |
| grupo-frutas -> 1 | 136 |
| prato-caseiro -> 1 | 103 |
| pizza-lanche-pronto -> 4 | 91 |
| bebida-industrial -> 4 | 82 |
| cereal-base -> 1 | 74 |
| queijo -> 3 | 66 |
| grupo-leguminosas -> 1 | 54 |
| suco-natural -> 1 | 52 |
| embutido -> 4 | 52 |
| bala-chocolate -> 4 | 50 |
| grupo-oleaginosas -> 1 | 47 |
| biscoito -> 4 | 36 |
| conserva-vegetal-fruta -> 3 | 36 |
| grupo-feculentos -> 1 | 33 |
| pao -> 3 | 30 |
| oleaginosa-salgada -> 3 | 26 |
| carne-industrial -> 4 | 25 |
| confeitaria -> 4 | 24 |
| maionese-molhos-ultra -> 4 | 24 |
| cereal-matinal-barra -> 4 | 22 |
| farinha-base -> 1 | 19 |
| gordura-oleo -> 2 | 18 |
| farinha-amido-culinario -> 2 | 17 |
| cafe-cha-agua -> 1 | 17 |
| queijo-ultra -> 4 | 16 |
| pao-de-forma-industrial -> 4 | 15 |
| peixe-conserva-salga -> 3 | 15 |
| grupo-ovos -> 1 | 15 |
| suplemento -> 4 | 15 |
| salgadinho-snack -> 4 | 14 |
| conserva-doce-fruta -> 3 | 14 |
| confeitaria -> 3 | 14 |
| doce-diet-light -> 4 | 14 |
| preparos-infantis-instantaneos -> 4 | 12 |
| iogurte-natural -> 1 | 12 |
| leite -> 1 | 12 |
| sorvete-gelatina-pudim -> 4 | 11 |
| carne-salgada-curada -> 3 | 10 |
| iogurte-com-sabor -> 4 | 10 |
| acucar-mel -> 2 | 10 |
| pao-com-margarina -> 4 | 9 |
| fruta-seca -> 1 | 9 |
| leite-condensado-doce-leite -> 4 | 8 |
| preparo-simples-outros -> 1 | 8 |
| sopa-lata-desidratada -> 4 | 8 |
| hamburguer-carne-usda -> 1 | 8 |
| tempero-natural -> 1 | 7 |
| creme-de-leite-nata -> 3 | 7 |
| proteina-texturizada -> 4 | 7 |
| sal-vinagre-fermento -> 2 | 6 |
| mostarda-pimenta-pesto -> 3 | 6 |
| biscoito-artesanal -> 3 | 6 |
| pastelaria-sem-flag -> 3 | 6 |
| bolo-pronto -> 4 | 5 |
| macarrao-instantaneo -> 4 | 5 |
| alcool-fermentado -> 3 | 5 |
| empanado-industrial -> 4 | 5 |
| grupo-fastfood -> 4 | 5 |
| alcool-destilado -> 4 | 4 |
| pipoca-industrial -> 4 | 4 |
| grupo-doces -> 4 | 4 |
| pronto-industrial -> 4 | 4 |
| pipoca-simples -> 1 | 3 |
| pasta-oleaginosa -> 3 | 3 |
| levedo-cevada -> 1 | 2 |
| sanduiche-natural -> 3 | 2 |
| acai-tigela -> 4 | 2 |
| pao-com-manteiga-ovo -> 3 | 2 |
| presunto-cru-curado -> 3 | 2 |
| farinha-de-rosca -> 3 | 1 |
| acai-xarope -> 4 | 1 |
| caqui-chocolate -> 1 | 1 |
| pacoca-de-carne -> 3 | 1 |
| chocolate-70 -> 3 | 1 |
| agua-com-gas -> 1 | 1 |

## Sem classificação (0)

Nunca se inventa: itens sem regra ficam fora dos percentuais ou à parte no gráfico.

_Nenhum._

## Divergências com a flag `ultra` das fontes

A flag antiga é uma dica imprecisa (ex.: "batata doce" marcada por conter "doce"). Ela só decide nos grupos ambíguos; nos naturais (frutas, verduras, feculentos, leguminosas, oleaginosas, ovos, peixes, carnes, pratos) a regra por nome/categoria prevalece.

### Flag ultra, mas NOVA diferente de 4 (16)

- Batata doce (cozida) -> 1 (grupo-feculentos)
- Batata inglesa (frita) -> 1 (grupo-feculentos)
- Goiaba doce em pasta -> 3 (conserva-doce-fruta)
- Goiaba doce cascão -> 3 (conserva-doce-fruta)
- Doce de abóbora cremoso -> 3 (conserva-doce-fruta)
- Batata doce (assada) -> 1 (grupo-feculentos)
- Batata doce (refogada) -> 1 (grupo-feculentos)
- Batata doce (frita) -> 1 (grupo-feculentos)
- Erva doce -> 1 (grupo-verduras)
- Goiabada -> 3 (conserva-doce-fruta)
- Queijo prato light -> 3 (queijo)
- Paçoca de carne de sol -> 3 (pacoca-de-carne)
- Salada de maionese -> 1 (prato-caseiro)
- Geleia de frutas -> 3 (conserva-doce-fruta)
- Presunto cru (ham curado) -> 3 (presunto-cru-curado)
- Presunto cru (ham curado) (só carne magra) -> 3 (presunto-cru-curado)

### NOVA 4 sem a flag ultra (204)

- Mistura para vitamina (trigo, cevada e aveia) (preparos-infantis-instantaneos)
- Pão aveia forma (pao-de-forma-industrial)
- Pão glúten forma (pao-de-forma-industrial)
- Pão milho forma (pao-de-forma-industrial)
- Pão trigo forma integral (pao-de-forma-industrial)
- Pastel de carne (cru) (pizza-lanche-pronto)
- Pastel de carne (frito) (pizza-lanche-pronto)
- Pastel de queijo (cru) (pizza-lanche-pronto)
- Pastel de queijo (frito) (pizza-lanche-pronto)
- Açaí com xarope de guaraná e glucose (polpa) (acai-xarope)
- Caju envasado (suco concentrado) (bebida-industrial)
- Maracujá envasado (suco concentrado) (bebida-industrial)
- Uva envasado (suco concentrado) (bebida-industrial)
- Presunto (com capa de gordura) (embutido)
- Presunto (sem capa de gordura) (embutido)
- Quibe (assado) (pizza-lanche-pronto)
- Quibe (cru) (pizza-lanche-pronto)
- Quibe (frito) (pizza-lanche-pronto)
- Leite fermentado (bebida-industrial)
- Queijo requeijão cremoso (queijo-ultra)
- Cachaça (aguardente de cana) (alcool-destilado)
- Cocada branca (bala-chocolate)
- Shoyu (maionese-molhos-ultra)
- Tempero a base de sal (maionese-molhos-ultra)
- Maionese tradicional com ovos (maionese-molhos-ultra)
- Paçoca amendoim (bala-chocolate)
- Pé-de-moleque amendoim (bala-chocolate)
- Soja extrato solúvel natural fluido (bebida-industrial)
- Soja extrato solúvel pó (proteina-texturizada)
- Pipoca light (pipoca-industrial)
- Arrozina (preparos-infantis-instantaneos)
- Mucilon (preparos-infantis-instantaneos)
- Cremogema (preparos-infantis-instantaneos)
- Vitamilho (preparos-infantis-instantaneos)
- Farinha láctea (preparos-infantis-instantaneos)
- Vitaflocos (preparos-infantis-instantaneos)
- Bife vegetal (proteina-texturizada)
- Carne vegetal (frita) (proteina-texturizada)
- Pasta de soja (proteina-texturizada)
- Carne de soja (proteina-texturizada)
- Granola (cereal-matinal-barra)
- Musli (cereal-matinal-barra)
- Mix de cereais (cereal-matinal-barra)
- Miojo (macarrao-instantaneo)
- Sustagem (bebida-industrial)
- Proteína de soja (proteina-texturizada)
- Proteína vegetal (proteina-texturizada)
- Confete (bala-chocolate)
- Ovomaltine (bebida-industrial)
- Trufa (bala-chocolate)
- Manjar (sorvete-gelatina-pudim)
- Quebra queixo (bala-chocolate)
- Pé de moleque (bala-chocolate)
- Torrao de amendoim (bala-chocolate)
- Pacoquinha de amendoim (grupo-doces)
- Amendoim caramelizado (bala-chocolate)
- Queijadinha (bala-chocolate)
- Cacarola italiana (grupo-doces)
- Leite geleificado (leite-condensado-doce-leite)
- Geladinho (sorvete-gelatina-pudim)
- Churro (bala-chocolate)
- Ovo de pascoa (bala-chocolate)
- Kinder ovo (bala-chocolate)
- Torrone (grupo-doces)
- Barra de cereais salgada (cereal-matinal-barra)
- Barra de cereais diet (cereal-matinal-barra)
- Milk shake diet (bebida-industrial)
- Amendoim amanteigado diet (doce-diet-light)
- Molho de soja (maionese-molhos-ultra)
- Shoyo (maionese-molhos-ultra)
- Creme de queijo (queijo-ultra)
- Molho de soja light (maionese-molhos-ultra)
- Creme de cebola (sopa desidratada) (sopa-lata-desidratada)
- Creme de legumes (sopa desidratada) (sopa-lata-desidratada)
- Pasta de carne em conserva (embutido)
- Pasta de galinha em conserva (embutido)
- Almondega ao molho em conserva (carne-industrial)
- Creme de cebola (sopa desidratada) light (sopa-lata-desidratada)
- Creme de legumes (sopa desidratada) light (sopa-lata-desidratada)
- Yakissoba (sopa de legumes desidratada) light (macarrao-instantaneo)
- Steak de frango (frito) (carne-industrial)
- Leite beijinho (bebida-industrial)
- Chantilly (leite-condensado-doce-leite)
- Leite de soja com sabor (bebida-industrial)
- Ades original (bebida-industrial)
- Queijo polenguinho (queijo-ultra)
- Queijo cremoso (queijo-ultra)
- Leite com sabor (bebida-industrial)
- Bebida achocolatada (bebida-industrial)
- Leite de soja em pó (bebida-industrial)
- Leite de soja com sabor light (bebida-industrial)
- Ades light (bebida-industrial)
- Queijo polenguinho light (queijo-ultra)
- Bebida achocolatada light (bebida-industrial)
- Leite com sabor diet (bebida-industrial)
- Leite de soja em pó light (bebida-industrial)
- Leite em pó com sabor (bebida-industrial)
- Bisnaguinha (pao-de-forma-industrial)
- Pão diet (de forma industrializado) (pao-de-forma-industrial)
- Pão integral light (pao-de-forma-industrial)
- Pão de mel diet (pao-de-forma-industrial)
- Copa de porco defumada (embutido)
- Bacon (embutido)
- Chourico (embutido)
- Morcela (embutido)
- Morcilha (embutido)
- Salaminho (embutido)
- Pate (embutido)
- Minuano tradicional (bebida-industrial)
- Tubaina light (bebida-industrial)
- Chocomilk (bebida-industrial)
- Água tônica tradicional (bebida-industrial)
- Bebida energetica (bebida-industrial)
- Café solúvel cappuccino (bebida-industrial)
- Água tônica light (bebida-industrial)
- Café cappuccino solúvel light (bebida-industrial)
- Coquetel de frutas (bebida-industrial)
- Caipirinha (alcool-destilado)
- Esfirra (pizza-lanche-pronto)
- Esfirra de carne (pizza-lanche-pronto)
- Esfirra de queijo (pizza-lanche-pronto)
- Esfirra de ricota (pizza-lanche-pronto)
- Esfirra de frango (pizza-lanche-pronto)
- Enroladinho (pizza-lanche-pronto)
- Cheesburguer (pizza-lanche-pronto)
- Eggsburguer (pizza-lanche-pronto)
- Bauru (pizza-lanche-pronto)
- Americano (pizza-lanche-pronto)
- Misto quente ou frio (pizza-lanche-pronto)
- Cheese egg (pizza-lanche-pronto)
- Cheese tudo (pizza-lanche-pronto)
- Pizza (pizza-lanche-pronto)
- Café tipo cappuccino (bebida-industrial)
- Batata palha (salgadinho-snack)
- Farofa pronta (pronto-industrial)
- Açaí com granola (acai-tigela)
- Lazanha pronta light (pronto-industrial)
- Macarrão pronto light (cozido) (pronto-industrial)
- Pizza portuguesa light (pizza-lanche-pronto)
- Farofa pronta light em pacote (pronto-industrial)
- Peito de peru (embutido)
- Iogurte proteico (tipo skyr) (iogurte-com-sabor)
- Requeijão cremoso (queijo-ultra)
- Cream cheese (queijo-ultra)
- Margarina (pao-com-margarina)
- Whey protein (suplemento)
- Albumina (suplemento)
- Colágeno hidrolisado (suplemento)
- Creatina (suplemento)
- Maltodextrina (suplemento)
- Hipercalórico (suplemento)
- Açaí na tigela (acai-tigela)
- Pudim (sorvete-gelatina-pudim)
- Gelatina (sorvete-gelatina-pudim)
- Refrigerante zero (bebida-industrial)
- Destilado (cachaca, vodka, whisky) (alcool-destilado)
- Cappuccino (bebida-industrial)
- Esfiha de carne (pizza-lanche-pronto)
- Leite de soja (bebida) (sem açúcar) (bebida-industrial)
- Leite de aveia (bebida) (bebida-industrial)
- Ensure (suplemento nutricional pronto) (suplemento)
- Granola (USDA) (cereal-matinal-barra)
- Néctar de pera (bebida-industrial)
- Cream cheese (semidesnatado) (queijo-ultra)
- Leite com chocolate (achocolatado pronto) (integral) (bebida-industrial)
- Leite com chocolate (achocolatado pronto) (semidesnatado) (bebida-industrial)
- Sopa minestrone (lata) (sopa-lata-desidratada)
- Sopa de legumes (lata) (sopa-lata-desidratada)
- Molho teriyaki (maionese-molhos-ultra)
- Queijo neufchâtel (queijo-ultra)
- Soro de leite (whey) em pó (suplemento)
- Caldo de galinha (lata) (carne-industrial)
- Sopa de macarrão com frango (lata) (sopa-lata-desidratada)
- Caldo de carne (lata) (carne-industrial)
- Sopa de tomate (lata) (sopa-lata-desidratada)
- Molho inglês (maionese-molhos-ultra)
- Néctar de damasco (bebida-industrial)
- Molho tártaro (maionese-molhos-ultra)
- Molho barbecue (maionese-molhos-ultra)
- Energético (lata) (bebida-industrial)
- Root beer (refrigerante) (bebida-industrial)
- Chá gelado adoçado (preto) (bebida-industrial)
- Coquetel de cranberry (bebida-industrial)
- Energético zero açúcar (bebida-industrial)
- Leite de arroz (bebida) (sem açúcar) (bebida-industrial)
- Leite de soja (bebida) (bebida-industrial)
- Molho hoisin (maionese-molhos-ultra)
- Boost Plus (suplemento nutricional pronto) (suplemento)
- SlimFast (pó para shake) (suplemento)
- Whey protein em pó (suplemento)
- Proteína de soja em pó (suplemento) (suplemento)
- Refrigerante de uva (bebida-industrial)
- Suplemento proteico Muscle Milk (pó) (suplemento)
- Suplemento proteico Muscle Milk Light (pó) (suplemento)
- Surimi (kani) (carne-industrial)
- Molho agridoce (maionese-molhos-ultra)
- Leite de coco (bebida) (com açúcar) (bebida-industrial)
- Chá gelado adoçado (verde) (bebida-industrial)
- Peixe empanado (fish sticks) (carne-industrial)
- Molho de soja (shoyu) (maionese-molhos-ultra)
- Destilado 40% (vodca, gin, rum, uísque) (alcool-destilado)
- Leite de amêndoas (bebida) (sem açúcar) (bebida-industrial)
- Ginger ale (bebida-industrial)
- Refrigerante de cola (bebida-industrial)

## Itens limítrofes para revisão (676)

Casos em que a classe depende de marca, preparo ou critério. Cada bloco é uma regra com ressalva.

### prato-caseiro: prato caseiro: classificado como preparação culinária de ingredientes 1 e 2 (os ingredientes industrializados do prato não são decompostos) (103)

Arroz carreteiro [1]; Baião de dois arroz e feijão-de-corda [1]; Barreado [1]; Bife à cavalo com contra filé [1]; Bolinho de arroz [1]; Camarão à baiana [1]; Charuto de repolho [1]; Cuscuz de milho (cozido com sal) [1]; Cuscuz paulista [1]; Cuxá molho [1]; Dobradinha [1]; Estrogonofe de carne [1]; Estrogonofe de frango [1]; Feijão tropeiro mineiro [1]; Feijoada [1]; Frango com açafrão [1]; Macarrão molho bolognesa [1]; Maniçoba [1]; Quibebe [1]; Salada de legumes com maionese [1]; Salada de legumes (cozida no vapor) [1]; Salpicão de frango [1]; Sarapatel [1]; Tabule [1]; Tacacá [1]; Tapioca com manteiga [1]; Vaca atolada [1]; Vatapá [1]; Virado à paulista [1]; Yakisoba [1]; Rizole [1]; Abara (bahia) [1]; Angu frito [1]; Angu de milho [1]; Polenta [1]; Bolinho de aipim [1]; Bolinho de bacalhau [1]; Salada de maionese [1]; Lazanha [1]; Nhoque [1]; Caneloni [1]; Capeleti [1]; Ravioli [1]; Calzone [1]; Panqueca [1]; Macarronada [1]; Milho cozido [1]; Batata palito [1]; Mungunza [1]; Canjica [1]; Curau [1]; Farofa [1]; Mingau [1]; Bolinho de coco [1]; Risoto [1]; Baião de dois [1]; Sushi [1]; Salada de frutas [1]; Sopa [1]; Salpicão [1]; ... e mais 43

### pizza-lanche-pronto: salgados de lanchonete e pizzas podem ser artesanais (3); aqui = 4 (91)

Pastel de carne (cru) [4]; Pastel de carne (frito) [4]; Pastel de queijo (cru) [4]; Pastel de queijo (frito) [4]; Pastel massa (crua) [4]; Pastel massa (frita) [4]; Coxinha de frango (frita) [4]; Croquete de carne (cru) [4]; Croquete de carne (frito) [4]; Empada de frango (pré-cozida, assada) [4]; Empada de frango (pré-cozida) [4]; Quibe (assado) [4]; Quibe (cru) [4]; Quibe (frito) [4]; Mini pizza semipronta [4]; Mini pastel [4]; Mini pizza semipronta light (assado) [4]; Pastel [4]; Croquete [4]; Coxinha [4]; Empada [4]; Quibe [4]; Esfirra [4]; Esfirra de carne [4]; Esfirra de queijo [4]; Esfirra de ricota [4]; Esfirra de frango [4]; Enroladinho [4]; Cachorro quente [4]; Cheesburguer [4]; Eggsburguer [4]; Bauru [4]; Americano [4]; Misto quente ou frio [4]; Sanduíche de queijo prato [4]; Cheese egg [4]; Cheese tudo [4]; Pizza [4]; Pizza mussarela [4]; Pizza portuguesa [4]; Empadao [4]; Pizza pronta light [4]; Pizza portuguesa light [4]; Pizza margherita [4]; Pizza quatro queijos [4]; Pizza de atum [4]; Esfiha de carne [4]; Pastel frito [4]; Big mac [4]; Misto quente [4]; Macarrão com queijo (mac and cheese) [4]; Sanduíche de peixe (fast food) [4]; Sanduíche submarino [4]; Subway sanduíche de bife com queijo [4]; Subway sanduíche de frango assado [4]; Subway sanduíche de atum [4]; Pizza congelada de queijo [4]; McDonald's Filet-o-Fish [4]; McDonald's Cheeseburger [4]; Wendy's Classic Single com queijo [4]; ... e mais 31

### bebida-industrial: bebidas vegetais industrializadas (soja, aveia, amêndoas...) são 4 pelos aditivos; versão caseira seria 1 (82)

Caju envasado (suco concentrado) [4]; Maracujá envasado (suco concentrado) [4]; Uva envasado (suco concentrado) [4]; Bebida láctea pêssego [4]; Leite de vaca achocolatado [4]; Leite fermentado [4]; Bebida isotônica sabores variados [4]; Refrigerante tipo água tônica [4]; Refrigerante tipo cola [4]; Refrigerante tipo guaraná [4]; Refrigerante tipo laranja [4]; Refrigerante tipo limão [4]; Achocolatado pó [4]; Capuccino pó [4]; Soja extrato solúvel natural fluido [4]; Sustagem [4]; Ovomaltine [4]; Toddynho [4]; Amendoim achocolatado [4]; Diet shake [4]; Concentrado alimentar diet shake [4]; Milk shake [4]; Achocolatado em pó light [4]; Toddynho diet [4]; Milk shake diet [4]; Leite beijinho [4]; Bebida láctea [4]; Leite de soja com sabor [4]; Ades original [4]; Leite com sabor [4]; Leite aromatizado [4]; Bebida achocolatada [4]; Leite de soja em pó [4]; Leite de soja com sabor light [4]; Ades light [4]; Leite achocolatado light [4]; Bebida achocolatada light [4]; Leite com sabor diet [4]; Leite de soja em pó light [4]; Leite em pó com sabor [4]; Sprit refrigerante tradicional [4]; Refrigerante de cola light [4]; Minuano tradicional [4]; Tubaina light [4]; Chocomilk [4]; Água tônica tradicional [4]; Bebida energetica [4]; Café solúvel cappuccino [4]; Água tônica light [4]; Paraguai refrigerante light [4]; Café cappuccino solúvel light [4]; Refrigerante de quinino dietético [4]; Coquetel de frutas [4]; Café tipo cappuccino [4]; Achocolatado pronto [4]; Refrigerante [4]; Refrigerante zero [4]; Suco de caixinha (néctar) [4]; Suco em pó preparado [4]; Cappuccino [4]; ... e mais 22

### suco-natural: suco "natural" vendido pronto ou com açúcar adicionado pode ser 4 (52)

Laranja baía (suco) [1]; Laranja da terra (suco) [1]; Laranja lima (suco) [1]; Laranja pêra (suco) [1]; Laranja valência (suco) [1]; Limão cravo (suco) [1]; Limão galego (suco) [1]; Tangerina Poncã (suco) [1]; Suco [1]; Suco de abacaxi [1]; Suco de acerola [1]; Suco de beterraba [1]; Suco de cupuaçu [1]; Suco de goiaba [1]; Suco de laranja [1]; Suco de laranja com banana [1]; Suco de laranja e beterraba [1]; Suco de laranja e cenoura [1]; Suco de laranja cenoura e beterraba [1]; Suco de mamão [1]; Suco de manga [1]; Suco de maracujá [1]; Suco de melão [1]; Suco de morango [1]; Suco de pêssego [1]; Suco de pêssego em calda [1]; Vitamina [1]; Vitamina de banana [1]; Vitamina de banana com aveia [1]; Vitamina de mamão [1]; Vitamina de abacate [1]; Vitamina de morango [1]; Vitamina mista [1]; Vitamina de maçã [1]; Suco de laranja natural [1]; Suco de caju [1]; Suco de limão (limonada) [1]; Suco de melancia [1]; Suco de uva integral [1]; Suco de graviola [1]; Suco de tangerina [1]; Vitamina de banana com leite [1]; Suco de limão [1]; Suco de ameixa seca [1]; Suco de maçã (sem açúcar) [1]; Suco de romã [1]; Suco de cranberry (sem açúcar) [1]; Suco de limão (lima) [1]; Suco de limão (lima) (sem açúcar) [1]; Suco de uva (sem açúcar) [1]; Suco de tomate [1]; Suco de cenoura [1]

### embutido: linguiça fresca artesanal e bacon podem ser vistos como 3; o Guia agrupa embutidos entre os ultraprocessados (52)

Apresuntado [4]; Linguiça frango (crua) [4]; Linguiça frango (frita) [4]; Linguiça frango (grelhada) [4]; Linguiça porco (crua) [4]; Linguiça porco (frita) [4]; Linguiça porco (grelhada) [4]; Mortadela [4]; Presunto (com capa de gordura) [4]; Presunto (sem capa de gordura) [4]; Salame [4]; Pasta de carne em conserva [4]; Pasta de presunto em conserva [4]; Pasta de galinha em conserva [4]; Salsicha em conserva [4]; Baconzitos [4]; Copa de porco defumada [4]; Bacon [4]; Salsicha no varejo [4]; Linguiça [4]; Chourico [4]; Morcela [4]; Morcilha [4]; Salaminho [4]; Blanquet de peru [4]; Presunto [4]; Pate [4]; Mortadela light [4]; Salsicha no varejo light (frita) [4]; Salame light [4]; Blanquet de peru light [4]; Sanduíche de salame [4]; Sanduíche de presunto [4]; Sanduíche de queijo prato com presunto [4]; Sanduíche de mortadela [4]; Pizza calabresa [4]; Pizza presunto [4]; Linguiça toscana grelhada [4]; Salsicha [4]; Bacon frito [4]; Peito de peru [4]; Pizza de bacon [4]; Bacon canadense [4]; Bacon cru [4]; Subway sanduíche de bacon, alface e tomate [4]; Pizza de calabresa (sausage) Domino's (massa fina) [4]; Pizza de calabresa (sausage) Pizza Hut (massa pan) [4]; Subway sanduíche de peito de peru [4]; Subway sanduíche de presunto [4]; Pizza de calabresa (sausage) Domino's (massa tradicional) [4]; Pizza de calabresa (sausage) Pizza Hut (massa fina) [4]; Pizza de calabresa (sausage) Pizza Hut (massa tradicional) [4]

### bala-chocolate: doces tradicionais caseiros (brigadeiro, cocada, paçoca...) seriam preparações; aqui seguem o padrão de confeitaria = 4 (50)

Bolo pronto chocolate [4]; Chocolate ao leite [4]; Chocolate ao leite com castanha do Pará [4]; Chocolate ao leite dietético [4]; Chocolate meio amargo [4]; Cocada branca [4]; Paçoca amendoim [4]; Pé-de-moleque amendoim [4]; Caramelo (bala) [4]; Tablete de chocolate [4]; Barra de chocolate [4]; Confete [4]; Trufa [4]; Cocada [4]; Quebra queixo [4]; Doce de amendoim [4]; Pé de moleque [4]; Paçoca [4]; Torrao de amendoim [4]; Amendoim caramelizado [4]; Brigadeiro [4]; Queijadinha [4]; Churro [4]; Ioio creme (chocolate em creme) [4]; Ovo de pascoa [4]; Kinder ovo [4]; Barra de chocolate light [4]; Cocada diet [4]; Doce de amendoim diet [4]; Paçoca diet [4]; Bolo de chocolate [4]; Bolo de chocolate light [4]; Chocolate [4]; Creme de avelã com cacau [4]; Pizza de chocolate [4]; Caramelo (bala mole) [4]; Chocolate branco [4]; Chocolate meio amargo (gotas) [4]; Fudge de chocolate [4]; Balas de goma (jelly beans) [4]; Bala dura [4]; Kit Kat [4]; Marshmallow [4]; Chocolate Hershey's [4]; Milky Way [4]; Reese's (copinhos de pasta de amendoim) [4]; Trufa de chocolate [4]; M&M's [4]; Snickers (barra) [4]; Creme de avelã com cacau (Nutella) [4]

### confeitaria: bolos e doces sem flag de ultraprocessado ficam em 3; com flag, 4 (38)

Maria mole [4]; Maria mole coco queimado [4]; Quindim [3]; Merengue [3]; Mil folhas [3]; Fios de ovos [3]; Ambrosia [3]; Mumu [3]; Canudinho recheado [3]; Schimier de fruta (exceto de cana) [3]; Arroz-doce [4]; Rabanada [3]; Pasteis de santa clara [3]; Suspiro [3]; Bolo de milho [4]; Bolo de aipim [4]; Bolo de tapioca [4]; Bolo de goma [4]; Bolo de batata doce [4]; Bolo de arroz [4]; Bolo de cará [4]; Bolo de laranja [4]; Bolo de coco [4]; Bolo de cenoura [4]; Bolo de trigo [4]; Bolo de banana [4]; Bolo simples [3]; Panqueca americana [3]; Brownie [4]; Cheesecake [4]; Torta de mirtilo [4]; Torta de cereja [4]; Torta de limão com merengue [4]; Torta de noz-pecã [4]; Torta de abóbora [4]; Torta de maçã [4]; Bolo inglês (pound cake) [4]; Panqueca americana de leitelho [3]

### pao: pão: 3 pelo Guia (farinha, água, sal, fermento); varia com a marca (30)

Pão de soja [3]; Pão trigo francês [3]; Pão trigo sovado [3]; Torrada pão francês [3]; Pão de queijo (assado) [3]; Pão de queijo (cru) [3]; Chineque [3]; Chineque com farofa [3]; Croissant [3]; Pão de queijo [3]; Pão de milho [3]; Pão integral [3]; Rosca salgada [3]; Brioche [3]; Broa [3]; Pão de queijo light [3]; Torrada [3]; Tortilha de trigo [3]; Pão multigrãos [3]; Pão naan [3]; Pão tipo francês/vienense [3]; Pão de farelo de aveia [3]; Pão de centeio [3]; Pão sírio (pita) [3]; English muffin [3]; Tortilha de milho [3]; Bagel [3]; Pão de milho (cornbread) [3]; Pão italiano [3]; Pão pumpernickel [3]

### oleaginosa-salgada: castanhas torradas com sal/óleo: 3 (26)

Amendoim (torrado, salgado) [3]; Amêndoa (torrada, salgada) [3]; Castanha-de-caju (torrada, salgada) [3]; Amendoim amanteigado [3]; Amendoim apimentado [3]; Amêndoas (torrada, com sal) [3]; Semente de girassol (torrada, com sal) [3]; Semente de girassol (torrada no óleo, com sal) [3]; Semente de girassol (com sal) [3]; Macadâmia (torrada, com sal) [3]; Mix de castanhas e nozes (torrada, com sal) [3]; Mix de castanhas e nozes (torrada no óleo, com sal) [3]; Amêndoas (torrada no óleo) [3]; Semente de abóbora (pepita) (com sal) [3]; Amêndoas (torrada no óleo, com sal) [3]; Castanha de caju (torrada, com sal) [3]; Castanha de caju (torrada no óleo, com sal) [3]; Noz-pecã (torrada, com sal) [3]; Noz-pecã (torrada no óleo, com sal) [3]; Pistache (torrada, com sal) [3]; Mix de castanhas e nozes (torrada no óleo) [3]; Semente de girassol (torrada no óleo) [3]; Castanha de caju (torrada no óleo) [3]; Noz-pecã (torrada no óleo) [3]; Nozes (torrada, com sal) [3]; Amendoim (com sal) [3]

### maionese-molhos-ultra: shoyu e molhos prontos: o grupo 4 é o mais comum, mas há fermentação tradicional (24)

Shoyu [4]; Tempero a base de sal [4]; Maionese tradicional com ovos [4]; Molho de soja [4]; Shoyo [4]; Maionese (molho) [4]; Ketchup [4]; Catchup [4]; Maionese (molho) light [4]; Molho de soja light [4]; Maionese [4]; Molho de queijo azul [4]; Molho italiano (salada) [4]; Molho caesar [4]; Molho francês (salada) [4]; Molho teriyaki [4]; Molho mil ilhas [4]; Molho inglês [4]; Molho tártaro [4]; Molho barbecue [4]; Molho hoisin [4]; Molho ranch [4]; Molho agridoce [4]; Molho de soja (shoyu) [4]

### cereal-matinal-barra: granola e muesli variam muito de marca (com ou sem açúcar e aditivos) (22)

Cereal matinal milho [4]; Cereal matinal milho açúcar [4]; Sucrilhos de milho [4]; Cereal matinal de milho em flocos [4]; Granola [4]; Musli [4]; Mix de cereais [4]; Sucrilhos de milho light [4]; Barra de cereais [4]; Barra de cereais salgada [4]; Barra de cereais doce [4]; Barra de cereais diet [4]; Barra de cereais doce diet [4]; Cereal matinal açucarado [4]; Barra de granola [4]; Granola (USDA) [4]; Cap'n Crunch (cereal matinal) [4]; Raisin Bran (cereal matinal) [4]; Sucrilhos (Frosted Flakes) [4]; Barra de cereal/energia [4]; Cheerios (cereal matinal) [4]; Corn Flakes (cereal matinal) [4]

### farinha-amido-culinario: o Guia lista farinhas entre os minimamente processados; aqui as de uso culinário (trigo, amidos) ficam em 2 e as de base alimentar (mandioca, milho) em 1 (17)

Farinha de arroz enriquecida [2]; Farinha de centeio integral [2]; Farinha de trigo [2]; Milho amido (cru) [2]; Fécula de mandioca [2]; Polvilho doce [2]; Soja farinha [2]; Amido de milho [2]; Amido de arroz [2]; Farinha de soja [2]; Farinha de arroz (USDA) [2]; Farinha de amêndoa [2]; Farinha de quinoa [2]; Farinha de trigo sarraceno [2]; Farinha de coco [2]; Farinha de centeio [2]; Farinha de grão-de-bico [2]

### pao-de-forma-industrial: pão de forma industrial é 4 (aditivos); pão de padaria é 3 (15)

Pão aveia forma [4]; Pão glúten forma [4]; Pão milho forma [4]; Pão trigo forma integral [4]; Pão de hambúrguer [4]; Pão doce [4]; Panetone [4]; Bisnaguinha [4]; Rosca doce [4]; Rosquinha doce [4]; Rosquinha salgada [4]; Pão diet (de forma industrializado) [4]; Pão integral light [4]; Pão de mel diet [4]; Pão de forma [4]

### conserva-doce-fruta: doces de fruta com açúcar: 3 pela definição (fruta + açúcar), mas versões industriais com aditivos seriam 4 (14)

Banana doce em barra [3]; Goiaba doce em pasta [3]; Goiaba doce cascão [3]; Mamão doce em calda (drenado) [3]; Mamão verde doce em calda (drenado) [3]; Doce de abóbora cremoso [3]; Geleia mocotó natural [3]; Marmelada [3]; Pessegada [3]; Figada [3]; Goiabada [3]; Caju em pasta [3]; Mariola [3]; Geleia de frutas [3]

### carne-salgada-curada: carne salgada/seca e toucinho: 3 (salga simples) (10)

Carne bovina charque (cozido) [3]; Carne bovina charque (cru) [3]; Carne bovina seca (cozida) [3]; Carne bovina seca (crua) [3]; Porco orelha (salgada, crua) [3]; Porco rabo (salgado, cru) [3]; Toucinho (cru) [3]; Toucinho (frito) [3]; Toucinho [3]; Carne seca cozida [3]

### hamburguer-carne-usda: carne moída moldada (USDA, só carne); marcas industriais variam (8)

Hambúrguer de carne 70% magra (grelhado) [1]; Hambúrguer de carne 95% magra (grelhado) [1]; Hambúrguer de carne 90% magra (grelhado) [1]; Hambúrguer de carne 80% magra (grelhado) [1]; Hambúrguer de carne 97% magra (grelhado) [1]; Hambúrguer de carne 85% magra (grelhado) [1]; Hambúrguer de carne 75% magra (grelhado) [1]; Hambúrguer de carne 93% magra (grelhado) [1]

### proteina-texturizada: proteína de soja texturizada é formulada; tofu e tempeh ficam em 3 (7)

Soja extrato solúvel pó [4]; Bife vegetal [4]; Carne vegetal (frita) [4]; Pasta de soja [4]; Carne de soja [4]; Proteína de soja [4]; Proteína vegetal [4]

### mostarda-pimenta-pesto: varia com a marca (aditivos) (6)

Mostarda molho [3]; Alcaparra em conserva [3]; Molho salsa (tomate e pimenta) [3]; Mostarda [3]; Molho de pimenta [3]; Molho pesto [3]

### biscoito-artesanal: biscoitos de padaria/artesanais: podem ser 4 conforme a receita (6)

Cavaco chines [3]; Sequilho [3]; Tareco [3]; Solda [3]; Brevidade [3]; Quebra quebra [3]

### grupo-feculentos: flag ultraprocessado da fonte discorda (5)

Batata doce (cozida) [1]; Batata inglesa (frita) [1]; Batata doce (assada) [1]; Batata doce (refogada) [1]; Batata doce (frita) [1]

### alcool-destilado: destilados: NOVA os coloca no grupo 4 (cerveja e vinho ficam em 3) (4)

Cachaça (aguardente de cana) [4]; Caipirinha [4]; Destilado (cachaca, vodka, whisky) [4]; Destilado 40% (vodca, gin, rum, uísque) [4]

### pronto-industrial: prato/farofa "pronto" = industrializado (4)

Farofa pronta [4]; Lazanha pronta light [4]; Macarrão pronto light (cozido) [4]; Farofa pronta light em pacote [4]

### pasta-oleaginosa: pasta de amendoim varia: 100% amendoim = 1; com açúcar/óleo = 3 ou 4 (3)

Pasta de amendoim [3]; Pasta de amêndoa [3]; Tahine (pasta de gergelim) [3]

### acai-tigela: açaí na tigela leva xarope de guaraná/granola/leite condensado (2)

Açaí com granola [4]; Açaí na tigela [4]

### presunto-cru-curado: presunto cru curado só com sal pode ser 3; o cozido/apresuntado é 4 (2)

Presunto cru (ham curado) [3]; Presunto cru (ham curado) (só carne magra) [3]

### grupo-verduras: flag ultraprocessado da fonte discorda (1)

Erva doce [1]

### pacoca-de-carne: prato com carne de sol (salgada) e farinha (1)

Paçoca de carne de sol [3]

### chocolate-70: chocolate amargo 70% sem lecitina/aromas pode ser 3; marcas variam (1)

Chocolate amargo 70% [3]

## Amostra aleatória de 200 itens (semente 20260123) para revisão manual

Revisada à mão a cada mudança de regras; as correções feitas estão em `tools/regras-nova.md`, seção "Revisão por amostragem".

| Alimento | Fonte | Categoria | NOVA | Regra |
|---|---|---|---:|---|
| Couve manteiga (refogada) | taco | verduras | 1 | grupo-verduras |
| Tomate (cozido) | usda | verduras | 1 | grupo-verduras |
| Laranja da terra (suco) | taco | frutas | 1 | suco-natural |
| Robalo (assado) | usda | peixes | 1 | grupo-peixes |
| Alface roxa (crua) | taco | verduras | 1 | grupo-verduras |
| Salmão do Atlântico (selvagem) (cru) | usda | peixes | 1 | grupo-peixes |
| Leite fermentado | taco | laticinios | 4 | bebida-industrial |
| Biscoito doce wafer recheado de chocolate | taco | cereais | 4 | biscoito |
| Abacate (cru) | taco | frutas | 1 | grupo-frutas |
| Carne bovina peito (sem gordura, cozido) | taco | carnes | 1 | grupo-carnes |
| Peru (congelado, cru) | taco | carnes | 1 | grupo-carnes |
| Frango, coxa (sem pele, frito) | usda | carnes | 1 | grupo-carnes |
| Bisteca suína (só carne magra, frita) | usda | carnes | 1 | grupo-carnes |
| Carambola | ibge | frutas | 1 | grupo-frutas |
| Hadoque (cru) | usda | peixes | 1 | grupo-peixes |
| Mandioca (crua) | taco | feculentos | 1 | grupo-feculentos |
| Leite com sabor diet | ibge | laticinios | 4 | bebida-industrial |
| Queijo camembert | usda | laticinios | 3 | queijo |
| Farinha de milho | ibge | cereais | 1 | farinha-base |
| Fígado suino | ibge | carnes | 1 | grupo-carnes |
| Suco de morango | ibge | bebidas | 1 | suco-natural |
| Germe de trigo (USDA) | usda | cereais | 1 | farinha-base |
| Sopa de tomate (lata) | usda | pratos | 4 | sopa-lata-desidratada |
| Hambúrguer de carne 90% magra (grelhado) | usda | carnes | 1 | hamburguer-carne-usda |
| Abacaxi (polpa, congelada) | taco | frutas | 1 | grupo-frutas |
| Refrigerante de cola light | ibge | bebidas | 4 | bebida-industrial |
| Repolho branco (cru) | taco | verduras | 1 | grupo-verduras |
| Amendoim (torrado, salgado) | taco | leguminosas | 3 | oleaginosa-salgada |
| Chia | base | oleaginosas | 1 | grupo-oleaginosas |
| Faisão (cru) | usda | carnes | 1 | grupo-carnes |
| Morcilha | ibge | carnes | 4 | embutido |
| Farinha de centeio | usda | cereais | 2 | farinha-amido-culinario |
| Quibe (frito) | taco | fastfood | 4 | pizza-lanche-pronto |
| Óleo de girassol | taco | gorduras | 2 | gordura-oleo |
| Chocolate branco | usda | doces | 4 | bala-chocolate |
| Hambúrguer de carne 95% magra (grelhado) | usda | carnes | 1 | hamburguer-carne-usda |
| Bobó de camarão | ibge | pratos | 1 | prato-caseiro |
| Suco de melancia | base | bebidas | 1 | suco-natural |
| Macaúba (crua) | taco | frutas | 1 | grupo-frutas |
| Frango, asa (sem pele, assado) | usda | carnes | 1 | grupo-carnes |
| Feijão (cozido) | ibge | leguminosas | 1 | grupo-leguminosas |
| Arroz tipo 2 (cru) | taco | cereais | 1 | cereal-base |
| Abadejo filé (congelado, assado) | taco | peixes | 1 | grupo-peixes |
| Dourada de água doce fresca | taco | peixes | 1 | grupo-peixes |
| Coco da bahia (seco ou verde) | ibge | oleaginosas | 1 | fruta-seca |
| Ovo de galinha inteiro (cru) | taco | ovos | 1 | grupo-ovos |
| Farinha de mandioca (crua) | taco | cereais | 1 | farinha-base |
| Feijão soja (cozido) | ibge | leguminosas | 1 | grupo-leguminosas |
| Jaca (crua) | taco | frutas | 1 | grupo-frutas |
| Bisteca suína (grelhada) | usda | carnes | 1 | grupo-carnes |
| Frango à laranja (restaurante chinês) | usda | pratos | 1 | prato-caseiro |
| Pistache (torrada, com sal) | usda | oleaginosas | 3 | oleaginosa-salgada |
| Fruta pão | ibge | frutas | 1 | grupo-frutas |
| Misto quente | base | fastfood | 4 | pizza-lanche-pronto |
| Carne bovina capa de contra-filé (sem gordura, grelhada) | taco | carnes | 1 | grupo-carnes |
| Fígado suino (frito) | ibge | carnes | 1 | grupo-carnes |
| Garoupa (crua) | usda | peixes | 1 | grupo-peixes |
| Copa de porco defumada | ibge | carnes | 4 | embutido |
| Robalo listrado (assado) | usda | peixes | 1 | grupo-peixes |
| Aspargo em conserva | ibge | outros | 3 | conserva-vegetal-fruta |
| Mistura para bolo | taco | cereais | 4 | preparos-infantis-instantaneos |
| Cenoura | ibge | verduras | 1 | grupo-verduras |
| Marmelada | taco | doces | 3 | conserva-doce-fruta |
| Buriti | ibge | oleaginosas | 1 | grupo-oleaginosas |
| Queijo ricota light | ibge | laticinios | 3 | queijo |
| Paçoca | ibge | doces | 4 | bala-chocolate |
| Limão-siciliano (cru) | usda | frutas | 1 | grupo-frutas |
| Pão integral light | ibge | cereais | 4 | pao-de-forma-industrial |
| Blanquet de peru | ibge | carnes | 4 | embutido |
| Alfajores (biscoito) | ibge | doces | 4 | biscoito |
| Queijo ralado | ibge | laticinios | 3 | queijo |
| Hambúrguer de frango | ibge | carnes | 4 | carne-industrial |
| Queijo cottage (semidesnatado) | usda | laticinios | 3 | queijo |
| Manteiga com ou sem sal light | ibge | laticinios | 2 | gordura-oleo |
| Quebra quebra | ibge | cereais | 3 | biscoito-artesanal |
| Frango coxa (com pele, crua) | taco | carnes | 1 | grupo-carnes |
| Espinafre | usda | verduras | 1 | grupo-verduras |
| Arroz à grega | ibge | pratos | 1 | prato-caseiro |
| Atum branco em lata ao natural | usda | peixes | 3 | peixe-conserva-salga |
| Strogonoff de frango | base | pratos | 1 | prato-caseiro |
| Salmão do Atlântico (de cativeiro) (assado) | usda | peixes | 1 | grupo-peixes |
| Amendoim amanteigado diet | ibge | doces | 4 | doce-diet-light |
| Halibute (assado) | usda | peixes | 1 | grupo-peixes |
| Castanha de caju (assada) | ibge | oleaginosas | 1 | grupo-oleaginosas |
| Frango inteiro (cozido) | usda | carnes | 1 | grupo-carnes |
| Mostarda (verdura) (refogada) | ibge | verduras | 1 | grupo-verduras |
| Caju envasado (suco concentrado) | taco | frutas | 4 | bebida-industrial |
| Arenque do Atlântico (cru) | usda | peixes | 1 | grupo-peixes |
| Suco de limão | usda | bebidas | 1 | suco-natural |
| Bredo (cozido) | ibge | verduras | 1 | grupo-verduras |
| Pão aveia forma | taco | cereais | 4 | pao-de-forma-industrial |
| Folha de macaxeira (cozida) | ibge | verduras | 1 | grupo-verduras |
| Picles de pepino | usda | verduras | 3 | conserva-vegetal-fruta |
| Levedo de cerveja | ibge | bebidas | 1 | levedo-cevada |
| Farinha de arroz enriquecida | taco | cereais | 2 | farinha-amido-culinario |
| Chá gelado adoçado (preto) | usda | bebidas | 4 | bebida-industrial |
| Frango coração (grelhado) | taco | carnes | 1 | grupo-carnes |
| Sucrilhos de milho | ibge | cereais | 4 | cereal-matinal-barra |
| Mandioquinha salsa (batata baroa) (cozida) | ibge | feculentos | 1 | grupo-feculentos |
| Batata russet (crua) | usda | verduras | 1 | grupo-verduras |
| Polenta (pré-cozida) | taco | cereais | 1 | cereal-base |
| Creme de leite fresco (heavy cream) | usda | laticinios | 3 | creme-de-leite-nata |
| Ganso (assado) | usda | carnes | 1 | grupo-carnes |
| Lagosta (cozida) | usda | peixes | 1 | grupo-peixes |
| Couve refogada | base | verduras | 1 | grupo-verduras |
| Nachos com queijo | usda | fastfood | 4 | salgadinho-snack |
| Ovo de galinha inteiro (cozido) | taco | ovos | 1 | grupo-ovos |
| Doce de amendoim | ibge | doces | 4 | bala-chocolate |
| Flank steak (grelhado) | usda | carnes | 1 | grupo-carnes |
| Torta de noz-pecã | usda | doces | 4 | confeitaria |
| Arroz carreteiro | taco | pratos | 1 | prato-caseiro |
| Castanha de caju (torrada no óleo) | usda | oleaginosas | 3 | oleaginosa-salgada |
| Queijo de colonia | ibge | laticinios | 3 | queijo |
| Painço (milheto) (cozido) | usda | cereais | 1 | cereal-base |
| Broto de feijão (cozido) | ibge | leguminosas | 1 | grupo-leguminosas |
| Burger King sanduíche de peixe | usda | fastfood | 4 | pizza-lanche-pronto |
| Macarrão molho bolognesa | taco | pratos | 1 | prato-caseiro |
| Big Mac (McDonald's, USDA) | usda | fastfood | 4 | pizza-lanche-pronto |
| Iogurte grego com fruta (semidesnatado) | usda | laticinios | 4 | iogurte-com-sabor |
| Cheeseburger (fast food) | usda | fastfood | 4 | grupo-fastfood |
| Mussarela de bufala | ibge | laticinios | 3 | queijo |
| Toddynho | ibge | doces | 4 | bebida-industrial |
| Corimbatá (cru) | taco | peixes | 1 | grupo-peixes |
| Lagostim de água doce (cozido) | usda | peixes | 1 | grupo-peixes |
| Fato bovino (cozido) | ibge | carnes | 1 | grupo-carnes |
| Vinho tinto | base | bebidas | 3 | alcool-fermentado |
| Camarão Sete Barbas (sem cabeça, com casca, frito) | taco | peixes | 1 | grupo-peixes |
| Peixe de água doce (empanado) | ibge | peixes | 4 | empanado-industrial |
| Pastel de queijo (cru) | taco | fastfood | 4 | pizza-lanche-pronto |
| Quindim | taco | doces | 3 | confeitaria |
| Frango com açafrão | taco | pratos | 1 | prato-caseiro |
| Marisco (amêijoa) (cru) | usda | peixes | 1 | grupo-peixes |
| Corimbatá (cozido) | taco | peixes | 1 | grupo-peixes |
| Bacon cru | usda | carnes | 4 | embutido |
| Cuscuz marroquino (cozido) | usda | cereais | 1 | cereal-base |
| Germe de trigo | ibge | cereais | 1 | farinha-base |
| Espinafre (refogado) | ibge | verduras | 1 | grupo-verduras |
| Açafrão | ibge | verduras | 1 | grupo-verduras |
| Biscoito doce wafer recheado de morango | taco | cereais | 4 | biscoito |
| Pataua | ibge | oleaginosas | 1 | grupo-oleaginosas |
| Doce de leite cremoso | taco | doces | 4 | leite-condensado-doce-leite |
| Pipoca de panela (com óleo) | usda | cereais | 1 | pipoca-simples |
| Queijo cremoso | ibge | laticinios | 4 | queijo-ultra |
| Leite de soja (bebida) (sem açúcar) | usda | bebidas | 4 | bebida-industrial |
| Canjica branca (crua) | taco | cereais | 1 | cereal-base |
| Porco agridoce (restaurante chinês) | usda | pratos | 1 | prato-caseiro |
| Atum fresco (cru) | taco | peixes | 1 | grupo-peixes |
| Carne bovina picanha (sem gordura, grelhada) | taco | carnes | 1 | grupo-carnes |
| Molho francês (salada) | usda | gorduras | 4 | maionese-molhos-ultra |
| Farinha de coco | usda | cereais | 2 | farinha-amido-culinario |
| Coalhada | ibge | laticinios | 1 | iogurte-natural |
| Jiló (cru) | taco | verduras | 1 | grupo-verduras |
| Caju (polpa, congelada) | taco | frutas | 1 | grupo-frutas |
| Carne bovina contra-filé (com gordura, cru) | taco | carnes | 1 | grupo-carnes |
| Carne vegetal (frita) | ibge | cereais | 4 | proteina-texturizada |
| Pizza de queijo Pizza Hut (massa fina) | usda | fastfood | 4 | pizza-lanche-pronto |
| Quebra queixo | ibge | doces | 4 | bala-chocolate |
| Pão com ovo | ibge | pratos | 3 | pao-com-manteiga-ovo |
| Queijo mussarela light | ibge | laticinios | 3 | queijo |
| Hambúrguer de carne 93% magra (grelhado) | usda | carnes | 1 | hamburguer-carne-usda |
| Hambúrguer de carne 80% magra (grelhado) | usda | carnes | 1 | hamburguer-carne-usda |
| Queijo gouda | usda | laticinios | 3 | queijo |
| Queijo parmesão ralado | base | laticinios | 3 | queijo |
| Sururu (cozido) | ibge | peixes | 1 | grupo-peixes |
| Virado à paulista | taco | pratos | 1 | prato-caseiro |
| Croissant | ibge | cereais | 3 | pao |
| Chuchu (cozido) | taco | verduras | 1 | grupo-verduras |
| Maçã (seca) | usda | frutas | 1 | fruta-seca |
| Salsicha | base | carnes | 4 | embutido |
| Fato caprino (cozido) | ibge | carnes | 1 | grupo-carnes |
| Pimentão verde (cru) | taco | verduras | 1 | grupo-verduras |
| Farinha de rosca | taco | cereais | 3 | farinha-de-rosca |
| Miudo de galinha ou frango (frito) | ibge | carnes | 1 | grupo-carnes |
| Amendoim amanteigado | ibge | doces | 3 | oleaginosa-salgada |
| Língua bovina (cozida) | usda | carnes | 1 | grupo-carnes |
| Tutu | ibge | pratos | 1 | prato-caseiro |
| Açúcar refinado | taco | doces | 2 | acucar-mel |
| Pizza margherita | base | fastfood | 4 | pizza-lanche-pronto |
| Frango inteiro (assado) | usda | carnes | 1 | grupo-carnes |
| Caranguejo | usda | peixes | 1 | grupo-peixes |
| Caipirinha | ibge | bebidas | 4 | alcool-destilado |
| Pimentão amarelo (cru) | taco | verduras | 1 | grupo-verduras |
| Ricota (integral) | usda | laticinios | 3 | queijo |
| Filé mignon bovino (só carne magra, grelhado) | usda | carnes | 1 | grupo-carnes |
| Queijo de bufalo | ibge | laticinios | 3 | queijo |
| Baião de dois | ibge | pratos | 1 | prato-caseiro |
| Lambari (congelado, cru) | taco | peixes | 1 | grupo-peixes |
| Hambúrguer de carne 85% magra (grelhado) | usda | carnes | 1 | hamburguer-carne-usda |
| Ovo mexido (fast food) | usda | fastfood | 4 | grupo-fastfood |
| Amendoim achocolatado | ibge | doces | 4 | bebida-industrial |
| Glicose de milho | taco | doces | 2 | acucar-mel |
| Iogurte com sabor | usda | laticinios | 4 | iogurte-com-sabor |
| Macarrão de ovos (cozido) | usda | cereais | 1 | cereal-base |
| Limão | ibge | frutas | 1 | grupo-frutas |
| Barreado | taco | pratos | 1 | prato-caseiro |
| Subway sanduíche de bacon, alface e tomate | usda | fastfood | 4 | embutido |
| Vitela (só carne magra, crua) | usda | carnes | 1 | grupo-carnes |
| Pasta de amendoim | ibge | doces | 3 | pasta-oleaginosa |
| Couve | ibge | verduras | 1 | grupo-verduras |
| Barra de cereais salgada | ibge | doces | 4 | cereal-matinal-barra |
