// Classificação NOVA: regras, cobertura do banco, agregação do dia, itens sem classe, dia vazio, dia misto, Meus alimentos e Open Food Facts.
import fs from 'node:fs';
import path from 'node:path';
import { teste, igual, perto, ok, fim } from './_t.mjs';
import { classificarNova } from '../js/nova-regras.js';
import { ALIMENTOS, alimentoPorId, aplicarCamada, buscarAlimentos } from '../js/foods.js';
import { classeNovaDoItem, resumoNova, arredondarPercentuais, percentuaisInteiros, resumoNovaPorDia, textoLeitura, GRUPOS_NOVA } from '../js/nova.js';
import { montarDocAlimento, alimentoDeDoc } from '../js/banco.js';
import { normalizarProduto } from '../js/off.js';

const raiz = path.resolve(import.meta.dirname, '..');

console.log('Regras');
teste('exemplos do Guia: in natura, ingredientes, processados e ultraprocessados', () => {
  const cl = (nome, grupo = 'outros', extra = {}) => classificarNova({ nome, grupo, fonte: 'taco', ...extra }).nova;
  igual(cl('Arroz branco (cozido)', 'cereais'), 1); igual(cl('Feijão carioca (cozido)', 'leguminosas'), 1);
  igual(cl('Banana prata (crua)', 'frutas'), 1); igual(cl('Ovo de galinha inteiro (cozido)', 'ovos'), 1);
  igual(cl('Carne bovina patinho (grelhado)', 'carnes'), 1); igual(cl('Leite de vaca integral', 'laticinios'), 1);
  igual(cl('Café (infusão 10%)', 'bebidas'), 1); igual(cl('Água', 'bebidas'), 1);
  igual(cl('Azeite de oliva extra virgem', 'gorduras'), 2); igual(cl('Açúcar refinado', 'doces'), 2);
  igual(cl('Sal grosso', 'outros'), 2); igual(cl('Manteiga (sem sal)', 'gorduras'), 2); igual(cl('Farinha de trigo', 'cereais'), 2);
  igual(cl('Pão francês', 'cereais'), 3); igual(cl('Queijo mussarela', 'laticinios'), 3); igual(cl('Palmito em conserva', 'verduras'), 3);
  igual(cl('Refrigerante tipo cola', 'bebidas', { ultra: true }), 4); igual(cl('Biscoito recheado', 'cereais', { ultra: true }), 4);
  igual(cl('Macarrão instantâneo', 'cereais', { ultra: true }), 4); igual(cl('Salsicha', 'carnes', { ultra: true }), 4);
  igual(cl('Presunto', 'carnes'), 4); igual(cl('Pizza de mussarela', 'fastfood'), 4); igual(cl('Salgadinho de milho', 'fastfood', { ultra: true }), 4);
});
teste('palavras que enganam não classificam errado (batata doce, caqui chocolate, nectarina, vinagreira, queijo em prato)', () => {
  const cl = (nome, grupo, extra = {}) => classificarNova({ nome, grupo, fonte: 'taco', ...extra }).nova;
  igual(cl('Batata doce (cozida)', 'feculentos', { ultra: true }), 1, 'a flag antiga errava aqui');
  igual(cl('Caqui chocolate (cru)', 'frutas'), 1); igual(cl('Nectarina', 'frutas'), 1); igual(cl('Vinagreira (cozida)', 'verduras'), 1);
  igual(cl('Maricota', 'frutas'), 1); igual(cl('Fruta pão (crua)', 'frutas'), 1);
  igual(cl('Farinha de mandioca (torrada)', 'cereais'), 1); igual(cl('Amêndoas (torrada)', 'oleaginosas'), 1);
  igual(cl('Cação posta (com farinha de trigo, frita)', 'peixes'), 1);
});
teste('classificação é determinística e nunca inventa: sem regra e sem flag fica null', () => {
  const a = classificarNova({ nome: 'Item misterioso xyz', grupo: 'cereais', fonte: 'ibge' });
  igual(a.nova, null); igual(a.regra, 'sem-regra');
  igual(classificarNova({ nome: 'Item misterioso xyz', grupo: 'cereais', fonte: 'ibge', ultra: true }).nova, 4);
  igual(JSON.stringify(classificarNova({ nome: 'Pão francês', grupo: 'cereais' })), JSON.stringify(classificarNova({ nome: 'Pão francês', grupo: 'cereais' })));
});

