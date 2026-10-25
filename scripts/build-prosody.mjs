import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'data/dict/zh.jsonl');
const target = path.join(root, 'data/dict/prosody.zh.json');

function isHan(ch) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(ch);
}

const chars = {};
const lines = fs.readFileSync(source, 'utf8').split('\n');
for (const line of lines) {
  if (!line) continue;
  let entry;
  try { entry = JSON.parse(line); } catch { continue; }
  if (!entry.w || [...entry.w].length !== 1 || !isHan(entry.w)) continue;
  const readings = (entry.r || [])
    .flatMap((reading) => String(reading.p || '').split(' '))
    .filter((reading) => reading && !reading.includes(' '));
  if (!readings.length) continue;
  const keys = [entry.w, ...(entry.t || [])];
  for (const key of keys) {
    if (!key || !isHan(key)) continue;
    if (!chars[key]) chars[key] = [];
    for (const reading of readings) {
      if (!chars[key].includes(reading)) chars[key].push(reading);
    }
  }
}

const sorted = {};
for (const key of Object.keys(chars).sort()) sorted[key] = chars[key];

fs.writeFileSync(target, JSON.stringify({
  version: 1,
  source: 'CC-CEDICT / build-dict.mjs',
  note: '单字今音；一字多音时保留常见读音，分析时取第一条。入声已并入普通话，古音另考。',
  chars: sorted,
}), 'utf8');

console.log(`prosody chars: ${Object.keys(sorted).length} -> ${target}`);
