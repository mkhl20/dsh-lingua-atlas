import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const dataDir = path.join(root, 'data', 'dict');
const corpusFile = path.join(root, 'data', 'corpus', 'corpus.jsonl');

const HAN = /[\u3400-\u9fff]/;
const STOP_EN = new Set(('a an the and or but if then than so because as of at by for from in into is are was were be been being ' +
  'to on with without within about over under between among through during before after above below up down out off ' +
  'this that these those it its they them their he she his her you your we our i me my not no nor only also just ' +
  'can could may might must shall should will would do does did done have has had having more most much many few ' +
  'such same other another each every both either neither one two three first second new old good bad very ' +
  'which who whom whose what when where why how there here').split(/\s+/));
const STOP_ZH = new Set(Array.from('的了是在和与及或而就其这那有为以于之等个种些把被对从到中上下里外也都很更最不没一有和同如'));

function stem(word) {
  let value = String(word || '').toLowerCase();
  if (value.length > 5 && value.endsWith('ies')) value = `${value.slice(0, -3)}y`;
  else if (value.length > 5 && value.endsWith('ing')) value = value.slice(0, -3);
  else if (value.length > 4 && value.endsWith('ed')) value = value.slice(0, -2);
  else if (value.length > 4 && value.endsWith('es')) value = value.slice(0, -2);
  else if (value.length > 4 && value.endsWith('s')) value = value.slice(0, -1);
  if (value.length > 4 && value.endsWith('e')) value = value.slice(0, -1);
  return value;
}

function latinTokens(text) {
  const result = [];
  for (const match of String(text || '').toLowerCase().matchAll(/[a-z][a-z'-]+/g)) {
    const raw = match[0].replace(/^['-]+|['-]+$/g, '');
    if (raw.length < 3) continue;
    const value = stem(raw);
    if (value.length < 3 || STOP_EN.has(value) || STOP_EN.has(raw)) continue;
    result.push(value);
  }
  return [...new Set(result)];
}

function zhTokens(entry, enDefs) {
  const tokens = new Set();
  const text = (entry.cn || []).join(' ');
  for (const segment of text.match(/[\u3400-\u9fff]+/g) || []) {
    for (let i = 0; i < segment.length; i += 1) {
      const ch = segment[i];
      if (!STOP_ZH.has(ch)) tokens.add(ch);
      if (i + 1 < segment.length) {
        const bigram = segment.slice(i, i + 2);
        if (![...bigram].some((c) => STOP_ZH.has(c))) tokens.add(bigram);
      }
      if (i + 2 < segment.length) {
        const trigram = segment.slice(i, i + 3);
        if (![...trigram].some((c) => STOP_ZH.has(c))) tokens.add(trigram);
      }
    }
  }
  for (const reading of entry.r || []) {
    for (const gloss of reading.d || []) {
      for (const word of latinTokens(gloss)) {
        tokens.add(`e:${word}`);
        const defs = enDefs.get(word);
        if (defs) for (const def of defs.slice(0, 10)) tokens.add(`e:${def}`);
      }
    }
  }
  return [...tokens].slice(0, 96);
}

function enTokens(entry) {
  const text = (entry.d || []).join(' ');
  return latinTokens(text).slice(0, 80);
}

function eachLine(file, callback) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(file, 'utf8'), crlfDelay: Infinity });
    let index = 0;
    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        callback(JSON.parse(line), index);
        index += 1;
      } catch (error) {
        rl.close();
        reject(error);
      }
    });
    rl.on('close', resolve);
    rl.on('error', reject);
  });
}

function readFrequencies() {
  const counts = new Map();
  if (!fs.existsSync(corpusFile)) return counts;
  const text = fs.readFileSync(corpusFile, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line).text || ''; } catch { return ''; }
    })
    .join('\n');
  let segmenter;
  try {
    segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
  } catch {
    return counts;
  }
  for (const part of segmenter.segment(text)) {
    if (!part.isWordLike || !HAN.test(part.segment)) continue;
    counts.set(part.segment, (counts.get(part.segment) || 0) + 1);
  }
  return counts;
}

function freqScore(value, max) {
  if (!value) return 0;
  return Math.min(1, Math.log1p(value) / Math.log1p(max || 1));
}

function formScore(word, other) {
  if (!word || !other) return 0;
  if (word[0] === other[0]) return 0.8;
  let size = 0;
  while (size < word.length && size < other.length && word[size] === other[size]) size += 1;
  return size >= 3 ? 0.5 : 0;
}