console.log('Cobertura do banco');
teste('todo alimento das camadas data/*.json e do embutido tem nova (1 a 4) gravada', () => {
  let n = 0;
  for (const c of ['taco', 'ibge', 'usda']) {
    const j = JSON.parse(fs.readFileSync(path.join(raiz, 'data', `${c}.json`), 'utf8'));
    for (const r of j.itens) { const m = /(^|;)n=([1-4])(;|$)/.exec(r[10] || ''); ok(m, `${r[0]} ${r[1]} sem n=`); n++; }
  }
  ok(n > 2000, 'esperava mais de 2000 itens, veio ' + n);
  for (const a of ALIMENTOS.filter(x => x.origem === 'base')) ok([1, 2, 3, 4].includes(a.nova), `${a.nome} sem nova no embutido`);
});
teste('as camadas carregadas trazem nova e o parser da flag n= funciona', () => {
  const j = JSON.parse(fs.readFileSync(path.join(raiz, 'data', 'taco.json'), 'utf8'));
  aplicarCamada(j);
  const arroz = ALIMENTOS.find(a => a.id.startsWith('taco-') && /^Arroz integral \(cozido\)/.test(a.nome));
  igual(arroz.nova, 1);
  const bolo = ALIMENTOS.find(a => /^Bolo pronto chocolate/.test(a.nome));
  igual(bolo.nova, 4);
  ok(ALIMENTOS.filter(a => a.origem === 'taco').every(a => [1, 2, 3, 4].includes(a.nova)), 'toda a TACO classificada');
});
teste('exemplos pedidos: ovo, banana, refrigerante, biscoito recheado, pizza, pão e presunto no banco real', () => {
  const por = q => buscarAlimentos(q, 1)[0];
  igual(por('refrigerante')?.nova, 4); igual(por('biscoito recheado')?.nova, 4); igual(por('presunto')?.nova, 4);
  igual(por('pizza de mussarela')?.nova, 4); igual(por('banana prata')?.nova, 1); igual(por('ovo cozido')?.nova, 1);
  igual(por('arroz branco cozido')?.nova, 1); igual(por('feijão carioca cozido')?.nova, 1); igual(por('pão francês')?.nova, 3);
});

console.log('Agregação do dia');
const banco = {
  arroz: { id: 'arroz', nova: 1 }, feijao: { id: 'feijao', nova: 1 }, azeite: { id: 'azeite', nova: 2 }, pao: { id: 'pao', nova: 3 },
  refri: { id: 'refri', nova: 4 }, biscoito: { id: 'biscoito', nova: 4 }, semnova: { id: 'semnova', nova: null },
};
const buscar = id => banco[id] || null;
const it = (alimentoId, kcal, gramas, nome = alimentoId, extra = {}) => ({ alimentoId, nome, kcal, gramas, ...extra });

