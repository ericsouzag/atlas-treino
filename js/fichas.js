// Fichas prontas sugeridas. A "Semanal Seg–Sáb" é a ficha real do Eric (ce3ba1ac-analise-treino-referencia.md):
// cada exercício traz a porção enfatizada e o porquê, vindos da análise de referência.
// A ficha original NÃO traz séries, repetições nem descanso: eles são definidos aqui pelos padrões do planner
// conforme a experiência e o objetivo da pessoa.
import { exPorId, ativacao } from './exercises.js';
import { prescricao } from './planner.js';

export const FICHAS = {
  'semanal-seg-sab': {
    id: 'semanal-seg-sab',
    nome: 'Semanal Seg–Sáb',
    resumo: 'Seis dias, de segunda a sábado: tríceps + abdômen, perna 1, costas + ombro, perna 2, bíceps + ombro e peitoral + abdômen. Cada exercício cobre uma porção diferente do músculo.',
    equipamento: 'academia',
    principios: [
      'Dois exercícios na mesma porção, com ângulo ou resistência diferente, não são redundância: supino reto e inclinado trabalham regiões diferentes.',
      'Falta mais o alongamento (pullover para o dorsal, tríceps francês/testa) e o pico de contração (squeeze press, coice) do que o meio do movimento.',
      'Músculos pequenos, como deltoide posterior e trapézio, cansam rápido: no máximo 2 exercícios diretos por dia.',
      'Glúteo como secundário não substitui glúteo como alvo: por isso o hip thrust.',
      'Trocas pontuais, nunca o dia inteiro: a ficha fecha lacunas sem aumentar o volume da sessão.',
    ],
    dias: [
      { dow: 1, titulo: 'Segunda · Tríceps + Abdominais',
        blocos: [{ grupo: 'triceps', porcoes: ['tri_longa', 'tri_lateral', 'tri_medial'] }, { grupo: 'abdomen', porcoes: ['abd_reto'] }],
        nota: 'As 3 cabeças do tríceps aparecem em ângulos diferentes (acima da cabeça, à frente e atrás do corpo), sem redundância real.',
        itens: [
          { ex: 'triceps-testa-barra', bloco: 'triceps', porcao: 'Cabeça longa (braço acima da cabeça, alongamento)', alvo: ['tri_longa'], por: 'Cabeça longa em alongamento: é o ângulo que os outros tríceps do dia não cobrem.' },
          { ex: 'triceps-unilateral-polia', bloco: 'triceps', porcao: 'Cabeça lateral', alvo: ['tri_lateral'], por: 'Cabeça lateral com tensão constante da polia, um braço de cada vez.' },
          { ex: 'triceps-coice', bloco: 'triceps', porcao: 'Cabeça lateral/medial, pico de contração (braço estendido atrás do corpo)', alvo: ['tri_lateral', 'tri_medial'], por: 'Pico de contração com o braço atrás do corpo, ângulo diferente do polia à frente.' },
          { ex: 'triceps-corda', bloco: 'triceps', porcao: 'Cabeça lateral/medial', alvo: ['tri_lateral', 'tri_medial'], por: 'A corda abre no fim do movimento e recruta lateral e medial.' },
          { ex: 'mergulho-paralelas', bloco: 'triceps', porcao: 'Composto: todas as cabeças, com peitoral e deltoide anterior de apoio', alvo: ['tri_lateral', 'tri_medial'], por: 'Composto que permite carga alta nas três cabeças; peitoral e deltoide anterior ajudam.' },
          { ex: 'abdominal-crunch', bloco: 'abdomen', porcao: 'Reto abdominal', alvo: ['abd_reto'], por: 'Flexão de tronco para o reto abdominal.' },
        ] },
      { dow: 2, titulo: 'Terça · Perna 1',
        blocos: [{ grupo: 'quadriceps', porcoes: ['reto_fem', 'vastos'] }, { grupo: 'gluteos', porcoes: ['adutores'] }, { grupo: 'posteriores', porcoes: ['isq_joelho'] }, { grupo: 'panturrilha', porcoes: ['gastroc'] }],
        nota: 'Dia de quadríceps com o posterior em flexão de joelho com o quadril neutro; o sóleo e a flexora sentada ficam para quinta.',
        itens: [
          { ex: 'agachamento-livre', bloco: 'quadriceps', porcao: 'Quadríceps + glúteo, composto', alvo: ['vastos'], por: 'Composto principal, com a maior exigência de equilíbrio e core.' },
          { ex: 'leg-press-45', bloco: 'quadriceps', porcao: 'Quadríceps + glúteo, composto (menos exigência de core que o agachamento)', alvo: ['vastos'], por: 'Mais volume de perna com menos exigência de core que o agachamento.' },
          { ex: 'cadeira-extensora', bloco: 'quadriceps', porcao: 'Quadríceps isolado', alvo: ['reto_fem'], por: 'Isola o reto femoral, que os compostos recrutam pouco.' },
          { ex: 'cadeira-adutora', bloco: 'gluteos', porcao: 'Adutores', alvo: ['adutores'], por: 'Adutores recebem pouco estímulo direto nos agachamentos.' },
          { ex: 'mesa-flexora', bloco: 'posteriores', porcao: 'Isquiotibiais (quadril neutro)', alvo: ['isq_joelho'], por: 'Flexão de joelho com o quadril neutro; a cadeira flexora de quinta usa o quadril flexionado, um ângulo diferente.' },
          { ex: 'panturrilha-leg-press', bloco: 'panturrilha', porcao: 'Gastrocnêmio', alvo: ['gastroc'], por: 'Gastrocnêmio, com o joelho estendido. O sóleo fica para quinta.' },
        ] },
      { dow: 3, titulo: 'Quarta · Costas + Ombro',
        blocos: [{ grupo: 'costas', porcoes: ['dorsal', 'trap_med'] }, { grupo: 'ombros', porcoes: ['delt_post'] }],
        nota: 'A versão original tinha 3 exercícios para o deltoide posterior. Ficaram 2 (face pull + crucifixo inverso), com padrões diferentes, e o espaço virou o pullover, que fecha a lacuna de alongamento do dorsal.',
        itens: [
          { ex: 'barra-fixa-pronada', bloco: 'costas', porcao: 'Grande dorsal: largura', alvo: ['dorsal'], por: 'Largura do dorsal, puxada vertical com o peso do corpo.' },
          { ex: 'remada-serrote-halter', bloco: 'costas', porcao: 'Grande dorsal + trapézio: espessura, unilateral, maior amplitude', alvo: ['dorsal'], por: 'Espessura, unilateral e com amplitude maior que as remadas bilaterais.' },
          { ex: 'remada-baixa-triangulo', bloco: 'costas', porcao: 'Trapézio médio/inferior + dorsal: espessura bilateral', alvo: ['trap_med'], por: 'Espessura bilateral, com foco no trapézio médio e inferior.' },
          { ex: 'pullover-halter', bloco: 'costas', porcao: 'Grande dorsal: alongamento (ângulo que nenhuma remada/puxada cobre)', alvo: ['dorsal'], por: 'Alongamento do dorsal: o ângulo que nenhuma remada ou puxada cobre.' },
          { ex: 'face-pull', bloco: 'ombros', porcao: 'Deltoide posterior + rotação externa do manguito', alvo: ['delt_post'], por: 'Deltoide posterior mais o manguito (rotação externa).' },
          { ex: 'crucifixo-inverso-polia', bloco: 'ombros', porcao: 'Deltoide posterior isolado (curva de resistência diferente do face pull)', alvo: ['delt_post'], por: 'Isola o deltoide posterior com uma curva de resistência diferente do face pull. Só 2 diretos: mais que isso cansa demais um músculo pequeno.' },
        ] },
      { dow: 4, titulo: 'Quinta · Perna 2',
        blocos: [{ grupo: 'gluteos', porcoes: ['glut_max', 'glut_med'] }, { grupo: 'posteriores', porcoes: ['isq_quadril', 'isq_joelho'] }, { grupo: 'quadriceps', porcoes: ['vastos'] }, { grupo: 'panturrilha', porcoes: ['soleo'] }],
        nota: 'Aqui entrou o hip thrust no lugar do segundo exercício unilateral (búlgaro + afundo eram redundantes): nenhum dia tinha glúteo máximo como alvo.',
        itens: [
          { ex: 'elevacao-pelvica-barra', bloco: 'gluteos', porcao: 'Glúteo máximo isolado (extensão final de quadril)', alvo: ['glut_max'], por: 'Agachamentos e afundos recrutam o glúteo só como secundário; o hip thrust trabalha a extensão final de quadril, onde ele mais contrai.' },
          { ex: 'cadeira-abdutora', bloco: 'gluteos', porcao: 'Glúteo médio/mínimo', alvo: ['glut_med'], por: 'Glúteo médio e mínimo, que os outros exercícios do dia não pegam.' },
          { ex: 'stiff-barra', bloco: 'posteriores', porcao: 'Isquiotibiais + glúteo, cadeia posterior', alvo: ['isq_quadril'], por: 'Cadeia posterior em extensão de quadril, com alongamento do posterior.' },
          { ex: 'cadeira-flexora', bloco: 'posteriores', porcao: 'Isquiotibiais (quadril flexionado, ângulo diferente da mesa flexora de terça)', alvo: ['isq_joelho'], por: 'Posterior com o quadril flexionado, ângulo diferente da mesa flexora de terça.' },
          { ex: 'hack-squat', bloco: 'quadriceps', porcao: 'Quadríceps (agachamento 45°)', alvo: ['vastos'], por: 'Quadríceps em máquina guiada, depois do posterior e do glúteo.' },
          { ex: 'panturrilha-sentado-maquina', bloco: 'panturrilha', porcao: 'Sóleo (joelho flexionado, complementa o gastrocnêmio de terça)', alvo: ['soleo'], por: 'Joelho flexionado coloca o sóleo para trabalhar, complementando o gastrocnêmio de terça.' },
        ] },
      { dow: 5, titulo: 'Sexta · Bíceps + Ombro',
        blocos: [{ grupo: 'biceps', porcoes: ['bic_longa', 'bic_curta', 'braquial'] }, { grupo: 'ombros', porcoes: ['delt_lat', 'delt_ant'] }],
        nota: 'A elevação frontal original virou desenvolvimento (Arnold press): o deltoide anterior já recebe estímulo do supino de sábado, e nenhum dia tinha um empurrar acima da cabeça.',
        itens: [
          { ex: 'barra-fixa-neutra', bloco: 'biceps', porcao: 'Braquial/braquiorradial + bíceps secundário', alvo: ['braquial'], por: 'Puxada com pegada neutra: braquial e braquiorradial trabalham muito, o bíceps ajuda.' },
          { ex: 'rosca-martelo', bloco: 'biceps', porcao: 'Braquial/braquiorradial', alvo: ['braquial'], por: 'Isola o braquial e o braquiorradial, que dão espessura ao braço.' },
          { ex: 'rosca-direta-barra', bloco: 'biceps', porcao: 'Bíceps, cabeça longa (drop-set)', alvo: ['bic_longa'], por: 'Cabeça longa; o drop-set final aumenta o volume sem novo exercício.' },
          { ex: 'rosca-scott', bloco: 'biceps', porcao: 'Bíceps, cabeça curta', alvo: ['bic_curta'], por: 'Cabeça curta, com o braço apoiado e o bíceps alongado.' },
          { ex: 'elevacao-lateral-halteres', bloco: 'ombros', porcao: 'Deltoide medial', alvo: ['delt_lat'], por: 'Deltoide medial (lateral), que dá a largura dos ombros.' },
          { ex: 'arnold-press', bloco: 'ombros', porcao: 'Deltoide anterior + medial, composto', alvo: ['delt_ant'], por: 'Composto de empurrar acima da cabeça, que nenhum outro dia da semana tinha.' },
        ] },
      { dow: 6, titulo: 'Sábado · Peitoral + Abdominais',
        blocos: [{ grupo: 'peito', porcoes: ['peit_clav', 'peit_ester', 'peit_costal'] }, { grupo: 'abdomen', porcoes: ['abd_reto'] }],
        nota: 'Este dia já estava redondo. A única correção foi a troca de posição com a quarta-feira: o peck deck voador é peitoral, não dorsal.',
        itens: [
          { ex: 'supino-reto-barra', bloco: 'peito', porcao: 'Peitoral geral', alvo: ['peit_ester'], por: 'Peitoral como um todo, o composto mais pesado do dia.' },
          { ex: 'supino-inclinado-barra', bloco: 'peito', porcao: 'Peitoral superior/clavicular (supino 45°)', alvo: ['peit_clav'], por: 'Região clavicular: supino reto e inclinado não são redundantes, enfatizam regiões diferentes.' },
          { ex: 'voador-peck-deck', bloco: 'peito', porcao: 'Peitoral isolado', alvo: ['peit_ester'], por: 'Isolado, sem o tríceps limitando a carga.' },
          { ex: 'crossover-polia-alta', bloco: 'peito', porcao: 'Peitoral inferior, adução', alvo: ['peit_costal'], por: 'Peitoral inferior, na adução com a polia alta.' },
          { ex: 'squeeze-press-halteres', bloco: 'peito', porcao: 'Peitoral interno/pico de contração', alvo: ['peit_ester'], por: 'Pico de contração do peitoral, com a pressão constante entre os halteres.' },
          { ex: 'abdominal-crunch', bloco: 'abdomen', porcao: 'Reto abdominal', alvo: ['abd_reto'], por: 'Flexão de tronco para o reto abdominal.' },
        ] },
    ],
  },
};

