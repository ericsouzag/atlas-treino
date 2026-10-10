// Aba Treino: escolha dos dias, divisão (automática / por grupos / livre), fichas justificadas, troca e execução.
import { h, limpar, icone, campo, entradaNum, selecao, lerNumero, n0, n1, aviso, folha, confirmar, caixaAviso, chips, debounce, semAcento } from '../ui.js';
import { store, novoId } from '../store.js';
import { perfil as getPerfil, pesoAtual, ultimoDesempenho, treinosConcluidos } from '../dados.js';
import { GRUPOS, PORCOES, EXERCICIOS, exPorId, nomePorcao, disponivel, temLesao, LESOES } from '../exercises.js';
import { gerarPlano, coberturaDia, volumeSemanal, alternativas, trocarExercicio, textoDiferenca, descricaoDivisao, metaSeriesSemana, prescricao } from '../planner.js';
import { nomeDia, dataISO, dataCurta, diaSemana } from '../datas.js';
import { kcalTreino, duracaoEstimada } from '../nutrition.js';
import { ilustracao } from '../ilustracao.js';

let diaSel = null;

const perfilPlanner = () => { const p = getPerfil(); return { equipamento: p.equipamento || 'academia', experiencia: p.experiencia || 'intermediario', objetivo: p.objetivo || 'manter', lesoes: p.lesoes || [] }; };
const juntar = (el, ...xs) => xs.flat().filter(x => x != null && x !== false).forEach(x => el.appendChild(x));
const lerPlano = () => store.obterUnico('plano') || null;
const salvarPlano = v => store.salvarUnico('plano', v);

