// =====================================================
// MOTOR DE POSES — figura esquemática de perfil
// Composição em camadas: STANCE (tronco+pernas+cabeça) + ARMS (braços) + EQUIP (equipamento)
// Canvas padrão: viewBox 0 0 160 140
// =====================================================

function L(x1,y1,x2,y2,cls='b'){ return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="fig-${cls}"/>`; }
function C(cx,cy,r,cls='b'){ return `<circle cx="${cx}" cy="${cy}" r="${r}" class="fig-${cls}"/>`; }
function Rc(x,y,w,h,rx,cls='bench'){ return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="fig-${cls}"/>`; }
function G(inner, transform){ return `<g transform="${transform}">${inner}</g>`; }

// ---------------- STANCES (tronco + cabeça + pernas) ----------------
// cada stance retorna { svg, shoulder:{x,y} } — o ombro é o ponto de ancoragem dos braços

const STANCE = {
  standing: () => ({
    shoulder:{x:80,y:38},
    svg: C(80,26,9,'head') + L(80,38,80,78,'body')
       + L(80,78,74,108,'body') + L(74,108,72,132,'body')
       + L(80,78,88,108,'body') + L(88,108,90,132,'body')
       + L(58,132,112,132,'ground')
  }),
  standingWide: () => ({
    shoulder:{x:80,y:38},
    svg: C(80,26,9,'head') + L(80,38,80,78,'body')
       + L(80,78,62,110,'body') + L(62,110,58,132,'body')
       + L(80,78,98,110,'body') + L(98,110,102,132,'body')
       + L(50,132,120,132,'ground')
  }),
  bentOver: () => ({
    shoulder:{x:114,y:56},
    svg: C(120,45,9,'head') + L(76,80,114,56,'body')
       + L(76,80,68,108,'body') + L(68,108,66,132,'body')
       + L(76,80,84,108,'body') + L(84,108,88,132,'body')
       + L(50,132,112,132,'ground')
  }),
  squatBottom: () => ({
    shoulder:{x:78,y:50},
    svg: C(78,38,9,'head') + L(80,85,78,50,'body')
       + L(80,85,58,92,'body') + L(58,92,56,122,'body')
       + L(80,85,100,92,'body') + L(100,92,102,122,'body')
       + L(56,122,70,132,'body') + L(102,122,116,132,'body')
       + L(38,132,124,132,'ground')
  }),
  lunge: () => ({
    shoulder:{x:78,y:45},
    svg: C(78,33,9,'head') + L(80,78,78,45,'body')
       + L(80,78,58,96,'body') + L(58,96,56,130,'body')
       + L(80,78,106,100,'body') + L(106,100,124,128,'body')
       + L(38,130,132,130,'ground')
  }),
  splitRearElevated: () => ({
    shoulder:{x:70,y:42},
    svg: C(70,30,9,'head') + L(72,75,70,42,'body')
       + L(72,75,52,92,'body') + L(52,92,50,128,'body')
       + L(72,75,98,85,'body') + L(98,85,120,78,'body')
       + Rc(112,72,26,8,3,'bench')
       + L(34,128,110,128,'ground')
  }),
  seated: () => ({
    shoulder:{x:80,y:42},
    svg: C(80,30,9,'head') + L(80,78,80,42,'body')
       + L(80,78,106,86,'body') + L(106,86,110,116,'body')
       + Rc(58,116,60,10,3,'bench')
       + L(46,126,132,126,'ground')
  }),
  seatedLegsForward: () => ({
    shoulder:{x:66,y:42},
    svg: C(66,30,9,'head') + L(66,78,66,42,'body')
       + L(66,78,100,80,'body') + L(100,80,128,62,'legaction')
       + Rc(46,78,42,10,3,'bench')
       + L(36,126,140,126,'ground')
  }),
  seatedLegBentUnder: () => ({
    shoulder:{x:70,y:42},
    svg: C(70,30,9,'head') + L(70,78,70,42,'body')
       + L(70,78,102,82,'body') + L(102,82,96,112,'legaction')
       + Rc(50,78,42,10,3,'bench')
       + L(40,126,130,126,'ground')
  }),
  lyingBenchFlat: () => ({
    shoulder:{x:64,y:60},
    svg: Rc(30,68,112,14,4,'bench')
       + C(50,60,9,'head') + L(64,60,102,60,'body')
       + L(102,60,122,80,'body') + L(122,80,120,106,'body')
       + L(102,60,112,84,'body') + L(112,84,106,108,'body')
       + L(90,106,140,106,'ground')
  }),
  lyingBenchIncline: () => ({
    shoulder:{x:56,y:70},
    svg: G(Rc(0,0,95,14,4,'bench'), 'translate(30,95) rotate(-32)')
       + C(46,58,9,'head') + L(58,68,94,90,'body')
       + L(94,90,116,102,'body') + L(116,102,114,128,'body')
       + L(94,90,104,110,'body') + L(104,110,98,130,'body')
       + L(80,128,144,128,'ground')
  }),
  proneOnInclineBench: () => ({
    shoulder:{x:56,y:48},
    svg: G(Rc(0,0,100,14,4,'bench'), 'translate(38,36) rotate(38)')
       + C(50,38,9,'head') + L(56,48,90,80,'body')
       + L(90,80,108,98,'body') + L(108,98,106,126,'body')
       + L(90,80,100,104,'body') + L(100,104,94,128,'body')
       + L(78,126,140,126,'ground')
  }),
  lyingFloorSupine: () => ({
    shoulder:{x:58,y:104},
    svg: C(46,104,9,'head') + L(58,104,96,104,'body')
       + L(96,104,110,88,'body') + L(110,88,128,94,'legaction')
       + L(30,126,142,126,'ground')
  }),
  lyingFloorProne: () => ({
    shoulder:{x:54,y:100},
    svg: C(44,98,9,'head') + L(54,100,96,100,'body')
       + L(96,100,116,108,'body') + L(116,108,118,128,'body')
       + L(30,128,140,128,'ground')
  }),
  hanging: () => ({
    shoulder:{x:80,y:34},
    svg: L(50,10,110,10,'equip')
       + C(80,24,9,'head') + L(80,34,80,72,'body')
       + L(80,72,74,102,'body') + L(74,102,72,128,'body')
       + L(80,72,86,102,'body') + L(86,102,88,128,'body')
  }),
  hangingLegsRaised: () => ({
    shoulder:{x:80,y:34},
    svg: L(50,10,110,10,'equip')
       + C(80,24,9,'head') + L(80,34,80,68,'body')
       + L(80,68,100,64,'legaction') + L(100,64,120,56,'legaction')
  }),
  plankFront: () => ({
    shoulder:{x:52,y:84},
    svg: C(40,86,9,'head') + L(52,84,108,80,'body')
       + L(52,84,54,110,'equip')
       + L(108,80,124,108,'body') + L(124,108,126,128,'body')
       + L(30,128,140,128,'ground')
  }),
  plankSide: () => ({
    shoulder:{x:56,y:78},
    svg: C(44,80,9,'head') + L(56,78,110,76,'body')
       + L(56,78,58,104,'equip')
       + L(110,76,124,98,'body') + L(124,98,126,120,'body')
       + L(30,120,140,120,'ground')
  }),
  kneeling: () => ({
    shoulder:{x:78,y:46},
    svg: C(78,34,9,'head') + L(78,46,78,80,'body')
       + L(78,80,60,84,'body') + L(60,84,58,110,'body')
       + L(78,80,96,84,'body') + L(96,84,98,110,'body')
       + L(40,110,116,110,'ground')
  }),
  kneelingBentTorso: () => ({
    shoulder:{x:98,y:56},
    svg: C(104,46,9,'head') + L(78,80,98,56,'body')
       + L(78,80,60,84,'body') + L(60,84,58,110,'body')
       + L(78,80,96,84,'body') + L(96,84,98,110,'body')
       + L(40,110,120,110,'ground')
  }),
  sideLyingFloor: () => ({
    shoulder:{x:58,y:74},
    svg: C(46,72,9,'head') + L(58,74,94,78,'body')
       + L(94,78,108,80,'legaction')
       + L(30,98,140,98,'ground')
  }),
  oneKneeOnBench: () => ({
    shoulder:{x:96,y:52},
    svg: C(102,42,9,'head') + L(80,76,96,52,'body')
       + L(80,76,58,84,'body') + L(58,84,54,116,'body')
       + L(80,76,98,88,'body') + Rc(90,84,36,8,3,'bench')
       + L(38,116,140,116,'ground')
  }),
  hyperextBench: () => ({
    shoulder:{x:100,y:56},
    svg: Rc(66,78,30,12,3,'bench')
       + C(106,46,9,'head') + L(80,84,100,56,'body')
       + L(80,84,72,108,'body') + L(72,108,70,130,'body')
       + L(80,84,88,108,'body') + L(88,108,86,130,'body')
       + L(40,130,132,130,'ground')
  }),
  hipThrustTop: () => ({
    shoulder:{x:40,y:64},
    svg: Rc(18,66,30,12,3,'bench')
       + C(34,52,9,'head') + L(40,64,88,88,'body')
       + L(88,88,88,112,'legaction') + L(88,112,66,126,'body')
       + L(88,88,108,110,'legaction') + L(108,110,130,124,'body')
       + L(50,126,150,126,'ground')
  }),
  seatedLegsSqueeze: () => ({
    shoulder:{x:80,y:42},
    svg: C(80,30,9,'head') + L(80,78,80,42,'body')
       + L(80,78,96,84,'legaction') + L(96,84,96,116,'legaction')
       + L(80,78,64,84,'legaction') + L(64,84,64,116,'legaction')
       + Rc(50,116,60,10,3,'bench')
       + L(40,126,130,126,'ground')
  }),
  seatedLegsSpread: () => ({
    shoulder:{x:80,y:42},
    svg: C(80,30,9,'head') + L(80,78,80,42,'body')
       + L(80,78,112,88,'legaction') + L(112,88,120,116,'legaction')
       + L(80,78,48,88,'legaction') + L(48,88,40,116,'legaction')
       + Rc(50,116,60,10,3,'bench')
       + L(40,126,130,126,'ground')
  }),
  standingKickbackSupport: () => ({
    shoulder:{x:106,y:54},
    svg: C(112,44,9,'head') + L(80,80,106,54,'body')
       + L(106,54,124,60,'body')
       + Rc(120,52,10,20,3,'bench')
       + L(80,80,62,90,'body') + L(62,90,58,120,'body')
       + L(80,80,100,88,'legaction') + L(100,88,124,86,'legaction')
       + L(36,120,116,120,'ground')
  }),
};

