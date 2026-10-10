// Boas-vindas: entrar, criar conta, Google, esqueci a senha ou continuar sem login (modo local).
import { h, limpar, icone, campo, caixaAviso, aviso } from '../ui.js';
import * as nuvem from '../firebase.js';
import { gravarEscolha, validarCredenciais, destinoAposLogin } from '../entrada.js';
import { perfil } from '../dados.js';

const juntar = (el, ...xs) => xs.flat().filter(x => x != null && x !== false).forEach(x => el.appendChild(x));

export function renderizar(raiz, ctx) {
  ctx.faixa('Bem-vindo');
  let modo = 'entrar';          // 'entrar' | 'criar'
  let ocupado = false;
  const caixa = h('div', { class: 'onb entrada-tela' });
  const msg = h('div', { 'aria-live': 'polite' });
  const em = h('input', { type: 'email', autocomplete: 'email', inputmode: 'email', placeholder: 'voce@email.com' });
  const se = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'mínimo 6 caracteres' });
  const aceite = h('input', { type: 'checkbox', id: 'aceite-termos' });
  const destino = () => { const p = perfil(); return destinoAposLogin({ perfilConcluido: !!p.onbConcluido, perfilPulado: !!p.onbPulado }); };

  const continuarLocal = () => { gravarEscolha('local'); ctx.navegar(destino()); };

  async function aposEntrar() {
    limpar(msg).appendChild(caixaAviso('info', 'Entrou! Buscando seus dados…', 'Sincronizando com a nuvem.'));
    const r = await nuvem.aguardarSincronizacao(15000);
    if (r === 'erro') aviso('Entrou, mas a sincronização falhou: ' + (nuvem.estadoSync().mensagem || 'tente de novo depois'));
    gravarEscolha(null);
    ctx.navegar(destino());
  }
  async function tentar(fn) {
    if (ocupado) return;
    ocupado = true; desenhar();
    limpar(msg);
    try { await fn(); ocupado = false; await aposEntrar(); return; }
    catch (e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      msg.appendChild(caixaAviso('alto', 'Não deu para entrar', offline ? 'Sem conexão com a internet. Você pode continuar sem login e entrar depois, em Ajustes.' : nuvem.mensagemErro(e)));
    }
    ocupado = false; desenhar();
  }
  async function esqueci() {
    const e = em.value.trim();
    limpar(msg);
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { msg.appendChild(caixaAviso('alto', null, 'Digite seu e-mail no campo acima e toque em "Esqueci a senha" de novo.')); em.focus(); return; }
    try { await nuvem.recuperarSenha(e); msg.appendChild(caixaAviso('ok', 'E-mail enviado', `Se existir uma conta para ${e}, você vai receber um link para criar uma nova senha. Confira também o spam.`)); }
    catch (err) { msg.appendChild(caixaAviso('alto', null, nuvem.mensagemErro(err))); }
  }
  function enviar() {
    const criando = modo === 'criar';
    const erro = validarCredenciais({ email: em.value, senha: se.value, criando, aceite: aceite.checked });
    limpar(msg);
    if (erro) { msg.appendChild(caixaAviso('alto', null, erro)); return; }
    tentar(() => (criando ? nuvem.criarConta(em.value.trim(), se.value) : nuvem.entrarComEmail(em.value.trim(), se.value)));
  }

  function desenhar() {
    const criando = modo === 'criar';
    se.autocomplete = criando ? 'new-password' : 'current-password';
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    limpar(caixa);
    juntar(caixa,
      h('h2', null, 'Atlas Fitness'),
      h('p', { class: 'lead' }, 'Alimentação, treino e corpo no mesmo lugar. Entre para guardar seus dados na nuvem e usar em mais de um aparelho.'),
      offline ? caixaAviso('medio', 'Você está sem internet', 'Para entrar ou criar conta é preciso conexão. Continue sem login agora e entre depois, em Ajustes.') : null,
      h('button', { class: 'btn btn-escuro btn-grande', type: 'button', onclick: continuarLocal }, 'Continuar sem login'),
      h('p', { class: 'ajuda', style: { textAlign: 'center' } }, 'Tudo funciona neste aparelho. Dá para entrar depois, em Ajustes > Conta e nuvem.'),
      h('div', { class: 'ou', 'aria-hidden': 'true' }, h('span', null, 'ou')),
      h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Entrar ou criar conta' },
        h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(!criando), onclick: () => { modo = 'entrar'; limpar(msg); desenhar(); } }, 'Entrar'),
        h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(criando), onclick: () => { modo = 'criar'; limpar(msg); desenhar(); } }, 'Criar conta')),
      h('form', { class: 'pilha', novalidate: true, onsubmit: ev => { ev.preventDefault(); enviar(); } },
        campo('E-mail', em), campo('Senha', se),
        criando ? h('label', { class: 'opcao', for: 'aceite-termos' }, aceite, h('span', null, h('strong', null, 'Li e aceito'), h('span', { class: 'd' }, 'Seus dados de saúde (peso, medidas, refeições, treinos) são dados pessoais sensíveis pela LGPD. Ficam só na sua conta, protegidos por regras que só você acessa, e você pode exportar ou apagar tudo em Ajustes. O app não substitui médico ou nutricionista.'))) : null,
        h('button', { class: 'btn btn-primario', type: 'submit', disabled: ocupado }, ocupado ? 'Aguarde…' : (criando ? 'Criar conta' : 'Entrar')),
        !criando ? h('button', { class: 'btn btn-fantasma', type: 'button', onclick: esqueci }, 'Esqueci a senha') : null),
      msg,
      h('button', { class: 'btn', type: 'button', disabled: ocupado, onclick: () => tentar(() => nuvem.entrarComGoogle()) }, icone('pessoa', 20), 'Continuar com Google'));
  }
  desenhar();
  raiz.appendChild(caixa);
  if (nuvem.usuarioAtual()) aposEntrar();   // ex.: volta do login Google por redirecionamento
}
