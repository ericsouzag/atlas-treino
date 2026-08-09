// =====================================================
// METADADOS DE GRUPOS
// =====================================================
const GROUP_META = [
  { key:"peito", label:"Peito", intro:"Empurrar horizontal e adução de ombro." },
  { key:"costas", label:"Costas", intro:"Puxar — largura, espessura e alongamento do dorsal." },
  { key:"ombro", label:"Ombro", intro:"Deltoide anterior, medial e posterior." },
  { key:"biceps", label:"Bíceps", intro:"Flexão de cotovelo — bíceps, braquial e braquiorradial." },
  { key:"triceps", label:"Tríceps", intro:"Extensão de cotovelo — três cabeças." },
  { key:"quadriceps", label:"Pernas · Quadríceps", intro:"Extensão de joelho, flexão de quadril." },
  { key:"posterior", label:"Pernas · Isquiotibiais", intro:"Extensão de quadril, flexão de joelho." },
  { key:"gluteos", label:"Pernas · Glúteos", intro:"Extensão de quadril." },
  { key:"panturrilha", label:"Panturrilha", intro:"Flexão plantar do tornozelo." },
  { key:"core", label:"Core / Abdominais", intro:"Flexão de tronco, rotação, estabilização." },
  { key:"antebraco", label:"Antebraço", intro:"Flexão/extensão de punho, força de preensão." },
  { key:"trapezio", label:"Trapézio", intro:"Elevação e retração escapular." },
  { key:"adutor_abdutor", label:"Adutores / Abdutores", intro:"Movimento lateral do quadril." },
];

