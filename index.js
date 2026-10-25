/**
 * Host half of the Language Atlas bundle.
 *
 * The dictionary ships as JSONL shards plus byte-offset indexes. The literary
 * corpus ships as one JSONL file with a small manifest. Both are served over
 * same-origin POST routes so the Client never bundles them; the corpus is also
 * exposed as a tool so agents can retrieve exemplars before writing.
 */
import { fileURLToPath } from 'node:url';
import { createDictionaryStore } from './lib/dict-store.mjs';
import { createCorpusStore } from './lib/corpus-store.mjs';
import { createProsody } from './lib/prosody.mjs';

const dataDirectory = fileURLToPath(new URL('./data/dict/', import.meta.url));
const corpusDirectory = fileURLToPath(new URL('./data/corpus/', import.meta.url));
const DICT_ROUTE = '/api/lingua-dict/query';
const CORPUS_ROUTE = '/api/lingua-corpus/query';
const PROSODY_ROUTE = '/api/lingua-prosody/query';

function fail(message, code = 'bad_request') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

const SCALAR_FACETS = ['tradition', 'era', 'genre', 'form', 'collection'];
const LIST_FACETS = ['moods', 'images', 'seasons', 'themes'];

function sanitizeFacets(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const facets = {};
  for (const key of SCALAR_FACETS) {
    if (value[key]) facets[key] = String(value[key]).slice(0, 40);
  }
  for (const key of LIST_FACETS) {
    if (value[key]) facets[key] = String(value[key]).slice(0, 40);
  }
  return facets;
}


