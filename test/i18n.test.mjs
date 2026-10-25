import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../client.template.js', import.meta.url), 'utf8');
const start = source.indexOf('const DICT = {');
const end = source.indexOf('\n    };', start);
assert(start > 0 && end > start, 'DICT literal not found in the template');

const literal = source.slice(source.indexOf('{', start), end + 6);
const DICT = new Function(`return (${literal});`)();

const zhKeys = Object.keys(DICT.zh);
const enKeys = Object.keys(DICT.en);
assert.deepEqual(zhKeys.sort(), enKeys.sort(), 'zh/en dictionaries must declare the same keys');
for (const [locale, dict] of Object.entries(DICT)) {
  for (const [key, value] of Object.entries(dict)) {
    assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
    assert(value.length > 0, `${locale}.${key} must not be empty`);
    assert(!/[<>]/.test(value), `${locale}.${key} must be plain text`);
  }
}

const used = new Set([
  'tabGloss', 'tabOrigin', 'tabNetwork',
  'tabDict', 'tabCorpus', 'tabProsody', 'tabAtlas', 'tabAbout',
  'directionAuto', 'directionZh', 'directionEn',
  'corpusFacets', 'corpusClearFacets',
  'facetCollection', 'facetEra', 'facetGenre', 'facetForm',
  'facetMood', 'facetImage', 'facetSeason', 'facetTheme',
]);
for (const match of source.matchAll(/\bt\('([A-Za-z]+)'\)/g)) used.add(match[1]);

const missingZh = [...used].filter((key) => !(key in DICT.zh));
const missingEn = [...used].filter((key) => !(key in DICT.en));
assert.deepEqual(missingZh, [], 'keys missing from the zh dictionary');
assert.deepEqual(missingEn, [], 'keys missing from the en dictionary');

const unused = zhKeys.filter((key) => !used.has(key));
assert.deepEqual(unused, [], `unused dictionary keys: ${unused.join(', ')}`);

console.log(`ok: ${zhKeys.length} locale keys used and present in zh + en`);
