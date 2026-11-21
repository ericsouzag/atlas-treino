// Personagem: corpo sugerido pelos dados, modo manual/automático, ocultar mudanças, menores, histórico.
import { teste, igual, perto, ok, fim } from './_t.mjs';
import { renderPersonagemSVG, geometria, descreverPersonagem } from '../js/personagem-svg.js';
import {
  PARAMS, PADRAO_CORPO, LIM_MIN, LIM_MAX, sugerirCorpo, corpoEfetivo, editarParametro, seguirDados, manterDesenho, definirOcultarMudancas, registrarHistorico,
  diferencaCorpo, entradaDoPerfil, lerPersonagem, personagemPadrao, modoDoParametro, limitar,
} from '../js/personagem.js';

const dentro = c => PARAMS.every(k => c[k] >= LIM_MIN - 1e-9 && c[k] <= LIM_MAX + 1e-9);
const base = { alturaCm: 175, idade: 30 };

teste('sem altura/peso devolve o padrão (e só a altura quando é o único dado)', () => {
  const s = sugerirCorpo({}); for (const k of PARAMS) igual(s[k], PADRAO_CORPO[k]);
  const a = sugerirCorpo({ alturaCm: 190 }); perto(a.altura, 0.8, 0.01); igual(a.volume, PADRAO_CORPO.volume);
});
teste('homem, mulher e sexo não informado: sempre dentro da faixa saudável 0,15 a 0,85', () => {
  for (const sexo of ['M', 'F', null]) for (const peso of [45, 60, 75, 90, 120, 160]) for (const g of [null, 8, 15, 25, 40]) {
    const s = sugerirCorpo({ ...base, sexo, pesoKg: peso, gordura: g }); ok(dentro(s), `${sexo} ${peso} ${g}`);
  }
});
teste('mais gordura -> mais volume e menos definição; menos gordura -> o contrário (homem, com %G)', () => {
  const magro = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 70, gordura: 12 }), medio = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 80, gordura: 20 }), alto = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 100, gordura: 32 });
  ok(magro.volume < medio.volume && medio.volume < alto.volume); ok(magro.definicao > medio.definicao && medio.definicao > alto.definicao);
});
teste('mulher usa faixa de gordura própria: 25% pesa diferente de 25% em homem', () => {
  const m = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 70, gordura: 25 }), f = sugerirCorpo({ ...base, sexo: 'F', pesoKg: 62, gordura: 25 });
  ok(f.volume < m.volume, 'a mesma % de gordura é "mais baixa" na faixa feminina');
});
teste('sem %G: estimativa por IMC (Deurenberg) e a sugestão avisa que foi estimada', () => {
  const s = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 95, gordura: null }); igual(s.estimado, true); ok(dentro(s));
  const c = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 95, gordura: 28 }); igual(c.estimado, false);
  ok(s.volume > sugerirCorpo({ ...base, sexo: 'M', pesoKg: 65, gordura: null }).volume);
});
teste('músculos: mais massa magra e medidas maiores aumentam ombros, braços e pernas', () => {
  const leve = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 60, gordura: 15 }), forte = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 90, gordura: 15 });
  ok(forte.ombros > leve.ombros && forte.bracos > leve.bracos && forte.pernas > leve.pernas);
  const med = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 80, gordura: 18, medidas: { cintura: 80, ombros: 120, braco_d: 40, coxa_d: 66 } });
  const sem = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 80, gordura: 18 });
  ok(med.ombros > sem.ombros && med.bracos > sem.bracos && med.pernas > sem.pernas);
});
teste('IMC abaixo de 18,5: o desenho não fica mais magro nem mais "seco"', () => {
  const s = sugerirCorpo({ ...base, sexo: 'F', pesoKg: 48, gordura: 14 });   // IMC ~15,7
  ok(s.volume >= 0.35 && s.definicao <= 0.55);
});
teste('menor de 18 anos: variações sutis (próximas de 0,5), exceto a altura', () => {
  const adulto = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 110, gordura: 35 }), menor = sugerirCorpo({ alturaCm: 170, idade: 15, sexo: 'M', pesoKg: 110, gordura: 35 });
  ok(Math.abs(menor.volume - 0.5) < Math.abs(adulto.volume - 0.5) * 0.5, `menor ${menor.volume} adulto ${adulto.volume}`);
  ok(Math.abs(menor.volume - 0.5) <= 0.35 * 0.35 + 1e-9);
});
teste('o corpo muda quando entram novos dados (peso e %G)', () => {
  const antes = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 100, gordura: 30 }), depois = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 88, gordura: 22 });
  ok(depois.volume < antes.volume && depois.definicao > antes.definicao); ok(diferencaCorpo(antes, depois) > 0.1);
});

