/**
 * Build the public-domain literary corpus.
 *
 * Sources:
 *  - chinese-poetry/chinese-poetry (MIT dataset; poems themselves are public domain)
 *  - Project Gutenberg eBook #1041, Shakespeare's Sonnets (public domain)
 *
 * The output is a single JSONL file plus a small manifest. The Host reads it
 * lazily, so the Web UI never ships a multi-megabyte corpus in the bundle.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const rawDirectory = path.join(root, 'data', 'raw', 'corpus');
const outputDirectory = path.join(root, 'data', 'corpus');

const REPO = 'https://github.com/chinese-poetry/chinese-poetry';
const GUTENBERG = 'https://www.gutenberg.org/ebooks/1041';

const IMAGE_RULES = [
  ['月', ['月']],
  ['江|河|川|湘|渭|洛', ['江河']],
  ['山|峰|岭|岳|峦', ['山']],
  ['水|泉|溪|湖|海|波|潮', ['水']],
  ['雨|雪|霜|露|雾', ['雨雪']],
  ['风|云|烟|霞', ['风云']],
  ['花|梅|兰|菊|莲|桃|柳|枫', ['花木']],
  ['鸟|雁|鸦|鹃|蝉|鹤|莺', ['飞鸟']],
  ['舟|船|帆|桨', ['舟船']],
  ['灯|烛|火', ['灯烛']],
  ['酒|醉|樽|杯', ['酒']],
  ['梦|魂', ['梦']],
  ['楼|台|亭|阁|窗|门', ['楼台']],
  ['秋|霜|雁|枫', ['秋']],
  ['春|花|莺|燕', ['春']],
  ['夜|月|灯|梦', ['夜']],
];

const MOOD_RULES = [
  ['愁|悲|泪|恨|孤|寂|寒|凉|残|断|怅|怨|哀', ['怅惘']],
  ['喜|笑|欢|乐|醉|歌|舞', ['欢愉']],
  ['思|忆|念|梦', ['思念']],
  ['愤|怒|叹|哭|涕', ['悲愤']],
  ['闲|静|幽|适|悠然', ['闲适']],
];

const THEME_RULES = [
  ['爱|相思|恋人|佳人|红颜|鸳鸯|连理|比翼|情', ['爱情']],
  ['别|送|离|折柳|长亭|行客', ['送别']],
  ['乡|故园|故国|家|归', ['思乡']],
  ['关|塞|征|战|胡|羌|剑|将', ['边塞']],
  ['田|桑|麻|锄|耕|柴|村', ['田园']],
  ['古|昔|英雄|霸业|故宫|兴亡|遗', ['怀古']],
  ['悼|亡|哭|挽', ['悼亡']],
  ['宫|妃|妾|君王|昭阳', ['宫怨']],
  ['春|花落|落花|残春', ['伤春']],
  ['秋|霜|落叶|雁', ['悲秋']],
  ['山|峰|岭|岳|江|河|湖|海', ['山水']],
  ['旅|客|舟|驿|漂泊|天涯', ['羁旅']],
  ['道|理|空|无常|浮生', ['哲理']],
];

const SEASON_RULES = [
  ['春', ['春']],
  ['夏', ['夏']],
  ['秋', ['秋']],
  ['冬', ['冬']],
  ['夜', ['夜']],
];


const NOTES = new Map([
  ['关雎', '以“求之不得”为轴，翻来覆去的是同一个动作：流、采、芼。句子并不推进故事，它让等待有了节奏。'],
  ['蒹葭', '“在水一方”始终不抵达。好就好在没有把距离填平，只让白露、流水和道路替人着急。'],
  ['静夜思', '二十个字，没有一个“愁”字。月光先被误认成霜，人才抬头；一抬头，故乡就远了。'],
  ['春晓', '从听觉写起，再落到满地落花。春天不是被看见的，是被听见、被数出来的。'],
  ['登鹳雀楼', '前两句把空间推到尽头，后两句把动作往上抬。道理不在句子里，在“更上一层”这个动作里。'],
  ['锦瑟', '每一句都像在解释，其实每一句都在推开。典故不是装饰，是把私人经验藏进公共记忆。'],
  ['声声慢', '开头十四个叠字，不是在形容愁，是在让读者跟着她一遍一遍地找。'],
  ['念奴娇·赤壁怀古', '把江、石、浪、雪先推到眼前，再忽然收回到“人间如梦”。豪放词的收尾，常常比开头更轻。'],
  ['离骚', '香草、美人、道路，三样东西反复出现。它们不是比喻，是一个人给自己立的坐标系。'],
  ['将进酒', '劝酒的话越说越大，时间的窟窿也越捅越深。豪迈是表面的，底下是“万古愁”。'],
  ['春江花月夜', '把春、江、花、月、夜五个字拆开又合上，像潮水一样一轮一轮地推。'],
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function clean(value) {
  return String(value || '').replace(/\r/g, '').trim();
}

function compactLines(lines) {
  return lines.map(clean).filter((line) => line.length >= 2);
}

function tagsFor(text, seed = []) {
  const tags = new Set(seed.filter(Boolean));
  for (const [pattern, values] of [...IMAGE_RULES, ...MOOD_RULES, ...THEME_RULES, ...SEASON_RULES]) {
    if (new RegExp(pattern).test(text)) values.forEach((value) => tags.add(value));
  }
  return Array.from(tags).slice(0, 14);
}

const FORM_TAGS = [
  '五言律诗', '七言律诗', '五言绝句', '七言绝句',
  '五言古诗', '七言古诗', '四言古诗', '杂言古诗',
  '七言乐府', '乐府', '五言排律', '七言排律',
];

function formFromTags(tags = []) {
  return FORM_TAGS.find((form) => tags.includes(form));
}

function formFromLines(lines = []) {
  const clauses = lines.flatMap((line) => String(line).split(/[，。！？；、：]/));
  const lengths = clauses
    .map((line) => line.replace(/[^\u4e00-\u9fff]/g, '').length)
    .filter((length) => length >= 3);
  if (!lengths.length) return '古体诗';
  const four = lengths.filter((length) => length === 4).length;
  if (four / lengths.length >= 0.6) return '四言诗';
  const five = lengths.filter((length) => length === 5).length;
  const seven = lengths.filter((length) => length === 7).length;
  if (five === lengths.length) return '五言诗';
  if (seven === lengths.length) return '七言诗';
  return '杂言诗';
}

function valuesFor(text, rules, limit) {
  const values = [];
  for (const [pattern, names] of rules) {
    if (new RegExp(pattern).test(text)) {
      for (const name of names) if (!values.includes(name)) values.push(name);
    }
  }
  return values.slice(0, limit);
}

function themesFor(text, seed = []) {
  const seeded = seed.filter((tag) => THEME_RULES.some(([, names]) => names.includes(tag)));
  const values = [...seeded, ...valuesFor(text, THEME_RULES, 8)];
  return [...new Set(values)].slice(0, 6);
}

function facetsFor({ text, taxonomy, seed = [] }) {
  return {
    ...taxonomy,
    moods: valuesFor(text, MOOD_RULES, 4),
    images: valuesFor(text, IMAGE_RULES, 6),
    seasons: valuesFor(text, SEASON_RULES, 4),
    themes: themesFor(text, seed),
  };
}


function noteFor(title) {
  for (const [key, value] of NOTES) {
    if (String(title).includes(key)) return value;
  }
  return undefined;
}

function chineseRecord({ prefix, index, title, author, kind, lines, source, tags, sourceFile, section, taxonomy }) {
  const text = lines.join('\n');
  const id = `${prefix}-${String(index).padStart(4, '0')}`;
  return {
    id,
    lang: 'zh',
    kind,
    title: clean(title) || '无题',
    author: clean(author) || '佚名',
    section: section ? clean(section) : undefined,
    text,
    excerpt: lines.slice(0, 2).join(' / '),
    source,
    sourceUrl: `${REPO}/blob/master/${encodeURI(sourceFile)}`,
    license: 'Public Domain',
    datasetLicense: 'MIT',
    tags: tagsFor(text, tags),
    facets: facetsFor({ text, taxonomy, seed: tags }),
    note: noteFor(title),
  };
}

function buildChinese() {
  const records = [];
  const sources = [];
  const tang = readJson(path.join(rawDirectory, 'tang300.json'));
  tang.forEach((work, index) => {
    const lines = compactLines(work.paragraphs || []);
    if (!lines.length) return;
    records.push(chineseRecord({
      prefix: 'tang', index, title: work.title, author: work.author, kind: 'poem',
      lines, source: '唐诗三百首', tags: ['唐诗', ...(work.tags || [])],
      sourceFile: '全唐诗/唐诗三百首.json',
      taxonomy: {
        tradition: '中国古典',
        era: '唐',
        genre: '诗',
        form: formFromTags(work.tags) || formFromLines(lines),
        collection: '唐诗三百首',
      },
    }));
  });
  sources.push({ id: 'tang300', name: '唐诗三百首', count: records.length, license: 'Public Domain', datasetLicense: 'MIT', url: REPO });

  const songStart = records.length;
  const song = readJson(path.join(rawDirectory, 'song300.json'));
  song.forEach((work, index) => {
    const lines = compactLines(work.paragraphs || []);
    if (!lines.length) return;
    records.push(chineseRecord({
      prefix: 'song', index, title: work.rhythmic || work.title, author: work.author, kind: 'ci',
      lines, source: '宋词三百首', tags: ['宋词', work.rhythmic, ...(work.tags || [])],
      sourceFile: '宋词/宋词三百首.json',
      section: work.rhythmic,
      taxonomy: {
        tradition: '中国古典',
        era: '宋',
        genre: '词',
        form: '词',
        collection: '宋词三百首',
        section: work.rhythmic ? clean(work.rhythmic) : undefined,
      },
    }));
  });
  sources.push({ id: 'song300', name: '宋词三百首', count: records.length - songStart, license: 'Public Domain', datasetLicense: 'MIT', url: REPO });

  const shijingStart = records.length;
  const shijing = readJson(path.join(rawDirectory, 'shijing.json'));
  shijing.forEach((work, index) => {
    const lines = compactLines(work.content || []);
    if (!lines.length) return;
    const section = [work.chapter, work.section].filter(Boolean).join(' · ');
    records.push(chineseRecord({
      prefix: 'shijing', index, title: work.title, author: '佚名', kind: 'poem',
      lines, source: '诗经', tags: ['诗经', work.chapter, work.section],
      sourceFile: '诗经/shijing.json', section,
      taxonomy: {
        tradition: '中国古典',
        era: '先秦',
        genre: '诗',
        form: formFromLines(lines) === '四言诗' ? '四言诗' : '杂言诗',
        collection: '诗经',
        section: section || undefined,
      },
    }));
  });
  sources.push({ id: 'shijing', name: '诗经', count: records.length - shijingStart, license: 'Public Domain', datasetLicense: 'MIT', url: REPO });

  const chuciStart = records.length;
  const chuci = readJson(path.join(rawDirectory, 'chuci.json'));
  chuci.forEach((work, index) => {
    const lines = compactLines(work.content || []);
    if (!lines.length) return;
    records.push(chineseRecord({
      prefix: 'chuci', index, title: work.title, author: work.author, kind: 'poem',
      lines, source: '楚辞', tags: ['楚辞', work.section],
      sourceFile: '楚辞/chuci.json', section: work.section,
      taxonomy: {
        tradition: '中国古典',
        era: '先秦',
        genre: '诗',
        form: '骚体',
        collection: '楚辞',
        section: work.section ? clean(work.section) : undefined,
      },
    }));
  });
  sources.push({ id: 'chuci', name: '楚辞', count: records.length - chuciStart, license: 'Public Domain', datasetLicense: 'MIT', url: REPO });

  return { records, sources };
}

function buildShakespeare() {
  const raw = fs.readFileSync(path.join(rawDirectory, 'en', 'shakespeare-sonnets.txt'), 'utf8');
  const start = raw.indexOf('THE SONNETS');
  const body = start >= 0 ? raw.slice(start) : raw;
  const lines = body.split(/\r?\n/);
  const sonnets = [];
  let roman = null;
  let buffer = [];
  const flush = () => {
    const text = buffer.join('\n').trim();
    if (roman && text.length > 40) sonnets.push({ roman, text });
    buffer = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[IVXLCDM]+$/.test(trimmed) && trimmed.length <= 7) {
      flush();
      roman = trimmed;
      continue;
    }
    if (roman && trimmed && !/^THE SONNETS|^by William Shakespeare|^\*\*\*/.test(trimmed)) buffer.push(line.replace(/\s+$/, ''));
  }
  flush();
  return sonnets.map((sonnet, index) => ({
    id: `sonnet-${String(index + 1).padStart(3, '0')}`,
    lang: 'en',
    kind: 'poem',
    title: `Sonnet ${sonnet.roman}`,
    author: 'William Shakespeare',
    text: sonnet.text,
    excerpt: sonnet.text.split('\n').slice(0, 2).join(' / '),
    source: "Shakespeare's Sonnets",
    sourceUrl: GUTENBERG,
    license: 'Public Domain',
    datasetLicense: 'Public Domain',
    tags: tagsFor(sonnet.text, ['十四行诗', '莎士比亚', '爱情', '时间']),
    facets: facetsFor({
      text: sonnet.text,
      seed: ['爱情', '时间'],
      taxonomy: {
        tradition: '英国',
        era: '伊丽莎白时代',
        genre: '诗',
        form: '十四行诗',
        collection: '莎士比亚十四行诗',
        section: `Sonnet ${sonnet.roman}`,
      },
    }),
    note: index === 17 ? '第十八首把“你”比作夏天，又一再否定这个比喻。真正的办法不是找一个更美的喻体，而是让诗本身替人活下去。' : undefined,
  }));
}

