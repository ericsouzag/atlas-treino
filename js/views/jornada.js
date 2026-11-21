// Aba "Jornada": personagem, nível e XP, XP de hoje (e por quê), sequências, missões, conquistas, evolução do desenho, editar e "Como funciona".
// As contas ficam em js/gamificacao.js e js/personagem.js (puras e testadas); aqui só a tela.
import { h, limpar, icone, iconeCheio, campo, n0, aviso, folha } from '../ui.js';
import { dataISO, dataCurta } from '../datas.js';
import {
  resumoJornada, personagemSalvo, salvarPersonagem, corpoSugeridoAgora, corpoDoPersonagem, atualizarJornada,
} from '../jornada.js';
import {
  PARAMS, ROTULOS_PARAMS, LIM_MIN, LIM_MAX, SILHUETAS, corpoEfetivo, editarParametro, seguirDados, manterDesenho, definirOcultarMudancas, modoDoParametro, lerPersonagem, personagemPadrao,
} from '../personagem.js';
import { renderPersonagemSVG, descreverPersonagem, PELES, NOMES_PELE, CORES_CABELO, NOMES_CABELO, ESTILOS_CABELO, EXPRESSOES, CAMISAS, CALCAS } from '../personagem-svg.js';
import { CONQUISTAS, ACESSORIOS, acessoriosLiberados, PATENTES, TETO_DIA, xpParaNivel } from '../gamificacao.js';

const reduzMovimento = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerUlt = () => { try { return JSON.parse(localStorage.getItem('atlas.jornada.ult')); } catch { return null; } };
const gravarUlt = c => { try { localStorage.setItem('atlas.jornada.ult', JSON.stringify(c)); } catch { /* sem armazenamento: segue */ } };
const NOMES_SIL = { neutro: 'Neutra', fem: 'Feminina', masc: 'Masculina' };

/** Personagem desenhado dentro de `el`; anima suavemente a mudança do corpo (sem movimento se a pessoa prefere) */
export function desenharPersonagem(el, personagem, corpo, nivel, tamanho = 180, { animar = true } = {}) {
  const ult = animar ? lerUlt() : null, ant = ult && PARAMS.every(k => typeof ult[k] === 'number') ? ult : null;
  const pinta = c => { el.innerHTML = renderPersonagemSVG({ personagem, corpo: c, nivel, tamanho, rotulo: descreverPersonagem(personagem, nivel) }); };
  if (!ant || reduzMovimento() || PARAMS.every(k => Math.abs(ant[k] - corpo[k]) < 0.005)) { pinta(corpo); if (animar) gravarUlt(corpo); return; }
  const t0 = performance.now(), dur = 700;
  const passo = t => { const f = Math.min(1, (t - t0) / dur), e = f * f * (3 - 2 * f); pinta(Object.fromEntries(PARAMS.map(k => [k, ant[k] + (corpo[k] - ant[k]) * e]))); if (f < 1 && el.isConnected) requestAnimationFrame(passo); else gravarUlt(corpo); };
  requestAnimationFrame(passo);
}

