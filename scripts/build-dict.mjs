#!/usr/bin/env node
/**
 * Build the bilingual dictionary data set from CC-CEDICT and ECDICT.
 *
 * Inputs (not shipped):
 *   data/raw/cedict.txt   CC-CEDICT plain-text export
 *   data/raw/ecdict.csv   ECDICT CSV export
 *
 * Outputs (shipped with the plugin):
 *   data/dict/zh.jsonl + zh.index.json + zh.words.json + zh.py.json
 *   data/dict/en.jsonl + en.index.json + en.words.json
 *   data/dict/manifest.json
 *
 * The JSONL files keep the package small enough to install and let the Host
 * half read one entry by byte offset instead of loading a 100k-entry Map.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const raw = path.join(root, 'data', 'raw');
const out = path.join(root, 'data', 'dict');

const TONES = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

function prettySyllable(rawSyllable) {
  let syllable = String(rawSyllable || '').trim();
  let tone = 5;
  const match = syllable.match(/^([A-Za-zü:]+?)([1-5])$/);
  if (match) {
    syllable = match[1];
    tone = Number(match[2]);
  }
  syllable = syllable.replace(/u:/g, 'ü').replace(/v/g, 'ü');
  if (tone === 5 || !syllable) return syllable;
  const lower = syllable.toLowerCase();
  let index = -1;
  if (lower.includes('a')) index = lower.indexOf('a');
  else if (lower.includes('e')) index = lower.indexOf('e');
  else if (lower.includes('ou')) index = lower.indexOf('o');
  else {
    for (let i = lower.length - 1; i >= 0; i -= 1) {
      if ('aeiouü'.includes(lower[i])) { index = i; break; }
    }
  }
  if (index < 0) return syllable;
  const letter = syllable[index];
  const marked = TONES[letter.toLowerCase()]?.[tone];
  if (!marked) return syllable;
  return syllable.slice(0, index) + (letter === letter.toUpperCase() ? marked.toUpperCase() : marked) + syllable.slice(index + 1);
}

function prettyPinyin(numeric) {
  return String(numeric || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(prettySyllable)
    .join(' ');
}

function searchPinyin(numeric) {
  return String(numeric || '')
    .toLowerCase()
    .replace(/u:/g, 'v')
    .replace(/ü/g, 'v')
    .replace(/[1-5]/g, '')
    .replace(/[^a-z]/g, '');
}

function uniquePush(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function parseCedict(text) {
  const map = new Map();
  const linePattern = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.*)\/$/;
  let skipped = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const match = line.match(linePattern);
    if (!match) { skipped += 1; continue; }
    const [, traditional, simplified, numeric, definitionBlob] = match;
    const definitions = definitionBlob.split('/').map((item) => item.trim()).filter(Boolean);
    if (!definitions.length) continue;
    let entry = map.get(simplified);
    if (!entry) {
      entry = { w: simplified, t: [], r: new Map() };
      map.set(simplified, entry);
    }
    uniquePush(entry.t, traditional);
    let reading = entry.r.get(numeric);
    if (!reading) {
      reading = { n: numeric, p: prettyPinyin(numeric), d: [] };
      entry.r.set(numeric, reading);
    }
    for (const definition of definitions) uniquePush(reading.d, definition);
  }
  const entries = [];
  for (const entry of map.values()) {
    const readings = [...entry.r.values()].sort((a, b) => a.n.localeCompare(b.n));
    const pinyin = searchPinyin(readings[0]?.n);
    entries.push({
      w: entry.w,
      t: entry.t.filter((form) => form !== entry.w).length ? entry.t.filter((form) => form !== entry.w) : undefined,
      r: readings,
      py: pinyin,
      pys: [...new Set(readings.map((reading) => searchPinyin(reading.n)).filter(Boolean))],
    });
  }
  entries.sort((a, b) => (a.w < b.w ? -1 : a.w > b.w ? 1 : 0));
  return { entries, skipped };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const EXCHANGE_LABELS = {
  p: '过去式',
  d: '过去分词',
  i: '现在分词',
  '3': '第三人称单数',
  r: '比较级',
  t: '最高级',
  s: '复数',
};

function parseExchange(value) {
  const forms = [];
  for (const part of String(value || '').split('/')) {
    const [code, ...rest] = part.split(':');
    const word = rest.join(':').trim();
    if (!word) continue;
    forms.push({ k: EXCHANGE_LABELS[code] || code, v: word });
  }
  return forms;
}

function splitSenses(value) {
  return String(value || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-zA-Z]+\.)\s*(.*)$/);
      const part = match ? match[1] : '';
      const body = match ? match[2] : line;
      return {
        p: part,
        d: body.split(/[；;]/).map((item) => item.trim()).filter(Boolean),
      };
    })
    .filter((sense) => sense.d.length);
}

function cleanChineseGloss(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s*\d+[.、]\s*/, '')
    .trim();
}

