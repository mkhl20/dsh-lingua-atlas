import assert from 'node:assert/strict';
import { createProsody } from '../lib/prosody.mjs';

const prosody = createProsody();

const zh = prosody.analyze('床前明月光，疑是地上霜。举头望明月，低头思故乡。', 'zh');
assert.equal(zh.lang, 'zh');
assert.equal(zh.lines.length, 4);
assert.equal(zh.lines[0].pattern, '5言');
assert.equal(zh.lines[0].pause, '二三');
assert.equal(zh.lines[0].pingze.length, 5);
assert.equal(zh.scheme, 'AABA');
assert.ok(zh.rhymes.some((rhyme) => rhyme.letter === 'A' && rhyme.words.includes('光')));
assert.ok(zh.warnings.some((warning) => warning.includes('今音')));

const en = prosody.analyze('When I do count the clock that tells the time', 'en');
assert.equal(en.lang, 'en');
assert.equal(en.lines.length, 1);
assert.equal(en.lines[0].syllables, 10);
assert.ok(en.lines[0].meter.includes('iambic'));

const auto = prosody.analyze('关关雎鸠，在河之洲。');
assert.equal(auto.lang, 'zh');
assert.equal(auto.lines[0].pattern, '4言');
assert.equal(auto.lines[0].pause, '二二');

console.log('ok: prosody zh/en analysis, rhyme and meter');
