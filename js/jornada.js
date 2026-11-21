// Jornada (parte impura): lê os dados, recalcula o XP por dia, guarda conquistas, mantém o histórico do desenho e mostra o feedback discreto.
// As regras estão em js/gamificacao.js e js/personagem.js (puras e testadas). Dados: coleções 'xp' (um doc por dia) e 'conquistas' (um doc por
// conquista) e o personagem em config.personagem; tudo sincroniza como o resto (regras genéricas do Firestore, sem mudança).
import { store } from './store.js';
import { dataISO } from './datas.js';
import { metas, idadeAtual } from './dados.js';
import { aviso } from './ui.js';
import {
  reconciliarXP, totalXP, nivelDe, estatisticas, novasConquistas, CONQUISTAS, sequenciaRegistro, sequenciaTreino, indexar, missoesDoDia, desafioSemanal, xpDoDia,
} from './gamificacao.js';
import { lerPersonagem, sugerirCorpo, entradaDoPerfil, corpoEfetivo, registrarHistorico, diferencaCorpo } from './personagem.js';

const config = () => store.obterUnico('config') || {};
export const personagemSalvo = () => lerPersonagem(config().personagem);
export const salvarPersonagem = p => store.salvarUnico('config', { personagem: p });

/** Dados reais do store no formato de js/gamificacao.js */
export function dadosDaJornada() {
  const agua = {}; for (const a of store.listar('agua')) agua[a.id] = a.ml || 0;
  return { refeicoes: store.listar('refeicoes'), treinos: store.listar('treinos'), atividades: store.listar('atividades'), corpo: store.listar('corpo'), agua, plano: store.obterUnico('plano'), metas: metas(), favoritos: store.listar('favoritos').length };
}
export const xpGuardado = () => Object.fromEntries(store.listar('xp').map(x => [x.id, { xp: x.xp, itens: x.itens || [] }]));
export const conquistasGuardadas = () => Object.fromEntries(store.listar('conquistas').map(c => [c.id, c.em]));

/** Corpo sugerido pelos dados atuais (último peso, % de gordura e medidas) */
export function corpoSugeridoAgora() {
  const perfil = store.obterUnico('perfil') || {};
  return sugerirCorpo(entradaDoPerfil({ perfil, corpo: store.listar('corpo'), idade: idadeAtual() }));
}
export const corpoDoPersonagem = (p = personagemSalvo()) => corpoEfetivo(p, corpoSugeridoAgora());

/** Resumo para as telas (chip e Jornada) */
export function resumoJornada(hoje = dataISO()) {
  const dados = dadosDaJornada(), idx = indexar(dados), ex = xpGuardado(), total = totalXP(ex), nv = nivelDe(total);
  const doDia = xpDoDia(hoje, idx, hoje);
  return {
    hoje, total, ...nv, xpHoje: doDia.xp, itensHoje: doDia.itens, seqRegistro: sequenciaRegistro(idx, hoje, { hoje }), seqTreino: sequenciaTreino(idx, hoje, hoje),
    missoes: missoesDoDia(hoje, idx), desafio: desafioSemanal(hoje, idx), conquistas: conquistasGuardadas(), stats: estatisticas(dados, { xpTotal: total, personagemCriado: !!personagemSalvo().criado }),
  };
}

/** Recalcula e grava o XP (idempotente), as conquistas novas e o histórico do desenho. Retorna o que mudou, para o feedback. */
export function atualizarJornada(hoje = dataISO()) {
  const dados = dadosDaJornada(), antesTotal = totalXP(xpGuardado());
  const r = reconciliarXP({ hoje, dados, existentes: xpGuardado() });
  for (const x of r.atualizar) store.salvar('xp', { id: x.dia, dia: x.dia, xp: x.xp, itens: x.itens });
  for (const d of r.remover) store.remover('xp', d);
  const total = totalXP(xpGuardado()), pers = personagemSalvo();
  const st = estatisticas(dados, { xpTotal: total, personagemCriado: !!pers.criado });
  const guardadas = conquistasGuardadas(), novas = novasConquistas(st, Object.keys(guardadas));
  for (const id of novas) store.salvar('conquistas', { id, em: hoje });
  // linha do tempo do desenho (só o desenho; só quando muda de verdade)
  const corpo = corpoEfetivo(pers, corpoSugeridoAgora()), hist = registrarHistorico(pers.historico, hoje, corpo);
  if (hist.length !== (pers.historico || []).length && !pers.ocultarMudancas) salvarPersonagem({ ...pers, historico: hist });
  return { ganhou: total - antesTotal, total, nivelAntes: nivelDe(antesTotal).nivel, nivelDepois: nivelDe(total).nivel, novasConquistas: novas.map(id => CONQUISTAS.find(c => c.id === id)).filter(Boolean) };
}

/** Liga o recálculo às mudanças de dados e mostra um aviso discreto ao ganhar XP, subir de nível ou liberar conquista (sem sons) */
export function iniciarJornada(aoMudar = () => {}) {
  let t = null, primeira = true, xpHojeAntes = null;
  const rodar = () => {
    try {
      const hoje = dataISO(), r = atualizarJornada(hoje), xpHoje = resumoJornada(hoje).xpHoje;
      if (!primeira && xpHojeAntes != null && xpHoje > xpHojeAntes) aviso(`+${xpHoje - xpHojeAntes} XP hoje`, { duracao: 2800 });
      if (!primeira && r.nivelDepois > r.nivelAntes) aviso(`Nível ${r.nivelDepois}: ${nivelDe(r.total).titulo}!`, { duracao: 4500 });
      if (!primeira) for (const c of r.novasConquistas) aviso(`Conquista: ${c.rotulo}`, { duracao: 4500 });
      xpHojeAntes = xpHoje; primeira = false;
      if (r.ganhou || r.novasConquistas.length) aoMudar();
    } catch (e) { console.warn('Jornada', e); }
  };
  rodar();
  store.assinar(ev => {
    if (ev.tipo === 'erro-gravacao') return;
    if (ev.tipo === 'item' && ['xp', 'conquistas'].includes(ev.col)) return;   // evita laço com as próprias gravações
    if (ev.tipo === 'unico' && ev.nome !== 'plano' && ev.nome !== 'perfil') return;
    clearTimeout(t); t = setTimeout(rodar, 900);
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') rodar(); });
  return rodar;
}
export { diferencaCorpo };
