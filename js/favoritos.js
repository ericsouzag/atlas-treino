// Favoritos: funções PURAS de edição (renomear, trocar/alterar/remover/adicionar item, totais, duplicar, ordenar, filtrar e migrar o
// formato antigo). Nada aqui grava no store nem mexe no DOM: as telas (views/favoritos.js, alimentacao.js) chamam e depois salvam.
//
// Um favorito é um conjunto de itens (uma refeição inteira OU um alimento só, com 1 item):
//   { id, nome, tipo, itens: [{ alimentoId, nome, gramas, kcal, p, c, g, f, acucar, ... }], origemId?, ordem?, _u }
// A coleção `favoritos` já sincroniza/exporta/mescla como as demais (tombstones incluídos); `ordem` e os demais campos novos viajam junto.
import { alimentoPorId, nutrientesPara } from './foods.js';
import { normalizar } from './texto.js';
import { tipoRefeicaoPorHora, TIPOS_REFEICAO, TIPOS_ANTIGOS } from './nutrition.js';

const num = x => (Number.isFinite(+x) ? +x : 0);
const arr1 = x => Math.round(num(x) * 10) / 10;

/** Item (do banco) com `gramas`, no formato dos itens de refeição. Sem alimento no banco, mantém o que veio. */
export function itemDeAlimento(alimento, gramas) {
  const n = nutrientesPara(alimento, gramas);
  return {
    alimentoId: alimento.id, nome: alimento.nome, gramas, grupo: alimento.grupo, liquido: !!alimento.liquido,
    kcal: n.kcal, p: n.p, c: n.c, g: n.g, f: n.f, acucar: n.acucar, ultra: !!alimento.ultra, bebidaAcucarada: !!alimento.bebidaAcucarada,
  };
}

/** Recalcula os nutrientes de um item pela quantidade (usa o banco se o alimento existir; senão escala proporcionalmente) */
export function recalcularItem(item, gramas = item.gramas, resolver = alimentoPorId) {
  const a = item.alimentoId ? resolver(item.alimentoId) : null;
  if (a) return { ...item, ...itemDeAlimento(a, gramas), unidadeTexto: item.unidadeTexto, quantidade: item.quantidade, gramas };
  const k = item.gramas > 0 ? gramas / item.gramas : 0;
  return { ...item, gramas, kcal: num(item.kcal) * k, p: num(item.p) * k, c: num(item.c) * k, g: num(item.g) * k, f: num(item.f) * k, acucar: num(item.acucar) * k };
}

/** Totais do favorito (kcal, P, C, G, fibra) somando os itens */
export function totaisFavorito(fav) {
  const t = { kcal: 0, p: 0, c: 0, g: 0, f: 0 };
  for (const i of (fav && fav.itens) || []) { t.kcal += num(i.kcal); t.p += num(i.p); t.c += num(i.c); t.g += num(i.g); t.f += num(i.f); }
  return t;
}

/** Texto curto com os itens e quantidades: "Ovo mexido 110 g, Banana 70 g" */
export function resumoComQuantidades(fav) {
  return ((fav && fav.itens) || []).map(i => `${i.nome} ${Math.round(num(i.gramas))} ${i.liquido ? 'ml' : 'g'}`).join(', ');
}

/** Nome sugerido quando o favorito não tem nome */
export const nomePadrao = itens => (itens || []).map(i => i.nome).join(', ').slice(0, 60) || 'Favorito';

/**
 * Formato antigo -> atual, sem perder nada: garante `itens` (lista), `nome` (texto), `tipo` (derivado da hora de criação se faltar)
 * e itens com números válidos. Idempotente e não muda o id nem os campos desconhecidos.
 */
