// Leitura de tabela nutricional a partir de texto de OCR (sintético, com os erros típicos). Funções puras de js/tabela-nutricional.js.
import { teste, igual, perto, ok, fim } from './_t.mjs';
import { interpretarTabela, lerPorcao, normalizarTexto, corrigirNumero, lerNum } from '../js/tabela-nutricional.js';

const v = (r, k) => r.por100[k];
const dupl = (r, k) => r.duvidosos.includes(k);

console.log('Utilitários');
teste('corrigirNumero / lerNum: O->0, l->1, milhar e vírgula decimal', () => {
  igual(corrigirNumero('7O'), '70'); igual(corrigirNumero('l2'), '12'); igual(corrigirNumero('8,l'), '8,1');
  igual(lerNum('1.596'), 1596); igual(lerNum('8,5'), 8.5); igual(lerNum('0,25'), 0.25);
});
teste('normalizarTexto: "kcal" mal lido e unidades coladas', () => {
  ok(/466 kcal/.test(normalizarTexto('466 kcai')), 'kcai'); ok(/90 kcal/.test(normalizarTexto('9O kca1')), 'kca1'); ok(/12 g/.test(normalizarTexto('12g')));
  ok(/150 kcal/.test(normalizarTexto('150 Kcal')));
});
teste('lerPorcao: g, ml, medida caseira, cabeçalho "30 g (1 porção)"', () => {
  let p = lerPorcao('Porção de 30 g (6 biscoitos)'); igual(p.g, 30); igual(p.liquido, false); igual(p.nome, '6 biscoitos');
  p = lerPorcao('Porcao: 200 ml (1 copo)'); igual(p.g, 200); igual(p.liquido, true); igual(p.nome, '1 copo');
  p = lerPorcao('100 g 30 g (1 porção) %VD*'); igual(p.g, 30);
  igual(lerPorcao('sem nada de porção aqui'), null);
});