function facetSummary(records) {
  const scalarKeys = ['tradition', 'era', 'genre', 'form', 'collection'];
  const listKeys = ['moods', 'images', 'seasons', 'themes'];
  const result = {};
  for (const key of scalarKeys) {
    const counts = new Map();
    for (const record of records) {
      const value = record.facets && record.facets[key];
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    result[key] = [...counts].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }
  for (const key of listKeys) {
    const counts = new Map();
    for (const record of records) {
      for (const value of (record.facets && record.facets[key]) || []) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    }
    result[key] = [...counts].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }
  return result;
}

function main() {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const chinese = buildChinese();
  const english = buildShakespeare();
  const records = [...chinese.records, ...english];
  records.sort((a, b) => (a.lang === b.lang ? a.id.localeCompare(b.id) : a.lang.localeCompare(b.lang)));
  const file = path.join(outputDirectory, 'corpus.jsonl');
  fs.writeFileSync(file, records.map((record) => JSON.stringify(record)).join('\n') + '\n', 'utf8');
  const tagCounts = new Map();
  const kindCounts = new Map();
  for (const record of records) {
    kindCounts.set(record.kind, (kindCounts.get(record.kind) || 0) + 1);
    for (const tag of record.tags || []) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
  const manifest = {
    version: 1,
    builtAt: new Date().toISOString(),
    count: records.length,
    bytes: fs.statSync(file).size,
    languages: {
      zh: records.filter((record) => record.lang === 'zh').length,
      en: records.filter((record) => record.lang === 'en').length,
    },
    kinds: Object.fromEntries([...kindCounts].sort((a, b) => b[1] - a[1])),
    facets: facetSummary(records),
    tags: [...tagCounts].sort((a, b) => b[1] - a[1]).slice(0, 80).map(([name, count]) => ({ name, count })),
    sources: [...chinese.sources, { id: 'gutenberg-1041', name: "Shakespeare's Sonnets", count: english.length, license: 'Public Domain', datasetLicense: 'Public Domain', url: GUTENBERG }],
    notes: records.filter((record) => record.note).length,
  };
  fs.writeFileSync(path.join(outputDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`corpus.jsonl: ${records.length} records, ${(manifest.bytes / 1024 / 1024).toFixed(1)} MiB`);
  console.log(`  zh ${manifest.languages.zh} / en ${manifest.languages.en}; notes ${manifest.notes}`);
  console.log(`  kinds ${JSON.stringify(manifest.kinds)}`);
}

main();
