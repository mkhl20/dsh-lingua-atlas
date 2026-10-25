import assert from 'node:assert/strict';
import { LEXICON } from '../data/lexicon.mjs';
import {
  buildConstellation,
  conceptById,
  familyCards,
  familyMembers,
  fieldById,
  groupOrigins,
  languageIndex,
  localizedGloss,
  normalize,
  originIndex,
  relationsOf,
  routeIndex,
  sameField,
  searchConcepts,
  stats,
  visibleEntries,
  visibleLanguages,
} from '../lib/logic.mjs';

const data = LEXICON;
const langs = languageIndex(data);
const concepts = new Map(data.concepts.map((concept) => [concept.id, concept]));
const origins = originIndex(data);
const fields = new Set(data.fields.map((field) => field.id));

const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
};

// --- Structure -------------------------------------------------------------
check(data.concepts.length === 33, `expected 33 concepts, found ${data.concepts.length}`);
check(visibleLanguages(data).length === 14, `expected 14 visible languages, found ${visibleLanguages(data).length}`);
check(new Set(data.concepts.map((c) => c.id)).size === data.concepts.length, 'duplicate concept ids');
check(new Set(data.origins.map((o) => o.id)).size === data.origins.length, 'duplicate origin ids');
check(new Set(data.languages.map((l) => l.id)).size === data.languages.length, 'duplicate language ids');

for (const field of data.fields) {
  check(!!field.label && !!field.labelEn, `field ${field.id} missing a label`);
}

for (const concept of data.concepts) {
  const where = `concept ${concept.id}`;
  check(!!concept.title && !!concept.title.zh && !!concept.title.en, `${where}: title missing`);
  check(!!concept.gloss && !!concept.gloss.zh && !!concept.gloss.en, `${where}: gloss missing`);
  check(fields.has(concept.field), `${where}: unknown field ${concept.field}`);
  check(concept.entries.length >= 8, `${where}: only ${concept.entries.length} entries`);
  check(
    concept.entries.some((entry) => entry.lang === 'zh') && concept.entries.some((entry) => entry.lang === 'en'),
    `${where}: needs zh and en entries`,
  );
  const seen = new Set();
  for (const entry of concept.entries) {
    const at = `${where}/${entry.lang}`;
    check(!!langs[entry.lang], `${at}: unknown language`);
    check(!langs[entry.lang]?.hidden, `${at}: hidden language used as an entry`);
    check(!seen.has(entry.lang), `${at}: duplicate language entry`);
    seen.add(entry.lang);
    check(!!entry.word, `${at}: empty word`);
    check(!!entry.gloss && !!entry.glossEn, `${at}: missing bilingual gloss`);
    if (entry.lang !== 'en' && entry.lang !== 'fr' && entry.lang !== 'de' && entry.lang !== 'es' && entry.lang !== 'la') {
      check(!!entry.roman, `${at}: missing romanization`);
    }
    if (entry.origin) {
      check(!!origins[entry.origin], `${at}: unknown origin ${entry.origin}`);
    }
    if (entry.note !== undefined) check(typeof entry.note === 'string' && entry.note.length > 0, `${at}: empty note`);
  }
  for (const relation of concept.relations || []) {
    check(['synonym', 'antonym', 'hypernym', 'hyponym', 'related'].includes(relation.type), `${where}: bad relation type`);
    check(concepts.has(relation.target), `${where}: relation target ${relation.target} missing`);
    check(relation.target !== concept.id, `${where}: self relation`);
  }
  for (const routeId of concept.routes || []) {
    check(!!routeIndex(data)[routeId], `${where}: unknown route ${routeId}`);
  }
}

for (const origin of data.origins) {
  check(!!origin.label && !!origin.labelEn, `origin ${origin.id}: missing label`);
  check(['inherited', 'loan'].includes(origin.kind), `origin ${origin.id}: bad kind`);
  check(!!origin.note, `origin ${origin.id}: missing note`);
  check(familyMembers(data, origin.id).length >= 2, `origin ${origin.id}: fewer than 2 members`);
}

