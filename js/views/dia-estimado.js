// "Registrar um dia inteiro": folha com 3 opções (dia abaixo, normal, acima), prévia, destino e confirmação com desfazer.
// A conta fica em js/dia-estimado.js (puro e testado); aqui só a tela.
import { h, limpar, icone, campo, n0, aviso, folha, caixaAviso } from '../ui.js';
import { store, novoId } from '../store.js';
import { dataISO, rotuloDia, dataCurta, horaDoTs } from '../datas.js';
import {
  preverDia, mantidosNoDestino, situacaoDestino, idsSubstituiveis, MIN_DIAS, JANELA_DIAS, KCAL_MIN_COMPLETO, FRACAO_MIN_DA_MEDIA, totaisDeRefeicoes,
} from '../dia-estimado.js';

const OPCOES = [
  { id: 'abaixo', titulo: 'Dia abaixo', explica: 'Copia o seu dia de MENOR consumo do histórico (ignorando dias incompletos e fora do padrão).' },
  { id: 'normal', titulo: 'Dia normal', explica: 'Usa a MÉDIA do seu consumo diário: pega o dia mais parecido com ela e ajusta as quantidades para bater com a média.' },
  { id: 'acima', titulo: 'Dia acima', explica: 'Copia o seu dia de MAIOR consumo do histórico (ignorando dias incompletos e fora do padrão).' },
];
export const AVISO_ESTIMADO = 'Valores estimados a partir dos seus dias anteriores.';

