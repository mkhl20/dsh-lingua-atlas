import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const dataDir = path.resolve(here, '..', 'data', 'dict');

const TONE_MARKS = new Map(Object.entries({
  'ā': 1, 'á': 2, 'ǎ': 3, 'à': 4,
  'ē': 1, 'é': 2, 'ě': 3, 'è': 4,
  'ī': 1, 'í': 2, 'ǐ': 3, 'ì': 4,
  'ō': 1, 'ó': 2, 'ǒ': 3, 'ò': 4,
  'ū': 1, 'ú': 2, 'ǔ': 3, 'ù': 4,
  'ǖ': 1, 'ǘ': 2, 'ǚ': 3, 'ǜ': 4,
  'ń': 2, 'ň': 3, 'ǹ': 4, 'ḿ': 2,
}));

function isHan(ch) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(ch);
}

function plainPinyin(pinyin) {
  return String(pinyin || '')
    .replace(/ü/g, 'v')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function toneOf(pinyin) {
  for (const ch of String(pinyin || '')) {
    if (TONE_MARKS.has(ch)) return TONE_MARKS.get(ch);
  }
  return 0;
}

function initialOf(pinyin) {
  const plain = plainPinyin(pinyin);
  const match = plain.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])/);
  return match ? match[1] : '';
}

function finalOf(pinyin) {
  let plain = plainPinyin(pinyin);
  if (!plain) return '';
  if (plain.startsWith('yu')) return `v${plain.slice(2)}`;
  if (plain.startsWith('yi')) return `i${plain.slice(2)}`;
  if (plain.startsWith('wu')) return `u${plain.slice(2)}`;
  if (plain.startsWith('y')) return `i${plain.slice(1)}`;
  if (plain.startsWith('w')) return `u${plain.slice(1)}`;
  plain = plain.replace(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcs])/, '');
  return plain;
}

function pauseFor(count) {
  if (count === 4) return '二二';
  if (count === 5) return '二三';
  if (count === 6) return '二二二';
  if (count === 7) return '二二三';
  return '—';
}

function patternFor(count) {
  if (count === 4 || count === 5 || count === 7) return `${count}言`;
  return `${count}字`;
}

function splitClauses(text) {
  const lines = String(text || '').split(/\r?\n/);
  const clauses = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/(?<=[，。；！？、：])/).map((part) => part.trim()).filter(Boolean);
    for (const part of parts) {
      const chars = [...part].filter(isHan);
      if (chars.length) clauses.push({ text: part, chars });
    }
  }
  return clauses;
}

function rhymeClass(final) {
  if (!final) return '';
  if (/^(iang|uang|ang)$/.test(final)) return 'ang';
  if (/^(ian|uan|van|an)$/.test(final)) return 'an';
  if (/^(iao|ao)$/.test(final)) return 'ao';
  if (/^(i?ong|iong)$/.test(final)) return 'ong';
  if (/^(ing|eng)$/.test(final)) return 'eng';
  if (/^(in|en|un|vn)$/.test(final)) return 'en';
  if (/^(iu|ou)$/.test(final)) return 'ou';
  if (/^(ui|ei)$/.test(final)) return 'ei';
  if (/^(uai|ai)$/.test(final)) return 'ai';
  if (/^(ia|ua|a)$/.test(final)) return 'a';
  if (/^(ie|ve)$/.test(final)) return 'ie';
  if (/^(uo|o)$/.test(final)) return 'o';
  return final;
}

function rhymeLetter(final, groups) {
  const key = rhymeClass(final);
  if (!key) return '?';
  if (!groups.has(key)) groups.set(key, String.fromCharCode(65 + groups.size));
  return groups.get(key);
}

function summarizeRhymes(clauses) {
  const groups = new Map();
  for (const clause of clauses) {
    const last = clause.chars[clause.chars.length - 1];
    const final = last && last.final;
    clause.rhyme = final ? rhymeLetter(final, groups) : '?';
  }
  const byLetter = new Map();
  for (const clause of clauses) {
    if (!clause.rhyme || clause.rhyme === '?') continue;
    if (!byLetter.has(clause.rhyme)) byLetter.set(clause.rhyme, []);
    byLetter.get(clause.rhyme).push(clause.chars[clause.chars.length - 1]);
  }
  return [...byLetter.entries()].map(([letter, chars]) => ({
    letter,
    final: chars[0] && chars[0].final,
    words: [...new Set(chars.map((item) => item.c))],
  }));
}

function soundPairs(chars) {
  const alliterations = [];
  const assonances = [];
  for (let i = 0; i < chars.length - 1; i += 1) {
    const a = chars[i];
    const b = chars[i + 1];
    if (!a.pinyin || !b.pinyin) continue;
    if (a.c !== b.c && a.initial && a.initial === b.initial) {
      alliterations.push(`${a.c}${b.c}`);
    }
    if (a.c !== b.c && a.final && a.final === b.final) {
      assonances.push(`${a.c}${b.c}`);
    }
  }
  return {
    alliterations: [...new Set(alliterations)].slice(0, 4),
    assonances: [...new Set(assonances)].slice(0, 4),
  };
}

