// Aba Relatórios: previsão p-ratio, "quanto de magra/gordura", gráficos, platô e guias.
import { h, limpar, icone, campo, selecao, chips, n0, n1, n2, sinal, caixaAviso, vazio } from '../ui.js';
import { store } from '../store.js';
import { perfil as getPerfil, config, corpoOrdenado, metas, totaisPorDia, treinosConcluidos, pesoAtual } from '../dados.js';
import { analisarComposicao, resumoTreinos, detectarPlato } from '../composition.js';
import { graficoLinhas, graficoBarras, graficoResponsivo, legenda, tabelaDados } from '../charts.js';
import { dataISO, somarDias, segundaDaSemana, dataCurta, diasEntre, diaDoTs } from '../datas.js';
import { resumoNova, resumoNovaPorDia, percentuaisInteiros, GRUPOS_NOVA } from '../nova.js';
import { bancoCompletoPronto } from '../foods.js';
import { garantirBanco } from '../banco.js';
import { AVISO_NOVA } from './nova-card.js';
import { GUIAS, dicasContextuais, guiaPorId } from '../tips.js';
import { intervalos, alertasAlimentares } from '../nutrition.js';
import { nuvemConfigurada } from '../../firebase-config.js';
import { usuarioAtual as nuvemUsuario } from '../firebase.js';

const MEDIDAS = [['cintura', 'Cintura'], ['abdomen', 'Abdômen'], ['quadril', 'Quadril'], ['peito', 'Peito'], ['ombros', 'Ombros'], ['pescoco', 'Pescoço'], ['braco_d', 'Braço direito'], ['braco_e', 'Braço esquerdo'], ['coxa_d', 'Coxa direita'], ['coxa_e', 'Coxa esquerda'], ['panturrilha_d', 'Panturrilha direita'], ['panturrilha_e', 'Panturrilha esquerda']];
const ddmm = iso => `${+iso.slice(8)}/${+iso.slice(5, 7)}`;
let horizonte = 12, metrica = 'peso', medidaSel = 'cintura', janelaDias = 14, janelaNova = 7;

const cartao = (titulo, ...filhos) => h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, titulo), ...filhos);