function splitChineseGlosses(value, headword) {
  const items = String(value || '')
    .replace(/\\n/g, '\n')
    .split(/\r?\n+|(?=[①-⑳⒈-⒛])/)
    .map(cleanChineseGloss)
    .filter(Boolean);
  const marker = items.findIndex((item) => /^[⒈-⒛]/.test(item));
  let start = 0;
  if (marker >= 0) {
    start = marker;
  } else {
    const pinyinLine = items.findIndex((item, index) => index > 0 && item.startsWith(headword) && /[a-zü]/i.test(item));
    if (pinyinLine >= 0 && pinyinLine + 1 < items.length) start = pinyinLine + 1;
  }
  return items
    .slice(start)
    .map((item) => item.replace(/^[①-⑳⒈-⒛]\s*/, ''))
    .filter(Boolean)
    .filter((item) => item !== headword && item !== '同本义')
    .slice(0, 6);
}

function loadChineseGlosses(ciFile, wordFile) {
  const map = new Map();
  const add = (word, explanation) => {
    const key = String(word || '').trim();
    if (!key || map.has(key)) return;
    const definitions = splitChineseGlosses(explanation, key);
    if (definitions.length) map.set(key, definitions);
  };
  if (fs.existsSync(ciFile)) {
    try {
      for (const item of JSON.parse(fs.readFileSync(ciFile, 'utf8'))) {
        if (String(item.ci || '').length > 1) add(item.ci, item.explanation);
      }
    } catch (error) {
      process.stderr.write(`  skipped unreadable ${path.basename(ciFile)}: ${error.message}\n`);
    }
  }
  if (fs.existsSync(wordFile)) {
    try {
      for (const item of JSON.parse(fs.readFileSync(wordFile, 'utf8'))) {
        add(item.word, item.explanation);
      }
    } catch (error) {
      process.stderr.write(`  skipped unreadable ${path.basename(wordFile)}: ${error.message}\n`);
    }
  }
  return map;
}

function parseEnglish(rows) {
  const header = rows[0].map((name) => name.trim().toLowerCase());
  const column = (name) => header.indexOf(name);
  const at = (row, name) => {
    const index = column(name);
    return index >= 0 ? row[index] ?? '' : '';
  };
  const map = new Map();
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    const word = String(at(row, 'word')).trim();
    if (!word || !/^[A-Za-z][A-Za-z' .-]*$/.test(word)) continue;
    const translation = String(at(row, 'translation')).replace(/\\n/g, '\n').trim();
    if (!translation) continue;
    const collins = Number(at(row, 'collins')) || 0;
    const oxford = String(at(row, 'oxford')).trim() === '1';
    const bnc = Number(at(row, 'bnc')) || 0;
    const frq = Number(at(row, 'frq')) || 0;
    const rank = frq || bnc || 1e9;
    if (rank > 60000 && !oxford && collins < 4) continue;
    const key = word.toLowerCase();
    const previous = map.get(key);
    if (previous && previous.rank <= rank) continue;
    const tags = String(at(row, 'tag')).split(/\s+/).filter(Boolean);
    map.set(key, {
      w: word,
      ph: String(at(row, 'phonetic')).trim() || undefined,
      s: splitSenses(translation),
      d: String(at(row, 'definition')).replace(/\\n/g, '\n').split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 4),
      f: parseExchange(at(row, 'exchange')),
      co: collins || undefined,
      ox: oxford || undefined,
      fr: frq || bnc || undefined,
      tg: tags.length ? tags : undefined,
      rank,
    });
  }
  const entries = [...map.values()].sort((a, b) => a.w.toLowerCase().localeCompare(b.w.toLowerCase()));
  for (const entry of entries) delete entry.rank;
  return entries;
}

function writeJsonl(file, entries) {
  const chunks = [];
  const index = {};
  const words = [];
  let offset = 0;
  for (const entry of entries) {
    const line = JSON.stringify(entry);
    const bytes = Buffer.byteLength(line, 'utf8');
    index[entry.w] = [offset, bytes];
    words.push([entry.w, entry.py || entry.ph || '']);
    chunks.push(line);
    offset += bytes + 1;
  }
  fs.writeFileSync(file, `${chunks.join('\n')}\n`, 'utf8');
  return { index, words, bytes: offset, count: entries.length };
}

