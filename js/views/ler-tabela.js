// "Ler tabela nutricional por foto": abre a CÂMERA do celular (botão "Tirar foto" = input com capture, e câmera ao vivo com
// enquadramento), ou a galeria; faz o OCR no aparelho e devolve os valores para preencher o formulário "Meu alimento".
// A foto não é enviada a nenhum servidor. Nada é salvo aqui.
import { h, limpar, icone, caixaAviso, folha } from '../ui.js';
import { prepararImagem, lerTextoDaImagem } from '../ocr-tabela.js';
import { interpretarTabela } from '../tabela-nutricional.js';

/** A câmera ao vivo exige contexto seguro (https ou localhost) e a API de mídia */
export const cameraAoVivoDisponivel = () => typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && (typeof isSecureContext === 'undefined' || isSecureContext);

export function mensagemCamera(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'A câmera está bloqueada para este site. Libere o acesso à câmera nas configurações do navegador, ou use o botão "Tirar foto".';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'Este aparelho não tem câmera disponível para o navegador. Use "Escolher da galeria".';
  if (n === 'NotReadableError') return 'A câmera está em uso por outro aplicativo. Feche-o e tente de novo, ou use o botão "Tirar foto".';
  return 'Não consegui abrir a câmera ao vivo. Use o botão "Tirar foto" (abre a câmera do celular) ou "Escolher da galeria".';
}

/**
 * Abre a folha de leitura. Retorna { parsed, foto (Blob JPEG leve), erro? } ou undefined (cancelado).
 * `parsed` vem de interpretarTabela; se o OCR falhar, parsed = null e `erro` explica (o formulário abre vazio com a foto).
 */
