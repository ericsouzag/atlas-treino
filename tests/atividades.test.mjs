import { teste, igual, perto, ok, fim } from './_t.mjs';
import * as A from '../js/atividades.js';

console.log('Pace, velocidade e unidades');
teste('lerPace e formatarPace', () => { perto(A.lerPace('5:30'), 5.5, 1e-9); perto(A.lerPace('5,5'), 5.5, 1e-9); igual(A.lerPace('5:75'), null); igual(A.formatarPace(5.5), '5:30'); igual(A.formatarPace(4.999), '5:00'); });
teste('km <-> mi', () => { perto(A.kmParaMi(10), 6.2137, 1e-3); perto(A.miParaKm(1), 1.609344, 1e-9); });
teste('pace min/km <-> min/mi (5:00/km = 8:03/mi)', () => { perto(A.paceKmParaMi(5), 8.0467, 1e-3); perto(A.paceMiParaKm(A.paceKmParaMi(5.3)), 5.3, 1e-9); });
teste('velocidade <-> pace (12 km/h = 5:00/km)', () => { perto(A.velParaPace(12), 5, 1e-9); perto(A.paceParaVel(5), 12, 1e-9); });
teste('resolverRitmo: distância + duração => pace e velocidade', () => { const r = A.resolverRitmo({ distKm: 10, durMin: 50 }); perto(r.paceMinKm, 5, 1e-9); perto(r.velKmh, 12, 1e-9); });
teste('resolverRitmo: distância + pace => duração', () => perto(A.resolverRitmo({ distKm: 5, paceMinKm: 6 }).durMin, 30, 1e-9));
teste('resolverRitmo: duração + pace => distância', () => perto(A.resolverRitmo({ durMin: 45, paceMinKm: 5 }).distKm, 9, 1e-9));
teste('resolverRitmo com dados insuficientes mantém o que há', () => { const r = A.resolverRitmo({ distKm: 5 }); igual(r.durMin, null); igual(r.distKm, 5); });
teste('natação: 1500 m em 30 min = 2:00/100m e inverso', () => { perto(A.resolverNatacao({ metros: 1500, durMin: 30 }).pace100, 2, 1e-9); perto(A.resolverNatacao({ metros: 1000, pace100: 2.5 }).durMin, 25, 1e-9); perto(A.resolverNatacao({ durMin: 40, pace100: 2 }).metros, 2000, 1e-9); });

console.log('MET e kcal');
teste('MET corrida por velocidade (tabela do compêndio)', () => { perto(A.metCorrida(9.7), 9.8, 1e-9); perto(A.metCorrida(11.3), 11.0, 1e-9); const m = A.metCorrida(10.5); ok(m > 9.8 && m < 11.0); });
teste('MET cresce com a velocidade (corrida, caminhada, bike)', () => { ok(A.metCorrida(12) > A.metCorrida(9)); ok(A.metCaminhada(6.4) > A.metCaminhada(4)); ok(A.metBike(28) > A.metBike(18)); });
teste('metDaAtividade usa velocidade quando informada', () => { const lenta = A.metDaAtividade({ atividade: 'corrida', intensidade: 'moderada', velKmh: 8 }), rapida = A.metDaAtividade({ atividade: 'corrida', intensidade: 'moderada', velKmh: 14 }); ok(rapida > lenta); });
teste('metDaAtividade só com intensidade', () => { ok(A.metDaAtividade({ atividade: 'corrida', intensidade: 'intensa' }) > A.metDaAtividade({ atividade: 'corrida', intensidade: 'leve' })); perto(A.metDaAtividade({ atividade: 'corrida', intensidade: 'intervalada' }), 10, 1e-9); perto(A.metDaAtividade({ atividade: 'hiit', intensidade: 'intensa' }), 8.8, 1e-9); perto(A.metDaAtividade({ atividade: 'ciclismo', intensidade: 'moderada', indoor: true }), 6.8, 1e-9); perto(A.metDaAtividade({ atividade: 'natacao', intensidade: 'moderada', estilo: 'crawl' }), 8.3, 1e-9); });
teste('caminhada em subida tem MET mínimo de 6', () => ok(A.metDaAtividade({ atividade: 'caminhada', intensidade: 'leve', terrenoSubida: true }) >= 6));
teste('kcal = (MET-1) x kg x h: 10 km em 50 min, 80 kg a 12 km/h', () => { const met = A.metCorrida(12); perto(A.kcalAtividade(met, 80, 50), (met - 1) * 80 * 50 / 60, 1e-9); ok(A.kcalAtividade(met, 80, 50) > 600 && A.kcalAtividade(met, 80, 50) < 800); });
teste('kcal escala com o peso e a duração, e é 0 sem dados', () => { ok(A.kcalAtividade(8, 90, 30) > A.kcalAtividade(8, 60, 30)); ok(A.kcalAtividade(8, 70, 60) > A.kcalAtividade(8, 70, 30)); igual(A.kcalAtividade(8, 70, 0), 0); });
teste('todas as atividades do catálogo têm MET válido', () => { for (const [id, a] of Object.entries(A.ATIVIDADES)) for (const [i] of a.intensidades) { const m = A.metDaAtividade({ atividade: id, intensidade: i, estilo: 'crawl' }); ok(m >= 1.5 && m <= 20, `${id}/${i} ${m}`); } });
fim();