/** Folha principal. `dia`: dia selecionado na tela (destino padrão). `aoMudar`: chamado depois de registrar ou desfazer. */
export function abrirDiaEstimado({ dia = dataISO(), aoMudar = () => {} } = {}) {
  const hoje = dataISO();
  return folha('Registrar um dia inteiro', fechar => {
    let destino = dia > hoje ? hoje : dia, modo = 'normal', politica = 'adicionar';
    const corpo = h('div', { class: 'pilha' });

    function desenhar() {
      limpar(corpo);
      const todas = store.listar('refeicoes');
      const sit = situacaoDestino(todas, destino);
      if (!sit.opcoes.some(o => o.id === politica)) politica = 'adicionar';
      const mantidos = mantidosNoDestino(todas, destino, politica);   // o que fica no destino e conta para o alvo do dia
      const previas = Object.fromEntries(OPCOES.map(o => [o.id, preverDia({ refeicoes: todas, dia: destino, modo: o.id, mantidos })]));
      const alguma = previas.normal;

      const inpData = h('input', { type: 'date', value: destino, max: hoje, 'aria-label': 'Dia a preencher', onchange: e => { if (e.target.value) { destino = e.target.value > hoje ? hoje : e.target.value; desenhar(); } } });
      corpo.append(
        h('p', null, 'Não conseguiu registrar esse dia? O app preenche com base nos seus próprios dias anteriores. Você confere a prévia antes de confirmar e pode desfazer.'),
        campo('Dia a preencher', inpData, rotuloDia(destino, hoje)));

      if (!alguma.ok) {
        corpo.append(caixaAviso('info', alguma.motivo === 'poucos-dias' ? 'Ainda faltam dados' : 'Sem dia comparável no histórico',
          alguma.motivo === 'poucos-dias'
            ? `Precisa de pelo menos ${MIN_DIAS} dias com refeições registradas nos últimos ${JANELA_DIAS} dias (antes do dia escolhido). Você tem ${alguma.diasComRegistro}; faltam ${alguma.faltam}.`
            : `Os dias do histórico parecem incompletos (menos de ${KCAL_MIN_COMPLETO} kcal ou menos de ${Math.round(FRACAO_MIN_DA_MEDIA * 100)}% da sua média). Registre mais dias completos primeiro.`),
          regras(), h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => fechar(undefined) }, 'Fechar')));
        return;
      }

      // ---- as três opções (grupo de rádio)
      const grupo = h('div', { class: 'pilha', role: 'radiogroup', 'aria-label': 'Tipo de dia' });
      for (const o of OPCOES) {
        const p = previas[o.id];
        const radio = h('input', { type: 'radio', name: 'dia-modo', value: o.id, checked: modo === o.id, onchange: () => { modo = o.id; desenhar(); } });
        grupo.append(h('label', { class: 'opcao opcao-dia', for: `dia-${o.id}` }, (radio.id = `dia-${o.id}`, radio),
          h('span', null, h('strong', null, `${o.titulo}: ${p.ok ? (p.comExistentes ? `alvo ${n0(p.alvo)} kcal` : `${n0(p.kcalResultado)} kcal`) : 'sem dados'}`), h('span', { class: 'd' }, o.explica),
            p.ok && p.comExistentes ? h('span', { class: 'd' }, p.semGeracao ? `Já lançado: ${n0(p.jaLancado)} kcal, alcança o alvo: nada a gerar.` : `Já lançado: ${n0(p.jaLancado)} kcal · falta ${n0(Math.max(0, p.restante))} kcal.`) : null,
            p.ok ? h('span', { class: 'd' }, o.id === 'normal' ? `Média de ${n0(p.media)} kcal nos últimos ${p.nDiasConsiderados} dias · base: ${dataCurta(p.dataOrigem)}` : `Dia de ${dataCurta(p.dataOrigem)} (${n0(p.kcalOrigem)} kcal)`) : null)));
      }
      corpo.append(grupo);

      // ---- prévia da opção escolhida
      const pv = previas[modo];
      if (pv.ok) {
        const refs = pv.lancamentos;
        corpo.append(h('section', { class: 'cartao pilha previa-dia', 'aria-live': 'polite' },
          h('h3', { style: { margin: 0 } }, `Prévia: ${OPCOES.find(o => o.id === modo).titulo.toLowerCase()}`),
          h('p', { class: 'mudo' }, modo === 'normal'
            ? `Média de ${n0(pv.media)} kcal nos últimos ${pv.nDiasConsiderados} dias considerados (de ${pv.nDiasComRegistro} com registro). Base: ${rotuloDia(pv.dataOrigem, hoje)} (${n0(pv.kcalOrigem)} kcal), ${Math.abs(pv.fator - 1) < 0.005 ? 'sem ajuste nas quantidades' : `com quantidades ajustadas em ${pv.fator >= 1 ? '+' : '−'}${Math.abs(Math.round((pv.fator - 1) * 100))}%`}.`
            : `Origem: ${rotuloDia(pv.dataOrigem, hoje)}.`),
          pv.comExistentes ? h('p', { class: 'resumo-alvo' }, `Alvo do dia: ${n0(pv.alvo)} kcal · Já lançado: ${n0(pv.jaLancado)} kcal · Falta: ${n0(Math.max(0, pv.restante))} kcal`) : null,
          pv.comExistentes && pv.semGeracao ? caixaAviso('medio', 'Nada a gerar', `Este dia já tem ${n0(pv.jaLancado)} kcal, que ${pv.jaLancado > pv.alvo ? 'ultrapassa' : 'alcança'} o alvo de ${n0(pv.alvo)} kcal. Nenhuma refeição será adicionada.`) : null,
          pv.comExistentes && !pv.semGeracao && pv.pulados.length ? h('p', { class: 'ajuda' }, `Não repete o que você já lançou: ${pv.pulados.join(', ')}.`) : null,
          pv.estrategia === 'complemento' ? h('p', { class: 'ajuda' }, 'Sobrou pouco do dia de origem para completar, então o app gera um único "Complemento do dia", proporcional ao que falta.') : null,
          pv.comExistentes && !pv.semGeracao && pv.kcalResultado < 100 ? caixaAviso('info', null, `Só ${n0(pv.kcalResultado)} kcal serão adicionados: o dia já está perto do alvo.`) : null,
          pv.semGeracao ? null : h('div', { class: 'totais-conf' }, h('span', null, h('b', null, n0(pv.totais.kcal)), pv.comExistentes ? ' kcal a adicionar' : ' kcal'), h('span', null, h('b', null, n0(pv.totais.p)), ' g prot.'), h('span', null, h('b', null, n0(pv.totais.c)), ' g carbo'), h('span', null, h('b', null, n0(pv.totais.g)), ' g gord.')),
          pv.comExistentes && !pv.semGeracao ? h('p', { class: 'mudo' }, h('strong', null, `Total final do dia: ${n0(pv.totalDia.kcal)} kcal`), ` · P ${n0(pv.totalDia.p)} g · C ${n0(pv.totalDia.c)} g · G ${n0(pv.totalDia.g)} g (já lançado + gerado)`) : null,
          h('ul', { class: 'lista-previa' }, refs.map(r => h('li', null, h('strong', null, `${horaDoTs(r.ts)} ${r.tipo}`), h('span', { class: 'mudo peq' }, ' · ' + r.itens.map(i => `${i.nome} ${n0(i.gramas)} ${i.liquido ? 'ml' : 'g'}`).join(', '))))),
          h('p', { class: 'ajuda' }, `${AVISO_ESTIMADO} ${pv.descartados.incompletos || pv.descartados.outliers ? `Ignorados no histórico: ${pv.descartados.incompletos} dia(s) incompleto(s) e ${pv.descartados.outliers} fora do padrão.` : ''}`)));
      }

      // ---- destino que já tem lançamentos
      if (sit.temLancamentos) {
        const radios = sit.opcoes.map(o => h('label', { class: 'opcao', for: `pol-${o.id}` }, h('input', { type: 'radio', name: 'dia-pol', id: `pol-${o.id}`, value: o.id, checked: politica === o.id, onchange: () => { politica = o.id; desenhar(); } }),
          h('span', null, h('strong', null, o.rotulo), h('span', { class: 'd' }, o.id === 'adicionar' ? 'Mantém tudo o que já está nesse dia (padrão).' : 'Troca só o que foi gerado antes por esta função; seus lançamentos reais ficam.'))));
        corpo.append(h('fieldset', { class: 'pilha', style: { border: 'none', padding: 0, margin: 0 } },
          h('legend', { class: 'rotulo-grupo' }, `Esse dia já tem ${sit.reais.length + sit.geradas.length} lançamento(s)${sit.geradas.length ? ` (${sit.geradas.length} estimado(s))` : ''}`), radios,
          h('p', { class: 'ajuda' }, 'Lançamentos reais nunca são apagados por aqui; para tirar algum, exclua-o na lista de refeições.')));
      }
      corpo.append(regras(), h('div', { class: 'linha-botoes' },
        h('button', { class: 'btn', type: 'button', onclick: () => fechar(undefined) }, 'Cancelar'),
        h('button', { class: 'btn btn-primario', type: 'button', id: 'btn-registrar-dia', disabled: !pv.ok || pv.semGeracao, onclick: registrar }, icone('ok', 18), 'Registrar este dia')));
    }

    function regras() {
      return h('details', { class: 'regras-dia' }, h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 600 } }, 'Como o app escolhe o dia'),
        h('ul', { class: 'ajuda', style: { paddingLeft: '20px', display: 'grid', gap: '4px' } },
          h('li', null, `Histórico: dias com refeições registradas por você nos últimos ${JANELA_DIAS} dias, antes do dia escolhido. Dias gerados por esta função não entram na conta. Mínimo: ${MIN_DIAS} dias.`),
          h('li', null, `Dia incompleto (menos de ${KCAL_MIN_COMPLETO} kcal ou menos de ${Math.round(FRACAO_MIN_DA_MEDIA * 100)}% da média) e dia fora do padrão (1,5 × IQR) não são usados.`),
          h('li', null, 'Dia abaixo/acima: copia as refeições (alimentos, quantidades, tipos e horários) do menor/maior dia que sobrou. Empate: o mais recente.'),
          h('li', null, 'Dia normal: média dos dias que sobraram; usa o dia mais próximo dela e ajusta as quantidades (gramas arredondadas) para chegar na média.'),
          h('li', null, 'Os lançamentos criados são comuns (editáveis e excluíveis), contam no balanço, gráficos, grau de processamento e relatórios, e levam o selo "estimado".')));
    }

    function registrar() {
      const lote = novoId('dia');
      const todas = store.listar('refeicoes');
      const pv = preverDia({ refeicoes: todas, dia: destino, modo, lote, mantidos: mantidosNoDestino(todas, destino, politica) });
      if (!pv.ok || pv.semGeracao) { aviso(pv.semGeracao ? 'Esse dia já alcança o alvo: nada a gerar.' : 'Não deu para gerar esse dia.'); return; }
      const removidos = politica === 'substituir-gerados' ? idsSubstituiveis(todas, destino).map(id => store.obter('refeicoes', id)).filter(Boolean) : [];
      removidos.forEach(r => store.remover('refeicoes', r.id));
      const criados = pv.lancamentos.map(l => store.salvar('refeicoes', l));
      const kcal = totaisDeRefeicoes(criados).kcal;
      fechar({ registrado: true, destino });
      aviso(`${rotuloDia(destino, hoje)} registrado: ${n0(kcal)} kcal (estimado).`, {
        duracao: 9000, acao: 'Desfazer',
        aoAcao: () => { criados.forEach(r => store.remover('refeicoes', r.id)); removidos.forEach(r => store.salvar('refeicoes', r)); aoMudar(); },
      });
      aoMudar();
    }
    desenhar();
    return corpo;
  }, { larga: true });
}
