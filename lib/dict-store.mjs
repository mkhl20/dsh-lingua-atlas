import fs from 'node:fs';
import path from 'node:path';

const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isHan(value) {
  return HAN.test(value);
}

function normalizeLatin(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/u:/g, 'v')
    .replace(/ü/g, 'v')
    .replace(/[1-5]/g, '')
    .replace(/[^a-z]/g, '');
}

function binaryLowerBound(list, target, key) {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (key(list[mid]) < target) low = mid + 1;
    else high = mid;
  }
  return low;
}

function preview(entry) {
  if (!entry) return null;
  if (entry.r) {
    const first = entry.r[0] || { d: [] };
    return {
      w: entry.w,
      r: first.p || entry.py || '',
      t: entry.t ? entry.t.join(' / ') : undefined,
      c: entry.cn ? entry.cn[0] : undefined,
      g: first.d.slice(0, 3).join('；'),
      n: entry.r.reduce((sum, reading) => sum + reading.d.length, 0),
    };
  }
  const senses = entry.s || [];
  const gloss = senses.slice(0, 2).map((sense) => `${sense.p ? `${sense.p} ` : ''}${sense.d.slice(0, 3).join('；')}`).join(' / ');
  return {
    w: entry.w,
    r: entry.ph || '',
    g: gloss,
    n: senses.reduce((sum, sense) => sum + sense.d.length, 0),
  };
}