teste('refeição vazia / dia sem registros', () => {
  const r = resumoNova([], { buscar });
  igual(r.kcalTotal, 0); igual(r.temDados, false); igual(r.grupos[4].pctKcal, 0);
  igual(textoLeitura(r), null);
  igual(resumoNova([{ itens: [] }], { buscar }).temDados, false);
  igual(resumoNova(undefined, { buscar }).temDados, false);
  igual(percentuaisInteiros(r)[1], 0);
});
teste('agrega kcal, gramas e % por grupo e junta o mesmo alimento repetido', () => {
  const r = resumoNova([
    { itens: [it('arroz', 130, 100), it('feijao', 76, 100)] },
    { itens: [it('arroz', 130, 100), it('refri', 140, 330), it('pao', 150, 50)] },
  ], { buscar });
  igual(r.kcalTotal, 626); igual(r.gramasTotal, 680);
  igual(r.grupos[1].kcal, 336); igual(r.grupos[1].itens.length, 2); igual(r.grupos[1].itens[0].nome, 'arroz'); igual(r.grupos[1].itens[0].kcal, 260); igual(r.grupos[1].itens[0].gramas, 200);
  perto(r.grupos[4].pctKcal, 100 * 140 / 626, 0.001); perto(r.grupos[3].pctGramas, 100 * 50 / 680, 0.001);
  perto([0, 1, 2, 3, 4].reduce((s, i) => s + r.grupos[i].pctKcal, 0), 100, 0.001);
});
teste('item sem match no banco (e sem classe guardada) vai para "sem classificação"; com classe guardada no item, usa ela', () => {
  const r = resumoNova([{ itens: [it('arroz', 100, 100), it('nao-existe', 100, 50, 'Coisa estranha'), it('semnova', 50, 50), it('apagado', 100, 100, 'Meu bolo', { nova: 4 })] }], { buscar });
  igual(r.grupos[0].kcal, 150); igual(r.grupos[0].itens.length, 2);
  igual(r.grupos[4].kcal, 100, 'a classe guardada no item vale quando o alimento saiu do banco');
  perto(r.pctSemClasse.kcal, 100 * 150 / 350, 0.001);
  igual(classeNovaDoItem({ alimentoId: 'nao-existe' }, buscar), 0); igual(classeNovaDoItem(null, buscar), 0);
  igual(classeNovaDoItem({ alimentoId: 'arroz', nova: 4 }, buscar), 1, 'o banco vale mais que a classe guardada');
});
teste('base "classificados" tira o sem classificação do denominador', () => {
  const dias = [{ itens: [it('arroz', 300, 200), it('refri', 100, 330), it('nao-existe', 600, 300)] }];
  const t = resumoNova(dias, { buscar });
  perto(t.grupos[4].pctKcal, 10, 0.001); perto(t.pctSemClasse.kcal, 60, 0.001);
  const c = resumoNova(dias, { buscar, base: 'classificados' });
  perto(c.grupos[4].pctKcal, 25, 0.001); perto(c.grupos[1].pctKcal, 75, 0.001); igual(c.grupos[0].pctKcal, 0); igual(c.grupos[0].kcal, 600, 'continua listado à parte');
  const p = percentuaisInteiros(c); igual(p[1] + p[2] + p[3] + p[4], 100); igual(p[0], 0);
});
teste('dia misto: arroz, feijão, ovo, banana, refrigerante, biscoito recheado, pizza, pão com presunto (banco real)', () => {
  const itens = [['arroz branco cozido', 150], ['feijão carioca cozido', 140], ['ovo cozido', 100], ['banana prata', 80], ['refrigerante', 350], ['biscoito recheado', 36], ['pizza de mussarela', 200], ['pão francês', 50], ['presunto', 30]]
    .map(([n, g]) => { const a = buscarAlimentos(n, 1)[0]; ok(a, 'faltou ' + n); return it(a.id, a.kcal * g / 100, g, n); });
  const r = resumoNova([{ itens }]);
  ok(r.grupos[4].kcal > 0 && r.grupos[1].kcal > 0 && r.grupos[3].kcal > 0, 'tem grupos 1, 3 e 4');
  const nomes4 = r.grupos[4].itens.map(i => i.nome);
  for (const n of ['refrigerante', 'biscoito recheado', 'pizza de mussarela', 'presunto']) ok(nomes4.includes(n), n + ' deveria ser ultraprocessado');
  const p = percentuaisInteiros(r); igual(p[0] + p[1] + p[2] + p[3] + p[4], 100);
  ok(p[4] > 30 && p[4] < 70, 'ultraprocessados na faixa esperada: ' + p[4]);
  const txt = textoLeitura(r, { quando: 'hoje' });
  ok(new RegExp(`^${p[4]}% das calorias de hoje vieram de ultraprocessados`).test(txt), txt);
  ok(/Guia/.test(txt) && /in natura/.test(txt));
});
teste('arredondarPercentuais soma 100 e lida com zeros', () => {
  igual(arredondarPercentuais([1, 1, 1]).reduce((s, v) => s + v, 0), 100);
  igual(arredondarPercentuais([33.3, 33.3, 33.4, 0]).join(), '33,33,34,0');
  igual(arredondarPercentuais([0, 0]).join(), '0,0'); igual(arredondarPercentuais([50, 50]).join(), '50,50');
});
teste('leitura em linguagem simples: nenhum ultra, sem classificação e mais de um terço', () => {
  const sem4 = resumoNova([{ itens: [it('arroz', 130, 100)] }], { buscar });
  ok(/^Nenhum ultraprocessado hoje;/.test(textoLeitura(sem4)));
  const muito = resumoNova([{ itens: [it('arroz', 100, 100), it('refri', 100, 330)] }], { buscar });
  ok(/50% das calorias de ontem vieram de ultraprocessados \(mais de um terço do dia\)/.test(textoLeitura(muito, { quando: 'ontem' })));
  ok(/neste dia/.test(textoLeitura(sem4, { quando: 'neste dia' })));
  const comSem = resumoNova([{ itens: [it('arroz', 50, 100), it('nao-existe', 50, 100)] }], { buscar });
  ok(/50% sem classificação\./.test(textoLeitura(comSem)));
  ok(/ficou de fora da conta/.test(textoLeitura(resumoNova([{ itens: [it('arroz', 50, 100), it('nao-existe', 50, 100)] }], { buscar, base: 'classificados' }))));
  ok(/do peso/.test(textoLeitura(muito, { metrica: 'gramas' })));
});
teste('resumo por dia (relatórios) ordena por data e ignora dias vazios', () => {
  const l = resumoNovaPorDia({ '2026-05-02': [{ itens: [it('refri', 100, 330)] }], '2026-05-01': [{ itens: [it('arroz', 100, 100), it('refri', 100, 330)] }], '2026-05-03': [{ itens: [] }] }, { buscar });
  igual(l.length, 2); igual(l[0].data, '2026-05-01'); igual(l[0].pct[4], 50); igual(l[1].pct[4], 100); igual(Math.round(l[0].pctUltra), 50);
});
teste('GRUPOS_NOVA tem os 4 grupos com nome e exemplos', () => { igual(GRUPOS_NOVA.map(g => g.id).join(), '1,2,3,4'); ok(GRUPOS_NOVA.every(g => g.nome && g.exemplos)); });