export function abrirLerTabela() {
  return folha('Ler tabela nutricional por foto', fechar => {
    let stream = null, leitura = null, ocupado = false;
    const parar = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } };
    const msg = h('div', { 'aria-live': 'polite' });
    const painel = h('div', { class: 'pilha' });   // área que muda: botões, câmera ao vivo ou progresso

    // ---- os dois jeitos de obter a imagem, como inputs de arquivo de verdade
    const inCamera = h('input', { type: 'file', accept: 'image/*', capture: 'environment', id: 'tabela-camera', class: 'so-leitor', tabindex: '-1', 'aria-label': 'Tirar foto da tabela nutricional', onchange: e => escolhido(e) });
    const inGaleria = h('input', { type: 'file', accept: 'image/*', id: 'tabela-galeria', class: 'so-leitor', tabindex: '-1', 'aria-label': 'Escolher foto da tabela da galeria', onchange: e => escolhido(e) });
    function escolhido(e) { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) processar(f); }

    function telaInicial() {
      limpar(painel);
      painel.append(
        h('p', null, 'Fotografe a tabela nutricional da embalagem. O app lê os números e abre o formulário para você conferir antes de salvar.'),
        h('div', { class: 'pilha' },
          h('button', { class: 'btn btn-primario', type: 'button', id: 'btn-tirar-foto', onclick: () => inCamera.click() }, icone('camera', 20), 'Tirar foto'),
          h('button', { class: 'btn', type: 'button', id: 'btn-galeria', onclick: () => inGaleria.click() }, icone('imagem', 20), 'Escolher da galeria'),
          cameraAoVivoDisponivel() ? h('button', { class: 'btn', type: 'button', id: 'btn-ao-vivo', onclick: aoVivo }, icone('camera', 20), 'Câmera ao vivo com guia') : null),
        h('ul', { class: 'ajuda lista-dicas' },
          h('li', null, 'Deixe a tabela reta, bem iluminada e sem reflexo; encha o quadro com ela.'),
          h('li', null, 'A leitura é feita neste aparelho: a foto não é enviada a nenhum servidor.'),
          h('li', null, 'Na primeira leitura o app baixa o leitor de texto (alguns MB), então precisa de internet; depois funciona offline.')),
        h('div', { class: 'linha-botoes' }, h('button', { class: 'btn', type: 'button', onclick: () => { parar(); fechar(undefined); } }, 'Cancelar')));
    }

    // ---- câmera ao vivo (getUserMedia) com enquadramento; cai nos inputs se a permissão for negada
    async function aoVivo() {
      limpar(msg);
      if (!cameraAoVivoDisponivel()) { msg.append(caixaAviso('medio', null, 'A câmera ao vivo só funciona em conexão segura (https). Use o botão "Tirar foto".')); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false });
      } catch (e) { msg.append(caixaAviso('medio', 'Câmera indisponível', mensagemCamera(e))); return; }
      const video = h('video', { class: 'leitor-video', autoplay: true, muted: true, playsinline: true, 'aria-label': 'Imagem da câmera' });
      video.srcObject = stream; video.muted = true; video.play().catch(() => {});
      limpar(painel).append(
        h('div', { class: 'camera-wrap' }, video, h('div', { class: 'camera-guia', 'aria-hidden': 'true' }, h('span', null, 'Enquadre a tabela nutricional'))),
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn', type: 'button', onclick: () => { parar(); telaInicial(); } }, 'Voltar'),
          h('button', { class: 'btn btn-primario', type: 'button', id: 'btn-capturar', onclick: () => capturar(video) }, icone('camera', 20), 'Capturar')));
    }
    function capturar(video) {
      if (!video.videoWidth) { msg.append(caixaAviso('info', null, 'A câmera ainda está abrindo. Tente de novo em um instante.')); return; }
      const c = document.createElement('canvas'); c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0);
      parar();
      c.toBlob(b => processar(b), 'image/jpeg', 0.92);
    }

    // ---- foto -> pré-processa -> OCR -> parse
    async function processar(blob) {
      if (ocupado) return; ocupado = true; limpar(msg);
      const barra = h('progress', { max: 100, value: 0, 'aria-label': 'Progresso da leitura', style: { width: '100%' } });
      const estado = h('p', { role: 'status', 'aria-live': 'polite' }, 'Preparando a imagem…');
      const mini = h('img', { alt: 'Foto da tabela nutricional', class: 'foto-tabela-mini' });
      const cancelar = h('button', { class: 'btn', type: 'button', onclick: () => { if (leitura) leitura.cancelar(); parar(); ocupado = false; telaInicial(); } }, 'Cancelar leitura');
      limpar(painel).append(mini, estado, barra, h('div', { class: 'linha-botoes' }, cancelar));
      let prep;
      try { prep = await prepararImagem(blob); } catch (e) { ocupado = false; limpar(msg).append(caixaAviso('alto', null, 'Não consegui abrir essa imagem. Tente outra foto.')); telaInicial(); return; }
      mini.src = URL.createObjectURL(prep.vista);
      leitura = lerTextoDaImagem(prep.ocr, ({ fracao, texto }) => { estado.textContent = texto; barra.value = Math.round(fracao * 100); });
      try {
        const texto = await leitura.promessa;
        const parsed = interpretarTabela(texto);
        ocupado = false; fechar({ parsed, foto: prep.vista, texto });
      } catch (e) {
        ocupado = false;
        if (e && e.message === 'cancelado') return;
        const offline = e && e.message === 'offline';
        fechar({ parsed: null, foto: prep.vista, erro: offline
          ? 'Não consegui baixar o leitor de texto (a primeira leitura precisa de internet). A foto está acima para você digitar os valores.'
          : 'Não consegui ler os números da foto. A foto está acima para você digitar os valores.' });
      }
    }

    telaInicial();
    const corpo = h('div', { class: 'pilha' }, msg, painel, inCamera, inGaleria);
    setTimeout(() => { const dlg = corpo.closest('dialog'); if (dlg) dlg.addEventListener('close', () => { parar(); if (leitura) leitura.cancelar(); }); }, 0);
    return corpo;
  }, { larga: false });
}