export function createDictionaryStore(directory) {
  let manifest = null;
  let fds = {};
  let index = {};
  let words = {};
  let extras = {};
  let verses = null;
  const relatedData = {};

  function dataFile(name) {
    return path.join(directory, name);
  }

  function ensure() {
    if (manifest) return manifest;
    const manifestFile = dataFile('manifest.json');
    if (!fs.existsSync(manifestFile)) {
      const error = new Error('dictionary data is not built yet');
      error.code = 'not_ready';
      throw error;
    }
    manifest = loadJson(manifestFile);
    return manifest;
  }

  function loadDirection(direction) {
    ensure();
    if (index[direction]) return;
    const meta = manifest[direction];
    index[direction] = loadJson(dataFile(meta.index));
    words[direction] = loadJson(dataFile(meta.words));
    fds[direction] = fs.openSync(dataFile(meta.file), 'r');
    if (direction === 'zh') {
      extras.zhPinyin = loadJson(dataFile(meta.pinyin));
      extras.zhPinyinKeys = loadJson(dataFile('zh.pykeys.json'));
      extras.zhTrad = loadJson(dataFile('zh.trad.json'));
    }
  }

  function readEntry(direction, word) {
    loadDirection(direction);
    const slot = index[direction][word];
    if (!slot) return null;
    const [offset, length] = slot;
    const buffer = Buffer.allocUnsafe(length);
    fs.readSync(fds[direction], buffer, 0, length, offset);
    return JSON.parse(buffer.toString('utf8'));
  }

  function prefixWords(direction, prefix, limit) {
    loadDirection(direction);
    const list = words[direction];
    const folded = direction === 'en' ? prefix.toLowerCase() : prefix;
    const key = (item) => (direction === 'en' ? String(item[0]).toLowerCase() : String(item[0]));
    let start = binaryLowerBound(list, folded, key);
    const result = [];
    while (start < list.length && result.length < limit) {
      const item = list[start];
      const value = key(item);
      if (!value.startsWith(folded)) break;
      if (value !== folded) result.push(item);
      start += 1;
    }
    return result;
  }

  function readMany(direction, list, limit) {
    const result = [];
    for (const item of list.slice(0, limit)) {
      const entry = readEntry(direction, item[0]);
      if (entry) result.push(preview(entry));
    }
    return result;
  }

  function zhMatches(query, limit) {
    loadDirection('zh');
    const group = { exact: [], prefix: [], pinyin: [], total: 0 };
    let target = query;
    let matchedForm;
    if (isHan(query)) {
      if (!index.zh[query] && extras.zhTrad[query]) {
        target = extras.zhTrad[query];
        matchedForm = query;
      }
      if (index.zh[target]) {
        group.exact.push(preview(readEntry('zh', target)));
      }
      if (target.length >= 2) {
        const candidates = prefixWords('zh', target, limit);
        group.prefix = readMany('zh', candidates, limit);
      }
    } else {
      const normalized = normalizeLatin(query);
      if (normalized) {
        const keys = extras.zhPinyinKeys;
        let start = binaryLowerBound(keys, normalized, (value) => value);
        while (start < keys.length && keys[start].startsWith(normalized) && group.pinyin.length < 8) {
          const wordList = extras.zhPinyin[keys[start]] || [];
          group.pinyin.push(...readMany('zh', wordList.map((word) => [word]), 4));
          start += 1;
        }
      }
    }
    group.total = group.exact.length + group.prefix.length + group.pinyin.length;
    group.matchedForm = matchedForm;
    return group;
  }

  function enMatches(query, limit) {
    loadDirection('en');
    const group = { exact: [], prefix: [], pinyin: [], total: 0 };
    const folded = query.toLowerCase();
    if (index.en[folded]) group.exact.push(preview(readEntry('en', folded)));
    if (folded.length >= 2) {
      const candidates = prefixWords('en', folded, limit);
      group.prefix = readMany('en', candidates, limit);
    }
    group.total = group.exact.length + group.prefix.length;
    return group;
  }

  function lookup(query, direction = 'auto', limit = 20) {
    ensure();
    const text = String(query || '').trim();
    if (!text) return { query: text, direction: 'auto', zh: null, en: null };
    const han = isHan(text);
    const runZh = direction === 'zh' || (direction === 'auto' && han);
    const runEn = direction === 'en' || (direction === 'auto' && !han);
    const result = {
      query: text,
      direction: direction === 'auto' ? (han ? 'zh' : 'en') : direction,
      zh: runZh ? zhMatches(text, limit) : null,
      en: runEn ? enMatches(text, limit) : null,
    };
    if (direction === 'auto' && !han) {
      const zh = zhMatches(text, 8);
      if (zh.total) result.zh = zh;
    }
    return result;
  }

  function related(direction, entry, offset = 0) {
    loadDirection(direction);
    if (!relatedData[direction]) {
      const file = dataFile(`related.${direction}.json`);
      relatedData[direction] = fs.existsSync(file) ? loadJson(file).words || {} : {};
    }
    const group = relatedData[direction][entry.w] || {};
    const rotate = (list) => {
      if (!list.length) return [];
      const shift = offset % list.length;
      return list.slice(shift).concat(list.slice(0, shift)).slice(0, 8);
    };
    const toCards = (list) => readMany(direction, list.map((word) => [word]), 8);
    return {
      near: toCards(rotate(group.near || [])),
      same: toCards(rotate(group.same || [])),
      radical: toCards(rotate(group.radical || [])),
      form: toCards(rotate(group.form || [])),
    };
  }

  function loadVerses() {
    if (verses) return verses;
    const file = dataFile('verse.json');
    verses = fs.existsSync(file) ? loadJson(file) : { zh: {}, en: {} };
    return verses;
  }

  function entry(direction, word, relatedOffset = 0) {
    ensure();
    if (direction !== 'zh' && direction !== 'en') throw new Error('direction must be zh or en');
    loadDirection(direction);
    const target = direction === 'zh' ? (index.zh[word] ? word : extras.zhTrad?.[word] || word) : word.toLowerCase();
    const value = readEntry(direction, target);
    if (!value) return null;
    const key = direction === 'zh' ? value.w : value.w.toLowerCase();
    const verse = loadVerses()[direction]?.[key];
    if (verse?.length) value.verse = verse;
    return { direction, entry: value, related: related(direction, value, relatedOffset) };
  }

  function browse(direction, letter, offset = 0, limit = 30) {
    ensure();
    loadDirection(direction);
    const meta = manifest[direction];
    const groups = extras[direction === 'zh' ? 'zhLetters' : 'enLetters'] || (extras[direction === 'zh' ? 'zhLetters' : 'enLetters'] = loadJson(dataFile(`${direction}.byletter.json`)));
    const list = groups[letter] || [];
    const start = Math.max(0, Number(offset) || 0);
    return {
      direction,
      letter,
      offset: start,
      limit,
      total: list.length,
      items: readMany(direction, list.slice(start, start + limit).map((word) => [word]), limit),
      letters: meta.letters,
    };
  }

  function random(direction = 'zh') {
    ensure();
    loadDirection(direction);
    const list = words[direction];
    const item = list[Math.floor(Math.random() * list.length)];
    return entry(direction, item[0]);
  }

  function stats() {
    ensure();
    return {
      builtAt: manifest.builtAt,
      zh: { count: manifest.zh.count, letters: manifest.zh.letters },
      en: { count: manifest.en.count, letters: manifest.en.letters },
      sources: manifest.sources,
    };
  }

  function close() {
    for (const direction of Object.keys(fds)) {
      try { fs.closeSync(fds[direction]); } catch {}
    }
    fds = {};
    index = {};
    words = {};
    extras = {};
    verses = null;
    manifest = null;
  }

  return { lookup, entry, browse, random, stats, close };
}