export function apply(ctx) {
  let dictionaryStore = null;
  let corpusStore = null;
  let prosodyEngine = null;

  function dictionary() {
    if (!dictionaryStore) dictionaryStore = createDictionaryStore(dataDirectory);
    return dictionaryStore;
  }

  function corpus() {
    if (!corpusStore) corpusStore = createCorpusStore(corpusDirectory);
    return corpusStore;
  }

  function prosody() {
    if (!prosodyEngine) prosodyEngine = createProsody({ dictionaryDir: dataDirectory });
    return prosodyEngine;
  }

  async function handleDictionary(request) {
    let payload;
    try {
      payload = await request.json();
    } catch {
      throw fail('request body must be JSON');
    }
    const operation = String(payload?.op || '');
    const store = dictionary();
    if (operation === 'lookup') {
      return store.lookup(String(payload.query || '').slice(0, 120), payload.direction, clamp(payload.limit, 1, 40, 20));
    }
    if (operation === 'entry') {
      const value = store.entry(
        payload.direction === 'en' ? 'en' : 'zh',
        String(payload.word || '').slice(0, 120),
        clamp(payload.relatedOffset, 0, 1000, 0),
      );
      if (!value) throw fail('entry not found', 'not_found');
      return value;
    }
    if (operation === 'browse') {
      return store.browse(payload.direction === 'en' ? 'en' : 'zh', String(payload.letter || 'A').slice(0, 4), clamp(payload.offset, 0, 100000, 0), clamp(payload.limit, 1, 80, 30));
    }
    if (operation === 'random') {
      return store.random(payload.direction === 'en' ? 'en' : 'zh');
    }
    if (operation === 'stats') {
      return store.stats();
    }
    throw fail(`unknown operation: ${operation || '(empty)'}`);
  }

  async function handleCorpus(request) {
    let payload;
    try {
      payload = await request.json();
    } catch {
      throw fail('request body must be JSON');
    }
    const operation = String(payload?.op || '');
    const store = corpus();
    const tags = Array.isArray(payload?.tags) ? payload.tags.map((tag) => String(tag).slice(0, 24)).slice(0, 6) : [];
    const facets = sanitizeFacets(payload?.facets);
    if (operation === 'search') {
      return store.search({
        query: String(payload.query || '').slice(0, 200),
        lang: payload.lang === 'zh' || payload.lang === 'en' ? payload.lang : undefined,
        kind: payload.kind ? String(payload.kind).slice(0, 20) : undefined,
        author: payload.author ? String(payload.author).slice(0, 40) : undefined,
        tags,
        facets,
        limit: clamp(payload.limit, 1, 40, 20),
        offset: clamp(payload.offset, 0, 100000, 0),
      });
    }
    if (operation === 'passage') {
      const value = store.passage(String(payload.id || '').slice(0, 80));
      if (!value) throw fail('passage not found', 'not_found');
      return { ...value, prosody: prosody().analyze(value.text, value.lang) };
    }
    if (operation === 'random') {
      return store.random({
        lang: payload.lang === 'zh' || payload.lang === 'en' ? payload.lang : undefined,
        kind: payload.kind ? String(payload.kind).slice(0, 20) : undefined,
        tags,
        facets,
      });
    }
    if (operation === 'stats') return store.stats();
    if (operation === 'sources') return store.sources();
    throw fail(`unknown operation: ${operation || '(empty)'}`);
  }

  async function handleProsody(request) {
    let payload;
    try {
      payload = await request.json();
    } catch {
      throw fail('request body must be JSON');
    }
    const text = String(payload?.text || '').slice(0, 4000);
    if (!text.trim()) throw fail('text is empty', 'bad_request');
    return prosody().analyze(text, payload?.lang);
  }

  function route(connection, name, path, handler, label) {
    ctx.effect(() => connection.fetch.register({
      path,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        try {
          const value = await handler(request);
          return Response.json({ ok: true, value }, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          const status = error?.code === 'not_ready' ? 503 : error?.code === 'not_found' ? 404 : 400;
          return Response.json({
            ok: false,
            error: { code: error?.code || 'internal', message: String(error?.message || error) },
          }, { status, headers: { 'cache-control': 'no-store' } });
        }
      },
    }), label);
  }

  ctx.inject(['connection'], (ctx) => {
    const connection = ctx.get('connection');
    route(connection, 'dictionary', DICT_ROUTE, handleDictionary, 'lingua-atlas dictionary route');
    route(connection, 'corpus', CORPUS_ROUTE, handleCorpus, 'lingua-atlas corpus route');
    route(connection, 'prosody', PROSODY_ROUTE, handleProsody, 'lingua-atlas prosody route');
  });

  ctx.inject(['tools'], (ctx) => {
    ctx.effect(() => ctx.tools.register({
      name: 'lingua_corpus',
      description: '检索公版中英文学语料。写作前可用它取原文范例：按字词、情绪、意象、体裁、作者找一段，返回原文、出处、许可和可学的手法。不要把它当成搜索引擎；一次取三五段，读完再写。',
      parameters: {
        type: 'object',
        properties: {
          op: {
            type: 'string',
            enum: ['search', 'passage', 'random', 'stats', 'sources'],
            description: 'search 查语料；passage 按 id 取全文；random 随便翻一段；stats 看规模；sources 看来源。',
          },
          query: { type: 'string', description: '字词、意象、情绪或句子片段，例如“月”“离别”“water”。' },
          tags: { type: 'array', items: { type: 'string' }, description: '旧标签筛选；优先用 facets。' },
          facets: {
            type: 'object',
            description: '结构化分类筛选：collection/era/genre/form/theme/mood/image/season，各取一个值。',
            properties: {
              collection: { type: 'string', description: '选集，例如 诗经、楚辞、唐诗三百首、宋词三百首、莎士比亚十四行诗。' },
              era: { type: 'string', description: '时代，例如 先秦、唐、宋、伊丽莎白时代。' },
              genre: { type: 'string', enum: ['诗', '词'], description: '大类。' },
              form: { type: 'string', description: '体裁，例如 四言诗、骚体、五言律诗、七言绝句、词、十四行诗。' },
              theme: { type: 'string', description: '主题，例如 爱情、山水、边塞、思乡、送别、怀古。' },
              mood: { type: 'string', description: '情绪，例如 怅惘、思念、欢愉、闲适、悲愤。' },
              image: { type: 'string', description: '意象，例如 月、水、山、雨雪、花木、酒、舟船。' },
              season: { type: 'string', description: '时节，例如 春、夏、秋、冬、夜。' },
            },
            additionalProperties: false,
          },
          lang: { type: 'string', enum: ['zh', 'en'], description: '语言。' },
          kind: { type: 'string', description: '体裁：poem、ci。' },
          author: { type: 'string', description: '作者名。' },
          limit: { type: 'number', description: '返回条数，1–40，默认 20。' },
          offset: { type: 'number', description: '分页偏移。' },
          id: { type: 'string', description: 'passage 操作需要的记录 id。' },
        },
        required: ['op'],
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            value: {},
          },
          additionalProperties: true,
        },
        render(args, value) {
          return [{ type: 'text', text: JSON.stringify(value, null, 2) }];
        },
      },
      timeoutMs: 15000,
      async execute(args) {
        const payload = args && typeof args === 'object' ? args : {};
        const operation = String(payload.op || '');
        const tags = Array.isArray(payload.tags) ? payload.tags.map((tag) => String(tag).slice(0, 24)).slice(0, 6) : [];
        const facets = sanitizeFacets(payload.facets);
        const store = corpus();
        if (operation === 'search') {
          return store.search({
            query: String(payload.query || '').slice(0, 200),
            lang: payload.lang === 'zh' || payload.lang === 'en' ? payload.lang : undefined,
            kind: payload.kind ? String(payload.kind).slice(0, 20) : undefined,
            author: payload.author ? String(payload.author).slice(0, 40) : undefined,
            tags,
            facets,
            limit: clamp(payload.limit, 1, 40, 20),
            offset: clamp(payload.offset, 0, 100000, 0),
          });
        }
        if (operation === 'passage') {
          const value = store.passage(String(payload.id || '').slice(0, 80));
          if (!value) throw fail('passage not found', 'not_found');
          return value;
        }
        if (operation === 'random') {
          return store.random({
            lang: payload.lang === 'zh' || payload.lang === 'en' ? payload.lang : undefined,
            kind: payload.kind ? String(payload.kind).slice(0, 20) : undefined,
            tags,
            facets,
          });
        }
        if (operation === 'stats') return store.stats();
        if (operation === 'sources') return store.sources();
        throw fail(`unknown operation: ${operation || '(empty)'}`);
      },
    }), 'lingua-atlas corpus tool');
  });
}
