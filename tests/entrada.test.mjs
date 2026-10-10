import { teste, igual, ok, fim } from './_t.mjs';
import { deveMostrarEntrada, destinoAposLogin, validarCredenciais } from '../js/entrada.js';
import { store } from '../js/store.js';

console.log('Lógica da tela de boas-vindas');
teste('só aparece com nuvem configurada, sem login e sem escolha "local"', () => {
  igual(deveMostrarEntrada({ nuvem: false, usuario: null, escolha: null }), false, 'sem nuvem');
  igual(deveMostrarEntrada({ nuvem: true, usuario: { uid: 'x' }, escolha: null }), false, 'logado');
  igual(deveMostrarEntrada({ nuvem: true, usuario: null, escolha: 'local' }), false, 'escolheu local');
  igual(deveMostrarEntrada({ nuvem: true, usuario: null, escolha: null }), true, 'primeira abertura');
});
teste('perfil existente pula o onboarding', () => {
  igual(destinoAposLogin({ perfilConcluido: true }), 'alimentacao'); igual(destinoAposLogin({ perfilPulado: true }), 'alimentacao'); igual(destinoAposLogin({}), 'onboarding');
});
teste('validação de e-mail, senha e aceite', () => {
  ok(validarCredenciais({ email: '', senha: 'x' }).includes('e-mail')); ok(validarCredenciais({ email: 'abc', senha: 'x' }).includes('inválido'));
  ok(validarCredenciais({ email: 'a@b.co', senha: '' }).includes('senha')); ok(validarCredenciais({ email: 'a@b.co', senha: '123', criando: true, aceite: true }).includes('fraca'));
  ok(validarCredenciais({ email: 'a@b.co', senha: '123456', criando: true, aceite: false }).includes('aceita'));
  igual(validarCredenciais({ email: 'a@b.co', senha: '123456', criando: true, aceite: true }), null); igual(validarCredenciais({ email: 'a@b.co', senha: 'x' }), null);
});

// ---- SDK simulado (sem rede) ----
const remoto = new Map();
const chamadas = [];
let usuarioMock = null, cbAuth = null, falha = null;
const fakeUser = { uid: 'u1', email: 'a@b.co', displayName: null };
globalThis.__ATLAS_SDK_MOCK = {
  app: { initializeApp: () => ({}) },
  auth: {
    getAuth: () => ({}),
    onAuthStateChanged: (_a, cb) => { cbAuth = cb; cb(usuarioMock); },
    signInWithEmailAndPassword: async () => { chamadas.push('login'); if (falha) throw { code: falha }; usuarioMock = fakeUser; cbAuth(fakeUser); },
    createUserWithEmailAndPassword: async () => { chamadas.push('criar'); if (falha) throw { code: falha }; usuarioMock = fakeUser; cbAuth(fakeUser); },
    sendPasswordResetEmail: async (_a, e) => { chamadas.push('reset:' + e); if (falha) throw { code: falha }; },
    signOut: async () => { usuarioMock = null; cbAuth(null); },
    GoogleAuthProvider: class {}, signInWithPopup: async () => { chamadas.push('google'); usuarioMock = fakeUser; cbAuth(fakeUser); },
  },
  fs: {
    getFirestore: () => ({}),
    collection: (_db, ...p) => ({ p: p.join('/') }),
    doc: (_db, ...p) => ({ p: p.join('/') }),
    getDocs: async c => ({ docs: [...remoto.entries()].filter(([k]) => k.startsWith(c.p + '/')).map(([k, v]) => ({ id: k.split('/').pop(), data: () => v, ref: { p: k } })) }),
    setDoc: async (d, v) => { chamadas.push('set:' + d.p); remoto.set(d.p, v); },
    deleteDoc: async d => remoto.delete(d.p),
  },
};
const N = await import('../js/firebase.js');

let falhas = 0, total = 0;
async function t2(nome, fn) { total++; try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHA ' + nome + '\n        ' + (e && e.message)); } }
const espera = ms => new Promise(r => setTimeout(r, ms));

console.log('Fluxos com SDK simulado');
teste('mensagens de erro em português claras', () => {
  const m = c => N.mensagemErro({ code: c });
  ok(m('auth/weak-password').includes('Senha fraca')); ok(m('auth/email-already-in-use').includes('Já existe')); ok(m('auth/wrong-password').includes('incorreta'));
  ok(m('auth/invalid-credential').includes('incorretos')); ok(m('auth/unauthorized-domain').includes('autorizado')); ok(m('auth/network-request-failed').includes('conexão'));
  ok(m('auth/too-many-requests').includes('Muitas')); ok(m('auth/popup-closed-by-user').includes('fechada'));
});
await N.iniciarNuvem();
await t2('sem login: aguardarUsuario devolve null', async () => igual(await N.aguardarUsuario(100), null));
await t2('esqueci a senha chama sendPasswordResetEmail com o e-mail', async () => { await N.recuperarSenha('a@b.co'); ok(chamadas.includes('reset:a@b.co')); });
await t2('senha errada vem traduzida', async () => { falha = 'auth/wrong-password'; let msg = ''; try { await N.entrarComEmail('a@b.co', 'x'); } catch (e) { msg = N.mensagemErro(e); } falha = null; ok(msg.includes('incorreta')); });
await t2('conta nova com dados locais: pergunta; "não enviar" não grava na nuvem', async () => {
  store._reset(); store.salvarUnico('perfil', { sexo: 'M', onbConcluido: true });
  let perguntou = 0; N.definirDecisorEnvio(async () => { perguntou++; return false; });
  chamadas.length = 0;
  await N.criarConta('a@b.co', '123456'); await espera(80); await N.aguardarSincronizacao(500);
  igual(perguntou, 1); ok(!chamadas.some(c => c.startsWith('set:')), 'não deveria ter enviado');
});
await t2('conta nova com dados locais: "enviar" grava o perfil na nuvem', async () => {
  await N.sair(); store._reset(); store.salvarUnico('perfil', { sexo: 'F', onbConcluido: true }); remoto.clear(); chamadas.length = 0;
  N.definirDecisorEnvio(async () => true);
  await N.entrarComEmail('a@b.co', '123456'); await espera(100); await N.aguardarSincronizacao(500);
  ok(chamadas.includes('set:users/u1/unicos/perfil'), chamadas.join(','));
});
await t2('conta existente com dados na nuvem: puxa o perfil (pula onboarding) sem perguntar', async () => {
  await N.sair(); store._reset(); chamadas.length = 0;
  remoto.set('users/u1/unicos/perfil', { valor: { sexo: 'M', onbConcluido: true, _u: Date.now() } });
  let perguntou = false; N.definirDecisorEnvio(async () => { perguntou = true; return true; });
  await N.entrarComEmail('a@b.co', '123456'); await espera(100); await N.aguardarSincronizacao(500);
  ok(store.obterUnico('perfil')?.onbConcluido === true, 'perfil veio da nuvem'); ok(!perguntou, 'não pergunta quando a conta já tem dados');
  igual(destinoAposLogin({ perfilConcluido: !!store.obterUnico('perfil').onbConcluido }), 'alimentacao');
});
console.log(`\n${total - falhas}/${total} testes assíncronos passaram`);
if (falhas) process.exit(1);
fim();
