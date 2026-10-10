// Banco de exercícios com músculos modelados em PORÇÕES (cabeças/regiões).
// Lógica baseada na análise de treino de referência (ce3ba1ac-analise-treino-referencia.md):
// cada exercício declara quais porções ativa como PRIMÁRIA (estímulo principal) e SECUNDÁRIA (ajuda).

export const GRUPOS = {
  peito: { nome: 'Peitoral', porcoes: ['peit_clav', 'peit_ester', 'peit_costal'] },
  costas: { nome: 'Costas', porcoes: ['dorsal', 'trap_sup', 'trap_med', 'trap_inf', 'romboides'] },
  ombros: { nome: 'Ombros', porcoes: ['delt_ant', 'delt_lat', 'delt_post'] },
  biceps: { nome: 'Bíceps e braquial', porcoes: ['bic_longa', 'bic_curta', 'braquial'] },
  triceps: { nome: 'Tríceps', porcoes: ['tri_longa', 'tri_lateral', 'tri_medial'] },
  quadriceps: { nome: 'Quadríceps', porcoes: ['reto_fem', 'vastos'] },
  posteriores: { nome: 'Posteriores de coxa', porcoes: ['isq_quadril', 'isq_joelho'] },
  gluteos: { nome: 'Glúteos e adutores', porcoes: ['glut_max', 'glut_med', 'adutores'] },
  panturrilha: { nome: 'Panturrilhas', porcoes: ['gastroc', 'soleo'] },
  abdomen: { nome: 'Abdômen', porcoes: ['abd_reto', 'abd_obliq', 'abd_transv'] },
  lombar: { nome: 'Lombar', porcoes: ['lombar'] },
  antebraco: { nome: 'Antebraço', porcoes: ['antebr_flex', 'antebr_ext'] },
};

export const PORCOES = {
  peit_clav: { nome: 'Peitoral clavicular (superior)', grupo: 'peito' },
  peit_ester: { nome: 'Peitoral esternal (médio)', grupo: 'peito' },
  peit_costal: { nome: 'Peitoral costal (inferior)', grupo: 'peito' },
  dorsal: { nome: 'Grande dorsal', grupo: 'costas' },
  trap_sup: { nome: 'Trapézio superior', grupo: 'costas' },
  trap_med: { nome: 'Trapézio médio', grupo: 'costas' },
  trap_inf: { nome: 'Trapézio inferior', grupo: 'costas' },
  romboides: { nome: 'Romboides', grupo: 'costas' },
  delt_ant: { nome: 'Deltoide anterior', grupo: 'ombros' },
  delt_lat: { nome: 'Deltoide lateral', grupo: 'ombros' },
  delt_post: { nome: 'Deltoide posterior', grupo: 'ombros' },
  bic_longa: { nome: 'Bíceps cabeça longa', grupo: 'biceps' },
  bic_curta: { nome: 'Bíceps cabeça curta', grupo: 'biceps' },
  braquial: { nome: 'Braquial e braquiorradial', grupo: 'biceps' },
  tri_longa: { nome: 'Tríceps cabeça longa', grupo: 'triceps' },
  tri_lateral: { nome: 'Tríceps cabeça lateral', grupo: 'triceps' },
  tri_medial: { nome: 'Tríceps cabeça medial', grupo: 'triceps' },
  reto_fem: { nome: 'Reto femoral', grupo: 'quadriceps' },
  vastos: { nome: 'Vastos (lateral, medial e intermédio)', grupo: 'quadriceps' },
  isq_quadril: { nome: 'Isquiotibiais (extensão de quadril)', grupo: 'posteriores' },
  isq_joelho: { nome: 'Isquiotibiais (flexão de joelho)', grupo: 'posteriores' },
  glut_max: { nome: 'Glúteo máximo', grupo: 'gluteos' },
  glut_med: { nome: 'Glúteo médio e mínimo', grupo: 'gluteos' },
  adutores: { nome: 'Adutores', grupo: 'gluteos' },
  gastroc: { nome: 'Gastrocnêmio', grupo: 'panturrilha' },
  soleo: { nome: 'Sóleo', grupo: 'panturrilha' },
  abd_reto: { nome: 'Reto abdominal', grupo: 'abdomen' },
  abd_obliq: { nome: 'Oblíquos', grupo: 'abdomen' },
  abd_transv: { nome: 'Transverso do abdômen', grupo: 'abdomen' },
  lombar: { nome: 'Eretores da lombar', grupo: 'lombar' },
  antebr_flex: { nome: 'Flexores do antebraço', grupo: 'antebraco' },
  antebr_ext: { nome: 'Extensores do antebraço', grupo: 'antebraco' },
};

/** Equipamento do usuário -> classes de exercício disponíveis */
export const EQUIPAMENTOS = {
  academia: { nome: 'Academia completa', classes: ['A', 'H', 'C'], desc: 'Máquinas, polias, barras e halteres' },
  halteres: { nome: 'Halteres e banco', classes: ['H', 'C'], desc: 'Halteres, banco e peso corporal' },
  casa: { nome: 'Em casa, sem equipamento', classes: ['C'], desc: 'Peso corporal, elástico e mochila com peso' },
};

export const LESOES = {
  ombro: 'Ombro', joelho: 'Joelho', lombar: 'Lombar / coluna', cotovelo: 'Cotovelo', punho: 'Punho / mão', quadril: 'Quadril', pescoco: 'Pescoço',
};

const FOCO = { a: 'alongamento', m: 'meio da amplitude', p: 'pico de contração' };
const DIF = { 1: 'iniciante', 2: 'intermediário', 3: 'avançado' };
export const NIVEL_EXPERIENCIA = { iniciante: 1, intermediario: 2, avancado: 3 };