// ---------------- ARM OVERLAYS ----------------
// recebem o ponto de ombro e devolvem svg + ponto de mão (para posicionar equipamento)

const ARMS = {
  down: (s) => ({
    svg: L(s.x,s.y,s.x-8,s.y+26,'body') + L(s.x-8,s.y+26,s.x-10,s.y+50,'body')
       + L(s.x,s.y,s.x+8,s.y+26,'body') + L(s.x+8,s.y+26,s.x+10,s.y+50,'body'),
    hand:{x:s.x-10,y:s.y+50}, hand2:{x:s.x+10,y:s.y+50}
  }),
  curlUp: (s) => ({
    svg: L(s.x,s.y,s.x-10,s.y+22,'body') + L(s.x-10,s.y+22,s.x+2,s.y+6,'body')
       + L(s.x,s.y,s.x+10,s.y+22,'body') + L(s.x+10,s.y+22,s.x+22,s.y+6,'body'),
    hand:{x:s.x+2,y:s.y+6}, hand2:{x:s.x+22,y:s.y+6}
  }),
  overheadPress: (s) => ({
    svg: L(s.x,s.y,s.x+14,s.y-14,'body') + L(s.x+14,s.y-14,s.x+16,s.y-38,'body')
       + L(s.x,s.y,s.x-2,s.y-16,'body') + L(s.x-2,s.y-16,s.x+2,s.y-40,'body'),
    hand:{x:s.x+16,y:s.y-38}, hand2:{x:s.x+2,y:s.y-40}
  }),
  lateralOut: (s) => ({
    svg: L(s.x,s.y,s.x-26,s.y+4,'body') + L(s.x-26,s.y+4,s.x-40,s.y+2,'body')
       + L(s.x,s.y,s.x+8,s.y-4,'body') + L(s.x+8,s.y-4,s.x+20,s.y-2,'body'),
    hand:{x:s.x-40,y:s.y+2}, hand2:{x:s.x+20,y:s.y-2}
  }),
  frontOut: (s) => ({
    svg: L(s.x,s.y,s.x+22,s.y-2,'body') + L(s.x+22,s.y-2,s.x+42,s.y-6,'body')
       + L(s.x,s.y,s.x+10,s.y+16,'body') + L(s.x+10,s.y+16,s.x+8,s.y+34,'body'),
    hand:{x:s.x+42,y:s.y-6}, hand2:{x:s.x+8,y:s.y+34}
  }),
  pullToChest: (s) => ({
    svg: L(s.x,s.y,s.x+24,s.y-4,'body') + L(s.x+24,s.y-4,s.x+8,s.y+8,'body')
       + L(s.x,s.y,s.x+22,s.y+8,'body') + L(s.x+22,s.y+8,s.x+8,s.y+16,'body'),
    hand:{x:s.x+8,y:s.y+8}, hand2:{x:s.x+8,y:s.y+16}
  }),
  rowBent: (s) => ({
    // puxada horizontal com tronco inclinado — mãos vêm em direção ao tronco/quadril, não à cabeça
    svg: L(s.x,s.y,s.x-24,s.y+8,'body') + L(s.x-24,s.y+8,s.x-30,s.y+30,'body')
       + L(s.x,s.y,s.x-14,s.y+20,'body') + L(s.x-14,s.y+20,s.x-18,s.y+42,'body'),
    hand:{x:s.x-30,y:s.y+30}, hand2:{x:s.x-18,y:s.y+42}
  }),
  pushUpLying: (s) => ({
    svg: L(s.x,s.y,s.x-4,s.y-22,'body') + L(s.x-4,s.y-22,s.x+4,s.y-40,'body')
       + L(s.x,s.y,s.x+10,s.y-20,'body') + L(s.x+10,s.y-20,s.x+18,s.y-40,'body'),
    hand:{x:s.x+4,y:s.y-40}, hand2:{x:s.x+18,y:s.y-40}
  }),
  wideArcLying: (s) => ({
    svg: L(s.x,s.y,s.x-10,s.y-22,'body') + L(s.x-10,s.y-22,s.x-6,s.y-42,'body')
       + L(s.x,s.y,s.x+18,s.y-18,'body') + L(s.x+18,s.y-18,s.x+22,s.y-38,'body'),
    hand:{x:s.x-6,y:s.y-42}, hand2:{x:s.x+22,y:s.y-38}
  }),
  pushDown: (s) => ({
    svg: L(s.x,s.y,s.x+10,s.y+20,'body') + L(s.x+10,s.y+20,s.x+8,s.y+44,'body')
       + L(s.x,s.y,s.x-2,s.y+18,'body') + L(s.x-2,s.y+18,s.x-4,s.y+40,'body'),
    hand:{x:s.x+8,y:s.y+44}, hand2:{x:s.x-4,y:s.y+40}
  }),
  behindExtended: (s) => ({
    svg: L(s.x,s.y,s.x-16,s.y+10,'body') + L(s.x-16,s.y+10,s.x-36,s.y+6,'body'),
    hand:{x:s.x-36,y:s.y+6}, hand2:null
  }),
  overheadBent: (s) => ({
    svg: L(s.x,s.y,s.x+8,s.y-24,'body') + L(s.x+8,s.y-24,s.x-6,s.y-10,'body'),
    hand:{x:s.x-6,y:s.y-10}, hand2:null
  }),
  grippingBar: (s) => ({
    svg: L(s.x,s.y,s.x-20,s.y-14,'body') + L(s.x-20,s.y-14,s.x-24,s.y-30,'body')
       + L(s.x,s.y,s.x+20,s.y-14,'body') + L(s.x+20,s.y-14,s.x+24,s.y-30,'body'),
    hand:{x:s.x-24,y:s.y-30}, hand2:{x:s.x+24,y:s.y-30}
  }),
  forearmSupport: (s) => ({
    svg: L(s.x,s.y,s.x-4,s.y+18,'body') + L(s.x-4,s.y+18,s.x-2,s.y+26,'body'),
    hand:{x:s.x-2,y:s.y+26}, hand2:null
  }),
  oneArmRow: (s) => ({
    svg: L(s.x,s.y,s.x-14,s.y+16,'body') + L(s.x-14,s.y+16,s.x-8,s.y+30,'body'),
    hand:{x:s.x-8,y:s.y+30}, hand2:null
  }),
  barOnBack: (s) => ({
    svg: '',
    hand:{x:s.x-20,y:s.y-4}, hand2:{x:s.x+20,y:s.y-4}
  }),
  wristRest: (s) => ({
    svg: L(s.x,s.y,s.x+18,s.y+30,'body') + L(s.x+18,s.y+30,s.x+34,s.y+34,'body'),
    hand:{x:s.x+34,y:s.y+34}, hand2:null
  }),
};