/** Séries por exercício: padrão defensável por experiência e posição (composto principal rende mais). */
function seriesPadrao(ex, indice, perfil) {
  const exp = perfil.experiencia || 'intermediario';
  const pequeno = ['panturrilha', 'abdomen', 'antebraco'].includes(ex.grupoPrincipal);
  if (pequeno) return exp === 'iniciante' ? 2 : 3;
  if (exp === 'iniciante') return 3;
  return ex.composto && indice === 0 ? 4 : 3;
}

/** Converte a ficha no formato de plano do app. Descanso e repetições vêm de prescricao() do planner. */
export function montarPlanoDaFicha(ficha, perfil) {
  const plano = { modo: 'manual', ficha: ficha.id, duracao: 75, criadoEm: new Date().toISOString(), dias: {}, avisos: [], divisao: ficha.resumo };
  const gruposPorDia = {};
  for (const d of ficha.dias) {
    const idx = {};
    const exercicios = d.itens.map(it => {
      const ex = exPorId(it.ex);
      const i = idx[it.bloco] = (idx[it.bloco] ?? -1) + 1;
      const pr = prescricao(ex, perfil);
      return { exId: it.ex, bloco: it.bloco, series: seriesPadrao(ex, i, perfil), reps: pr.reps, descanso: pr.descanso, porcoesAlvo: d.blocos.find(b => b.grupo === it.bloco).porcoes,
        justificativa: `Na sua ficha: ${it.porcao}. ${it.por} ${d.nota}` };
    });
    plano.dias[d.dow] = { titulo: d.titulo.replace(/^[^·]+· /, ''), blocos: d.blocos.map(b => ({ ...b, nivel: 'principal', k: 1 })), exercicios, lacunas: [], totalSeries: exercicios.reduce((s, e) => s + e.series, 0), fichaDia: true };
    gruposPorDia[d.dow] = [...new Set(d.blocos.map(b => b.grupo))];
  }
  const config = { dias: [false, true, true, true, true, true, true], modo: 'manual', gruposPorDia, duracao: 75, ficha: ficha.id };
  return { plano, config };
}