console.log('Meus alimentos e Open Food Facts');
teste('Meus alimentos: tipo NOVA opcional (padrão "Não sei" = sem classificação)', () => {
  const base = { nome: 'Pão da padaria', kcal: 280, p: 8, c: 55, g: 3 };
  const sem = montarDocAlimento(base); ok(!('nova' in sem), 'sem nova no documento'); igual(alimentoDeDoc({ ...sem, id: 'meu-1' }).nova, null);
  const com = montarDocAlimento({ ...base, nova: '3' }); igual(com.nova, 3); igual(alimentoDeDoc({ ...com, id: 'meu-2' }).nova, 3);
  igual(montarDocAlimento({ ...base, nova: '' }).nova, undefined); igual(montarDocAlimento({ ...base, nova: '9' }).nova, undefined);
  const ult = alimentoDeDoc({ ...montarDocAlimento({ ...base, nova: 4 }), id: 'meu-3' }); igual(ult.nova, 4); ok(ult.ultra, 'NOVA 4 acende a flag ultra antiga');
  ok(!alimentoDeDoc({ ...montarDocAlimento({ ...base, nova: 1 }), id: 'meu-4' }).ultra);
});
teste('Open Food Facts: usa nova_group do produto quando existe; senão sem classificação', () => {
  const prod = { code: '789', product_name: 'Biscoito X', nutriments: { 'energy-kcal_100g': 450, proteins_100g: 6, carbohydrates_100g: 70, fat_100g: 16 } };
  igual(normalizarProduto({ ...prod, nova_group: 4 }).nova, 4); igual(normalizarProduto({ ...prod, nova_group: '3' }).nova, 3);
  igual(normalizarProduto(prod).nova, null); igual(normalizarProduto({ ...prod, nova_group: 7 }).nova, null);
  const doc = montarDocAlimento({ tipo: 'off', nome: 'Biscoito X', codigo: '789', kcal: 450, p: 6, c: 70, g: 16, nova: normalizarProduto({ ...prod, nova_group: 4 }).nova });
  const a = alimentoDeDoc({ ...doc, id: 'off-789' }); igual(a.nova, 4); ok(a.ultra);
  const sem = alimentoDeDoc({ ...montarDocAlimento({ tipo: 'off', nome: 'Y', codigo: '1', kcal: 100, p: 1, c: 1, g: 1 }), id: 'off-1' });
  igual(sem.nova, null); ok(sem.ultra, 'produto sem NOVA mantém a flag antiga de industrializado');
});

fim();
