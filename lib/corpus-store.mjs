import fs from 'node:fs';
import path from 'node:path';

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function scoreRecord(record, tokens, phrase) {
  const title = normalize(record.title);
  const author = normalize(record.author);
  const text = normalize(record.text);
  let score = 0;
  if (phrase) {
    if (title.includes(phrase)) score += 18;
    if (author.includes(phrase)) score += 8;
    if (text.includes(phrase)) score += 6;
    if ((record.tags || []).some((tag) => normalize(tag).includes(phrase))) score += 5;
  }
  for (const token of tokens) {
    if (title.includes(token)) score += 9;
    if (author.includes(token)) score += 4;
    if ((record.tags || []).some((tag) => normalize(tag).includes(token))) score += 5;
    const first = text.indexOf(token);
    if (first >= 0) {
      score += 3;
      const second = text.indexOf(token, first + token.length);
      if (second >= 0) score += 1;
    }
  }
  return score;
}

function card(record) {
  return {
    id: record.id,
    lang: record.lang,
    kind: record.kind,
    title: record.title,
    author: record.author,
    section: record.section,
    excerpt: record.excerpt,
    source: record.source,
    license: record.license,
    tags: record.tags,
    facets: record.facets,
    note: record.note,
  };
}

const SCALAR_FACETS = ['tradition', 'era', 'genre', 'form', 'collection'];
const LIST_FACETS = ['moods', 'images', 'seasons', 'themes'];

function matchesFacets(record, facets = {}) {
  const own = record.facets || {};
  for (const key of SCALAR_FACETS) {
    if (facets[key] && own[key] !== facets[key]) return false;
  }
  for (const key of LIST_FACETS) {
    if (facets[key] && !(own[key] || []).includes(facets[key])) return false;
  }
  return true;
}


export function createCorpusStore(directory) {
  let manifest = null;
  let records = null;
  let byId = null;
  let tagCounts = null;

  function ensure() {
    if (records) return;
    const manifestFile = path.join(directory, 'manifest.json');
    const corpusFile = path.join(directory, 'corpus.jsonl');
    if (!fs.existsSync(manifestFile) || !fs.existsSync(corpusFile)) {
      const error = new Error('corpus data is not built yet');
      error.code = 'not_ready';
      throw error;
    }
    manifest = loadJson(manifestFile);
    records = fs.readFileSync(corpusFile, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    byId = new Map(records.map((record) => [record.id, record]));
  }

  function stats() {
    ensure();
    if (tagCounts) return { ...manifest, tags: tagCounts };
    tagCounts = manifest.tags;
    return { ...manifest, tags: tagCounts };
  }

  function filter(record, { lang, kind, author, tags, facets } = {}) {
    if (lang && record.lang !== lang) return false;
    if (kind && record.kind !== kind) return false;
    if (author && !normalize(record.author).includes(normalize(author))) return false;
    if (!matchesFacets(record, facets)) return false;
    if (tags && tags.length) {
      const own = new Set((record.tags || []).map(normalize));
      if (!tags.every((tag) => own.has(normalize(tag)))) return false;
    }
    return true;
  }

  function search({ query = '', lang, kind, author, tags = [], facets = {}, limit = 20, offset = 0 } = {}) {
    ensure();
    const text = String(query || '').trim();
    const phrase = normalize(text);
    const tokens = phrase.split(/\s+/).filter(Boolean);
    const rows = [];
    for (const record of records) {
      if (!filter(record, { lang, kind, author, tags, facets })) continue;
      const score = tokens.length ? scoreRecord(record, tokens, phrase) : 1;
      if (tokens.length && score <= 0) continue;
      rows.push({ record, score });
    }
    rows.sort((a, b) => (b.score - a.score) || a.record.id.localeCompare(b.record.id));
    const total = rows.length;
    const start = Math.max(0, Number(offset) || 0);
    return {
      total,
      offset: start,
      limit,
      results: rows.slice(start, start + limit).map((row) => card(row.record)),
    };
  }

  function passage(id) {
    ensure();
    const record = byId.get(String(id || ''));
    if (!record) return null;
    const tags = new Set(record.tags || []);
    const related = records
      .filter((item) => item.id !== record.id && (
        item.author === record.author || (item.tags || []).some((tag) => tags.has(tag))
      ))
      .slice(0, 8)
      .map(card);
    return { ...record, related };
  }

  function random({ lang, kind, tags = [], facets = {} } = {}) {
    ensure();
    const rows = records.filter((record) => filter(record, { lang, kind, tags, facets }));
    if (!rows.length) return null;
    return card(rows[Math.floor(Math.random() * rows.length)]);
  }

  function sources() {
    ensure();
    return manifest.sources || [];
  }

  return { search, passage, random, stats, sources };
}