// id | nome | classe(A=academia,H=halteres,C=corpo/casa) | equipamento | padrão | dificuldade | primárias | secundárias | foco | lesões | instrução | erro comum
const LINHAS = `
supino-reto-barra|Supino reto com barra|A|barra e banco|empurrar horizontal|2|peit_ester|peit_clav delt_ant tri_lateral tri_medial|m|ombro|Deite com os olhos sob a barra e as escápulas juntas. Desça até a altura do meio do peito e empurre sem tirar o quadril do banco.|Abrir os cotovelos a 90 graus e quicar a barra no peito.
supino-reto-halteres|Supino reto com halteres|H|halteres e banco|empurrar horizontal|2|peit_ester|peit_clav delt_ant tri_medial|a|ombro|Desça os halteres com controle até sentir o peito alongar e suba aproximando as mãos sem bater um no outro.|Descer rápido demais e perder o controle na parte baixa.
supino-inclinado-barra|Supino inclinado com barra|A|barra e banco inclinado (30 graus)|empurrar horizontal|2|peit_clav|peit_ester delt_ant tri_lateral|m|ombro|Banco entre 30 e 45 graus. Desça a barra até a parte alta do peito e empurre em linha reta.|Inclinar o banco demais (acima de 45 graus), que passa o trabalho para o ombro.
supino-inclinado-halteres|Supino inclinado com halteres|H|halteres e banco inclinado|empurrar horizontal|2|peit_clav|peit_ester delt_ant|a|ombro|Banco a 30 graus. Desça abrindo um pouco os cotovelos e suba levando os halteres em leve arco sobre o peito.|Elevar os ombros em direção às orelhas.
supino-declinado-barra|Supino declinado com barra|A|barra e banco declinado|empurrar horizontal|2|peit_costal|peit_ester tri_lateral|m|ombro|Prenda os pés, desça a barra até a linha baixa do peito e empurre para cima.|Usar carga excessiva sem ajudante e perder a trajetória.
supino-maquina|Supino na máquina|A|máquina de supino|empurrar horizontal|1|peit_ester|peit_clav tri_medial|m|ombro|Ajuste o banco para que as pegadas fiquem na altura do meio do peito. Empurre e volte lentamente.|Deixar os ombros subirem e a lombar sair do encosto.
supino-inclinado-maquina|Supino inclinado na máquina|A|máquina inclinada|empurrar horizontal|1|peit_clav|peit_ester delt_ant|m|ombro|Costas apoiadas, empurre para cima e à frente sem travar totalmente os cotovelos.|Jogar o corpo para frente para ajudar o movimento.
flexao-de-bracos|Flexão de braços|C|peso corporal|empurrar horizontal|1|peit_ester|peit_clav delt_ant tri_lateral abd_transv|m|punho ombro|Mãos um pouco mais largas que os ombros, corpo reto como uma prancha. Desça o peito até perto do chão e empurre.|Deixar o quadril cair ou subir e fazer meia amplitude.
flexao-inclinada-pes-elevados|Flexão com pés elevados|C|peso corporal e banco ou sofá|empurrar horizontal|2|peit_clav|peit_ester delt_ant tri_lateral|m|punho ombro|Apoie os pés em um banco. Corpo reto, desça até o peito quase tocar o chão. Quanto mais alto o apoio, mais ombro e peito superior.|Elevar demais os pés e transformar em exercício de ombro.
flexao-maos-elevadas|Flexão com mãos elevadas|C|peso corporal e banco ou degrau|empurrar horizontal|1|peit_costal|peit_ester|m|punho|Mãos no banco ou degrau, corpo reto. Desça o peito até tocar a borda e empurre. É a versão mais fácil e enfatiza a região mais baixa do peito.|Encolher os ombros e encurtar a descida.
crucifixo-reto-halteres|Crucifixo reto com halteres|H|halteres e banco|adução horizontal|2|peit_ester|peit_clav|a|ombro|Cotovelos levemente flexionados e fixos. Abra os braços até sentir o peito alongar e feche como quem abraça uma árvore.|Transformar em supino dobrando demais os cotovelos.
crucifixo-inclinado-halteres|Crucifixo inclinado com halteres|H|halteres e banco inclinado|adução horizontal|2|peit_clav|peit_ester delt_ant|a|ombro|Banco a 30 graus. Abra com cotovelos semiflexionados e feche até os halteres quase se encontrarem acima do peito.|Descer além do alongamento confortável do ombro.
voador-peck-deck|Voador (peck deck)|A|máquina voador|adução horizontal|1|peit_ester|peit_clav|p|ombro|Costas apoiadas, cotovelos na altura do peito. Feche os braços e segure um segundo no pico da contração.|Usar impulso e deixar os ombros avançarem.
crossover-polia-alta|Crossover polia alta para baixo|A|polias altas|adução horizontal|2|peit_costal|peit_ester|p|ombro|Passo à frente, tronco levemente inclinado. Traga as mãos para baixo e à frente, cruzando na altura do quadril.|Dobrar muito os cotovelos e puxar com os braços.
crossover-polia-baixa|Crossover polia baixa para cima|A|polias baixas|adução horizontal|2|peit_clav|delt_ant peit_ester|p|ombro|Polias na parte baixa. Leve as mãos para cima e à frente até a altura do queixo, mantendo os cotovelos semiflexionados.|Balançar o tronco.
mergulho-paralelas|Mergulho nas paralelas (peito)|A|barras paralelas|empurrar vertical|3|peit_costal tri_lateral tri_medial|peit_ester delt_ant|a|ombro cotovelo|Incline o tronco para frente, desça até sentir o peito alongar (ombros a 90 graus) e empurre para subir.|Descer fundo demais, o que sobrecarrega a frente do ombro.
squeeze-press-halteres|Squeeze press com halteres|H|halteres ou anilha|empurrar horizontal|1|peit_ester|tri_lateral peit_clav|p|punho|Una os halteres no centro do peito, pressionando um contra o outro o tempo todo, e empurre à frente.|Soltar a pressão entre os halteres.
pullover-halter|Pullover com haltere|H|haltere e banco|extensão de ombro|2|dorsal|peit_costal tri_longa|a|ombro|Deitado, segure o haltere sobre o peito, desça atrás da cabeça com cotovelos semiflexionados e volte puxando com as costas.|Dobrar e esticar os cotovelos como em um tríceps.
barra-fixa-pronada|Barra fixa pegada pronada|C|barra fixa|puxar vertical|3|dorsal|bic_longa braquial trap_inf romboides|a|ombro cotovelo|Pegada um pouco mais larga que os ombros. Comece com as escápulas puxando para baixo e leve o queixo acima da barra.|Balançar o corpo e fazer meia repetição.
barra-fixa-supinada|Barra fixa pegada supinada (chin-up)|C|barra fixa|puxar vertical|3|dorsal bic_curta|braquial trap_inf|a|cotovelo ombro|Pegada na largura dos ombros com as palmas viradas para você. Suba até o queixo passar a barra e desça totalmente.|Não estender o cotovelo por completo na descida.
barra-fixa-neutra|Barra fixa pegada neutra|C|barra com pegadas paralelas|puxar vertical|3|dorsal braquial|bic_curta trap_inf romboides|a|ombro cotovelo|Palmas voltadas uma para a outra. Puxe os cotovelos para baixo e para trás até o queixo passar a barra.|Encolher os ombros durante a subida.
puxada-frontal-pronada|Puxada frontal pegada pronada|A|polia alta e barra|puxar vertical|1|dorsal|bic_longa trap_inf braquial|a|ombro|Peito para frente, puxe a barra até a altura da clavícula levando os cotovelos para baixo e para trás.|Inclinar o tronco muito para trás e puxar atrás da nuca.
puxada-triangulo-neutra|Puxada com triângulo (pegada neutra)|A|polia alta e triângulo|puxar vertical|1|dorsal|braquial bic_curta trap_inf|a|ombro|Puxe o triângulo até o peito, cotovelos junto ao corpo, sentindo as costas se contraírem.|Usar impulso do tronco.
puxada-supinada-polia|Puxada supinada na polia|A|polia alta e barra|puxar vertical|1|dorsal bic_curta|braquial trap_inf|a|cotovelo|Pegada supinada na largura dos ombros. Puxe a barra até o peito, mantendo o peito aberto.|Fazer a força só com os braços.
remada-curvada-barra|Remada curvada com barra|A|barra|puxar horizontal|3|dorsal trap_med|romboides delt_post bic_longa lombar|m|lombar|Tronco inclinado a cerca de 45 graus, coluna neutra. Puxe a barra em direção ao umbigo e desça com controle.|Arredondar a lombar e usar impulso do quadril.
remada-cavalinho|Remada cavalinho (barra T)|A|barra T ou landmine|puxar horizontal|2|trap_med dorsal|romboides delt_post bic_curta lombar|m|lombar|Peito apoiado ou tronco inclinado, puxe a barra até o peito e aperte as escápulas no topo.|Levantar o quadril e puxar com o tronco.
remada-serrote-halter|Remada serrote (unilateral)|H|haltere e banco|puxar horizontal|1|dorsal|trap_med romboides bic_longa|a|ombro|Joelho e mão apoiados no banco. Puxe o haltere em direção ao quadril (não ao ombro) e desça alongando a lateral das costas.|Girar o tronco para ajudar a subir o peso.
remada-baixa-triangulo|Remada baixa na polia|A|polia baixa e triângulo|puxar horizontal|1|trap_med trap_inf dorsal|romboides bic_curta|m|lombar|Sentado, tronco ereto. Puxe o triângulo até o abdômen aproximando as escápulas e volte sem curvar o tronco.|Jogar o tronco para trás a cada repetição.
remada-maquina|Remada na máquina articulada|A|máquina de remada|puxar horizontal|1|trap_med dorsal|romboides delt_post|m||Peito apoiado no encosto, puxe levando os cotovelos para trás e aperte as escápulas.|Tirar o peito do apoio.
remada-polia-pegada-aberta|Remada na polia pegada aberta|A|polia baixa e barra reta|puxar horizontal|2|trap_med romboides|delt_post dorsal|m|ombro|Pegada larga, cotovelos abertos a 70 graus. Puxe a barra ao peito e aperte as escápulas.|Puxar baixo demais e virar remada de dorsal.
remada-curvada-halteres|Remada curvada com halteres|H|halteres|puxar horizontal|2|dorsal trap_med|romboides lombar bic_longa|m|lombar|Tronco inclinado, coluna neutra. Puxe os halteres em direção ao quadril e desça alongando.|Elevar os ombros em direção às orelhas.
remada-invertida|Remada invertida (australiana)|C|barra baixa, mesa firme ou argolas|puxar horizontal|1|trap_med dorsal|romboides delt_post bic_curta|m|ombro|Deitado sob a barra, corpo reto. Puxe o peito até a barra e desça com controle.|Quadril caindo, perdendo o alinhamento do corpo.
pullover-polia|Pulldown braço reto na polia|A|polia alta|extensão de ombro|1|dorsal|tri_longa|a|ombro|Braços quase estendidos, puxe a barra em arco até as coxas contraindo as costas.|Dobrar os cotovelos e virar uma extensão de tríceps.
encolhimento-halteres|Encolhimento com halteres|H|halteres|encolhimento|1|trap_sup|antebr_flex|p||Em pé, suba os ombros em direção às orelhas e segure um segundo antes de descer.|Rodar os ombros em círculos.
encolhimento-barra|Encolhimento com barra|A|barra|encolhimento|1|trap_sup|antebr_flex|p||Barra à frente das coxas, suba os ombros verticalmente e desça devagar.|Usar impulso dos joelhos.
remada-alta-halteres|Remada alta com halteres|H|halteres|puxar vertical|2|trap_sup delt_lat|delt_post bic_longa|m|ombro|Suba os halteres rente ao corpo até o peito, com cotovelos acima das mãos, parando na altura do esterno.|Subir acima da linha do ombro com pegada estreita.
elevacao-y-deitado|Elevação em Y deitado|H|halteres leves e banco inclinado|extensão de ombro|1|trap_inf|delt_post delt_lat romboides|p|ombro|De bruços no banco inclinado, braços formando um Y. Eleve os braços com polegares para cima, contraindo a parte de baixo das costas.|Usar carga alta e compensar com a lombar.
retracao-escapular-barra|Retração escapular na barra fixa|C|barra fixa|puxar vertical|1|trap_inf romboides|dorsal|p|ombro|Pendurado, sem dobrar os cotovelos, desça e junte as escápulas elevando levemente o corpo.|Dobrar os cotovelos e virar uma barra fixa.
retracao-escapular-cabo|Retração escapular no cabo|A|polia na altura do peito|puxar horizontal|1|romboides trap_med|trap_inf delt_post|p||Braços estendidos à frente, junte as escápulas sem dobrar os cotovelos e volte devagar.|Puxar com os braços em vez das escápulas.
puxada-elastico|Puxada com elástico|C|elástico preso no alto|puxar vertical|1|dorsal|bic_longa trap_inf|a||Elástico preso acima da cabeça, ajoelhado. Puxe os cotovelos para baixo e para trás até a altura das costelas.|Curvar o tronco para compensar.
remada-elastico|Remada com elástico|C|elástico|puxar horizontal|1|trap_med romboides|dorsal delt_post|m||Sentado com o elástico nos pés ou preso à frente. Puxe os cotovelos para trás e junte as escápulas.|Arredondar as costas.
encolhimento-mochila|Encolhimento com mochila carregada|C|mochila com peso|encolhimento|1|trap_sup|antebr_flex|p||Segure a mochila à frente do corpo ou pelas alças ao lado e suba os ombros.|Dobrar os cotovelos.
pullover-mochila|Pullover com mochila|C|mochila com peso, banco ou cama|extensão de ombro|1|dorsal|peit_costal tri_longa|a||Deitado, segure a mochila acima do peito, desça atrás da cabeça e volte com as costas.|Soltar o abdômen e arquear a lombar.
desenvolvimento-militar-barra|Desenvolvimento militar com barra|A|barra|empurrar vertical|3|delt_ant|delt_lat tri_lateral peit_clav|m|ombro lombar|Em pé, glúteo e abdômen contraídos. Empurre a barra acima da cabeça, passando o rosto, e desça até o queixo.|Hiperestender a lombar.
desenvolvimento-halteres|Desenvolvimento com halteres sentado|H|halteres e banco|empurrar vertical|2|delt_ant delt_lat|tri_lateral|m|ombro|Costas apoiadas, empurre os halteres acima da cabeça sem bater as mãos e desça até a altura das orelhas.|Descer pouco e limitar a amplitude.
arnold-press|Desenvolvimento Arnold|H|halteres|empurrar vertical|2|delt_ant delt_lat|tri_medial|m|ombro|Comece com as palmas voltadas para você, gire enquanto sobe e termine com as palmas à frente.|Girar rápido demais e perder o controle.
desenvolvimento-maquina|Desenvolvimento na máquina|A|máquina|empurrar vertical|1|delt_ant delt_lat|tri_lateral|m|ombro|Ajuste o banco para as mãos ficarem na altura dos ombros e empurre sem travar os cotovelos.|Arquear a lombar.
elevacao-lateral-halteres|Elevação lateral com halteres|H|halteres|elevação lateral|1|delt_lat||p|ombro|Cotovelos levemente flexionados, suba os braços até a altura dos ombros e desça devagar.|Usar impulso do tronco e subir os ombros.
elevacao-lateral-polia|Elevação lateral na polia|A|polia baixa|elevação lateral|1|delt_lat||a|ombro|De lado para a polia, puxe com a mão distante em arco até a altura do ombro, mantendo tensão constante.|Balançar o corpo.
elevacao-lateral-maquina|Elevação lateral na máquina|A|máquina de elevação lateral|elevação lateral|1|delt_lat||m|ombro|Cotovelos apoiados nas almofadas, eleve até a altura dos ombros e volte devagar.|Subir acima da linha do ombro.
elevacao-lateral-elastico|Elevação lateral com elástico|C|elástico|elevação lateral|1|delt_lat||p||Pise no elástico e eleve os braços lateralmente até a altura dos ombros.|Elevar os ombros junto.
elevacao-frontal|Elevação frontal com halteres|H|halteres ou anilha|elevação frontal|1|delt_ant|peit_clav|m|ombro|Em pé, eleve os braços à frente até a altura dos olhos e desça devagar.|Balançar o tronco para trás.
crucifixo-inverso-halteres|Crucifixo inverso com halteres|H|halteres|abdução horizontal|2|delt_post|romboides trap_med|p|ombro|Tronco inclinado, cotovelos levemente flexionados. Abra os braços até a altura do tronco.|Usar carga excessiva e puxar com as costas.
crucifixo-inverso-polia|Crucifixo inverso na polia alta|A|polias altas cruzadas|abdução horizontal|2|delt_post|romboides trap_med|p|ombro|Cruze os cabos, puxe abrindo os braços até a linha dos ombros.|Dobrar os cotovelos e virar uma remada.
crucifixo-inverso-maquina|Crucifixo inverso na máquina (peck deck)|A|peck deck invertido|abdução horizontal|1|delt_post|romboides trap_med|p|ombro|Peito apoiado, abra os braços até alinhar com os ombros e segure um segundo.|Puxar com as costas e encolher os ombros.
face-pull|Face pull na polia|A|polia alta com corda|abdução horizontal|2|delt_post|trap_med trap_inf romboides|p||Puxe a corda em direção ao rosto, abrindo os cotovelos e girando as mãos para fora.|Puxar a corda ao peito, perdendo o foco no posterior.
face-pull-elastico|Face pull com elástico|C|elástico preso na altura do rosto|abdução horizontal|1|delt_post|trap_med trap_inf romboides|p||Com o elástico na altura do rosto, puxe em direção ao rosto abrindo os cotovelos.|Ficar com os ombros encolhidos.
crucifixo-inverso-elastico|Crucifixo inverso com elástico|C|elástico|abdução horizontal|1|delt_post|romboides trap_med|p||Segure o elástico à frente do peito e abra os braços até a linha dos ombros.|Perder a tensão no retorno.
flexao-pike|Flexão em V (pike push-up)|C|peso corporal|empurrar vertical|2|delt_ant|delt_lat tri_lateral peit_clav|m|ombro punho|Quadril alto formando um V invertido. Dobre os cotovelos levando a cabeça em direção ao chão e empurre.|Fazer como flexão comum, sem manter o quadril alto.
rosca-direta-barra|Rosca direta com barra|A|barra reta ou W|flexão de cotovelo|1|bic_longa|bic_curta braquial|m|punho|Cotovelos junto ao corpo. Suba a barra sem balançar e desça lentamente.|Balançar o tronco para subir o peso.
rosca-alternada-halteres|Rosca alternada com halteres|H|halteres|flexão de cotovelo|1|bic_longa bic_curta|braquial|m||Alterne os braços girando o punho para cima durante a subida e controlando a descida.|Girar os ombros para ajudar.
rosca-inclinada-halteres|Rosca inclinada com halteres|H|halteres e banco inclinado|flexão de cotovelo|2|bic_longa|braquial|a|ombro|Banco inclinado a 45 graus, braços pendurados atrás do tronco. Suba os halteres sem mover os cotovelos.|Levar os cotovelos à frente.
rosca-scott|Rosca Scott|A|banco Scott e barra W|flexão de cotovelo|1|bic_curta|braquial|a|cotovelo|Braços apoiados na almofada, desça quase até estender e suba sem tirar os cotovelos do apoio.|Estender totalmente o cotovelo com carga alta.
rosca-concentrada|Rosca concentrada|H|haltere|flexão de cotovelo|1|bic_curta|braquial|p||Sentado, cotovelo apoiado na coxa. Suba o haltere até o ombro e contraia no topo.|Mover o tronco para impulsionar.
rosca-martelo|Rosca martelo|H|halteres|flexão de cotovelo|1|braquial|bic_longa antebr_ext|m||Palmas voltadas uma para a outra. Suba sem girar o punho e controle a descida.|Balançar o corpo.
rosca-martelo-cruzada|Rosca martelo cruzada|H|halteres|flexão de cotovelo|1|braquial|bic_curta|m||Suba o haltere cruzando o peito em direção ao ombro oposto, mantendo o punho neutro.|Perder a posição neutra do punho.
rosca-polia-baixa|Rosca no cabo|A|polia baixa e barra|flexão de cotovelo|1|bic_longa bic_curta|braquial|m||Cotovelos fixos ao lado do corpo, suba a barra mantendo tensão contínua.|Deixar os cotovelos irem à frente.
rosca-spider|Rosca spider|H|halteres e banco inclinado|flexão de cotovelo|2|bic_curta|braquial|p||De bruços no banco inclinado, braços pendurados à frente. Suba os halteres e contraia no topo.|Usar impulso do tronco.
rosca-elastico|Rosca com elástico|C|elástico|flexão de cotovelo|1|bic_longa bic_curta|braquial|m||Pise no elástico e suba as mãos sem mexer os cotovelos.|Balançar o tronco.
rosca-martelo-elastico|Rosca martelo com elástico|C|elástico|flexão de cotovelo|1|braquial|bic_longa|m||Elástico sob os pés, punhos neutros, suba até o ombro e desça devagar.|Perder a tensão no retorno.
rosca-inversa-barra|Rosca inversa com barra|A|barra reta|flexão de cotovelo|2|braquial antebr_ext|bic_longa|m|punho|Pegada pronada, cotovelos fixos, suba a barra sem dobrar os punhos.|Quebrar o punho no topo.
triceps-testa-barra|Tríceps testa com barra|A|barra W e banco|extensão de cotovelo|2|tri_longa|tri_medial tri_lateral|a|cotovelo|Deitado, braços verticais. Desça a barra até a testa dobrando só os cotovelos e estenda sem abrir os braços.|Mover os ombros e abrir os cotovelos.
triceps-testa-halteres|Tríceps testa com halteres|H|halteres e banco|extensão de cotovelo|2|tri_longa|tri_medial|a|cotovelo|Deitado, desça os halteres ao lado da cabeça, cotovelos apontados para cima.|Abrir os cotovelos lateralmente.
triceps-frances-halter|Tríceps francês com haltere|H|haltere|extensão de cotovelo|2|tri_longa|tri_medial|a|cotovelo ombro|Segure o haltere com as duas mãos atrás da cabeça, desça e estenda os cotovelos sem abrir.|Arquear a lombar.
triceps-frances-polia|Tríceps francês na polia|A|polia baixa com corda|extensão de cotovelo|2|tri_longa|tri_medial|a|cotovelo|De costas para a polia, braços acima da cabeça. Estenda os cotovelos até alinhar os braços.|Abrir os cotovelos.
triceps-corda|Tríceps na polia com corda|A|polia alta e corda|extensão de cotovelo|1|tri_lateral tri_medial|tri_longa|p|cotovelo|Cotovelos colados ao tronco. Estenda e abra a corda no final, contraindo.|Inclinar o tronco sobre a polia.
triceps-polia-barra|Tríceps na polia com barra reta|A|polia alta e barra|extensão de cotovelo|1|tri_lateral|tri_medial|m|cotovelo|Cotovelos fixos e punhos retos. Empurre a barra até estender completamente.|Elevar os cotovelos ao empurrar.
triceps-unilateral-polia|Tríceps unilateral na polia|A|polia alta e alça|extensão de cotovelo|1|tri_lateral|tri_medial|p||Com uma mão por vez, estenda o cotovelo até o final e controle a volta.|Mexer o ombro.
triceps-coice|Tríceps coice (kickback)|H|haltere|extensão de cotovelo|1|tri_lateral tri_medial|tri_longa|p||Tronco inclinado, cotovelo alto e fixo. Estenda o antebraço para trás e contraia.|Balançar o cotovelo.
mergulho-banco|Mergulho no banco (tríceps)|C|banco ou cadeira firme|extensão de cotovelo|1|tri_medial tri_lateral|peit_costal delt_ant|a|ombro punho|Mãos no banco atrás de você. Desça dobrando os cotovelos até 90 graus e empurre.|Descer demais e forçar a frente do ombro.
flexao-diamante|Flexão diamante|C|peso corporal|empurrar horizontal|2|tri_medial tri_lateral|peit_ester delt_ant|m|punho cotovelo|Mãos juntas formando um diamante sob o peito. Desça mantendo os cotovelos próximos ao corpo.|Abrir os cotovelos e perder o foco no tríceps.
supino-fechado|Supino fechado|A|barra e banco|empurrar horizontal|2|tri_lateral tri_medial|peit_ester delt_ant|m|punho ombro|Pegada na largura dos ombros, cotovelos junto ao corpo. Desça até o peito e empurre.|Pegada estreita demais, que força os punhos.
triceps-frances-elastico|Tríceps francês com elástico|C|elástico|extensão de cotovelo|1|tri_longa|tri_medial|a||Prenda o elástico no chão, passe acima da cabeça e estenda os cotovelos.|Abrir os cotovelos.
triceps-elastico|Tríceps com elástico|C|elástico preso no alto|extensão de cotovelo|1|tri_lateral tri_medial|tri_longa|p||Elástico preso no alto. Estenda os cotovelos para baixo mantendo-os fixos.|Mexer os ombros.
agachamento-livre|Agachamento livre com barra|A|barra e rack|agachamento|3|vastos reto_fem glut_max|isq_quadril adutores lombar abd_transv|m|joelho lombar|Barra nas costas, pés na largura dos ombros. Desça até as coxas ficarem paralelas ao chão, joelhos na direção dos pés, e suba empurrando o chão.|Joelhos para dentro e lombar arredondando no fundo.
agachamento-smith|Agachamento no Smith|A|Smith|agachamento|1|vastos|reto_fem glut_max|m|joelho|Pés um pouco à frente da barra. Desça com tronco ereto até as coxas paralelas.|Pés muito juntos à barra, sobrecarregando o joelho.
leg-press-45|Leg press 45 graus|A|leg press|agachamento|1|vastos|reto_fem glut_max adutores|m|joelho lombar|Pés na largura dos ombros. Desça até 90 graus sem descolar o quadril do banco e empurre sem travar os joelhos.|Descer demais, levantando o quadril e a lombar.
hack-squat|Agachamento hack|A|máquina hack|agachamento|2|vastos reto_fem|glut_max|m|joelho|Costas apoiadas, pés à frente. Desça controladamente e suba sem travar os joelhos.|Tirar os calcanhares do apoio.
cadeira-extensora|Cadeira extensora|A|cadeira extensora|extensão de joelho|1|reto_fem vastos||p|joelho|Ajuste o encosto para o joelho ficar alinhado com o eixo. Estenda e segure um segundo no topo.|Usar impulso e carga excessiva.
agachamento-frontal|Agachamento frontal|A|barra e rack|agachamento|3|vastos reto_fem|glut_max abd_transv|m|joelho punho|Barra apoiada nos ombros à frente, cotovelos altos. Desça com tronco bem vertical.|Deixar os cotovelos caírem.
agachamento-goblet|Agachamento goblet|H|haltere ou kettlebell|agachamento|1|vastos reto_fem|glut_max abd_transv|m|joelho|Segure o haltere junto ao peito. Desça agachando fundo e suba mantendo o peito aberto.|Deixar os joelhos entrarem.
agachamento-bulgaro-halteres|Agachamento búlgaro com halteres|H|halteres e banco|avanço|2|vastos glut_max|reto_fem glut_med|a|joelho quadril|Pé de trás apoiado no banco. Desça verticalmente até a coxa da frente ficar paralela ao chão.|Passo curto, joelho da frente avançando demais.
afundo-halteres|Afundo com halteres|H|halteres|avanço|2|vastos glut_max|reto_fem isq_quadril adutores|m|joelho|Dê um passo à frente, desça até os dois joelhos formarem 90 graus e volte.|Tronco inclinado e passo curto.
agachamento-livre-corpo|Agachamento com peso corporal|C|peso corporal|agachamento|1|vastos glut_max|reto_fem|m|joelho|Braços à frente. Desça até as coxas paralelas e suba empurrando o chão.|Calcanhar saindo do chão.
agachamento-bulgaro-corpo|Agachamento búlgaro (peso corporal)|C|cadeira ou banco|avanço|2|vastos glut_max|reto_fem glut_med|a|joelho quadril|Pé de trás apoiado em uma cadeira. Desça na vertical e suba empurrando com a perna da frente.|Apoiar peso na perna de trás.
agachamento-isometrico-parede|Cadeirinha na parede (isometria)|C|parede|isometria|1|vastos reto_fem|glut_max|m|joelho|Costas na parede, joelhos a 90 graus, e segure. Comece com 30 a 45 segundos.|Deixar os joelhos passarem dos pés.
sissy-squat|Sissy squat|C|apoio para uma mão|extensão de joelho|3|reto_fem|vastos|a|joelho|Segure um apoio, incline o corpo para trás enquanto os joelhos avançam e suba contraindo as coxas.|Fazer sem preparo, forçando os joelhos.
step-up-banco|Step up no banco|C|banco ou degrau firme|avanço|1|vastos glut_max|glut_med|m|joelho|Suba empurrando com a perna de cima, sem impulso da perna de baixo, e desça devagar.|Empurrar com o pé de trás.
afundo-corpo|Afundo com peso corporal|C|peso corporal|avanço|1|vastos glut_max|reto_fem adutores|m|joelho|Passo à frente, desça até 90 graus nos dois joelhos e volte.|Joelho da frente passando muito dos pés.
stiff-barra|Stiff com barra|A|barra|dobradiça de quadril|2|isq_quadril|glut_max lombar|a|lombar|Joelhos levemente flexionados, empurre o quadril para trás e desça a barra rente às pernas até sentir a parte de trás da coxa alongar.|Arredondar a lombar.
stiff-halteres|Stiff com halteres|H|halteres|dobradiça de quadril|1|isq_quadril|glut_max lombar|a|lombar|Halteres rente às coxas. Leve o quadril para trás mantendo a coluna reta e suba contraindo glúteos.|Curvar as costas e dobrar demais os joelhos.
terra-convencional|Levantamento terra|A|barra|dobradiça de quadril|3|glut_max isq_quadril lombar|vastos trap_sup antebr_flex|m|lombar|Barra sobre o meio dos pés, coluna neutra. Empurre o chão e estenda quadril e joelhos juntos.|Puxar a barra com as costas arredondadas.
mesa-flexora|Mesa flexora|A|mesa flexora|flexão de joelho|1|isq_joelho||m|joelho|Deitado de bruços, flexione os joelhos levando os calcanhares aos glúteos, sem tirar o quadril do banco.|Levantar o quadril do banco.
cadeira-flexora|Cadeira flexora|A|cadeira flexora|flexão de joelho|1|isq_joelho||a||Sentado com quadril flexionado, o que deixa o posterior mais alongado. Flexione os joelhos e retorne devagar.|Usar impulso do tronco.
flexora-em-pe|Flexora em pé unilateral|A|máquina de flexora em pé|flexão de joelho|1|isq_joelho||p|joelho|Em pé, flexione um joelho de cada vez, sem balançar o corpo.|Compensar com o quadril.
bom-dia-barra|Bom dia (good morning)|A|barra|dobradiça de quadril|3|isq_quadril lombar|glut_max|a|lombar|Barra nas costas, joelhos semiflexionados. Incline o tronco para frente com o quadril indo para trás e volte.|Arredondar as costas.
stiff-unilateral-halter|Stiff unilateral com haltere|H|haltere|dobradiça de quadril|2|isq_quadril glut_med|glut_max lombar|a|lombar|Equilibre-se em uma perna, incline o tronco enquanto a outra perna sobe para trás, e volte.|Girar o quadril para o lado.
nordic-curl|Flexão nórdica de joelho|C|apoio para os calcanhares|flexão de joelho|3|isq_joelho||a|joelho|Joelhos no chão, calcanhares presos. Desça o tronco o mais devagar possível e use as mãos para voltar.|Cair de uma vez sem controle.
flexora-toalha-ponte|Flexão de pernas com toalha (deslizante)|C|toalha ou meias no piso liso|flexão de joelho|2|isq_joelho|glut_max|m||Deitado, calcanhares sobre a toalha. Eleve o quadril e deslize os calcanhares para você.|Deixar o quadril cair durante o exercício.
bom-dia-corpo|Bom dia com peso corporal|C|peso corporal|dobradiça de quadril|1|isq_quadril|glut_max lombar|a||Mãos atrás da cabeça, quadril para trás e tronco inclinado com a coluna reta.|Dobrar muito os joelhos.
stiff-unilateral-corpo|Stiff unilateral sem peso|C|peso corporal|dobradiça de quadril|1|isq_quadril glut_med|glut_max|a||Equilibre-se em uma perna e incline o tronco para frente enquanto a outra perna vai atrás.|Perder o equilíbrio girando o quadril.
elevacao-pelvica-barra|Elevação pélvica com barra (hip thrust)|A|barra e banco|extensão de quadril|2|glut_max|isq_quadril|p|lombar|Costas apoiadas no banco, barra sobre o quadril. Suba até o tronco alinhar com as coxas e aperte os glúteos.|Hiperestender a lombar no topo.
elevacao-pelvica-halter|Elevação pélvica com haltere|H|haltere e banco|extensão de quadril|1|glut_max|isq_quadril|p||Costas apoiadas no banco, haltere sobre o quadril. Suba apertando os glúteos.|Empurrar com a lombar.
ponte-gluteo|Ponte de glúteo|C|peso corporal|extensão de quadril|1|glut_max|isq_quadril|p||Deitado, pés no chão. Eleve o quadril apertando os glúteos e segure um segundo no topo.|Arquear a lombar no topo.
ponte-unilateral|Ponte de glúteo unilateral|C|peso corporal|extensão de quadril|2|glut_max glut_med|isq_quadril|p||Uma perna estendida no ar, eleve o quadril com a outra perna sem girar a pelve.|Girar o quadril para o lado.
cadeira-abdutora|Cadeira abdutora|A|cadeira abdutora|abdução de quadril|1|glut_med|glut_max|p|quadril|Sentado, abra as pernas contra as almofadas, com o tronco levemente inclinado para frente.|Usar impulso do tronco.
abducao-polia-em-pe|Abdução de quadril na polia|A|polia baixa e tornozeleira|abdução de quadril|1|glut_med|glut_max|p||Em pé, eleve a perna lateralmente sem inclinar o tronco.|Girar o quadril e compensar com a lombar.
abducao-deitado|Abdução deitado de lado|C|peso corporal ou caneleira|abdução de quadril|1|glut_med||p||Deitado de lado, eleve a perna de cima sem rodar o quadril.|Girar o quadril para trás.
concha-elastico|Concha (clamshell) com elástico|C|elástico|abdução de quadril|1|glut_med||p||Deitado de lado, joelhos dobrados e elástico acima dos joelhos. Abra o joelho de cima sem mexer o quadril.|Rolar o quadril para trás.
caminhada-lateral-elastico|Caminhada lateral com elástico|C|elástico|abdução de quadril|1|glut_med|glut_max|m||Elástico acima dos joelhos, semiagachado, dê passos laterais mantendo a tensão.|Deixar os joelhos entrarem.
coice-polia|Coice de glúteo na polia|A|polia baixa e tornozeleira|extensão de quadril|1|glut_max|isq_quadril|p||Apoie-se e leve a perna para trás sem arquear a lombar.|Arquear a lombar para subir mais.
coice-quatro-apoios|Coice de glúteo em quatro apoios|C|peso corporal ou caneleira|extensão de quadril|1|glut_max|isq_quadril|p||Em quatro apoios, eleve a perna dobrada em direção ao teto apertando o glúteo.|Arquear a lombar.
cadeira-adutora|Cadeira adutora|A|cadeira adutora|adução de quadril|1|adutores||p|quadril|Sentado, feche as pernas contra as almofadas e controle a volta.|Balançar o corpo.
aducao-deitado|Adução deitado de lado|C|peso corporal|adução de quadril|1|adutores||p||Deitado de lado, perna de cima apoiada à frente e eleve a de baixo.|Rodar o quadril.
agachamento-sumo-halter|Agachamento sumô com haltere|H|haltere|agachamento|1|adutores glut_max|vastos|m|joelho quadril|Pés bem abertos, pontas para fora. Desça segurando o haltere com os dois braços e suba empurrando o chão.|Deixar os joelhos entrarem.
afundo-lateral|Afundo lateral|C|peso corporal|avanço|1|adutores glut_med|vastos glut_max|a|joelho quadril|Dê um passo largo para o lado, flexionando o joelho e mantendo a outra perna estendida.|Joelho entrando e calcanhar levantando.
panturrilha-em-pe-maquina|Panturrilha em pé na máquina|A|máquina de panturrilha em pé|elevação de calcanhar|1|gastroc|soleo|a||Joelhos estendidos. Desça alongando bem e suba o mais alto possível.|Fazer amplitude curta e quicar.
panturrilha-leg-press|Panturrilha no leg press|A|leg press|elevação de calcanhar|1|gastroc|soleo|a||Pés na borda da plataforma, joelhos estendidos. Empurre com a ponta dos pés e controle a descida.|Dobrar os joelhos durante o exercício.
panturrilha-sentado-maquina|Panturrilha sentado na máquina|A|máquina de panturrilha sentado|elevação de calcanhar|1|soleo|gastroc|a||Com os joelhos flexionados a 90 graus, o sóleo trabalha mais. Suba e desça com amplitude total.|Fazer movimentos curtos.
panturrilha-degrau-unilateral|Panturrilha unilateral no degrau|C|degrau|elevação de calcanhar|1|gastroc|soleo|a||Ponta do pé no degrau, calcanhar para fora. Desça alongando e suba na ponta do pé.|Apoiar-se demais com as mãos.
panturrilha-sentado-halter|Panturrilha sentado com haltere|H|haltere e banco|elevação de calcanhar|1|soleo|gastroc|a||Sentado, haltere sobre os joelhos. Suba os calcanhares e desça devagar.|Fazer amplitude curta.
panturrilha-em-pe-halteres|Panturrilha em pé com halteres|H|halteres e degrau|elevação de calcanhar|1|gastroc|soleo|a||Em pé na ponta do degrau, halteres nas mãos. Suba e desça com amplitude completa.|Dobrar os joelhos.
panturrilha-sentada-corpo|Panturrilha sentada com mochila|C|mochila com peso|elevação de calcanhar|1|soleo|gastroc|a||Sentado, mochila sobre os joelhos. Suba os calcanhares e controle a descida.|Fazer repetições rápidas demais.
abdominal-crunch|Abdominal crunch|C|peso corporal|flexão de tronco|1|abd_reto|abd_obliq|p||Deitado, joelhos dobrados. Eleve as escápulas do chão enrolando o tronco e volte devagar.|Puxar o pescoço com as mãos.
abdominal-polia|Abdominal na polia (crunch no cabo)|A|polia alta e corda|flexão de tronco|2|abd_reto|abd_obliq|p||Ajoelhado, enrole o tronco levando os cotovelos aos joelhos, sem puxar com os braços.|Flexionar o quadril em vez do tronco.
elevacao-pernas-deitado|Elevação de pernas deitado|C|peso corporal|flexão de quadril|1|abd_reto|abd_transv|m|lombar|Lombar apoiada no chão, eleve as pernas até 90 graus e desça sem tocar o chão.|Deixar a lombar sair do chão.
elevacao-pernas-barra|Elevação de pernas na barra fixa|C|barra fixa|flexão de quadril|3|abd_reto|abd_obliq antebr_flex|m|ombro|Pendurado, eleve os joelhos ou as pernas enrolando a pelve.|Balançar o corpo.
prancha|Prancha|C|peso corporal|isometria|1|abd_transv|abd_reto abd_obliq|m|ombro|Antebraços no chão, corpo em linha reta. Contraia o abdômen e os glúteos. Segure de 30 a 60 segundos.|Deixar o quadril cair.
prancha-lateral|Prancha lateral|C|peso corporal|isometria|2|abd_obliq|abd_transv glut_med|m|ombro|Apoiado no antebraço, corpo em linha reta de lado. Segure sem deixar o quadril cair.|Girar o tronco.
russian-twist|Giro russo (Russian twist)|C|peso corporal ou anilha|rotação|2|abd_obliq|abd_reto|m|lombar|Sentado, tronco inclinado para trás e pés suspensos ou no chão. Gire o tronco de um lado para o outro.|Mover só os braços.
pallof-press|Pallof press|A|polia ou elástico|anti-rotação|2|abd_transv abd_obliq||m||De lado para a polia, empurre as mãos à frente resistindo à rotação do tronco.|Deixar o tronco girar.
pallof-press-elastico|Pallof press com elástico|C|elástico|anti-rotação|2|abd_transv abd_obliq||m||De lado para o elástico fixo, estenda os braços à frente sem girar.|Girar o quadril.
lenhador-polia|Lenhador na polia (woodchop)|A|polia alta|rotação|2|abd_obliq|abd_transv|m||Puxe o cabo em diagonal do alto para o lado oposto, girando o tronco com os pés firmes.|Puxar só com os braços.
roda-abdominal|Roda abdominal|A|roda abdominal|extensão de tronco|3|abd_reto abd_transv|dorsal|a|lombar ombro|De joelhos, role a roda para frente mantendo o abdômen contraído e volte.|Arquear a lombar.
vacuum-abdominal|Vacuum abdominal|C|peso corporal|isometria|1|abd_transv||m||Expire todo o ar e puxe o umbigo em direção à coluna, segurando de 15 a 20 segundos.|Segurar a respiração em vez de contrair.
dead-bug|Dead bug|C|peso corporal|anti-extensão|1|abd_transv|abd_reto|m||Deitado, braços e pernas no ar. Estenda braço e perna opostos mantendo a lombar colada ao chão.|Arquear a lombar.
bicicleta-no-ar|Bicicleta no ar|C|peso corporal|rotação|1|abd_obliq|abd_reto|m||Deitado, leve o cotovelo ao joelho oposto alternando os lados em movimento controlado.|Puxar o pescoço.
crunch-declinado-anilha|Abdominal declinado com anilha|H|banco declinado e anilha|flexão de tronco|2|abd_reto||p||No banco declinado, segure a anilha no peito e enrole o tronco para cima.|Usar impulso.
inclinacao-lateral-halter|Inclinação lateral com haltere|H|haltere|flexão lateral|1|abd_obliq|abd_transv|m||Em pé, haltere de um lado. Incline o tronco para o lado do peso e volte contraindo o lado oposto.|Usar carga excessiva e girar o tronco.
hiperextensao-lombar|Hiperextensão lombar|A|banco romano|extensão de tronco|1|lombar|glut_max isq_quadril|m|lombar|Suba até o corpo ficar alinhado, sem hiperestender o tronco no topo.|Arquear demais a lombar.
superman|Superman|C|peso corporal|extensão de tronco|1|lombar|glut_max trap_inf|p||De bruços, eleve braços e pernas simultaneamente e segure um segundo.|Elevar o pescoço excessivamente.
rosca-punho-halter|Rosca de punho (flexores)|H|haltere|flexão de punho|1|antebr_flex||a|punho|Antebraço apoiado na coxa com a palma para cima. Flexione o punho e desça devagar.|Mexer o antebraço e usar carga excessiva.
rosca-punho-inversa|Rosca de punho inversa (extensores)|H|haltere|extensão de punho|1|antebr_ext||a|punho|Antebraço apoiado, palma para baixo. Suba o dorso da mão e desça devagar.|Usar impulso.
rosca-punho-elastico|Extensão de punho com elástico|C|elástico|extensão de punho|1|antebr_ext||m||Segure o elástico com a palma para baixo e estenda o punho contra a resistência.|Mexer o cotovelo.
caminhada-fazendeiro|Caminhada do fazendeiro|H|halteres pesados|carregamento|1|antebr_flex|trap_sup abd_transv|m||Segure halteres pesados ao lado do corpo e caminhe de 20 a 40 segundos com a postura ereta.|Inclinar o tronco.
suspensao-barra|Suspensão na barra (dead hang)|C|barra fixa|isometria|1|antebr_flex|dorsal|m|ombro|Pendurado, segure o máximo de tempo que conseguir com ombros ativos.|Deixar os ombros subirem até as orelhas.
`;