console.log('\nModo automático, manual e ocultar mudanças');
teste('automático segue a sugestão; editar um parâmetro para o automático SÓ nele', () => {
  const s = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 80, gordura: 20 }), p0 = personagemPadrao();
  const e0 = corpoEfetivo(p0, s); for (const k of PARAMS) perto(e0[k], limitar(s[k]), 1e-9);
  const p1 = editarParametro(p0, 'ombros', 0.8), e1 = corpoEfetivo(p1, s);
  igual(e1.ombros, 0.8); igual(modoDoParametro(p1, 'ombros'), 'manual'); igual(modoDoParametro(p1, 'volume'), 'auto');
  const s2 = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 95, gordura: 28 }), e2 = corpoEfetivo(p1, s2);
  igual(e2.ombros, 0.8, 'ombros manual não muda'); perto(e2.volume, limitar(s2.volume), 1e-9);
});
teste('"voltar a seguir meus dados": um parâmetro ou todos', () => {
  const s = sugerirCorpo({ ...base, sexo: 'F', pesoKg: 65, gordura: 28 });
  let p = editarParametro(editarParametro(personagemPadrao(), 'bracos', 0.2), 'pernas', 0.7);
  p = seguirDados(p, 'bracos'); igual(modoDoParametro(p, 'bracos'), 'auto'); igual(modoDoParametro(p, 'pernas'), 'manual'); perto(corpoEfetivo(p, s).bracos, limitar(s.bracos), 1e-9);
  p = seguirDados(p); igual(modoDoParametro(p, 'pernas'), 'auto'); ok(!Object.keys(p.manual).length);
});
teste('"manter o meu desenho" congela o corpo atual; limites são respeitados em edições absurdas', () => {
  const s = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 80, gordura: 20 }), p = manterDesenho(personagemPadrao(), s);
  const s2 = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 120, gordura: 38 }), e = corpoEfetivo(p, s2);
  for (const k of PARAMS) perto(e[k], limitar(s[k]), 1e-9);
  igual(corpoEfetivo(editarParametro(personagemPadrao(), 'volume', 5), s).volume, LIM_MAX); igual(corpoEfetivo(editarParametro(personagemPadrao(), 'volume', -3), s).volume, LIM_MIN);
});
teste('"ocultar mudanças corporais": o corpo fica fixo no desenho atual mesmo com dados novos', () => {
  const s = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 100, gordura: 30 });
  const p = definirOcultarMudancas(personagemPadrao(), s, true), s2 = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 80, gordura: 15 });
  const e = corpoEfetivo(p, s2); for (const k of PARAMS) perto(e[k], limitar(s[k]), 1e-9);
  const livre = definirOcultarMudancas(p, s2, false); igual(livre.ocultarMudancas, false); perto(corpoEfetivo(livre, s2).volume, limitar(s2.volume), 1e-9);
});
teste('histórico: só registra mudança real e a cada 7 dias; guarda no máximo 12; sem números de peso', () => {
  const a = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 100, gordura: 30 }), b = sugerirCorpo({ ...base, sexo: 'M', pesoKg: 85, gordura: 20 });
  let h = registrarHistorico([], '2026-01-01', a); igual(h.length, 1);
  igual(registrarHistorico(h, '2026-01-03', b).length, 1, 'menos de 7 dias'); igual(registrarHistorico(h, '2026-01-10', a).length, 1, 'sem mudança');
  igual(registrarHistorico(h, '2026-01-10', b).length, 2);
  let x = h; for (let i = 0; i < 20; i++) x = registrarHistorico(x, `2026-0${1 + Math.floor(i / 3)}-${10 + (i % 3) * 7}`, i % 2 ? a : b);
  ok(x.length <= 12); ok(Object.keys(h[0]).join() === 'data,corpo' && !JSON.stringify(h).includes('peso'));
});
teste('entradaDoPerfil pega o último peso, a última %G e junta as medidas; lerPersonagem tolera dados antigos', () => {
  const e = entradaDoPerfil({ perfil: { sexo: 'F', altura: 165, peso: 70 }, corpo: [{ data: '2026-01-01', peso: 70, gordura: 30, medidas: { cintura: 80 } }, { data: '2026-02-01', peso: 66, medidas: { braco_d: 29 } }], idade: 28 });
  igual(e.pesoKg, 66); igual(e.gordura, 30); igual(e.medidas.cintura, 80); igual(e.medidas.braco_d, 29); igual(e.sexo, 'F');
  const p = lerPersonagem({ nome: 'Ana' }); igual(p.nome, 'Ana'); igual(p.silhueta, 'neutro'); igual(p.cabelo.estilo, 'curto'); igual(lerPersonagem(null).criado, false);
});

