// Fichas prontas sugeridas. A "Semanal Seg–Sáb (original)" é a ficha real do Eric (ce3ba1ac-analise-treino-referencia.md):
// cada exercício traz a porção enfatizada e o porquê, vindos da análise de referência.
// A ficha original NÃO traz séries, repetições nem descanso: eles são definidos aqui pelos padrões do planner
// conforme a experiência e o objetivo da pessoa.
// A "Semanal Seg–Sáb (ajustada)" (id semanal-seg-sab-v2, ficha principal) aplica a opção A do relatório
// docs/analise-ficha-semanal.md (seção 7) e usa PRESCRIÇÃO FIXA por exercício: cada item traz series, reps e descanso
// (e, opcionalmente, descansoMax e obs). Itens com opcional:true aparecem na pré-visualização, mas não entram no plano.
// Modelo retrocompatível: item sem series/reps/descanso continua usando o planner.
import { exPorId, ativacao } from './exercises.js';
import { prescricao } from './planner.js';

const ORIGINAL = {
  'semanal-seg-sab': {
    id: 'semanal-seg-sab',
    nome: 'Semanal Seg–Sáb (original)',
    versaoAjustada: 'semanal-seg-sab-v2',
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

// ---------------------------------------------------------------------------
// Ficha AJUSTADA (principal): opção A do relatório docs/analise-ficha-semanal.md, seção 7.
// Mesmos dias e grupos da original; trocas pontuais e prescrição fixa (séries × repetições, descanso, ordem).
const AJUSTADA = {
  'semanal-seg-sab-v2': {
    id: 'semanal-seg-sab-v2',
    nome: 'Semanal Seg–Sáb (ajustada)',
    original: 'semanal-seg-sab',
    prescricaoFixa: true,
    resumo: 'Os mesmos seis dias da ficha original, com trocas pontuais baseadas em estudos de hipertrofia: tríceps acima da cabeça, deltoide lateral 2x por semana, panturrilha com pausa alongada, peito com crucifixo e abdômen variado. Séries, repetições, descanso e ordem já vêm prontos.',
    equipamento: 'academia',
    aviso: 'A prescrição (séries, repetições e descanso) foi pensada para quem já treina há um tempo. Se você está começando, faça uma série a menos por exercício. As evidências variam: muita coisa vem de estudos de ativação muscular (EMG), que não medem crescimento. O relatório completo tem os selos de evidência.',
    principios: [
      'Mesma porção com ângulo ou curva de resistência diferente não é redundância (supino reto e inclinado). Mesmo ângulo e mesma curva é: por isso a corda saiu do tríceps e o crucifixo inclinado entrou no lugar do squeeze press.',
      'O alongamento conta: tríceps francês acima da cabeça (Maeo 2022), crucifixo inclinado, extensora reclinada, cadeira flexora sentada (Maeo 2021) e panturrilha com pausa embaixo (Kassiano 2023).',
      'Deltoide lateral passou a ser treinado 2x por semana (quarta e sexta): era a maior lacuna de volume da ficha original.',
      'Músculos pequenos cansam rápido: ficam no fim do dia, em poucos exercícios diretos.',
      'Hip thrust e agachamento deram ganho de glúteo parecido em um estudo de hipertrofia (Plotkin 2023). O hip thrust fica por ser seguro, carregável e complementar, mas o glúteo secundário do agachamento também conta.',
      'Trocas pontuais, não reforma: mesmos dias e grupos, 116 séries por semana (a original tem 114). Isquiotibiais: extensão de quadril 3 + 3 séries em dois dias (terça e quinta) e flexão de joelho 4 séries na quinta.',
    ],
    mudancas: [
      'Segunda: tríceps francês na polia (acima da cabeça) no lugar da corda; coice sai da lista e vira finalizador opcional; mergulho na versão de tríceps abre o dia; crunch vira abdominal na polia; encolhimento opcional. Tríceps direto cai de 15 para 12 séries.',
      'Terça: a mesa flexora sai e entra o stiff unilateral com halteres (3 × 8-12, depois do leg press); cadeira extensora com encosto reclinado (reto femoral alongado); panturrilha sobe de 3 para 4 séries, com pausa de 1 a 2 s embaixo.',
      'Quarta: entra elevação lateral na polia (3 séries); face pull cai de 4 para 3 séries de 12 a 20 repetições, com 60 s de descanso.',
      'Quinta: ordem reorganizada (hip thrust, stiff e hack antes dos isoladores); hack de 4 séries de 6-10 para 3 de 8-12; cadeira flexora de 3 para 4 séries (agora a única flexão de joelho da semana); panturrilha sentado com 4 séries e pausa alongada.',
      'Sexta: elevação lateral de 3 para 4 séries (última com drop-set); rosca inclinada com halteres no lugar da rosca direta.',
      'Sábado: crucifixo inclinado no lugar do squeeze press; supino inclinado a 30° (não 45°); roda abdominal no lugar do crunch.',
      'Prescrição fixa em todos os exercícios, em vez dos padrões do planner. Panturrilha vai de 6 para 8 séries por semana e deltoide lateral de 3 para 7 diretas.',
    ],
    dias: [
      { dow: 1, titulo: 'Segunda · Tríceps + Abdominais',
        blocos: [{ grupo: 'triceps', porcoes: ['tri_longa', 'tri_lateral', 'tri_medial'] }, { grupo: 'abdomen', porcoes: ['abd_reto'] }],
        nota: 'As três cabeças do tríceps em ângulos diferentes, agora com um exercício de verdade acima da cabeça. 15 séries, cerca de 40 min.',
        itens: [
          { ex: 'mergulho-paralelas-triceps', bloco: 'triceps', porcao: 'Composto: as três cabeças do tríceps (tronco mais reto)', alvo: ['tri_lateral', 'tri_medial'], series: 3, reps: '6-10', descanso: 120, descansoMax: 150,
            por: 'Composto pesado primeiro, quando há mais força, com carga alta nas três cabeças. Tronco mais reto tira a ênfase do peitoral e a põe no tríceps.', mudou: 'Versão de tríceps do mergulho (a original usava a de peito) e passa para o começo do dia.' },
          { ex: 'triceps-testa-barra', bloco: 'triceps', porcao: 'Cabeça longa, alongamento parcial (cotovelos um pouco atrás da cabeça)', alvo: ['tri_longa'], series: 3, reps: '8-12', descanso: 90,
            por: 'Com os cotovelos levemente atrás da cabeça, a cabeça longa fica mais alongada. Evidência moderada, por extrapolação de Maeo 2022 (que testou a polia acima da cabeça).', mudou: 'Barra EZ e prescrição fixa de 8 a 12 repetições com 90 s.' },
          { ex: 'triceps-frances-polia', bloco: 'triceps', porcao: 'Cabeça longa, braço acima da cabeça (alongamento)', alvo: ['tri_longa'], series: 3, reps: '10-15', descanso: 75,
            por: 'Acima da cabeça a cabeça longa trabalha alongada, e foi onde ela mais cresceu: +28,5% contra +19,6% com o braço ao lado (Maeo 2022).', mudou: 'Entra no lugar da corda, que repetia o unilateral (lateral e medial com o braço ao lado).' },
          { ex: 'triceps-unilateral-polia', bloco: 'triceps', porcao: 'Cabeça lateral', alvo: ['tri_lateral'], series: 3, reps: '10-15', descanso: 60, descansoMax: 75,
            por: 'Cabeça lateral com tensão constante da polia, um braço de cada vez, no fim do dia, quando o tríceps já está cansado.' },
          { ex: 'abdominal-polia', bloco: 'abdomen', porcao: 'Reto abdominal, com carga progressiva', alvo: ['abd_reto'], series: 3, reps: '10-15', descanso: 60,
            por: 'Crunch no cabo permite sobrecarga progressiva. Enrole o tronco; não puxe com os braços nem dobre só o quadril.', mudou: 'Troca o crunch no solo, que se repetia no sábado sem estímulo novo.' },
          { ex: 'encolhimento-halteres', bloco: 'costas', porcao: 'Trapézio superior', alvo: ['trap_sup'], series: 3, reps: '10-15', descanso: 75, opcional: true,
            por: 'Trapézio superior, que a ficha original não treinava direto. Base: prática de treinadores, sem estudo específico.', mudou: 'Opcional: aproveita a folga que o coice deixou na segunda.' },
          { ex: 'triceps-coice', bloco: 'triceps', porcao: 'Cabeça lateral/medial, pico de contração (finalizador)', alvo: ['tri_lateral', 'tri_medial'], series: 2, reps: '12-15', descanso: 45, opcional: true,
            por: 'Fica só como finalizador: é o terceiro exercício com o braço ao lado ou atrás do corpo, com a mesma curva da polia.', mudou: 'Sai da lista fixa (de 3 para 2 séries, opcional); tríceps direto cai de 15 para 12 séries, dentro da faixa de 10 a 20.' },
        ] },
      { dow: 2, titulo: 'Terça · Perna 1',
        blocos: [{ grupo: 'quadriceps', porcoes: ['reto_fem', 'vastos'] }, { grupo: 'gluteos', porcoes: ['adutores'] }, { grupo: 'posteriores', porcoes: ['isq_quadril'] }, { grupo: 'panturrilha', porcoes: ['gastroc'] }],
        nota: 'Dia de quadríceps, com o posterior em extensão de quadril (stiff unilateral), logo depois dos compostos de quadríceps e antes dos isoladores. A flexão de joelho fica concentrada na quinta. A extensora reclinada reforça o reto femoral e a panturrilha ganha volume. 20 séries, cerca de 48 min.',
        itens: [
          { ex: 'agachamento-livre', bloco: 'quadriceps', porcao: 'Quadríceps (vastos) + glúteo, composto', alvo: ['vastos'], series: 4, reps: '6-10', descanso: 150,
            por: 'Composto principal: vastos e glúteo máximo com resistência máxima no fundo, onde estão alongados.' },
          { ex: 'leg-press-45', bloco: 'quadriceps', porcao: 'Quadríceps (vastos), composto guiado', alvo: ['vastos'], series: 3, reps: '8-12', descanso: 120,
            por: 'Mais volume de quadríceps com menos exigência de equilíbrio e de lombar que o agachamento.' },
          { ex: 'stiff-unilateral-halter', bloco: 'posteriores', porcao: 'Isquiotibiais + glúteo máximo: extensão de quadril, unilateral', alvo: ['isq_quadril', 'glut_max'], series: 3, reps: '8-12', descanso: 90, descansoMax: 120,
            por: 'Segunda exposição da semana à extensão de quadril (a primeira é o stiff com barra de quinta), com carga menor e demanda de estabilização, e por isso o glúteo médio trabalha como estabilizador. Fica depois dos compostos de quadríceps e antes dos isoladores: é um multiarticular que pede técnica e força, então vem antes de a perna cansar.', mudou: 'Entra no lugar da mesa flexora, que repetia o padrão de flexão de joelho da cadeira flexora sentada, a que cresce mais (Maeo 2021). A flexão de joelho fica concentrada na quinta (4 séries); aqui a perna recebe extensão de quadril (3 séries, mais 3 de quinta).' },
          { ex: 'cadeira-extensora-reclinada', bloco: 'quadriceps', porcao: 'Reto femoral alongado + vastos', alvo: ['reto_fem'], series: 3, reps: '10-15', descanso: 75,
            por: 'O reto femoral cresce pouco nos agachamentos; a extensão de joelho é o que o treina de fato.', mudou: 'Encosto reclinado (quadril mais aberto): o reto femoral fica alongado e cresceu mais que com o quadril a 90° (estudo de 2025 com não treinados; evidência moderada).' },
          { ex: 'cadeira-adutora', bloco: 'gluteos', porcao: 'Adutores', alvo: ['adutores'], series: 3, reps: '10-15', descanso: 75,
            por: 'Adutores recebem pouco estímulo direto nos agachamentos.' },
          { ex: 'panturrilha-leg-press', bloco: 'panturrilha', porcao: 'Gastrocnêmio (joelho estendido), com pausa alongada', alvo: ['gastroc'], series: 4, reps: '10-15', descanso: 60, descansoMax: 75, obs: 'pausa de 1 a 2 s embaixo',
            por: 'Gastrocnêmio com o joelho estendido (Kinoshita 2023). Amplitude total e pausa de 1 a 2 s na posição alongada.', mudou: 'De 3 para 4 séries: a semana tinha 6 séries de panturrilha, abaixo do mínimo do planner (7). A posição alongada parece render mais (Kassiano 2023).' },
        ] },
      { dow: 3, titulo: 'Quarta · Costas + Ombro',
        blocos: [{ grupo: 'costas', porcoes: ['dorsal', 'trap_med'] }, { grupo: 'ombros', porcoes: ['delt_lat', 'delt_post'] }],
        nota: 'Costas com largura, espessura e alongamento, e o deltoide lateral ganha um segundo estímulo na semana. O deltoide posterior segue com só dois exercícios. 22 séries, cerca de 52 min.',
        itens: [
          { ex: 'barra-fixa-pronada', bloco: 'costas', porcao: 'Grande dorsal: largura', alvo: ['dorsal'], series: 4, reps: '5-10', descanso: 120, descansoMax: 150,
            por: 'Largura do dorsal, puxada vertical com o peso do corpo.' },
          { ex: 'remada-serrote-halter', bloco: 'costas', porcao: 'Grande dorsal + trapézio: espessura unilateral, grande amplitude', alvo: ['dorsal'], series: 3, reps: '8-12', descanso: 90, descansoMax: 120,
            por: 'Espessura, unilateral e com amplitude maior que as remadas bilaterais.' },
          { ex: 'remada-baixa-triangulo', bloco: 'costas', porcao: 'Trapézio médio + romboides: espessura bilateral', alvo: ['trap_med'], series: 3, reps: '8-12', descanso: 90,
            por: 'Espessura bilateral, com a retração das escápulas (trapézio médio e romboides).' },
          { ex: 'pullover-halter', bloco: 'costas', porcao: 'Grande dorsal: alongamento', alvo: ['dorsal'], series: 3, reps: '10-15', descanso: 75,
            por: 'Alongamento do dorsal, o ângulo que nenhuma remada ou puxada cobre. Evidência fraca; o peitoral também ajuda, conforme o cotovelo.' },
          { ex: 'elevacao-lateral-polia', bloco: 'ombros', porcao: 'Deltoide lateral (polia, tensão constante)', alvo: ['delt_lat'], series: 3, reps: '12-20', descanso: 60,
            por: 'Na polia a tensão não some embaixo, ao contrário dos halteres. Dá ao deltoide lateral um segundo estímulo na semana.', mudou: 'Adicionado: o deltoide lateral só tinha 3 séries diretas em 1x por semana, a maior lacuna de volume da ficha.' },
          { ex: 'face-pull', bloco: 'ombros', porcao: 'Deltoide posterior + rotação externa do manguito', alvo: ['delt_post'], series: 3, reps: '12-20', descanso: 60,
            por: 'Deltoide posterior e manguito (rotação externa), com carga leve e repetições altas.', mudou: 'De 4 séries de 6-10 repetições e 150 s para 3 de 12-20 e 60 s: é um exercício leve, não um composto pesado.' },
          { ex: 'crucifixo-inverso-polia', bloco: 'ombros', porcao: 'Deltoide posterior isolado', alvo: ['delt_post'], series: 3, reps: '12-20', descanso: 60,
            por: 'Isola o deltoide posterior com uma curva de resistência diferente do face pull. Só 2 diretos: mais que isso cansa demais um músculo pequeno.' },
        ] },
      { dow: 4, titulo: 'Quinta · Perna 2',
        blocos: [{ grupo: 'gluteos', porcoes: ['glut_max', 'glut_med'] }, { grupo: 'posteriores', porcoes: ['isq_quadril', 'isq_joelho'] }, { grupo: 'quadriceps', porcoes: ['vastos'] }, { grupo: 'panturrilha', porcoes: ['soleo'] }],
        nota: 'Mesmos exercícios da original, reordenados: os compostos pesados vêm antes dos isoladores. 20 séries, cerca de 48 min.',
        itens: [
          { ex: 'elevacao-pelvica-barra', bloco: 'gluteos', porcao: 'Glúteo máximo (extensão final de quadril)', alvo: ['glut_max'], series: 3, reps: '8-12', descanso: 120,
            por: 'Trabalha o glúteo máximo na extensão final de quadril, onde ele mais contrai. A hipertrofia foi parecida com a do agachamento (Plotkin 2023); fica por ser seguro e carregável.', mudou: 'Prescrição fixa mais pesada (8-12 repetições, 120 s), coerente com um composto.' },
          { ex: 'stiff-barra', bloco: 'posteriores', porcao: 'Isquiotibiais + glúteo: extensão de quadril, alongados', alvo: ['isq_quadril'], series: 3, reps: '8-12', descanso: 120,
            por: 'Cadeia posterior em extensão de quadril, com alongamento do posterior; favorece a cabeça longa do bíceps femoral (Bourne 2017).', mudou: 'Sobe na ordem (antes vinha depois da abdutora) e passa a 8-12 repetições com 120 s.' },
          { ex: 'hack-squat', bloco: 'quadriceps', porcao: 'Quadríceps (vastos), agachamento guiado', alvo: ['vastos'], series: 3, reps: '8-12', descanso: 120,
            por: 'Vastos em máquina guiada, com o tronco apoiado, logo depois do hip thrust e do stiff.', mudou: 'De 4 séries de 6-10 para 3 de 8-12 e sobe na ordem, em vez de ficar depois dos isoladores.' },
          { ex: 'cadeira-flexora', bloco: 'posteriores', porcao: 'Isquiotibiais biarticulares (quadril flexionado)', alvo: ['isq_joelho'], series: 4, reps: '10-15', descanso: 75,
            por: 'Sentada, os isquiotibiais biarticulares ficam alongados e cresceram mais que na mesa: +14% contra +9% (Maeo 2021).', mudou: 'De 3 para 4 séries. Passa a ser o único exercício de flexão de joelho da semana (a mesa flexora de terça saiu), por isso o volume sobe.' },
          { ex: 'cadeira-abdutora', bloco: 'gluteos', porcao: 'Glúteo médio/mínimo', alvo: ['glut_med'], series: 3, reps: '12-15', descanso: 60,
            por: 'Glúteo médio e mínimo, que os outros exercícios do dia não pegam. A máquina sentada ativa menos o glúteo médio que a abdução deitada (evidência fraca).' },
          { ex: 'panturrilha-sentado-maquina', bloco: 'panturrilha', porcao: 'Sóleo (joelho flexionado), com pausa alongada', alvo: ['soleo'], series: 4, reps: '10-15', descanso: 60, descansoMax: 75, obs: 'pausa de 1 a 2 s embaixo',
            por: 'Joelho flexionado coloca o sóleo para trabalhar, complementando o gastrocnêmio de terça. Pausa de 1 a 2 s na posição alongada.', mudou: 'De 3 para 4 séries (panturrilha: 6 para 8 por semana).' },
        ] },
      { dow: 5, titulo: 'Sexta · Bíceps + Ombro',
        blocos: [{ grupo: 'biceps', porcoes: ['bic_longa', 'bic_curta', 'braquial'] }, { grupo: 'ombros', porcoes: ['delt_lat', 'delt_ant'] }],
        nota: 'Puxada neutra e desenvolvimento primeiro; deltoide lateral com 4 séries e a rosca inclinada alonga o bíceps. 20 séries, cerca de 47 min.',
        itens: [
          { ex: 'barra-fixa-neutra', bloco: 'biceps', porcao: 'Braquial/braquiorradial + bíceps; segundo estímulo do dorsal', alvo: ['braquial'], series: 4, reps: '6-10', descanso: 120,
            por: 'Puxada em pegada neutra: braquial e braquiorradial trabalham muito, o bíceps ajuda e o dorsal ganha o segundo estímulo da semana.' },
          { ex: 'arnold-press', bloco: 'ombros', porcao: 'Deltoide anterior + lateral, composto', alvo: ['delt_ant'], series: 3, reps: '8-12', descanso: 120,
            por: 'Composto de empurrar acima da cabeça, que nenhum outro dia tinha. Vem antes das roscas, com os ombros descansados.', mudou: 'Sobe na ordem (antes era o último exercício do dia).' },
          { ex: 'elevacao-lateral-halteres', bloco: 'ombros', porcao: 'Deltoide lateral', alvo: ['delt_lat'], series: 4, reps: '12-20', descanso: 60, descansoMax: 75, obs: 'última série com drop-set',
            por: 'Deltoide lateral, que dá a largura dos ombros, agora com mais volume. A tensão é maior no alto e quase nula embaixo.', mudou: 'De 3 para 4 séries, com drop-set na última (somada à quarta, são 7 séries diretas por semana).' },
          { ex: 'rosca-martelo', bloco: 'biceps', porcao: 'Braquial/braquiorradial', alvo: ['braquial'], series: 3, reps: '10-12', descanso: 75,
            por: 'Isola o braquial e o braquiorradial, que dão espessura ao braço.' },
          { ex: 'rosca-inclinada-halteres', bloco: 'biceps', porcao: 'Bíceps alongado (ombro em extensão)', alvo: ['bic_longa'], series: 3, reps: '10-15', descanso: 75,
            por: 'Com os braços atrás do tronco o bíceps (biarticular) fica alongado, em linha com o princípio do alongamento.', mudou: 'Entra no lugar da rosca direta (cuja "cabeça longa" não tem apoio em estudos); o drop-set migrou para a elevação lateral.' },
          { ex: 'rosca-scott', bloco: 'biceps', porcao: 'Bíceps distal em posição alongada', alvo: ['bic_curta'], series: 3, reps: '10-15', descanso: 75,
            por: 'Apoio do braço e torque forte no começo: o ganho comprovado é regional, no bíceps distal alongado (Pedrosa 2023). As duas roscas se complementam.' },
        ] },
      { dow: 6, titulo: 'Sábado · Peitoral + Abdominais',
        blocos: [{ grupo: 'peito', porcoes: ['peit_clav', 'peit_ester', 'peit_costal'] }, { grupo: 'abdomen', porcoes: ['abd_reto'] }],
        nota: 'Dois supinos, um isolador com o peitoral alongado e dois de adução; a roda abdominal fecha o dia. 19 séries, cerca de 46 min.',
        itens: [
          { ex: 'supino-reto-barra', bloco: 'peito', porcao: 'Peitoral geral (esternal)', alvo: ['peit_ester'], series: 4, reps: '6-10', descanso: 150,
            por: 'Peitoral como um todo, o composto mais pesado do dia.' },
          { ex: 'supino-inclinado-barra', bloco: 'peito', porcao: 'Peitoral clavicular (supino a 30°)', alvo: ['peit_clav'], series: 3, reps: '6-10', descanso: 150,
            por: 'Região clavicular. A cerca de 30° ela é mais ativada; a 45° o deltoide anterior assume (EMG, Trebs 2010; Lauver 2016).', mudou: 'Banco a 30° em vez de 45°.' },
          { ex: 'crucifixo-inclinado-halteres', bloco: 'peito', porcao: 'Peitoral clavicular, alongado', alvo: ['peit_clav'], series: 3, reps: '10-15', descanso: 90,
            por: 'Alonga o peitoral, o que hoje só os supinos faziam; os outros isoladores trabalham com o músculo encurtado.', mudou: 'Entra no lugar do squeeze press ("peitoral interno" não existe como região separada).' },
          { ex: 'voador-peck-deck', bloco: 'peito', porcao: 'Peitoral, adução no encurtamento', alvo: ['peit_ester'], series: 3, reps: '12-15', descanso: 75,
            por: 'Isolado, sem o tríceps limitando a carga; tensão máxima no fim do movimento.' },
          { ex: 'crossover-polia-alta', bloco: 'peito', porcao: 'Peitoral inferior, adução de cima para baixo', alvo: ['peit_costal'], series: 3, reps: '12-15', descanso: 75,
            por: 'Adução com tensão constante da polia, de cima para baixo. Seletividade regional não comprovada.' },
          { ex: 'roda-abdominal', bloco: 'abdomen', porcao: 'Reto abdominal + transverso (anti-extensão)', alvo: ['abd_reto'], series: 3, reps: '8-12', descanso: 60,
            por: 'Anti-extensão: reto abdominal, transverso e oblíquos com menos flexor de quadril (Escamilla 2006).', mudou: 'Entra no lugar do crunch, que repetia o de segunda. Se pesar na lombar, volte ao crunch.' },
        ] },
    ],
  },
};

export const FICHA_PRINCIPAL = 'semanal-seg-sab-v2';
export const FICHA_SECUNDARIA = 'semanal-seg-sab';
/** Ordem importa: a principal (ajustada) vem primeiro, a original é a segunda opção. */
export const FICHAS = { [FICHA_PRINCIPAL]: AJUSTADA[FICHA_PRINCIPAL], ...ORIGINAL };

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
    const exercicios = d.itens.filter(it => !it.opcional).map(it => {
      const ex = exPorId(it.ex);
      const i = idx[it.bloco] = (idx[it.bloco] ?? -1) + 1;
      const fixa = it.series != null && it.reps != null && it.descanso != null; // prescrição fixa (ficha ajustada)
      const pr = fixa ? null : prescricao(ex, perfil);
      const item = { exId: it.ex, bloco: it.bloco, series: fixa ? it.series : seriesPadrao(ex, i, perfil), reps: fixa ? it.reps : pr.reps, descanso: fixa ? it.descanso : pr.descanso, porcoesAlvo: d.blocos.find(b => b.grupo === it.bloco).porcoes,
        justificativa: `Na sua ficha: ${it.porcao}. ${it.por}${it.mudou ? ' O que mudou: ' + it.mudou : ''} ${d.nota}` };
      if (fixa) { if (it.descansoMax) item.descansoMax = it.descansoMax; if (it.obs) item.obs = it.obs; }
      return item;
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

/** Texto do descanso de um item (aceita faixa: 120–150 s). */
export function textoDescanso(it) { return it.descansoMax && it.descansoMax !== it.descanso ? `${it.descanso}–${it.descansoMax} s` : `${it.descanso} s`; }

/** Linha de prescrição de um item de ficha ou de plano: "3 séries × 8-12 repetições · descanso 90 s". */
export function textoPrescricao(it) {
  return `${it.series} séries × ${it.reps}${/s$/.test(it.reps) ? '' : ' repetições'} · descanso ${textoDescanso(it)}${it.obs ? ' · ' + it.obs : ''}`;
}
