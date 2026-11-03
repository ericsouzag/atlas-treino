// Favoritos: funções puras de edição (renomear, trocar item, remover item, recalcular totais, duplicar, migração, ordem, filtro).
import { teste, igual, perto, ok, fim } from './_t.mjs';
import { alimentoPorId } from '../js/foods.js';
import {
  itemDeAlimento, recalcularItem, totaisFavorito, resumoComQuantidades, migrarFavorito, renomear, definirTipo, trocarItem, alterarQuantidade,
  removerItem, adicionarItem, duplicar, favoritoValido, ordenarFavoritos, moverFavorito, filtrarFavoritos, favoritoDeAlimento, nomePadrao,
} from '../js/favoritos.js';

const arroz = alimentoPorId('arroz-branco-cozido'), ovo = alimentoPorId('ovo-mexido'), granola = alimentoPorId('granola-sem-acucar-caseira');
const base = () => ({ id: 'f1', nome: 'Almoço de sempre', tipo: 'Almoço', origemId: 'r9', _u: 1000, itens: [itemDeAlimento(arroz, 150), itemDeAlimento(ovo, 110)] });

teste('itemDeAlimento e totaisFavorito somam kcal e macros dos itens', () => {
  const f = base(), t = totaisFavorito(f);
  perto(t.kcal, f.itens[0].kcal + f.itens[1].kcal, 0.001); ok(t.kcal > 300); ok(t.p > 5);
  igual(f.itens[0].alimentoId, arroz.id); igual(f.itens[0].gramas, 150);
  const vazio = totaisFavorito({ itens: [] }); igual(vazio.kcal, 0); igual(totaisFavorito(null).kcal, 0);
});
teste('renomear: aparado, limitado e ignora nome vazio', () => {
  igual(renomear(base(), '  Meu almoço  ').nome, 'Meu almoço'); igual(renomear(base(), '   ').nome, 'Almoço de sempre'); igual(renomear(base(), 'x'.repeat(200)).nome.length, 80);
  igual(base().nome, 'Almoço de sempre', 'não altera o original');
});
teste('definirTipo troca o tipo de refeição padrão', () => { igual(definirTipo(base(), 'Jantar').tipo, 'Jantar'); igual(definirTipo(base(), '').tipo, 'Almoço'); });
teste('trocarItem: troca o alimento mantendo os demais; totais acompanham', () => {
  const f = base(), g = trocarItem(f, 0, itemDeAlimento(granola, 40));
  igual(g.itens[0].alimentoId, granola.id); igual(g.itens[1].alimentoId, ovo.id); igual(g.itens.length, 2);
  ok(Math.abs(totaisFavorito(g).kcal - totaisFavorito(f).kcal) > 1); igual(f.itens[0].alimentoId, arroz.id);
});
teste('alterarQuantidade recalcula os nutrientes pelo banco (dobrar a quantidade dobra as kcal)', () => {
  const f = base(), g = alterarQuantidade(f, 0, 300);
  igual(g.itens[0].gramas, 300); perto(g.itens[0].kcal, f.itens[0].kcal * 2, 0.5); perto(g.itens[0].p, f.itens[0].p * 2, 0.1);
  igual(alterarQuantidade(f, 0, 0).itens[0].gramas, 150, 'quantidade inválida é ignorada');
});
teste('recalcularItem sem alimento no banco escala proporcionalmente', () => {
  const i = { alimentoId: 'sumiu-do-banco', nome: 'Antigo', gramas: 100, kcal: 200, p: 10, c: 20, g: 5, f: 2 };
  const r = recalcularItem(i, 50); igual(r.kcal, 100); igual(r.p, 5); igual(r.gramas, 50); igual(r.nome, 'Antigo');
});
teste('removerItem e adicionarItem', () => {
  const f = base(), g = removerItem(f, 0);
  igual(g.itens.length, 1); igual(g.itens[0].alimentoId, ovo.id); igual(f.itens.length, 2);
  const h = adicionarItem(g, itemDeAlimento(granola, 40)); igual(h.itens.length, 2); igual(h.itens[1].alimentoId, granola.id);
  igual(removerItem(removerItem(g, 0), 0).itens.length, 0);
});
teste('favoritoValido exige nome e ao menos um item com quantidade', () => {
  ok(favoritoValido(base())); ok(!favoritoValido(removerItem(removerItem(base(), 0), 0))); ok(!favoritoValido({ ...base(), nome: ' ' }));
  ok(!favoritoValido(alterarQuantidade({ ...base(), itens: [{ ...itemDeAlimento(arroz, 150), gramas: 0 }] }, 0, 0)));
});
teste('duplicar: sem id nem vínculo com a refeição de origem, nome com " (cópia)", itens independentes', () => {
  const f = base(), d = duplicar(f);
  ok(!('id' in d) && !('origemId' in d) && !('_u' in d)); igual(d.nome, 'Almoço de sempre (cópia)'); igual(d.tipo, 'Almoço'); igual(d.itens.length, 2);
  d.itens[0].gramas = 1; igual(f.itens[0].gramas, 150, 'a cópia não compartilha objetos');
});
teste('migrarFavorito: formato antigo (sem tipo/nome/itens parciais) vira o atual sem perder dados', () => {
  const antigo = { id: 'f0', origemId: 'r1', _u: new Date(2026, 9, 1, 7, 30).getTime(), itens: [{ nome: 'Pão', gramas: '50', kcal: '150', p: '4' }] };
  const m = migrarFavorito(antigo);
  igual(m.id, 'f0'); igual(m.origemId, 'r1'); igual(m.tipo, 'Café da manhã'); igual(m.nome, 'Pão'); igual(m.itens[0].gramas, 50); igual(m.itens[0].kcal, 150); igual(m.itens[0].c, 0);
  const sem = migrarFavorito({ id: 'f2' }); igual(sem.itens.length, 0); igual(sem.tipo, 'Outro'); igual(sem.nome, 'Favorito');
  igual(migrarFavorito({ ...base(), tipo: 'almoco' }).tipo, 'Almoço', 'tipo sem acento casa com o padrão');
  igual(migrarFavorito({ id: 'f3', nome: 'x', tipo: 'Ceia', itens: [] }).tipo, 'Lanchinho da madrugada', 'tipo antigo vira o atual');
  const dois = migrarFavorito(m); igual(JSON.stringify(dois), JSON.stringify(m), 'idempotente');
});
teste('ordenarFavoritos: por `ordem`, depois mais recente; moverFavorito troca vizinhos e respeita as pontas', () => {
  const l = [{ id: 'a', _u: 1 }, { id: 'b', _u: 3 }, { id: 'c', _u: 2 }];
  igual(ordenarFavoritos(l).map(f => f.id).join(), 'b,c,a');
  const up = moverFavorito(l, 'c', -1); igual(up.map(x => x.id).join(), 'c,b,a'); igual(up[0].ordem, 0);
  const aplicado = l.map(f => ({ ...f, ordem: up.find(x => x.id === f.id).ordem })); igual(ordenarFavoritos(aplicado).map(f => f.id).join(), 'c,b,a');
  igual(moverFavorito(l, 'b', -1).length, 0); igual(moverFavorito(l, 'a', 1).length, 0); igual(moverFavorito(l, 'zz', 1).length, 0);
  const novo = [...aplicado, { id: 'd', _u: 9 }]; igual(ordenarFavoritos(novo).map(f => f.id).join(), 'c,b,a,d', 'sem ordem vai depois dos ordenados');
});
teste('filtrarFavoritos: por nome, tipo e item, sem acento nem caixa', () => {
  const l = [base(), { id: 'f2', nome: 'Café reforçado', tipo: 'Café da manhã', itens: [itemDeAlimento(granola, 40)] }];
  igual(filtrarFavoritos(l, 'CAFE').length, 1); igual(filtrarFavoritos(l, 'arroz').length, 1); igual(filtrarFavoritos(l, 'granola')[0].id, 'f2'); igual(filtrarFavoritos(l, '').length, 2); igual(filtrarFavoritos(l, 'zzz').length, 0);
});
teste('favoritoDeAlimento: um alimento só vira favorito de 1 item; resumo com quantidades e nome padrão', () => {
  const f = favoritoDeAlimento(granola, 40, 'Café da manhã');
  igual(f.itens.length, 1); igual(f.nome, granola.nome); igual(f.tipo, 'Café da manhã'); igual(resumoComQuantidades(f), `${granola.nome} 40 g`);
  igual(nomePadrao(base().itens), `${arroz.nome}, ${ovo.nome}`.slice(0, 60));
});
fim();
