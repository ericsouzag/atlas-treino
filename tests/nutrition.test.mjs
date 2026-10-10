import { teste, igual, perto, ok, fim } from './_t.mjs';
import * as N from '../js/nutrition.js';

console.log('TMB / TDEE / metas');
teste('Mifflin homem 80kg 180cm 30a = 1780', () => perto(N.tmbMifflin({ sexo: 'M', peso: 80, altura: 180, idade: 30 }), 1780, 0.01));
teste('Mifflin mulher 60kg 165cm 28a = 1330,25', () => perto(N.tmbMifflin({ sexo: 'F', peso: 60, altura: 165, idade: 28 }), 1330.25, 0.01));
teste('Katch-McArdle 60kg magra = 1666', () => perto(N.tmbKatch(60), 1666, 0.01));
teste('idadeEm', () => igual(N.idadeEm('2000-10-10', new Date('2026-10-09T12:00:00')), 25));
teste('IMC', () => perto(N.imc(80, 180), 24.69, 0.01));
const perfilM = { sexo: 'M', nascimento: '1996-05-01', altura: 180, atividade: 'leve', objetivo: 'perder', diasTreino: 4 };
const HOJE = new Date('2026-10-09T12:00:00');
teste('perder gordura: meta 20% abaixo do TDEE e proteína entre 1,6 e 2,2 g/kg', () => {
  const m = N.calcularMetas(perfilM, 80, null, HOJE);
  ok(m.kcal < m.tdee, 'déficit'); perto(m.kcal / m.tdee, 0.8, 0.01);
  ok(m.prot / 80 >= 1.6 && m.prot / 80 <= 2.2, 'prot ' + m.prot / 80);
  ok(m.carb > 100); ok(m.explicacao.length >= 4);
  igual(m.formula.startsWith('Mifflin'), true);
});
teste('com % gordura usa Katch-McArdle', () => {
  const m = N.calcularMetas(perfilM, 80, 20, HOJE);
  igual(m.formula.startsWith('Katch'), true); perto(m.tmb, 370 + 21.6 * 64, 1);
});
teste('macros fecham com as calorias (±3%)', () => {
  for (const o of ['perder', 'ganhar', 'recomp', 'manter']) {
    const m = N.calcularMetas({ ...perfilM, objetivo: o }, 80, 18, HOJE);
    perto((m.prot * 4 + m.carb * 4 + m.gord * 9) / m.kcal, 1, 0.03, o);
  }
});
teste('menor de 18: déficit limitado a 10% e aviso', () => {
  const m = N.calcularMetas({ ...perfilM, nascimento: '2010-01-01' }, 60, null, HOJE);
  ok(m.menor); ok(m.ajuste >= -0.10 - 1e-9, 'ajuste ' + m.ajuste); ok(m.avisos.length > 0);
});
teste('piso de segurança de calorias', () => {
  const m = N.calcularMetas({ sexo: 'F', nascimento: '1990-01-01', altura: 150, atividade: 'sedentario', objetivo: 'perder', diasTreino: 0 }, 45, null, HOJE);
  ok(m.kcal >= 1200, 'kcal ' + m.kcal);
});
teste('ganhar: superávit', () => {
  const m = N.calcularMetas({ ...perfilM, objetivo: 'ganhar' }, 70, null, HOJE);
  ok(m.kcal > m.tdee);
});

console.log('% de gordura');
teste('Marinha homem (180, cintura 90, pescoço 38) ~ 19,8%', () => {
  perto(N.gorduraMarinha({ sexo: 'M', altura: 180, cintura: 90, pescoco: 38 }), 19.8, 0.6);
});
teste('Marinha mulher (165, cintura 75, pescoço 31, quadril 100) ~ 30,4%', () => {
  perto(N.gorduraMarinha({ sexo: 'F', altura: 165, cintura: 75, pescoco: 31, quadril: 100 }), 30.4, 0.6);
});
teste('Marinha sem quadril (mulher) retorna null', () => igual(N.gorduraMarinha({ sexo: 'F', altura: 165, cintura: 75, pescoco: 31 }), null));
teste('Jackson-Pollock 3 dobras homem 30a (10,15,12) ~ 11,2%', () => {
  perto(N.gorduraJacksonPollock({ sexo: 'M', idade: 30, dobras: { peitoral: 10, abdominal: 15, coxa: 12 } }), 11.2, 0.6);
});
teste('Jackson-Pollock 7 dobras mulher 28a', () => {
  const g = N.gorduraJacksonPollock({ sexo: 'F', idade: 28, protocolo: 7, dobras: { peitoral: 10, axilar: 12, triceps: 18, subescapular: 15, abdominal: 20, suprailiaca: 14, coxa: 24 } });
  ok(g > 15 && g < 30, 'g ' + g);
});
teste('IMC -> % gordura adulto', () => ok(N.gorduraPorIMC({ sexo: 'M', peso: 80, altura: 180, idade: 30 }) > 15));
teste('RCQ', () => perto(N.rcq(80, 100), 0.8, 1e-9));
teste('composição', () => { const c = N.composicao(80, 25); perto(c.massaGorda, 20, 1e-9); perto(c.massaMagra, 60, 1e-9); });

console.log('Dia / alertas');
teste('tipo de refeição por hora', () => { igual(N.tipoRefeicaoPorHora(7.5), 'Café da manhã'); igual(N.tipoRefeicaoPorHora(12.5), 'Almoço'); igual(N.tipoRefeicaoPorHora(19), 'Jantar'); });
teste('alerta de açúcar e bebidas', () => {
  const tot = N.totaisDoDia([{ itens: [{ kcal: 400, acucar: 70, bebidaAcucarada: true, gramas: 600, ultra: true }] }]);
  const a = N.alertasAlimentares(tot, 2000);
  ok(a.some(x => x.titulo.includes('Açúcar')) && a.some(x => x.titulo.includes('Bebidas')));
});
teste('intervalo longo', () => {
  const agora = new Date('2026-10-09T18:00:00');
  const iv = N.intervalos([{ ts: '2026-10-09T08:00:00' }, { ts: '2026-10-09T12:00:00' }], agora, true);
  perto(iv.desdeUltima, 6, 0.01); ok(N.avaliarIntervalo(iv, 5.5, agora));
});
fim();