// ------------------------------------------------------------------------------------------------ como funciona
function abrirComoFunciona() {
  return folha('Como funciona a Jornada', fechar => h('div', { class: 'pilha' },
    h('p', null, 'A Jornada transforma seus hábitos em XP. O personagem é você, desenhado do seu jeito, e acompanha o que os seus dados mostram. Nada aqui pune: perder uma sequência não tira XP.'),
    h('h3', null, 'Como o XP é contado'),
    h('ul', { class: 'lista-previa' },
      h('li', null, 'Treino da ficha: até 40 XP (parcial vale proporcional, mínimo 10); atividade avulsa: 1 XP a cada 2 minutos, até 30. Treino mais atividade somam no máximo 60 por dia.'),
      h('li', null, 'Refeições do dia registradas (2 ou mais): 10. Calorias dentro da meta (±10%): 20. Meta de proteína: 15. Meta de água: 10. Dia completo: +10.'),
      h('li', null, 'Peso ou medidas: 10 por semana. Sequência de registro: 3, 5 ou 8 por dia (a partir de 3, 7 e 14 dias). Missões do dia: 10 cada.'),
      h('li', null, 'Domingo: semana de treino completa (50) e desafio da semana (40). O teto é de ' + TETO_DIA + ' XP por dia.')),
    h('h3', null, 'Regras de confiança'),
    h('ul', { class: 'lista-previa' },
      h('li', null, 'O XP é recalculado por dia a partir dos seus registros: editar ou duplicar o mesmo dia não acumula, e apagar um registro recalcula. Dias até 7 dias atrás podem mudar; mais antigos ficam como estão.'),
      h('li', null, 'Dias preenchidos por estimativa (automático ou "Registrar um dia inteiro") nunca geram XP, sequência, missão ou conquista.'),
      h('li', null, 'A sequência de treino segue a sua ficha: dias de descanso programados não quebram. A de registro tem 1 dia de graça a cada 7 dias.')),
    h('h3', null, 'Níveis e acessórios'),
    h('p', { class: 'mudo' }, `50 níveis em 10 patentes de campanha: ${PATENTES.join(', ')}. Cada patente tem 5 graus (I a V). O nível 2 pede ${xpParaNivel(2)} XP; o 10, ${n0(xpParaNivel(10))}; o 50, ${n0(xpParaNivel(50))}. Acessórios: ${ACESSORIOS.map(a => `${a.rotulo.toLowerCase()} (nível ${a.nivel})`).join(', ')}. A moldura muda nos níveis 10, 20, 30 e 40.`),
    h('h3', null, 'O desenho do personagem'),
    h('p', { class: 'mudo' }, 'O corpo do desenho é sugerido pelos seus dados (peso, % de gordura, medidas, altura) e muda com eles, sempre numa faixa saudável e positiva, sem rótulos. Você pode editar cada parte, manter o seu desenho ou ocultar as mudanças corporais. Para menores de 18 anos as mudanças são sutis. É só uma ilustração: não é diagnóstico nem meta de peso.'),
    h('div', { class: 'linha-botoes' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => fechar(true) }, 'Entendi'))));
}

// ------------------------------------------------------------------------------------------------ editor
function swatches({ itens, valor, rotulo, aoEscolher }) {
  return h('div', { class: 'swatches', role: 'group', 'aria-label': rotulo }, itens.map(([v, cor, nome]) => h('button', { type: 'button', class: `swatch ${String(v) === String(valor) ? 'ativo' : ''}`, style: { '--cor': cor }, 'aria-pressed': String(String(v) === String(valor)), 'aria-label': nome, title: nome, onclick: () => aoEscolher(v) })));
}
function chipsEscolha({ itens, valor, rotulo, aoEscolher }) {
  return h('div', { class: 'chips', role: 'group', 'aria-label': rotulo }, itens.map(([v, nome]) => h('button', { type: 'button', class: `chip ${v === valor ? 'ativo' : ''}`, 'aria-pressed': String(v === valor), onclick: () => aoEscolher(v) }, nome)));
}

