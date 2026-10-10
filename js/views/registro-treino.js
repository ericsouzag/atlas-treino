// "Registrar treino do dia": treino programado (1 toque) ou outra atividade (árvore de escolhas com cálculo de ritmo e kcal).
import { h, limpar, icone, campo, entradaNum, selecao, lerNumero, n0, n1, aviso, folha, chips, caixaAviso } from '../ui.js';
import { store, novoId } from '../store.js';
import { pesoAtual } from '../dados.js';
import { dataISO, horaHM, tsLocal, diaSemana, dataLonga } from '../datas.js';
import { kcalTreino, duracaoEstimada } from '../nutrition.js';
import * as AT from '../atividades.js';

const juntar = (el, ...xs) => xs.flat().filter(x => x != null && x !== false).forEach(x => el.appendChild(x));
const fmtNum = (v, d = 2) => (v == null || !isFinite(v) ? '' : String(+v.toFixed(d)).replace('.', ','));
const lerDuracao = txt => { // "45", "45,5" ou "1:05" (h:mm)
  const s = String(txt ?? '').trim().replace(',', '.');
  if (!s) return null;
  const m = s.match(/^(\d+):(\d{1,2})$/);
  if (m) return +m[1] * 60 + +m[2];
  const n = parseFloat(s); return isNaN(n) || n <= 0 ? null : n;
};