function parse(l) {
  const [id, nome, classe, equipamento, padrao, dif, prim, sec, foco, lesoes, instrucao, erro] = l.split('|');
  const primarias = prim.split(' ').filter(Boolean);
  const secundarias = (sec || '').split(' ').filter(Boolean);
  const grupos = [...new Set([...primarias, ...secundarias].map(p => PORCOES[p]?.grupo))];
  const grupoPrincipal = PORCOES[primarias[0]].grupo;
  return {
    id, nome, classe, equipamento, padrao, dificuldade: +dif, primarias, secundarias, foco: FOCO[foco] || 'meio da amplitude', focoCod: foco,
    lesoes: (lesoes || '').split(' ').filter(Boolean), instrucao, erro, grupoPrincipal, grupos,
    composto: primarias.length >= 2 || secundarias.length >= 3,
  };
}

export const EXERCICIOS = LINHAS.split('\n').map(s => s.trim()).filter(Boolean).map(parse);
const POR_ID = new Map(EXERCICIOS.map(e => [e.id, e]));
export const exPorId = id => POR_ID.get(id) || null;
export const nomePorcao = id => PORCOES[id]?.nome || id;

/** Pesos de ativação */
export const PESO_PRIM = 1;
export const PESO_SEC = 0.4;
export function ativacao(ex, porcao) {
  if (ex.primarias.includes(porcao)) return PESO_PRIM;
  if (ex.secundarias.includes(porcao)) return PESO_SEC;
  return 0;
}

export function disponivel(ex, equipamento = 'academia') {
  const cls = (EQUIPAMENTOS[equipamento] || EQUIPAMENTOS.academia).classes;
  return cls.includes(ex.classe);
}
export const temLesao = (ex, lesoes = []) => ex.lesoes.some(l => lesoes.includes(l));
export const rotuloDificuldade = n => DIF[n];

/** Porções do grupo cobertas como primárias por ao menos um exercício disponível/sem lesão */
export function porcoesSemCobertura(grupo, equipamento, lesoes) {
  return GRUPOS[grupo].porcoes.filter(p => !EXERCICIOS.some(e => e.primarias.includes(p) && disponivel(e, equipamento) && !temLesao(e, lesoes)));
}
