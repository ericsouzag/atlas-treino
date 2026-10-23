// Gera tools/relatorio-nova.md: cobertura da classificação NOVA, itens para revisão e amostra aleatória (semente fixa).
// Chamado por tools/unificar-banco.mjs (que classifica os itens finais de cada camada e os sobreviventes do embutido).
import fs from 'node:fs';

const NOMES = { 1: '1 In natura / minimamente processado', 2: '2 Ingrediente culinário', 3: '3 Processado', 4: '4 Ultraprocessado', null: 'Sem classificação' };
const cont = (arr, f) => arr.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const pct = (n, t) => (t ? (100 * n / t).toFixed(1).replace('.', ',') + '%' : '–');

// gerador pseudoaleatório com semente (amostra reproduzível)
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** itens: [{ id, nome, grupo, fonte, ultra, nova, novaRegra, novaRevisar }] */
export function gerarRelatorioNova(itens, arquivo) {
  const total = itens.length;
  const porNova = cont(itens, i => i.nova ?? 'null');
  const linhaTab = (k) => `| ${NOMES[k]} | ${porNova[k] || 0} | ${pct(porNova[k] || 0, total)} |`;
  let md = `# Relatório de cobertura da classificação NOVA

Gerado por \`node tools/unificar-banco.mjs\` (regras em \`js/nova-regras.js\`, descrição em \`tools/regras-nova.md\`). É uma **estimativa por regras**: a classe real de um produto varia com a marca e o preparo.

## Cobertura geral (${total} alimentos: data/*.json + embutido restante)

| Grupo NOVA | Itens | % |
|---|---:|---:|
${[1, 2, 3, 4, 'null'].map(linhaTab).join('\n')}
| **Total** | ${total} | 100% |

### Por fonte

| Fonte | Itens | 1 | 2 | 3 | 4 | Sem classe |
|---|---:|---:|---:|---:|---:|---:|
`;
  for (const f of ['taco', 'ibge', 'base', 'usda']) {
    const l = itens.filter(i => i.fonte === f);
    const c = cont(l, i => i.nova ?? 'null');
    md += `| ${f} | ${l.length} | ${c[1] || 0} | ${c[2] || 0} | ${c[3] || 0} | ${c[4] || 0} | ${c.null || 0} |\n`;
  }
  md += `\n### Por categoria da fonte\n\n| Categoria | Itens | 1 | 2 | 3 | 4 | Sem classe |\n|---|---:|---:|---:|---:|---:|---:|\n`;
  const grupos = [...new Set(itens.map(i => i.grupo))].sort();
  for (const g of grupos) {
    const l = itens.filter(i => i.grupo === g);
    const c = cont(l, i => i.nova ?? 'null');
    md += `| ${g} | ${l.length} | ${c[1] || 0} | ${c[2] || 0} | ${c[3] || 0} | ${c[4] || 0} | ${c.null || 0} |\n`;
  }

  const porRegra = cont(itens, i => `${i.novaRegra} -> ${i.nova ?? 'sem'}`);
  md += `\n## Regras que mais classificaram\n\n| Regra -> grupo | Itens |\n|---|---:|\n`;
  for (const [k, v] of Object.entries(porRegra).sort((a, b) => b[1] - a[1])) md += `| ${k} | ${v} |\n`;

  const sem = itens.filter(i => i.nova == null);
  md += `\n## Sem classificação (${sem.length})\n\nNunca se inventa: itens sem regra ficam fora dos percentuais ou à parte no gráfico.\n\n`;
  md += sem.length ? sem.map(i => `- ${i.nome} (${i.id}, ${i.grupo})`).join('\n') + '\n' : '_Nenhum._\n';

  // divergências com a flag ultraprocessado herdada das fontes
  const flagNaoQuatro = itens.filter(i => i.ultra && i.nova !== 4);
  const quatroSemFlag = itens.filter(i => !i.ultra && i.nova === 4);
  md += `\n## Divergências com a flag \`ultra\` das fontes\n\nA flag antiga é uma dica imprecisa (ex.: "batata doce" marcada por conter "doce"). Ela só decide nos grupos ambíguos; nos naturais (frutas, verduras, feculentos, leguminosas, oleaginosas, ovos, peixes, carnes, pratos) a regra por nome/categoria prevalece.\n\n`;
  md += `### Flag ultra, mas NOVA diferente de 4 (${flagNaoQuatro.length})\n\n` + flagNaoQuatro.map(i => `- ${i.nome} -> ${i.nova ?? 'sem'} (${i.novaRegra})`).join('\n') + '\n';
  md += `\n### NOVA 4 sem a flag ultra (${quatroSemFlag.length})\n\n` + quatroSemFlag.map(i => `- ${i.nome} (${i.novaRegra})`).join('\n') + '\n';

  // itens limítrofes (regras com ressalva)
  const lim = itens.filter(i => i.novaRevisar);
  const porMotivo = new Map();
  for (const i of lim) { const k = `${i.novaRegra}: ${i.novaRevisar}`; if (!porMotivo.has(k)) porMotivo.set(k, []); porMotivo.get(k).push(i); }
  md += `\n## Itens limítrofes para revisão (${lim.length})\n\nCasos em que a classe depende de marca, preparo ou critério. Cada bloco é uma regra com ressalva.\n\n`;
  for (const [k, l] of [...porMotivo].sort((a, b) => b[1].length - a[1].length)) {
    md += `### ${k} (${l.length})\n\n${l.slice(0, 60).map(i => `${i.nome} [${i.nova}]`).join('; ')}${l.length > 60 ? `; ... e mais ${l.length - 60}` : ''}\n\n`;
  }

  // amostra aleatória reproduzível para revisão manual
  const rnd = mulberry32(20260123);
  const idx = itens.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const amostra = idx.slice(0, 200).map(i => itens[i]);
  md += `## Amostra aleatória de 200 itens (semente 20260123) para revisão manual\n\nRevisada à mão a cada mudança de regras; as correções feitas estão em \`tools/regras-nova.md\`, seção "Revisão por amostragem".\n\n| Alimento | Fonte | Categoria | NOVA | Regra |\n|---|---|---|---:|---|\n`;
  for (const i of amostra) md += `| ${i.nome.replace(/\|/g, '/')} | ${i.fonte} | ${i.grupo} | ${i.nova ?? '–'} | ${i.novaRegra} |\n`;
  fs.writeFileSync(arquivo, md);
  return { total, porNova, semClasse: sem.length, limitrofes: lim.length };
}
