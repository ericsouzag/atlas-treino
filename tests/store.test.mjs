import { teste, igual, ok, fim } from './_t.mjs';
import { store } from '../js/store.js';
import { montarItemRefeicao } from '../js/dados.js';

console.log('Store (camada de dados)');
teste('salvar, listar, remover com tombstone', () => {
  store._reset();
  const r = store.salvar('refeicoes', { ts: '2026-10-09T12:00:00', itens: [] });
  igual(store.listar('refeicoes').length, 1); ok(r.id && r._u);
  store.remover('refeicoes', r.id);
  igual(store.listar('refeicoes').length, 0);
  ok(store.bruto().refeicoes[r.id]._d, 'tombstone');
});
teste('singletons mesclam campos', () => {
  store._reset();
  store.salvarUnico('perfil', { sexo: 'M' }); store.salvarUnico('perfil', { altura: 180 });
  const p = store.obterUnico('perfil'); igual(p.sexo, 'M'); igual(p.altura, 180);
});
teste('exportar e importar (substituir e mesclar)', () => {
  store._reset();
  store.salvarUnico('perfil', { sexo: 'F' }); const a = store.salvar('corpo', { data: '2026-10-01', peso: 60 });
  const bk = store.exportar();
  store._reset(); igual(store.listar('corpo').length, 0);
  store.importar(bk, 'substituir'); igual(store.listar('corpo').length, 1); igual(store.obterUnico('perfil').sexo, 'F');
  store.salvar('corpo', { id: a.id, data: '2026-10-01', peso: 61 });          // alteração mais nova no aparelho
  store.importar(bk, 'mesclar'); igual(store.obter('corpo', a.id).peso, 61, 'mesclar mantém o mais recente');
});
teste('importar rejeita arquivo inválido', () => { let erro = false; try { store.importar({ foo: 1 }); } catch { erro = true; } ok(erro); });
teste('mesclar remoto: último que escreveu vence e tombstone propaga', () => {
  store._reset();
  const x = store.salvar('corpo', { id: 'c1', data: '2026-10-01', peso: 70 });
  store.mesclarRemoto('corpo', [{ id: 'c1', data: '2026-10-01', peso: 99, _u: x._u - 1000 }]);
  igual(store.obter('corpo', 'c1').peso, 70);
  store.mesclarRemoto('corpo', [{ id: 'c1', _d: true, _u: x._u + 1000 }]);
  igual(store.obter('corpo', 'c1'), null);
});
teste('apagarTudo zera tudo (LGPD)', () => { store.salvarUnico('perfil', { sexo: 'M' }); store.apagarTudo(); igual(store.listar('corpo').length, 0); igual(store.obterUnico('perfil'), null); });
teste('item de refeição guarda nutrientes calculados', () => {
  const i = montarItemRefeicao({ alimentoId: 'arroz-branco-cozido', gramas: 150 });
  ok(Math.abs(i.kcal - 192) < 1 && i.nome.toLowerCase().includes('arroz'));
});
fim();