function main() {
  const cedictFile = path.join(raw, 'cedict.txt');
  const ecdictFile = path.join(raw, 'ecdict.csv');
  if (!fs.existsSync(cedictFile)) throw new Error(`missing ${cedictFile}`);
  if (!fs.existsSync(ecdictFile)) throw new Error(`missing ${ecdictFile}`);
  fs.mkdirSync(out, { recursive: true });

  process.stdout.write('reading CC-CEDICT…\n');
  const cedict = parseCedict(fs.readFileSync(cedictFile, 'utf8'));
  process.stdout.write(`  ${cedict.entries.length} simplified headwords (${cedict.skipped} lines skipped)\n`);

  process.stdout.write('reading ECDICT…\n');
  const rows = parseCsv(fs.readFileSync(ecdictFile, 'utf8'));
  const english = parseEnglish(rows);
  process.stdout.write(`  ${english.length} English headwords\n`);

  process.stdout.write('reading Chinese glosses…\n');
  const chineseGlosses = loadChineseGlosses(
    path.join(raw, 'xinhua-ci.json'),
    path.join(raw, 'xinhua-word.json'),
  );
  let glossed = 0;
  for (const entry of cedict.entries) {
    const definitions = chineseGlosses.get(entry.w);
    if (!definitions) continue;
    entry.cn = definitions;
    glossed += 1;
  }
  process.stdout.write(`  ${chineseGlosses.size} Chinese headwords, ${glossed} matched\n`);

  const zh = writeJsonl(path.join(out, 'zh.jsonl'), cedict.entries);
  const en = writeJsonl(path.join(out, 'en.jsonl'), english);

  const pinyin = {};
  const senseCount = new Map();
  for (const entry of cedict.entries) {
    senseCount.set(entry.w, entry.r.reduce((sum, reading) => sum + reading.d.length, 0));
    for (const reading of entry.pys) {
      if (!pinyin[reading]) pinyin[reading] = [];
      pinyin[reading].push(entry.w);
    }
  }
  for (const [reading, list] of Object.entries(pinyin)) {
    list.sort((a, b) =>
      (senseCount.get(b) - senseCount.get(a)) ||
      (a.length - b.length) ||
      a.localeCompare(b));
    pinyin[reading] = list.slice(0, 60);
  }

  const traditional = {};
  for (const entry of cedict.entries) {
    for (const form of entry.t || []) {
      if (form && form !== entry.w && !traditional[form]) traditional[form] = entry.w;
    }
  }
  const byLetter = (entries, reading) => {
    const groups = {};
    for (const entry of entries) {
      const value = String(reading(entry) || '');
      const letter = value.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry.w);
    }
    return groups;
  };
  const zhLetters = byLetter(cedict.entries, (entry) => entry.py);
  const enLetters = byLetter(english, (entry) => entry.w);

  fs.writeFileSync(path.join(out, 'zh.index.json'), JSON.stringify(zh.index), 'utf8');
  fs.writeFileSync(path.join(out, 'zh.words.json'), JSON.stringify(zh.words), 'utf8');
  fs.writeFileSync(path.join(out, 'zh.py.json'), JSON.stringify(pinyin), 'utf8');
  fs.writeFileSync(path.join(out, 'zh.pykeys.json'), JSON.stringify(Object.keys(pinyin).sort()), 'utf8');
  fs.writeFileSync(path.join(out, 'zh.trad.json'), JSON.stringify(traditional), 'utf8');
  fs.writeFileSync(path.join(out, 'zh.byletter.json'), JSON.stringify(zhLetters), 'utf8');
  fs.writeFileSync(path.join(out, 'en.index.json'), JSON.stringify(en.index), 'utf8');
  fs.writeFileSync(path.join(out, 'en.words.json'), JSON.stringify(en.words), 'utf8');
  fs.writeFileSync(path.join(out, 'en.byletter.json'), JSON.stringify(enLetters), 'utf8');

  const verseFile = path.join(root, 'data', 'verse.json');
  if (fs.existsSync(verseFile)) {
    fs.copyFileSync(verseFile, path.join(out, 'verse.json'));
  }

  const letters = (groups) => {
    const counts = {};
    for (const [key, list] of Object.entries(groups)) counts[key] = list.length;
    return counts;
  };

  const manifest = {
    version: 2,
    builtAt: new Date().toISOString(),
    zh: {
      count: zh.count,
      bytes: zh.bytes,
      file: 'zh.jsonl',
      index: 'zh.index.json',
      words: 'zh.words.json',
      pinyin: 'zh.py.json',
      letters: letters(zhLetters),
      monolingual: glossed,
    },
    en: {
      count: en.count,
      bytes: en.bytes,
      file: 'en.jsonl',
      index: 'en.index.json',
      words: 'en.words.json',
      letters: letters(enLetters),
    },
    sources: [
      { name: 'CC-CEDICT', license: 'CC BY-SA 4.0', url: 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict' },
      { name: 'ECDICT', license: 'MIT', url: 'https://github.com/skywind3000/ECDICT' },
      { name: 'chinese-xinhua', license: 'MIT', url: 'https://github.com/pwxcoo/chinese-xinhua' },
    ],
  };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const mb = (value) => `${(value / 1024 / 1024).toFixed(1)} MB`;
  process.stdout.write(`zh: ${zh.count} entries, ${mb(zh.bytes)}\n`);
  process.stdout.write(`en: ${en.count} entries, ${mb(en.bytes)}\n`);
  process.stdout.write('done\n');
}

main();
