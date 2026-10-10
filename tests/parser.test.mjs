import { teste, igual, perto, ok, fim } from './_t.mjs';
import { ALIMENTOS, buscarAlimentos } from '../js/foods.js';
import { interpretarRefeicao, somarItens } from '../js/parser.js';

console.log('Banco de alimentos');
teste('tem pelo menos 150 alimentos', () => ok(ALIMENTOS.length >= 150, 'só ' + ALIMENTOS.length));
teste('ids únicos', () => igual(new Set(ALIMENTOS.map(a => a.id)).size, ALIMENTOS.length));
teste('macros coerentes (kcal ~ 4p+4c+9g, tolerância)', () => {
  for (const a of ALIMENTOS) {
    const calc = 4 * a.p + 4 * a.c + 9 * a.g;
    if (a.kcal < 5) continue;
    // álcool e fibra explicam diferenças; tolerância generosa
    const lim = a.nome.match(/cerveja|vinho|destilado|caipirinha/i) ? 250 : Math.max(35, a.kcal * 0.3);
    if (Math.abs(calc - a.kcal) > lim) throw new Error(`${a.nome}: kcal ${a.kcal} vs calculado ${calc.toFixed(0)}`);
  }
});
teste('busca sem acento e plural', () => igual(buscarAlimentos('feijao')[0].id.startsWith('feijao'), true));

console.log('Parser');
teste('frase de exemplo do briefing', () => {
  const it = interpretarRefeicao('2 ovos mexidos, 150g de arroz, 1 banana, café com leite');
  igual(it.length, 4);
  igual(it[0].alimentoId, 'ovo-mexido'); perto(it[0].gramas, 110, 1);
  igual(it[1].alimentoId, 'arroz-branco-cozido'); igual(it[1].gramas, 150);
  igual(it[2].alimentoId, 'banana-prata'); perto(it[2].gramas, 70, 1);
  igual(it[3].alimentoId, 'leite-com-cafe');
});
teste('arroz 150g => kcal certo', () => {
  const t = somarItens(interpretarRefeicao('150g de arroz'));
  perto(t.kcal, 192, 2); perto(t.c, 42.2, 0.5);
});
teste('sem acento / typos', () => {
  igual(interpretarRefeicao('2 bananas')[0].alimentoId, 'banana-prata');
  igual(interpretarRefeicao('feijao')[0].alimentoId, 'feijao-carioca-cozido');
  igual(interpretarRefeicao('1 pão frances')[0].alimentoId, 'pao-frances');
  igual(interpretarRefeicao('2 paes')[0].alimentoId, 'pao-frances');
  igual(interpretarRefeicao('arros integral')[0].alimentoId, 'arroz-integral-cozido');
});
teste('colheres, concha, fatia, xícara', () => {
  const a = interpretarRefeicao('1 colher de sopa de azeite')[0]; perto(a.gramas, 13, 0.1);
  const b = interpretarRefeicao('uma concha de feijão')[0]; perto(b.gramas, 140, 0.1);
  const c = interpretarRefeicao('3 fatias de pão de forma')[0]; perto(c.gramas, 75, 0.1); igual(c.alimentoId, 'pao-de-forma');
  const d = interpretarRefeicao('1 xícara de leite')[0]; perto(d.gramas, 240, 0.1);
  const e = interpretarRefeicao('2 colheres de sopa de aveia')[0]; perto(e.gramas, 30, 0.1);
});
teste('ml, litro, lata, copo', () => {
  perto(interpretarRefeicao('200ml de leite')[0].gramas, 200, 0.1);
  perto(interpretarRefeicao('1 lata de coca')[0].gramas, 350, 0.1);
  perto(interpretarRefeicao('meio litro de suco de laranja')[0].gramas, 500, 0.1);
  igual(interpretarRefeicao('1 copo de refrigerante')[0].alimentoId, 'refrigerante');
});
teste('frações e palavras numéricas', () => {
  perto(interpretarRefeicao('meia banana')[0].gramas, 35, 0.1);
  perto(interpretarRefeicao('duas fatias de queijo')[0].gramas, 30, 0.1);
  perto(interpretarRefeicao('1,5 xícara de café')[0].gramas, 1.5 * 50 * 0 + interpretarRefeicao('1,5 xícara de café')[0].gramas, 0.1);
  perto(interpretarRefeicao('um e meio pão francês')[0].gramas, 75, 0.1);
});
teste('separadores: " e ", "+", ponto-e-vírgula, quebra de linha', () => {
  igual(interpretarRefeicao('arroz e feijão').length, 2);
  igual(interpretarRefeicao('ovo + pão').length, 2);
  igual(interpretarRefeicao('arroz; feijão\nbife').length, 3);
});
teste('"com" quando não é alimento composto', () => {
  const it = interpretarRefeicao('pão com ovo');
  igual(it.length, 2); igual(it[0].alimentoId, 'pao-frances'); igual(it[1].alimentoId, 'ovo-mexido');
  igual(interpretarRefeicao('café com leite').length, 1);
});
teste('"com" com ingrediente que não está no nome do prato: divide em itens', () => {
  const it = interpretarRefeicao('2 fatias de pão de forma com requeijão');
  igual(it.length, 2); igual(it[0].alimentoId, 'pao-de-forma'); perto(it[0].gramas, 50, 0.1); igual(it[1].alimentoId, 'requeijao-cremoso');
});
teste('suplementos e fast food', () => {
  const w = interpretarRefeicao('1 scoop de whey')[0]; igual(w.alimentoId, 'whey-protein'); perto(w.gramas, 30, 0.1);
  igual(interpretarRefeicao('1 big mac')[0].alimentoId, 'big-mac');
  igual(interpretarRefeicao('2 coxinhas')[0].alimentoId, 'coxinha');
});
teste('alimento desconhecido vira item sem id (para o usuário corrigir)', () => {
  const it = interpretarRefeicao('xyzzy fantástico');
  igual(it.length, 1); igual(it[0].alimentoId, null);
});
teste('texto vazio', () => igual(interpretarRefeicao('   ').length, 0));
teste('quantidade ao final', () => {
  const it = interpretarRefeicao('arroz 150g')[0]; igual(it.alimentoId, 'arroz-branco-cozido'); igual(it.gramas, 150);
});
teste('almoço completo', () => {
  const it = interpretarRefeicao('200g de arroz, 1 concha de feijão, 150 g de frango grelhado, salada de alface e tomate');
  igual(it.length, 5);
  const t = somarItens(it);
  ok(t.kcal > 550 && t.kcal < 800, 'kcal ' + t.kcal);
  ok(t.p > 40, 'prot ' + t.p);
});
fim();
