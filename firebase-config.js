// Configuração do Firebase do Atlas Fitness.
// Enquanto os valores abaixo forem "COLE_AQUI...", o app roda em MODO LOCAL (sem login, sem nuvem).
// Passo a passo para preencher: docs/FIREBASE_SETUP.md
//
// Estes valores NÃO são segredos: a segurança vem das regras do Firestore (firestore.rules) e dos
// domínios autorizados no Firebase Authentication.
export const firebaseConfig = {
  apiKey: 'COLE_AQUI_apiKey',
  authDomain: 'COLE_AQUI_projeto.firebaseapp.com',
  projectId: 'COLE_AQUI_projectId',
  storageBucket: 'COLE_AQUI_projeto.appspot.com',
  messagingSenderId: 'COLE_AQUI_messagingSenderId',
  appId: 'COLE_AQUI_appId',
};

// Versão do SDK carregada sob demanda (CDN gstatic). Altere só se precisar atualizar.
export const FIREBASE_SDK_VERSAO = '10.14.1';

export const nuvemConfigurada = () =>
  !!firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('COLE_AQUI') &&
  !!firebaseConfig.projectId && !String(firebaseConfig.projectId).startsWith('COLE_AQUI');
