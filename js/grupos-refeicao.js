// Agrupa os lançamentos de um dia por tipo de refeição (só apresentação: nada é gravado nem alterado).
// Dois "cafés da manhã" lançados no mesmo dia viram UM grupo "Café da manhã" com os itens juntos.
// Função pura (testada em tests/grupos.test.mjs). Lançamento sem tipo ganha o tipo derivado do horário.
import { tipoRefeicaoPorHora, TIPOS_REFEICAO } from './nutrition.js';
import { normalizar } from './texto.js';

const horaDe = ts => (typeof ts === 'string' && /T\d\d:\d\d/.test(ts) ? ts.slice(11, 16) : '');

/** Tipo efetivo de um lançamento: o gravado (se houver) ou o derivado do horário; 'Outro' se nada serve */
export function tipoEfetivo(r) {
  const t = String(r?.tipo || '').trim();
  if (t) { const canon = TIPOS_REFEICAO.find(x => normalizar(x) === normalizar(t)); return canon || t; }
  const h = horaDe(r?.ts);
  return h ? tipoRefeicaoPorHora(+h.slice(0, 2) + +h.slice(3) / 60) : 'Outro';
}

/**
 * @param {object[]} refeicoes lançamentos de UM dia ({id, ts, tipo?, itens[]})
 * @returns {{chave:string, tipo:string, inicio:string, fim:string, refeicoes:object[], itens:object[], totais:{kcal:number,p:number,c:number,g:number}}[]}
 *   grupos ordenados pelo horário do primeiro lançamento; itens (com .ts, .hora, .refId) por horário do lançamento
 */
export function agruparRefeicoes(refeicoes) {
  const ordenadas = [...(refeicoes || [])].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  const grupos = new Map();
  for (const r of ordenadas) {
    const tipo = tipoEfetivo(r), chave = normalizar(tipo);
    let g = grupos.get(chave);
    if (!g) grupos.set(chave, g = { chave, tipo, inicio: horaDe(r.ts), fim: horaDe(r.ts), refeicoes: [], itens: [], totais: { kcal: 0, p: 0, c: 0, g: 0 } });
    g.refeicoes.push(r); g.fim = horaDe(r.ts) || g.fim;
    for (const it of r.itens || []) {
      g.itens.push({ ...it, ts: r.ts, hora: horaDe(r.ts), refId: r.id });
      g.totais.kcal += it.kcal || 0; g.totais.p += it.p || 0; g.totais.c += it.c || 0; g.totais.g += it.g || 0;
    }
  }
  return [...grupos.values()];
}

/** Texto da faixa de horário: "07:10" ou "07:10–07:45" */
export const faixaHorario = g => (g.inicio && g.fim && g.inicio !== g.fim ? `${g.inicio}–${g.fim}` : g.inicio || g.fim || '');