export function renderizar(raiz, ctx) {
  ctx.faixa('Treino');
  const P = perfilPlanner();
  const reg = lerPlano();
  const cfg = reg?.config || { dias: [false, true, false, true, false, true, false], modo: 'auto', gruposPorDia: {}, duracao: 75 };
  const plano = reg?.plano || null;
  const redesenhar = () => ctx.redesenhar();

  // ------------------------------------------------ configuração
  const cartaoCfg = h('section', { class: 'cartao pilha', 'aria-label': 'Configurar semana' });
  const draft = JSON.parse(JSON.stringify(cfg));
  function desenharCfg() {
    limpar(cartaoCfg);
    const n = draft.dias.filter(Boolean).length;
    juntar(cartaoCfg,
      h('h2', { class: 'titulo-sec', style: { marginBottom: 0 } }, plano ? 'Sua semana de treino' : 'Monte sua semana'),
      h('fieldset', null, h('legend', null, 'Em quais dias você treina?'),
        h('div', { class: 'dias-sem' }, [0, 1, 2, 3, 4, 5, 6].map(d => h('button', { class: 'dia-sem', type: 'button', 'aria-pressed': String(!!draft.dias[d]), 'aria-label': nomeDia(d), onclick: () => { draft.dias[d] = !draft.dias[d]; desenharCfg(); } }, nomeDia(d, true))))),
      h('fieldset', null, h('legend', null, 'Como montar as fichas?'),
        h('div', { class: 'pilha', role: 'radiogroup' }, [
          ['auto', 'Sugestão automática', n ? descricaoDivisao(n, P) : 'Escolha os dias acima e eu sugiro a divisão ideal.'],
          ['manual', 'Eu escolho os grupos de cada dia', 'Você define os músculos de cada dia; eu completo as porções de cada um.'],
          ['livre', 'Treino livre', 'Sem ficha: você monta os exercícios na hora e registra o que fez.'],
        ].map(([v, t, d]) => h('label', { class: 'opcao' }, h('input', { type: 'radio', name: 'modo', checked: draft.modo === v, onchange: () => { draft.modo = v; desenharCfg(); } }), h('span', null, h('strong', null, t), h('span', { class: 'd' }, d)))))),
      draft.modo === 'manual' ? h('div', { class: 'pilha' }, [0, 1, 2, 3, 4, 5, 6].filter(d => draft.dias[d]).map(d => h('fieldset', null, h('legend', null, nomeDia(d)),
        chips(Object.entries(GRUPOS).map(([k, g]) => [k, g.nome]), draft.gruposPorDia[d] || [], v => { draft.gruposPorDia[d] = v; }, { multiplo: true, rotuloGrupo: `Grupos de ${nomeDia(d)}` })))) : null,
      campo('Tempo disponível por treino', selecao([[45, '45 minutos'], [60, '60 minutos'], [75, '75 minutos'], [90, '90 minutos'], [120, '2 horas']], draft.duracao, { onchange: e => { draft.duracao = +e.target.value; } })),
      (P.lesoes.length ? caixaAviso('info', null, 'Evitando exercícios que sobrecarregam: ' + P.lesoes.map(l => LESOES[l].toLowerCase()).join(', ') + '.') : null),
      h('button', { class: 'btn btn-primario', type: 'button', onclick: gerar }, icone('repetir', 20), plano ? 'Gerar fichas novamente' : 'Gerar fichas'));
  }
  async function gerar() {
    const n = draft.dias.filter(Boolean).length;
    if (!n) { aviso('Escolha pelo menos um dia de treino.'); return; }
    if (plano && !(await confirmar('Gerar novas fichas?', 'As fichas atuais (incluindo trocas que você fez) serão substituídas. O histórico de treinos continua salvo.', { sim: 'Gerar novas' }))) return;
    const novo = gerarPlano(draft, P);
    salvarPlano({ config: draft, plano: novo });
    diaSel = null;
    aviso('Fichas geradas.');
    redesenhar();
  }
  desenharCfg();

  const blocos = [];
  const cfgEl = plano ? h('details', { class: 'cartao', style: { padding: '4px 16px' } }, h('summary', { style: { minHeight: '48px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 700, fontSize: '17px' } }, 'Alterar dias e divisão da semana'), cartaoCfg) : cartaoCfg;
  if (plano) cartaoCfg.style.cssText = 'border:0;box-shadow:none;padding:0 0 12px;background:transparent';
  if (!plano) blocos.push(cfgEl);

  // ------------------------------------------------ plano
  if (plano && Object.keys(plano.dias).length) {
    const diasPlano = Object.keys(plano.dias).map(Number).sort((a, b) => a - b);
    const hojeDow = diaSemana(dataISO());
    if (diaSel == null || !diasPlano.includes(diaSel)) diaSel = diasPlano.includes(hojeDow) ? hojeDow : diasPlano[0];
    const dia = plano.dias[diaSel];
    const painel = h('section', { class: 'pilha', 'aria-label': 'Ficha do dia' });

    const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Dias de treino' }, diasPlano.map(d => h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(d === diaSel), onclick: () => { diaSel = d; redesenhar(); } }, nomeDia(d, true) + (d === hojeDow ? ' · hoje' : ''))));

    painel.append(h('div', { class: 'flex-entre quebra' }, h('div', null, h('h2', { class: 'titulo-sec' }, dia.titulo), h('p', { class: 'mudo' }, dia.livre ? 'Treino livre' : `${dia.totalSeries} séries · cerca de ${duracaoEstimada(dia.totalSeries, 90)} min`)),
      h('button', { class: 'btn btn-primario', type: 'button', onclick: () => abrirExecucao(diaSel, dia, redesenhar) }, icone('play', 20), 'Iniciar treino')));
    if (plano.divisao && diaSel === diasPlano[0]) painel.append(caixaAviso('info', null, plano.divisao));
    plano.avisos.forEach(a => painel.append(caixaAviso('medio', null, a)));

    if (dia.livre) {
      painel.append(h('div', { class: 'vazio' }, h('h3', null, 'Dia de treino livre'), h('ul', null, h('li', null, 'Toque em "Iniciar treino" e adicione os exercícios que for fazer.'), h('li', null, 'Registre cargas e repetições para o app calcular volume e gasto calórico.'))));
    } else {
      // cobertura
      const cob = coberturaDia(dia);
      painel.append(h('details', { class: 'cartao', open: false }, h('summary', { style: { cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: '600' } }, 'Cobertura das porções musculares neste dia', icone('baixo', 18)),
        h('div', { class: 'pilha', style: { marginTop: '8px' } }, cob.map(g => h('div', null, h('strong', null, g.nome), h('div', { class: 'cobertura' }, g.porcoes.map(p => h('span', { class: `cob-${p.nivel}`, title: p.exercicios.join(', ') }, (p.nivel === 'ok' ? '✓ ' : p.nivel === 'parcial' ? '~ ' : '✕ ') + p.nome))))))));
      dia.exercicios.forEach((it, idx) => painel.append(cartaoExercicio(it, idx)));
    }
    blocos.push(tabs, painel);
    blocos.push(cfgEl);

    function cartaoExercicio(it, idx) {
      const ex = exPorId(it.exId);
      if (!ex) return h('div');
      const ult = ultimoDesempenho(ex.id);
      return h('article', { class: 'ex' },
        h('div', { class: 'ex-cab' },
          h('span', { class: 'ex-n', 'aria-hidden': 'true' }, String(idx + 1)),
          h('div', null, h('h3', { class: 'ex-nome' }, ex.nome), h('p', { class: 'ex-pres' }, `${it.series} séries × ${it.reps}${/s$/.test(it.reps) ? '' : ' repetições'} · descanso ${it.descanso} s`), h('p', { class: 'mudo peq' }, `${ex.equipamento} · ${GRUPOS[ex.grupoPrincipal].nome}`)),
          h('button', { class: 'btn btn-peq btn-trocar', type: 'button', 'aria-label': `Trocar ${ex.nome}`, onclick: () => trocar(it, idx) }, icone('trocar', 18), h('span', { class: 'lbl' }, 'Trocar'))),
        ilustracao(ex.id, 'g'),
        h('div', { class: 'porcoes' }, [...ex.primarias.map(p => h('span', { class: 'porc', title: 'Estímulo principal' }, nomePorcao(p))), ...ex.secundarias.map(p => h('span', { class: 'porc sec', title: 'Ajuda de quebra' }, nomePorcao(p)))]),
        ult ? h('p', { class: 'mudo peq' }, `Última vez (${dataCurta(ult.data)}): ${ult.series.map(s => `${s.carga ? n0(s.carga) + ' kg × ' : ''}${s.reps ?? '?'}`).join(', ')}`) : null,
        h('details', null, h('summary', null, 'Por que este exercício?', icone('baixo', 18)),
          h('div', { class: 'just pilha', style: { gap: '8px' } },
            ...partesJustificativa(it.justificativa),
            h('p', null, h('strong', null, 'Como fazer: '), ex.instrucao),
            h('p', null, h('strong', null, 'Erro comum: '), ex.erro),
            h('p', { class: 'mudo peq' }, `Dificuldade: ${['', 'iniciante', 'intermediário', 'avançado'][ex.dificuldade]} · Ênfase: ${ex.foco}`))));
    }

    async function trocar(it, idx) {
      const alts = alternativas(it, dia, P, 8);
      const escolha = await folha('Trocar exercício', fechar => h('div', { class: 'pilha' },
        h('p', { class: 'mudo' }, `Alternativas que ativam as mesmas porções de ${exPorId(it.exId).nome}, ordenadas por sobreposição.`),
        alts.length ? alts.map(a => h('div', { class: 'alt' },
          h('div', { class: 'flex' }, ilustracao(a.ex.id, 'p'), h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { class: 'flex-entre' }, h('strong', null, a.ex.nome), h('span', { class: 'pc' }, `${Math.round(a.score * 100)}%`)))),
          h('p', { class: 'mudo peq' }, a.ex.equipamento), h('p', { class: 'peq' }, textoDiferenca(a, a.score)),
          h('button', { class: 'btn btn-peq', type: 'button', onclick: () => fechar(a.ex.id) }, 'Escolher este'))) : h('p', null, 'Não há alternativas compatíveis com seu equipamento e limitações.')));
      if (!escolha) return;
      const r = trocarExercicio(plano, diaSel, idx, escolha, P);
      if (!r) return;
      plano.dias[diaSel].exercicios[idx] = r.item;
      salvarPlano({ plano, config: reg.config });
      aviso(r.avisos.length ? 'Trocado. Atenção: ' + r.avisos[0] : 'Exercício trocado e justificativa atualizada.');
      redesenhar();
    }

    // volume semanal
    const vol = volumeSemanal(plano, P);
    blocos.push(h('section', { class: 'cartao' }, h('h2', null, 'Volume semanal por grupo'),
      h('p', { class: 'mudo peq' }, 'Séries diretas por semana comparadas com a faixa sugerida para seu nível e objetivo (barra verde). Compostos também contam um pouco para outros grupos.'),
      vol.grupos.map(g => {
        const max = Math.max(g.max * 1.25, g.series);
        return h('div', { class: 'vol-linha' }, h('span', null, g.nome), h('span', { class: `status-${g.status.replace(' ', '-')}` }, `${g.series} séries · ${g.status}`),
          h('div', { class: 'barra', style: { '--cor': 'var(--tinta2)' } }, h('div', { class: 'faixa-alvo', style: { left: (g.min / max * 100) + '%', width: ((g.max - g.min) / max * 100) + '%' } }), h('i', { style: { '--n': (g.series / max * 100) + '%' } })));
      })));
  }

  if (!blocos.includes(cfgEl)) blocos.push(cfgEl);

  // ------------------------------------------------ histórico
  const hist = treinosConcluidos().slice().reverse().slice(0, 8);
  blocos.push(h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Treinos registrados'),
    hist.length ? h('div', { class: 'hist' }, hist.map(t => {
      const series = (t.exercicios || []).reduce((s, e) => s + e.series.filter(x => x.feito).length, 0);
      return h('div', { class: 'hist-item' }, h('div', null, h('div', { class: 't' }, `${dataCurta(t.data)} · ${t.titulo || 'Treino'}`), h('div', { class: 's' }, `${series} séries · ${n0(t.duracaoMin)} min · ~${n0(t.kcal)} kcal`)),
        h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': 'Excluir treino', onclick: async () => { if (await confirmar('Excluir treino?', 'Isso também remove esse treino dos relatórios.', { sim: 'Excluir', perigo: true })) { store.remover('treinos', t.id); redesenhar(); } } }, icone('lixo')));
    })) : h('p', { class: 'mudo' }, 'Nenhum treino concluído ainda. Ao concluir, o app soma o gasto calórico e o volume nos relatórios.')));

  raiz.append(h('div', { class: 'pilha-g' }, blocos));
}

// =============================================================================
// Execução do treino
// =============================================================================
export function abrirExecucao(diaIdx, dia, aoFim) {
  const hoje = dataISO();
  // retoma sessão em andamento do mesmo dia
  let sessao = store.listar('treinos', t => !t.concluido && t.data === hoje && t.diaPlano === diaIdx)[0];
  if (!sessao) {
    sessao = {
      id: novoId('t'), data: hoje, diaPlano: diaIdx, titulo: dia.titulo, concluido: false, inicio: Date.now(),
      exercicios: dia.exercicios.map(it => {
        const ult = ultimoDesempenho(it.exId, hoje);
        return { exId: it.exId, descanso: it.descanso, reps: it.reps, series: Array.from({ length: it.series }, (_, i) => ({ carga: ult?.series[i]?.carga ?? ult?.series.at(-1)?.carga ?? null, reps: ult?.series[i]?.reps ?? null, rpe: null, feito: false })) };
      }),
    };
  }
  const salvar = debounce(() => store.salvar('treinos', sessao), 300);
  const salvarJa = () => store.salvar('treinos', sessao);
  salvarJa();

  return folha(`Treino · ${dia.titulo}`, fechar => {
    const lista = h('div', { class: 'pilha' });
    const timerBox = h('div', { class: 'timer', hidden: true, role: 'timer', 'aria-live': 'off' });
    const relogio = h('span', { class: 'mudo peq', 'aria-label': 'Tempo de treino' });
    let restante = 0, tick = null, venceu = false;
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
    function iniciarDescanso(seg) {
      restante = seg; venceu = false; timerBox.hidden = false; desenharTimer();
      clearInterval(tick);
      tick = setInterval(() => { restante--; if (restante <= 0 && !venceu) { venceu = true; try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch { /* ignora */ } } desenharTimer(); }, 1000);
    }
    function desenharTimer() {
      limpar(timerBox).append(icone('cronometro', 24), h('span', { class: 'tempo' }, restante > 0 ? fmt(restante) : 'Vai!'), h('span', { style: { flex: 1 } }, restante > 0 ? 'Descanso' : 'Descanso terminou'),
        h('button', { class: 'btn btn-peq', type: 'button', 'aria-label': 'Menos 15 segundos', onclick: () => { restante = Math.max(0, restante - 15); desenharTimer(); } }, '−15'),
        h('button', { class: 'btn btn-peq', type: 'button', 'aria-label': 'Mais 15 segundos', onclick: () => { restante += 15; venceu = false; desenharTimer(); } }, '+15'),
        h('button', { class: 'btn btn-peq', type: 'button', onclick: () => { clearInterval(tick); timerBox.hidden = true; } }, 'Fechar'));
    }
    const relogioTick = setInterval(() => { const s = Math.round((Date.now() - sessao.inicio) / 1000); relogio.textContent = `Tempo: ${fmt(s)}`; }, 1000);

    function desenhar() {
      limpar(lista);
      sessao.exercicios.forEach((e, ei) => {
        const ex = exPorId(e.exId);
        const ult = ultimoDesempenho(e.exId, hoje);
        lista.appendChild(h('section', { class: 'ex' },
          h('div', { class: 'flex-entre' }, ilustracao(e.exId, 'p'), h('div', { style: { flex: 1, minWidth: 0 } }, h('h3', { class: 'ex-nome' }, ex ? ex.nome : e.exId), h('p', { class: 'ex-pres' }, `Meta: ${e.reps} reps · descanso ${e.descanso} s`),
            ult ? h('p', { class: 'mudo peq' }, `Última vez: ${ult.series.map(s => `${s.carga ? n0(s.carga) + ' kg × ' : ''}${s.reps ?? '?'}`).join(', ')}`) : null),
            h('button', { class: 'btn-icone perigo', type: 'button', 'aria-label': `Remover ${ex?.nome} do treino`, onclick: () => { sessao.exercicios.splice(ei, 1); salvar(); desenhar(); } }, icone('x'))),
          h('div', { class: 'cab-series', 'aria-hidden': 'true' }, h('span', null, '#'), h('span', null, 'Carga kg'), h('span', null, 'Reps'), h('span', null, 'RPE'), h('span', null, 'Feito')),
          e.series.map((s, si) => h('div', { class: 'serie' },
            h('span', { class: 'n' }, String(si + 1)),
            entradaNum(s.carga, { 'aria-label': `Carga da série ${si + 1}`, placeholder: 'kg', onchange: ev => { s.carga = lerNumero(ev.target.value); salvar(); } }),
            entradaNum(s.reps, { 'aria-label': `Repetições da série ${si + 1}`, placeholder: 'reps', onchange: ev => { s.reps = lerNumero(ev.target.value); salvar(); } }),
            entradaNum(s.rpe, { 'aria-label': `RPE da série ${si + 1} (opcional, de 1 a 10)`, placeholder: '–', onchange: ev => { const v = lerNumero(ev.target.value); s.rpe = v != null ? Math.min(10, Math.max(1, v)) : null; salvar(); } }),
            h('button', { class: 'feito', type: 'button', 'aria-pressed': String(!!s.feito), 'aria-label': `Série ${si + 1} feita`, onclick: ev => { s.feito = !s.feito; salvar(); ev.currentTarget.setAttribute('aria-pressed', String(s.feito)); if (s.feito) iniciarDescanso(e.descanso || 90); } }, s.feito ? icone('ok', 22) : null))),
          h('div', { class: 'flex' }, h('button', { class: 'btn btn-peq', type: 'button', onclick: () => { const ult2 = e.series.at(-1); e.series.push({ carga: ult2?.carga ?? null, reps: ult2?.reps ?? null, rpe: null, feito: false }); salvar(); desenhar(); } }, icone('mais', 16), 'Série'),
            e.series.length > 1 ? h('button', { class: 'btn btn-peq btn-fantasma', type: 'button', onclick: () => { e.series.pop(); salvar(); desenhar(); } }, 'Tirar última') : null)));
      });
      lista.appendChild(h('button', { class: 'btn', type: 'button', onclick: adicionarExercicio }, icone('mais', 18), 'Adicionar exercício'));
    }

    async function adicionarExercicio() {
      const P = perfilPlanner();
      const esc = await folha('Adicionar exercício', fecharBusca => {
        const res = h('div', { class: 'resultados-busca' });
        const entrada = h('input', { type: 'search', 'aria-label': 'Buscar exercício', placeholder: 'Buscar por nome ou músculo…', oninput: debounce(mostrar, 100) });
        function mostrar() {
          limpar(res); const q = semAcento(entrada.value.trim());
          EXERCICIOS.filter(e => disponivel(e, P.equipamento) && !temLesao(e, P.lesoes) && (!q || semAcento(e.nome + ' ' + e.primarias.map(nomePorcao).join(' ') + ' ' + GRUPOS[e.grupoPrincipal].nome).includes(q))).slice(0, 25)
            .forEach(e => res.appendChild(h('button', { type: 'button', onclick: () => fecharBusca(e) }, h('strong', null, e.nome), h('div', { class: 'mudo peq' }, e.primarias.map(nomePorcao).join(', ')))));
        }
        mostrar(); setTimeout(() => entrada.focus(), 50);
        return h('div', { class: 'pilha' }, entrada, res);
      });
      if (esc) {
        const pr = prescricao(esc, P);
        const ult = ultimoDesempenho(esc.id, hoje);
        sessao.exercicios.push({ exId: esc.id, descanso: pr.descanso, reps: pr.reps, series: Array.from({ length: 3 }, (_, i) => ({ carga: ult?.series[i]?.carga ?? null, reps: ult?.series[i]?.reps ?? null, rpe: null, feito: false })) });
        salvarJa(); desenhar();
      }
    }

    function concluir() {
      const feitas = sessao.exercicios.reduce((s, e) => s + e.series.filter(x => x.feito).length, 0);
      if (!feitas) { aviso('Marque pelo menos uma série como feita para concluir.'); return; }
      const medido = Math.round((Date.now() - sessao.inicio) / 60000);
      const estimado = duracaoEstimada(feitas, 90);
      const dur = Math.min(180, medido < estimado * 0.5 ? estimado : Math.max(10, medido));
      const rpes = sessao.exercicios.flatMap(e => e.series.filter(s => s.feito && s.rpe != null).map(s => s.rpe));
      const rpeMedio = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;
      const met = rpeMedio != null ? Math.max(3.5, Math.min(6, 4.5 + (rpeMedio - 7) * 0.4)) : 4.5;
      const peso = pesoAtual() || 70;
      sessao = { ...sessao, concluido: true, duracaoMin: dur, mets: met, kcal: Math.round(kcalTreino(peso, dur, met)), fim: Date.now() };
      store.salvar('treinos', sessao);
      cleanup(); fechar(sessao);
    }
    const cleanup = () => { clearInterval(tick); clearInterval(relogioTick); };
    desenhar();
    const dlg = () => document.querySelector('dialog.folha');
    setTimeout(() => dlg()?.addEventListener('close', cleanup), 0);
    return h('div', { class: 'pilha' }, relogio, caixaAviso('info', null, 'RPE é opcional: de 1 (fácil) a 10 (no limite). Ajuda a estimar o gasto calórico.'), lista, timerBox,
      h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => { salvarJa(); cleanup(); fechar(undefined); aviso('Treino salvo como em andamento.'); } }, 'Salvar e sair'),
        h('button', { class: 'btn btn-primario', type: 'button', onclick: concluir }, icone('ok', 18), 'Concluir treino')));
  }, { larga: true }).then(res => {
    if (res && res.concluido) aviso(`Treino concluído: ~${n0(res.kcal)} kcal gastas (estimativa), ${n0(res.duracaoMin)} min.`);
    aoFim();
  });
}

/** Quebra a justificativa em frases curtas; a lista de alternativas descartadas vira bloco à parte */
function partesJustificativa(txt) {
  const i = txt.indexOf('Ficaram de fora:');
  const antes = i >= 0 ? txt.slice(0, i).trim() : txt;
  const fora = i >= 0 ? txt.slice(i).trim() : '';
  const frases = antes.split(/(?<=.)s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).filter(Boolean);
  return [h('ul', { style: { margin: 0, paddingLeft: '18px', display: 'grid', gap: '4px' } }, frases.map(f => h('li', null, f))), fora ? h('p', { class: 'mudo peq' }, fora) : null].filter(Boolean);
}
