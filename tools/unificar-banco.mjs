// Unifica as fontes do banco de alimentos, descartando repetidos, e grava data/taco.json, data/ibge.json, data/usda.json
// e tools/relatorio-banco.md.
//
// Prioridade ao desduplicar:  TACO > IBGE > banco embutido (js/foods.js) > USDA.
// Mesmo alimento = nome equivalente (sem acento, plural, ordem das palavras, sinônimos pt-BR) E valores próximos
// (±15% de kcal, proteína e gordura coerentes). Fica UM registro, o da fonte de maior prioridade, que recebe os apelidos e
// as porções caseiras das outras. Preparos diferentes (cru, cozido, frito, grelhado, assado...) nunca se fundem.
//
// Pré-requisito: node tools/gerar-taco.mjs ; node tools/gerar-ibge.mjs ; node tools/gerar-usda.mjs
// Uso: node tools/unificar-banco.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ALIMENTOS as BASE } from '../js/foods.js';
import { N, arred, chaveNome, mesmoAlimento, flagsDe, formatarPorcoes, lerPorcoes, problemasNutri } from './lib-banco.mjs';

const raiz = path.resolve(import.meta.dirname, '..');
const lerJson = f => JSON.parse(fs.readFileSync(path.join(raiz, 'tools/fonte', f), 'utf8'));
const MAX_APELIDOS = 14;

// ---------------------------------------------------------------------------------------------
// 1) Normaliza as quatro fontes para o mesmo formato
function flagsDeTexto(fl = '') {
  const o = { liquido: false, ultra: false, bebAc: false, supl: false, acucar: 0 };
  for (const p of fl.split(';').filter(Boolean)) { if (p === 'l') o.liquido = true; else if (p === 'u') o.ultra = true; else if (p === 'b') o.bebAc = true; else if (p === 't') o.supl = true; else if (p.startsWith('a=')) o.acucar = parseFloat(p.slice(2)); }
  return o;
}
const tacoJ = lerJson('taco-itens.json');
const taco = tacoJ.itens.map(([id, nome, grupo, kcal, p, g0, g, f, porcoes, apelidos, flags]) => ({
  id: 'taco-' + id, nome, grupo, kcal, p, c: g0, g, f, porcoes: lerPorcoes(porcoes), apelidos: (apelidos || '').split(';').filter(Boolean), ...flagsDeTexto(flags), fonte: 'taco',
}));
const ibgeJ = lerJson('ibge-itens.json');
const ibge = ibgeJ.itens.map(i => ({ ...i, id: 'ibge-' + i.id, fonte: 'ibge' }));
const usdaJ = lerJson('usda-itens.json');
const usda = usdaJ.itens.map(i => ({ ...i, id: 'usda-' + i.id, fonte: 'usda' }));
const base = BASE.filter(a => a.origem === 'base').map(a => ({
  id: a.id, nome: a.nome, grupo: a.grupo, kcal: a.kcal, p: a.p, c: a.c, g: a.g, f: a.f, acucar: a.acucar || 0,
  porcoes: a.porcoes.map(x => ({ ...x })), apelidos: a.aliases.slice(1), liquido: a.liquido, ultra: a.ultra, bebAc: a.bebidaAcucarada, supl: a.suplemento, fonte: 'base',
}));
// apelidos extras que a TACO já distribuía para itens do banco embutido
for (const [id, ap] of Object.entries(tacoJ.meta.extras || {})) { const b = base.find(x => x.id === id); if (b) for (const a of ap) if (!b.apelidos.some(x => N(x) === N(a))) b.apelidos.push(a); }

for (const b of base) b.curados = new Set([N(b.nome), ...b.apelidos.map(N)]);   // apelidos escritos à mão no embutido: valem mais que os gerados
const entradas = { taco: taco.length, ibge: ibge.length, base: base.length, usda: usda.length };

