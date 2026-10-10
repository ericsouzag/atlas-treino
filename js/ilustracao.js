// Ilustração de um exercício: fotos do free-exercise-db (posição inicial e final). Todo exercício do banco tem foto.
// Só se a imagem falhar ao carregar (rede/cache) aparece um ícone neutro, nunca uma figura como visual normal.
import { h, icone } from './ui.js';
import { ILUSTRACOES } from './ilustracoes-dados.js';
import { exPorId } from './exercises.js';

/** Fotos de um exercício (1 ou 2 arquivos em img/ex/) */
export const fotosDoExercicio = id => ILUSTRACOES[id] || [];
export const temFoto = id => fotosDoExercicio(id).length > 0;

/** tam: 'g' (cartão: início e fim lado a lado) | 'p' (miniatura: posição inicial) */
export function ilustracao(exId, tam = 'g') {
  const ex = exPorId(exId);
  const fotos = fotosDoExercicio(exId);
  const caixa = h('div', { class: `ilus ilus-${tam}`, role: 'img', 'aria-label': ex ? `Fotos do exercício ${ex.nome}: posição inicial e final` : 'Fotos do exercício' });
  const reserva = () => { caixa.classList.add('ilus-falha'); caixa.textContent = ''; caixa.appendChild(icone('halter', 28)); };
  if (!fotos.length) { reserva(); return caixa; }
  const usar = tam === 'p' ? fotos.slice(0, 1) : fotos;
  if (usar.length > 1) caixa.classList.add('ilus-dupla');
  let falhas = 0;
  usar.forEach((arq, i) => {
    const img = h('img', { src: `img/ex/${arq}`, alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => { if (++falhas >= usar.length) reserva(); else img.remove(); });
    caixa.appendChild(img);
  });
  return caixa;
}
