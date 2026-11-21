// Mede o contraste (WCAG 2.x) dos pares texto/fundo e UI/fundo dos tokens de css/app.css, nos temas escuro e claro.
// Uso: node tools/contraste.mjs   (sai com código 1 se algum par obrigatório ficar abaixo do mínimo)
import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync(path.resolve(import.meta.dirname, '../css/app.css'), 'utf8');
const bloco = (seletor) => { const i = css.indexOf(seletor + ' {'); if (i < 0) throw new Error('bloco ' + seletor); return css.slice(i, css.indexOf('}', i)); };
const tokens = txt => Object.fromEntries([...txt.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m => [m[1], m[2]]));
const escuro = tokens(bloco(':root')), claro = { ...escuro, ...tokens(bloco(':root[data-tema="claro"]')) };

const lin = c => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = h => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
export const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [rótulo, token do primeiro plano, token do fundo, mínimo]. 7 = AAA (texto de leitura), 4.5 = AA texto, 3 = UI/texto grande
const PARES = [
  ['Texto principal sobre a página', 'tinta', 'papel', 7], ['Texto principal sobre cartão', 'tinta', 'folha', 7], ['Texto principal sobre superfície', 'tinta', 'folha2', 7],
  ['Texto secundário ("mudo", rótulos) sobre página', 'tinta2', 'papel', 7], ['Texto secundário sobre cartão', 'tinta2', 'folha', 7], ['Texto secundário sobre superfície', 'tinta2', 'folha2', 7],
  ['Texto auxiliar (legendas, selo "estimado") sobre cartão', 'tinta3', 'folha', 4.5], ['Texto auxiliar sobre superfície', 'tinta3', 'folha2', 4.5], ['Texto auxiliar sobre página', 'tinta3', 'papel', 4.5],
  ['Link / rótulo de ação sobre cartão', 'destaque-esc', 'folha', 7], ['Texto do botão primário', 'on-destaque', 'destaque', 7],
  ['Alerta (laranja) como texto sobre cartão', 'alerta', 'folha', 4.5], ['Perigo como texto sobre cartão', 'perigo', 'folha', 4.5], ['OK como texto sobre cartão', 'ok', 'folha', 4.5],
  ['Borda de campo/botão (UI) sobre cartão', 'linha-forte', 'folha', 3], ['Borda de campo/botão (UI) sobre superfície', 'linha-forte', 'folha2', 3], ['Borda de campo sobre página', 'linha-forte', 'papel', 3],
  ['Ladrilho/ícone de ação (UI) sobre cartão', 'destaque-vivo', 'folha', 3],
  ['Grau NOVA 1 (UI) sobre cartão', 'nova1', 'folha', 3], ['Grau NOVA 2 (UI) sobre cartão', 'nova2', 'folha', 3], ['Grau NOVA 3 (UI) sobre cartão', 'nova3', 'folha', 3], ['Grau NOVA 4 (UI) sobre cartão', 'nova4', 'folha', 3],
  ['Texto sobre chave NOVA 1', 'nova-tx', 'nova1', 4.5], ['Texto sobre chave NOVA 2', 'nova-tx', 'nova2', 4.5], ['Texto sobre chave NOVA 3', 'nova-tx', 'nova3', 4.5], ['Texto sobre chave NOVA 4', 'nova-tx', 'nova4', 4.5],
  ['Proteína (texto de gráfico) sobre cartão', 'prot-t', 'folha', 3], ['Carboidrato (texto de gráfico) sobre cartão', 'carb-t', 'folha', 3], ['Gordura (texto de gráfico) sobre cartão', 'gord-t', 'folha', 3],
  ['Fibra (texto de gráfico) sobre cartão', 'fibra-t', 'folha', 3], ['Água (texto de gráfico) sobre cartão', 'agua-t', 'folha', 3],
];

let falhas = 0;
export function medir() {
  const linhas = [];
  for (const [nome, t] of [['escuro', escuro], ['claro', claro]]) for (const [rot, fg, bg, min] of PARES) {
    if (!t[fg] || !t[bg]) { linhas.push({ tema: nome, rot, erro: `token ausente ${fg}/${bg}` }); falhas++; continue; }
    const r = razao(t[fg], t[bg]); const passa = r >= min; if (!passa) falhas++;
    linhas.push({ tema: nome, rot, fg: t[fg], bg: t[bg], r: Math.round(r * 100) / 100, min, passa });
  }
  return linhas;
}
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('contraste.mjs')) {
  const l = medir();
  for (const x of l) console.log(`${x.passa ? 'ok   ' : 'FALHA'} [${x.tema}] ${x.rot}: ${x.r ?? '?'}:1 (mín ${x.min ?? '-'}) ${x.fg || ''} / ${x.bg || ''}${x.erro ? ' ' + x.erro : ''}`);
  console.log(falhas ? `\n${falhas} par(es) abaixo do mínimo` : '\nTodos os pares passam');
  process.exit(falhas ? 1 : 0);
}