// ---------------------------------------------------------------------------------------------
// 2) Valida cada candidato (sem valores inválidos)
const descartados = [];   // { id, nome, fonte, motivo }
const valido = lista => lista.filter(it => {
  for (const k of ['kcal', 'p', 'c', 'g', 'f']) it[k] = Number(it[k]);
  it.acucar = Number(it.acucar) || 0;
  const pr = problemasNutri(it);
  if (pr.length) { descartados.push({ id: it.id, nome: it.nome, fonte: it.fonte, motivo: 'inconsistente: ' + pr.join('; ') }); return false; }
  return true;
});
const filas = { taco: valido(taco), ibge: valido(ibge), base: valido(base), usda: valido(usda) };

// ---------------------------------------------------------------------------------------------
// 3) Desduplica por ordem de prioridade
const ORDEM = ['taco', 'ibge', 'base', 'usda'];
const dupTaco = new Set((tacoJ.meta.duplicadosNoBase || []).map(i => 'taco-' + i));
const aceitos = [];            // registros mantidos (ordem de entrada)
const indice = new Map();      // token -> registros
const nomes = new Map();       // nome normalizado -> registro
const fundidos = [];           // { de, para, deFonte, paraFonte }
const legado = {};             // id do banco embutido -> id do registro que o absorveu

const chaveItem = it => {
  const k = chaveNome(it.nome);
  return k;
};
function tokensDe(it) { const k = it._k || (it._k = chaveItem(it)); return k.nuc; }
function indexar(it) { for (const t of tokensDe(it)) { if (!indice.has(t)) indice.set(t, []); indice.get(t).push(it); } nomes.set(N(it.nome), it); }

function candidatosPara(x) {
  const vistos = new Set();
  const toks = new Set(tokensDe(x));
  for (const t of toks) for (const y of indice.get(t) || []) vistos.add(y);
  return [...vistos];
}

function mesclar(y, x) {
  // apelidos: nome do menos prioritário + apelidos dele
  const tem = new Set([N(y.nome), ...y.apelidos.map(N)]);
  for (const a of [x.nome, ...x.apelidos]) { const n = N(a); if (n && !tem.has(n)) { tem.add(n); y.apelidos.push(a); } }
  // porções: as caseiras do embutido (curadas) vêm primeiro; depois as do IBGE (pesquisa); depois as geradas
  const peso = it => ({ base: 0, ibge: 1, taco: 2, usda: 3 }[it.fonte]);
  const todas = [...(peso(x) < peso(y) ? x.porcoes.concat(y.porcoes) : y.porcoes.concat(x.porcoes))];
  const nomesP = new Set(), out = [];
  for (const p of todas) { const k = N(p.nome); if (nomesP.has(k)) continue; nomesP.add(k); out.push(p); }
  y.porcoes = out.slice(0, 8);
  y.liquido = y.liquido || x.liquido; y.ultra = y.ultra || x.ultra; y.bebAc = y.bebAc || x.bebAc; y.supl = y.supl || x.supl;
  if (!(y.acucar > 0) && x.acucar > 0) y.acucar = Math.min(x.acucar, y.c);
  if (x.fonte === 'base') { legado[x.id] = y.id; (y.curados ||= new Set()); for (const a of [x.nome, ...x.apelidos]) y.curados.add(N(a)); }
  (y.fundidos ||= []).push(x.id);
}

