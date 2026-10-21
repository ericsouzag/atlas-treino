// Leitor mínimo de planilhas .xls (BIFF8 dentro de OLE2), sem dependências. Só lê: nunca executa nada do arquivo.
// Uso como biblioteca:  import { lerXls } from './ler-xls.mjs';  const abas = lerXls(buffer);  // { nomeDaAba: [[celula,...],...] }
// Uso na linha de comando: node tools/ler-xls.mjs arquivo.xls [saida.json]   (lista as abas e a quantidade de linhas)
import fs from 'node:fs';

function ole(buf) {
  if (buf.readUInt32LE(0) !== 0xe011cfd0) throw new Error('não é um arquivo OLE2 (.xls antigo)');
  const ss = 1 << buf.readUInt16LE(30), mss = 1 << buf.readUInt16LE(32);
  const nFat = buf.readUInt32LE(44), dirIni = buf.readUInt32LE(48), miniCorte = buf.readUInt32LE(56);
  const miniIni = buf.readUInt32LE(60), difIni = buf.readUInt32LE(68), nDif = buf.readUInt32LE(72);
  const setor = i => buf.subarray((i + 1) * ss, (i + 2) * ss);
  const fatIds = [];
  for (let i = 0; i < 109; i++) { const v = buf.readUInt32LE(76 + 4 * i); if (v < 0xfffffffa) fatIds.push(v); }
  let dif = difIni;
  for (let n = 0; n < nDif && dif < 0xfffffffa; n++) {
    const s = setor(dif);
    for (let i = 0; i < ss / 4 - 1; i++) { const v = s.readUInt32LE(4 * i); if (v < 0xfffffffa) fatIds.push(v); }
    dif = s.readUInt32LE(ss - 4);
  }
  const fat = [];
  for (const id of fatIds.slice(0, nFat)) { const s = setor(id); for (let i = 0; i < ss / 4; i++) fat.push(s.readUInt32LE(4 * i)); }
  const cadeia = (ini, tab) => { const out = []; let c = ini; while (c < 0xfffffffa && out.length < 1e6) { out.push(c); c = tab[c]; } return out; };
  const ler = ini => Buffer.concat(cadeia(ini, fat).map(setor));
  const dir = ler(dirIni);
  const ent = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nl = dir.readUInt16LE(o + 64);
    ent.push({ nome: dir.toString('utf16le', o, o + Math.max(0, nl - 2)), tipo: dir[o + 66], ini: dir.readUInt32LE(o + 116), tam: dir.readUInt32LE(o + 120) });
  }
  const raiz = ent[0];
  const e = ent.find(x => x.tipo === 2 && /^(Workbook|Book)$/.test(x.nome));
  if (!e) throw new Error('fluxo Workbook não encontrado');
  if (e.tam >= miniCorte) return ler(e.ini).subarray(0, e.tam);
  const mini = ler(raiz.ini);
  const miniFat = []; for (const s of cadeia(miniIni, fat)) { const b = setor(s); for (let i = 0; i < ss / 4; i++) miniFat.push(b.readUInt32LE(4 * i)); }
  return Buffer.concat(cadeia(e.ini, miniFat).map(i => mini.subarray(i * mss, (i + 1) * mss))).subarray(0, e.tam);
}

function rk(v) {
  let n;
  if (v & 2) n = v >> 2; else { const b = Buffer.alloc(8); b.writeUInt32LE((v & 0xfffffffc) >>> 0, 4); n = b.readDoubleLE(0); }
  return v & 1 ? n / 100 : n;
}

