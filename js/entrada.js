// Tela de boas-vindas (primeira abertura): lógica de decisão e lembrança da escolha. Funções puras + localStorage seguro.
const CHAVE = 'atlas.entrada';

export function lerEscolha() { try { return localStorage.getItem(CHAVE); } catch { return null; } }
export function gravarEscolha(v) { try { if (v == null) localStorage.removeItem(CHAVE); else localStorage.setItem(CHAVE, v); } catch { /* ignora */ } }

/** A tela só aparece quando a nuvem está configurada, ninguém está logado e a pessoa não escolheu "continuar sem login". */
export function deveMostrarEntrada({ nuvem, usuario, escolha }) {
  return !!nuvem && !usuario && escolha !== 'local';
}

/** Para onde ir depois de entrar: perfil já existente (veio da nuvem ou do aparelho) pula o onboarding. */
export function destinoAposLogin({ perfilConcluido, perfilPulado }) {
  return perfilConcluido || perfilPulado ? 'alimentacao' : 'onboarding';
}

export function validarCredenciais({ email, senha, criando, aceite }) {
  const e = String(email || '').trim();
  if (!e) return 'Digite o e-mail.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return 'Esse e-mail parece inválido. Confira se tem @ e o domínio.';
  if (!senha) return 'Digite a senha.';
  if (criando && senha.length < 6) return 'Senha fraca: use pelo menos 6 caracteres.';
  if (criando && !aceite) return 'Para criar a conta, marque que leu e aceita os termos e o aviso de privacidade.';
  return null;
}