for (const fonte of ORDEM) {
  for (const x of filas[fonte]) {
    // dica: itens da TACO que a revisão manual (gerar-taco.mjs) apontou como já existentes no banco embutido casam também por apelido
    if (fonte === 'base') {
      let melhorH = null, dh = Infinity;
      for (const y of aceitos) {
        if (y.fonte !== 'taco' || !dupTaco.has(y.id) || y.jaTemBase) continue;
        if (!mesmoAlimento(y, x, { aliasB: [x.nome, ...x.apelidos] })) continue;
        const d = Math.abs(y.kcal - x.kcal);
        if (d < dh) { dh = d; melhorH = y; }
      }
      if (melhorH) { melhorH.jaTemBase = true; fundidos.push({ de: x, para: melhorH, dica: true }); mesclar(melhorH, x); continue; }
    }
    // dentro da TACO não se funde (ela já diferencia as variedades de propósito)
    const cand = candidatosPara(x).filter(y => !(fonte === 'taco' && y.fonte === 'taco'));
    let melhor = null, dm = Infinity;
    for (const y of cand) {
      if (fonte === 'usda' && y.fonte === 'usda') continue;   // a USDA já vem agrupada por nome completo (magra/com pele etc. são itens diferentes)
      if (!mesmoAlimento(y, x)) continue;
      const d = Math.abs(y.kcal - x.kcal);
      if (d < dm) { dm = d; melhor = y; }
    }
    if (melhor) { fundidos.push({ de: x, para: melhor }); mesclar(melhor, x); continue; }
    // mesmo nome com valores diferentes: vale a fonte de maior prioridade
    const igual = nomes.get(N(x.nome));
    if (igual && fonte === 'base') {
      // o embutido perde para o registro de maior prioridade com o mesmo nome: sai do banco em tempo de execução e herda apelidos/porções
      descartados.push({ id: x.id, nome: x.nome, fonte, motivo: `mesmo nome de ${igual.id} (${igual.fonte}) com valores diferentes (${x.kcal} vs ${igual.kcal} kcal); o registro de ${igual.fonte} prevalece e herda apelidos e porções` });
      mesclar(igual, x);
      continue;
    }
    if (igual && fonte !== 'taco') {
      descartados.push({ id: x.id, nome: x.nome, fonte, motivo: `mesmo nome de ${igual.id} (${igual.fonte}) com valores diferentes (${x.kcal} vs ${igual.kcal} kcal)` });
      continue;
    }
    if (igual) { x.nome = x.nome; }
    aceitos.push(x); indexar(x);
  }
}

// ---------------------------------------------------------------------------------------------
// 3b) Apelido curto para a variante preferida de cada alimento da USDA ("Salmão" -> salmão cozido... só para estados simples)
const RANK_EST = ['cozid', 'grelhad', 'assad', 'refogad', 'cru', 'frit', 'empanad'];
const cabeca = nome => nome.replace(/\s*\(.*$/, '').trim();
const rankDe = nome => { const m = nome.match(/\(([^)]*)\)\s*$/); if (!m) return -1; const i = RANK_EST.findIndex(r => m[1].split(', ').some(p => p.startsWith(r))); return i < 0 ? 99 : i; };
{
  const grupos = new Map();
  for (const it of aceitos.filter(i => i.fonte === 'usda')) { const h = cabeca(it.nome); if (h && h !== it.nome) (grupos.get(N(h)) || grupos.set(N(h), { h, v: [] }).get(N(h))).v.push(it); }
  for (const { h, v } of grupos.values()) {
    if (aceitos.some(a => N(a.nome) === N(h))) continue;
    v.sort((a, b) => rankDe(a.nome) - rankDe(b.nome) || (a.nome.length - b.nome.length));
    const melhorRank = rankDe(v[0].nome);
    if (melhorRank <= 4 && melhorRank !== 99) v[0].apelidos.push(h);
    else if (melhorRank === 99 && v.every(i => rankDe(i.nome) === 99)) v[0].apelidos.push(h);   // sem estado de preparo (ex.: bebida vegetal)
  }
}
// 3c) Cada apelido fica com UM dono: quem foi curado a mão (embutido fundido), senão a fonte de maior prioridade
const PRIO = { taco: 0, ibge: 1, base: 2, usda: 3 };
let apelidosRemovidos = 0;
{
  const donos = new Map();
  const add2 = (n, it, nome) => { if (!n) return; (donos.get(n) || donos.set(n, []).get(n)).push({ it, nome }); };
  for (const it of aceitos) { add2(N(it.nome), it, true); for (const a of it.apelidos) add2(N(a), it, false); }
  for (const [n, lista] of donos) {
    if (lista.length < 2) continue;
    const ordenada = [...lista].sort((x, y) => (y.it.curados?.has(n) ? 1 : 0) - (x.it.curados?.has(n) ? 1 : 0) || PRIO[x.it.fonte] - PRIO[y.it.fonte] || (y.nome ? 1 : 0) - (x.nome ? 1 : 0));
    const dono = ordenada[0];
    for (const h of lista) if (h.it !== dono.it && !h.nome) { const antes = h.it.apelidos.length; h.it.apelidos = h.it.apelidos.filter(a => N(a) !== n); apelidosRemovidos += antes - h.it.apelidos.length; }
  }
}

