// Configuração do Firebase do Atlas Fitness.
// Enquanto os valores abaixo forem "COLE_AQUI...", o app roda em MODO LOCAL (sem login, sem nuvem).
// Passo a passo para preencher: docs/FIREBASE_SETUP.md
//
// Estes valores NÃO são segredos: a segurança vem das regras do Firestore (firestore.rules) e dos
// domínios autorizados no Firebase Authentication.
export const firebaseConfig = {
  apiKey: "AIzaSyAkysFqpeR6gutGVqHQamSuU7GLA5d6A1M",
  authDomain: "atlas-fitness-5bd51.firebaseapp.com",
  projectId: "atlas-fitness-5bd51",
  storageBucket: "atlas-fitness-5bd51.firebasestorage.app",
  messagingSenderId: "626801152961",
  appId: "1:626801152961:web:6feeded84bbb69f067d540"
};

// Versão do SDK carregada sob demanda (CDN gstatic). Altere só se precisar atualizar.
export const FIREBASE_SDK_VERSAO = '10.14.1';

export const nuvemConfigurada = () =>
  !!firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('COLE_AQUI') &&
  !!firebaseConfig.projectId && !String(firebaseConfig.projectId).startsWith('COLE_AQUI');
