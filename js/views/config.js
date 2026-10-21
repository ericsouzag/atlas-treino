// Ajustes: perfil, metas, conta/nuvem, backup, aparência, privacidade e apagar dados (LGPD).
import { h, limpar, icone, campo, entradaNum, lerNumero, selecao, n0, aviso, folha, confirmar, caixaAviso } from '../ui.js';
import { store, gravarJa } from '../store.js';
import { perfil as getPerfil, config as getConfig, metas as getMetas, onboardingFeito } from '../dados.js';
import { NIVEIS_ATIVIDADE, OBJETIVOS } from '../nutrition.js';
import { EQUIPAMENTOS } from '../exercises.js';
import { nuvemConfigurada } from '../../firebase-config.js';
import * as nuvem from '../firebase.js';
import { exportarFotos, importarFotos, apagarTodasFotos } from '../images.js';
import { dataISO } from '../datas.js';
import { gravarEscolha } from '../entrada.js';
import { cartaoMeusAlimentos } from './buscar-alimento.js';

export function renderizar(raiz, ctx) {
  ctx.faixa('Ajustes');
  const P = getPerfil(), C = getConfig(), M = getMetas();
  const redesenhar = () => ctx.redesenhar();
  const secs = [];

  // ---------------- perfil
  const rot = (lista, id) => (lista.find(x => x.id === id) || {}).rotulo || '–';
  secs.push(h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Seu perfil'),
    onboardingFeito() ? h('dl', { class: 'pilha', style: { gap: '4px', margin: 0 } },
      [['Sexo', P.sexo === 'M' ? 'Masculino' : P.sexo === 'F' ? 'Feminino' : '–'], ['Altura', P.altura ? `${P.altura} cm` : '–'], ['Atividade', rot(NIVEIS_ATIVIDADE, P.atividade)], ['Objetivo', rot(OBJETIVOS, P.objetivo)], ['Experiência', { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' }[P.experiencia] || '–'], ['Treina em', (EQUIPAMENTOS[P.equipamento] || {}).nome || '–']]
        .map(([k, v]) => h('div', { class: 'flex-entre' }, h('dt', { class: 'mudo' }, k), h('dd', { style: { margin: 0, fontWeight: 600 } }, v))))
      : caixaAviso('info', null, 'Seu perfil ainda não foi completado. Metas padrão estão em uso.'),
    h('button', { class: 'btn', type: 'button', onclick: () => { store.salvarUnico('perfil', { onbConcluido: false, onbPulado: false, onbEtapa: 1 }); ctx.navegar('onboarding'); } }, icone('lapis', 18), onboardingFeito() ? 'Editar perfil' : 'Completar perfil')));

  // ---------------- metas
  const inK = entradaNum(M.kcal), inP = entradaNum(M.prot), inC = entradaNum(M.carb), inG = entradaNum(M.gord);
  secs.push(h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Metas diárias'),
    M.avisos.map(a => caixaAviso('medio', null, a)),
    h('div', { class: 'grade-2' }, campo('Calorias (kcal)', inK), campo('Proteína (g)', inP), campo('Carboidrato (g)', inC), campo('Gordura (g)', inG)),
    h('div', { class: 'linha-botoes' },
      h('button', { class: 'btn btn-primario', type: 'button', onclick: () => { const v = { kcal: lerNumero(inK.value), prot: lerNumero(inP.value), carb: lerNumero(inC.value), gord: lerNumero(inG.value) }; if (Object.values(v).some(x => !x || x <= 0)) { aviso('Preencha todas as metas com valores positivos.'); return; } if (P.nascimento && M.menor && v.kcal < M.tdee * 0.9) { aviso('Menor de 18 anos: não é permitido déficit acima de 10%.'); return; } store.salvarUnico('config', { metasManuais: v }); aviso('Metas salvas (manuais).'); redesenhar(); } }, 'Salvar metas'),
      C.metasManuais ? h('button', { class: 'btn', type: 'button', onclick: () => { store.salvarUnico('config', { metasManuais: null }); aviso('Voltamos às metas calculadas.'); redesenhar(); } }, 'Voltar às calculadas') : null),
    h('details', null, h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 600 } }, 'Por que esses números?'),
      h('ul', { style: { paddingLeft: '20px', display: 'grid', gap: '6px' } }, M.explicacao.map(t => h('li', null, t)))),
    h('span', { class: 'estimativa' }, 'Estimativas, não prescrição')));

  // ---------------- conta / nuvem
  const caixaConta = h('section', { class: 'cartao pilha' });
  function desenharConta() {
    limpar(caixaConta);
    caixaConta.appendChild(h('h2', { style: { marginBottom: 0 } }, 'Conta e nuvem'));
    if (!nuvemConfigurada()) {
      caixaConta.append(caixaAviso('info', 'Modo local', 'Seus dados ficam só neste aparelho. Para entrar com conta e sincronizar entre aparelhos, o Firebase precisa ser configurado (veja docs/FIREBASE_SETUP.md).'));
      return;
    }
    const u = nuvem.usuarioAtual();
    const est = nuvem.estadoSync();
    if (u) {
      caixaConta.append(h('p', null, 'Conectado como ', h('strong', null, u.email || u.nome || 'usuário')),
        caixaAviso(est.status === 'erro' ? 'alto' : 'info', est.status === 'ok' ? 'Sincronizado' : est.status === 'sincronizando' ? 'Sincronizando…' : 'Atenção', est.mensagem || ''),
        h('p', { class: 'ajuda' }, 'Fotos não são enviadas à nuvem (ficam só neste aparelho).'),
        h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: async () => { await nuvem.sair(); gravarEscolha('local'); aviso('Você saiu da conta. Os dados continuam neste aparelho.'); desenharConta(); } }, 'Sair'),
          h('button', { class: 'btn btn-perigo', type: 'button', onclick: apagarNuvem }, 'Apagar dados da nuvem')));
    } else {
      const em = h('input', { type: 'email', autocomplete: 'email', placeholder: 'voce@email.com' }), se = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'mínimo 6 caracteres' });
      const msg = h('div', { 'aria-live': 'polite' });
      const tenta = async fn => { limpar(msg); try { await fn(); aviso('Pronto!'); desenharConta(); } catch (e) { msg.appendChild(caixaAviso('alto', null, nuvem.mensagemErro(e))); } };
      caixaConta.append(h('p', { class: 'mudo' }, 'Entre para sincronizar seus dados entre aparelhos. Sem conta, tudo continua funcionando só neste aparelho.'),
        campo('E-mail', em), campo('Senha', se), msg,
        h('div', { class: 'linha-botoes' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => tenta(() => nuvem.entrarComEmail(em.value.trim(), se.value)) }, 'Entrar'), h('button', { class: 'btn', type: 'button', onclick: () => tenta(() => nuvem.criarConta(em.value.trim(), se.value)) }, 'Criar conta')),
        h('button', { class: 'btn', type: 'button', onclick: () => tenta(() => nuvem.entrarComGoogle()) }, 'Entrar com Google'),
        h('button', { class: 'btn btn-fantasma', type: 'button', onclick: () => tenta(async () => { if (!em.value.trim()) throw { message: 'Digite seu e-mail acima primeiro.' }; await nuvem.recuperarSenha(em.value.trim()); aviso('Enviamos um e-mail para redefinir a senha.'); }) }, 'Esqueci a senha'));
    }
  }
  async function apagarNuvem() {
    if (!(await confirmar('Apagar dados da nuvem?', 'Remove tudo que está salvo na sua conta online (neste aparelho os dados continuam). Tentaremos também excluir a conta.', { sim: 'Apagar da nuvem', perigo: true }))) return;
    try { const r = await nuvem.apagarDadosNuvem(); aviso(r.contaExcluida ? 'Dados e conta excluídos.' : 'Dados da nuvem apagados. Para excluir a conta, saia e entre de novo e repita.'); } catch (e) { aviso(nuvem.mensagemErro(e)); }
    desenharConta();
  }
  desenharConta();
  const desassina = nuvem.aoMudarEstado(() => { if (document.body.contains(caixaConta)) desenharConta(); });
  secs.push(caixaConta);

  // ---------------- backup
  const arquivo = h('input', { type: 'file', accept: 'application/json,.json', class: 'so-leitor', tabindex: '-1', onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      const substituir = await folha('Importar backup', fechar => h('div', { class: 'pilha' }, h('p', null, `Backup de ${obj.exportadoEm ? obj.exportadoEm.slice(0, 10) : 'data desconhecida'}. Como importar?`),
        h('button', { class: 'btn btn-primario', type: 'button', onclick: () => fechar('mesclar') }, 'Mesclar com meus dados (mantém o mais recente)'), h('button', { class: 'btn btn-perigo', type: 'button', onclick: () => fechar('substituir') }, 'Substituir tudo'), h('button', { class: 'btn', type: 'button', onclick: () => fechar(undefined) }, 'Cancelar')));
      if (!substituir) return;
      store.importar(obj, substituir);
      if (obj.fotos) await importarFotos(obj.fotos);
      aviso('Backup importado.'); redesenhar();
    } catch (err) { aviso(err.message || 'Arquivo inválido.'); }
    e.target.value = '';
  } });
  async function exportar(comFotos) {
    const obj = store.exportar();
    if (comFotos) {
      const ids = [...store.listar('corpo').flatMap(r => r.fotos || []), ...store.listar('refeicoes').map(r => r.fotoId).filter(Boolean)];
      obj.fotos = await exportarFotos(ids);
    }
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `atlas-fitness-backup-${dataISO()}.json` });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    aviso('Backup baixado.');
  }
  secs.push(h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Backup dos dados'),
    h('p', { class: 'mudo' }, 'Baixe uma cópia em JSON para guardar ou levar para outro aparelho.'),
    h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => exportar(false) }, icone('baixar', 18), 'Exportar dados'), h('button', { class: 'btn', type: 'button', onclick: () => exportar(true) }, icone('baixar', 18), 'Exportar com fotos'), h('button', { class: 'btn', type: 'button', onclick: () => arquivo.click() }, icone('subir', 18), 'Importar backup')), arquivo));

  // ---------------- meus alimentos
  secs.push(cartaoMeusAlimentos(redesenhar));

  // ---------------- aparência
  secs.push(h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Aparência'),
    campo('Tema', selecao([['escuro', 'Escuro (padrão)'], ['claro', 'Claro'], ['auto', 'Automático (do aparelho)']], C.tema || 'escuro', { onchange: e => { store.salvarUnico('config', { tema: e.target.value }); document.documentElement.dataset.tema = e.target.value; } }))));

  // ---------------- privacidade e saúde
  secs.push(h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Privacidade e avisos de saúde'),
    h('details', { open: true }, h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 600 } }, 'Resumo da política de privacidade'),
      h('ul', { style: { paddingLeft: '20px', display: 'grid', gap: '6px' } },
        h('li', null, h('strong', null, 'O que guardamos: '), 'perfil (sexo, nascimento, altura, objetivo), refeições, treinos, medidas e fotos de progresso. Dados de saúde são dados pessoais sensíveis pela LGPD.'),
        h('li', null, h('strong', null, 'Onde fica: '), 'neste aparelho (armazenamento do navegador). Só vai para a nuvem (Google Firebase) se você criar uma conta e entrar. Fotos nunca vão para a nuvem.'),
        h('li', null, h('strong', null, 'Busca de produtos: '), 'só quando você toca em "Buscar produto", o texto digitado (ou o código de barras) é enviado ao Open Food Facts (openfoodfacts.org) pela internet. Nada mais é enviado e os resultados não ficam salvos, a não ser o produto que você escolher.'),
        h('li', null, h('strong', null, 'Quem vê: '), 'só você. As regras do banco permitem que cada conta leia e escreva apenas os próprios dados. Não vendemos nem compartilhamos dados, e não há anúncios nem rastreadores.'),
        h('li', null, h('strong', null, 'Seus direitos: '), 'exportar (backup acima), corrigir (editar nas telas) e apagar tudo (botão abaixo; na nuvem, “Apagar dados da nuvem”).'),
        h('li', null, h('strong', null, 'Menores: '), 'a partir de 14 anos, com acompanhamento de responsável e profissional de saúde. Menores de 18 têm déficit calórico limitado.'))),
    caixaAviso('medio', 'Aviso de saúde', 'O Atlas Fitness não substitui médico, nutricionista ou educador físico. Calorias, metas, gordura corporal e previsões são estimativas aproximadas. Procure um profissional se tiver doença, estiver grávida ou amamentando, tiver histórico de transtorno alimentar ou sentir dor ao treinar.')));

  // ---------------- créditos
  secs.push(h('section', { class: 'cartao pilha' }, h('h2', { style: { marginBottom: 0 } }, 'Créditos'),
    h('ul', { style: { paddingLeft: '20px', display: 'grid', gap: '6px', margin: 0 } },
      h('li', null, 'Fotos dos exercícios (posição inicial e final): free-exercise-db, github.com/yuhonas/free-exercise-db, domínio público (Unlicense). Redimensionadas para 640 px.'),
      h('li', null, 'Alimentos brasileiros: Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada, NEPA/UNICAMP, 2011 (www.unicamp.br/nepa/taco). Reprodução permitida citando a fonte. Transcrição em JSON: IgorFZ/taco-br (licença MIT). Porções caseiras, apelidos e estimativas de açúcar são do Atlas Fitness.'),
      h('li', null, 'Produtos industrializados (busca opcional): Open Food Facts, openfoodfacts.org, dados sob a licença ODbL 1.0 (opendatacommons.org/licenses/odbl/1-0). Dados feitos por colaboradores, podem estar incompletos.'),
      h('li', null, 'Fontes Bricolage Grotesque e Figtree: licença SIL Open Font.'),
      h('li', null, 'Valores de MET: Compêndio de Atividades Físicas (Ainsworth et al., 2011), aproximados.'))));

  // ---------------- apagar tudo
  secs.push(h('section', { class: 'cartao pilha', style: { borderColor: 'var(--perigo)' } }, h('h2', { style: { marginBottom: 0 } }, 'Apagar todos os dados'),
    h('p', null, 'Remove perfil, refeições, treinos, medidas e fotos deste aparelho. Não dá para desfazer. Faça um backup antes se quiser guardar.'),
    h('button', { class: 'btn btn-perigo', type: 'button', onclick: async () => {
      const ok = await folha('Apagar tudo?', fechar => {
        const inp = h('input', { type: 'text', autocomplete: 'off', 'aria-label': 'Digite APAGAR para confirmar', placeholder: 'APAGAR' });
        return h('div', { class: 'pilha' }, h('p', null, 'Digite ', h('strong', null, 'APAGAR'), ' para confirmar. Todos os dados deste aparelho serão removidos.'), inp,
          h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => fechar(false) }, 'Cancelar'), h('button', { class: 'btn btn-perigo', type: 'button', onclick: () => { if (inp.value.trim().toUpperCase() === 'APAGAR') fechar(true); else aviso('Digite APAGAR para confirmar.'); } }, 'Apagar tudo')));
      });
      if (!ok) return;
      store.apagarTudo(); await apagarTodasFotos();
      if (nuvemConfigurada() && nuvem.usuarioAtual() && await confirmar('Apagar também na nuvem?', 'Você está conectado. Quer apagar os dados da sua conta online também?', { sim: 'Apagar na nuvem', nao: 'Manter na nuvem', perigo: true })) { try { await nuvem.apagarDadosNuvem(); } catch (e) { aviso(nuvem.mensagemErro(e)); } }
      aviso('Tudo apagado.'); ctx.navegar('onboarding'); location.reload();
    } }, icone('lixo', 18), 'Apagar tudo')));

  secs.push(h('p', { class: 'mudo peq', style: { textAlign: 'center' } }, 'Atlas Fitness · versão 1.0 · estimativas apenas'));
  raiz.append(h('div', { class: 'pilha-g', style: { maxWidth: '680px', margin: '0 auto' } }, secs));
  return () => desassina();
}