// ---------------------------------------------------------------------------------------------
// 4) Grava as camadas
const camadas = { taco: [], ibge: [], usda: [] };
const finais = { base: [] };
for (const it of aceitos) (camadas[it.fonte] || finais.base).push(it);

const linha = it => {
  const ap = []; const vistos = new Set([N(it.nome)]);
  for (const a of it.apelidos) { const n = N(a); if (n && !vistos.has(n)) { vistos.add(n); ap.push(a); } }
  return [it.id, it.nome, it.grupo, arred(it.kcal, 1), arred(it.p), arred(it.c), arred(it.g), arred(it.f), formatarPorcoes(it.porcoes), ap.slice(0, MAX_APELIDOS).join(';'), flagsDe(it)];
};
const META = {
  taco: { fonte: tacoJ.meta.fonte, licenca: tacoJ.meta.licenca, homepage: tacoJ.meta.homepage, nota: tacoJ.meta.base },
  ibge: { fonte: ibgeJ.meta.fonte, licenca: 'Dados públicos do IBGE; reprodução citando a fonte (IBGE, POF 2008-2009).', homepage: 'https://www.ibge.gov.br', nota: 'valores por 100 g/ml; porções caseiras da Tabela de Medidas Referidas do IBGE; nomes acentuados e preparos padronizados pelo Atlas Fitness' },
  usda: { fonte: usdaJ.meta.fonte, licenca: 'Domínio público (CC0 1.0 Universal); citar USDA FoodData Central.', homepage: 'https://fdc.nal.usda.gov', nota: 'nomes traduzidos para o português pelo Atlas Fitness; valores por 100 g/ml' },
};
const tamanhos = {};
for (const nome of ['taco', 'ibge', 'usda']) {
  const meta = { ...META[nome], campos: ['id', 'nome', 'grupo', 'kcal', 'proteina', 'carboidrato', 'gordura', 'fibra', 'porcoes', 'apelidos', 'flags'] };
  // ids do banco embutido que esta camada absorveu
  const leg = {}; for (const it of camadas[nome]) for (const f of it.fundidos || []) if (legado[f] === it.id) leg[f] = it.id;
  meta.legado = leg;
  if (nome === 'taco') meta.extras = tacoJ.meta.extras;
  const txt = JSON.stringify({ meta, itens: camadas[nome].map(linha) });
  fs.mkdirSync(path.join(raiz, 'data'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'data', `${nome}.json`), txt);
  tamanhos[nome] = Buffer.byteLength(txt);
}