function loadRadicals() {
  const result = new Map();
  const file = path.join(root, 'data', 'raw', 'unihan', 'Unihan_IRGSources.txt');
  if (!fs.existsSync(file)) return result;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.includes('\tkRSUnicode\t')) continue;
    const [code, , value] = line.split('\t');
    const radical = Number.parseInt(value, 10);
    if (!code.startsWith('U+') || !Number.isFinite(radical)) continue;
    result.set(String.fromCodePoint(Number.parseInt(code.slice(2), 16)), radical);
  }
  return result;
}

// These radicals carry a usable semantic field on their own. Others (爪, 月, 王 ...)
// are too ambiguous to present as a "same kind" group.
const SEMANTIC_RADICALS = new Set([9, 30, 32, 38, 46, 61, 64, 72, 75, 85, 86, 93, 94, 109, 112, 118, 120, 128, 140, 142, 145, 149, 157, 167, 173, 184, 187, 195, 196]);

function buildIndex(direction, entries, options) {
  const df = new Map();
  const words = [];
  const radicals = [];
  const ranks = [];
  const qualities = [];
  const defs = [];
  const texts = [];
  const tokenize = options.tokenize;
  return eachLine(entries.file, (entry, id) => {
    words.push(entry.w);
    radicals.push(options.radicals.get(entry.w[0]) || 0);
    ranks.push(Number(entry.fr) || Number(entry.bnc) || 100000);
    qualities.push(Number(entry.co) > 0 || Number(entry.ox) > 0);
    defs.push((entry.d || []).join(' ').toLowerCase());
    texts.push((entry.cn || []).join(' '));
    const tokens = tokenize(entry);
    for (const token of tokens) df.set(token, (df.get(token) || 0) + 1);
  }).then(() => ({ df, words, radicals, ranks, qualities, defs, texts }));
}

