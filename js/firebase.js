// Login (e-mail/senha e Google) e sincronização com o Firestore. Carregado sob demanda (lazy).
// O app NÃO depende deste módulo para funcionar: store.js grava sempre localmente.
import { firebaseConfig, FIREBASE_SDK_VERSAO, nuvemConfigurada } from '../firebase-config.js';
import { store, COLECOES, SINGLETONS } from './store.js';

const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSAO}/`;
let sdk = null;       // { app, auth, db, fns... }
let usuario = null;
let carregando = null;
let desassinar = null;
let fila = new Map(); // chave -> evento pendente
let timer = null;
const ouvintesUsuario = new Set();
const estado = { status: 'local', mensagem: '', ultimoSync: null };
const ouvintesEstado = new Set();

export const nuvemDisponivel = nuvemConfigurada;
export const usuarioAtual = () => usuario;
export const estadoSync = () => ({ ...estado, usuario });
let authResolvido = false;
let decisorEnvio = null;
/** Define quem decide, quando a conta é nova e há dados só neste aparelho, se eles sobem para a nuvem. Retorna Promise<boolean>. */
export function definirDecisorEnvio(fn) { decisorEnvio = fn; }
/** Espera a primeira resposta do Firebase Auth (ou o tempo limite, ex.: sem internet). Retorna o usuário ou null. */
export function aguardarUsuario(ms = 4000) {
  if (!nuvemConfigurada()) return Promise.resolve(null);
  if (authResolvido) return Promise.resolve(usuario);
  return new Promise(res => {
    const t = setTimeout(() => { off(); res(usuario); }, ms);
    const off = aoMudarUsuario(() => { clearTimeout(t); off(); res(usuario); });
  });
}
/** Espera a sincronização inicial terminar (ok/erro/local) ou o tempo limite. */
export function aguardarSincronizacao(ms = 15000) {
  return new Promise(res => {
    if (estado.status === 'ok' || estado.status === 'erro') return res(estado.status);
    const t = setTimeout(() => { off(); res(estado.status); }, ms);
    const off = aoMudarEstado(e => { if (e.status === 'ok' || e.status === 'erro') { clearTimeout(t); off(); res(e.status); } });
  });
}
export function aoMudarUsuario(fn) { ouvintesUsuario.add(fn); return () => ouvintesUsuario.delete(fn); }
export function aoMudarEstado(fn) { ouvintesEstado.add(fn); return () => ouvintesEstado.delete(fn); }
function setEstado(status, mensagem = '') {
  estado.status = status; estado.mensagem = mensagem;
  if (status === 'ok') estado.ultimoSync = new Date().toISOString();
  ouvintesEstado.forEach(f => f(estadoSync()));
}

async function carregarSDK() {
  if (sdk) return sdk;
  if (!nuvemConfigurada()) throw new Error('Firebase não configurado (modo local).');
  if (globalThis.__ATLAS_SDK_MOCK) {   // gancho de testes: SDK simulado (sem rede)
    const m = globalThis.__ATLAS_SDK_MOCK;
    sdk = { app: m.app, auth: m.auth, fs: m.fs, a: {}, authInst: m.auth.getAuth(), db: m.fs.getFirestore ? m.fs.getFirestore() : {} };
    return sdk;
  }
  if (!carregando) {
    carregando = (async () => {
      const [app, auth, fs] = await Promise.all([
        import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js'),
      ]);
      const a = app.initializeApp(firebaseConfig);
      sdk = { app, auth, fs, a, authInst: auth.getAuth(a), db: fs.getFirestore(a) };
      return sdk;
    })();
  }
  return carregando;
}

/** Chamar na abertura do app: se configurado, observa o login e sincroniza. Nunca lança erro. */
export async function iniciarNuvem() {
  if (!nuvemConfigurada()) { setEstado('local', 'Modo local: seus dados ficam só neste aparelho.'); return; }
  try {
    const s = await carregarSDK();
    s.auth.onAuthStateChanged(s.authInst, async u => {
      usuario = u ? { uid: u.uid, email: u.email, nome: u.displayName } : null;
      authResolvido = true;
      ouvintesUsuario.forEach(f => f(usuario));
      if (u) { await sincronizarTudo(); ligarEnvio(); }
      else { if (desassinar) { desassinar(); desassinar = null; } setEstado('local', 'Sem login: dados só neste aparelho.'); }
    });
  } catch (e) {
    console.warn('Nuvem indisponível', e);
    setEstado('erro', 'Não foi possível carregar o Firebase. Seguindo no modo local.');
  }
}

export async function criarConta(email, senha) {
  const s = await carregarSDK();
  await s.auth.createUserWithEmailAndPassword(s.authInst, email, senha);
}
export async function entrarComEmail(email, senha) {
  const s = await carregarSDK();
  await s.auth.signInWithEmailAndPassword(s.authInst, email, senha);
}
export async function entrarComGoogle() {
  const s = await carregarSDK();
  const prov = new s.auth.GoogleAuthProvider();
  try { await s.auth.signInWithPopup(s.authInst, prov); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') await s.auth.signInWithRedirect(s.authInst, prov);
    else throw e;
  }
}
export async function recuperarSenha(email) {
  const s = await carregarSDK();
  await s.auth.sendPasswordResetEmail(s.authInst, email);
}
export async function sair() {
  const s = await carregarSDK();
  await s.auth.signOut(s.authInst);
}

/** Traduz códigos de erro do Firebase Auth */
export function mensagemErro(e) {
  const c = e && e.code;
  const m = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Tente entrar.',
    'auth/weak-password': 'Senha fraca: use pelo menos 6 caracteres.',
    'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente de novo.',
    'auth/missing-password': 'Digite a senha.',
    'auth/missing-email': 'Digite o e-mail.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/operation-not-allowed': 'Este tipo de login ainda não está ativado no Firebase (veja docs/FIREBASE_SETUP.md).',
    'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups ou use e-mail e senha.',
    'auth/cancelled-popup-request': 'A janela do Google foi fechada antes de concluir.',
    'auth/account-exists-with-different-credential': 'Já existe uma conta com esse e-mail usando outro método de login.',
    'auth/unauthorized-domain': 'Este endereço ainda não está autorizado no Firebase (veja docs/FIREBASE_SETUP.md, passo dos domínios).',
    'permission-denied': 'Sem permissão no Firestore. Confira se publicou as regras (firestore.rules).',
  }[c];
  return m || (e && e.message) || 'Algo deu errado.';
}

// ---------------------------- sincronização --------------------------------

const refCol = (s, col) => s.fs.collection(s.db, 'users', usuario.uid, col);

function temDadosLocais() {
  const b = store.bruto();
  return !!b.perfil || COLECOES.some(c => Object.values(b[c]).some(x => !x._d));
}

async function sincronizarTudo() {
  const s = await carregarSDK();
  setEstado('sincronizando', 'Sincronizando…');
  try {
    // 1) lê tudo da nuvem
    const snaps = {};
    for (const col of COLECOES) snaps[col] = await s.fs.getDocs(refCol(s, col));
    const snapU = await s.fs.getDocs(refCol(s, 'unicos'));
    const remotoVazio = COLECOES.every(c => snaps[c].docs.length === 0) && snapU.docs.length === 0;
    // conta nova + dados só neste aparelho: perguntar se sobem
    if (remotoVazio && temDadosLocais() && decisorEnvio) {
      const enviar = await decisorEnvio({ novaConta: true });
      if (!enviar) { setEstado('ok', 'Conta nova: os dados deste aparelho não foram enviados.'); return; }
    }
    // 2) mescla (último que escreveu vence)
    for (const col of COLECOES) store.mesclarRemoto(col, snaps[col].docs.map(d => d.data()));
    snapU.docs.forEach(d => store.mesclarUnicoRemoto(d.id, d.data().valor));
    // 3) envia o que é mais novo localmente
    const bruto = store.bruto();
    const envios = [];
    for (const col of COLECOES) {
      const remotos = new Map(snaps[col].docs.map(d => [d.id, d.data()._u || 0]));
      for (const it of Object.values(bruto[col])) if ((it._u || 0) > (remotos.get(it.id) || 0)) envios.push({ tipo: 'item', col, id: it.id, valor: it });
    }
    const remotosU = new Map(snapU.docs.map(d => [d.id, (d.data().valor || {})._u || 0]));
    for (const n of SINGLETONS) if (bruto[n] && (bruto[n]._u || 0) > (remotosU.get(n) || 0)) envios.push({ tipo: 'unico', nome: n, valor: bruto[n] });
    for (const ev of envios) await enviar(ev);
    setEstado('ok', 'Tudo sincronizado.');
  } catch (e) {
    console.warn('Falha ao sincronizar', e);
    setEstado('erro', mensagemErro(e));
  }
}

async function enviar(ev) {
  const s = await carregarSDK();
  if (!usuario) return;
  if (ev.tipo === 'item') await s.fs.setDoc(s.fs.doc(s.db, 'users', usuario.uid, ev.col, ev.id), ev.valor);
  else await s.fs.setDoc(s.fs.doc(s.db, 'users', usuario.uid, 'unicos', ev.nome), { valor: ev.valor });
}

function ligarEnvio() {
  if (desassinar) return;
  desassinar = store.assinarSync(ev => {
    fila.set(ev.tipo === 'item' ? `${ev.col}/${ev.id}` : `u/${ev.nome}`, ev);
    clearTimeout(timer);
    timer = setTimeout(esvaziarFila, 1200);
  });
  if (typeof window !== 'undefined') window.addEventListener('online', () => { if (usuario) sincronizarTudo(); });
}

async function esvaziarFila() {
  if (!usuario) return;
  const evs = [...fila.values()]; fila = new Map();
  try {
    setEstado('sincronizando', 'Enviando…');
    for (const ev of evs) await enviar(ev);
    setEstado('ok', 'Tudo sincronizado.');
  } catch (e) {
    evs.forEach(ev => fila.set(ev.tipo === 'item' ? `${ev.col}/${ev.id}` : `u/${ev.nome}`, ev));
    setEstado('erro', navigator.onLine ? mensagemErro(e) : 'Sem internet. Vamos enviar quando voltar.');
  }
}

/** LGPD: apaga todos os dados do usuário na nuvem (e tenta excluir a conta). */
export async function apagarDadosNuvem() {
  if (!nuvemConfigurada() || !usuario) return { apagado: false };
  const s = await carregarSDK();
  for (const col of [...COLECOES, 'unicos']) {
    const snap = await s.fs.getDocs(refCol(s, col));
    for (const d of snap.docs) await s.fs.deleteDoc(d.ref);
  }
  let contaExcluida = false;
  try { await s.auth.deleteUser(s.authInst.currentUser); contaExcluida = true; } catch { /* pode exigir login recente */ }
  return { apagado: true, contaExcluida };
}
