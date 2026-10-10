// Onboarding em etapas curtas, salvo a cada passo (dá para fechar e voltar depois).
import { h, limpar, icone, campo, entradaNum, lerNumero, chips, caixaAviso, n0, n1, aviso } from '../ui.js';
import { store } from '../store.js';
import { perfil as getPerfil } from '../dados.js';
import { NIVEIS_ATIVIDADE, OBJETIVOS, idadeEm, gorduraMarinha, gorduraPorIMC, imc, classeIMC, calcularMetas, faixaGordura } from '../nutrition.js';
import { EQUIPAMENTOS, LESOES } from '../exercises.js';
import { dataISO } from '../datas.js';

const ETAPAS = ['avisos', 'sobre', 'peso', 'atividade', 'objetivo', 'treino', 'resumo'];

export function renderizar(raiz, ctx) {
  ctx.faixa('Começar');
  const salvo = getPerfil();
  let d = { sexo: null, nascimento: '', altura: null, peso: null, gorduraInicial: null, gorduraMetodo: null, atividade: 'leve', objetivo: 'recomp', experiencia: 'iniciante', equipamento: 'academia', lesoes: [], diasTreinoDesejados: 3, medidas: {}, ...salvo };
  let etapa = Math.min(salvo.onbEtapa || 0, ETAPAS.length - 1);
  let metodoG = d.gorduraMetodo || 'nao-sei';

  const salvar = (extra = {}) => { store.salvarUnico('perfil', { ...d, onbEtapa: etapa, ...extra }); };

  function desenhar() {
    limpar(raiz);
    const caixa = h('div', { class: 'onb' });
    caixa.appendChild(h('div', { class: 'onb-prog', role: 'img', 'aria-label': `Etapa ${etapa + 1} de ${ETAPAS.length}` }, ETAPAS.map((_, i) => h('i', { class: i <= etapa ? 'feito' : '' }))));
    const msgErro = h('div', { 'aria-live': 'polite' });
    const passos = { avisos, sobre, peso, atividade, objetivo, treino, resumo };
    const { conteudo, validar } = passos[ETAPAS[etapa]]();
    caixa.appendChild(conteudo);
    caixa.appendChild(msgErro);
    const ultima = etapa === ETAPAS.length - 1;
    caixa.appendChild(h('div', { class: 'onb-nav' },
      etapa > 0 ? h('button', { class: 'btn', type: 'button', onclick: () => { etapa--; salvar(); desenhar(); window.scrollTo(0, 0); } }, icone('esq', 18), 'Voltar') : null,
      h('button', { class: 'btn btn-primario', type: 'button', onclick: () => {
        const erro = validar();
        limpar(msgErro);
        if (erro) { msgErro.appendChild(caixaAviso('alto', 'Falta um detalhe', erro)); msgErro.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
        if (ultima) return concluir();
        etapa++; salvar(); desenhar(); window.scrollTo(0, 0);
      } }, ultima ? 'Começar a usar' : 'Continuar', ultima ? null : icone('dir', 18))));
    if (etapa === 0 || etapa === ETAPAS.length - 1) caixa.appendChild(h('button', { class: 'btn btn-fantasma', type: 'button', onclick: pular }, 'Pular por enquanto (metas padrão)'));
    raiz.appendChild(caixa);
    const t = caixa.querySelector('h2'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  }

  function pular() {
    store.salvarUnico('perfil', { ...d, onbPulado: true, onbEtapa: etapa });
    ctx.navegar('alimentacao');
  }

  function concluir() {
    d.gorduraMetodo = metodoG;
    store.salvarUnico('perfil', { ...d, onbConcluido: true, onbEtapa: ETAPAS.length - 1 });
    // primeiro registro do corpo
    if (d.peso) {
      store.salvar('corpo', { id: 'inicio', data: dataISO(), peso: d.peso, gordura: d.gorduraInicial ?? null, metodoGordura: d.gorduraInicial != null ? metodoG : null, medidas: d.medidas || {}, dobras: {}, fotos: [], origem: 'onboarding' });
    }
    aviso('Tudo pronto! Registre sua primeira refeição.');
    ctx.navegar('alimentacao');
  }

  // ----------------------------------------------------------------- etapas
  function avisos() {
    const aceite = h('input', { type: 'checkbox', id: 'aceite', checked: !!d.aceitouAvisos, onchange: e => { d.aceitouAvisos = e.target.checked; salvar(); } });
    return {
      conteudo: h('div', { class: 'pilha' },
        h('h2', null, 'Bem-vindo ao Atlas Fitness'),
        h('p', { class: 'lead' }, 'Alimentação, treino e corpo no mesmo lugar. Vamos configurar suas metas em poucos passos. Você pode fechar e continuar depois.'),
        caixaAviso('info', 'Leia antes de continuar', 'Este app não substitui médico, nutricionista ou educador físico. Calorias, metas, gordura corporal e previsões são estimativas aproximadas. Se você tem doença crônica, está grávida ou amamentando, tem histórico de transtorno alimentar ou sente dor ao treinar, procure um profissional.'),
        caixaAviso('info', 'Seus dados', 'Tudo fica neste aparelho. Só vai para a nuvem se você criar uma conta. Você pode exportar ou apagar tudo a qualquer momento em Ajustes.'),
        h('label', { class: 'opcao', for: 'aceite' }, aceite, h('span', null, h('strong', null, 'Li e entendi'), h('span', { class: 'd' }, 'As informações do app são estimativas e não substituem orientação profissional.')))),
      validar: () => (d.aceitouAvisos ? null : 'Marque a caixa para confirmar que leu os avisos.'),
    };
  }

  function sobre() {
    const nasc = h('input', { type: 'date', value: d.nascimento || '', max: dataISO(), onchange: e => { d.nascimento = e.target.value; salvar(); atualizarIdade(); } });
    const alt = entradaNum(d.altura, { 'aria-describedby': 'aj-alt', onchange: e => { d.altura = lerNumero(e.target.value); salvar(); } });
    const infoIdade = h('p', { class: 'ajuda', 'aria-live': 'polite' });
    const atualizarIdade = () => { const i = idadeEm(d.nascimento); infoIdade.textContent = i != null ? `Você tem ${i} anos.` : ''; };
    atualizarIdade();
    return {
      conteudo: h('div', { class: 'pilha' },
        h('h2', null, 'Sobre você'),
        h('p', { class: 'lead' }, 'Usamos estes dados nas fórmulas de gasto de energia.'),
        h('fieldset', null, h('legend', null, 'Sexo biológico (para as fórmulas)'),
          chips([['M', 'Masculino'], ['F', 'Feminino']], d.sexo, v => { d.sexo = v; salvar(); }, { rotuloGrupo: 'Sexo biológico' })),
        campo('Data de nascimento', nasc, null), infoIdade,
        campo('Altura (cm)', alt, 'Exemplo: 172')),
      validar: () => {
        d.altura = lerNumero(alt.value) ?? d.altura; d.nascimento = nasc.value || d.nascimento;
        if (!d.sexo) return 'Escolha o sexo biológico.';
        const i = idadeEm(d.nascimento);
        if (i == null) return 'Informe sua data de nascimento.';
        if (i < 14) return 'O Atlas Fitness é indicado para 14 anos ou mais. Converse com um responsável e um profissional de saúde antes de seguir qualquer plano.';
        if (i > 100) return 'Confira a data de nascimento.';
        if (!d.altura || d.altura < 120 || d.altura > 230) return 'Informe a altura em centímetros (entre 120 e 230).';
        salvar(); return null;
      },
    };
  }

  function peso() {
    const m = d.medidas || (d.medidas = {});
    const pesoIn = entradaNum(d.peso, { onchange: e => { d.peso = lerNumero(e.target.value); salvar(); recalc(); } });
    const gIn = entradaNum(d.gorduraMetodo === 'manual' ? d.gorduraInicial : '', { 'aria-label': '% de gordura', onchange: e => { d.gorduraInicial = lerNumero(e.target.value); d.gorduraMetodo = 'manual'; salvar(); } });
    const medIn = (chave, rotulo, aj) => campo(rotulo, entradaNum(m[chave], { onchange: e => { m[chave] = lerNumero(e.target.value); salvar(); recalc(); } }), aj);
    const blocoMarinha = h('div', { class: 'pilha' });
    const resultado = h('div', { 'aria-live': 'polite' });
    const idade = () => idadeEm(d.nascimento) ?? 30;
    function recalc() {
      limpar(resultado);
      if (metodoG === 'marinha') {
        const g = gorduraMarinha({ sexo: d.sexo, altura: d.altura, cintura: m.cintura, pescoco: m.pescoco, quadril: m.quadril });
        if (g != null && g > 2 && g < 60) { d.gorduraInicial = Math.round(g * 10) / 10; d.gorduraMetodo = 'marinha'; resultado.appendChild(caixaAviso('info', `Estimativa: ${n1(d.gorduraInicial)}% de gordura`, `Faixa ${faixaGordura(d.gorduraInicial, d.sexo)}. A fórmula da Marinha dos EUA erra em média 3 a 4 pontos percentuais.`)); }
        else { d.gorduraInicial = null; resultado.appendChild(h('p', { class: 'ajuda' }, d.sexo === 'F' ? 'Preencha cintura, pescoço e quadril.' : 'Preencha cintura e pescoço.')); }
      } else if (metodoG === 'imc') {
        if (d.peso && d.altura) {
          const g = gorduraPorIMC({ sexo: d.sexo, peso: d.peso, altura: d.altura, idade: idade() });
          d.gorduraInicial = Math.max(3, Math.round(g * 10) / 10); d.gorduraMetodo = 'imc';
          resultado.appendChild(caixaAviso('info', `Estimativa: ${n1(d.gorduraInicial)}% de gordura`, `Baseada no IMC (${n1(imc(d.peso, d.altura))}, ${classeIMC(imc(d.peso, d.altura))}). É uma estimativa grosseira (erro de ±5 pontos): quem tem muito músculo aparece com gordura a mais. Melhore depois com medidas na aba Corpo.`));
        }
      } else if (metodoG === 'nao-sei') { d.gorduraInicial = null; d.gorduraMetodo = null; }
      salvar();
    }
    const detalhe = h('div');
    function desenharMetodo() {
      limpar(detalhe);
      if (metodoG === 'manual') detalhe.appendChild(campo('% de gordura', gIn, 'Se mediu por bioimpedância, dobras ou DEXA.'));
      if (metodoG === 'marinha') {
        blocoMarinha.append(h('div', { class: 'grade-2' }, medIn('pescoco', 'Pescoço (cm)', 'Abaixo do pomo de Adão'), medIn('cintura', 'Cintura (cm)', 'Na altura do umbigo'), d.sexo === 'F' ? medIn('quadril', 'Quadril (cm)', 'Parte mais larga') : null));
        detalhe.appendChild(blocoMarinha);
      }
      detalhe.appendChild(resultado); recalc();
    }
    const opcoes = [['nao-sei', 'Não sei / pular', 'Calculamos com a fórmula Mifflin-St Jeor, sem % de gordura.'], ['manual', 'Sei meu %', 'Digite o valor medido.'], ['marinha', 'Estimar com fita métrica', 'Fórmula da Marinha dos EUA: pescoço, cintura (e quadril).'], ['imc', 'Estimar pelo IMC', 'Aproximação rápida, menos precisa.']];
    const grupo = h('div', { class: 'pilha', role: 'radiogroup', 'aria-label': 'Como informar % de gordura' }, opcoes.map(([v, t, desc]) => h('label', { class: 'opcao' },
      h('input', { type: 'radio', name: 'metodog', value: v, checked: metodoG === v, onchange: () => { metodoG = v; if (v === 'manual') d.gorduraMetodo = 'manual'; limpar(blocoMarinha); desenharMetodo(); } }),
      h('span', null, h('strong', null, t), h('span', { class: 'd' }, desc)))));
    desenharMetodo();
    return {
      conteudo: h('div', { class: 'pilha' },
        h('h2', null, 'Peso e gordura'),
        campo('Peso atual (kg)', pesoIn, 'De manhã, em jejum, é o mais confiável.'),
        h('h3', null, '% de gordura corporal (opcional)'),
        grupo, detalhe),
      validar: () => {
        d.peso = lerNumero(pesoIn.value) ?? d.peso;
        if (!d.peso || d.peso < 30 || d.peso > 300) return 'Informe o peso em kg (entre 30 e 300).';
        if (metodoG === 'manual') { d.gorduraInicial = lerNumero(gIn.value); d.gorduraMetodo = 'manual'; if (d.gorduraInicial != null && (d.gorduraInicial < 3 || d.gorduraInicial > 60)) return 'O % de gordura parece fora do normal. Confira o valor (entre 3 e 60).'; }
        if (metodoG === 'marinha' && d.gorduraInicial == null) return 'Preencha as medidas da fórmula da Marinha ou escolha outra opção.';
        d.gorduraMetodo = d.gorduraInicial != null ? metodoG : null;
        salvar(); return null;
      },
    };
  }

  function atividade() {
    return {
      conteudo: h('div', { class: 'pilha' },
        h('h2', null, 'Seu dia a dia'),
        h('p', { class: 'lead' }, 'Sem contar os treinos de musculação: como é a sua rotina fora da academia? Os treinos são somados à parte, conforme você registra.'),
        h('div', { class: 'pilha', role: 'radiogroup', 'aria-label': 'Nível de atividade' }, NIVEIS_ATIVIDADE.map(n => h('label', { class: 'opcao' },
          h('input', { type: 'radio', name: 'atv', checked: d.atividade === n.id, onchange: () => { d.atividade = n.id; salvar(); desenhar(); } }),
          h('span', null, h('strong', null, n.rotulo), h('span', { class: 'd' }, n.desc)))))),
      validar: () => null,
    };
  }

  function objetivo() {
    const i = idadeEm(d.nascimento);
    return {
      conteudo: h('div', { class: 'pilha' },
        h('h2', null, 'Qual é o seu objetivo?'),
        i != null && i < 18 ? caixaAviso('medio', 'Menor de 18 anos', 'Vamos limitar o déficit calórico a no máximo 10% e recomendamos acompanhamento de um profissional. Em crescimento, o corpo precisa de energia e nutrientes.') : null,
        h('div', { class: 'pilha', role: 'radiogroup', 'aria-label': 'Objetivo' }, OBJETIVOS.map(o => h('label', { class: 'opcao' },
          h('input', { type: 'radio', name: 'obj', checked: d.objetivo === o.id, onchange: () => { d.objetivo = o.id; salvar(); } }),
          h('span', null, h('strong', null, o.rotulo), h('span', { class: 'd' }, o.desc)))))),
      validar: () => null,
    };
  }

  function treino() {
    return {
      conteudo: h('div', { class: 'pilha' },
        h('h2', null, 'Seu treino'),
        h('fieldset', null, h('legend', null, 'Experiência com musculação'),
          chips([['iniciante', 'Iniciante (< 1 ano)'], ['intermediario', 'Intermediário (1 a 3 anos)'], ['avancado', 'Avançado (3+ anos)']], d.experiencia, v => { d.experiencia = v; salvar(); }, { rotuloGrupo: 'Experiência' })),
        h('fieldset', null, h('legend', null, 'Onde você treina'),
          h('div', { class: 'pilha' }, Object.entries(EQUIPAMENTOS).map(([id, e]) => h('label', { class: 'opcao' },
            h('input', { type: 'radio', name: 'eq', checked: d.equipamento === id, onchange: () => { d.equipamento = id; salvar(); } }),
            h('span', null, h('strong', null, e.nome), h('span', { class: 'd' }, e.desc)))))),
        h('fieldset', null, h('legend', null, 'Lesões ou limitações (opcional)'),
          chips(Object.entries(LESOES), d.lesoes || [], v => { d.lesoes = v; salvar(); }, { multiplo: true, rotuloGrupo: 'Lesões' }),
          h('p', { class: 'ajuda' }, 'Evitaremos exercícios que costumam sobrecarregar essas regiões. Não substitui orientação de fisioterapeuta.')),
        h('fieldset', null, h('legend', null, 'Quantos dias por semana pretende treinar?'),
          chips([1, 2, 3, 4, 5, 6].map(n => [n, String(n)]), d.diasTreinoDesejados, v => { d.diasTreinoDesejados = v; salvar(); }, { rotuloGrupo: 'Dias por semana' }))),
      validar: () => null,
    };
  }

  function resumo() {
    const m = calcularMetas({ ...d, diasTreino: d.diasTreinoDesejados }, d.peso || 70, d.gorduraInicial);
    return {
      conteudo: h('div', { class: 'pilha' },
        h('h2', null, 'Suas metas'),
        h('p', { class: 'lead' }, 'Calculadas a partir dos seus dados. Servem como ponto de partida e se ajustam quando você atualiza peso e treinos.'),
        h('div', { class: 'resumo-meta' },
          h('div', { class: 'stat' }, h('span', { class: 'r' }, 'Calorias por dia'), h('span', { class: 'v' }, n0(m.kcal)), h('span', { class: 'd' }, `gasto estimado ${n0(m.tdee)} kcal`)),
          h('div', { class: 'stat' }, h('span', { class: 'r' }, 'Proteína'), h('span', { class: 'v' }, n0(m.prot) + ' g'), h('span', { class: 'd' }, `${m.protPorKg.toFixed(1).replace('.', ',')} g por kg`)),
          h('div', { class: 'stat' }, h('span', { class: 'r' }, 'Carboidrato'), h('span', { class: 'v' }, n0(m.carb) + ' g')),
          h('div', { class: 'stat' }, h('span', { class: 'r' }, 'Gordura'), h('span', { class: 'v' }, n0(m.gord) + ' g'))),
        m.avisos.map(a => caixaAviso('medio', null, a)),
        h('div', { class: 'cartao' }, h('h3', null, 'Por que esses números?'), h('ul', { style: { paddingLeft: '20px', margin: '8px 0 0', display: 'grid', gap: '6px' } }, m.explicacao.map(t => h('li', null, t)))),
        h('span', { class: 'estimativa' }, 'Valores estimados')),
      validar: () => null,
    };
  }

  desenhar();
}