console.log('\nSVG');
teste('SVG: válido, acessível (role img + title), sem NaN, escapa o nome e funciona com todas as silhuetas/estilos', () => {
  for (const sil of ['neutro', 'fem', 'masc']) for (const est of ['curto', 'medio', 'longo', 'coque', 'cacheado', 'raspado']) for (const ex of ['sorriso', 'alegre', 'neutra', 'determinada']) {
    const p = { ...personagemPadrao(), silhueta: sil, cabelo: { estilo: est, cor: 1 }, expressao: ex, pele: 4 };
    const svg = renderPersonagemSVG({ personagem: p, corpo: PADRAO_CORPO, nivel: 30 });
    ok(svg.startsWith('<svg') && svg.endsWith('</svg>') && svg.includes('role="img"') && svg.includes('<title'), sil + est + ex); ok(!/NaN|undefined/.test(svg), 'NaN em ' + sil + est);
  }
  const xss = renderPersonagemSVG({ personagem: { ...personagemPadrao(), nome: '<img src=x onerror=alert(1)>' }, nivel: 1 });
  ok(!xss.includes('<img') && xss.includes('&lt;img'));
});
teste('o corpo muda o desenho: mais ombros/volume = mais largura; limites respeitados em valores absurdos', () => {
  const a = geometria({ ...PADRAO_CORPO, ombros: 0.2, volume: 0.2 }), b = geometria({ ...PADRAO_CORPO, ombros: 0.8, volume: 0.8 });
  ok(b.sw > a.sw && b.ww > a.ww && b.hw > a.hw);
  const ext = geometria({ ombros: 99, volume: -5, altura: 50 }), max = geometria({ ombros: 0.85, volume: 0.15, altura: 0.85 }); igual(ext.sw, max.sw); igual(ext.ww, max.ww);
  ok(renderPersonagemSVG({ corpo: { ombros: 0.2 } }) !== renderPersonagemSVG({ corpo: { ombros: 0.8 } }));
  ok(geometria({ definicao: 0.8 }).abs > geometria({ definicao: 0.3 }).abs);
});
teste('silhueta base independe do perfil: masculina, feminina e neutra têm proporções diferentes', () => {
  const m = geometria(PADRAO_CORPO, 'masc'), f = geometria(PADRAO_CORPO, 'fem'), n = geometria(PADRAO_CORPO, 'neutro');
  ok(m.sw > n.sw && n.sw > f.sw && f.hw > m.hw);
});
teste('acessórios só aparecem se o nível libera E a pessoa ativou; moldura sobe com o nível', () => {
  const p = { ...personagemPadrao(), acessorios: ['faixa', 'relogio', 'bone', 'medalha', 'luvas', 'insignia'] };
  const n1 = renderPersonagemSVG({ personagem: p, nivel: 1 }), n30 = renderPersonagemSVG({ personagem: p, nivel: 30 });
  ok(n30.length > n1.length + 300, 'acessórios liberados desenham mais'); ok(!n1.includes('#A3B86A'), 'faixa trancada no nível 1');
  ok(renderPersonagemSVG({ personagem: personagemPadrao(), nivel: 30 }).length < n30.length, 'sem ativar, não aparecem');
  ok(renderPersonagemSVG({ nivel: 45 }).includes('stroke-width="5"') && !renderPersonagemSVG({ nivel: 1 }).includes('<ellipse cx="100" cy="1'));
});
teste('descrição para leitores de tela é curta e positiva', () => {
  const d = descreverPersonagem({ ...personagemPadrao(), nome: 'Ana', acessorios: ['faixa'] }, 5); ok(d.includes('Ana') && d.includes('nível 5') && d.includes('faixa de cabeça')); ok(!/gord|magr/i.test(d));
});
fim();