// =====================================================
// BANCO DE EXERCÍCIOS — cada item tem pose:{stance,arms,equip} para ilustração
// =====================================================
const EX = [
// ---------------- PEITO ----------------
{ name:"Supino reto", equip:"Barra / Halteres / Máquina", primary:["Peitoral maior"], secondary:["Deltoide anterior","Tríceps"], groups:["peito"], pose:{stance:"lyingBenchFlat",arms:"pushUpLying",equip:"barbell"} },
{ name:"Supino inclinado", equip:"Barra / Halteres", primary:["Peitoral superior (clavicular)"], secondary:["Deltoide anterior","Tríceps"], groups:["peito"], pose:{stance:"lyingBenchIncline",arms:"pushUpLying",equip:"dumbbells"} },
{ name:"Supino declinado", equip:"Barra / Halteres", primary:["Peitoral inferior (esternal)"], secondary:["Deltoide anterior","Tríceps"], groups:["peito"], pose:{stance:"lyingBenchFlat",arms:"pushUpLying",equip:"barbell"} },
{ name:"Crucifixo reto", equip:"Halteres / Peck-deck", primary:["Peitoral maior"], secondary:["Deltoide anterior"], groups:["peito"], pose:{stance:"lyingBenchFlat",arms:"wideArcLying",equip:"dumbbells"} },
{ name:"Peck deck (voador)", equip:"Máquina peck-deck", primary:["Peitoral maior"], secondary:["Deltoide anterior"], groups:["peito"], pose:{stance:"seated",arms:"frontOut",equip:"machine"} },
{ name:"Flexão de braço (push-up)", equip:"Peso corporal", primary:["Peitoral maior"], secondary:["Deltoide anterior","Tríceps","Core"], groups:["peito"], pose:{stance:"plankFront",arms:null,equip:null} },
{ name:"Mergulho em paralelas (chest dip)", equip:"Paralelas", primary:["Peitoral maior (inferior)"], secondary:["Tríceps","Deltoide anterior"], groups:["peito","triceps"], pose:{stance:"bentOver",arms:"down",equip:"machine"} },
{ name:"Crossover (polia alta)", equip:"Polias / Cabo", primary:["Peitoral maior (inferior)"], secondary:["Deltoide anterior"], groups:["peito"], pose:{stance:"standing",arms:"frontOut",equip:"cableHigh"} },
{ name:"Crossover baixo-alto", equip:"Polia baixa", primary:["Peitoral superior"], secondary:["Deltoide anterior"], groups:["peito"], pose:{stance:"standing",arms:"frontOut",equip:"cableLow"} },
{ name:"Landmine press", equip:"Barra em landmine", primary:["Peitoral superior"], secondary:["Deltoide anterior","Tríceps"], groups:["peito","ombro"], pose:{stance:"standing",arms:"overheadPress",equip:"machine"} },
{ name:"Supino máquina (hammer strength)", equip:"Máquina de supino", primary:["Peitoral maior"], secondary:["Deltoide anterior","Tríceps"], groups:["peito"], pose:{stance:"seated",arms:"frontOut",equip:"machine"} },
{ name:"Squeeze Press com anilha", equip:"Anilha (disco)", primary:["Peitoral maior (porção interna)"], secondary:["Tríceps"], groups:["peito"], pose:{stance:"lyingBenchFlat",arms:"pushUpLying",equip:"plate"} },

// ---------------- COSTAS ----------------
{ name:"Barra fixa (pull-up)", equip:"Barra fixa", primary:["Grande dorsal (latíssimo)"], secondary:["Bíceps","Trapézio","Deltoide posterior"], groups:["costas"], pose:{stance:"hanging",arms:"grippingBar",equip:null} },
{ name:"Barra fixa (pegada neutra)", equip:"Barra fixa", primary:["Braquiorradial","Braquial"], secondary:["Bíceps braquial","Grande dorsal"], groups:["costas","biceps"], pose:{stance:"hanging",arms:"grippingBar",equip:null} },
{ name:"Puxada frontal (pulldown)", equip:"Polia alta", primary:["Grande dorsal"], secondary:["Bíceps","Trapézio médio"], groups:["costas"], pose:{stance:"seated",arms:"pullToChest",equip:"cableHigh"} },
{ name:"Puxada supinada fechada", equip:"Polia alta (triângulo)", primary:["Grande dorsal"], secondary:["Bíceps (maior ativação)"], groups:["costas","biceps"], pose:{stance:"seated",arms:"pullToChest",equip:"cableHigh"} },
{ name:"Remada curvada (barra)", equip:"Barra", primary:["Grande dorsal","Trapézio médio"], secondary:["Bíceps","Deltoide posterior","Core"], groups:["costas"], pose:{stance:"bentOver",arms:"rowBent",equip:"barbell"} },
{ name:"Remada curvada (halteres)", equip:"Halteres", primary:["Grande dorsal","Trapézio médio"], secondary:["Bíceps","Deltoide posterior","Core"], groups:["costas"], pose:{stance:"bentOver",arms:"rowBent",equip:"dumbbells"} },
{ name:"Remada unilateral (serrote)", equip:"Halteres / Máquina", primary:["Grande dorsal","Trapézio"], secondary:["Bíceps","Deltoide posterior","Core"], groups:["costas"], pose:{stance:"oneKneeOnBench",arms:"oneArmRow",equip:"dumbbells"} },
{ name:"Remada baixa (cabo sentado)", equip:"Polia baixa", primary:["Trapézio médio/inferior","Grande dorsal"], secondary:["Bíceps","Deltoide posterior","Core"], groups:["costas"], pose:{stance:"seated",arms:"pullToChest",equip:"cableLow"} },
{ name:"Remada cavalinho (T-bar)", equip:"Barra T / Landmine", primary:["Grande dorsal","Trapézio médio"], secondary:["Bíceps","Deltoide posterior","Core"], groups:["costas"], pose:{stance:"bentOver",arms:"rowBent",equip:"machine"} },
{ name:"Remada invertida (Australian pull-up)", equip:"Barra baixa", primary:["Grande dorsal","Trapézio médio"], secondary:["Bíceps","Core"], groups:["costas"], pose:{stance:"plankFront",arms:null,equip:null} },
{ name:"Pullover", equip:"Halter / Polia alta", primary:["Grande dorsal"], secondary:["Peitoral maior","Deltoide anterior","Core"], groups:["costas","peito"], pose:{stance:"lyingBenchFlat",arms:"pushUpLying",equip:"dumbbells"} },
{ name:"Crucifixo inverso (fly posterior)", equip:"Halteres / Máquina", primary:["Deltoide posterior"], secondary:["Trapézio inferior","Romboides"], groups:["costas","ombro"], pose:{stance:"proneOnInclineBench",arms:"lateralOut",equip:"dumbbells"} },
{ name:"Face pull", equip:"Polia alta (corda)", primary:["Deltoide posterior","Trapézio médio/inferior"], secondary:["Romboides"], groups:["costas","ombro","trapezio"], pose:{stance:"standing",arms:"pullToChest",equip:"cableHigh"} },

// ---------------- OMBRO ----------------
{ name:"Desenvolvimento militar (military press)", equip:"Barra / Halteres", primary:["Deltoide anterior","Deltoide medial"], secondary:["Tríceps","Trapézio superior","Core"], groups:["ombro"], pose:{stance:"standing",arms:"overheadPress",equip:"barbell"} },
{ name:"Arnold press", equip:"Halteres", primary:["Deltoide anterior","Deltoide medial"], secondary:["Tríceps","Trapézio superior"], groups:["ombro"], pose:{stance:"seated",arms:"overheadPress",equip:"dumbbells"} },
{ name:"Elevação lateral", equip:"Halteres / Polia / Máquina", primary:["Deltoide medial (lateral)"], secondary:["Deltoide anterior/posterior","Trapézio"], groups:["ombro"], pose:{stance:"standing",arms:"lateralOut",equip:"dumbbells"} },
{ name:"Elevação frontal", equip:"Halteres / Barra / Polia", primary:["Deltoide anterior"], secondary:["Deltoide medial","Trapézio","Serrátil anterior"], groups:["ombro"], pose:{stance:"standing",arms:"frontOut",equip:"dumbbells"} },
{ name:"Elevação posterior (fly inverso)", equip:"Halteres / Máquina", primary:["Deltoide posterior"], secondary:["Trapézio inferior","Romboides"], groups:["ombro"], pose:{stance:"bentOver",arms:"lateralOut",equip:"dumbbells"} },
{ name:"Reverse crucifix (polia alta)", equip:"Polia alta cruzada", primary:["Deltoide posterior"], secondary:["Trapézio médio/inferior"], groups:["ombro"], pose:{stance:"standing",arms:"lateralOut",equip:"cableHigh"} },
{ name:"Remada alta (upright row)", equip:"Barra / Halteres / Polia", primary:["Deltoide medial","Trapézio superior"], secondary:["Bíceps","Deltoide anterior"], groups:["ombro","trapezio"], pose:{stance:"standing",arms:"curlUp",equip:"barbell"} },
{ name:"Rotação externa (manguito rotador)", equip:"Polia baixa / Halter leve", primary:["Infraespinal","Redondo menor"], secondary:["Deltoide posterior"], groups:["ombro"], pose:{stance:"standing",arms:"behindExtended",equip:"cableLow"} },
{ name:"Rotação interna (manguito rotador)", equip:"Polia baixa / Halter leve", primary:["Subescapular"], secondary:["Peitoral maior"], groups:["ombro"], pose:{stance:"standing",arms:"pushDown",equip:"cableLow"} },
{ name:"Cuban press", equip:"Halteres", primary:["Deltoide medial","Manguito rotador"], secondary:["Trapézio"], groups:["ombro"], pose:{stance:"standing",arms:"overheadPress",equip:"dumbbells"} },
{ name:"Encolhimento de ombros (shrug)", equip:"Halteres / Barra", primary:["Trapézio superior"], secondary:[], groups:["ombro","trapezio"], pose:{stance:"standing",arms:"down",equip:"barbell"} },

// ---------------- BÍCEPS ----------------
{ name:"Rosca direta (barra)", equip:"Barra reta / Barra W", primary:["Bíceps braquial"], secondary:["Braquial","Braquiorradial"], groups:["biceps"], pose:{stance:"standing",arms:"curlUp",equip:"barbell"} },
{ name:"Rosca direta (halteres)", equip:"Halteres", primary:["Bíceps braquial"], secondary:["Braquial","Braquiorradial"], groups:["biceps"], pose:{stance:"standing",arms:"curlUp",equip:"dumbbells"} },
{ name:"Rosca alternada", equip:"Halteres", primary:["Bíceps braquial"], secondary:["Braquial","Braquiorradial"], groups:["biceps"], pose:{stance:"standing",arms:"curlUp",equip:"dumbbells"} },
{ name:"Rosca martelo", equip:"Halteres", primary:["Braquiorradial","Braquial"], secondary:["Bíceps braquial"], groups:["biceps","antebraco"], pose:{stance:"standing",arms:"curlUp",equip:"dumbbells"} },
{ name:"Rosca Scott (preacher curl)", equip:"Banco Scott + Barra W", primary:["Bíceps braquial (cabeça curta)"], secondary:["Braquial"], groups:["biceps"], pose:{stance:"seated",arms:"curlUp",equip:"barbell"} },
{ name:"Rosca concentrada", equip:"Halter", primary:["Bíceps braquial"], secondary:["Braquial"], groups:["biceps"], pose:{stance:"seated",arms:"curlUp",equip:"dumbbells"} },
{ name:"Rosca no cabo", equip:"Polia baixa", primary:["Bíceps braquial"], secondary:["Braquial","Braquiorradial"], groups:["biceps"], pose:{stance:"standing",arms:"curlUp",equip:"cableLow"} },
{ name:"Rosca 21", equip:"Barra", primary:["Bíceps braquial"], secondary:["Braquial"], groups:["biceps"], pose:{stance:"standing",arms:"curlUp",equip:"barbell"} },
{ name:"Rosca inversa (reverse curl)", equip:"Barra W / Halteres", primary:["Braquiorradial"], secondary:["Bíceps braquial","Extensores do punho"], groups:["biceps","antebraco"], pose:{stance:"standing",arms:"curlUp",equip:"barbell"} },
{ name:"Chin-up (barra fixa supinada)", equip:"Barra fixa", primary:["Grande dorsal"], secondary:["Bíceps braquial (forte)","Deltoide posterior","Core"], groups:["costas","biceps"], pose:{stance:"hanging",arms:"grippingBar",equip:null} },
{ name:"Drag curl", equip:"Barra", primary:["Bíceps braquial (cabeça curta)"], secondary:["Braquial"], groups:["biceps"], pose:{stance:"standing",arms:"curlUp",equip:"barbell"} },

// ---------------- TRÍCEPS ----------------
{ name:"Tríceps pulley (pushdown) — barra", equip:"Polia alta + barra reta", primary:["Tríceps braquial (cabeça lateral)"], secondary:["Deltoide posterior"], groups:["triceps"], pose:{stance:"standing",arms:"pushDown",equip:"cableHigh"} },
{ name:"Tríceps pulley — corda", equip:"Polia alta + corda", primary:["Tríceps braquial (todas as cabeças)"], secondary:["Deltoide posterior"], groups:["triceps"], pose:{stance:"standing",arms:"pushDown",equip:"cableHigh"} },
{ name:"Tríceps polia unilateral", equip:"Polia alta (um braço)", primary:["Tríceps braquial (cabeça lateral)"], secondary:[], groups:["triceps"], pose:{stance:"standing",arms:"pushDown",equip:"cableHigh"} },
{ name:"Tríceps coice (kickback)", equip:"Halteres / Polia", primary:["Tríceps braquial (cabeça lateral)"], secondary:["Deltoide posterior"], groups:["triceps"], pose:{stance:"bentOver",arms:"behindExtended",equip:"dumbbells"} },
{ name:"Tríceps testa (skull crusher)", equip:"Barra / Halteres", primary:["Tríceps braquial (cabeça longa)"], secondary:["Peitoral menor"], groups:["triceps"], pose:{stance:"lyingBenchFlat",arms:"overheadBent",equip:"barbell"} },
{ name:"Tríceps francês (overhead extension)", equip:"Halter / Cabo / Barra", primary:["Tríceps braquial (cabeça longa)"], secondary:["Core"], groups:["triceps"], pose:{stance:"standing",arms:"overheadBent",equip:"dumbbells"} },
{ name:"Supino fechado", equip:"Barra", primary:["Tríceps braquial"], secondary:["Peitoral maior","Deltoide anterior"], groups:["triceps","peito"], pose:{stance:"lyingBenchFlat",arms:"pushUpLying",equip:"barbell"} },
{ name:"Mergulho em paralelas (dips)", equip:"Paralelas", primary:["Tríceps braquial"], secondary:["Peitoral maior","Deltoide anterior"], groups:["triceps"], pose:{stance:"bentOver",arms:"down",equip:"machine"} },
{ name:"Máquina de mergulho (dip machine)", equip:"Máquina específica", primary:["Tríceps braquial"], secondary:["Peitoral maior","Deltoide anterior"], groups:["triceps"], pose:{stance:"seated",arms:"pushDown",equip:"machine"} },
{ name:"Flexão diamante (close-grip push-up)", equip:"Peso corporal", primary:["Tríceps braquial"], secondary:["Peitoral maior","Core"], groups:["triceps"], pose:{stance:"plankFront",arms:null,equip:null} },
{ name:"JM Press", equip:"Barra", primary:["Tríceps braquial"], secondary:["Peitoral maior"], groups:["triceps"], pose:{stance:"lyingBenchFlat",arms:"overheadBent",equip:"barbell"} },

// ---------------- QUADRÍCEPS ----------------
{ name:"Agachamento livre (back squat)", equip:"Barra", primary:["Quadríceps"], secondary:["Glúteos","Isquiotibiais","Core"], groups:["quadriceps","gluteos"], pose:{stance:"squatBottom",arms:"barOnBack",equip:"barbell"} },
{ name:"Agachamento frontal (front squat)", equip:"Barra", primary:["Quadríceps"], secondary:["Glúteos","Core"], groups:["quadriceps"], pose:{stance:"squatBottom",arms:"barOnBack",equip:"barbell"} },
{ name:"Agachamento sumô", equip:"Barra / Kettlebell", primary:["Quadríceps","Adutores"], secondary:["Glúteos","Isquiotibiais","Core"], groups:["quadriceps","gluteos","adutor_abdutor"], pose:{stance:"squatBottom",arms:"barOnBack",equip:"barbell"} },
{ name:"Agachamento búlgaro", equip:"Halteres / Barra", primary:["Quadríceps","Glúteos"], secondary:["Isquiotibiais","Core"], groups:["quadriceps","gluteos"], pose:{stance:"splitRearElevated",arms:"down",equip:"dumbbells"} },
{ name:"Leg press", equip:"Máquina 45° / horizontal", primary:["Quadríceps"], secondary:["Glúteos","Isquiotibiais","Panturrilhas"], groups:["quadriceps"], pose:{stance:"seatedLegsForward",arms:null,equip:null} },
{ name:"Hack squat", equip:"Máquina hack", primary:["Quadríceps"], secondary:["Glúteos"], groups:["quadriceps"], pose:{stance:"squatBottom",arms:null,equip:null} },
{ name:"Extensão de perna (leg extension)", equip:"Máquina leg extension", primary:["Quadríceps"], secondary:[], groups:["quadriceps"], pose:{stance:"seatedLegsForward",arms:null,equip:null} },
{ name:"Avanço / lunge", equip:"Barra / Halteres / Peso corporal", primary:["Quadríceps","Glúteos"], secondary:["Isquiotibiais","Core"], groups:["quadriceps","gluteos"], pose:{stance:"lunge",arms:"down",equip:"dumbbells"} },
{ name:"Agachamento unilateral (pistol squat)", equip:"Peso corporal / Halter", primary:["Quadríceps","Glúteos"], secondary:["Core","Isquiotibiais"], groups:["quadriceps","gluteos"], pose:{stance:"squatBottom",arms:"frontOut",equip:null} },
{ name:"Sissy squat", equip:"Peso corporal / Apoio", primary:["Quadríceps (isolamento)"], secondary:["Core"], groups:["quadriceps"], pose:{stance:"squatBottom",arms:"down",equip:null} },

// ---------------- ISQUIOTIBIAIS ----------------
{ name:"Levantamento terra romeno (RDL)", equip:"Barra / Halteres", primary:["Isquiotibiais","Glúteos"], secondary:["Eretor da coluna","Core"], groups:["posterior","gluteos"], pose:{stance:"bentOver",arms:"down",equip:"barbell"} },
{ name:"Stiff", equip:"Barra / Halteres", primary:["Isquiotibiais","Glúteos"], secondary:["Eretor da coluna"], groups:["posterior","gluteos"], pose:{stance:"bentOver",arms:"down",equip:"barbell"} },
{ name:"Good morning", equip:"Barra", primary:["Isquiotibiais","Glúteos"], secondary:["Eretor da coluna","Core"], groups:["posterior","gluteos"], pose:{stance:"bentOver",arms:"barOnBack",equip:"barbell"} },
{ name:"Glute-ham raise (GHD)", equip:"Máquina GHD", primary:["Isquiotibiais","Glúteos"], secondary:["Eretor da coluna"], groups:["posterior","gluteos"], pose:{stance:"hyperextBench",arms:null,equip:null} },
{ name:"Leg curl sentado", equip:"Máquina leg curl", primary:["Isquiotibiais"], secondary:["Panturrilha"], groups:["posterior"], pose:{stance:"seatedLegBentUnder",arms:null,equip:null} },
{ name:"Leg curl deitado", equip:"Máquina leg curl", primary:["Isquiotibiais"], secondary:["Panturrilha"], groups:["posterior"], pose:{stance:"lyingBenchFlat",arms:null,equip:null} },
{ name:"Leg curl em pé (unilateral)", equip:"Máquina leg curl em pé", primary:["Isquiotibiais"], secondary:["Panturrilha"], groups:["posterior"], pose:{stance:"standing",arms:null,equip:null} },
{ name:"Nordic hamstring curl", equip:"Peso corporal + apoio", primary:["Isquiotibiais (excêntrico forte)"], secondary:["Glúteos","Core"], groups:["posterior"], pose:{stance:"kneelingBentTorso",arms:null,equip:null} },

// ---------------- GLÚTEOS ----------------
{ name:"Hip thrust", equip:"Barra / Máquina", primary:["Glúteos"], secondary:["Quadríceps","Isquiotibiais","Core"], groups:["gluteos"], pose:{stance:"hipThrustTop",arms:null,equip:null} },
{ name:"Glute bridge (ponte)", equip:"Solo / Barra", primary:["Glúteos"], secondary:["Isquiotibiais","Core"], groups:["gluteos"], pose:{stance:"lyingFloorSupine",arms:null,equip:null} },
{ name:"Step-up", equip:"Halteres / Banco", primary:["Glúteos","Quadríceps"], secondary:["Isquiotibiais","Core"], groups:["gluteos","quadriceps"], pose:{stance:"splitRearElevated",arms:null,equip:null} },
{ name:"Coice no cabo (glute kickback)", equip:"Polia baixa + tornozeleira", primary:["Glúteo máximo"], secondary:["Isquiotibiais","Core"], groups:["gluteos"], pose:{stance:"standingKickbackSupport",arms:null,equip:null} },
{ name:"Abdução de quadril em pé", equip:"Polia / Faixa", primary:["Glúteo médio/mínimo"], secondary:["Core"], groups:["gluteos","adutor_abdutor"], pose:{stance:"standingWide",arms:null,equip:null} },

// ---------------- PANTURRILHA ----------------
{ name:"Elevação de panturrilha em pé", equip:"Máquina em pé / Smith", primary:["Gastrocnêmio"], secondary:["Sóleo"], groups:["panturrilha"], pose:{stance:"standing",arms:"down",equip:null} },
{ name:"Elevação de panturrilha sentado", equip:"Máquina sentado", primary:["Sóleo"], secondary:["Gastrocnêmio (menor)"], groups:["panturrilha"], pose:{stance:"seated",arms:"down",equip:null} },
{ name:"Elevação de panturrilha no leg press", equip:"Leg press", primary:["Gastrocnêmio"], secondary:["Sóleo"], groups:["panturrilha"], pose:{stance:"seatedLegsForward",arms:null,equip:null} },
{ name:"Donkey calf raise", equip:"Máquina específica", primary:["Gastrocnêmio"], secondary:["Sóleo"], groups:["panturrilha"], pose:{stance:"bentOver",arms:"down",equip:null} },

// ---------------- CORE ----------------
{ name:"Abdominal crunch", equip:"Solo / Aparelho", primary:["Reto abdominal"], secondary:["Oblíquos","Flexores do quadril"], groups:["core"], pose:{stance:"lyingFloorSupine",arms:null,equip:null} },
{ name:"Prancha frontal", equip:"Solo", primary:["Transverso do abdômen"], secondary:["Reto abdominal","Trapézio","Glúteos"], groups:["core"], pose:{stance:"plankFront",arms:null,equip:null} },
{ name:"Prancha lateral", equip:"Solo", primary:["Oblíquo interno e externo"], secondary:["Transverso","Glúteo médio"], groups:["core"], pose:{stance:"plankSide",arms:null,equip:null} },
{ name:"Elevação de pernas suspensa", equip:"Barra fixa", primary:["Reto abdominal (inferior)"], secondary:["Flexores do quadril","Antebraço"], groups:["core"], pose:{stance:"hangingLegsRaised",arms:"grippingBar",equip:null} },
{ name:"Abdominal oblíquo (russian twist)", equip:"Solo / Disco", primary:["Oblíquos"], secondary:["Reto abdominal"], groups:["core"], pose:{stance:"seated",arms:null,equip:null} },
{ name:"Elevação de quadril (reverse crunch)", equip:"Banco / Solo", primary:["Reto abdominal (inferior)"], secondary:["Oblíquos","Flexores do quadril"], groups:["core"], pose:{stance:"lyingFloorSupine",arms:null,equip:null} },
{ name:"Hiperextensão lombar", equip:"Banco romano (GHD)", primary:["Eretor da coluna"], secondary:["Glúteos","Isquiotibiais"], groups:["core"], pose:{stance:"hyperextBench",arms:null,equip:null} },
{ name:"Superman", equip:"Solo", primary:["Eretor da coluna"], secondary:["Glúteos","Deltoides"], groups:["core"], pose:{stance:"lyingFloorProne",arms:null,equip:null} },
{ name:"Ab wheel rollout", equip:"Roda abdominal", primary:["Reto abdominal","Transverso"], secondary:["Deltoide anterior","Latíssimo"], groups:["core"], pose:{stance:"kneelingBentTorso",arms:"forearmSupport",equip:null} },
{ name:"Cable woodchopper", equip:"Polia alta ou baixa", primary:["Oblíquos"], secondary:["Reto abdominal"], groups:["core"], pose:{stance:"standing",arms:"pullToChest",equip:"cableHigh"} },
{ name:"Dead bug", equip:"Solo", primary:["Transverso do abdômen"], secondary:["Reto abdominal","Flexores do quadril"], groups:["core"], pose:{stance:"lyingFloorSupine",arms:null,equip:null} },
{ name:"Hollow body hold", equip:"Solo", primary:["Reto abdominal"], secondary:["Transverso","Flexores do quadril"], groups:["core"], pose:{stance:"lyingFloorSupine",arms:null,equip:null} },

// ---------------- ANTEBRAÇO ----------------
{ name:"Rosca de punho (wrist curl)", equip:"Barra / Halteres", primary:["Flexores do punho"], secondary:["Braquiorradial"], groups:["antebraco"], pose:{stance:"seated",arms:"wristRest",equip:"dumbbells"} },
{ name:"Rosca de punho invertida", equip:"Barra / Halteres", primary:["Extensores do punho"], secondary:[], groups:["antebraco"], pose:{stance:"seated",arms:"wristRest",equip:"dumbbells"} },
{ name:"Farmer's walk", equip:"Halteres / Kettlebells", primary:["Antebraço (flexores de pegada)"], secondary:["Trapézio","Core"], groups:["antebraco","trapezio"], pose:{stance:"standing",arms:"down",equip:"dumbbells"} },
{ name:"Dead hang (pendurado na barra)", equip:"Barra fixa", primary:["Antebraço (flexores de pegada)"], secondary:["Ombros","Core"], groups:["antebraco"], pose:{stance:"hanging",arms:"grippingBar",equip:null} },
{ name:"Wrist roller", equip:"Rolo com corda e peso", primary:["Flexores e extensores do punho"], secondary:["Antebraço geral"], groups:["antebraco"], pose:{stance:"standing",arms:"frontOut",equip:null} },
{ name:"Plate pinch", equip:"Anilhas", primary:["Flexores dos dedos"], secondary:["Antebraço geral"], groups:["antebraco"], pose:{stance:"standing",arms:"down",equip:"plate"} },

// ---------------- TRAPÉZIO ----------------
{ name:"Crucifixo invertido inclinado", equip:"Halteres / Máquina", primary:["Trapézio médio/inferior","Deltoide posterior"], secondary:["Romboides"], groups:["trapezio","ombro"], pose:{stance:"proneOnInclineBench",arms:"lateralOut",equip:"dumbbells"} },
{ name:"Levantamento terra (deadlift)", equip:"Barra", primary:["Trapézio (isométrico)","Eretor da coluna"], secondary:["Glúteos","Isquiotibiais","Antebraço"], groups:["trapezio","posterior","gluteos"], pose:{stance:"bentOver",arms:"down",equip:"barbell"} },

// ---------------- ADUTORES / ABDUTORES ----------------
{ name:"Cadeira adutora", equip:"Máquina adutora", primary:["Adutores da coxa"], secondary:["Core"], groups:["adutor_abdutor"], pose:{stance:"seatedLegsSqueeze",arms:null,equip:null} },
{ name:"Cadeira abdutora", equip:"Máquina abdutora", primary:["Glúteo médio/mínimo"], secondary:["Core"], groups:["adutor_abdutor","gluteos"], pose:{stance:"seatedLegsSpread",arms:null,equip:null} },
{ name:"Elevação lateral de perna", equip:"Faixa elástica / Polia", primary:["Glúteo médio/mínimo"], secondary:["Core"], groups:["adutor_abdutor","gluteos"], pose:{stance:"standingWide",arms:null,equip:"band"} },
{ name:"Clamshell", equip:"Faixa elástica", primary:["Glúteo médio/mínimo"], secondary:["Oblíquos","Core"], groups:["adutor_abdutor","gluteos"], pose:{stance:"sideLyingFloor",arms:null,equip:null} },
{ name:"Copenhagen plank", equip:"Banco / Solo", primary:["Adutores da coxa"], secondary:["Oblíquos","Core"], groups:["adutor_abdutor"], pose:{stance:"plankSide",arms:null,equip:null} },
];

