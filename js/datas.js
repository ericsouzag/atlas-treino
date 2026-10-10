// Utilidades de data (sempre no fuso local; datas de dia = 'AAAA-MM-DD')
const p2 = n => String(n).padStart(2, '0');

export const dataISO = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const horaHM = (d = new Date()) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
export const paraData = iso => new Date(iso + 'T12:00:00');
export const somarDias = (iso, n) => { const d = paraData(iso); d.setDate(d.getDate() + n); return dataISO(d); };
export const diasEntre = (a, b) => Math.round((paraData(b) - paraData(a)) / 864e5);
/** ISO local de data+hora ("2026-10-09T14:30") para guardar em ts */
export const tsLocal = (dia, hm) => `${dia}T${hm}:00`;
export const diaDoTs = ts => ts.slice(0, 10);
export const horaDoTs = ts => ts.slice(11, 16);

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const nomeDia = (i, curto = false) => (curto ? DIAS_CURTO : DIAS)[i];
export const diaSemana = iso => paraData(iso).getDay();

/** "qui, 9 out" */
export function rotuloDia(iso, hoje = dataISO()) {
  if (iso === hoje) return 'Hoje';
  if (iso === somarDias(hoje, -1)) return 'Ontem';
  if (iso === somarDias(hoje, 1)) return 'Amanhã';
  const d = paraData(iso);
  return `${DIAS_CURTO[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}
export function dataCurta(iso) { const d = paraData(iso); return `${d.getDate()} ${MESES[d.getMonth()]}`; }
export function dataLonga(iso) { const d = paraData(iso); return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; }
export const segundaDaSemana = iso => { const d = diaSemana(iso); return somarDias(iso, d === 0 ? -6 : 1 - d); };