export function lerXls(arquivo) {
  const wb = ole(arquivo);
  // junta registros (CONTINUE do SST tratado à parte)
  const regs = [];
  for (let o = 0; o + 4 <= wb.length;) { const t = wb.readUInt16LE(o), n = wb.readUInt16LE(o + 2); regs.push({ t, d: wb.subarray(o + 4, o + 4 + n), o }); o += 4 + n; }
  // tabela de strings compartilhadas
  const sst = [];
  const iSst = regs.findIndex(r => r.t === 0xfc);
  if (iSst >= 0) {
    const partes = [regs[iSst].d];
    for (let i = iSst + 1; regs[i] && regs[i].t === 0x3c; i++) partes.push(regs[i].d);
    let seg = 0, pos = 8; let d = partes[0];
    const total = d.readUInt32LE(4);
    const proxSeg = () => { seg++; d = partes[seg]; pos = 0; };
    for (let k = 0; k < total && d; k++) {
      if (pos >= d.length) proxSeg();
      if (!d) break;
      let cch = d.readUInt16LE(pos); const fl = d[pos + 2]; pos += 3;
      let rt = 0, ext = 0;
      if (fl & 8) { rt = d.readUInt16LE(pos); pos += 2; }
      if (fl & 4) { ext = d.readUInt32LE(pos); pos += 4; }
      let alta = !!(fl & 1), s = '';
      while (cch > 0) {
        if (pos >= d.length) { proxSeg(); if (!d) break; alta = !!(d[pos] & 1); pos++; }
        if (alta && d.length - pos === 1) { // caractere de 2 bytes partido entre registros
          const lo = d[pos]; proxSeg(); if (!d) break; alta = !!(d[pos] & 1); pos++;
          s += String.fromCharCode(lo | (d[pos] << 8)); pos++; cch--; continue;
        }
        const disp = d.length - pos, bytes = alta ? 2 : 1, cab = Math.min(cch, Math.floor(disp / bytes));
        s += alta ? d.toString('utf16le', pos, pos + cab * 2) : d.toString('latin1', pos, pos + cab);
        pos += cab * bytes; cch -= cab;
      }
      pos += rt * 4 + ext;
      sst.push(s);
    }
  }
  // abas
  const abas = [];
  for (const r of regs) if (r.t === 0x85) {
    const ini = r.d.readUInt32LE(0), cch = r.d[6], alta = r.d[7] & 1;
    abas.push({ ini, nome: alta ? r.d.toString('utf16le', 8, 8 + cch * 2) : r.d.toString('latin1', 8, 8 + cch) });
  }
  const out = {};
  for (const ab of abas) {
    const linhas = [];
    const set = (r, c, v) => { (linhas[r] ||= [])[c] = v; };
    let i = regs.findIndex(r => r.o === ab.ini), ultimaFormula = null;
    for (; i >= 0 && i < regs.length; i++) {
      const { t, d } = regs[i];
      if (t === 0x0a && i > 0 && regs[i].o > ab.ini) break; // EOF
      if (t === 0xfd) set(d.readUInt16LE(0), d.readUInt16LE(2), sst[d.readUInt32LE(6)] ?? '');
      else if (t === 0x203) set(d.readUInt16LE(0), d.readUInt16LE(2), d.readDoubleLE(6));
      else if (t === 0x27e) set(d.readUInt16LE(0), d.readUInt16LE(2), rk(d.readUInt32LE(6)));
      else if (t === 0xbd) {
        const r0 = d.readUInt16LE(0), c0 = d.readUInt16LE(2), c1 = d.readUInt16LE(d.length - 2);
        for (let c = c0; c <= c1; c++) set(r0, c, rk(d.readUInt32LE(4 + (c - c0) * 6 + 2)));
      } else if (t === 0x204) { const cch = d.readUInt16LE(6); set(d.readUInt16LE(0), d.readUInt16LE(2), d[8] & 1 ? d.toString('utf16le', 9, 9 + cch * 2) : d.toString('latin1', 9, 9 + cch)); }
      else if (t === 0x06) {
        const r0 = d.readUInt16LE(0), c0 = d.readUInt16LE(2);
        if (d[12] === 0xff && d[13] === 0xff) ultimaFormula = [r0, c0]; // resultado texto vem no STRING seguinte
        else { set(r0, c0, d.readDoubleLE(6)); ultimaFormula = null; }
      } else if (t === 0x207 && ultimaFormula) {
        const cch = d.readUInt16LE(0); set(ultimaFormula[0], ultimaFormula[1], d[2] & 1 ? d.toString('utf16le', 3, 3 + cch * 2) : d.toString('latin1', 3, 3 + cch)); ultimaFormula = null;
      }
    }
    for (let k = 0; k < linhas.length; k++) linhas[k] ||= [];
    out[ab.nome] = linhas;
  }
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const [arq, saida] = process.argv.slice(2);
  if (!arq) { console.log('uso: node tools/ler-xls.mjs arquivo.xls [saida.json]'); process.exit(1); }
  const abas = lerXls(fs.readFileSync(arq));
  for (const [n, l] of Object.entries(abas)) console.log(`${n}: ${l.length} linhas`);
  if (saida) fs.writeFileSync(saida, JSON.stringify(abas));
}