export function createProsody(options = {}) {
  const dictionaryDir = options.dictionaryDir || dataDir;
  let zhChars = null;
  let cmu = null;

  function loadZh() {
    if (zhChars) return zhChars;
    const file = path.join(dictionaryDir, 'prosody.zh.json');
    zhChars = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).chars || {} : {};
    return zhChars;
  }

  function loadCmu() {
    if (cmu) return cmu;
    cmu = new Map();
    const file = path.join(dictionaryDir, 'cmudict.dict');
    if (!fs.existsSync(file)) return cmu;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith(';;;')) continue;
      const parts = line.trim().split(/\s+/);
      const word = parts.shift().toLowerCase();
      if (!word || !parts.length) continue;
      if (!cmu.has(word)) cmu.set(word, parts);
    }
    return cmu;
  }

  function zhCharDetail(char) {
    const map = loadZh();
    const readings = map[char] || [];
    const pinyin = readings.find((reading) => toneOf(reading) > 0) || readings[0] || '';
    const tone = toneOf(pinyin);
    return {
      c: char,
      pinyin,
      readings,
      tone,
      ping: tone === 1 || tone === 2 ? '平' : tone === 3 || tone === 4 ? '仄' : '?',
      initial: initialOf(pinyin),
      final: finalOf(pinyin),
    };
  }

  function analyzeZh(text) {
    const clauses = splitClauses(text).map((clause) => {
      const chars = clause.chars.map(zhCharDetail);
      const pingze = chars.map((item) => item.ping).join('');
      const unknown = chars.filter((item) => item.ping === '?').length;
      return {
        text: clause.text,
        chars,
        count: chars.length,
        pattern: patternFor(chars.length),
        pause: pauseFor(chars.length),
        pingze,
        unknown,
        rhyme: '?',
        ...soundPairs(chars),
      };
    });
    const rhymes = summarizeRhymes(clauses);
    const unknown = clauses.reduce((sum, clause) => sum + clause.unknown, 0);
    const total = clauses.reduce((sum, clause) => sum + clause.count, 0);
    return {
      lang: 'zh',
      lines: clauses,
      rhymes,
      scheme: clauses.map((clause) => clause.rhyme).join(''),
      summary: clauses.map((clause) => `${clause.pattern}·${clause.pause}`).join(' / '),
      warnings: [
        total && unknown / total > 0.25 ? '有未收字，平仄只按已知字判断。' : '',
        '平仄按普通话今音；入声已并入普通话，古音需另考。',
      ].filter(Boolean),
    };
  }

  function wordPronunciation(word) {
    const map = loadCmu();
    const normalized = String(word || '').toLowerCase().replace(/[^a-z']/g, '');
    const candidates = [normalized, normalized.replace(/'s$/, ''), normalized.replace(/'$/, '')];
    for (const candidate of candidates) {
      if (candidate && map.has(candidate)) return map.get(candidate);
    }
    return null;
  }

  function syllablesOf(phonemes) {
    return phonemes.filter((phone) => /\d$/.test(phone)).map((phone) => ({
      phone,
      stress: Number(phone.slice(-1)),
    }));
  }

  function footOf(pattern) {
    if (pattern === '01') return 'iamb';
    if (pattern === '10') return 'trochee';
    if (pattern === '11') return 'spondee';
    if (pattern === '00') return 'pyrrhic';
    if (pattern === '001') return 'anapest';
    if (pattern === '100') return 'dactyl';
    if (pattern === '010') return 'amphibrach';
    return 'loose';
  }

  function feetOf(stresses) {
    const feet = [];
    for (let i = 0; i < stresses.length; i += 2) {
      const group = stresses.slice(i, i + 2);
      feet.push({ pattern: group.join(''), name: footOf(group.join('')) });
    }
    return feet;
  }

  function meterOf(stresses, feet) {
    const count = stresses.length;
    const offbeat = stresses.filter((stress, index) => stress > 0 && index % 2 === 1).length;
    const onbeat = stresses.filter((stress, index) => stress > 0 && index % 2 === 0).length;
    const names = { 3: 'trimeter', 4: 'tetrameter', 5: 'pentameter', 6: 'hexameter' };
    if (count >= 8 && offbeat >= onbeat + 2) {
      return names[count] ? `iambic ${names[count]}` : 'iambic';
    }
    if (count >= 8 && onbeat >= offbeat + 2) {
      return names[count] ? `trochaic ${names[count]}` : 'trochaic';
    }
    const iambs = feet.filter((foot) => foot.name === 'iamb').length;
    const trochees = feet.filter((foot) => foot.name === 'trochee').length;
    if (feet.length >= 3 && iambs / feet.length >= 0.6) return 'iambic';
    if (feet.length >= 3 && trochees / feet.length >= 0.6) return 'trochaic';
    return count ? `loose (${feet.length} feet)` : 'unknown';
  }

  function rhymeKey(phonemes) {
    let index = -1;
    for (let i = phonemes.length - 1; i >= 0; i -= 1) {
      if (/[12]$/.test(phonemes[i])) { index = i; break; }
    }
    if (index < 0) {
      for (let i = phonemes.length - 1; i >= 0; i -= 1) {
        if (/\d$/.test(phonemes[i])) { index = i; break; }
      }
    }
    if (index < 0) return '';
    return phonemes.slice(index).map((phone) => phone.replace(/\d$/, '')).join(' ');
  }

  function analyzeEn(text) {
    const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const rhymeGroups = new Map();
    const rhymeWords = new Map();
    const clauses = lines.map((line) => {
      const words = line.match(/[A-Za-z][A-Za-z'-]*/g) || [];
      const details = words.map((word) => {
        const phonemes = wordPronunciation(word);
        const syllables = phonemes ? syllablesOf(phonemes) : [];
        return {
          w: word,
          known: Boolean(phonemes),
          phonemes,
          syllables: syllables.length,
          stress: syllables.map((item) => item.stress).join(''),
          rhyme: phonemes ? rhymeKey(phonemes) : '',
        };
      });
      const known = details.filter((item) => item.known);
      const stressString = known.map((item) => item.stress).join('');
      const stresses = known.flatMap((item) => [...item.stress]).map(Number);
      const feet = feetOf(stresses);
      const last = details[details.length - 1];
      const key = last && last.rhyme ? last.rhyme : '';
      if (key) {
        if (!rhymeGroups.has(key)) rhymeGroups.set(key, String.fromCharCode(65 + rhymeGroups.size));
        if (!rhymeWords.has(key)) rhymeWords.set(key, []);
        rhymeWords.get(key).push(last.w);
      }
      const alliterations = new Map();
      const assonances = new Map();
      for (const item of known) {
        const onset = (item.phonemes || []).find((phone) => /^[A-Z]/.test(phone) && !/[012]$/.test(phone));
        if (onset) {
          if (!alliterations.has(onset)) alliterations.set(onset, []);
          alliterations.get(onset).push(item.w);
        }
        for (const syllable of syllablesOf(item.phonemes || [])) {
          if (syllable.stress > 0) {
            const vowel = syllable.phone.replace(/\d$/, '');
            if (!assonances.has(vowel)) assonances.set(vowel, []);
            assonances.get(vowel).push(item.w);
          }
        }
      }
      return {
        text: line,
        words: details,
        count: details.length,
        syllables: known.reduce((sum, item) => sum + item.syllables, 0),
        stress: stressString,
        feet,
        meter: meterOf(stresses, feet),
        rhyme: key ? rhymeGroups.get(key) : '?',
        rhymeKey: key,
        alliterations: [...alliterations.values()].filter((items) => new Set(items).size > 1).map((items) => [...new Set(items)].join(' / ')),
        assonances: [...assonances.values()].filter((items) => new Set(items).size > 1).map((items) => [...new Set(items)].join(' / ')),
      };
    });
    const knownWords = clauses.flatMap((line) => line.words);
    const unknown = knownWords.filter((item) => !item.known).length;
    const stresses = clauses.flatMap((line) => line.feet.map((foot) => foot.pattern)).join(' ');
    return {
      lang: 'en',
      lines: clauses,
      rhymes: [...rhymeGroups.entries()].map(([key, letter]) => ({
        letter,
        key,
        words: [...new Set(rhymeWords.get(key) || [])],
      })),
      scheme: clauses.map((line) => line.rhyme).join(''),
      summary: clauses.length ? `${clauses[0].meter}; ${clauses[0].syllables} syllables` : '',
      stress: stresses,
      warnings: [
        knownWords.length && unknown / knownWords.length > 0.3 ? '有未收词，音步只按已知词判断。' : '',
        '重音按 CMU 词典；实际朗读会随方言、语气与强调移动。',
      ].filter(Boolean),
    };
  }

  function analyze(text, lang) {
    const value = String(text || '').trim();
    if (!value) return { lang: lang || 'zh', lines: [], rhymes: [], scheme: '', summary: '', warnings: [] };
    const resolved = lang === 'zh' || lang === 'en' ? lang : (/[\u3400-\u9fff]/.test(value) ? 'zh' : 'en');
    return resolved === 'zh' ? analyzeZh(value) : analyzeEn(value);
  }

  return { analyze, analyzeZh, analyzeEn };
}
