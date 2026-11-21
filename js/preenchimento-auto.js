// Preenchimento automático de dias sem registro: roda ao abrir o app e ao voltar ao primeiro plano (parte impura; a lógica pura e as
// decisões estão em js/preenchimento-automatico.js). Sincroniza como o resto: tudo vive no singleton 'config' e nos registros comuns.
import { store, novoId } from './store.js';
import { dataISO, rotuloDia, dataCurta, somarDias } from './datas.js';
import { pesoAtual } from './dados.js';
import { h, aviso, folha, n0 } from './ui.js';
import {
  planejarPreenchimento, aplicarMarcas, podarMarcas, lerAuto, idsAutomaticos, diasDoLote, ehAutomatico, JANELA_AUTO,
} from './preenchimento-automatico.js';

export const TEXTO_EXPLICA = 'Quando você não registra nada de comida (ou de treino previsto na sua ficha) em um dia, o app preenche o dia com uma estimativa baseada nos seus dias anteriores e marca com o selo "estimado".';
export const TEXTO_IMPACTO = 'Esses dias não entram nas suas médias nem em conquistas, mas contam nos gráficos e na previsão, que fica menos precisa. Você pode desfazer quando quiser.';

const lerConfig = () => store.obterUnico('config') || {};
export const lerAutoAtual = () => lerAuto(lerConfig());
export const gravarAuto = auto => store.salvarUnico('config', { auto });

/** Quantos registros automáticos existem (para Ajustes) */
export function contarAutomaticos() {
  const ids = idsAutomaticos({ refeicoes: store.listar('refeicoes'), treinos: store.listar('treinos') });
  return { refeicoes: ids.refeicoes.length, treinos: ids.treinos.length, total: ids.refeicoes.length + ids.treinos.length };
}

/** Apaga os registros automáticos (de um lote ou todos). As marcas ficam: os dias não são recriados. */
export function desfazerAutomaticos(lote = null) {
  const ids = idsAutomaticos({ refeicoes: store.listar('refeicoes'), treinos: store.listar('treinos') }, lote);
  ids.refeicoes.forEach(id => store.remover('refeicoes', id));
  ids.treinos.forEach(id => store.remover('treinos', id));
  return ids.refeicoes.length + ids.treinos.length;
}

/**
 * Executa o preenchimento. Retorna { lote, dias } quando gerou algo, senão null.
 * Idempotente: dias já avaliados ficam em auto.processados e nunca são recriados (nem se a pessoa apagar o estimado).
 */
export function executarPreenchimento() {
  let auto = lerAutoAtual();
  if (!auto.ativo) return null;
  const hoje = dataISO();
  // Uma vez só (primeira abertura ou migração de quem já tinha o recurso ligado): libera os últimos JANELA_AUTO dias,
  // para a pessoa ver o preenchimento funcionando também sobre os dias anteriores sem registro. Religar depois, em Ajustes,
  // continua valendo só de hoje em diante (config.js grava ativadoEm = hoje e não repete este passo).
  if (!auto.retroativoFeito) { auto = { ...auto, ativadoEm: somarDias(hoje, -JANELA_AUTO), retroativoFeito: true }; gravarAuto(auto); }
  const lote = novoId('auto');
  const plano = store.obterUnico('plano');
  const r = planejarPreenchimento({
    hoje, config: lerConfig(), refeicoes: store.listar('refeicoes'), treinos: store.listar('treinos'), atividades: store.listar('atividades'),
    plano, peso: pesoAtual() || 70, lote,
  });
  const marcou = Object.keys(r.marcas).length > 0;
  if (!marcou) return null;
  r.refeicoes.forEach(l => store.salvar('refeicoes', l));
  r.treinos.forEach(t => store.salvar('treinos', { ...t, id: novoId('t') }));
  const dias = [...new Set(r.dias.map(d => d.dia))].sort();
  auto = podarMarcas(aplicarMarcas(auto, r.marcas), hoje);
  if (dias.length) auto = { ...auto, ultimo: { lote, dias, em: Date.now() } };
  gravarAuto(auto);
  return dias.length ? { lote, dias } : null;
}

