import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCorpusStore } from '../lib/corpus-store.mjs';

const directory = fileURLToPath(new URL('../data/corpus/', import.meta.url));
const store = createCorpusStore(directory);
const stats = store.stats();

assert.equal(stats.count, 1168);
assert.equal(stats.languages.zh, 1016);
assert.equal(stats.languages.en, 152);
assert.equal(stats.facets.collection.length, 5);
assert(stats.facets.form.some((item) => item.name === '四言诗' && item.count === 280));
assert(stats.facets.themes.some((item) => item.name === '爱情'));

const tang = store.search({ facets: { collection: '唐诗三百首', form: '五言律诗' }, limit: 5 });
assert.equal(tang.total, 83);
assert(tang.results.every((item) => item.facets.collection === '唐诗三百首'));
assert(tang.results.every((item) => item.facets.form === '五言律诗'));

const shijingMoon = store.search({ query: '月', facets: { collection: '诗经' }, limit: 3 });
assert.equal(shijingMoon.total, 26);
assert(shijingMoon.results.every((item) => item.facets.collection === '诗经'));

const sonnets = store.search({ facets: { collection: '莎士比亚十四行诗', themes: '爱情' }, limit: 3 });
assert.equal(sonnets.total, 152);
assert(sonnets.results.every((item) => item.lang === 'en'));

console.log('ok: corpus taxonomy, facet counts, and combined search');