/** Editor do personagem: aparência, acessórios e corpo (automático ou manual por parâmetro). Salva a cada alteração. */
export function abrirEditorPersonagem({ aoMudar = () => {}, criacao = false } = {}) {
  return folha(criacao ? 'Crie seu personagem' : 'Editar personagem', fechar => {
    let p = personagemSalvo(); const nivel = resumoJornada().nivel;
    const previa = h('div', { class: 'previa-personagem' }), corpo = h('div', { class: 'pilha' }), conteudo = h('div', { class: 'pilha' });
    const sug = () => corpoSugeridoAgora(), efet = () => corpoEfetivo(p, sug());
    const pinta = () => { previa.innerHTML = renderPersonagemSVG({ personagem: p, corpo: efet(), nivel, tamanho: 150, rotulo: descreverPersonagem(p, nivel) }); };
    const grava = (novo, redesenhar = true) => { p = lerPersonagem(novo); salvarPersonagem(p); pinta(); if (redesenhar) desenhar(); aoMudar(); };

    function secaoCorpo() {
      limpar(corpo);
      const s = sug(), e = efet();
      corpo.append(h('h3', null, 'Corpo do personagem'),
        h('p', { class: 'mudo peq' }, `O desenho segue os seus dados${s.estimado ? ' (com % de gordura estimado pelo IMC)' : ''}, numa faixa saudável. Mexa em qualquer parte para manter o seu desenho só naquela parte.`),
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn btn-peq', type: 'button', onclick: () => grava(seguirDados(p)) }, 'Seguir meus dados (automático)'),
          h('button', { class: 'btn btn-peq', type: 'button', onclick: () => grava(manterDesenho(p, s)) }, 'Manter o meu desenho (manual)')),
        ...PARAMS.map(k => {
          const modo = modoDoParametro(p, k), id = `par-${k}`;
          const inp = h('input', { type: 'range', id, min: String(LIM_MIN), max: String(LIM_MAX), step: '0.01', value: String(e[k]), 'aria-label': ROTULOS_PARAMS[k], 'aria-valuetext': `${Math.round(e[k] * 100)} de 100`,
            oninput: ev => { const q = editarParametro(p, k, +ev.target.value); previa.innerHTML = renderPersonagemSVG({ personagem: q, corpo: corpoEfetivo(q, sug()), nivel, tamanho: 150, rotulo: descreverPersonagem(q, nivel) }); },
            onchange: ev => grava(editarParametro(p, k, +ev.target.value)) });
          return h('div', { class: 'param-corpo' },
            h('div', { class: 'param-cab' }, h('label', { for: id }, ROTULOS_PARAMS[k]), h('span', { class: 'selo-estimado', style: { margin: 0 } }, modo === 'manual' ? 'Manual' : 'Seguindo seus dados')),
            inp,
            modo === 'manual' ? h('button', { class: 'btn-texto', type: 'button', onclick: () => grava(seguirDados(p, k)) }, 'Voltar a seguir meus dados') : null);
        }),
        h('label', { class: 'opcao', for: 'ocultar-mud' }, h('input', { type: 'checkbox', id: 'ocultar-mud', checked: p.ocultarMudancas, onchange: ev => grava(definirOcultarMudancas(p, s, ev.target.checked)) }),
          h('span', null, h('strong', null, 'Ocultar mudanças corporais'), h('span', { class: 'd' }, 'O corpo do personagem fica fixo no desenho atual, mesmo que seus dados mudem.'))));
    }

    function desenhar() {
      limpar(conteudo);
      const nome = h('input', { type: 'text', value: p.nome, maxlength: 24, autocomplete: 'off', 'aria-label': 'Nome do personagem', onchange: ev => grava({ ...p, nome: ev.target.value.trim() || 'Meu personagem' }, false) });
      const libs = new Set(acessoriosLiberados(nivel).map(a => a.id));
      conteudo.append(
        campo('Nome', nome),
        h('h3', null, 'Silhueta'), chipsEscolha({ itens: SILHUETAS.map(s => [s, NOMES_SIL[s]]), valor: p.silhueta, rotulo: 'Silhueta base', aoEscolher: v => grava({ ...p, silhueta: v }) }),
        h('p', { class: 'ajuda' }, 'A silhueta é uma escolha sua e não depende do sexo do seu perfil.'),
        h('h3', null, 'Pele'), swatches({ itens: PELES.map((c, i) => [i, c, NOMES_PELE[i]]), valor: p.pele, rotulo: 'Tom de pele', aoEscolher: v => grava({ ...p, pele: v }) }),
        h('h3', null, 'Cabelo'), chipsEscolha({ itens: ESTILOS_CABELO, valor: p.cabelo.estilo, rotulo: 'Estilo do cabelo', aoEscolher: v => grava({ ...p, cabelo: { ...p.cabelo, estilo: v } }) }),
        swatches({ itens: CORES_CABELO.map((c, i) => [i, c, NOMES_CABELO[i]]), valor: p.cabelo.cor, rotulo: 'Cor do cabelo', aoEscolher: v => grava({ ...p, cabelo: { ...p.cabelo, cor: v } }) }),
        h('h3', null, 'Rosto'), chipsEscolha({ itens: EXPRESSOES, valor: p.expressao, rotulo: 'Expressão', aoEscolher: v => grava({ ...p, expressao: v }) }),
        h('h3', null, 'Roupa'), swatches({ itens: Object.entries(CAMISAS).map(([k, c]) => [k, c, `Camisa ${k}`]), valor: p.roupa.camisa, rotulo: 'Cor da camisa', aoEscolher: v => grava({ ...p, roupa: { ...p.roupa, camisa: v } }) }),
        swatches({ itens: Object.entries(CALCAS).map(([k, c]) => [k, c, `Calção ${k}`]), valor: p.roupa.calca, rotulo: 'Cor do calção', aoEscolher: v => grava({ ...p, roupa: { ...p.roupa, calca: v } }) }),
        h('h3', null, 'Acessórios'),
        h('div', { class: 'pilha', style: { gap: '6px' } }, ACESSORIOS.map(a => h('label', { class: 'opcao', for: `ac-${a.id}`, style: libs.has(a.id) ? null : { opacity: '.75' } },
          h('input', { type: 'checkbox', id: `ac-${a.id}`, checked: p.acessorios.includes(a.id), disabled: !libs.has(a.id), onchange: ev => grava({ ...p, acessorios: ev.target.checked ? [...new Set([...p.acessorios, a.id])] : p.acessorios.filter(x => x !== a.id) }) }),
          h('span', null, h('strong', null, a.rotulo), h('span', { class: 'd' }, libs.has(a.id) ? 'Liberado' : `Libera no nível ${a.nivel}`))))),
        corpo);
      secaoCorpo();
    }
    pinta(); desenhar();
    return h('div', { class: 'pilha' }, h('div', { class: 'previa-fixa' }, previa), conteudo,
      h('div', { class: 'linha-botoes' }, criacao ? h('button', { class: 'btn', type: 'button', onclick: () => { grava({ ...p, pulou: true }, false); fechar(false); } }, 'Pular (usar o padrão)') : null,
        h('button', { class: 'btn btn-primario', type: 'button', onclick: () => { grava({ ...p, criado: true }, false); atualizarJornada(); fechar(true); } }, icone('ok', 18), criacao ? 'Criar personagem' : 'Pronto')));
  }, { larga: true });
}

