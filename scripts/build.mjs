import { readFileSync, writeFileSync } from 'node:fs';
import { LEXICON } from '../data/lexicon.mjs';

const root = new URL('..', import.meta.url);
const template = readFileSync(new URL('client.template.js', root), 'utf8');
const logic = readFileSync(new URL('lib/logic.mjs', root), 'utf8').replace(/^export /gm, '');

const data = JSON.stringify(LEXICON)
  .replace(/[\u2028\u2029]/g, (char) => `\\u${char.charCodeAt(0).toString(16)}`)
  .replace(/</g, '\\u003c');

if (!template.includes('/*__LOGIC__*/') || !template.includes('/*__DATA__*/null')) {
  throw new Error('client template markers are missing');
}

const output = template
  .replace('/*__LOGIC__*/', () => logic)
  .replace('/*__DATA__*/null', () => data);

writeFileSync(new URL('client.js', root), output);
console.log(
  `client.js written: ${(output.length / 1024).toFixed(1)} KiB ` +
    `(data ${(data.length / 1024).toFixed(1)} KiB, logic ${(logic.length / 1024).toFixed(1)} KiB)`,
);