export function migrarFavorito(f) {
  const itens = Array.isArray(f && f.itens) ? f.itens.map(i => ({ ...i, gramas: num(i.gramas), kcal: num(i.kcal), p: num(i.p), c: num(i.c), g: num(i.g), f: num(i.f) })) : [];
  const nome = String((f && f.nome) || '').trim() || nomePadrao(itens);
  let tipo = String((f && f.tipo) || '').trim();
  if (!tipo) {
    const d = f && f._u ? new Date(f._u) : null;
    tipo = d && !isNaN(d) ? tipoRefeicaoPorHora(d.getHours() + d.getMinutes() / 60) : 'Outro';
  }
  const canon = TIPOS_REFEICAO.find(x => normalizar(x) === normalizar(tipo)) || (TIPOS_ANTIGOS && TIPOS_ANTIGOS[normalizar(tipo)]);   // tipos antigos (Ceia, Lanche da tarde...) viram os atuais
  return { ...f, nome, tipo: canon || tipo, itens };
}

export const renomear = (fav, nome) => { const n = String(nome || '').trim().slice(0, 80); return n ? { ...fav, nome: n } : fav; };
export const definirTipo = (fav, tipo) => ({ ...fav, tipo: String(tipo || '').trim() || fav.tipo });
export const trocarItem = (fav, idx, novoItem) => ({ ...fav, itens: fav.itens.map((i, k) => (k === idx ? novoItem : i)) });
export const alterarQuantidade = (fav, idx, gramas, resolver = alimentoPorId) => (gramas > 0 ? { ...fav, itens: fav.itens.map((i, k) => (k === idx ? recalcularItem(i, gramas, resolver) : i)) } : fav);
export const removerItem = (fav, idx) => ({ ...fav, itens: fav.itens.filter((_, k) => k !== idx) });
export const adicionarItem = (fav, item) => ({ ...fav, itens: [...fav.itens, item] });

/** Cópia para "Duplicar": sem id (o store cria), sem vínculo com a refeição de origem, nome com " (cópia)" */
export function duplicar(fav) {
  const { id, origemId, _u, _d, ordem, ...resto } = fav;
  return { ...resto, nome: `${fav.nome} (cópia)`.slice(0, 80), itens: fav.itens.map(i => ({ ...i })) };
}

/** Favorito é válido para registrar/salvar? (tem nome e ao menos um item com quantidade) */
export const favoritoValido = fav => !!(fav && String(fav.nome || '').trim() && (fav.itens || []).some(i => num(i.gramas) > 0));

/** Ordem de exibição: campo `ordem` (menor primeiro) e, sem ele, o mais recente primeiro */
export function ordenarFavoritos(lista) {
  return [...lista].sort((a, b) => {
    const oa = a.ordem, ob = b.ordem;
    if (oa != null && ob != null && oa !== ob) return oa - ob;
    if (oa != null && ob == null) return -1;
    if (oa == null && ob != null) return 1;
    return (b._u || 0) - (a._u || 0);
  });
}

/**
 * Move um favorito uma posição. Retorna a lista de { id, ordem } a gravar (todos, para a ordem ficar estável),
 * ou [] se não der para mover (já está na ponta).
 */
export function moverFavorito(lista, id, direcao) {
  const o = ordenarFavoritos(lista), i = o.findIndex(f => f.id === id), j = i + (direcao < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= o.length) return [];
  [o[i], o[j]] = [o[j], o[i]];
  return o.map((f, k) => ({ id: f.id, ordem: k }));
}

/** Filtro de busca por nome, tipo ou item (sem acento nem caixa) */
export function filtrarFavoritos(lista, q) {
  const t = normalizar(q || '').trim();
  if (!t) return lista;
  return lista.filter(f => normalizar([f.nome, f.tipo, ...(f.itens || []).map(i => i.nome)].join(' ')).includes(t));
}

/** Favorito de UM alimento (estrela num alimento): 1 item na porção padrão ou na quantidade dada */
export function favoritoDeAlimento(alimento, gramas, tipo = 'Outro') {
  const item = itemDeAlimento(alimento, gramas);
  return { nome: alimento.nome.slice(0, 80), tipo, itens: [item] };
}

/** Item (do favorito) pronto para gravar numa refeição: cópia independente */
export const itensParaRegistro = fav => fav.itens.map(i => ({ ...i }));
export { arr1 };