// ---------------- EQUIPMENT OVERLAYS ----------------
// desenhados em cima da mão/mãos

const EQUIP = {
  none: () => '',
  barbell: (a) => {
    if(!a.hand2) return '';
    const midY = (a.hand.y+a.hand2.y)/2;
    return L(a.hand.x-10,a.hand.y,a.hand2.x+10,a.hand2.y,'equip')
         + C(a.hand.x-12,a.hand.y,5,'equipfill') + C(a.hand2.x+12,a.hand2.y,5,'equipfill');
  },
  dumbbells: (a) => {
    let s = C(a.hand.x,a.hand.y,5,'equipfill');
    if(a.hand2) s += C(a.hand2.x,a.hand2.y,5,'equipfill');
    return s;
  },
  cableHigh: (a) => L(a.hand.x,0,a.hand.x,a.hand.y,'equipdash') + C(a.hand.x,a.hand.y,4,'equipfill')
                  + (a.hand2 ? L(a.hand2.x,0,a.hand2.x,a.hand2.y,'equipdash') + C(a.hand2.x,a.hand2.y,4,'equipfill') : ''),
  cableLow: (a) => L(a.hand.x,140,a.hand.x,a.hand.y,'equipdash') + C(a.hand.x,a.hand.y,4,'equipfill')
                  + (a.hand2 ? L(a.hand2.x,140,a.hand2.x,a.hand2.y,'equipdash') + C(a.hand2.x,a.hand2.y,4,'equipfill') : ''),
  machine: (a) => Rc(a.hand.x-6,a.hand.y-6,12,12,3,'equip') + (a.hand2 ? Rc(a.hand2.x-6,a.hand2.y-6,12,12,3,'equip') : ''),
  plate: (a) => C(a.hand.x,a.hand.y,7,'equipfill'),
  band: (a) => L(a.hand.x,120,a.hand.x,a.hand.y,'equipdash'),
};