async function buildDirection(direction, options) {
  const entries = {
    file: path.join(dataDir, `${direction}.jsonl`),
    index: path.join(dataDir, `${direction}.index.json`),
  };
  if (!fs.existsSync(entries.file)) throw new Error(`missing ${entries.file}`);

  const enDefs = new Map();
  if (direction === 'zh') {
    await eachLine(path.join(dataDir, 'en.jsonl'), (entry) => {
      enDefs.set(entry.w.toLowerCase(), enTokens(entry).slice(0, 18));
    });
  }
  const tokenize = direction === 'zh'
    ? (entry) => zhTokens(entry, enDefs)
    : (entry) => enTokens(entry);

  const radicals = loadRadicals();
  const { df, words, radicals: wordRadicals, ranks, qualities, defs, texts } = await buildIndex(direction, entries, { tokenize, radicals });
  const count = words.length;
  const maxDf = direction === 'zh' ? 1400 : 700;
  const idf = (token) => Math.min(7, Math.log((count + 1) / ((df.get(token) || 1) + 1)) + 1);
  const usable = (token) => {
    const value = df.get(token) || 0;
    return value >= 2 && value <= maxDf;
  };

  const postings = new Map();
  const norms = new Float32Array(count);
  await eachLine(entries.file, (entry, id) => {
    const tokens = tokenize(entry);
    let norm = 0;
    for (const token of tokens) {
      if (!usable(token)) continue;
      const weight = idf(token);
      norm += weight * weight;
      let bucket = postings.get(token);
      if (!bucket) {
        bucket = [];
        postings.set(token, bucket);
      }
      if (bucket.length < maxDf) bucket.push(id);
    }
    norms[id] = Math.sqrt(norm) || 1;
  });

  const freqZh = direction === 'zh' ? readFrequencies() : null;
  const radicalGroups = new Map();
  if (direction === 'zh') {
    for (let id = 0; id < count; id += 1) {
      const radical = wordRadicals[id];
      if (!SEMANTIC_RADICALS.has(radical)) continue;
      let group = radicalGroups.get(radical);
      if (!group) {
        group = [];
        radicalGroups.set(radical, group);
      }
      group.push(id);
    }
    for (const group of radicalGroups.values()) {
      group.sort((a, b) => (freqZh.get(words[b]) || 0) - (freqZh.get(words[a]) || 0) || words[a].length - words[b].length || words[a].localeCompare(words[b]));
    }
  }
  const result = {};
  let done = 0;

  await eachLine(entries.file, (entry, id) => {
    const tokens = tokenize(entry).filter(usable).sort((a, b) => (df.get(a) || 1) - (df.get(b) || 1));
    const candidates = new Map();
    for (const token of tokens.slice(0, 12)) {
      const bucket = postings.get(token);
      if (!bucket) continue;
      const weight = idf(token);
      for (const other of bucket) {
        if (other === id || other === undefined) continue;
        let record = candidates.get(other);
        if (!record) {
          record = [0, 0];
          candidates.set(other, record);
        }
        record[0] += weight * weight;
        record[1] += 1;
      }
    }

    const scored = [];
    const entryDef = (entry.d || []).join(' ').toLowerCase();
    const entryText = (entry.cn || []).join(' ');
    const entryWord = String(entry.w || '');
    for (const [other, record] of candidates) {
      const otherWord = words[other];
      if (!otherWord || otherWord === entry.w) continue;
      const cosine = record[0] / (norms[id] * norms[other]);
      if (cosine < 0.06) continue;
      const rank = ranks[other] || 100000;
      const quality = direction === 'zh' ? true : (rank <= 15000 || qualities[other]);
      if (direction === 'en' && !quality) continue;
      let frequency = 0;
      if (direction === 'zh') {
        frequency = freqScore(freqZh.get(otherWord) || 0, 120);
      } else {
        frequency = Math.max(0, 1 - Math.log1p(rank) / Math.log1p(100000));
      }
      const lower = otherWord.toLowerCase();
      const mentions = direction === 'en'
        ? entryDef.includes(lower) || (defs[other] || '').includes(entryWord.toLowerCase())
        : entryText.includes(otherWord) || (texts[other] || '').includes(entryWord);
      const score = cosine * 0.78 + frequency * 0.17 + Math.min(0.05, record[1] * 0.01);
      scored.push({ w: otherWord, cosine, score, frequency, shared: record[1], mentions });
    }

    scored.sort((a, b) => b.score - a.score || b.cosine - a.cosine || a.w.length - b.w.length);
    const near = [];
    const same = [];
    const radical = [];
    const used = new Set([entry.w]);
    for (const item of scored) {
      if (near.length >= 8) break;
      const close = item.mentions && item.cosine >= (direction === 'zh' ? 0.10 : 0.07) && item.frequency >= 0.02;
      if (close) {
        near.push(item.w);
        used.add(item.w);
      }
    }

    if (direction === 'zh' && radicalGroups.has(wordRadicals[id])) {
      const pool = radicalGroups.get(wordRadicals[id]);
      const mentioned = [];
      for (const other of pool.slice(0, 80)) {
        const otherWord = words[other];
        if (!otherWord || used.has(otherWord)) continue;
        if (otherWord.length > 4) continue;
        if (!(freqZh.get(otherWord) || 0)) continue;
        const inText = (entry.cn || []).some((line) => line.includes(otherWord));
        mentioned.push({ w: otherWord, inText });
      }
      mentioned.sort((a, b) => Number(b.inText) - Number(a.inText) || (freqZh.get(b.w) || 0) - (freqZh.get(a.w) || 0) || a.w.length - b.w.length);
      for (const item of mentioned) {
        if (radical.length >= 8) break;
        radical.push(item.w);
        used.add(item.w);
      }
    }

    for (const item of scored) {
      if (same.length >= 8) break;
      if (used.has(item.w)) continue;
      if (item.mentions && item.cosine >= 0.10) {
        same.push(item.w);
        used.add(item.w);
      }
    }

    const form = [];
    const prefix = direction === 'en' ? entry.w.toLowerCase().slice(0, 4) : entry.w.slice(0, 1);
    if (prefix) {
      const group = [];
      for (const other of words) {
        if (other === entry.w) continue;
        if (direction === 'en' ? other.toLowerCase().startsWith(prefix) : other.startsWith(prefix)) group.push(other);
      }
      group.sort((a, b) => {
        const fa = direction === 'zh' ? (freqZh.get(a) || 0) : 1;
        const fb = direction === 'zh' ? (freqZh.get(b) || 0) : 1;
        return fb - fa || a.length - b.length || a.localeCompare(b);
      });
      for (const other of group) {
        if (form.length >= 8) break;
        if (used.has(other)) continue;
        if (formScore(entry.w, other) < 0.5) continue;
        form.push(other);
        used.add(other);
      }
    }

    result[entry.w] = { near, same, radical, form };
    done += 1;
    if (done % 20000 === 0) process.stderr.write(`  ${direction} ${done}/${count}\n`);
  });

  return result;
}

async function main() {
  const zh = await buildDirection('zh', {});
  const en = await buildDirection('en', {});
  fs.writeFileSync(path.join(dataDir, 'related.zh.json'), JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), words: zh }));
  fs.writeFileSync(path.join(dataDir, 'related.en.json'), JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), words: en }));
  const manifestFile = path.join(dataDir, 'manifest.json');
  if (fs.existsSync(manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    manifest.related = { zh: 'related.zh.json', en: 'related.en.json' };
    manifest.relatedBuiltAt = new Date().toISOString();
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  }
  console.log(`related written: zh ${Object.keys(zh).length}, en ${Object.keys(en).length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