/** Abre a folha. opts: { data (AAAA-MM-DD), editar (atividade existente) } */
export async function abrirRegistroTreino({ data = dataISO(), editar = null } = {}) {
  return folha(editar ? 'Editar atividade' : 'Registrar treino do dia', fechar => {
    const raiz = h('div', { class: 'pilha' });
    let memoE = null;
    const peso = () => pesoAtual() || 70;

    // ------------------------------------------------ passo 1: programado ou outra
    function inicio() {
      memoE = null;
      limpar(raiz);
      const plano = store.obterUnico('plano');
      const dow = diaSemana(data);
      const diaPlano = plano?.plano?.dias?.[dow] || null;
      juntar(raiz, 
        h('p', { class: 'mudo' }, `Dia: ${dataLonga(data)}`),
        h('button', { class: 'opcao-grande', type: 'button', onclick: programado }, icone('halter', 28), h('span', null, h('strong', null, 'Treino programado'), h('span', { class: 'd' }, diaPlano ? `${diaPlano.titulo}${diaPlano.livre ? '' : ` · ${diaPlano.totalSeries} séries`}` : 'Nenhum treino programado para este dia'))),
        h('button', { class: 'opcao-grande', type: 'button', onclick: () => arvore(null) }, icone('chama', 28), h('span', null, h('strong', null, 'Outra atividade'), h('span', { class: 'd' }, 'Corrida, caminhada, bike, natação, esportes e mais'))));
    }

    // ------------------------------------------------ programado
    function programado() {
      limpar(raiz);
      const plano = store.obterUnico('plano');
      const dow = diaSemana(data);
      const dia = plano?.plano?.dias?.[dow] || null;
      const voltar = h('button', { class: 'btn btn-fantasma', type: 'button', onclick: inicio }, icone('esq', 18), 'Voltar');
      if (!dia) {
        juntar(raiz, voltar, caixaAviso('info', 'Sem treino programado', 'Escolha os dias de treino na aba Treino ou registre como "Outra atividade".'),
          h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => arvore('musculacao') }, 'Registrar musculação avulsa'), h('a', { class: 'btn', href: '#/treino', onclick: () => fechar(undefined) }, 'Ir para Treino')));
        return;
      }
      const jaFeito = store.listar('treinos', t => t.concluido && t.data === data && t.diaPlano === dow);
      let fracao = 0.5;
      const marcar = (f) => {
        const exercicios = (dia.exercicios || []).map(it => ({ exId: it.exId, descanso: it.descanso, reps: it.reps, series: Array.from({ length: it.series }, (_, i) => ({ carga: null, reps: null, rpe: null, feito: f >= 1 || i < Math.ceil(it.series * f) })) }));
        const feitas = exercicios.reduce((s, e) => s + e.series.filter(x => x.feito).length, 0);
        const dur = Math.max(10, duracaoEstimada(feitas || 1, 90));
        const t = store.salvar('treinos', { id: novoId('t'), data, diaPlano: dow, titulo: dia.titulo, concluido: true, duracaoMin: dur, mets: 4.5, kcal: Math.round(kcalTreino(peso(), dur, 4.5)), exercicios, origem: 'marcado', parcial: f < 1, fim: Date.now() });
        aviso(`${f < 1 ? 'Treino parcial' : 'Treino'} registrado: ~${n0(t.kcal)} kcal (estimativa).`, { acao: 'Desfazer', aoAcao: () => { store.remover('treinos', t.id); document.dispatchEvent(new CustomEvent('atlas:atualizar')); } });
        fechar({ salvo: true });
      };
      juntar(raiz, voltar,
        h('h3', null, dia.titulo), h('p', { class: 'mudo' }, dia.livre ? 'Treino livre: sem ficha, detalhe na execução.' : `${dia.totalSeries} séries planejadas`),
        jaFeito.length ? caixaAviso('info', null, 'Você já registrou este treino hoje. Registrar de novo soma ao dia.') : null,
        !dia.livre ? h('button', { class: 'btn btn-primario', type: 'button', onclick: () => marcar(1) }, icone('ok', 20), 'Feito, completo') : null,
        !dia.livre ? h('div', { class: 'pilha', style: { gap: '8px' } }, h('div', { class: 'rotulo' }, 'Ou foi parcial: quanto você fez?'), chips([[0.25, '25%'], [0.5, '50%'], [0.75, '75%']], 0.5, v => { fracao = v; }, { rotuloGrupo: 'Parte do treino feita' }),
          h('button', { class: 'btn', type: 'button', onclick: () => marcar(fracao) }, 'Marcar como parcial')) : null,
        h('button', { class: 'btn', type: 'button', onclick: async () => { fechar({ detalhar: { dow, dia } }); } }, icone('play', 18), 'Detalhar na execução (cargas e repetições)'));
    }

    // ------------------------------------------------ árvore de atividades
    function arvore(preSel) {
      limpar(raiz);
      memoE = null;
      if (preSel) return formulario(preSel);
      const voltar = h('button', { class: 'btn btn-fantasma', type: 'button', onclick: inicio }, icone('esq', 18), 'Voltar');
      const botao = id => h('button', { class: 'chip', type: 'button', onclick: () => formulario(id) }, AT.ATIVIDADES[id].nome);
      const esportes = Object.keys(AT.ATIVIDADES).filter(id => AT.ATIVIDADES[id].grupo === 'Esportes');
      juntar(raiz, voltar, h('h3', null, 'Qual atividade?'), h('div', { class: 'chips' }, AT.ATIVIDADES_DESTAQUE.map(botao)), h('div', { class: 'rotulo' }, 'Esportes e outras'), h('div', { class: 'chips' }, esportes.map(botao)));
    }

    // ------------------------------------------------ formulário da atividade
    function formulario(id) {
      limpar(raiz);
      const cat = AT.ATIVIDADES[id];
      const base = editar && editar.atividade === id ? editar : {};
      const e = (memoE && memoE.atividade === id) ? memoE : { atividade: id, intensidade: base.intensidade || 'moderada', unidade: base.unidade || 'km', distKm: base.distKm ?? null, metros: base.metros ?? null, durMin: base.durMin ?? null, paceMinKm: base.paceMinKm ?? null, pace100: base.pace100 ?? null,
        estilo: base.estilo || 'crawl', indoor: !!base.indoor, subida: !!base.subida, nomeLivre: base.nomeLivre || '', data: base.ts ? base.ts.slice(0, 10) : data, hora: base.ts ? base.ts.slice(11, 16) : horaHM(), obs: base.obs || '' };
      memoE = e;
      if (base.paceMinKm == null && e.distKm && e.durMin) e.paceMinKm = e.durMin / e.distKm;
      let ult = [];
      const ehMi = () => e.unidade === 'mi';
      const kmU = km => (km == null ? null : ehMi() ? AT.kmParaMi(km) : km);
      const fromU = v => (v == null ? null : ehMi() ? AT.miParaKm(v) : v);

      const inputs = {};
      const kcalBox = h('div', { class: 'totais-conf', 'aria-live': 'polite' });
      function velKmh() { return e.paceMinKm ? AT.paceParaVel(e.paceMinKm) : null; }
      function metAtual() { return AT.metDaAtividade({ atividade: id, intensidade: e.intensidade, velKmh: velKmh(), indoor: e.indoor, estilo: e.estilo, terrenoSubida: e.subida }); }
      function recalcKcal() {
        const met = metAtual(); const k = AT.kcalAtividade(met, peso(), e.durMin);
        limpar(kcalBox).append(h('span', null, h('b', null, e.durMin ? n0(k) : '–'), ' kcal gastas'), h('span', { class: 'mudo' }, `MET ${n1(met)} · ${n0(peso())} kg`), h('span', { class: 'estimativa' }, 'estimativa'));
        return { met, k };
      }
      function pintar(exceto) {
        const set = (nome, v) => { if (inputs[nome] && nome !== exceto) inputs[nome].value = v; };
        set('dist', fmtNum(kmU(e.distKm))); set('dur', fmtNum(e.durMin, 1)); set('pace', e.paceMinKm ? AT.formatarPace(ehMi() ? AT.paceKmParaMi(e.paceMinKm) : e.paceMinKm) : '');
        set('vel', fmtNum(velKmh() == null ? null : (ehMi() ? AT.kmParaMi(velKmh()) : velKmh()), 1));
        set('metros', fmtNum(e.metros, 0)); set('pace100', e.pace100 ? AT.formatarPace(e.pace100) : '');
        recalcKcal();
      }
      function editou(campoNome, valor) {
        // converte para a forma canônica e recalcula o campo que falta usando os dois últimos editados
        if (campoNome === 'dist') e.distKm = fromU(valor);
        else if (campoNome === 'dur') e.durMin = valor;
        else if (campoNome === 'pace') e.paceMinKm = valor == null ? null : (ehMi() ? AT.paceMiParaKm(valor) : valor);
        else if (campoNome === 'vel') { const kmh = valor == null ? null : (ehMi() ? AT.miParaKm(valor) : valor); e.paceMinKm = kmh ? AT.velParaPace(kmh) : null; campoNome = 'pace'; }
        else if (campoNome === 'metros') e.metros = valor;
        else if (campoNome === 'pace100') e.pace100 = valor;
        ult = [campoNome, ...ult.filter(c => c !== campoNome)].slice(0, 2);
        if (cat.tipo === 'natacao') {
          const d = { metros: ult.includes('metros') ? e.metros : null, durMin: ult.includes('dur') ? e.durMin : null, pace100: ult.includes('pace100') ? e.pace100 : null };
          const r = AT.resolverNatacao(d);
          if (ult.length >= 2) { if (!ult.includes('metros')) e.metros = r.metros; if (!ult.includes('dur')) e.durMin = r.durMin; if (!ult.includes('pace100')) e.pace100 = r.pace100; }
        } else if (cat.tipo === 'ritmo' || (cat.tipo === 'bike' && !e.indoor)) {
          const d = { distKm: ult.includes('dist') ? e.distKm : null, durMin: ult.includes('dur') ? e.durMin : null, paceMinKm: ult.includes('pace') ? e.paceMinKm : null };
          const r = AT.resolverRitmo(d);
          if (ult.length >= 2) { if (!ult.includes('dist')) e.distKm = r.distKm; if (!ult.includes('dur')) e.durMin = r.durMin; if (!ult.includes('pace')) e.paceMinKm = r.paceMinKm; }
        }
        pintar(campoNome === 'pace' && inputs.vel && document.activeElement === inputs.vel ? 'vel' : campoNome);
      }
      const numCampo = (nome, rotulo, ajuda, parse = lerNumero, valor = '') => { const i = entradaNum(valor, { inputmode: 'decimal', onchange: ev => editou(nome, parse(ev.target.value)) }); inputs[nome] = i; return campo(rotulo, i, ajuda); };

      const partes = [];
      partes.push(h('button', { class: 'btn btn-fantasma', type: 'button', onclick: () => (editar ? fechar(undefined) : arvore(null)) }, icone('esq', 18), editar ? 'Cancelar' : 'Outra atividade'), h('h3', null, cat.nome));
      if (cat.pedeNome) partes.push(campo('Qual atividade?', h('input', { type: 'text', value: e.nomeLivre, placeholder: 'Ex.: surfe, patinação', oninput: ev => { e.nomeLivre = ev.target.value; } })));
      if (cat.tipo === 'natacao') partes.push(campo('Estilo', selecao(Object.entries(cat.estilos).map(([k, v]) => [k, v[0]]), e.estilo, { onchange: ev => { e.estilo = ev.target.value; recalcKcal(); } })));
      if (cat.tipo === 'bike') partes.push(h('fieldset', null, h('legend', null, 'Onde'), chips([['out', 'Rua / estrada'], ['in', 'Bicicleta ergométrica']], e.indoor ? 'in' : 'out', v => { e.indoor = v === 'in'; formularioRender(); }, { rotuloGrupo: 'Local' })));
      if (cat.terreno) partes.push(h('fieldset', null, h('legend', null, 'Terreno'), chips([['plano', 'Plano'], ['subida', 'Subida / trilha']], e.subida ? 'subida' : 'plano', v => { e.subida = v === 'subida'; recalcKcal(); }, { rotuloGrupo: 'Terreno' })));
      partes.push(h('fieldset', null, h('legend', null, 'Intensidade'), chips(cat.intensidades, e.intensidade, v => { e.intensidade = v; recalcKcal(); }, { rotuloGrupo: 'Intensidade' })));
      const usaRitmo = cat.tipo === 'ritmo' || (cat.tipo === 'bike' && !e.indoor);
      if (usaRitmo) {
        const ehBike = cat.tipo === 'bike';
        partes.push(h('fieldset', null, h('legend', null, 'Unidade de distância'), chips([['km', 'Quilômetros'], ['mi', 'Milhas']], e.unidade, v => { e.unidade = v; ult = ult.slice(); pintar(); rotulos(); }, { rotuloGrupo: 'Unidade' })));
        const rot = h('div', { class: 'grade-2' });
        function rotulos() {
          limpar(rot);
          const u = ehMi() ? 'mi' : 'km';
          juntar(rot, numCampo('dist', `Distância (${u})`, null, lerNumero, fmtNum(kmU(e.distKm))), numCampo('dur', 'Duração (min ou h:mm)', null, lerDuracao, fmtNum(e.durMin, 1)),
            ehBike ? null : numCampo('pace', `Ritmo (min/${u})`, 'Ex.: 5:30', AT.lerPace, e.paceMinKm ? AT.formatarPace(ehMi() ? AT.paceKmParaMi(e.paceMinKm) : e.paceMinKm) : ''),
            numCampo('vel', `Velocidade (${ehMi() ? 'mi/h' : 'km/h'})`, null, lerNumero, fmtNum(velKmh() == null ? null : (ehMi() ? AT.kmParaMi(velKmh()) : velKmh()), 1)));
        }
        rotulos(); partes.push(rot, h('p', { class: 'ajuda' }, 'Preencha dois entre distância, duração e ritmo (ou velocidade): o terceiro é calculado. Sem esses dados, usamos só a intensidade.'));
      } else if (cat.tipo === 'natacao') {
        partes.push(h('div', { class: 'grade-2' }, numCampo('metros', 'Distância (m)', null, lerNumero, fmtNum(e.metros, 0)), numCampo('dur', 'Duração (min ou h:mm)', null, lerDuracao, fmtNum(e.durMin, 1)), numCampo('pace100', 'Ritmo (min/100 m)', 'Ex.: 2:00', AT.lerPace, e.pace100 ? AT.formatarPace(e.pace100) : '')),
          h('p', { class: 'ajuda' }, 'Preencha dois entre metros, duração e ritmo: o terceiro é calculado.'));
      } else {
        partes.push(numCampo('dur', 'Duração (min ou h:mm)', null, lerDuracao, fmtNum(e.durMin, 1)));
        if (cat.tipo === 'bike' && e.indoor) { /* só intensidade e duração */ }
      }
      const inpData = h('input', { type: 'date', value: e.data, max: dataISO(), onchange: ev => { e.data = ev.target.value; } });
      const inpHora = h('input', { type: 'time', value: e.hora, onchange: ev => { e.hora = ev.target.value; } });
      partes.push(h('div', { class: 'grade-2' }, campo('Data', inpData), campo('Horário', inpHora)),
        campo('Observação (opcional)', h('textarea', { rows: 2, placeholder: 'Como foi, local, percepção…', oninput: ev => { e.obs = ev.target.value; } }, e.obs)),
        kcalBox,
        h('div', { class: 'linha-botoes' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: salvar }, icone('ok', 18), editar ? 'Salvar alterações' : 'Salvar atividade')));
      function salvar() {
        if (!e.durMin) { aviso('Informe a duração (ou dois entre distância, duração e ritmo).'); return; }
        const { met, k } = recalcKcal();
        const reg = { ...(editar ? { id: editar.id } : {}), ts: tsLocal(e.data || data, e.hora || horaHM()), atividade: id, intensidade: e.intensidade, unidade: e.unidade, distKm: e.distKm, metros: e.metros, durMin: e.durMin, paceMinKm: e.paceMinKm, pace100: e.pace100, velKmh: velKmh(), estilo: cat.tipo === 'natacao' ? e.estilo : undefined, indoor: cat.tipo === 'bike' ? e.indoor : undefined, subida: cat.terreno ? e.subida : undefined, nomeLivre: e.nomeLivre || undefined, mets: met, kcal: Math.round(k), obs: e.obs || undefined };
        const r = store.salvar('atividades', reg);
        aviso(`Atividade registrada: ~${n0(r.kcal)} kcal (estimativa).`, { acao: editar ? null : 'Desfazer', aoAcao: () => { store.remover('atividades', r.id); document.dispatchEvent(new CustomEvent('atlas:atualizar')); } });
        fechar({ salvo: true, data: e.data });
      }
      function formularioRender() { formulario(id); }
      pintar();
      juntar(raiz, partes);
    }

    if (editar) formulario(editar.atividade); else inicio();
    return raiz;
  }, { larga: true });
}