// ---------------- COMPOSIÇÃO ----------------
function applyZoneHighlight(stanceSvg, armSvg, zone){
  if(zone === 'torso'){
    let first = true;
    stanceSvg = stanceSvg.replace(/class="fig-body"/g, m => { if(first){ first=false; return 'class="fig-hl"'; } return m; });
  } else if(zone === 'legs'){
    let first = true;
    stanceSvg = stanceSvg.replace(/class="fig-body"/g, m => { if(first){ first=false; return m; } return 'class="fig-hl"'; });
    stanceSvg = stanceSvg.replace(/class="fig-legaction"/g, 'class="fig-hl"');
  } else if(zone === 'arms'){
    armSvg = armSvg.replace(/class="fig-body"/g, 'class="fig-hl"');
  }
  return {stanceSvg, armSvg};
}

function buildPose(stanceKey, armsKey, equipKey, zone){
  const st = STANCE[stanceKey]();
  let armSvg = '', equipSvg = '';
  if(armsKey){
    const a = ARMS[armsKey](st.shoulder);
    armSvg = a.svg;
    equipSvg = EQUIP[equipKey||'none'](a);
  }
  let stanceSvg = st.svg;
  if(zone){
    const tagged = applyZoneHighlight(stanceSvg, armSvg, zone);
    stanceSvg = tagged.stanceSvg;
    armSvg = tagged.armSvg;
  }
  return `<svg viewBox="0 0 160 140" class="pose-svg">${stanceSvg}${armSvg}${equipSvg}</svg>`;
}