export function renderizar(raiz, ctx) {
  ctx.faixa('Relatórios');
  const P = getPerfil();
  const hoje = dataISO();
  const corpo = corpoOrdenado();
  const treinos = treinosConcluidos();
  const totais = totaisPorDia(120, hoje);
  const m = metas();
  const atividades = store.listar('atividades');
  const A = analisarComposicao({ perfil: P, corpo, totaisPorDia: totais, treinos, atividades, hoje });
  const redesenhar = () => ctx.redesenhar();
  const secoes = [];

  // ------------------------------------------------ 1. situação atual
  const bl = [];
  bl.push(h('p', { class: 'mudo' }, 'Tudo aqui é estimativa: modelo p-ratio + suas medidas. Quanto mais regular o registro, mais confiável.'));
  if (A.observado) {
    const o = A.observado;
    const cx = (rot, v) => h('div', { class: 'stat' }, h('span', { class: 'r' }, rot), h('span', { class: 'v', style: rot === 'Gordura' ? { color: v < 0 ? 'var(--ok)' : v > 0 ? 'var(--alerta)' : '' } : rot === 'Massa magra' ? { color: v > 0 ? 'var(--ok)' : v < 0 ? 'var(--alerta)' : '' } : {} }, `${sinal(v, 1)} kg`));
    bl.push(h('div', { class: 'stats' }, cx('Peso', o.dPeso), cx('Gordura', o.dGordura), cx('Massa magra', o.dMagra)));
    bl.push(h('p', null, `${dataCurta(o.de)} a ${dataCurta(o.ate)} (${o.dias} dias). `, h('span', { class: 'estimativa' }, o.medido ? 'a partir dos seus %G medidos' : 'dividido pelo modelo p-ratio')));
    if (!o.medido) bl.push(caixaAviso('info', null, 'Você só tem um registro de % de gordura, então a divisão entre gordura e massa magra vem do modelo. Faça uma nova medição de gordura (mesmo método) para ver o valor medido.'));
    if (o.dPeso < -0.3 && o.dMagra > -0.3 && o.dGordura < 0) bl.push(caixaAviso('ok', 'Bom sinal', 'Você está perdendo gordura sem perder massa magra relevante.'));
    if (Math.abs(o.dPeso) < 0.8 && o.dGordura < -0.5 && o.dMagra > 0.3) bl.push(caixaAviso('ok', 'Recomposição em andamento', 'O peso quase não mudou, mas a gordura caiu e a massa magra subiu. É por isso que a balança sozinha engana.'));
  } else {
    bl.push(vazio('Para ver quanto de gordura e massa magra você ganhou ou perdeu', ['Registre seu peso e % de gordura na aba Corpo em pelo menos 2 datas.', 'Use sempre o mesmo método de medir o % de gordura.']));
  }
  if (A.tendencia.ok) {
    const t = A.tendencia;
    bl.push(h('p', null, h('strong', null, 'Tendência do peso (últimas 3 semanas): '), `${sinal(t.kgPorSemana, 2)} kg por semana.`));
  }
  if (A.balanco) {
    bl.push(h('p', null, h('strong', null, 'Balanço de energia (média de 14 dias): '), `${n0(A.balanco.ingestao)} kcal comidas − ${n0(A.balanco.gasto)} kcal gastas = `, h('strong', null, `${sinal(A.balanco.saldo, 0)} kcal/dia`), '.'));
  }
  if (A.plato.plato) bl.push(caixaAviso('medio', 'Possível platô', `Seu peso ficou praticamente estável por ${A.plato.dias} dias (${sinal(A.plato.kgPorSemana, 2)} kg/sem). Antes de cortar mais calorias: confira se está registrando tudo (molhos, óleos, bebidas), durma bem e dê mais 1 a 2 semanas, porque o peso oscila com água. Se continuar parado, ajuste a meta em 100 a 150 kcal ou some uma caminhada diária.`));
  A.avisos.forEach(a => bl.push(caixaAviso('medio', null, a)));
  secoes.push(cartao('Quanto você está ganhando ou perdendo', ...bl));

  // ------------------------------------------------ 2. previsão
  const prev = [];
  if (A.projecao) {
    const pr = A.projecao;
    const serieDe = k => pr.serie.map(p => ({ x: p.semana, y: k === 'pct' ? p.pct : p[k] }));
    const dados = [...pr.serieBaixa, pr.serie];
    const banda = pr.serie.map((_, i) => { const v = dados.map(s => s[i][metrica === 'peso' ? 'peso' : metrica === 'gordura' ? 'gordura' : metrica === 'magra' ? 'magra' : 'pct']); return { x: i, lo: Math.min(...v), hi: Math.max(...v) }; }).filter(b => b.x <= horizonte);
    const chave = metrica;
    const cls = { peso: 'ch-peso', gordura: 'ch-gordura', magra: 'ch-magra', pct: 'ch-gordura' }[chave];
    const rotulos = { peso: 'Peso (kg)', gordura: 'Massa gorda (kg)', magra: 'Massa magra (kg)', pct: '% de gordura' };
    const nomeSerie = rotulos[chave];
    prev.push(h('div', { class: 'chips' }, [['peso', 'Peso'], ['gordura', 'Gordura'], ['magra', 'Massa magra'], ['pct', '% gordura']].map(([v, r]) => h('button', { class: `chip ${metrica === v ? 'ativo' : ''}`, type: 'button', onclick: () => { metrica = v; redesenhar(); } }, r))));
    prev.push(h('div', { class: 'chips', role: 'group', 'aria-label': 'Horizonte' }, [4, 8, 12].map(n => h('button', { class: `chip ${horizonte === n ? 'ativo' : ''}`, type: 'button', 'aria-pressed': String(horizonte === n), onclick: () => { horizonte = n; redesenhar(); } }, `${n} semanas`))));
    const cx = h('div');
    graficoResponsivo(cx, w => graficoLinhas({ largura: w, altura: 220, titulo: `Projeção de ${nomeSerie} em ${horizonte} semanas, com faixa de incerteza`, xTipo: 'num', rotuloXNum: v => v === 0 ? 'hoje' : `${Math.round(v)} sem`, formatoY: v => n1(v),
      series: [{ nome: nomeSerie, classe: cls, pts: serieDe(chave).filter(p => p.x <= horizonte), tracejado: false, pontos: false }], banda: { pts: banda, classe: '' } }));
    prev.push(cx, legenda([{ nome: nomeSerie + ': estimativa central', classe: cls }, { nome: 'faixa de incerteza', classe: 'ch-banda-l' }]));
    prev.push(h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'tab-proj' }, h('thead', null, h('tr', null, ['Em', 'Peso', 'Gordura', 'Massa magra'].map(c => h('th', { scope: 'col' }, c)))),
      h('tbody', null, [4, 8, 12].map(n => { const r = pr.porHorizonte[n]; const f = (v) => n1(v); const rg = a => `${f(a[0])} a ${f(a[1])}`;
        return h('tr', null, h('td', null, `${n} sem`), h('td', null, h('div', null, `${f(r.central.peso)} kg`), h('small', { class: 'mudo' }, rg(r.peso) + ' kg')), h('td', null, h('div', null, `${f(r.central.gordura)} kg · ${f(r.central.pct)}%`), h('small', { class: 'mudo' }, rg(r.gordura) + ' kg')), h('td', null, h('div', null, `${f(r.central.magra)} kg`), h('small', { class: 'mudo' }, rg(r.magra) + ' kg')));
      })))));
    const pp = pr.p;
    prev.push(h('div', { class: 'cartao', style: { background: 'var(--folha2)' } }, h('h3', null, 'Como ler esta previsão'),
      h('div', { class: 'pilha', style: { gap: '8px', marginTop: '8px', color: 'var(--tinta2)' } },
        h('p', null, `Seus últimos 14 dias mostram ${n0(A.ingestao.kcal)} kcal por dia comidas (${A.ingestao.dias} dias registrados) contra ${n0(A.balanco.gasto)} gastas (inclui ${n0(A.treino.treinoKcalDia)} kcal/dia de treinos). Esse saldo é o que move o ponteiro da balança.`),
        A.calibrado ? h('p', null, h('strong', null, 'Calibrado com a balança: '), `o saldo registrado (${sinal(A.calibrado.saldoRegistrado, 0)} kcal/dia) e o que seu peso indica (${sinal(A.calibrado.saldoObservado, 0)} kcal/dia) diferem. Como é comum registrar menos do que se come, a previsão usa a média dos dois (${sinal(A.calibrado.saldoUsado, 0)} kcal/dia).`) : null,
        h('p', null, `Quando o peso muda, uma parte é massa magra e outra é gordura. O ${'p-ratio'} diz que fração é massa magra: hoje o modelo estima ${n0(pp.p * 100)}% ${pp.tipo === 'deficit' ? 'da perda' : pp.tipo === 'superavit' ? 'do ganho' : 'da variação'}. Ele melhora com treino de força regular (seu estímulo: ${n0(pr.treino * 100)}%) e proteína alta (adequação: ${n0(pr.proteina * 100)}%), e piora com déficits muito agressivos.`),
        h('p', null, 'A faixa sombreada cobre erros comuns: registrar 10% a menos ou a mais do que come e variações do p-ratio. Ganho de massa magra tem teto biológico, por isso o modelo manda o excesso de energia para a gordura.'))));
  } else {
    prev.push(vazio('Para liberar a previsão de 4, 8 e 12 semanas', A.faltando.length ? A.faltando : ['Registre refeições, peso e % de gordura.']));
  }
  prev.push(h('span', { class: 'estimativa' }, 'Estimativa, não diagnóstico. Não substitui avaliação profissional.'));
  secoes.push(cartao('Previsão de composição corporal', ...prev));

  // ------------------------------------------------ 3. gráficos corporais
  const comPeso = corpo.filter(r => r.peso != null), comG = corpo.filter(r => r.gordura != null && r.peso != null);
  const gPeso = comPeso.length >= 2 ? (() => {
    const cx = h('div'); graficoResponsivo(cx, w => graficoLinhas({ largura: w, titulo: 'Peso ao longo do tempo', formatoY: v => n1(v), series: [{ nome: 'Peso', classe: 'ch-peso', pts: comPeso.map(r => ({ x: r.data, y: r.peso })) }] }));
    return [cx, tabelaDados('Peso', ['Data', 'Peso (kg)'], comPeso.map(r => [dataCurta(r.data), n1(r.peso)]))];
  })() : [vazio('Gráfico de peso', ['Registre o peso em pelo menos 2 datas na aba Corpo.'])];
  secoes.push(cartao('Peso', ...gPeso));

  const gGord = comG.length >= 2 ? (() => {
    const cx = h('div'); graficoResponsivo(cx, w => graficoLinhas({ largura: w, titulo: '% de gordura ao longo do tempo', formatoY: v => n1(v) + '%', series: [{ nome: '% de gordura', classe: 'ch-gordura', pts: comG.map(r => ({ x: r.data, y: r.gordura })) }] }));
    const cx2 = h('div'); graficoResponsivo(cx2, w => graficoLinhas({ largura: w, titulo: 'Massa magra e massa gorda em kg', formatoY: v => n1(v), series: [
      { nome: 'Massa magra', classe: 'ch-magra', pts: comG.map(r => ({ x: r.data, y: r.peso * (1 - r.gordura / 100) })) },
      { nome: 'Massa gorda', classe: 'ch-gordura', pts: comG.map(r => ({ x: r.data, y: r.peso * r.gordura / 100 })) }] }));
    return [cx, h('h3', null, 'Massa magra x massa gorda'), cx2, legenda([{ nome: 'Massa magra', classe: 'ch-magra' }, { nome: 'Massa gorda', classe: 'ch-gordura' }]),
      tabelaDados('Composição', ['Data', '% gordura', 'Magra (kg)', 'Gorda (kg)'], comG.map(r => [dataCurta(r.data), n1(r.gordura), n1(r.peso * (1 - r.gordura / 100)), n1(r.peso * r.gordura / 100)]))];
  })() : [vazio('Gráficos de % de gordura e massa magra x gorda', ['Registre o peso e o % de gordura em 2 datas (mesmo método de medida).', 'Sem balança de bioimpedância? Use a fórmula da Marinha com fita métrica na aba Corpo.'])];
  secoes.push(cartao('Gordura e massa magra', ...gGord));

  const comMed = corpo.filter(r => r.medidas && r.medidas[medidaSel] != null);
  const gMed = [campo('Medida', selecao(MEDIDAS, medidaSel, { onchange: e => { medidaSel = e.target.value; redesenhar(); } }))];
  if (comMed.length >= 2) { const cx = h('div'); graficoResponsivo(cx, w => graficoLinhas({ largura: w, titulo: `${MEDIDAS.find(x => x[0] === medidaSel)[1]} ao longo do tempo`, formatoY: v => n1(v), series: [{ nome: medidaSel, classe: 'ch-peso', pts: comMed.map(r => ({ x: r.data, y: r.medidas[medidaSel] })) }] })); gMed.push(cx); }
  else gMed.push(vazio('Gráfico de medidas', [`Registre "${MEDIDAS.find(x => x[0] === medidaSel)[1]}" em pelo menos 2 datas na aba Corpo.`]));
  secoes.push(cartao('Medidas', ...gMed));

  // ------------------------------------------------ 4. calorias e macros
  const dias = []; for (let i = janelaDias - 1; i >= 0; i--) dias.push(somarDias(hoje, -i));
  const comRef = dias.filter(d => totais[d] && totais[d].kcal > 0);
  const gCal = [h('div', { class: 'chips' }, [14, 30].map(n => h('button', { class: `chip ${janelaDias === n ? 'ativo' : ''}`, type: 'button', 'aria-pressed': String(janelaDias === n), onclick: () => { janelaDias = n; redesenhar(); } }, `${n} dias`)))];
  if (comRef.length >= 2) {
    const cx = h('div'); graficoResponsivo(cx, w => graficoBarras({ largura: w, titulo: 'Calorias por dia comparadas com a meta', formatoY: v => n0(v), metaY: { valor: m.kcal, rotulo: `meta ${n0(m.kcal)}` }, categorias: dias.map(d => ({ rotulo: String(+d.slice(8)), partes: [{ v: totais[d]?.kcal || 0, classe: (totais[d]?.kcal || 0) > m.kcal * 1.1 ? 'ch-b-pos' : 'ch-b-ok', nome: 'kcal' }] })) }));
    const cx2 = h('div'); graficoResponsivo(cx2, w => graficoBarras({ largura: w, titulo: 'Calorias por macro em cada dia', formatoY: v => n0(v), categorias: dias.map(d => ({ rotulo: String(+d.slice(8)), partes: [{ v: (totais[d]?.p || 0) * 4, classe: 'ch-b-prot', nome: 'proteína kcal' }, { v: (totais[d]?.c || 0) * 4, classe: 'ch-b-carb', nome: 'carboidrato kcal' }, { v: (totais[d]?.g || 0) * 9, classe: 'ch-b-gord', nome: 'gordura kcal' }] })) }));
    gCal.push(cx, legenda([{ nome: 'dentro da meta', classe: 'ch-b-ok' }, { nome: 'mais de 10% acima', classe: 'ch-b-pos' }]), h('h3', null, 'Macros por dia'), cx2, legenda([{ nome: 'Proteína', classe: 'ch-b-prot' }, { nome: 'Carboidrato', classe: 'ch-b-carb' }, { nome: 'Gordura', classe: 'ch-b-gord' }]),
      tabelaDados('Calorias e macros', ['Dia', 'kcal', 'Prot (g)', 'Carbo (g)', 'Gord (g)'], comRef.map(d => [dataCurta(d), n0(totais[d].kcal), n0(totais[d].p), n0(totais[d].c), n0(totais[d].g)])));
  } else gCal.push(vazio('Gráficos de calorias e macros', ['Registre refeições em pelo menos 2 dias na aba Alimentação.']));
  secoes.push(cartao('Calorias e macros', ...gCal));

  // ------------------------------------------------ 4b. grau de processamento (NOVA)
  if (!bancoCompletoPronto()) garantirBanco(2500).then(() => { if (bancoCompletoPronto()) ctx.redesenhar(); });
  {
    const diasN = []; for (let i = janelaNova - 1; i >= 0; i--) diasN.push(somarDias(hoje, -i));
    const porDia = {};
    for (const r of store.listar('refeicoes')) { const d = diaDoTs(r.ts); if (d >= diasN[0] && d <= hoje) (porDia[d] ||= []).push(r); }
    const lista = resumoNovaPorDia(porDia), mapa = Object.fromEntries(lista.map(x => [x.data, x]));
    const bl = [h('div', { class: 'chips', role: 'group', 'aria-label': 'Período' }, [7, 30].map(n => h('button', { class: `chip ${janelaNova === n ? 'ativo' : ''}`, type: 'button', 'aria-pressed': String(janelaNova === n), onclick: () => { janelaNova = n; redesenhar(); } }, n === 7 ? 'Semana' : '30 dias')))];
    if (lista.length >= 1) {
      const tudo = resumoNova(Object.values(porDia).flat()), pt = percentuaisInteiros(tudo, 'kcal');
      bl.push(h('p', null, `Nos últimos ${janelaNova} dias (${lista.length} com registro): `, h('strong', null, `${pt[4]}% das calorias`), ` vieram de ultraprocessados e ${pt[1]}% de alimentos in natura ou minimamente processados.`));
      const cx = h('div'); graficoResponsivo(cx, w => graficoBarras({ largura: w, altura: 210, titulo: `Porcentagem das calorias de cada dia por grau de processamento, últimos ${janelaNova} dias`, formatoY: v => v + '%',
        categorias: diasN.map(d => ({ rotulo: janelaNova === 7 ? ddmm(d) : String(+d.slice(8)), partes: mapa[d] ? [4, 3, 2, 1, 0].map(g => ({ v: mapa[d].pct[g], classe: 'ch-n' + g, nome: (g ? GRUPOS_NOVA[g - 1].curto : 'Sem classificação') + ' %' })) : [] })) }));
      bl.push(cx, h('ul', { class: 'legenda nova-linha-leg' }, [1, 2, 3, 4].map(g => h('li', null, h('span', { class: `nova-chave n${g}`, 'aria-hidden': 'true' }, String(g)), GRUPOS_NOVA[g - 1].curto)), h('li', null, h('span', { class: 'nova-chave n0', 'aria-hidden': 'true' }, '?'), 'Sem classificação')));
      bl.push(tabelaDados('Grau de processamento por dia', ['Dia', 'kcal', 'In natura %', 'Ingred. %', 'Processado %', 'Ultra %', 'Sem classe %'], lista.map(x => [dataCurta(x.data), n0(x.kcal), x.pct[1], x.pct[2], x.pct[3], x.pct[4], x.pct[0]])));
      bl.push(h('p', { class: 'ajuda' }, AVISO_NOVA));
    } else bl.push(vazio('Gráfico de grau de processamento', ['Registre refeições na aba Alimentação para ver a mistura de in natura, processados e ultraprocessados em cada dia.']));
    const c4 = cartao('Grau de processamento (NOVA)', ...bl); c4.classList.add('nova-rel'); secoes.push(c4);
  }

  // ------------------------------------------------ 5. treino e balanço semanal
  const semanas = []; { let s = segundaDaSemana(hoje); for (let i = 7; i >= 0; i--) semanas.push(somarDias(s, -7 * i)); }
  const volSem = semanas.map(s => ({ s, ...resumoTreinos(treinos, s, somarDias(s, 6)) }));
  const gVol = treinos.length ? (() => { const cx = h('div'); graficoResponsivo(cx, w => graficoBarras({ largura: w, titulo: 'Séries feitas por semana', formatoY: v => n0(v), categorias: volSem.map(v => ({ rotulo: ddmm(v.s), partes: [{ v: v.series, classe: 'ch-b-vol', nome: 'séries' }] })) }));
    return [cx, tabelaDados('Treino por semana', ['Semana', 'Treinos', 'Séries', 'Volume (kg×reps)', 'Gasto (kcal)'], volSem.map(v => [dataCurta(v.s), v.sessoes, v.series, n0(v.volume), n0(v.kcal)]))]; })()
    : [vazio('Volume de treino', ['Inicie e conclua treinos na aba Treino registrando cargas e repetições.'])];
  secoes.push(cartao('Volume de treino', ...gVol));

  const gastoSem = semanas.map(s => { const f = somarDias(s, 6); return { s, mus: resumoTreinos(treinos, s, f).kcal, out: atividades.filter(a => a.ts.slice(0, 10) >= s && a.ts.slice(0, 10) <= f).reduce((x, a) => x + (a.kcal || 0), 0) }; });
  const gGasto = gastoSem.some(g => g.mus + g.out > 0) ? (() => { const cx = h('div'); graficoResponsivo(cx, w => graficoBarras({ largura: w, titulo: 'Gasto ativo por semana: musculação e outras atividades', formatoY: v => n0(v), categorias: gastoSem.map(g => ({ rotulo: ddmm(g.s), partes: [{ v: g.mus, classe: 'ch-b-vol', nome: 'musculação kcal' }, { v: g.out, classe: 'ch-b-pos', nome: 'outras atividades kcal' }] })) }));
    return [h('p', { class: 'mudo peq' }, 'Gasto líquido estimado (acima do repouso). Cardio e esportes entram só como gasto de energia; o estímulo para ganhar músculo vem da musculação.'), cx, legenda([{ nome: 'Musculação', classe: 'ch-b-vol' }, { nome: 'Corrida, bike e outras', classe: 'ch-b-pos' }]),
      tabelaDados('Gasto ativo por semana', ['Semana', 'Musculação (kcal)', 'Outras (kcal)'], gastoSem.map(g => [dataCurta(g.s), n0(g.mus), n0(g.out)]))]; })()
    : [vazio('Gasto ativo', ['Registre treinos ou outras atividades (corrida, bike, esportes) em "Registrar treino do dia", na aba Alimentação.'])];
  secoes.push(cartao('Gasto ativo semanal', ...gGasto));

  const base = m.gastoBase || (A.balanco ? A.balanco.gasto - A.treino.treinoKcalDia : null);
  const bal = base ? semanas.map(s => {
    const ds = Array.from({ length: 7 }, (_, i) => somarDias(s, i)).filter(d => totais[d] && totais[d].kcal >= 600);
    if (ds.length < 3) return null;
    const ing = ds.reduce((a, d) => a + totais[d].kcal, 0) / ds.length;
    const fimS = somarDias(s, 6);
    const tr = (resumoTreinos(treinos, s, fimS).kcal + atividades.filter(a => a.ts.slice(0, 10) >= s && a.ts.slice(0, 10) <= fimS).reduce((x, a) => x + (a.kcal || 0), 0)) / 7;
    return { s, saldo: ing - (base + tr), dias: ds.length };
  }) : [];
  const balOk = bal.filter(Boolean);
  const gBal = balOk.length >= 1 ? (() => { const cx = h('div'); graficoResponsivo(cx, w => graficoBarras({ largura: w, titulo: 'Balanço energético médio por semana', formatoY: v => n0(v), categorias: balOk.map(b => ({ rotulo: ddmm(b.s), partes: [{ v: Math.abs(b.saldo), classe: b.saldo >= 0 ? 'ch-b-pos' : 'ch-b-neg', nome: b.saldo >= 0 ? 'superávit' : 'déficit' }] })) }));
    return [h('p', { class: 'mudo peq' }, 'Altura da barra = tamanho do saldo médio diário (kcal). Saldo = comido − gasto estimado (inclui treinos registrados). Semanas com menos de 3 dias registrados ficam de fora.'), cx, legenda([{ nome: 'superávit', classe: 'ch-b-pos' }, { nome: 'déficit', classe: 'ch-b-neg' }]),
      tabelaDados('Balanço semanal', ['Semana', 'Saldo (kcal/dia)', 'Dias registrados'], balOk.map(b => [dataCurta(b.s), sinal(b.saldo, 0), b.dias]))]; })()
    : [vazio('Balanço energético semanal', ['Registre refeições em pelo menos 3 dias de uma semana.', 'Complete o perfil (altura, peso, atividade) para estimar seu gasto.'])];
  secoes.push(cartao('Balanço energético semanal', ...gBal));

  // ------------------------------------------------ 6. dicas e guias
  const tot14 = Object.keys(totais).filter(d => d >= somarDias(hoje, -14)).map(d => totais[d]);
  const acucarAlto = tot14.some(t => alertasAlimentares(t, m.kcal).length);
  const refsRecentes = store.listar('refeicoes', r => r.ts.slice(0, 10) >= somarDias(hoje, -7));
  const porDia = {}; refsRecentes.forEach(r => (porDia[r.ts.slice(0, 10)] ||= []).push(r));
  const intervaloLongo = Object.values(porDia).some(l => intervalos(l, new Date(), false).maior >= 6.5);
  const dicas = dicasContextuais({ protPorKg: A.atual && A.ingestao.dias ? A.ingestao.p / A.atual.peso : null, plato: A.plato, intervaloLongo, acucarAlto, sessoes14: A.treino.sessoes, objetivo: P.objetivo, tendencia: A.tendencia, pesoAtual: pesoAtual(), menor: m.menor });
  secoes.push(cartao('Dicas para você agora', ...dicas.slice(0, 5).map(d => { const g = guiaPorId(d.id); return h('div', { class: 'dica' }, h('strong', null, g.titulo), h('small', null, d.motivo)); })));
  secoes.push(cartao('Guias', h('div', null, GUIAS.map(g => h('details', { class: 'guia', id: 'guia-' + g.id }, h('summary', null, g.titulo, icone('baixo', 20)), h('div', { class: 'corpo-guia' }, g.corpo.map(t => h('p', null, t))))))));

  if (nuvemConfigurada() && !nuvemUsuario()) secoes.push(h('p', { class: 'mudo peq', style: { textAlign: 'center' } }, 'Seus dados estão só neste aparelho. ', h('a', { href: '#/config' }, 'Entre em Ajustes'), ' para guardá-los na nuvem.'));
  raiz.append(h('div', { class: 'pilha-g' }, secoes));
}
