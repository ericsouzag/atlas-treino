// Ponto único de entrada para "traduzir" o que a pessoa comeu em calorias e macros.
// Nesta versão: banco local (parser em português), sem IA. O banco TACO é carregado sob demanda (arquivo
// local, em cache). A busca opcional no Open Food Facts só acontece quando a pessoa pede, na tela de confirmação.
//
// TODO(IA): para plugar uma IA (visão + texto) depois, troque o corpo de `estimarRefeicao` por uma
// chamada a um endpoint seu (ex.: Cloud Function que chama o modelo) e devolva o MESMO formato
// abaixo. A tela de confirmação já deixa a pessoa corrigir item/quantidade antes de salvar, então
// a IA só precisa sugerir. Mantenha `origem: 'ia'` e `fotoAnalisada: true` quando usar a foto.
//
// Formato de retorno:
//   { itens: [ { trecho, alimentoId|null, nome, quantidade, unidade, gramas, confianca, candidatos[] } ],
//     origem: 'local' | 'ia', fotoAnalisada: boolean, aviso: string }
import { interpretarRefeicao } from './parser.js';
import { garantirBanco } from './banco.js';

/**
 * @param {string} texto  texto livre em português ("2 ovos mexidos, 150g de arroz")
 * @param {Blob|File|null} foto  foto opcional (guardada pelo app, mas NÃO analisada nesta versão)
 */
export async function estimarRefeicao(texto, foto = null) {
  await garantirBanco();   // TACO + alimentos da pessoa (espera pouco; sem rede o app usa só o embutido)
  const itens = interpretarRefeicao(texto);
  return {
    itens,
    origem: 'local',
    fotoAnalisada: false,
    aviso: foto
      ? 'A foto foi anexada à refeição, mas não é analisada nesta versão: as calorias vêm do texto que você escreveu.'
      : '',
  };
}
