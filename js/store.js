// Camada de dados única. SEMPRE grava localmente (localStorage) e avisa a sincronização com a nuvem (Firestore)
// quando houver login. O app funciona 100% sem nuvem.
//
// Estrutura:
//   singletons: perfil, plano, config       -> { ...campos, _u: timestamp }
//   coleções:   refeicoes, corpo, treinos, agua, favoritos, atividades -> { [id]: { ...campos, id, _u, _d? } }
// Exclusão é feita por "tombstone" (_d: true) para a sincronização conseguir propagar remoções.

const CHAVE = 'atlas.v1';
export const COLECOES = ['refeicoes', 'corpo', 'treinos', 'agua', 'favoritos', 'atividades', 'marcas'];
export const SINGLETONS = ['perfil', 'plano', 'config'];

const vazio = () => ({ v: 1, perfil: null, plano: null, config: null, refeicoes: {}, corpo: {}, treinos: {}, agua: {}, favoritos: {}, atividades: {}, marcas: {} });

let estado = vazio();
let ouvintes = new Set();
let ouvintesSync = new Set();
let timer = null;
const temLS = (() => { try { return typeof localStorage !== 'undefined' && !!localStorage; } catch { return false; } })();

export const agora = () => Date.now();
export const novoId = (pref = 'x') => `${pref}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function ler() {
  if (!temLS) return vazio();
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio();
    const obj = JSON.parse(bruto);
    return { ...vazio(), ...obj };
  } catch (e) {
    console.warn('Não foi possível ler os dados locais', e);
    return vazio();
  }
}

function gravarAgora() {
  timer = null;
  if (!temLS) return;
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); }
  catch (e) { console.warn('Falha ao gravar localmente (armazenamento cheio?)', e); emitir({ tipo: 'erro-gravacao' }); }
}
function agendarGravacao() {
  if (timer) return;
  timer = setTimeout(gravarAgora, 150);
}
export function gravarJa() { if (timer) { clearTimeout(timer); } gravarAgora(); }

function emitir(ev) { ouvintes.forEach(f => { try { f(ev); } catch (e) { console.error(e); } }); }
function emitirSync(ev) { ouvintesSync.forEach(f => { try { f(ev); } catch (e) { console.error(e); } }); }

export const store = {
  iniciar() { estado = ler(); return this; },

  /** Assina mudanças de dados. Retorna função para cancelar. */
  assinar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
  /** Usado pela sincronização com a nuvem: recebe cada mudança local */
  assinarSync(fn) { ouvintesSync.add(fn); return () => ouvintesSync.delete(fn); },

  // ---- singletons
  obterUnico(nome) { return estado[nome] || null; },
  salvarUnico(nome, valor, { remoto = false } = {}) {
    const antigo = estado[nome] || {};
    estado[nome] = { ...antigo, ...valor, _u: remoto ? valor._u : agora() };
    agendarGravacao();
    emitir({ tipo: 'unico', nome });
    if (!remoto) emitirSync({ tipo: 'unico', nome, valor: estado[nome] });
    return estado[nome];
  },
  substituirUnico(nome, valor) {
    estado[nome] = { ...valor, _u: agora() };
    agendarGravacao(); emitir({ tipo: 'unico', nome }); emitirSync({ tipo: 'unico', nome, valor: estado[nome] });
    return estado[nome];
  },

  // ---- coleções
  listar(col, filtro) {
    const arr = Object.values(estado[col] || {}).filter(x => !x._d);
    return filtro ? arr.filter(filtro) : arr;
  },
  obter(col, id) { const x = (estado[col] || {})[id]; return x && !x._d ? x : null; },
  salvar(col, item, { remoto = false } = {}) {
    if (!item.id) item = { ...item, id: novoId(col[0]) };
    const novo = { ...item, _u: remoto ? item._u : agora() };
    estado[col][novo.id] = novo;
    agendarGravacao();
    emitir({ tipo: 'item', col, id: novo.id });
    if (!remoto) emitirSync({ tipo: 'item', col, id: novo.id, valor: novo });
    return novo;
  },
  remover(col, id, { remoto = false, u } = {}) {
    const atual = estado[col][id];
    if (!atual && !remoto) return;
    const t = { id, _d: true, _u: remoto ? u : agora() };
    estado[col][id] = t;
    agendarGravacao();
    emitir({ tipo: 'item', col, id });
    if (!remoto) emitirSync({ tipo: 'item', col, id, valor: t });
  },

  /** Instantâneo bruto (inclui tombstones) usado pela sincronização */
  bruto() { return estado; },
  /** Mescla dados da nuvem usando "último que escreveu vence" */
  mesclarRemoto(col, itens) {
    let mudou = false;
    for (const r of itens) {
      const local = estado[col][r.id];
      if (!local || (r._u || 0) > (local._u || 0)) {
        estado[col][r.id] = r; mudou = true;
      }
    }
    if (mudou) { agendarGravacao(); emitir({ tipo: 'item', col, id: null }); }
    return mudou;
  },
  mesclarUnicoRemoto(nome, valor) {
    const local = estado[nome];
    if (!local || (valor._u || 0) > (local._u || 0)) { estado[nome] = valor; agendarGravacao(); emitir({ tipo: 'unico', nome }); return true; }
    return false;
  },

  // ---- backup / LGPD
  exportar() {
    return { app: 'atlas-fitness', versao: 1, exportadoEm: new Date().toISOString(), dados: JSON.parse(JSON.stringify(estado)) };
  },
  /** Importa um backup. modo 'substituir' troca tudo; 'mesclar' usa o mais recente de cada item. */
  importar(obj, modo = 'mesclar') {
    if (!obj || obj.app !== 'atlas-fitness' || !obj.dados) throw new Error('Arquivo de backup inválido.');
    const d = obj.dados;
    if (modo === 'substituir') estado = { ...vazio(), ...d };
    else {
      SINGLETONS.forEach(n => { if (d[n]) this.mesclarUnicoRemoto(n, d[n]); });
      COLECOES.forEach(c => this.mesclarRemoto(c, Object.values(d[c] || {})));
    }
    gravarJa();
    emitir({ tipo: 'tudo' });
    // propaga para a nuvem
    SINGLETONS.forEach(n => estado[n] && emitirSync({ tipo: 'unico', nome: n, valor: estado[n] }));
    COLECOES.forEach(c => Object.values(estado[c]).forEach(v => emitirSync({ tipo: 'item', col: c, id: v.id, valor: v })));
  },
  apagarTudo() {
    estado = vazio();
    if (temLS) { try { localStorage.removeItem(CHAVE); } catch { /* ignora */ } }
    emitir({ tipo: 'tudo' });
  },
  /** Somente para testes */
  _reset() { estado = vazio(); },
};

// atalhos de domínio -------------------------------------------------------
export const getPerfil = () => store.obterUnico('perfil') || {};
export const getConfig = () => store.obterUnico('config') || {};
