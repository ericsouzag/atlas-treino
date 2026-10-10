import fs from 'node:fs';
import path from 'node:path';
import { teste, igual, ok, fim } from './_t.mjs';
import { EXERCICIOS } from '../js/exercises.js';
import { ILUSTRACOES } from '../js/ilustracoes-dados.js';

const dir = path.resolve(import.meta.dirname, '../img/ex');
console.log('Ilustrações');
teste('todo exercício do banco tem foto mapeada', () => { for (const e of EXERCICIOS) ok(ILUSTRACOES[e.id] && ILUSTRACOES[e.id].length >= 1, 'sem foto: ' + e.id); });
teste('todo arquivo de foto existe em disco e não está vazio', () => { for (const [id, arqs] of Object.entries(ILUSTRACOES)) for (const a of arqs) { const f = path.join(dir, a); ok(fs.existsSync(f) && fs.statSync(f).size > 2000, `${id}: ${a}`); } });
teste('nenhum id de ilustração sobrando fora do banco', () => { const ids = new Set(EXERCICIOS.map(e => e.id)); for (const id of Object.keys(ILUSTRACOES)) ok(ids.has(id), 'sobrando: ' + id); });
teste('nenhum arquivo órfão em img/ex', () => { const usados = new Set(Object.values(ILUSTRACOES).flat()); for (const f of fs.readdirSync(dir)) ok(usados.has(f), 'órfão: ' + f); });
teste('peso total das fotos razoável (< 10 MB)', () => { const t = fs.readdirSync(dir).reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0); ok(t < 10e6, String(t)); });
fim();