/** Verifica se cada exercício da ficha cobre (como primária) a porção listada. Usado nos testes e nos avisos. */
export function auditarFicha(ficha) {
  const problemas = [];
  for (const d of ficha.dias) for (const it of d.itens) {
    const ex = exPorId(it.ex);
    if (!ex) { problemas.push(`${it.ex}: não existe no banco`); continue; }
    for (const p of it.alvo) if (ativacao(ex, p) < 1) problemas.push(`${it.ex} não cobre ${p} como primária`);
  }
  return problemas;
}

/** Avisos de compatibilidade da ficha com o perfil (equipamento e lesões). */
export function avisosDaFicha(ficha, perfil) {
  const av = [];
  if ((perfil.equipamento || 'academia') !== 'academia') av.push('Esta ficha usa máquinas e polias de academia completa. Com o seu equipamento, vários exercícios não ficam disponíveis.');
  const lesoes = perfil.lesoes || [];
  if (lesoes.length) {
    const conflitos = new Set();
    for (const d of ficha.dias) for (const it of d.itens) { const ex = exPorId(it.ex); if (ex && ex.lesoes.some(l => lesoes.includes(l))) conflitos.add(ex.nome); }
    if (conflitos.size) av.push('Podem sobrecarregar suas limitações: ' + [...conflitos].join(', ') + '. Troque pelo botão "Trocar".');
  }
  return av;
}