console.log('\nTabelas brasileiras');
teste('1) biscoito: 100 g | porção | %VD (usa a coluna de 100 g)', () => {
  const r = interpretarTabela(`INFORMAÇÃO NUTRICIONAL
Porções por embalagem: 5  Porção: 30 g (6 biscoitos)
100 g   30 g   %VD*
Valor energético (kcal)  466  140  7
Carboidratos (g)  70  21  7
Açúcares totais (g)  21  6,3  -
Açúcares adicionados (g)  21  6,3  13
Proteínas (g)  7,1  2,1  4
Gorduras totais (g)  17  5,1  8
Gorduras saturadas (g)  8,3  2,5  11
Gorduras trans (g)  0  0  -
Fibra alimentar (g)  2,6  0,8  3
Sódio (mg)  480  144  7`);
  ok(r.ok); igual(r.origem, '100'); igual(v(r, 'kcal'), 466); igual(v(r, 'p'), 7.1); igual(v(r, 'c'), 70); igual(v(r, 'g'), 17); igual(v(r, 'f'), 2.6); igual(v(r, 'acucar'), 21);
  igual(r.porcao.g, 30); igual(r.extras.gSat, 8.3); igual(r.extras.sodioMg, 480); igual(r.coerente, true); igual(r.duvidosos.length, 0, r.duvidosos.join());
});
teste('2) iogurte: só por porção (170 g) -> converte para 100 g', () => {
  const r = interpretarTabela(`INFORMAÇÃO NUTRICIONAL
Porção de 170 g (1 pote)
Quantidade por porção   %VD(*)
Valor energético  112 kcal = 469 kJ  6%
Carboidratos  17 g  6%
Açúcares totais  15 g
Proteínas  5,4 g  7%
Gorduras totais  2,5 g  5%
Gorduras saturadas  1,6 g  7%
Gorduras trans  0 g
Fibra alimentar  0 g  0%
Sódio  68 mg  3%`);
  ok(r.ok); igual(r.origem, 'porcao'); perto(v(r, 'kcal'), 65.9, 0.1); perto(v(r, 'p'), 3.2, 0.1); perto(v(r, 'c'), 10, 0.1); perto(v(r, 'g'), 1.5, 0.1); perto(v(r, 'acucar'), 8.8, 0.1);
  ok(r.avisos.some(a => /convertidos para 100 g/.test(a)));
});
teste('3) hipercalórico (Creamass): 160 g por porção, sem coluna de 100 g', () => {
  const r = interpretarTabela(`Informação Nutricional
Porção de 160 g (4 dosadores)
Quantidade por porção   %VD*
Valor energético (kcal)  607  30
Carboidratos (g)  131  44
Açúcares totais (g)  24  -
Açúcares adicionados (g)  6,4  13
Proteínas (g)  15  30
Gorduras totais (g)  2,2  3
Gorduras saturadas (g)  1,2  6
Gorduras trans (g)  0  0
Fibras alimentares (g)  2  8
Sódio (mg)  204  10`);
  ok(r.ok); igual(r.origem, 'porcao'); igual(r.porcao.g, 160); perto(v(r, 'kcal'), 379.4, 0.2); perto(v(r, 'c'), 81.9, 0.1); perto(v(r, 'p'), 9.4, 0.1); perto(v(r, 'g'), 1.4, 0.1); perto(v(r, 'f'), 1.3, 0.1);
  igual(r.coerente, true);
});
teste('4) bebida em ml: 100 ml | porção 200 ml | %VD', () => {
  const r = interpretarTabela(`INFORMAÇÃO NUTRICIONAL
Porção de 200 ml (1 copo)
                100 ml   200 ml   %VD*
Valor energético (kcal)  42  84  4
Carboidratos (g)  10  20  7
Açúcares totais (g)  9,6  19  -
Proteínas (g)  0,5  1  1
Gorduras totais (g)  0  0  0
Fibra alimentar (g)  0,2  0,4  2
Sódio (mg)  6  12  1`);
  ok(r.ok); ok(r.liquido); igual(r.porcao.liquido, true); igual(v(r, 'kcal'), 42); igual(v(r, 'c'), 10); igual(v(r, 'p'), 0.5); igual(v(r, 'g'), 0); igual(r.origem, '100');
});
teste('5) erros de OCR: O no lugar de 0, l no lugar de 1, vírgula decimal', () => {
  const r = interpretarTabela(`Porção de 30 g (6 biscoitos)
100 g  30 g  %VD*
Valor energético (kcal)  466  14O  7
Carboidratos (g)  7O  21  7
Proteínas (g)  7,l  2,l  4
Gorduras totais (g)  l7  5,l  8
Fibra alimentar (g)  2,6  O,8  3`);
  igual(v(r, 'kcal'), 466); igual(v(r, 'c'), 70); igual(v(r, 'p'), 7.1); igual(v(r, 'g'), 17); igual(v(r, 'f'), 2.6); ok(r.ok);
});
teste('6) "kcal" mal lido (kcai, kca1) em tabela por porção', () => {
  let r = interpretarTabela(`Porção de 25 g (1 barra)
Valor energético  96 kcai = 402 kJ  5%
Carboidratos  16 g  5%
Proteínas  1,6 g  2%
Gorduras totais  3 g  5%`);
  perto(v(r, 'kcal'), 384, 0.2); ok(r.ok);
  r = interpretarTabela(`Porção de 25 g (1 barra)
Valor energético  96 kca1 = 402 kJ  5%
Carboidratos  16 g  5%
Proteínas  1,6 g  2%
Gorduras totais  3 g  5%`);
  perto(v(r, 'kcal'), 384, 0.2);
});
teste('7) "g" lido como 9 (solto depois do número) é aceito e o campo fica marcado como duvidoso', () => {
  const r = interpretarTabela(`Porção de 40 g (2 colheres de sopa)
Valor energético  152 kcal = 638 kJ  8%
Carboidratos  29 9  10%
Proteínas  3,6 9  5%
Gorduras totais  2,4 9  4%
Fibra alimentar  3,4 9  14%`);
  perto(v(r, 'c'), 72.5, 0.1); perto(v(r, 'p'), 9, 0.1); perto(v(r, 'g'), 6, 0.1); perto(v(r, 'f'), 8.5, 0.1); ok(dupl(r, 'c') && dupl(r, 'p'), 'marcado como duvidoso');
});
teste('8) whey: 30 g por porção, proteína alta (conversão por porção)', () => {
  const r = interpretarTabela(`Porção de 30 g (1 scoop)
Valor energético (kcal)  120  6
Carboidratos (g)  3  1
Proteínas (g)  24  32
Gorduras totais (g)  1,5  3
Sódio (mg)  95  4`);
  perto(v(r, 'kcal'), 400, 0.1); perto(v(r, 'p'), 80, 0.1); perto(v(r, 'c'), 10, 0.1); perto(v(r, 'g'), 5, 0.1); igual(r.porcao.nome, '1 scoop'); ok(r.coerente);
});
teste('9) tabela incoerente (kcal não bate com os macros) é sinalizada', () => {
  const r = interpretarTabela(`Porção de 30 g (6 biscoitos)
100 g  30 g  %VD*
Valor energético (kcal)  466  140  7
Carboidratos (g)  7  2  1
Proteínas (g)  7,1  2,1  4
Gorduras totais (g)  1,7  0,5  1`);
  igual(r.coerente, false); ok(dupl(r, 'kcal') && dupl(r, 'c')); ok(r.avisos.some(a => /não batem/.test(a)));
});
teste('10) só kJ no valor energético: converte e marca como duvidoso', () => {
  const r = interpretarTabela(`Porção de 100 g
Valor energético  1.596 kJ
Carboidratos  70 g
Proteínas  7,1 g
Gorduras totais  17 g`);
  perto(v(r, 'kcal'), 381, 1); ok(dupl(r, 'kcal'));
});
teste('11) rótulo numa linha e números na seguinte (quebra do OCR)', () => {
  const r = interpretarTabela(`Porção de 50 g (1 unidade)
Valor energético
240 kcal = 1.004 kJ  12%
Carboidratos
31 g  10%
Proteínas
6,5 g  9%
Gorduras totais
10 g  18%`);
  perto(v(r, 'kcal'), 480, 0.1); perto(v(r, 'c'), 62, 0.1); perto(v(r, 'p'), 13, 0.1); perto(v(r, 'g'), 20, 0.1);
});
teste('12) barras "|" como separador de colunas', () => {
  const r = interpretarTabela(`Porção de 30 g (3 torradas)
| | 100 g | 30 g | %VD* |
Valor energético (kcal) | 390 | 117 | 6 |
Carboidratos (g) | 72 | 22 | 7 |
Proteínas (g) | 11 | 3,3 | 4 |
Gorduras totais (g) | 6 | 1,8 | 3 |
Fibra alimentar (g) | 5 | 1,5 | 6 |`);
  igual(v(r, 'kcal'), 390); igual(v(r, 'c'), 72); igual(v(r, 'p'), 11); igual(v(r, 'g'), 6); igual(v(r, 'f'), 5); igual(r.origem, '100');
});
teste('13) sem cabeçalho de colunas: dois números por linha cuja razão bate com a porção = 100 g + porção', () => {
  const r = interpretarTabela(`Porção de 50 g
Valor energético (kcal)  350  175  9
Carboidratos (g)  60  30  10
Proteínas (g)  10  5  7
Gorduras totais (g)  8  4  7`);
  igual(r.origem, '100'); igual(v(r, 'kcal'), 350); igual(v(r, 'c'), 60);
});
teste('14) energia como "kcal/kJ" (150/630) e porção em ml', () => {
  const r = interpretarTabela(`Porção de 250 ml (1 caixinha)
Valor energético (kcal/kJ)  150/630
Carboidratos (g)  24
Proteínas (g)  8
Gorduras totais (g)  2,5`);
  ok(r.porcao.liquido); perto(v(r, 'kcal'), 60, 0.1); perto(v(r, 'c'), 9.6, 0.1);
});
teste('15) hipercalórico com 100 g, 120 g e %VD (alto em carboidrato)', () => {
  const r = interpretarTabela(`Informação Nutricional
Porção de 120 g (3 colheres de sopa)
100 g  120 g  %VD*
Valor energético (kcal)  384  461  23
Carboidratos (g)  76  91  30
Açúcares totais (g)  12  14  -
Proteínas (g)  14  17  34
Gorduras totais (g)  2,7  3,2  5
Fibras alimentares (g)  1,6  1,9  8`);
  igual(v(r, 'kcal'), 384); igual(v(r, 'c'), 76); igual(v(r, 'p'), 14); igual(v(r, 'g'), 2.7); igual(r.origem, '100'); igual(r.porcao.g, 120); igual(r.coerente, true);
});
teste('16) valores trocados entre colunas (porção maior que 100 g) marcam dúvida', () => {
  const r = interpretarTabela(`Porção de 30 g (6 biscoitos)
100 g  30 g  %VD*
Valor energético (kcal)  140  466  7
Carboidratos (g)  21  70  7
Proteínas (g)  2,1  7,1  4
Gorduras totais (g)  5,1  17  8`);
  ok(dupl(r, 'kcal') || dupl(r, 'c'), 'colunas invertidas devem ser sinalizadas');
});
teste('17) cereal com açúcar, recuos e %VD sem ponto', () => {
  const r = interpretarTabela(`Porção de 30 g (3/4 de xícara)
                         100 g    30 g    %VD
Valor energético (kcal)  376      113     6
Carboidratos (g)         84       25      8
  Açúcares totais (g)    32       9,6     -
Proteínas (g)            5,3      1,6     2
Gorduras totais (g)      0,9      0,3     0
Fibra alimentar (g)      3,3      1       4
Sódio (mg)               600      180     8`);
  igual(v(r, 'kcal'), 376); igual(v(r, 'acucar'), 32); igual(r.extras.sodioMg, 600); igual(r.porcao.nome, '3/4 de xicara', 'o texto do OCR é guardado sem acento');
});
teste('18) texto que não é tabela nutricional: não reconhece e avisa', () => {
  const r = interpretarTabela('Biscoito recheado sabor chocolate\nIngredientes: farinha de trigo, açúcar, gordura vegetal\nContém glúten');
  igual(r.ok, false); ok(r.avisos.length >= 1);
});
teste('19) texto vazio ou só ruído', () => {
  igual(interpretarTabela('').ok, false); igual(interpretarTabela('   \n  ').ok, false); igual(interpretarTabela('l1 ;; ~~ ||').ok, false);
});
teste('20) porção sem tamanho legível: não converte e pede o tamanho', () => {
  const r = interpretarTabela(`Quantidade por porção   %VD*
Valor energético  112 kcal  6%
Carboidratos  17 g  6%
Proteínas  5,4 g  7%
Gorduras totais  2,5 g  5%`);
  ok(r.avisos.some(a => /tamanho da porção/.test(a))); igual(r.origem, '');
});
fim();
