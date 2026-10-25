/**
 * Pure atlas logic: search, language filtering, cognate grouping, relations.
 *
 * No browser or Harness APIs here, so the same functions run under Node in
 * `test/logic.test.mjs` and are inlined into the Client bundle at build time.
 */

const LATIN_SCRIPT = new Set(['en', 'fr', 'de', 'es', 'la', 'nl', 'tr', 'it']);
const RTL = new Set(['ar', 'fa', 'he']);
const RELATION_TYPES = ['synonym', 'antonym', 'hypernym', 'hyponym', 'related'];
export const PALETTE = ['#4C8DFF', '#E8A33D', '#46B37E', '#B57BEE', '#E46A6A', '#3FB6C4'];
const GRAPH = { cx: 360, cy: 200, outerRx: 268, outerRy: 142, innerRx: 176, innerRy: 92 };

const MARKS =
  /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\u0591-\u05c7\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;

export function normalize(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .normalize('NFD')
    .replace(MARKS, '')
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isRtl(langId) {
  return RTL.has(langId);
}

export function needsRoman(langId) {
  return !LATIN_SCRIPT.has(langId);
}

export function visibleLanguages(data) {
  return data.languages.filter((lang) => !lang.hidden);
}

export function hiddenLanguages(data) {
  return data.languages.filter((lang) => lang.hidden);
}

export function languageIndex(data) {
  const index = {};
  for (const lang of data.languages) index[lang.id] = lang;
  return index;
}

export function conceptIndex(data) {
  const index = {};
  for (const concept of data.concepts) index[concept.id] = concept;
  return index;
}

export function originIndex(data) {
  const index = {};
  for (const origin of data.origins) index[origin.id] = origin;
  return index;
}

export function fieldIndex(data) {
  const index = {};
  for (const field of data.fields) index[field.id] = field;
  return index;
}

export function routeIndex(data) {
  const index = {};
  for (const route of data.routes || []) index[route.id] = route;
  return index;
}

export function conceptById(data, id) {
  return conceptIndex(data)[id];
}

export function originById(data, id) {
  return originIndex(data)[id];
}

export function fieldById(data, id) {
  return fieldIndex(data)[id];
}

export function pick(record, locale, key, fallbackKey) {
  if (!record) return '';
  const primary = record[key];
  const fallback = record[fallbackKey];
  return locale === 'zh' ? primary || fallback || '' : fallback || primary || '';
}

export function localizedTitle(concept, locale) {
  return pick(concept && concept.title, locale, 'zh', 'en');
}

export function localizedGloss(entry, locale) {
  if (!entry) return '';
  return locale === 'zh' ? entry.gloss || entry.glossEn || '' : entry.glossEn || entry.gloss || '';
}

export function selectedLangSet(langIds) {
  if (!langIds || langIds.length === 0) return null;
  return new Set(langIds);
}

export function visibleEntries(concept, langIds) {
  const wanted = selectedLangSet(langIds);
  if (!wanted) return concept.entries.slice();
  return concept.entries.filter((entry) => wanted.has(entry.lang));
}

export function conceptLangIds(concept) {
  return concept.entries.map((entry) => entry.lang);
}

export function entryOf(concept, langId) {
  return concept.entries.find((entry) => entry.lang === langId);
}

export function groupOrigins(concept, langIds) {
  const index = {};
  for (const entry of visibleEntries(concept, langIds)) {
    if (!entry.origin) continue;
    if (!index[entry.origin]) index[entry.origin] = [];
    index[entry.origin].push(entry);
  }
  return Object.keys(index)
    .map((id) => ({ id, entries: index[id] }))
    .filter((group) => group.entries.length >= 2)
    .sort((a, b) => b.entries.length - a.entries.length || a.id.localeCompare(b.id));
}

export function familyMembers(data, originId) {
  const members = [];
  for (const concept of data.concepts) {
    for (const entry of concept.entries) {
      if (entry.origin === originId) members.push({ concept, entry });
    }
  }
  return members;
}

export function familyCards(data, langIds) {
  const wanted = selectedLangSet(langIds);
  return (data.origins || [])
    .map((origin) => {
      const members = familyMembers(data, origin.id).filter(
        (member) => !wanted || wanted.has(member.entry.lang),
      );
      return { origin, members };
    })
    .filter((card) => card.members.length >= 2)
    .sort((a, b) => b.members.length - a.members.length || a.origin.id.localeCompare(b.origin.id));
}

export function relationsOf(data, concept) {
  const concepts = conceptIndex(data);
  return (concept.relations || [])
    .map((relation) => ({ ...relation, concept: concepts[relation.target] }))
    .filter((relation) => relation.concept);
}

export function sameField(data, concept, langIds) {
  const wanted = selectedLangSet(langIds);
  return data.concepts.filter((other) => {
    if (other.id === concept.id) return false;
    if (other.field !== concept.field) return false;
    if (!wanted) return true;
    return other.entries.some((entry) => wanted.has(entry.lang));
  });
}

export function routeById(data, id) {
  return (data.routes || []).find((route) => route.id === id);
}

export function stats(data) {
  const languages = visibleLanguages(data);
  return {
    concepts: data.concepts.length,
    languages: languages.length,
    entries: data.concepts.reduce((sum, concept) => sum + concept.entries.length, 0),
    families: (data.origins || []).filter((origin) => familyMembers(data, origin.id).length >= 2)
      .length,
    routes: (data.routes || []).length,
  };
}

function collectText(data, concept) {
  const index = originIndex(data);
  const texts = [];
  const push = (value, weight) => {
    if (value) texts.push([normalize(value), weight]);
  };

  push(concept.id, 85);
  push(concept.title.zh, 100);
  push(concept.title.en, 95);
  push(concept.gloss.zh, 55);
  push(concept.gloss.en, 45);

  const field = fieldById(data, concept.field);
  if (field) {
    push(field.label, 20);
    push(field.labelEn, 18);
  }

  for (const entry of concept.entries) {
    push(entry.word, 90);
    push(entry.roman, 70);
    push(entry.gloss, 55);
    push(entry.glossEn, 45);
    push(entry.note, 30);
    const origin = entry.origin ? index[entry.origin] : null;
    if (origin) {
      push(origin.label, 28);
      push(origin.labelEn, 26);
    }
  }

  return texts;
}

function scoreToken(texts, token) {
  let best = 0;
  for (const [text, weight] of texts) {
    if (!text) continue;
    let ratio = 0;
    if (text === token) ratio = 1;
    else if (text.startsWith(token)) ratio = 0.8;
    else if (text.split(' ').some((part) => part === token)) ratio = 0.9;
    else if (text.includes(token)) ratio = 0.6;
    if (ratio && weight * ratio > best) best = weight * ratio;
  }
  return best;
}

export function scoreConcept(data, concept, query) {
  const normalized = normalize(query);
  if (!normalized) return 1;
  const tokens = normalized.split(' ').filter(Boolean);
  const texts = collectText(data, concept);
  let score = 0;
  for (const token of tokens) {
    const tokenScore = scoreToken(texts, token);
    if (!tokenScore) return 0;
    score += tokenScore;
  }
  return score;
}

export function searchConcepts(data, query, options) {
  const opts = options || {};
  const field = opts.field || null;
  const langIds = opts.langs || null;
  const wanted = selectedLangSet(langIds);
  const results = [];

  data.concepts.forEach((concept, order) => {
    if (field && concept.field !== field) return;
    if (wanted && !concept.entries.some((entry) => wanted.has(entry.lang))) return;
    const score = scoreConcept(data, concept, query);
    if (!score) return;
    results.push({ concept, score, order });
  });

  results.sort((a, b) => b.score - a.score || a.order - b.order);
  return results.map((result) => result.concept);
}

export function fieldCounts(data, langIds) {
  const wanted = selectedLangSet(langIds);
  const counts = {};
  for (const concept of data.concepts) {
    const ok = !wanted || concept.entries.some((entry) => wanted.has(entry.lang));
    if (!ok) continue;
    counts[concept.field] = (counts[concept.field] || 0) + 1;
  }
  return counts;
}

/**
 * Geometry for the cognate constellation. Pure: returns SVG-ready nodes and
 * edges, with alternating rings so neighbouring labels do not collide.
 */
export function buildConstellation(entries, groups) {
  const { cx, cy, outerRx, outerRy, innerRx, innerRy } = GRAPH;
  const nodes = [];
  const colorOf = {};
  const groupOf = {};

  groups.forEach((group, groupIndex) => {
    for (const entry of group.entries) {
      colorOf[entry.lang] = PALETTE[groupIndex % PALETTE.length];
      groupOf[entry.lang] = group.id;
    }
  });

  entries.forEach((entry, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / entries.length;
    const outer = index % 2 === 0;
    const x = cx + (outer ? outerRx : innerRx) * Math.cos(angle);
    const y = cy + (outer ? outerRy : innerRy) * Math.sin(angle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let anchor = 'middle';
    let labelX = x;
    let labelY = y + 18;

    if (cos > 0.3) {
      anchor = 'start';
      labelX = x + 9;
      labelY = y + 5;
    } else if (cos < -0.3) {
      anchor = 'end';
      labelX = x - 9;
      labelY = y + 5;
    } else if (sin > 0.5) {
      labelY = y + 19;
    } else if (sin < -0.5) {
      labelY = y - 18;
    }

    nodes.push({
      entry,
      x,
      y,
      anchor,
      labelX,
      labelY,
      color: colorOf[entry.lang],
      group: groupOf[entry.lang],
    });
  });

  const edges = [];
  groups.forEach((group, groupIndex) => {
    const members = nodes
      .filter((node) => node.group === group.id)
      .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    for (let index = 0; index < members.length - 1; index += 1) {
      const a = members[index];
      const b = members[index + 1];
      edges.push({
        key: `${group.id}-${index}`,
        group: group.id,
        color: PALETTE[groupIndex % PALETTE.length],
        d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
      });
    }
  });

  return { nodes, edges };
}