// ---------------------------------------------------------------------------------------------
// 5) Relatório
const cont = (arr, f) => arr.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {});
const fundPar = cont(fundidos, f => `${f.de.fonte} -> ${f.para.fonte}`);
const nDicas = fundidos.filter(f => f.dica).length;
const descPorFonte = cont(descartados, d => d.fonte);
const baseSobra = finais.base.length;
const totalFinal = camadas.taco.length + camadas.ibge.length + camadas.usda.length + baseSobra;
const kb = n => (n / 1024).toFixed(0) + ' KB';
let md = `# Relatório do banco de alimentos

Gerado por \`node tools/unificar-banco.mjs\`. Prioridade ao desduplicar: **TACO > IBGE > banco embutido > USDA**.

## Contagem por fonte

| Fonte | Candidatos | Fundidos em outra | Descartados (inconsistência/nome) | Mantidos |
|---|---:|---:|---:|---:|
| TACO (4ª ed.) | ${entradas.taco} | ${fundidos.filter(f => f.de.fonte === 'taco').length} | ${descPorFonte.taco || 0} | ${camadas.taco.length} |
| IBGE (POF 2008-2009) | ${entradas.ibge} | ${fundidos.filter(f => f.de.fonte === 'ibge').length} | ${descPorFonte.ibge || 0} | ${camadas.ibge.length} |
| Embutido (js/foods.js) | ${entradas.base} | ${fundidos.filter(f => f.de.fonte === 'base').length} | ${descPorFonte.base || 0} | ${baseSobra} |
| USDA (FDC) | ${entradas.usda} | ${fundidos.filter(f => f.de.fonte === 'usda').length} | ${descPorFonte.usda || 0} | ${camadas.usda.length} |
| **Total** | ${entradas.taco + entradas.ibge + entradas.base + entradas.usda} | ${fundidos.length} | ${descartados.length} | **${totalFinal}** |

No app, o embutido (${entradas.base} itens) carrega junto com o código; ${Object.keys(legado).length} deles foram absorvidos por registros de maior prioridade (TACO/IBGE) e saem do banco quando a camada carrega.
${nDicas} das fusões embutido->TACO vieram da lista revisada à mão (itens da TACO marcados como já existentes no embutido, casando também por apelido). ${apelidosRemovidos} apelidos repetidos entre registros foram retirados (cada apelido tem um dono: o item curado à mão ou a fonte de maior prioridade).
Os candidatos da USDA já vêm filtrados por regras de seleção/tradução (tools/gerar-usda.mjs): de ~8 mil itens do FDC só entram os que têm tradução de qualidade.

## Fusões por par de fontes

${Object.entries(fundPar).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Arquivos (descompactados)

${['taco', 'ibge', 'usda'].map(n => `- data/${n}.json: ${camadas[n].length} itens, ${kb(tamanhos[n])}`).join('\n')}
- Total das camadas: ${kb(tamanhos.taco + tamanhos.ibge + tamanhos.usda)} (orçamento: 3 MB)

## Itens fundidos (amostra de cada par)

`;
for (const par of Object.keys(fundPar)) {
  md += `### ${par}\n\n`;
  const amostra = fundidos.filter(f => `${f.de.fonte} -> ${f.para.fonte}` === par);
  for (const f of amostra.slice(0, 60)) md += `- ${f.de.nome} (${f.de.id}, ${f.de.kcal} kcal) -> ${f.para.nome} (${f.para.id}, ${f.para.kcal} kcal)\n`;
  if (amostra.length > 60) md += `- ... e mais ${amostra.length - 60}\n`;
  md += '\n';
}
md += `## Descartados\n\n`;
const motivos = cont(descartados, d => d.motivo.startsWith('inconsistente') ? 'valores inconsistentes' : d.motivo.startsWith('mesmo nome') ? 'mesmo nome com valores diferentes de fonte de maior prioridade' : d.motivo);
md += Object.entries(motivos).map(([k, v]) => `- ${k}: ${v}`).join('\n') + '\n\n';
for (const d of descartados.slice(0, 120)) md += `- [${d.fonte}] ${d.nome} (${d.id}): ${d.motivo}\n`;
if (descartados.length > 120) md += `- ... e mais ${descartados.length - 120}\n`;
md += `\nExtras do gerador da USDA (sem energia/macros ou incoerentes): ${usdaJ.descartados?.length || 0}. Do gerador do IBGE: ${ibgeJ.meta.descartados?.length || 0}.\n`;
fs.writeFileSync(path.join(raiz, 'tools/relatorio-banco.md'), md);
console.log(`final: taco ${camadas.taco.length}, ibge ${camadas.ibge.length}, usda ${camadas.usda.length}, embutido restante ${baseSobra} => ${totalFinal}`);
console.log(`fundidos ${fundidos.length}:`, JSON.stringify(fundPar), `| descartados ${descartados.length} | legado ${Object.keys(legado).length}`);
console.log('tamanhos', Object.entries(tamanhos).map(([k, v]) => `${k} ${kb(v)}`).join(', '));