// index rápido por nome
const EX_BY_NAME = {};
EX.forEach(e => EX_BY_NAME[e.name] = e);

// =====================================================
// FICHA PADRÃO — a estrutura atual da semana
// =====================================================
const FICHA_DEFAULT = [
  { day:"SEG", label:"Tríceps + Abdominais", exercises:["Tríceps testa (skull crusher)","Tríceps polia unilateral","Tríceps coice (kickback)","Tríceps pulley — corda","Mergulho em paralelas (dips)","Abdominal crunch"] },
  { day:"TER", label:"Perna 1", exercises:["Agachamento livre (back squat)","Leg press","Extensão de perna (leg extension)","Cadeira adutora","Leg curl deitado","Elevação de panturrilha no leg press"] },
  { day:"QUA", label:"Costas + Ombro", exercises:["Barra fixa (pull-up)","Remada unilateral (serrote)","Remada baixa (cabo sentado)","Pullover","Face pull","Reverse crucifix (polia alta)"] },
  { day:"QUI", label:"Perna 2", exercises:["Agachamento búlgaro","Hip thrust","Cadeira abdutora","Stiff","Leg curl sentado","Hack squat","Elevação de panturrilha sentado"] },
  { day:"SEX", label:"Bíceps + Ombro", exercises:["Barra fixa (pegada neutra)","Rosca martelo","Rosca direta (barra)","Rosca Scott (preacher curl)","Elevação lateral","Arnold press"] },
  { day:"SAB", label:"Peitoral + Abdominais", exercises:["Supino reto","Peck deck (voador)","Supino inclinado","Crossover (polia alta)","Squeeze Press com anilha","Abdominal crunch"] },
];
