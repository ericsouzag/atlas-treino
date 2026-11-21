// Contraste dos tokens (escuro e claro): pares texto/fundo e UI/fundo medidos por tools/contraste.mjs (WCAG 2.x).
import { teste, ok, igual, fim } from './_t.mjs';
import { medir, razao } from '../tools/contraste.mjs';

teste('razão de contraste: preto/branco = 21 e cinza igual = 1', () => { igual(Math.round(razao('#000000', '#FFFFFF')), 21); igual(razao('#777777', '#777777'), 1); });
const linhas = medir();
teste('todos os pares de tokens passam no mínimo (AAA 7:1 na leitura corrida, AA 4,5:1 no texto auxiliar, 3:1 em UI) nos dois temas', () => {
  const ruins = linhas.filter(l => !l.passa).map(l => `${l.tema}: ${l.rot} ${l.r}:1 < ${l.min}`);
  ok(ruins.length === 0, ruins.join(' | '));
  ok(linhas.length >= 50, 'pares medidos: ' + linhas.length);
});
teste('texto secundário de leitura ("mudo"/ajuda) usa tinta2 (AAA), não tinta3', () => {
  const t2 = linhas.filter(l => /Texto secundário sobre (cartão|superfície)/.test(l.rot));
  ok(t2.length === 4 && t2.every(l => l.r >= 7));
});
fim();