for (const route of data.routes) {
  check(!!route.title.zh && !!route.title.en, `route ${route.id}: title missing`);
  check(!!route.intro.zh && !!route.intro.en, `route ${route.id}: intro missing`);
  check(route.branches.length >= 1, `route ${route.id}: no branches`);
  for (const branch of route.branches) {
    check(branch.steps.length >= 2, `route ${route.id}: branch too short`);
    for (const step of branch.steps) {
      check(!!langs[step.lang], `route ${route.id}: unknown step language ${step.lang}`);
      check(!!step.word, `route ${route.id}: step without a word`);
      if (step.note) check(!!step.note.zh && !!step.note.en, `route ${route.id}: step note not bilingual`);
    }
  }
}

// --- Search ----------------------------------------------------------------
const top = (query, options) => searchConcepts(data, query, options)[0];

assert.equal(top('water')?.id, 'water', 'search: water');
assert.equal(top('Wasser')?.id, 'water', 'search: Wasser');
assert.equal(top('水')?.id, 'water', 'search: 水');
assert.equal(top('shui')?.id, 'water', 'search: shui (tone stripping)');
assert.equal(top('月亮')?.id, 'moon', 'search: 月亮');
assert.equal(top('moon')?.id, 'moon', 'search: moon');
assert.equal(top('茶')?.id, 'tea', 'search: 茶');
assert.equal(top('чай')?.id, 'tea', 'search: чай');
assert.equal(top('sukkar')?.id, 'sugar', 'search: sukkar');
assert.equal(top('心')?.id, 'heart', 'search: 心');
assert.equal(top('kokoro')?.id, 'heart', 'search: kokoro');
assert.equal(top('word')?.id, 'word', 'search: word');
assert.equal(top('language')?.id, 'language', 'search: language');
assert.equal(top('zzzz'), undefined, 'search: no false positives');
assert.deepEqual(searchConcepts(data, '', { field: 'body' }).map((c) => c.id), ['eye', 'hand', 'heart'], 'field filter');
assert.deepEqual(
  searchConcepts(data, '', { langs: ['he'] }).map((c) => c.id),
  ['water', 'sun', 'wind', 'dog', 'eye', 'hand', 'heart', 'mother', 'father', 'night', 'year', 'name', 'tea', 'gold', 'king'],
  'language filter',
);
assert.equal(visibleEntries(conceptById(data, 'mother'), ['zh', 'en']).length, 2, 'entry filter');
assert.equal(groupOrigins(conceptById(data, 'mother'))[0].id, 'pie-mater', 'largest cognate group');
assert.equal(groupOrigins(conceptById(data, 'mother'))[0].entries.length, 9, 'cognate group size');
assert.equal(relationsOf(data, conceptById(data, 'water')).length, 2, 'relations resolved');
assert.equal(relationsOf(data, conceptById(data, 'water'))[0].concept.id, 'rain', 'relation target shape');
assert.equal(sameField(data, conceptById(data, 'water')).length, 6, 'same field size');
assert.equal(familyCards(data).length, 63, 'family cards');
assert.equal(stats(data).concepts, 33, 'stats concepts');
assert.equal(stats(data).languages, 14, 'stats languages');
assert.equal(stats(data).routes, 3, 'stats routes');
assert.equal(localizedGloss(conceptById(data, 'water').entries[0], 'en'), 'water; a body of water', 'en gloss pick');
assert.equal(normalize('  Shànghǎi  '), 'shanghai', 'normalize');
assert.equal(fieldById(data, 'body').labelEn, 'Body', 'field lookup');

const water = conceptById(data, 'water');
const graph = buildConstellation(water.entries, groupOrigins(water));
assert.equal(graph.nodes.length, water.entries.length, 'constellation node per entry');
assert(graph.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)), 'constellation coordinates');
assert(graph.nodes.every((node) => node.labelX >= 0 && node.labelX <= 720), 'constellation labels in view');
assert(graph.nodes.every((node) => ['start', 'middle', 'end'].includes(node.anchor)), 'constellation anchors');
assert(graph.edges.length >= 1, 'constellation edges');
assert(graph.edges.every((edge) => edge.d.indexOf('NaN') < 0), 'constellation path data');
assert.equal(graph.edges.length, 4 - 1 + 3 - 1 + 2 - 1, 'edge count follows group sizes');

// --- Report ----------------------------------------------------------------
if (problems.length) {
  console.error(`FAIL: ${problems.length} data problem(s)`);
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}

console.log(
  `ok: ${data.concepts.length} concepts, ${visibleLanguages(data).length} languages, ` +
    `${stats(data).entries} entries, ${familyCards(data).length} families, ${data.routes.length} routes`,
);
console.log('search, filtering, cognate grouping, relations, and routes all pass');