/** Folha "Ver / Desfazer" dos dias que acabaram de ser preenchidos */
function verDesfazer({ lote, dias }, aoMudar) {
  return folha('Dias preenchidos automaticamente', fechar => {
    const refs = store.listar('refeicoes').filter(r => ehAutomatico(r) && r.estimadoLote === lote);
    const trs = store.listar('treinos').filter(t => ehAutomatico(t) && t.estimadoLote === lote);
    const linhas = diasDoLote({ refeicoes: refs, treinos: trs }, lote).map(d => {
      const kcal = refs.filter(r => r.ts.startsWith(d)).reduce((s, r) => s + r.itens.reduce((a, i) => a + (i.kcal || 0), 0), 0);
      const t = trs.find(x => x.data === d);
      return h('li', null, h('strong', null, `${rotuloDia(d)} · ${dataCurta(d)}`), h('span', { class: 'mudo peq' }, ` · ${kcal ? `${n0(kcal)} kcal de comida` : ''}${kcal && t ? ' · ' : ''}${t ? `treino: ${t.titulo}` : ''}`));
    });
    return h('div', { class: 'pilha' },
      h('p', null, 'Estes dias estavam sem registro e foram preenchidos com estimativas baseadas nos seus dias anteriores. Eles têm o selo "estimado", dá para editar ou excluir cada lançamento, e não entram nas suas médias.'),
      h('ul', { class: 'lista-previa' }, linhas),
      h('div', { class: 'linha-botoes' },
        h('button', { class: 'btn', type: 'button', onclick: () => fechar(undefined) }, 'Manter'),
        h('button', { class: 'btn btn-perigo', type: 'button', onclick: () => { const n = desfazerAutomaticos(lote); aviso(`${n} registro(s) removido(s).`); aoMudar(); fechar(true); } }, 'Desfazer')));
  });
}

/** Primeira vez: explica em poucas linhas o que o recurso faz (e deixa desligar) */
function explicarPrimeiraVez(aoMudar) {
  return folha('Preencher dias sem registro', fechar => h('div', { class: 'pilha' },
    h('p', null, TEXTO_EXPLICA), h('p', { class: 'mudo' }, TEXTO_IMPACTO),
    h('p', { class: 'ajuda' }, 'Dá para ligar/desligar e desfazer tudo em Ajustes > Preenchimento automático.'),
    h('div', { class: 'linha-botoes' },
      h('button', { class: 'btn', type: 'button', onclick: () => { gravarAuto({ ...lerAutoAtual(), ativo: false, explicado: true }); fechar(false); aoMudar(); } }, 'Desligar'),
      h('button', { class: 'btn btn-primario', type: 'button', onclick: () => fechar(true) }, 'Entendi'))));
}

/** Chamado pelo main.js ao abrir e ao voltar ao primeiro plano. Mostra o aviso discreto e desfazível quando preencheu algo. */
export function iniciarPreenchimento(aoMudar = () => {}) {
  let rodando = false;
  const rodar = () => {
    if (rodando) return; rodando = true;
    try {
      const antes = lerAutoAtual();
      const r = executarPreenchimento();
      if (!antes.explicado && antes.ativo) { gravarAuto({ ...lerAutoAtual(), explicado: true }); setTimeout(() => explicarPrimeiraVez(aoMudar), 600); }
      if (r) {
        aoMudar();
        const n = r.dias.length;
        aviso(`Preenchemos ${n} dia${n > 1 ? 's' : ''} sem registro com estimativas.`, { acao: 'Ver / Desfazer', aoAcao: () => verDesfazer(r, aoMudar), duracao: 15000 });
      }
    } catch (e) { console.warn('Preenchimento automático falhou', e); }
    finally { rodando = false; }
  };
  rodar();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') rodar(); });
  return rodar;
}