// ------------------------------------------------------------------------------------------------ tela
export function renderizar(raiz, ctx) {
  ctx.faixa('Jornada');
  const redesenhar = () => ctx.redesenhar();
  const R = resumoJornada(), p = personagemSalvo();
  const corpo = corpoDoPersonagem(p);

  const avatar = h('div', { class: 'personagem-grande' });
  desenharPersonagem(avatar, p, corpo, R.nivel, 190);
  const barra = h('div', { class: 'xp-barra', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(R.xpDoNivel || 1), 'aria-valuenow': String(R.xpNoNivel), 'aria-label': `Progresso para o nível ${R.nivel + 1}` }, h('span', { style: { width: `${Math.round(R.fracao * 100)}%` } }));
  const cartaoPers = h('section', { class: 'cartao jornada-heroi' },
    avatar,
    h('div', { class: 'pilha', style: { gap: '8px', alignContent: 'center' } },
      h('h2', { style: { margin: 0 } }, p.nome),
      h('p', { class: 'nivel-titulo' }, h('strong', null, `Nível ${R.nivel}`), ` · ${R.titulo}`),
      barra, h('p', { class: 'mudo peq' }, R.nivel >= 50 ? `${n0(R.total)} XP no total` : `${n0(R.xpNoNivel)} de ${n0(R.xpDoNivel)} XP para o nível ${R.nivel + 1} · ${n0(R.total)} XP no total`),
      h('div', { class: 'linha-botoes', style: { justifyContent: 'flex-start' } },
        h('button', { class: 'btn btn-peq', type: 'button', id: 'btn-editar-personagem', onclick: async () => { await abrirEditorPersonagem({ aoMudar: () => {} }); redesenhar(); } }, icone('lapis', 18), 'Editar personagem'),
        h('button', { class: 'btn-texto', type: 'button', id: 'btn-como-funciona', onclick: () => abrirComoFunciona() }, icone('info', 18), 'Como funciona'))));

  const cartaoHoje = h('section', { class: 'cartao pilha' }, h('h2', null, `XP de hoje: ${R.xpHoje}`),
    R.itensHoje.length ? h('ul', { class: 'lista-previa' }, R.itensHoje.map(i => h('li', { class: 'xp-linha' }, h('span', null, i.rotulo), h('strong', null, `+${i.xp}`))))
      : h('p', { class: 'mudo' }, 'Registre suas refeições ou um treino para ganhar XP. Dias estimados não contam.'),
    h('div', { class: 'seqs' },
      h('span', null, iconeCheio('chama', 18), h('strong', null, ` ${R.seqRegistro.dias}`), ' dias de registro', R.seqRegistro.graca ? h('span', { class: 'mudo peq' }, ' (com dia de graça)') : null),
      h('span', null, icone('halter', 18), h('strong', null, ` ${R.seqTreino}`), ' treinos seguidos')));

  const feitas = R.missoes.filter(m => m.feito).length;
  const cartaoMissoes = h('section', { class: 'cartao pilha' }, h('h2', null, `Missões de hoje (${feitas}/3)`),
    h('ul', { class: 'missoes' }, R.missoes.map(m => h('li', { class: m.feito ? 'feita' : '' }, h('span', { class: 'marca-missao', 'aria-hidden': 'true' }, m.feito ? icone('ok', 18) : null), h('span', null, m.rotulo, m.feito ? h('span', { class: 'so-leitor' }, ' (feita)') : null), h('strong', null, '+10')))),
    h('div', { class: 'desafio' }, h('p', null, h('strong', null, 'Desafio da semana: '), R.desafio.rotulo), h('div', { class: 'xp-barra', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(R.desafio.meta), 'aria-valuenow': String(R.desafio.atual), 'aria-label': R.desafio.rotulo }, h('span', { style: { width: `${Math.round(100 * R.desafio.atual / R.desafio.meta)}%` } })),
      h('p', { class: 'mudo peq' }, `${R.desafio.atual} de ${R.desafio.meta}${R.desafio.feito ? ' · feito! o bônus de 40 XP vem no domingo' : ' · bônus de 40 XP no domingo'}`)));

  const tem = new Set(Object.keys(R.conquistas));
  const cartaoConq = h('section', { class: 'cartao pilha' }, h('h2', null, `Conquistas (${tem.size}/${CONQUISTAS.length})`),
    h('ul', { class: 'conquistas' }, CONQUISTAS.map(c => h('li', { class: tem.has(c.id) ? 'liberada' : 'bloqueada', title: c.desc }, h('span', { class: 'conq-ic', 'aria-hidden': 'true' }, tem.has(c.id) ? iconeCheio('escudo', 22) : icone('escudo', 22)),
      h('span', null, h('strong', null, c.rotulo), h('small', null, tem.has(c.id) ? `Liberada em ${dataCurta(R.conquistas[c.id])}` : c.desc))))));

  const hist = (p.historico || []).slice(-6);
  const cartaoEvolucao = h('section', { class: 'cartao pilha' }, h('h2', null, 'Evolução do desenho'),
    hist.length >= 2
      ? h('div', { class: 'evolucao' }, hist.map(x => { const el = h('figure', { class: 'evo-item' }); el.innerHTML = renderPersonagemSVG({ personagem: p, corpo: x.corpo, nivel: R.nivel, tamanho: 64, rotulo: `Desenho de ${dataCurta(x.data)}` }); el.append(h('figcaption', { class: 'mudo peq' }, dataCurta(x.data))); return el; }))
      : h('p', { class: 'mudo' }, 'Seu desenho acompanha seus dados: quando peso, % de gordura ou medidas mudarem, a linha do tempo mostra como ele evoluiu. Só o desenho, sem números.'),
    p.ocultarMudancas ? h('p', { class: 'mudo peq' }, 'Mudanças corporais ocultas: o corpo está fixo no desenho atual.') : null);

  raiz.append(h('div', { class: 'jornada-pilha' }, cartaoPers, cartaoHoje, cartaoMissoes, cartaoConq, cartaoEvolucao));
  // primeira vez: fluxo curto e pulável para criar o personagem
  if (!p.criado && !p.pulou) setTimeout(async () => { if (location.hash !== '#/jornada') return; await abrirEditorPersonagem({ criacao: true }); redesenhar(); }, 400);
}
export { atualizarJornada, personagemPadrao };
