window.__ModuleLoader__.load({
  id: '@local/dsh-lingua-atlas',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useMemo, useEffect, useRef, useCallback } = React;

    /**
 * Pure atlas logic: search, language filtering, cognate grouping, relations.
 *
 * No browser or Harness APIs here, so the same functions run under Node in
 * `test/logic.test.mjs` and are inlined into the Client bundle at build time.
 */

const LATIN_SCRIPT = new Set(['en', 'fr', 'de', 'es', 'la', 'nl', 'tr', 'it']);
const RTL = new Set(['ar', 'fa', 'he']);
const RELATION_TYPES = ['synonym', 'antonym', 'hypernym', 'hyponym', 'related'];
const PALETTE = ['#4C8DFF', '#E8A33D', '#46B37E', '#B57BEE', '#E46A6A', '#3FB6C4'];
const GRAPH = { cx: 360, cy: 200, outerRx: 268, outerRy: 142, innerRx: 176, innerRy: 92 };

const MARKS =
  /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\u0591-\u05c7\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;

function normalize(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .normalize('NFD')
    .replace(MARKS, '')
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRtl(langId) {
  return RTL.has(langId);
}

function needsRoman(langId) {
  return !LATIN_SCRIPT.has(langId);
}

function visibleLanguages(data) {
  return data.languages.filter((lang) => !lang.hidden);
}

function hiddenLanguages(data) {
  return data.languages.filter((lang) => lang.hidden);
}

function languageIndex(data) {
  const index = {};
  for (const lang of data.languages) index[lang.id] = lang;
  return index;
}

function conceptIndex(data) {
  const index = {};
  for (const concept of data.concepts) index[concept.id] = concept;
  return index;
}

function originIndex(data) {
  const index = {};
  for (const origin of data.origins) index[origin.id] = origin;
  return index;
}

function fieldIndex(data) {
  const index = {};
  for (const field of data.fields) index[field.id] = field;
  return index;
}

function routeIndex(data) {
  const index = {};
  for (const route of data.routes || []) index[route.id] = route;
  return index;
}

function conceptById(data, id) {
  return conceptIndex(data)[id];
}

function originById(data, id) {
  return originIndex(data)[id];
}

function fieldById(data, id) {
  return fieldIndex(data)[id];
}

function pick(record, locale, key, fallbackKey) {
  if (!record) return '';
  const primary = record[key];
  const fallback = record[fallbackKey];
  return locale === 'zh' ? primary || fallback || '' : fallback || primary || '';
}

function localizedTitle(concept, locale) {
  return pick(concept && concept.title, locale, 'zh', 'en');
}

function localizedGloss(entry, locale) {
  if (!entry) return '';
  return locale === 'zh' ? entry.gloss || entry.glossEn || '' : entry.glossEn || entry.gloss || '';
}

function selectedLangSet(langIds) {
  if (!langIds || langIds.length === 0) return null;
  return new Set(langIds);
}

function visibleEntries(concept, langIds) {
  const wanted = selectedLangSet(langIds);
  if (!wanted) return concept.entries.slice();
  return concept.entries.filter((entry) => wanted.has(entry.lang));
}

function conceptLangIds(concept) {
  return concept.entries.map((entry) => entry.lang);
}

function entryOf(concept, langId) {
  return concept.entries.find((entry) => entry.lang === langId);
}

function groupOrigins(concept, langIds) {
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

function familyMembers(data, originId) {
  const members = [];
  for (const concept of data.concepts) {
    for (const entry of concept.entries) {
      if (entry.origin === originId) members.push({ concept, entry });
    }
  }
  return members;
}

function familyCards(data, langIds) {
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

function relationsOf(data, concept) {
  const concepts = conceptIndex(data);
  return (concept.relations || [])
    .map((relation) => ({ ...relation, concept: concepts[relation.target] }))
    .filter((relation) => relation.concept);
}

function sameField(data, concept, langIds) {
  const wanted = selectedLangSet(langIds);
  return data.concepts.filter((other) => {
    if (other.id === concept.id) return false;
    if (other.field !== concept.field) return false;
    if (!wanted) return true;
    return other.entries.some((entry) => wanted.has(entry.lang));
  });
}

function routeById(data, id) {
  return (data.routes || []).find((route) => route.id === id);
}

function stats(data) {
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

function scoreConcept(data, concept, query) {
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

function searchConcepts(data, query, options) {
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

function fieldCounts(data, langIds) {
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
function buildConstellation(entries, groups) {
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



    const DATA = {"version":1,"languages":[{"id":"zh","label":"中文","native":"中文","en":"Chinese","roman":"拼音","dir":"ltr"},{"id":"en","label":"英语","native":"English","en":"English","roman":"—","dir":"ltr"},{"id":"ja","label":"日语","native":"日本語","en":"Japanese","roman":"罗马字","dir":"ltr"},{"id":"ko","label":"韩语","native":"한국어","en":"Korean","roman":"罗马字","dir":"ltr"},{"id":"fr","label":"法语","native":"français","en":"French","roman":"—","dir":"ltr"},{"id":"de","label":"德语","native":"Deutsch","en":"German","roman":"—","dir":"ltr"},{"id":"es","label":"西班牙语","native":"español","en":"Spanish","roman":"—","dir":"ltr"},{"id":"ru","label":"俄语","native":"русский","en":"Russian","roman":"转写","dir":"ltr"},{"id":"ar","label":"阿拉伯语","native":"العربية","en":"Arabic","roman":"转写","dir":"rtl"},{"id":"hi","label":"印地语","native":"हिन्दी","en":"Hindi","roman":"转写","dir":"ltr"},{"id":"fa","label":"波斯语","native":"فارسی","en":"Persian","roman":"转写","dir":"rtl"},{"id":"he","label":"希伯来语","native":"עברית","en":"Hebrew","roman":"转写","dir":"rtl"},{"id":"la","label":"拉丁语","native":"lingua Latina","en":"Latin","roman":"—","dir":"ltr"},{"id":"grc","label":"古希腊语","native":"ἑλληνική","en":"Ancient Greek","roman":"转写","dir":"ltr"},{"id":"sa","label":"梵语","native":"संस्कृतम्","en":"Sanskrit","roman":"转写","dir":"ltr","hidden":true},{"id":"nl","label":"荷兰语","native":"Nederlands","en":"Dutch","roman":"—","dir":"ltr","hidden":true},{"id":"tr","label":"土耳其语","native":"Türkçe","en":"Turkish","roman":"—","dir":"ltr","hidden":true},{"id":"it","label":"意大利语","native":"italiano","en":"Italian","roman":"—","dir":"ltr","hidden":true}],"fields":[{"id":"nature","label":"自然万物","labelEn":"Nature"},{"id":"plant","label":"草木","labelEn":"Plants"},{"id":"animal","label":"动物","labelEn":"Animals"},{"id":"body","label":"身体","labelEn":"Body"},{"id":"kin","label":"亲属","labelEn":"Kinship"},{"id":"mind","label":"情感","labelEn":"Mind & feeling"},{"id":"time","label":"时间","labelEn":"Time"},{"id":"speech","label":"语言符号","labelEn":"Language & signs"},{"id":"food","label":"饮食","labelEn":"Food & drink"},{"id":"material","label":"物质","labelEn":"Materials"},{"id":"society","label":"社会","labelEn":"Society"}],"origins":[{"id":"pie-wodr","label":"原始印欧语 *wódr̥","labelEn":"PIE *wódr̥","kind":"inherited","note":"“水”的古老词根，英语 water、德语 Wasser、俄语 вода、希腊语 ὕδωρ 同出一源。"},{"id":"latin-aqua","label":"拉丁语 aqua","labelEn":"Latin aqua","kind":"inherited","note":"罗马人的“水”，在法语 eau、西班牙语 agua 中继续演化。"},{"id":"semitic-may","label":"原始闪米特语 *may-","labelEn":"Proto-Semitic *may-","kind":"inherited","note":"阿拉伯语 ماء 与希伯来语 מים 同源，希伯来语保留双数/复数形式。"},{"id":"pie-peh2wr","label":"原始印欧语 *péh₂wr̥","labelEn":"PIE *péh₂wr̥","kind":"inherited","note":"“火”的词根，英语 fire、德语 Feuer、希腊语 πῦρ 同源，英语 pyre 亦由此来。"},{"id":"pie-ngwni","label":"原始印欧语 *h₁n̥gʷnis","labelEn":"PIE *h₁n̥gʷnis","kind":"inherited","note":"另一支“火”的词根：拉丁 ignis、俄语 огонь、印地语 आग、梵语 agni 同源。"},{"id":"pie-meh1ns","label":"原始印欧语 *mḗh₁n̥s","labelEn":"PIE *mḗh₁n̥s","kind":"inherited","note":"“月亮”与“月份”共用一词根，英语 moon、德语 Mond、波斯语 ماه 同源。"},{"id":"pie-lewk","label":"原始印欧语 *lowk-s-neh₂","labelEn":"PIE *lowk-s-neh₂","kind":"inherited","note":"“光”的词根：拉丁 lūna、法语 lune、西班牙语 luna、俄语 луна 同源。"},{"id":"pie-soh2wl","label":"原始印欧语 *sóh₂wl̥","labelEn":"PIE *sóh₂wl̥","kind":"inherited","note":"“太阳”的词根，英语 sun、德语 Sonne、俄语 солнце、梵语 सूर्य 同源。"},{"id":"latin-sol","label":"拉丁语 sōl","labelEn":"Latin sōl","kind":"inherited","note":"拉丁语的“太阳”，延续为法语 soleil、西班牙语 sol。"},{"id":"semitic-shams","label":"原始闪米特语 *šamš-","labelEn":"Proto-Semitic *šamš-","kind":"inherited","note":"阿拉伯语 شمس 与希伯来语 שמש 同源，都是“太阳”。"},{"id":"pie-h2ster","label":"原始印欧语 *h₂stḗr","labelEn":"PIE *h₂stḗr","kind":"inherited","note":"“星”的词根，英语 star、德语 Stern、希腊语 ἀστήρ 同源。"},{"id":"latin-stella","label":"拉丁语 stella","labelEn":"Latin stella","kind":"inherited","note":"拉丁语的“星”，演化为法语 étoile、西班牙语 estrella。"},{"id":"latin-pluvia","label":"拉丁语 pluvia","labelEn":"Latin pluvia","kind":"inherited","note":"拉丁语的“雨”，经通俗拉丁语进入法语 pluie、西班牙语 lluvia。"},{"id":"persian-baresh","label":"波斯语 بارش","labelEn":"Persian bāresh","kind":"loan","note":"波斯语“降雨”进入印地语，成为口语里的 बारिश。"},{"id":"pie-h2weh1","label":"原始印欧语 *h₂wéh₁-","labelEn":"PIE *h₂wéh₁-","kind":"inherited","note":"“吹、风”的词根，英语 wind、拉丁 ventus、俄语 ветер 同源。"},{"id":"germanic-regn","label":"原始日耳曼语 *regnaz","labelEn":"Proto-Germanic *regnaz","kind":"inherited","note":"“雨”的日耳曼词，英语 rain 与德语 Regen 同源。"},{"id":"germanic-hand","label":"原始日耳曼语 *handuz","labelEn":"Proto-Germanic *handuz","kind":"inherited","note":"“手”的日耳曼词，英语 hand 与德语 Hand 同源，在其他印欧语族中没有对应词。"},{"id":"semitic-rih","label":"原始闪米特语 *rīḥ-","labelEn":"Proto-Semitic *rīḥ-","kind":"inherited","note":"阿拉伯语 ريح 与希伯来语 רוח 同源，兼指“风”与“气息、灵”。"},{"id":"latin-arbor","label":"拉丁语 arbor","labelEn":"Latin arbor","kind":"inherited","note":"拉丁语的“树”，成为法语 arbre、西班牙语 árbol。"},{"id":"latin-flos","label":"拉丁语 flōs","labelEn":"Latin flōs","kind":"inherited","note":"拉丁语的“花”，英语 flower 是借词，法语 fleur、西班牙语 flor 是直系后代。"},{"id":"latin-avis","label":"拉丁语 avis","labelEn":"Latin avis","kind":"inherited","note":"拉丁语的“鸟”，西班牙语 ave 直接继承，法语 oiseau 来自指小形式 avicellus。"},{"id":"pie-peysk","label":"原始印欧语 *peysk-","labelEn":"PIE *peysk-","kind":"inherited","note":"“鱼”的词根，英语 fish、德语 Fisch 同源；拉丁 piscis 是另一支同源词。"},{"id":"latin-piscis","label":"拉丁语 piscis","labelEn":"Latin piscis","kind":"inherited","note":"拉丁语的“鱼”，演化为法语 poisson、西班牙语 pez。"},{"id":"late-latin-caballus","label":"通俗拉丁语 caballus","labelEn":"Vulgar Latin caballus","kind":"inherited","note":"原指“驽马”，后来取代 equus，成为法语 cheval、西班牙语 caballo。"},{"id":"pie-ekwos","label":"原始印欧语 *h₁éḱwos","labelEn":"PIE *h₁éḱwos","kind":"inherited","note":"“马”的古词根，拉丁 equus 与希腊 ἵππος 同源，英语 equine 亦由此来。"},{"id":"latin-canis","label":"拉丁语 canis","labelEn":"Latin canis","kind":"inherited","note":"拉丁语的“狗”，法语 chien 由其演化，英语 canine 是借词。"},{"id":"semitic-kalb","label":"原始闪米特语 *kalb-","labelEn":"Proto-Semitic *kalb-","kind":"inherited","note":"阿拉伯语 كلب 与希伯来语 כלב 同源。"},{"id":"pie-h3okw","label":"原始印欧语 *h₃ekʷ-","labelEn":"PIE *h₃ekʷ-","kind":"inherited","note":"“眼睛”的词根，英语 eye、拉丁 oculus、印地语 आँख 同源。"},{"id":"semitic-ayn","label":"原始闪米特语 *ʿayn-","labelEn":"Proto-Semitic *ʿayn-","kind":"inherited","note":"阿拉伯语 عين 与希伯来语 עין 同源，也都兼指“泉眼”。"},{"id":"latin-manus","label":"拉丁语 manus","labelEn":"Latin manus","kind":"inherited","note":"拉丁语的“手”，演化为法语 main、西班牙语 mano。"},{"id":"semitic-yad","label":"原始闪米特语 *yad-","labelEn":"Proto-Semitic *yad-","kind":"inherited","note":"阿拉伯语 يد 与希伯来语 יד 同源。"},{"id":"pie-kerd","label":"原始印欧语 *ḱerd-","labelEn":"PIE *ḱerd-","kind":"inherited","note":"“心”的词根，横跨日耳曼、罗曼、斯拉夫、印度-伊朗与希腊语。"},{"id":"semitic-libb","label":"原始闪米特语 *libb-","labelEn":"Proto-Semitic *libb-","kind":"inherited","note":"阿拉伯语 قلب 与希伯来语 לב 同源，都兼指“心”与“内心”。"},{"id":"pie-mater","label":"原始印欧语 *méh₂tēr","labelEn":"PIE *méh₂tēr","kind":"inherited","note":"“母亲”的词根，从英语 mother 一直延伸到波斯语 مادر 与印地语 माँ。"},{"id":"semitic-umm","label":"原始闪米特语 *ʾumm-","labelEn":"Proto-Semitic *ʾumm-","kind":"inherited","note":"阿拉伯语 أم 与希伯来语 אם 同源。"},{"id":"pie-pater","label":"原始印欧语 *ph₂tḗr","labelEn":"PIE *ph₂tḗr","kind":"inherited","note":"“父亲”的词根，英语 father、拉丁 pater、希腊 πατήρ 同源。"},{"id":"semitic-ab","label":"原始闪米特语 *ʾab-","labelEn":"Proto-Semitic *ʾab-","kind":"inherited","note":"阿拉伯语 أب 与希伯来语 אב 同源。"},{"id":"latin-infans","label":"拉丁语 infans","labelEn":"Latin infans","kind":"inherited","note":"字面“不会说话的”，是英语 infant 与法语 enfant 的来源。"},{"id":"pie-leubh","label":"原始印欧语 *lewbʰ-","labelEn":"PIE *lewbʰ-","kind":"inherited","note":"“爱、欲望”的词根，英语 love、德语 Liebe、俄语 любовь 同源。"},{"id":"latin-amor","label":"拉丁语 amor","labelEn":"Latin amor","kind":"inherited","note":"拉丁语的“爱”，演化为法语 amour、西班牙语 amor。"},{"id":"pie-nokw","label":"原始印欧语 *nókʷts","labelEn":"PIE *nókʷts","kind":"inherited","note":"“夜”的词根，英语 night、拉丁 nox、希腊 νύξ、俄语 ночь 同源。"},{"id":"semitic-layl","label":"原始闪米特语 *layl-","labelEn":"Proto-Semitic *layl-","kind":"inherited","note":"阿拉伯语 ليل 与希伯来语 לילה 同源。"},{"id":"pie-yer","label":"原始印欧语 *yḗr-","labelEn":"PIE *yḗr-","kind":"inherited","note":"“年、季节”的词根，英语 year 与德语 Jahr 同源。"},{"id":"latin-annus","label":"拉丁语 annus","labelEn":"Latin annus","kind":"inherited","note":"拉丁语的“年”，演化为法语 an、西班牙语 año，英语 annual 是借词。"},{"id":"persian-sal","label":"波斯语 سال","labelEn":"Persian sāl","kind":"loan","note":"波斯语“年”进入印地语口语，成为 साल。"},{"id":"semitic-shanah","label":"原始闪米特语 *šan-","labelEn":"Proto-Semitic *šan-","kind":"inherited","note":"阿拉伯语 سنة 与希伯来语 שנה 同源。"},{"id":"pie-nomn","label":"原始印欧语 *h₁nómn̥","labelEn":"PIE *h₁nómn̥","kind":"inherited","note":"“名字”的词根，英语 name、拉丁 nōmen、希腊 ὄνομα、俄语 имя 同源。"},{"id":"semitic-ism","label":"原始闪米特语 *šim-","labelEn":"Proto-Semitic *šim-","kind":"inherited","note":"阿拉伯语 اسم 与希伯来语 שם 同源。"},{"id":"pie-werh1","label":"原始印欧语 *werh₁-","labelEn":"PIE *werh₁-","kind":"inherited","note":"“说”的词根，英语 word、德语 Wort、拉丁 verbum 同源。"},{"id":"latin-lingua","label":"拉丁语 lingua","labelEn":"Latin lingua","kind":"inherited","note":"拉丁语的“舌头、语言”，英语 language 经古法语借入，法语 langue、西班牙语 lengua 为直系后代。"},{"id":"latin-liber","label":"拉丁语 liber","labelEn":"Latin liber","kind":"inherited","note":"原义“树皮”，古人以树皮书写，遂有“书”义；演化为法语 livre、西班牙语 libro。"},{"id":"arabic-kitab","label":"阿拉伯语 كتاب","labelEn":"Arabic kitāb","kind":"loan","note":"阿拉伯语“书”进入波斯语（ketāb）与印地语（kitāb），也见于马来语 kitab。"},{"id":"loan-tea-te","label":"海路：闽南语 tê","labelEn":"Sea route: Hokkien tê","kind":"loan","note":"闽南语“茶”读 tê，经荷兰语 thee 进入英语 tea、法语 thé、德语 Tee、西班牙语 té。"},{"id":"loan-tea-cha","label":"陆路：官话 chá","labelEn":"Land route: Mandarin chá","kind":"loan","note":"官话“茶”经北方商路进入俄语 чай、阿拉伯语 شاي、波斯语 چای、印地语 चाय，以及日韩的 茶/차。"},{"id":"loan-sugar","label":"梵语 śarkarā 的环球旅行","labelEn":"Sanskrit śarkarā around the world","kind":"loan","note":"梵语“砂粒”经波斯语 شکر、阿拉伯语 سكّر、拉丁语 saccharum，变成欧洲各语言的 sugar/sucre/Zucker/azúcar/сахар。"},{"id":"pie-woyno","label":"原始印欧语 *wóy-no-","labelEn":"PIE *wóy-no-","kind":"inherited","note":"“酒”的词根，可能借自地中海某非印欧语言；拉丁 vīnum 把它带到英语 wine、德语 Wein、俄语 вино。"},{"id":"loan-coffee","label":"阿拉伯语 قهوة","labelEn":"Arabic qahwa","kind":"loan","note":"也门咖啡经奥斯曼土耳其 kahve、意大利 caffè、法语 café，传遍欧洲与东亚。"},{"id":"pie-ghelh3","label":"原始印欧语 *ǵʰelh₃-","labelEn":"PIE *ǵʰelh₃-","kind":"inherited","note":"“黄、金”的词根，英语 gold、德语 Gold、俄语 золото 同源。"},{"id":"latin-aurum","label":"拉丁语 aurum","labelEn":"Latin aurum","kind":"inherited","note":"拉丁语的“金”，演化为法语 or、西班牙语 oro，英语 aureate 是借词。"},{"id":"semitic-dhahab","label":"原始闪米特语 *ḏahab-","labelEn":"Proto-Semitic *ḏahab-","kind":"inherited","note":"阿拉伯语 ذهب 与希伯来语 זהב 同源。"},{"id":"germanic-kuningaz","label":"原始日耳曼语 *kuningaz","labelEn":"Proto-Germanic *kuningaz","kind":"inherited","note":"“王”的日耳曼词，英语 king 与德语 König 同源。"},{"id":"latin-rex","label":"拉丁语 rex","labelEn":"Latin rex","kind":"inherited","note":"拉丁语的“王”，演化为法语 roi、西班牙语 rey，英语 regal 是借词。"},{"id":"semitic-malik","label":"原始闪米特语 *malk-","labelEn":"Proto-Semitic *malk-","kind":"inherited","note":"阿拉伯语 ملك 与希伯来语 מלך 同源。"}],"routes":[{"id":"tea","title":{"zh":"茶：一个汉字，两条商路","en":"Tea: one character, two trade routes"},"intro":{"zh":"同一片叶子沿陆路与海路旅行，带走了两种读音。英语 tea 来自闽南语的 tê，俄语 чай 来自官话的 chá。","en":"The same leaf travelled by land and by sea, carrying two different readings: English tea from Hokkien tê, Russian чай from Mandarin chá."},"branches":[{"label":{"zh":"海路 · 闽南语 tê","en":"Sea route · Hokkien tê"},"steps":[{"lang":"zh","word":"茶","roman":"tê","note":{"zh":"闽南语白读，荷兰商人记作 thee。","en":"Hokkien reading, recorded by Dutch traders as thee."}},{"lang":"nl","word":"thee"},{"lang":"en","word":"tea"},{"lang":"fr","word":"thé"},{"lang":"de","word":"Tee"},{"lang":"es","word":"té"}]},{"label":{"zh":"陆路 · 官话 chá","en":"Land route · Mandarin chá"},"steps":[{"lang":"zh","word":"茶","roman":"chá","note":{"zh":"官话读音，随北方商路西行。","en":"Mandarin reading, carried west along the northern routes."}},{"lang":"ru","word":"чай","roman":"chay"},{"lang":"ar","word":"شاي","roman":"shāy"},{"lang":"fa","word":"چای","roman":"chāy"},{"lang":"hi","word":"चाय","roman":"chāy"},{"lang":"ja","word":"茶","roman":"cha"},{"lang":"ko","word":"차","roman":"cha"}]}]},{"id":"sugar","title":{"zh":"糖：从“砂粒”到砂糖","en":"Sugar: from “gravel” to sweetness"},"intro":{"zh":"梵语 śarkarā 本指“砂粒、碎石”，指蔗糖结晶。它经波斯、阿拉伯与拉丁语一路西行，最后落在欧洲每一种语言的餐桌上。","en":"Sanskrit śarkarā meant “gravel”, naming the crystals of cane sugar. It travelled through Persian, Arabic, and Latin into every European kitchen."},"branches":[{"label":{"zh":"一条连续的借词链","en":"One continuous loan chain"},"steps":[{"lang":"sa","word":"शर्करा","roman":"śarkarā","note":{"zh":"原义“砂粒”。","en":"Literally “gravel”."}},{"lang":"fa","word":"شکر","roman":"shekar"},{"lang":"ar","word":"سُكّر","roman":"sukkar"},{"lang":"la","word":"saccharum"},{"lang":"grc","word":"σάκχαρον","roman":"sákkharon"},{"lang":"en","word":"sugar"},{"lang":"fr","word":"sucre"},{"lang":"de","word":"Zucker"},{"lang":"es","word":"azúcar","note":{"zh":"开头的 az- 保留了阿拉伯语定冠词 al- 的痕迹。","en":"The initial az- preserves a trace of the Arabic article al-."}},{"lang":"ru","word":"сахар","roman":"sakhar"}]}]},{"id":"coffee","title":{"zh":"咖啡：从也门到世界","en":"Coffee: from Yemen to the world"},"intro":{"zh":"阿拉伯语 قهوة 先被奥斯曼土耳其人读成 kahve，再经意大利 caffè、法语 café 进入欧洲，最终以“咖啡”回到汉语。","en":"Arabic qahwa became Ottoman kahve, then Italian caffè and French café, and finally returned to Chinese as 咖啡."},"branches":[{"label":{"zh":"一条连续的借词链","en":"One continuous loan chain"},"steps":[{"lang":"ar","word":"قهوة","roman":"qahwa"},{"lang":"tr","word":"kahve"},{"lang":"it","word":"caffè"},{"lang":"fr","word":"café"},{"lang":"en","word":"coffee"},{"lang":"de","word":"Kaffee"},{"lang":"ru","word":"кофе","roman":"kofe"},{"lang":"ja","word":"コーヒー","roman":"kōhī"},{"lang":"ko","word":"커피","roman":"keopi"},{"lang":"zh","word":"咖啡","roman":"kāfēi"}]}]}],"concepts":[{"id":"water","field":"nature","title":{"zh":"水","en":"water"},"gloss":{"zh":"无色、无味的透明液体，一切生命赖以存在的基础。","en":"The clear, odourless liquid that sustains life; the archetypal substance."},"entries":[{"lang":"zh","word":"水","roman":"shuǐ","gloss":"无色无味的透明液体，江河湖海的通称。","glossEn":"water; a body of water","note":"甲骨文像水流之形，是汉字最古老的象形字之一。"},{"lang":"en","word":"water","roman":"","gloss":"the clear liquid that falls as rain and fills rivers and seas","glossEn":"water; rain; a body of water","origin":"pie-wodr","note":"古英语 wæter，与德语 Wasser、俄语 вода 同源。"},{"lang":"ja","word":"水","roman":"mizu","gloss":"水；尤指冷水。","glossEn":"water, especially cold water","note":"训读 mizu 为和语固有词；音读 sui 见于「水泳」「水曜日」。"},{"lang":"ko","word":"물","roman":"mul","gloss":"水。","glossEn":"water","note":"固有词；汉字词 수(水) 只出现在「수도」「수영」等词中。"},{"lang":"fr","word":"eau","roman":"","gloss":"水。","glossEn":"water","origin":"latin-aqua","note":"古法语 ewe 源自拉丁 aqua；现代拼写 eau 由 ewe 演变而来。"},{"lang":"de","word":"Wasser","roman":"","gloss":"水。","glossEn":"water","origin":"pie-wodr","note":"中性名词：das Wasser。"},{"lang":"es","word":"agua","roman":"","gloss":"水。","glossEn":"water","origin":"latin-aqua","note":"拉丁 aqua 的直系后代；阴性名词，但用 el agua（首音为重读 a）。"},{"lang":"ru","word":"вода","roman":"voda","gloss":"水。","glossEn":"water","origin":"pie-wodr","note":"阴性名词；与英语 water 同源。"},{"lang":"ar","word":"ماء","roman":"māʾ","gloss":"水。","glossEn":"water","origin":"semitic-may","note":"词根 m-w-h；希伯来语 מים 与之同源。"},{"lang":"hi","word":"पानी","roman":"pānī","gloss":"水（口语常用词）。","glossEn":"water (everyday word)","note":"更书面的 जल (jal) 来自梵语。"},{"lang":"fa","word":"آب","roman":"āb","gloss":"水。","glossEn":"water","note":"源自伊朗语 *āp-；也是「آبدان」「آبوهوا」等复合词的构词成分。"},{"lang":"he","word":"מים","roman":"máyim","gloss":"水。","glossEn":"water","origin":"semitic-may","note":"形式上是复数（双数遗存），但作不可数名词使用。"},{"lang":"la","word":"aqua","roman":"","gloss":"水。","glossEn":"water","origin":"latin-aqua","note":"英语 aquatic、aquarium 的来源。"},{"lang":"grc","word":"ὕδωρ","roman":"hýdōr","gloss":"水。","glossEn":"water","origin":"pie-wodr","note":"英语 hydro-、hydrant 的来源。"}],"relations":[{"type":"related","target":"rain","note":"雨水是水的一种形态。"},{"type":"antonym","target":"fire","note":"水与火是经典的相对概念。"}]},{"id":"fire","field":"nature","title":{"zh":"火","en":"fire"},"gloss":{"zh":"燃烧时发出的光和热；也比喻炽烈的情感。","en":"Flame and heat from combustion; also a metaphor for passion."},"entries":[{"lang":"zh","word":"火","roman":"huǒ","gloss":"燃烧时发出的光和热。","glossEn":"fire; flame","note":"甲骨文像火焰上腾之形。"},{"lang":"en","word":"fire","roman":"","gloss":"flame, heat, and light produced by burning","glossEn":"fire","origin":"pie-peh2wr","note":"古英语 fȳr，与德语 Feuer、希腊 πῦρ 同源。"},{"lang":"ja","word":"火","roman":"hi","gloss":"火；火焰。","glossEn":"fire; flame","note":"训读 hi；音读 ka 见于「火事」「火山」。"},{"lang":"ko","word":"불","roman":"bul","gloss":"火；灯火。","glossEn":"fire; light","note":"固有词；汉字词 화(火) 见于「화재」。"},{"lang":"fr","word":"feu","roman":"","gloss":"火。","glossEn":"fire","note":"拉丁 ignis 被通俗拉丁语 focus（炉灶）取代。"},{"lang":"de","word":"Feuer","roman":"","gloss":"火。","glossEn":"fire","origin":"pie-peh2wr","note":"中性名词：das Feuer。"},{"lang":"es","word":"fuego","roman":"","gloss":"火。","glossEn":"fire","note":"源自拉丁 focus「炉灶」，与法语 feu 同源。"},{"lang":"ru","word":"огонь","roman":"ogonʹ","gloss":"火。","glossEn":"fire","origin":"pie-ngwni","note":"与梵语 agni、拉丁 ignis 同源。"},{"lang":"ar","word":"نار","roman":"nār","gloss":"火；火焰。","glossEn":"fire","note":"阴性名词；也用于「جهنم」（火狱）。"},{"lang":"hi","word":"आग","roman":"āg","gloss":"火。","glossEn":"fire","origin":"pie-ngwni","note":"源自梵语 अग्नि (agni)。"},{"lang":"fa","word":"آتش","roman":"ātash","gloss":"火。","glossEn":"fire","note":"祆教经典中的「圣火」即用此词。"},{"lang":"la","word":"ignis","roman":"","gloss":"火。","glossEn":"fire","origin":"pie-ngwni","note":"英语 ignite、igneous 的来源。"},{"lang":"grc","word":"πῦρ","roman":"pŷr","gloss":"火。","glossEn":"fire","origin":"pie-peh2wr","note":"英语 pyre、pyromania 的来源。"}],"relations":[{"type":"related","target":"sun","note":"太阳是天空中的巨大火球。"},{"type":"antonym","target":"water","note":"水能灭火，二者相对。"}]},{"id":"moon","field":"nature","title":{"zh":"月亮","en":"moon"},"gloss":{"zh":"地球的天然卫星；夜空中最亮的天体，也用来计时。","en":"Earth's natural satellite; the brightest light of the night sky and a unit of time."},"entries":[{"lang":"zh","word":"月","roman":"yuè","gloss":"月亮；也指月份。","glossEn":"moon; month","note":"甲骨文像月牙之形；「月」既是天体也是时间单位。"},{"lang":"en","word":"moon","roman":"","gloss":"the natural satellite of Earth","glossEn":"moon","origin":"pie-meh1ns","note":"与 month 同源：月亮周期就是最原始的月份。"},{"lang":"ja","word":"月","roman":"tsuki","gloss":"月亮；月份。","glossEn":"moon; month","note":"训读 tsuki；音读 getsu 见于「月曜日」。"},{"lang":"ko","word":"달","roman":"dal","gloss":"月亮。","glossEn":"moon","note":"固有词；汉字词 월(月) 用于「월요일」「1월」。"},{"lang":"fr","word":"lune","roman":"","gloss":"月亮。","glossEn":"moon","origin":"pie-lewk","note":"拉丁 lūna 的直系后代。"},{"lang":"de","word":"Mond","roman":"","gloss":"月亮。","glossEn":"moon","origin":"pie-meh1ns","note":"阳性名词：der Mond；与 Monat（月份）同源。"},{"lang":"es","word":"luna","roman":"","gloss":"月亮。","glossEn":"moon","origin":"pie-lewk"},{"lang":"ru","word":"луна","roman":"luna","gloss":"月亮。","glossEn":"moon","origin":"pie-lewk","note":"与拉丁 lūna 同源；「месяц」兼指月亮与月份。"},{"lang":"ar","word":"قمر","roman":"qamar","gloss":"月亮。","glossEn":"moon","note":"与 شمس（太阳）相对；也用于「قمر صناعي」（人造卫星）。"},{"lang":"hi","word":"चाँद","roman":"chānd","gloss":"月亮（口语）。","glossEn":"moon (colloquial)","note":"更书面的 चंद्र (chandra) 来自梵语。"},{"lang":"fa","word":"ماه","roman":"māh","gloss":"月亮；月份。","glossEn":"moon; month","origin":"pie-meh1ns","note":"与英语 moon、德语 Mond 同源；也指「月份」。"},{"lang":"la","word":"lūna","roman":"","gloss":"月亮。","glossEn":"moon","origin":"pie-lewk","note":"英语 lunar、lunatic 的来源。"},{"lang":"grc","word":"σελήνη","roman":"selḗnē","gloss":"月亮。","glossEn":"moon","note":"英语 selenology 的来源。"}],"relations":[{"type":"related","target":"night","note":"月亮是夜晚的标志。"},{"type":"antonym","target":"sun","note":"日月交替，昼夜相对。"}]},{"id":"sun","field":"nature","title":{"zh":"太阳","en":"sun"},"gloss":{"zh":"太阳系的中心恒星，白昼与温暖的来源。","en":"The star at the centre of the solar system; source of daylight and warmth."},"entries":[{"lang":"zh","word":"太阳","roman":"tàiyáng","gloss":"日；太阳系的中心天体。","glossEn":"sun","note":"单字「日」是更古老的说法，也是「日子」的来源。"},{"lang":"en","word":"sun","roman":"","gloss":"the star at the centre of our solar system","glossEn":"sun","origin":"pie-soh2wl","note":"古英语 sunne，与德语 Sonne、拉丁 sōl 同源。"},{"lang":"ja","word":"太陽","roman":"taiyō","gloss":"太阳。","glossEn":"sun","note":"汉字词；日常也说「お日様」。"},{"lang":"ko","word":"해","roman":"hae","gloss":"太阳；年。","glossEn":"sun; year","note":"固有词；同一个词也指「年」，如「올해」（今年）。"},{"lang":"fr","word":"soleil","roman":"","gloss":"太阳。","glossEn":"sun","origin":"latin-sol","note":"拉丁 sōl 经通俗拉丁语 soleil 演变而来。"},{"lang":"de","word":"Sonne","roman":"","gloss":"太阳。","glossEn":"sun","origin":"pie-soh2wl","note":"阴性名词：die Sonne。"},{"lang":"es","word":"sol","roman":"","gloss":"太阳。","glossEn":"sun","origin":"latin-sol"},{"lang":"ru","word":"солнце","roman":"solntse","gloss":"太阳。","glossEn":"sun","origin":"pie-soh2wl"},{"lang":"ar","word":"شمس","roman":"shams","gloss":"太阳。","glossEn":"sun","origin":"semitic-shams","note":"阴性名词；与希伯来语 שמש 同源。"},{"lang":"hi","word":"सूरज","roman":"sūraj","gloss":"太阳。","glossEn":"sun","origin":"pie-soh2wl","note":"源自梵语 सूर्य (sūrya)。"},{"lang":"fa","word":"خورشید","roman":"xorshid","gloss":"太阳。","glossEn":"sun","note":"诗歌中也用 مهر (mehr)；与英语 sun 不同源。"},{"lang":"he","word":"שמש","roman":"shémesh","gloss":"太阳。","glossEn":"sun","origin":"semitic-shams","note":"与阿拉伯语 شمس 同源。"},{"lang":"la","word":"sōl","roman":"","gloss":"太阳。","glossEn":"sun","origin":"latin-sol","note":"英语 solar、solstice 的来源。"},{"lang":"grc","word":"ἥλιος","roman":"hḗlios","gloss":"太阳。","glossEn":"sun","origin":"pie-soh2wl","note":"英语 heliocentric 的来源。"}],"relations":[{"type":"related","target":"star","note":"太阳本身就是一颗恒星。"},{"type":"related","target":"moon","note":"日月是天空中最重要的两个天体。"},{"type":"antonym","target":"night"}]},{"id":"star","field":"nature","title":{"zh":"星星","en":"star"},"gloss":{"zh":"夜空中发光的恒星；也指星形的符号与命运。","en":"A luminous point in the night sky; also a shape and a symbol of destiny."},"entries":[{"lang":"zh","word":"星","roman":"xīng","gloss":"夜空中发光的天体；也指明星。","glossEn":"star; celebrity","note":"甲骨文作三个小圆，后加「生」为声符。"},{"lang":"en","word":"star","roman":"","gloss":"a luminous point in the night sky","glossEn":"star","origin":"pie-h2ster","note":"与德语 Stern、希腊 ἀστήρ 同源。"},{"lang":"ja","word":"星","roman":"hoshi","gloss":"星星。","glossEn":"star","note":"音读 sei 见于「星座」「衛星」。"},{"lang":"ko","word":"별","roman":"byeol","gloss":"星星。","glossEn":"star","note":"固有词；汉字词 성(星) 见于「성좌」。"},{"lang":"fr","word":"étoile","roman":"","gloss":"星星。","glossEn":"star","origin":"latin-stella"},{"lang":"de","word":"Stern","roman":"","gloss":"星星。","glossEn":"star","origin":"pie-h2ster","note":"阳性名词：der Stern。"},{"lang":"es","word":"estrella","roman":"","gloss":"星星。","glossEn":"star","origin":"latin-stella"},{"lang":"ru","word":"звезда","roman":"zvezda","gloss":"星星。","glossEn":"star","note":"阴性名词；复数 звёзды 也指「星号」。"},{"lang":"ar","word":"نجم","roman":"najm","gloss":"星星。","glossEn":"star","note":"也用于「نجم سينمائي」（电影明星）。"},{"lang":"hi","word":"तारा","roman":"tārā","gloss":"星星。","glossEn":"star","note":"源自梵语 तारा。"},{"lang":"fa","word":"ستاره","roman":"setāre","gloss":"星星。","glossEn":"star","note":"也指「明星」。"},{"lang":"la","word":"stella","roman":"","gloss":"星星。","glossEn":"star","origin":"latin-stella","note":"英语 stellar、constellation 的来源。"},{"lang":"grc","word":"ἀστήρ","roman":"astḗr","gloss":"星星。","glossEn":"star","origin":"pie-h2ster","note":"英语 astronomy、asterisk 的来源。"}],"relations":[{"type":"related","target":"night"},{"type":"related","target":"sun"}]},{"id":"rain","field":"nature","title":{"zh":"雨","en":"rain"},"gloss":{"zh":"云中水汽凝结后降落的雨滴。","en":"Water falling from clouds in drops."},"entries":[{"lang":"zh","word":"雨","roman":"yǔ","gloss":"从云中降下的水滴。","glossEn":"rain","note":"甲骨文像雨点自天而降。"},{"lang":"en","word":"rain","roman":"","gloss":"water falling from clouds","glossEn":"rain","origin":"germanic-regn","note":"古英语 regn，与德语 Regen 同源。"},{"lang":"ja","word":"雨","roman":"ame","gloss":"雨。","glossEn":"rain","note":"音读 u 见于「雨天」。"},{"lang":"ko","word":"비","roman":"bi","gloss":"雨。","glossEn":"rain","note":"固有词；也指「扫帚」（同音异义）。"},{"lang":"fr","word":"pluie","roman":"","gloss":"雨。","glossEn":"rain","origin":"latin-pluvia"},{"lang":"de","word":"Regen","roman":"","gloss":"雨。","glossEn":"rain","origin":"germanic-regn","note":"阳性名词：der Regen；与英语 rain 同源。"},{"lang":"es","word":"lluvia","roman":"","gloss":"雨。","glossEn":"rain","origin":"latin-pluvia"},{"lang":"ru","word":"дождь","roman":"dozhdʹ","gloss":"雨。","glossEn":"rain","note":"阳性名词；复数 дожди 重音后移。"},{"lang":"ar","word":"مطر","roman":"maṭar","gloss":"雨。","glossEn":"rain","note":"动词形式 أَمْطَرَ 表示「下雨」。"},{"lang":"hi","word":"बारिश","roman":"bārish","gloss":"雨（口语）。","glossEn":"rain (colloquial)","origin":"persian-baresh","note":"波斯语借词；更书面的是 वर्षा (varṣā)。"},{"lang":"fa","word":"باران","roman":"bārān","gloss":"雨。","glossEn":"rain","origin":"persian-baresh"},{"lang":"la","word":"pluvia","roman":"","gloss":"雨。","glossEn":"rain","origin":"latin-pluvia","note":"英语 pluvial 的来源。"},{"lang":"grc","word":"ὑετός","roman":"hyetós","gloss":"雨。","glossEn":"rain"}],"relations":[{"type":"related","target":"water"},{"type":"related","target":"wind"}]},{"id":"wind","field":"nature","title":{"zh":"风","en":"wind"},"gloss":{"zh":"流动的空气；也指消息与趋势。","en":"Moving air; also news and trends."},"entries":[{"lang":"zh","word":"风","roman":"fēng","gloss":"空气的流动；也指风俗、风气。","glossEn":"wind; custom; trend","note":"简化字「风」来自「風」，从虫从凡。"},{"lang":"en","word":"wind","roman":"","gloss":"moving air","glossEn":"wind","origin":"pie-h2weh1","note":"与拉丁 ventus、俄语 ветер 同源。"},{"lang":"ja","word":"風","roman":"kaze","gloss":"风。","glossEn":"wind","note":"音读 fū 见于「台風」。"},{"lang":"ko","word":"바람","roman":"baram","gloss":"风；也指「愿望」。","glossEn":"wind; wish","note":"固有词；「바람」同音也指「期望」。"},{"lang":"fr","word":"vent","roman":"","gloss":"风。","glossEn":"wind","origin":"pie-h2weh1"},{"lang":"de","word":"Wind","roman":"","gloss":"风。","glossEn":"wind","origin":"pie-h2weh1","note":"阳性名词：der Wind。"},{"lang":"es","word":"viento","roman":"","gloss":"风。","glossEn":"wind","origin":"pie-h2weh1"},{"lang":"ru","word":"ветер","roman":"veter","gloss":"风。","glossEn":"wind","origin":"pie-h2weh1"},{"lang":"ar","word":"ريح","roman":"rīḥ","gloss":"风。","glossEn":"wind","origin":"semitic-rih","note":"与希伯来语 רוח 同源，后者也指「气息、灵」。"},{"lang":"hi","word":"हवा","roman":"havā","gloss":"风；空气。","glossEn":"wind; air","note":"阿拉伯语 هواء (hawāʾ)「空气」的借词。"},{"lang":"fa","word":"باد","roman":"bād","gloss":"风。","glossEn":"wind"},{"lang":"he","word":"רוח","roman":"rúaḥ","gloss":"风；气息；灵。","glossEn":"wind; spirit","origin":"semitic-rih","note":"《创世记》开篇的「神的灵」即用此词。"},{"lang":"la","word":"ventus","roman":"","gloss":"风。","glossEn":"wind","origin":"pie-h2weh1","note":"英语 ventilation 的来源。"},{"lang":"grc","word":"ἄνεμος","roman":"ánemos","gloss":"风。","glossEn":"wind","note":"英语 anemometer 的来源。"}],"relations":[{"type":"related","target":"rain"}]},{"id":"tree","field":"plant","title":{"zh":"树","en":"tree"},"gloss":{"zh":"有木质主干和枝叶的高大植物。","en":"A tall plant with a woody trunk, branches, and leaves."},"entries":[{"lang":"zh","word":"树","roman":"shù","gloss":"木本植物的通称。","glossEn":"tree","note":"「樹」从木从尌，本义为种植。"},{"lang":"en","word":"tree","roman":"","gloss":"a tall woody plant","glossEn":"tree","note":"古英语 trēow，与 true、trust 同出一词根，原义「坚实」。"},{"lang":"ja","word":"木","roman":"ki","gloss":"树；木材。","glossEn":"tree; wood","note":"训读 ki 指树；音读 moku 指木材。"},{"lang":"ko","word":"나무","roman":"namu","gloss":"树；木头。","glossEn":"tree; wood"},{"lang":"fr","word":"arbre","roman":"","gloss":"树。","glossEn":"tree","origin":"latin-arbor"},{"lang":"de","word":"Baum","roman":"","gloss":"树。","glossEn":"tree","note":"阳性名词：der Baum；与英语 beam 同源。"},{"lang":"es","word":"árbol","roman":"","gloss":"树。","glossEn":"tree","origin":"latin-arbor"},{"lang":"ru","word":"дерево","roman":"derevo","gloss":"树；木材。","glossEn":"tree; wood","note":"与希腊 δρῦς「橡树」同源。"},{"lang":"ar","word":"شجرة","roman":"shajara","gloss":"树。","glossEn":"tree","note":"词根 sh-j-r，也构成「شجر」（树木的总称）。"},{"lang":"hi","word":"पेड़","roman":"peṛ","gloss":"树。","glossEn":"tree"},{"lang":"fa","word":"درخت","roman":"derakht","gloss":"树。","glossEn":"tree"},{"lang":"la","word":"arbor","roman":"","gloss":"树。","glossEn":"tree","origin":"latin-arbor","note":"英语 arboretum 的来源。"},{"lang":"grc","word":"δένδρον","roman":"déndron","gloss":"树。","glossEn":"tree","note":"与 δρῦς「橡树」同源；英语 dendrology 的来源。"}],"relations":[{"type":"related","target":"flower"}]},{"id":"flower","field":"plant","title":{"zh":"花","en":"flower"},"gloss":{"zh":"被子植物的繁殖器官；也指最美好的事物。","en":"The reproductive organ of a flowering plant; also a metaphor for the finest part."},"entries":[{"lang":"zh","word":"花","roman":"huā","gloss":"植物的繁殖器官；也指花纹、花费。","glossEn":"flower; pattern; to spend","note":"「花」与「華」同源，本指花盛开的样子。"},{"lang":"en","word":"flower","roman":"","gloss":"the bloom of a plant","glossEn":"flower","origin":"latin-flos","note":"借自古法语 flour，与拉丁 flōs 同源。"},{"lang":"ja","word":"花","roman":"hana","gloss":"花；樱花。","glossEn":"flower; cherry blossom","note":"「花見」(hanami) 即赏花。"},{"lang":"ko","word":"꽃","roman":"kkot","gloss":"花。","glossEn":"flower","note":"固有词；也指「精华」。"},{"lang":"fr","word":"fleur","roman":"","gloss":"花。","glossEn":"flower","origin":"latin-flos"},{"lang":"de","word":"Blume","roman":"","gloss":"花。","glossEn":"flower","note":"阴性名词：die Blume；与英语 bloom 同源。"},{"lang":"es","word":"flor","roman":"","gloss":"花。","glossEn":"flower","origin":"latin-flos"},{"lang":"ru","word":"цветок","roman":"tsvetok","gloss":"花。","glossEn":"flower","note":"与 цвет（颜色）同根，原义「发光、色彩」。"},{"lang":"ar","word":"زهرة","roman":"zahra","gloss":"花；花朵。","glossEn":"flower","note":"也是常见女名「Zahra」。"},{"lang":"hi","word":"फूल","roman":"phūl","gloss":"花。","glossEn":"flower"},{"lang":"fa","word":"گل","roman":"gol","gloss":"花。","glossEn":"flower","note":"也指「玫瑰」；「گلستان」意为花园。"},{"lang":"la","word":"flōs","roman":"","gloss":"花。","glossEn":"flower","origin":"latin-flos","note":"英语 floral、flourish 的来源。"},{"lang":"grc","word":"ἄνθος","roman":"ánthos","gloss":"花。","glossEn":"flower","note":"英语 anthology 的来源。"}],"relations":[{"type":"related","target":"tree"}]},{"id":"bird","field":"animal","title":{"zh":"鸟","en":"bird"},"gloss":{"zh":"有羽毛、翅膀，多数能飞的动物。","en":"A feathered, winged animal, most of which can fly."},"entries":[{"lang":"zh","word":"鸟","roman":"niǎo","gloss":"有羽毛和翅膀的卵生动物。","glossEn":"bird","note":"甲骨文像鸟形；作为偏旁写作「鸟」。"},{"lang":"en","word":"bird","roman":"","gloss":"a feathered animal with wings","glossEn":"bird","note":"古英语 bridd，来源不明，后来取代了 fugol。"},{"lang":"ja","word":"鳥","roman":"tori","gloss":"鸟。","glossEn":"bird","note":"音读 chō 见于「鳥類」。"},{"lang":"ko","word":"새","roman":"sae","gloss":"鸟。","glossEn":"bird","note":"固有词；同音「새」也指「新的」。"},{"lang":"fr","word":"oiseau","roman":"","gloss":"鸟。","glossEn":"bird","origin":"latin-avis","note":"来自通俗拉丁 avicellus「小鸟」。"},{"lang":"de","word":"Vogel","roman":"","gloss":"鸟。","glossEn":"bird","note":"阳性名词：der Vogel；与英语 fowl 同源。"},{"lang":"es","word":"ave","roman":"","gloss":"鸟（书面）。","glossEn":"bird (literary)","origin":"latin-avis","note":"日常口语更常用 pájaro。"},{"lang":"ru","word":"птица","roman":"ptitsa","gloss":"鸟。","glossEn":"bird"},{"lang":"ar","word":"طائر","roman":"ṭāʾir","gloss":"鸟；飞行的生物。","glossEn":"bird","note":"分词形式，字面「飞行的」。"},{"lang":"hi","word":"चिड़िया","roman":"chiṛiyā","gloss":"小鸟。","glossEn":"small bird","note":"泛指鸟时也用 पक्षी (pakṣī)。"},{"lang":"fa","word":"پرنده","roman":"parande","gloss":"鸟。","glossEn":"bird","note":"字面「飞行的」。"},{"lang":"la","word":"avis","roman":"","gloss":"鸟。","glossEn":"bird","origin":"latin-avis","note":"英语 aviation、aviary 的来源。"},{"lang":"grc","word":"ὄρνις","roman":"órnis","gloss":"鸟。","glossEn":"bird","note":"英语 ornithology 的来源。"}],"relations":[{"type":"related","target":"fish","note":"一个在天上，一个在水里。"}]},{"id":"fish","field":"animal","title":{"zh":"鱼","en":"fish"},"gloss":{"zh":"生活在水中、用鳃呼吸的脊椎动物。","en":"A water-dwelling vertebrate that breathes with gills."},"entries":[{"lang":"zh","word":"鱼","roman":"yú","gloss":"水生脊椎动物。","glossEn":"fish","note":"甲骨文像鱼形，是典型的象形字。"},{"lang":"en","word":"fish","roman":"","gloss":"a water-dwelling animal with gills","glossEn":"fish","origin":"pie-peysk","note":"古英语 fisc；复数 fish 常不变。"},{"lang":"ja","word":"魚","roman":"sakana","gloss":"鱼；尤指菜肴中的鱼。","glossEn":"fish","note":"音读 gyo 见于「金魚」「漁業」。"},{"lang":"ko","word":"물고기","roman":"mulgogi","gloss":"鱼。","glossEn":"fish","note":"字面「水＋肉」；汉字词 어(魚) 见于「어류」。"},{"lang":"fr","word":"poisson","roman":"","gloss":"鱼。","glossEn":"fish","origin":"latin-piscis"},{"lang":"de","word":"Fisch","roman":"","gloss":"鱼。","glossEn":"fish","origin":"pie-peysk","note":"阳性名词：der Fisch。"},{"lang":"es","word":"pez","roman":"","gloss":"鱼（活鱼）。","glossEn":"fish (alive)","origin":"latin-piscis","note":"作食物时用 pescado。"},{"lang":"ru","word":"рыба","roman":"ryba","gloss":"鱼。","glossEn":"fish"},{"lang":"ar","word":"سمكة","roman":"samaka","gloss":"鱼。","glossEn":"fish","note":"阴性名词；复数 أَسْمَاك。"},{"lang":"hi","word":"मछली","roman":"machhlī","gloss":"鱼。","glossEn":"fish"},{"lang":"fa","word":"ماهی","roman":"māhi","gloss":"鱼。","glossEn":"fish","note":"「ماه」是月亮，「ماهی」是鱼，只差一个后缀。"},{"lang":"la","word":"piscis","roman":"","gloss":"鱼。","glossEn":"fish","origin":"latin-piscis","note":"英语 Pisces、piscine 的来源。"},{"lang":"grc","word":"ἰχθύς","roman":"ikhthýs","gloss":"鱼。","glossEn":"fish","note":"早期基督徒以鱼形符号 ichthys 为暗记。"}],"relations":[{"type":"related","target":"bird"}]},{"id":"horse","field":"animal","title":{"zh":"马","en":"horse"},"gloss":{"zh":"善于奔跑的奇蹄目家畜，长期用于骑乘与耕作。","en":"A fast, hoofed domestic animal long used for riding and work."},"entries":[{"lang":"zh","word":"马","roman":"mǎ","gloss":"马科动物；也指骑兵。","glossEn":"horse","note":"甲骨文像马之形；作为偏旁写作「马」。"},{"lang":"en","word":"horse","roman":"","gloss":"a large hoofed animal used for riding","glossEn":"horse","note":"古英语 hors；与 hurry 并无词源关系。"},{"lang":"ja","word":"馬","roman":"uma","gloss":"马。","glossEn":"horse","note":"音读 ba 见于「競馬」「馬力」。"},{"lang":"ko","word":"말","roman":"mal","gloss":"马；也指「语言、话语」。","glossEn":"horse; speech","note":"同音词「말」兼指马与话，靠语境区分。"},{"lang":"fr","word":"cheval","roman":"","gloss":"马。","glossEn":"horse","origin":"late-latin-caballus"},{"lang":"de","word":"Pferd","roman":"","gloss":"马。","glossEn":"horse","note":"源自中古拉丁 paraveredus「驿马」。"},{"lang":"es","word":"caballo","roman":"","gloss":"马。","glossEn":"horse","origin":"late-latin-caballus"},{"lang":"ru","word":"лошадь","roman":"loshadʹ","gloss":"马。","glossEn":"horse","note":"书面语也用 конь (konʹ)。"},{"lang":"ar","word":"حصان","roman":"ḥiṣān","gloss":"马。","glossEn":"horse","note":"阴性名词；「فرس」更偏书面。"},{"lang":"hi","word":"घोड़ा","roman":"ghoṛā","gloss":"马。","glossEn":"horse"},{"lang":"fa","word":"اسب","roman":"asb","gloss":"马。","glossEn":"horse","note":"「اسب» 也是国际象棋中「马」的名称。"},{"lang":"la","word":"equus","roman":"","gloss":"马。","glossEn":"horse","origin":"pie-ekwos","note":"英语 equestrian、equine 的来源。"},{"lang":"grc","word":"ἵππος","roman":"híppos","gloss":"马。","glossEn":"horse","origin":"pie-ekwos","note":"英语 hippopotamus（河马）的前半部分。"}],"relations":[{"type":"related","target":"dog","note":"最常见的两种家畜伙伴。"},{"type":"related","target":"road","note":"马与道路共同构成古代的交通网络。"}]},{"id":"dog","field":"animal","title":{"zh":"狗","en":"dog"},"gloss":{"zh":"最早的驯化家畜之一，被视为人类伙伴。","en":"One of the earliest domesticated animals, kept as a companion and guard."},"entries":[{"lang":"zh","word":"狗","roman":"gǒu","gloss":"犬科家畜。","glossEn":"dog","note":"「犬」是更古老的说法，「狗」原指幼犬。"},{"lang":"en","word":"dog","roman":"","gloss":"a domesticated canine","glossEn":"dog","note":"古英语 docga，来源不明，后来取代了 hund。"},{"lang":"ja","word":"犬","roman":"inu","gloss":"狗。","glossEn":"dog","note":"音读 ken 见于「番犬」「犬歯」。"},{"lang":"ko","word":"개","roman":"gae","gloss":"狗。","glossEn":"dog","note":"固有词；汉字词 견(犬) 见于「애견」。"},{"lang":"fr","word":"chien","roman":"","gloss":"狗。","glossEn":"dog","origin":"latin-canis","note":"拉丁 canis 经通俗拉丁语演化而来。"},{"lang":"de","word":"Hund","roman":"","gloss":"狗。","glossEn":"dog","note":"阳性名词：der Hund；与英语 hound 同源。"},{"lang":"es","word":"perro","roman":"","gloss":"狗。","glossEn":"dog","note":"来源不明；与法语 chien 不同源。"},{"lang":"ru","word":"собака","roman":"sobaka","gloss":"狗。","glossEn":"dog","note":"阴性名词；来源有争议。"},{"lang":"ar","word":"كلب","roman":"kalb","gloss":"狗。","glossEn":"dog","origin":"semitic-kalb","note":"与希伯来语 כלב 同源。"},{"lang":"hi","word":"कुत्ता","roman":"kuttā","gloss":"狗。","glossEn":"dog"},{"lang":"fa","word":"سگ","roman":"sag","gloss":"狗。","glossEn":"dog"},{"lang":"he","word":"כלב","roman":"kélev","gloss":"狗。","glossEn":"dog","origin":"semitic-kalb"},{"lang":"la","word":"canis","roman":"","gloss":"狗。","glossEn":"dog","origin":"latin-canis","note":"英语 canine、canary 的来源。"},{"lang":"grc","word":"κύων","roman":"kýōn","gloss":"狗。","glossEn":"dog","note":"英语 cynic 的来源，原指「像狗一样」。"}],"relations":[{"type":"related","target":"horse"},{"type":"related","target":"child","note":"狗常被视为家庭成员。"}]},{"id":"eye","field":"body","title":{"zh":"眼睛","en":"eye"},"gloss":{"zh":"感知光线的视觉器官；也指眼光与洞见。","en":"The organ of sight; also judgement and insight."},"entries":[{"lang":"zh","word":"眼睛","roman":"yǎnjing","gloss":"视觉器官。","glossEn":"eye","note":"单字「目」是更古老的说法，甲骨文像横写的眼睛。"},{"lang":"en","word":"eye","roman":"","gloss":"the organ of sight","glossEn":"eye","origin":"pie-h3okw","note":"与拉丁 oculus、德语 Auge 同源。"},{"lang":"ja","word":"目","roman":"me","gloss":"眼睛；也指「眼、要点」。","glossEn":"eye; point of view","note":"音读 moku 见于「目的」「注目」。"},{"lang":"ko","word":"눈","roman":"nun","gloss":"眼睛；也指「雪」。","glossEn":"eye; snow","note":"同音词「눈」兼指眼睛与雪，靠语境区分。"},{"lang":"fr","word":"œil","roman":"","gloss":"眼睛。","glossEn":"eye","origin":"pie-h3okw"},{"lang":"de","word":"Auge","roman":"","gloss":"眼睛。","glossEn":"eye","origin":"pie-h3okw","note":"中性名词：das Auge。"},{"lang":"es","word":"ojo","roman":"","gloss":"眼睛。","glossEn":"eye","origin":"pie-h3okw"},{"lang":"ru","word":"глаз","roman":"glaz","gloss":"眼睛。","glossEn":"eye","note":"与英语 glass 并无词源关系；古语「око」与拉丁 oculus 同源。"},{"lang":"ar","word":"عين","roman":"ʿayn","gloss":"眼睛；泉眼；也指字母 ع。","glossEn":"eye; spring; letter ʿayn","origin":"semitic-ayn","note":"与希伯来语 עין 同源，同样兼指「泉眼」。"},{"lang":"hi","word":"आँख","roman":"āṅkh","gloss":"眼睛。","glossEn":"eye","origin":"pie-h3okw","note":"源自梵语 अक्षि (akṣi)。"},{"lang":"fa","word":"چشم","roman":"cheshm","gloss":"眼睛。","glossEn":"eye","note":"「چشم» 也用于「期望」等复合词。"},{"lang":"he","word":"עין","roman":"áyin","gloss":"眼睛；泉眼。","glossEn":"eye; spring","origin":"semitic-ayn"},{"lang":"la","word":"oculus","roman":"","gloss":"眼睛。","glossEn":"eye","origin":"pie-h3okw","note":"英语 ocular、binocular 的来源。"},{"lang":"grc","word":"ὀφθαλμός","roman":"ophthalmós","gloss":"眼睛。","glossEn":"eye","note":"英语 ophthalmology 的来源。"}],"relations":[{"type":"related","target":"hand"},{"type":"related","target":"heart"}]},{"id":"hand","field":"body","title":{"zh":"手","en":"hand"},"gloss":{"zh":"人手臂末端能抓握的部位；也指技能与帮助。","en":"The grasping end of the arm; also skill and help."},"entries":[{"lang":"zh","word":"手","roman":"shǒu","gloss":"手腕以下的部位；也指技能、手段。","glossEn":"hand; skill; means","note":"甲骨文像五指张开之形。"},{"lang":"en","word":"hand","roman":"","gloss":"the end of the arm with fingers","glossEn":"hand","origin":"germanic-hand","note":"与德语 Hand 同源，但不见于其他印欧语族。"},{"lang":"ja","word":"手","roman":"te","gloss":"手；也指方法、手段。","glossEn":"hand; means","note":"音读 shu 见于「手段」「歌手」。"},{"lang":"ko","word":"손","roman":"son","gloss":"手；客人（손님）。","glossEn":"hand","note":"固有词；「손님」意为客人。"},{"lang":"fr","word":"main","roman":"","gloss":"手。","glossEn":"hand","origin":"latin-manus"},{"lang":"de","word":"Hand","roman":"","gloss":"手。","glossEn":"hand","origin":"germanic-hand","note":"阴性名词：die Hand。"},{"lang":"es","word":"mano","roman":"","gloss":"手。","glossEn":"hand","origin":"latin-manus"},{"lang":"ru","word":"рука","roman":"ruka","gloss":"手；也指整条手臂。","glossEn":"hand; arm","note":"俄语通常不区分手与臂；пясть 专指手掌。"},{"lang":"ar","word":"يد","roman":"yad","gloss":"手。","glossEn":"hand","origin":"semitic-yad","note":"与希伯来语 יד 同源。"},{"lang":"hi","word":"हाथ","roman":"hāth","gloss":"手。","glossEn":"hand"},{"lang":"fa","word":"دست","roman":"dast","gloss":"手。","glossEn":"hand","note":"「دست» 也构成「دستور」（命令、语法）等词。"},{"lang":"he","word":"יד","roman":"yad","gloss":"手。","glossEn":"hand","origin":"semitic-yad"},{"lang":"la","word":"manus","roman":"","gloss":"手。","glossEn":"hand","origin":"latin-manus","note":"英语 manual、manuscript 的来源。"},{"lang":"grc","word":"χείρ","roman":"kheír","gloss":"手。","glossEn":"hand","note":"英语 surgery 的 -chir- 部分由此而来。"}],"relations":[{"type":"related","target":"eye"},{"type":"related","target":"heart"}]},{"id":"heart","field":"body","title":{"zh":"心","en":"heart"},"gloss":{"zh":"推动血液循环的器官；也指情感与中心。","en":"The organ that pumps blood; also the seat of feeling and the centre of things."},"entries":[{"lang":"zh","word":"心","roman":"xīn","gloss":"心脏；心思、情感；中心。","glossEn":"heart; mind; centre","note":"甲骨文像心脏之形；作为偏旁写作「忄」。"},{"lang":"en","word":"heart","roman":"","gloss":"the organ that pumps blood; the centre of feeling","glossEn":"heart","origin":"pie-kerd","note":"与拉丁 cor、希腊 καρδία 同源。"},{"lang":"ja","word":"心","roman":"kokoro","gloss":"心；心意；精神。","glossEn":"heart; mind; spirit","note":"多指内心而非器官；器官称「心臓」(shinzō)。"},{"lang":"ko","word":"심장","roman":"simjang","gloss":"心脏（器官）。","glossEn":"heart (organ)","note":"汉字词「心臟」；「마음」(maeum) 指心思。"},{"lang":"fr","word":"cœur","roman":"","gloss":"心；心脏。","glossEn":"heart","origin":"pie-kerd"},{"lang":"de","word":"Herz","roman":"","gloss":"心；心脏。","glossEn":"heart","origin":"pie-kerd","note":"中性名词：das Herz。"},{"lang":"es","word":"corazón","roman":"","gloss":"心；心脏。","glossEn":"heart","origin":"pie-kerd"},{"lang":"ru","word":"сердце","roman":"serdtse","gloss":"心；心脏。","glossEn":"heart","origin":"pie-kerd"},{"lang":"ar","word":"قلب","roman":"qalb","gloss":"心；心脏；内心。","glossEn":"heart; core","origin":"semitic-libb","note":"词根 q-l-b 本义「翻转」，与希伯来语 לב 同源。"},{"lang":"hi","word":"हृदय","roman":"hṛday","gloss":"心；心脏；内心。","glossEn":"heart","origin":"pie-kerd","note":"梵语 हृदय (hṛdaya) 的借词。"},{"lang":"fa","word":"دل","roman":"del","gloss":"心；内心。","glossEn":"heart","origin":"pie-kerd","note":"一般认为与英语 heart 同源，兼指「勇气」。"},{"lang":"he","word":"לב","roman":"lev","gloss":"心；内心。","glossEn":"heart","origin":"semitic-libb"},{"lang":"la","word":"cor","roman":"","gloss":"心；心脏。","glossEn":"heart","origin":"pie-kerd","note":"英语 cordial、record 的来源。"},{"lang":"grc","word":"καρδία","roman":"kardía","gloss":"心；心脏。","glossEn":"heart","origin":"pie-kerd","note":"英语 cardiac 的来源。"}],"relations":[{"type":"related","target":"love"},{"type":"related","target":"hand"}]},{"id":"mother","field":"kin","title":{"zh":"母亲","en":"mother"},"gloss":{"zh":"生育或养育子女的女性；也指事物的源头。","en":"A woman who gives birth to or raises a child; also the source of something."},"entries":[{"lang":"zh","word":"母亲","roman":"mǔqīn","gloss":"生育或养育子女的女性。","glossEn":"mother","note":"单字「母」；口语「妈妈」。"},{"lang":"en","word":"mother","roman":"","gloss":"a female parent","glossEn":"mother","origin":"pie-mater","note":"与拉丁 māter、希腊 μήτηρ 同源。"},{"lang":"ja","word":"母","roman":"haha","gloss":"母亲（谦称）。","glossEn":"mother (humble)","note":"当面称「お母さん」；音读 bo 见于「母国」。"},{"lang":"ko","word":"어머니","roman":"eomeoni","gloss":"母亲。","glossEn":"mother","note":"固有词；汉字词 모(母) 见于「모친」。"},{"lang":"fr","word":"mère","roman":"","gloss":"母亲。","glossEn":"mother","origin":"pie-mater"},{"lang":"de","word":"Mutter","roman":"","gloss":"母亲。","glossEn":"mother","origin":"pie-mater","note":"阴性名词：die Mutter。"},{"lang":"es","word":"madre","roman":"","gloss":"母亲。","glossEn":"mother","origin":"pie-mater"},{"lang":"ru","word":"мать","roman":"matʹ","gloss":"母亲。","glossEn":"mother","origin":"pie-mater"},{"lang":"ar","word":"أم","roman":"umm","gloss":"母亲；也指「根源」。","glossEn":"mother; source","origin":"semitic-umm","note":"与希伯来语 אם 同源。"},{"lang":"hi","word":"माँ","roman":"māṅ","gloss":"母亲。","glossEn":"mother","origin":"pie-mater","note":"源自梵语 मातृ (mātṛ)。"},{"lang":"fa","word":"مادر","roman":"mādar","gloss":"母亲。","glossEn":"mother","origin":"pie-mater"},{"lang":"he","word":"אם","roman":"em","gloss":"母亲。","glossEn":"mother","origin":"semitic-umm"},{"lang":"la","word":"māter","roman":"","gloss":"母亲。","glossEn":"mother","origin":"pie-mater","note":"英语 maternal、matriculate 的来源。"},{"lang":"grc","word":"μήτηρ","roman":"mḗtēr","gloss":"母亲。","glossEn":"mother","origin":"pie-mater","note":"英语 mother 与希腊语同出一源。"}],"relations":[{"type":"related","target":"father"},{"type":"related","target":"child"}]},{"id":"father","field":"kin","title":{"zh":"父亲","en":"father"},"gloss":{"zh":"子女的男性双亲；也指创始者与神父。","en":"A child's male parent; also a founder or priest."},"entries":[{"lang":"zh","word":"父亲","roman":"fùqīn","gloss":"子女的男性双亲。","glossEn":"father","note":"单字「父」；口语「爸爸」。"},{"lang":"en","word":"father","roman":"","gloss":"a male parent","glossEn":"father","origin":"pie-pater"},{"lang":"ja","word":"父","roman":"chichi","gloss":"父亲（谦称）。","glossEn":"father (humble)","note":"当面称「お父さん」；音读 fu 见于「父兄」。"},{"lang":"ko","word":"아버지","roman":"abeoji","gloss":"父亲。","glossEn":"father","note":"固有词；汉字词 부(父) 见于「부친」。"},{"lang":"fr","word":"père","roman":"","gloss":"父亲。","glossEn":"father","origin":"pie-pater"},{"lang":"de","word":"Vater","roman":"","gloss":"父亲。","glossEn":"father","origin":"pie-pater","note":"阳性名词：der Vater。"},{"lang":"es","word":"padre","roman":"","gloss":"父亲；也指神父。","glossEn":"father; priest","origin":"pie-pater"},{"lang":"ru","word":"отец","roman":"otets","gloss":"父亲。","glossEn":"father","note":"与英语 father 不同源；源自 *otъ「爸爸」。"},{"lang":"ar","word":"أب","roman":"ab","gloss":"父亲。","glossEn":"father","origin":"semitic-ab","note":"与希伯来语 אב 同源。"},{"lang":"hi","word":"पिता","roman":"pitā","gloss":"父亲。","glossEn":"father","origin":"pie-pater","note":"源自梵语 पितृ (pitṛ)。"},{"lang":"fa","word":"پدر","roman":"pedar","gloss":"父亲。","glossEn":"father","origin":"pie-pater"},{"lang":"he","word":"אב","roman":"av","gloss":"父亲。","glossEn":"father","origin":"semitic-ab"},{"lang":"la","word":"pater","roman":"","gloss":"父亲。","glossEn":"father","origin":"pie-pater","note":"英语 paternal、patron 的来源。"},{"lang":"grc","word":"πατήρ","roman":"patḗr","gloss":"父亲。","glossEn":"father","origin":"pie-pater"}],"relations":[{"type":"related","target":"mother"},{"type":"related","target":"child"}]},{"id":"child","field":"kin","title":{"zh":"孩子","en":"child"},"gloss":{"zh":"未成年的子女；也指后代与产物。","en":"A young human; also an offspring or product."},"entries":[{"lang":"zh","word":"孩子","roman":"háizi","gloss":"儿童；子女。","glossEn":"child; children","note":"「孩」本指小儿笑，后泛指幼儿。"},{"lang":"en","word":"child","roman":"","gloss":"a young human","glossEn":"child","note":"古英语 cild；复数 children 保留了 -r- 的旧痕迹。"},{"lang":"ja","word":"子供","roman":"kodomo","gloss":"孩子。","glossEn":"child","note":"汉字写作「子供」，但读法是和语。"},{"lang":"ko","word":"아이","roman":"ai","gloss":"孩子。","glossEn":"child","note":"「아이」也指「孩子」；汉字词 아(兒) 见于「아동」。"},{"lang":"fr","word":"enfant","roman":"","gloss":"孩子。","glossEn":"child","origin":"latin-infans","note":"拉丁 infans 字面「不会说话的」。"},{"lang":"de","word":"Kind","roman":"","gloss":"孩子。","glossEn":"child","note":"中性名词：das Kind。"},{"lang":"es","word":"niño","roman":"","gloss":"孩子（男孩）。","glossEn":"child (boy)","note":"源自 *ninnus「幼儿」，与法语 enfant 不同源。"},{"lang":"ru","word":"ребёнок","roman":"rebyonok","gloss":"孩子。","glossEn":"child","note":"复数 дети 为异根形式。"},{"lang":"ar","word":"طفل","roman":"ṭifl","gloss":"孩子；幼儿。","glossEn":"child","note":"复数 أطفال。"},{"lang":"hi","word":"बच्चा","roman":"bachchā","gloss":"孩子。","glossEn":"child"},{"lang":"fa","word":"کودک","roman":"kudak","gloss":"孩子。","glossEn":"child"},{"lang":"la","word":"infans","roman":"","gloss":"婴儿；不会说话的人。","glossEn":"infant","origin":"latin-infans","note":"英语 infant、infancy 的来源。"},{"lang":"grc","word":"παῖς","roman":"paîs","gloss":"孩子；少年。","glossEn":"child; boy","note":"英语 pediatrics 的词根。"}],"relations":[{"type":"related","target":"mother"},{"type":"related","target":"father"}]},{"id":"love","field":"mind","title":{"zh":"爱","en":"love"},"gloss":{"zh":"深切的爱慕与关怀；也指对事物的热爱。","en":"Deep affection or attachment; also enthusiasm for something."},"entries":[{"lang":"zh","word":"爱","roman":"ài","gloss":"对人或事物的深厚感情。","glossEn":"love; affection","note":"繁体「愛」中间有「心」，简化后保留「友」。"},{"lang":"en","word":"love","roman":"","gloss":"deep affection","glossEn":"love","origin":"pie-leubh","note":"古英语 lufu，与德语 Liebe、俄语 любовь 同源。"},{"lang":"ja","word":"愛","roman":"ai","gloss":"爱；爱情。","glossEn":"love","note":"汉字词；和语「恋」(koi) 偏指恋爱。"},{"lang":"ko","word":"사랑","roman":"sarang","gloss":"爱；爱情。","glossEn":"love","note":"固有词；汉字词 애(愛) 见于「애정」。"},{"lang":"fr","word":"amour","roman":"","gloss":"爱；爱情。","glossEn":"love","origin":"latin-amor"},{"lang":"de","word":"Liebe","roman":"","gloss":"爱；爱情。","glossEn":"love","origin":"pie-leubh","note":"阴性名词：die Liebe。"},{"lang":"es","word":"amor","roman":"","gloss":"爱；爱情。","glossEn":"love","origin":"latin-amor"},{"lang":"ru","word":"любовь","roman":"lyubovʹ","gloss":"爱；爱情。","glossEn":"love","origin":"pie-leubh"},{"lang":"ar","word":"حب","roman":"ḥubb","gloss":"爱；爱情。","glossEn":"love","note":"词根 ḥ-b-b；也用于「حبيب」（爱人）。"},{"lang":"hi","word":"प्यार","roman":"pyār","gloss":"爱；爱情（口语）。","glossEn":"love (colloquial)","note":"源自梵语 प्रिय (priya)「可爱的」。"},{"lang":"fa","word":"عشق","roman":"eshq","gloss":"爱；激情。","glossEn":"love; passion","note":"阿拉伯语借词，原义「强烈的依恋」。"},{"lang":"la","word":"amor","roman":"","gloss":"爱；爱情。","glossEn":"love","origin":"latin-amor","note":"英语 amorous、amateur 的来源。"},{"lang":"grc","word":"ἔρως","roman":"érōs","gloss":"爱欲；爱情。","glossEn":"love; desire","note":"英语 erotic 的来源。"}],"relations":[{"type":"related","target":"heart"},{"type":"related","target":"mother"}]},{"id":"night","field":"time","title":{"zh":"夜","en":"night"},"gloss":{"zh":"日落到日出之间的黑暗时段。","en":"The dark hours between sunset and sunrise."},"entries":[{"lang":"zh","word":"夜","roman":"yè","gloss":"从天黑到天亮的时间。","glossEn":"night","note":"甲骨文从「夕」从「亦」，表示人在夜间。"},{"lang":"en","word":"night","roman":"","gloss":"the dark part of the day","glossEn":"night","origin":"pie-nokw"},{"lang":"ja","word":"夜","roman":"yoru","gloss":"夜晚。","glossEn":"night","note":"音读 ya 见于「深夜」「夜間」。"},{"lang":"ko","word":"밤","roman":"bam","gloss":"夜晚；也指「栗子」。","glossEn":"night; chestnut","note":"同音词「밤」兼指夜晚与栗子。"},{"lang":"fr","word":"nuit","roman":"","gloss":"夜。","glossEn":"night","origin":"pie-nokw"},{"lang":"de","word":"Nacht","roman":"","gloss":"夜。","glossEn":"night","origin":"pie-nokw","note":"阴性名词：die Nacht。"},{"lang":"es","word":"noche","roman":"","gloss":"夜。","glossEn":"night","origin":"pie-nokw"},{"lang":"ru","word":"ночь","roman":"nochʹ","gloss":"夜。","glossEn":"night","origin":"pie-nokw"},{"lang":"ar","word":"ليل","roman":"layl","gloss":"夜；夜晚。","glossEn":"night","origin":"semitic-layl","note":"与希伯来语 לילה 同源。"},{"lang":"hi","word":"रात","roman":"rāt","gloss":"夜。","glossEn":"night"},{"lang":"fa","word":"شب","roman":"shab","gloss":"夜。","glossEn":"night"},{"lang":"he","word":"לילה","roman":"láyla","gloss":"夜。","glossEn":"night","origin":"semitic-layl"},{"lang":"la","word":"nox","roman":"","gloss":"夜。","glossEn":"night","origin":"pie-nokw","note":"英语 nocturnal、equinox 的来源。"},{"lang":"grc","word":"νύξ","roman":"nýx","gloss":"夜。","glossEn":"night","origin":"pie-nokw","note":"英语 nyctophobia 的来源。"}],"relations":[{"type":"related","target":"moon"},{"type":"related","target":"star"},{"type":"antonym","target":"sun"}]},{"id":"year","field":"time","title":{"zh":"年","en":"year"},"gloss":{"zh":"地球绕太阳一周的时间，约 365 天。","en":"The time Earth takes to orbit the Sun, about 365 days."},"entries":[{"lang":"zh","word":"年","roman":"nián","gloss":"时间单位；也指收成、年节。","glossEn":"year; harvest","note":"甲骨文从「禾」从「人」，本义与谷熟有关。"},{"lang":"en","word":"year","roman":"","gloss":"a period of about 365 days","glossEn":"year","origin":"pie-yer","note":"与德语 Jahr 同源。"},{"lang":"ja","word":"年","roman":"toshi","gloss":"年；年份。","glossEn":"year","note":"音读 nen 见于「今年」「年齢」。"},{"lang":"ko","word":"해","roman":"hae","gloss":"年（固有词）；太阳。","glossEn":"year; sun","note":"「올해」即今年；汉字词 년/연 用于「년도」。"},{"lang":"fr","word":"an","roman":"","gloss":"年。","glossEn":"year","origin":"latin-annus","note":"「année」强调一年时间的长度。"},{"lang":"de","word":"Jahr","roman":"","gloss":"年。","glossEn":"year","origin":"pie-yer","note":"中性名词：das Jahr。"},{"lang":"es","word":"año","roman":"","gloss":"年。","glossEn":"year","origin":"latin-annus"},{"lang":"ru","word":"год","roman":"god","gloss":"年。","glossEn":"year","note":"复数 годы/года 不规则；「лет」用于 5 以上。"},{"lang":"ar","word":"سنة","roman":"sana","gloss":"年。","glossEn":"year","origin":"semitic-shanah","note":"与希伯来语 שנה 同源。"},{"lang":"hi","word":"साल","roman":"sāl","gloss":"年（口语）。","glossEn":"year (colloquial)","origin":"persian-sal","note":"波斯语借词；更书面的是 वर्ष (varṣ)。"},{"lang":"fa","word":"سال","roman":"sāl","gloss":"年。","glossEn":"year","origin":"persian-sal"},{"lang":"he","word":"שנה","roman":"shaná","gloss":"年。","glossEn":"year","origin":"semitic-shanah"},{"lang":"la","word":"annus","roman":"","gloss":"年。","glossEn":"year","origin":"latin-annus","note":"英语 annual、anniversary 的来源。"},{"lang":"grc","word":"ἔτος","roman":"étos","gloss":"年。","glossEn":"year"}],"relations":[{"type":"related","target":"moon","note":"月份来自月相周期。"},{"type":"related","target":"night"}]},{"id":"name","field":"speech","title":{"zh":"名字","en":"name"},"gloss":{"zh":"用来指称人、物或概念的词；也指名声。","en":"A word by which a person, thing, or idea is known; also reputation."},"entries":[{"lang":"zh","word":"名字","roman":"míngzi","gloss":"人或事物的名称。","glossEn":"name","note":"「名」甲骨文从口从夕，夜间自报其名。"},{"lang":"en","word":"name","roman":"","gloss":"a word by which someone is known","glossEn":"name","origin":"pie-nomn"},{"lang":"ja","word":"名前","roman":"namae","gloss":"名字。","glossEn":"name","note":"音读 mei 见于「氏名」。"},{"lang":"ko","word":"이름","roman":"ireum","gloss":"名字。","glossEn":"name","note":"固有词；汉字词 명(名) 见于「명함」。"},{"lang":"fr","word":"nom","roman":"","gloss":"名字；名词。","glossEn":"name; noun","origin":"pie-nomn"},{"lang":"de","word":"Name","roman":"","gloss":"名字。","glossEn":"name","origin":"pie-nomn","note":"阳性名词：der Name。"},{"lang":"es","word":"nombre","roman":"","gloss":"名字；名词。","glossEn":"name; noun","origin":"pie-nomn"},{"lang":"ru","word":"имя","roman":"imya","gloss":"名字。","glossEn":"name","origin":"pie-nomn"},{"lang":"ar","word":"اسم","roman":"ism","gloss":"名字；名词。","glossEn":"name; noun","origin":"semitic-ism","note":"与希伯来语 שם 同源。"},{"lang":"hi","word":"नाम","roman":"nām","gloss":"名字。","glossEn":"name","origin":"pie-nomn"},{"lang":"fa","word":"نام","roman":"nām","gloss":"名字。","glossEn":"name","origin":"pie-nomn","note":"「نام» 也是「نامیدن」（命名）的词根。"},{"lang":"he","word":"שם","roman":"shem","gloss":"名字。","glossEn":"name","origin":"semitic-ism"},{"lang":"la","word":"nōmen","roman":"","gloss":"名字；名词。","glossEn":"name; noun","origin":"pie-nomn","note":"英语 nominal、nomenclature 的来源。"},{"lang":"grc","word":"ὄνομα","roman":"ónoma","gloss":"名字。","glossEn":"name","origin":"pie-nomn","note":"英语 synonym、anonymous 的后半部分。"}],"relations":[{"type":"related","target":"word"},{"type":"related","target":"language"}]},{"id":"word","field":"speech","title":{"zh":"词","en":"word"},"gloss":{"zh":"语言中最小的自由运用单位；也指承诺。","en":"The smallest free unit of language; also a promise."},"entries":[{"lang":"zh","word":"词","roman":"cí","gloss":"能独立运用的最小语言单位。","glossEn":"word","note":"「詞」从言从司，本指言辞、文辞。"},{"lang":"en","word":"word","roman":"","gloss":"a unit of language","glossEn":"word","origin":"pie-werh1"},{"lang":"ja","word":"言葉","roman":"kotoba","gloss":"词；语言；话语。","glossEn":"word; language; speech","note":"「言」＋「葉」，字面「言语之叶」。"},{"lang":"ko","word":"낱말","roman":"natmal","gloss":"单词。","glossEn":"word","note":"「낱」(单个)＋「말」(话)，是纯粹的固有词。"},{"lang":"fr","word":"mot","roman":"","gloss":"词。","glossEn":"word","note":"源自通俗拉丁 muttum「一声」。"},{"lang":"de","word":"Wort","roman":"","gloss":"词。","glossEn":"word","origin":"pie-werh1","note":"中性名词：das Wort。"},{"lang":"es","word":"palabra","roman":"","gloss":"词；话语。","glossEn":"word","note":"源自拉丁 parabola（希腊 παραβολή「比喻」）。"},{"lang":"ru","word":"слово","roman":"slovo","gloss":"词；话语。","glossEn":"word"},{"lang":"ar","word":"كلمة","roman":"kalima","gloss":"词；话语。","glossEn":"word","note":"也用于「الكلمة الطيبة」（善言）。"},{"lang":"hi","word":"शब्द","roman":"shabd","gloss":"词；声音。","glossEn":"word; sound","note":"梵语借词；「शब्द» 在哲学中也指「声」。"},{"lang":"fa","word":"واژه","roman":"vāzhe","gloss":"词。","glossEn":"word","note":"「واژه» 是书面语；口语常用 «کلمه»。"},{"lang":"la","word":"verbum","roman":"","gloss":"词；言语。","glossEn":"word; verb","origin":"pie-werh1","note":"英语 verb、verbal 的来源。"},{"lang":"grc","word":"λόγος","roman":"lógos","gloss":"言说；理性；比例。","glossEn":"word; reason; ratio","note":"英语 logic、dialogue 的词根。"}],"relations":[{"type":"related","target":"language"},{"type":"related","target":"book"},{"type":"related","target":"name"}]},{"id":"language","field":"speech","title":{"zh":"语言","en":"language"},"gloss":{"zh":"由语音、词汇和语法构成的符号系统。","en":"A system of signs with sounds, words, and grammar."},"entries":[{"lang":"zh","word":"语言","roman":"yǔyán","gloss":"人类交流的符号系统。","glossEn":"language","note":"「語」从言从吾；「言」本身也是「语言」。"},{"lang":"en","word":"language","roman":"","gloss":"a system of spoken or written communication","glossEn":"language","origin":"latin-lingua","note":"经古法语借自拉丁 lingua「舌头」。"},{"lang":"ja","word":"言語","roman":"gengo","gloss":"语言。","glossEn":"language","note":"汉字词；和语「言葉」(kotoba) 也指语言。"},{"lang":"ko","word":"언어","roman":"eoneo","gloss":"语言。","glossEn":"language","note":"汉字词「言語」。"},{"lang":"fr","word":"langue","roman":"","gloss":"语言；舌头。","glossEn":"language; tongue","origin":"latin-lingua"},{"lang":"de","word":"Sprache","roman":"","gloss":"语言。","glossEn":"language","note":"阴性名词：die Sprache；与 sprechen（说）同根。"},{"lang":"es","word":"lengua","roman":"","gloss":"语言；舌头。","glossEn":"language; tongue","origin":"latin-lingua"},{"lang":"ru","word":"язык","roman":"yazyk","gloss":"语言；舌头。","glossEn":"language; tongue","note":"同一个词兼指语言与舌头。"},{"lang":"ar","word":"لغة","roman":"lugha","gloss":"语言。","glossEn":"language","note":"「اللغة العربية」即阿拉伯语。"},{"lang":"hi","word":"भाषा","roman":"bhāṣā","gloss":"语言。","glossEn":"language","note":"源自梵语 भाषा。"},{"lang":"fa","word":"زبان","roman":"zabān","gloss":"语言；舌头。","glossEn":"language; tongue"},{"lang":"la","word":"lingua","roman":"","gloss":"语言；舌头。","glossEn":"language; tongue","origin":"latin-lingua","note":"英语 linguistics、bilingual 的来源。"},{"lang":"grc","word":"γλῶσσα","roman":"glôssa","gloss":"语言；舌头。","glossEn":"language; tongue","note":"英语 gloss、glossary 的来源。"}],"relations":[{"type":"related","target":"word"},{"type":"related","target":"book"},{"type":"related","target":"name"}]},{"id":"book","field":"speech","title":{"zh":"书","en":"book"},"gloss":{"zh":"装订成册的书写或印刷品。","en":"A written or printed work bound in pages."},"entries":[{"lang":"zh","word":"书","roman":"shū","gloss":"装订成册的著作。","glossEn":"book; writing","note":"「書」从聿从者，本义为书写。"},{"lang":"en","word":"book","roman":"","gloss":"a written or printed work","glossEn":"book","note":"古英语 bōc，与 beech（山毛榉）同源，因古人在木板上刻写。"},{"lang":"ja","word":"本","roman":"hon","gloss":"书；本。","glossEn":"book","note":"「本」本指树根，引申为「根本、书本」；音读 hon。"},{"lang":"ko","word":"책","roman":"chaek","gloss":"书。","glossEn":"book","note":"汉字词「冊」；固有词「글월」较古。"},{"lang":"fr","word":"livre","roman":"","gloss":"书。","glossEn":"book","origin":"latin-liber"},{"lang":"de","word":"Buch","roman":"","gloss":"书。","glossEn":"book","note":"中性名词：das Buch；与英语 book 同源。"},{"lang":"es","word":"libro","roman":"","gloss":"书。","glossEn":"book","origin":"latin-liber"},{"lang":"ru","word":"книга","roman":"kniga","gloss":"书。","glossEn":"book"},{"lang":"ar","word":"كتاب","roman":"kitāb","gloss":"书；文书。","glossEn":"book; document","origin":"arabic-kitab","note":"词根 k-t-b「书写」。"},{"lang":"hi","word":"किताब","roman":"kitāb","gloss":"书。","glossEn":"book","origin":"arabic-kitab","note":"阿拉伯语借词；本土词 पुस्तक (pustak) 亦常用。"},{"lang":"fa","word":"کتاب","roman":"ketāb","gloss":"书。","glossEn":"book","origin":"arabic-kitab"},{"lang":"la","word":"liber","roman":"","gloss":"书；树皮。","glossEn":"book; bark","origin":"latin-liber","note":"原义「树皮」，古人在树皮上书写。"},{"lang":"grc","word":"βιβλίον","roman":"biblíon","gloss":"书卷；纸草卷。","glossEn":"book; scroll","note":"英语 Bible、bibliography 的来源。"}],"relations":[{"type":"related","target":"word"},{"type":"related","target":"language"}]},{"id":"tea","field":"food","title":{"zh":"茶","en":"tea"},"gloss":{"zh":"用茶树嫩叶冲泡的饮品，起源于中国西南。","en":"A drink made from the leaves of Camellia sinensis, first cultivated in southwest China."},"routes":["tea"],"entries":[{"lang":"zh","word":"茶","roman":"chá","gloss":"茶树的叶子及其饮品。","glossEn":"tea","note":"源自中古汉语；闽南语读 tê，经海路进入欧洲语言。"},{"lang":"en","word":"tea","roman":"","gloss":"a drink made from tea leaves","glossEn":"tea","origin":"loan-tea-te","note":"经荷兰语 thee 借自闽南语 tê。"},{"lang":"ja","word":"茶","roman":"cha","gloss":"茶；茶道。","glossEn":"tea","origin":"loan-tea-cha","note":"汉字词，随禅宗与饮茶习惯传入日本。"},{"lang":"ko","word":"차","roman":"cha","gloss":"茶。","glossEn":"tea","origin":"loan-tea-cha","note":"汉字词「茶」的朝鲜语读音。"},{"lang":"fr","word":"thé","roman":"","gloss":"茶。","glossEn":"tea","origin":"loan-tea-te"},{"lang":"de","word":"Tee","roman":"","gloss":"茶。","glossEn":"tea","origin":"loan-tea-te"},{"lang":"es","word":"té","roman":"","gloss":"茶。","glossEn":"tea","origin":"loan-tea-te"},{"lang":"ru","word":"чай","roman":"chay","gloss":"茶。","glossEn":"tea","origin":"loan-tea-cha","note":"经北方陆路借自汉语 chá。"},{"lang":"ar","word":"شاي","roman":"shāy","gloss":"茶。","glossEn":"tea","origin":"loan-tea-cha"},{"lang":"hi","word":"चाय","roman":"chāy","gloss":"茶。","glossEn":"tea","origin":"loan-tea-cha"},{"lang":"fa","word":"چای","roman":"chāy","gloss":"茶。","glossEn":"tea","origin":"loan-tea-cha"},{"lang":"he","word":"תה","roman":"te","gloss":"茶。","glossEn":"tea","origin":"loan-tea-te","note":"现代希伯来语借词。"}],"relations":[{"type":"related","target":"water"},{"type":"related","target":"wine"},{"type":"related","target":"coffee"}]},{"id":"sugar","field":"food","title":{"zh":"糖","en":"sugar"},"gloss":{"zh":"有甜味的结晶物质，主要取自甘蔗和甜菜。","en":"A sweet crystalline substance from cane or beet."},"routes":["sugar"],"entries":[{"lang":"zh","word":"糖","roman":"táng","gloss":"甜味的结晶食品。","glossEn":"sugar; candy","note":"古代「糖」多指饴糖，蔗糖后来才普及。"},{"lang":"en","word":"sugar","roman":"","gloss":"a sweet substance from cane or beet","glossEn":"sugar","origin":"loan-sugar"},{"lang":"ja","word":"砂糖","roman":"satō","gloss":"砂糖。","glossEn":"sugar","note":"汉字词「砂糖」；与欧洲语言的 sugar 并不同源。"},{"lang":"ko","word":"설탕","roman":"seoltang","gloss":"砂糖。","glossEn":"sugar","note":"汉字词「雪糖」，经日语或汉语传入。"},{"lang":"fr","word":"sucre","roman":"","gloss":"糖。","glossEn":"sugar","origin":"loan-sugar"},{"lang":"de","word":"Zucker","roman":"","gloss":"糖。","glossEn":"sugar","origin":"loan-sugar"},{"lang":"es","word":"azúcar","roman":"","gloss":"糖。","glossEn":"sugar","origin":"loan-sugar","note":"开头的 az- 保留了阿拉伯语定冠词 al- 的痕迹。"},{"lang":"ru","word":"сахар","roman":"sakhar","gloss":"糖。","glossEn":"sugar","origin":"loan-sugar"},{"lang":"ar","word":"سُكّر","roman":"sukkar","gloss":"糖。","glossEn":"sugar","origin":"loan-sugar"},{"lang":"hi","word":"चीनी","roman":"chīnī","gloss":"糖；也指「中国的」。","glossEn":"sugar; Chinese (fem.)","note":"字面「中国的」，因蔗糖制作技术经中国传入。"},{"lang":"fa","word":"شکر","roman":"shekar","gloss":"糖。","glossEn":"sugar","origin":"loan-sugar"},{"lang":"la","word":"saccharum","roman":"","gloss":"蔗糖。","glossEn":"sugar","origin":"loan-sugar","note":"英语 saccharin 的来源。"},{"lang":"grc","word":"σάκχαρον","roman":"sákkharon","gloss":"糖。","glossEn":"sugar","origin":"loan-sugar"}],"relations":[{"type":"related","target":"tea"},{"type":"related","target":"coffee"}]},{"id":"wine","field":"food","title":{"zh":"酒","en":"wine"},"gloss":{"zh":"用葡萄或水果发酵酿成的含酒精饮料。","en":"An alcoholic drink fermented from grapes or fruit."},"entries":[{"lang":"zh","word":"酒","roman":"jiǔ","gloss":"含酒精的饮料；也泛指饮酒。","glossEn":"alcohol; wine; liquor","note":"「酒」从水从酉；古代酒器与酒礼极发达。"},{"lang":"en","word":"wine","roman":"","gloss":"fermented grape juice","glossEn":"wine","origin":"pie-woyno"},{"lang":"ja","word":"酒","roman":"sake","gloss":"酒；清酒。","glossEn":"alcohol; sake","note":"音读 shu 见于「日本酒」；「お酒」泛指酒类。"},{"lang":"ko","word":"술","roman":"sul","gloss":"酒。","glossEn":"alcohol; wine"},{"lang":"fr","word":"vin","roman":"","gloss":"葡萄酒。","glossEn":"wine","origin":"pie-woyno"},{"lang":"de","word":"Wein","roman":"","gloss":"葡萄酒。","glossEn":"wine","origin":"pie-woyno","note":"阳性名词：der Wein。"},{"lang":"es","word":"vino","roman":"","gloss":"葡萄酒。","glossEn":"wine","origin":"pie-woyno"},{"lang":"ru","word":"вино","roman":"vino","gloss":"葡萄酒；酒。","glossEn":"wine","origin":"pie-woyno"},{"lang":"ar","word":"خمر","roman":"khamr","gloss":"酒；葡萄酒。","glossEn":"wine; alcohol","note":"伊斯兰教法中的「酒」；日常也以「شراب」代称。"},{"lang":"hi","word":"शराब","roman":"sharāb","gloss":"酒；烈酒。","glossEn":"wine; liquor","note":"阿拉伯语 شراب「饮料」的借词。"},{"lang":"fa","word":"شراب","roman":"sharāb","gloss":"酒；饮料。","glossEn":"wine; drink","note":"阿拉伯语借词，字面「饮料」。"},{"lang":"la","word":"vīnum","roman":"","gloss":"葡萄酒。","glossEn":"wine","origin":"pie-woyno","note":"可能借自地中海某非印欧语言。"},{"lang":"grc","word":"οἶνος","roman":"oînos","gloss":"葡萄酒。","glossEn":"wine","origin":"pie-woyno","note":"英语 oenology 的来源。"}],"relations":[{"type":"related","target":"water"},{"type":"related","target":"tea"}]},{"id":"coffee","field":"food","title":{"zh":"咖啡","en":"coffee"},"gloss":{"zh":"用烘焙咖啡豆冲泡的提神饮品。","en":"A stimulating drink brewed from roasted coffee beans."},"routes":["coffee"],"entries":[{"lang":"zh","word":"咖啡","roman":"kāfēi","gloss":"咖啡豆制成的饮品。","glossEn":"coffee","origin":"loan-coffee"},{"lang":"en","word":"coffee","roman":"","gloss":"a drink from roasted coffee beans","glossEn":"coffee","origin":"loan-coffee"},{"lang":"ja","word":"コーヒー","roman":"kōhī","gloss":"咖啡。","glossEn":"coffee","origin":"loan-coffee","note":"片假名音译；也写作「珈琲」。"},{"lang":"ko","word":"커피","roman":"keopi","gloss":"咖啡。","glossEn":"coffee","origin":"loan-coffee"},{"lang":"fr","word":"café","roman":"","gloss":"咖啡；咖啡馆。","glossEn":"coffee; café","origin":"loan-coffee"},{"lang":"de","word":"Kaffee","roman":"","gloss":"咖啡。","glossEn":"coffee","origin":"loan-coffee"},{"lang":"es","word":"café","roman":"","gloss":"咖啡；咖啡馆。","glossEn":"coffee; café","origin":"loan-coffee"},{"lang":"ru","word":"кофе","roman":"kofe","gloss":"咖啡。","glossEn":"coffee","origin":"loan-coffee","note":"阳性名词，不随性数变化。"},{"lang":"ar","word":"قهوة","roman":"qahwa","gloss":"咖啡；咖啡馆。","glossEn":"coffee","origin":"loan-coffee","note":"与英语 coffee 同出一词；更早的词源有争议。"},{"lang":"hi","word":"कॉफ़ी","roman":"kofī","gloss":"咖啡。","glossEn":"coffee","origin":"loan-coffee"},{"lang":"fa","word":"قهوه","roman":"qahve","gloss":"咖啡。","glossEn":"coffee","origin":"loan-coffee"}],"relations":[{"type":"related","target":"tea"},{"type":"related","target":"sugar"}]},{"id":"gold","field":"material","title":{"zh":"金","en":"gold"},"gloss":{"zh":"化学性质稳定的贵金属，自古以来用作货币与装饰。","en":"A dense, unreactive precious metal used for money and ornament."},"entries":[{"lang":"zh","word":"金","roman":"jīn","gloss":"黄金；也指金属、钱财。","glossEn":"gold; metal; money","note":"「金」在五行中属西方，也泛指金属。"},{"lang":"en","word":"gold","roman":"","gloss":"a yellow precious metal","glossEn":"gold","origin":"pie-ghelh3","note":"与德语 Gold、俄语 золото 同源。"},{"lang":"ja","word":"金","roman":"kane","gloss":"金；钱。","glossEn":"gold; money","note":"训读 kane 也指「钱」；音读 kin 见于「金曜日」。"},{"lang":"ko","word":"금","roman":"geum","gloss":"金；黄金。","glossEn":"gold","note":"汉字词；金属总称是「쇠」或「금속」。"},{"lang":"fr","word":"or","roman":"","gloss":"金；黄金。","glossEn":"gold","origin":"latin-aurum"},{"lang":"de","word":"Gold","roman":"","gloss":"金。","glossEn":"gold","origin":"pie-ghelh3","note":"中性名词：das Gold。"},{"lang":"es","word":"oro","roman":"","gloss":"金。","glossEn":"gold","origin":"latin-aurum"},{"lang":"ru","word":"золото","roman":"zoloto","gloss":"金。","glossEn":"gold","origin":"pie-ghelh3"},{"lang":"ar","word":"ذهب","roman":"dhahab","gloss":"金；黄金。","glossEn":"gold","origin":"semitic-dhahab","note":"与希伯来语 זהב 同源。"},{"lang":"hi","word":"सोना","roman":"sonā","gloss":"金；黄金。","glossEn":"gold"},{"lang":"fa","word":"طلا","roman":"talā","gloss":"金；黄金。","glossEn":"gold"},{"lang":"he","word":"זהב","roman":"zaháv","gloss":"金；黄金。","glossEn":"gold","origin":"semitic-dhahab"},{"lang":"la","word":"aurum","roman":"","gloss":"金。","glossEn":"gold","origin":"latin-aurum","note":"化学符号 Au 即由此而来。"},{"lang":"grc","word":"χρυσός","roman":"khrūsós","gloss":"金。","glossEn":"gold","note":"英语 chrysanthemum（金菊）的前半部分。"}],"relations":[{"type":"related","target":"king"},{"type":"related","target":"sugar"}]},{"id":"road","field":"society","title":{"zh":"路","en":"road"},"gloss":{"zh":"供人畜车辆通行的道路；也比喻途径。","en":"A prepared way for travel; also a path or means."},"entries":[{"lang":"zh","word":"路","roman":"lù","gloss":"道路；途径。","glossEn":"road; way","note":"从「足」从「各」，本义为道路。"},{"lang":"en","word":"road","roman":"","gloss":"a way for travelling","glossEn":"road","note":"古英语 rād「骑行、旅程」，与 ride 同源。"},{"lang":"ja","word":"道","roman":"michi","gloss":"道路；道理；茶道。","glossEn":"road; way; art","note":"音读 dō 见于「道路」「柔道」。"},{"lang":"ko","word":"길","roman":"gil","gloss":"路；方法。","glossEn":"road; way","note":"固有词；也用于「길잡이」（向导）。"},{"lang":"fr","word":"route","roman":"","gloss":"路；路线。","glossEn":"road; route","note":"源自拉丁 rupta (via)「被开辟的路」。"},{"lang":"de","word":"Weg","roman":"","gloss":"路；途径。","glossEn":"road; way","note":"阳性名词：der Weg。"},{"lang":"es","word":"camino","roman":"","gloss":"路；道路。","glossEn":"road; way"},{"lang":"ru","word":"дорога","roman":"doroga","gloss":"路；道路。","glossEn":"road","note":"阴性名词；「путь」更偏「途径」。"},{"lang":"ar","word":"طريق","roman":"ṭarīq","gloss":"路；道路；方法。","glossEn":"road; way"},{"lang":"hi","word":"सड़क","roman":"saṛak","gloss":"路；马路。","glossEn":"road"},{"lang":"fa","word":"راه","roman":"rāh","gloss":"路；方法。","glossEn":"road; way","note":"「راه» 也指「办法」，如 «راه حل»（解决方案）。"},{"lang":"la","word":"via","roman":"","gloss":"路；道路。","glossEn":"road; way","note":"英语 via、viaduct 的来源。"},{"lang":"grc","word":"ὁδός","roman":"hodós","gloss":"路；道路；方法。","glossEn":"road; way","note":"英语 method 的后半部分。"}],"relations":[{"type":"related","target":"king"},{"type":"related","target":"horse"}]},{"id":"king","field":"society","title":{"zh":"国王","en":"king"},"gloss":{"zh":"君主制国家的男性统治者；也指某一领域的巨头。","en":"A male ruler of a kingdom; also a dominant figure in a field."},"entries":[{"lang":"zh","word":"王","roman":"wáng","gloss":"君主；也指首领。","glossEn":"king","note":"甲骨文像斧钺之形，象征军事权力。"},{"lang":"en","word":"king","roman":"","gloss":"a male monarch","glossEn":"king","origin":"germanic-kuningaz","note":"与德语 König 同源。"},{"lang":"ja","word":"王","roman":"ō","gloss":"国王；君王。","glossEn":"king","note":"音读 ō；「王様」为敬称。"},{"lang":"ko","word":"왕","roman":"wang","gloss":"王；国王。","glossEn":"king","note":"汉字词；「임금」为固有词。"},{"lang":"fr","word":"roi","roman":"","gloss":"国王。","glossEn":"king","origin":"latin-rex"},{"lang":"de","word":"König","roman":"","gloss":"国王。","glossEn":"king","origin":"germanic-kuningaz","note":"阳性名词：der König。"},{"lang":"es","word":"rey","roman":"","gloss":"国王。","glossEn":"king","origin":"latin-rex"},{"lang":"ru","word":"король","roman":"korolʹ","gloss":"国王。","glossEn":"king","note":"源自人名「查理」(Karl)，经斯拉夫语传入。"},{"lang":"ar","word":"ملك","roman":"malik","gloss":"国王；君主。","glossEn":"king","origin":"semitic-malik","note":"与希伯来语 מלך 同源。"},{"lang":"hi","word":"राजा","roman":"rājā","gloss":"国王。","glossEn":"king","note":"源自梵语 राजन् (rājan)。"},{"lang":"fa","word":"شاه","roman":"shāh","gloss":"国王；沙。","glossEn":"king; shah","note":"古波斯语 xšāyaθiya 的后代，也是国际象棋「王」的名称。"},{"lang":"he","word":"מלך","roman":"mélekh","gloss":"国王。","glossEn":"king","origin":"semitic-malik"},{"lang":"la","word":"rex","roman":"","gloss":"国王。","glossEn":"king","origin":"latin-rex","note":"英语 regal、regicide 的来源。"},{"lang":"grc","word":"βασιλεύς","roman":"basileús","gloss":"国王。","glossEn":"king","note":"英语 basilica 原指「王宫」。"}],"relations":[{"type":"related","target":"gold"},{"type":"related","target":"road"}]}]};

    const LANGS = languageIndex(DATA);
    const CONCEPTS = conceptIndex(DATA);
    const FIELDS = fieldIndex(DATA);
    const ORIGINS = originIndex(DATA);
    const VISIBLE_LANGS = visibleLanguages(DATA);
    const ALL_LANG_IDS = VISIBLE_LANGS.map((lang) => lang.id);
    const STATS = stats(DATA);

    // 文风取自“读句”：
    // 诗经：动作先行，重复生节奏（关雎、蒹葭）；唐诗：一句收住，不解释（登幽州台歌）；
    // 宋词：停顿、口语转折（声声慢）；楚辞：长句与“兮”的呼吸（离骚）；
    // 莎士比亚十四行诗：直呼、对照、转折（Sonnet XVIII）。
    const DICT = {
      "zh": {
        "navLabel": "汉英辞典",
        "title": "汉英 · 英汉辞典",
        "subtitle": "字有来源，句有长短。",
        "intro": "写法、读音、意思，还有它和别的词的关系；一句一句，都记在这里。",
        "tabDict": "查词",
        "tabCorpus": "读句",
        "tabProsody": "声律",
        "prosodyTitle": "声律",
        "prosodySubtitle": "把一行字放进来，看看它的声音怎么走。",
        "prosodyPlaceholder": "贴一句诗，或一行英文。",
        "prosodyButton": "看它的声音",
        "prosodyPrompt": "还没有字。",
        "prosodyEmpty": "先写一句，或贴一段。",
        "prosodyPingze": "平仄",
        "prosodyRhyme": "韵脚",
        "prosodyMeter": "格律倾向",
        "prosodyStress": "词典重音",
        "prosodySyllables": "音节",
        "prosodyAlliteration": "双声",
        "prosodyAssonance": "叠韵",
        "prosodyError": "这一句没读出来。",
        "prosodyLangAuto": "随文",
        "prosodyLangZh": "中文",
        "prosodyLangEn": "英文",
        "tabAtlas": "来源",
        "tabAbout": "这本书",
        "corpusTitle": "读句",
        "corpusSubtitle": "读一句，停一停；想想它为什么这样写。",
        "corpusPlaceholder": "按一个字、一种情绪，或一个意象找。比如：月、离别、雨",
        "corpusFacets": "分类",
        "corpusClearFacets": "清空",
        "facetCollection": "源流",
        "facetEra": "时代",
        "facetGenre": "大类",
        "facetForm": "体裁",
        "facetMood": "情绪",
        "facetImage": "意象",
        "facetSeason": "时节",
        "facetTheme": "主题",
        "facetAny": "不限",
        "corpusSearch": "找找看",
        "corpusRandom": "再翻一页",
        "corpusSource": "出自",
        "corpusLicense": "许可",
        "corpusNote": "看它怎么写",
        "corpusRelated": "气息相近的",
        "corpusResults": "段",
        "corpusEmpty": "这一页空着。",
        "corpusEmptyHint": "换个字，或去掉一个标签；若还不见，它不在这几行之间。",
        "corpusLoading": "正在翻。",
        "corpusError": "这一页没有打开。",
        "corpusRetry": "再翻一次。",
        "corpusPrompt": "按一个字、一种情绪，或一个意象去找。",
        "searchPlaceholder": "查一个字，或一个词",
        "searchHint": "汉英皆可。",
        "askTitle": "想问什么？",
        "askHint": "汉英皆可。",
        "directionAuto": "随字而定",
        "directionZh": "汉英",
        "directionEn": "英汉",
        "random": "随便翻一页",
        "dailyWord": "今天，先看一个词",
        "recent": "刚才翻过的",
        "favorites": "留下的",
        "browseZh": "按拼音",
        "browseEn": "按字母",
        "exact": "就是它",
        "prefix": "由它开头",
        "pinyinMatches": "按读音找",
        "resultsCount": "条",
        "noResults": "没有。",
        "noResultsHint": "换个写法，或短一点；若还不见，它不在这本辞典。",
        "traditional": "繁体",
        "readings": "念法",
        "readingCount": "种念法",
        "senses": "意思",
        "senseCount": "个义项",
        "word": "写法",
        "zhToZh": "中文解释",
        "zhToZhHint": "换一种说法",
        "enToEn": "英文解释",
        "enToEnHint": "In other words",
        "verse": "读出声",
        "verseHint": "到断句处，停一停。",
        "wordForms": "别的写法",
        "related": "相关词",
        "relatedNear": "近义",
        "relatedSame": "上下位与同类",
        "relatedRadical": "同部首",
        "relatedForm": "同根与复合",
        "relatedEmpty": "这一组还空着。",
        "shuffle": "换一批",
        "frequency": "词频",
        "addFavorite": "留下",
        "removeFavorite": "放回去",
        "copy": "抄下",
        "copied": "抄好了",
        "inAtlas": "看它的来源",
        "loading": "正在翻。",
        "errorTitle": "这一页没有打开。",
        "retry": "再试一次。",
        "notReady": "辞典还没翻开。",
        "notReadyHint": "字还在路上。",
        "historyEmpty": "还没有翻过什么。",
        "favoritesEmpty": "喜欢的，可以留下。",
        "allFields": "全部门类",
        "concepts": "个概念",
        "gloss": "意思",
        "relation": "它和谁有关",
        "sameField": "同一类词",
        "coverage": "各种语言怎么说",
        "aboutTitle": "这本书",
        "aboutBody": "字从各处来，在这里歇脚。汉英、英汉两种查法；中文词条附中文解释，英文词条附英文解释。读句页收公版诗文，一条一条注了出处、许可，和一句可学的地方。都在本机，不联网。",
        "dataSources": "这些字和句，从哪里来",
        "builtAt": "编于",
        "licenseNote": "CC-CEDICT 依 CC BY-SA 4.0 使用；ECDICT、chinese-xinhua 依 MIT。诗文为公版作品，数据集许可随条目注明。",
        "backHome": "回到开头",
        "prev": "往前",
        "next": "往后",
        "openEntry": "翻开",
        "langCount": "种语言",
        "familyCount": "个同源家族",
        "sourceCedict": "CC-CEDICT · 汉英",
        "sourceEcdict": "ECDICT · 英汉",
        "sourceXinhua": "chinese-xinhua · 中文解释",
        "sourceVerse": "诗里的句子 · 风雅颂/楚辞/唐诗/宋词/英诗",
        "sourceCorpus": "chinese-poetry · 唐诗/宋词/诗经/楚辞",
        "sourceGutenberg": "Project Gutenberg · 英文诗",
        "publicDomain": "公有领域",
        "offline": "不联网",
        "tabGloss": "对照",
        "tabOrigin": "词源",
        "tabNetwork": "关系",
        "crash": "这一页没翻过去。",
        "entryCount": "条",
        "favoritesCount": "留着"
      },
      "en": {
        "navLabel": "Dictionary",
        "title": "Chinese · English Dictionary",
        "subtitle": "First the word; then where it came from.",
        "intro": "How it is written, how it sounds, what it means, and how it reaches other words — kept here, line by line.",
        "tabDict": "Words",
        "tabCorpus": "Read",
        "tabProsody": "Sound",
        "prosodyTitle": "Sound",
        "prosodySubtitle": "Put a line in. See how its sound moves.",
        "prosodyPlaceholder": "A line of verse, Chinese or English.",
        "prosodyButton": "Hear it on paper",
        "prosodyPrompt": "Nothing here yet.",
        "prosodyEmpty": "Write a line, or paste a passage.",
        "prosodyPingze": "Level and oblique",
        "prosodyRhyme": "Rhyme",
        "prosodyMeter": "Meter tendency",
        "prosodyStress": "Lexical stress",
        "prosodySyllables": "Syllables",
        "prosodyAlliteration": "Alliteration",
        "prosodyAssonance": "Assonance",
        "prosodyError": "This line did not come through.",
        "prosodyLangAuto": "Auto",
        "prosodyLangZh": "Chinese",
        "prosodyLangEn": "English",
        "tabAtlas": "Sources",
        "tabAbout": "This book",
        "corpusTitle": "Read a passage",
        "corpusSubtitle": "Read one line. Stop. Then ask how it is made.",
        "corpusPlaceholder": "A word, a mood, an image — moon, parting, rain.",
        "corpusFacets": "Classification",
        "corpusClearFacets": "Clear",
        "facetCollection": "Source",
        "facetEra": "Era",
        "facetGenre": "Kind",
        "facetForm": "Form",
        "facetMood": "Mood",
        "facetImage": "Image",
        "facetSeason": "Season",
        "facetTheme": "Theme",
        "facetAny": "Any",
        "corpusSearch": "Find",
        "corpusRandom": "Turn again",
        "corpusSource": "From",
        "corpusLicense": "Licence",
        "corpusNote": "What it does",
        "corpusRelated": "Nearby passages",
        "corpusResults": "passages",
        "corpusEmpty": "This page is blank.",
        "corpusEmptyHint": "Another word, or one less tag; if it is not here, it is not in this book.",
        "corpusLoading": "Turning.",
        "corpusError": "The page did not open.",
        "corpusRetry": "Once more.",
        "corpusPrompt": "A word, a mood, an image.",
        "searchPlaceholder": "A character, or a word",
        "searchHint": "Chinese or English.",
        "askTitle": "What would you like to find?",
        "askHint": "Chinese or English.",
        "directionAuto": "Any",
        "directionZh": "ZH→EN",
        "directionEn": "EN→ZH",
        "random": "Turn a page",
        "dailyWord": "Today, one word",
        "recent": "Just turned",
        "favorites": "Kept",
        "browseZh": "By pinyin",
        "browseEn": "A–Z",
        "exact": "This one",
        "prefix": "Starts with it",
        "pinyinMatches": "By sound",
        "resultsCount": "entries",
        "noResults": "Nothing.",
        "noResultsHint": "Another spelling, or a shorter form; if it is not here, it is not in this book.",
        "traditional": "Traditional",
        "readings": "Say it",
        "readingCount": "readings",
        "senses": "Meaning",
        "senseCount": "senses",
        "word": "Written",
        "zhToZh": "Chinese explanation",
        "zhToZhHint": "Said another way",
        "enToEn": "English explanation",
        "enToEnHint": "For English readers",
        "verse": "Read it aloud",
        "verseHint": "Pause where the line breaks.",
        "wordForms": "Other forms",
        "related": "Related words",
        "relatedNear": "Near in meaning",
        "relatedSame": "Broader and narrower",
        "relatedRadical": "Same radical",
        "relatedForm": "Same root or compound",
        "relatedEmpty": "This group is still empty.",
        "shuffle": "Another handful",
        "frequency": "Frequency",
        "addFavorite": "Keep",
        "removeFavorite": "Put back",
        "copy": "Copy",
        "copied": "Copied",
        "inAtlas": "See where it comes from",
        "loading": "Turning the page.",
        "errorTitle": "The page did not open.",
        "retry": "Once more.",
        "notReady": "The dictionary is not open yet.",
        "notReadyHint": "The words are still on their way.",
        "historyEmpty": "Nothing turned yet.",
        "favoritesEmpty": "Words you like can stay.",
        "allFields": "All kinds",
        "concepts": "concepts",
        "gloss": "Sense",
        "relation": "What it touches",
        "sameField": "Nearby words",
        "coverage": "In other languages",
        "aboutTitle": "This book",
        "aboutBody": "Words come from many places and rest here. Chinese into English, English into Chinese; each entry keeps its own explanation. The reading page holds public-domain poems, with source, licence, and one thing worth learning from each. All of it stays on this machine.",
        "dataSources": "Where the words and lines come from",
        "builtAt": "Built",
        "licenseNote": "CC-CEDICT is used under CC BY-SA 4.0; ECDICT and chinese-xinhua under MIT. The poems are public domain; dataset licences are noted with each source.",
        "backHome": "Back to the beginning",
        "prev": "Back",
        "next": "On",
        "openEntry": "Open",
        "langCount": "languages",
        "familyCount": "word families",
        "sourceCedict": "CC-CEDICT · ZH→EN",
        "sourceEcdict": "ECDICT · EN→ZH",
        "sourceXinhua": "chinese-xinhua · ZH→ZH",
        "sourceVerse": "Verse · Shijing / Chuci / Tang / Song / English",
        "sourceCorpus": "chinese-poetry · Tang / Song / Shijing / Chuci",
        "sourceGutenberg": "Project Gutenberg · English verse",
        "publicDomain": "Public domain",
        "offline": "No network",
        "tabGloss": "Side by side",
        "tabOrigin": "Etymology",
        "tabNetwork": "Relations",
        "crash": "This page did not turn.",
        "entryCount": "entries",
        "favoritesCount": "kept"
      }
    };

    const LocaleCtx = React.createContext({ t: (key) => key, locale: 'zh' });
    const useT = () => React.useContext(LocaleCtx).t;
    const useLocale = () => React.useContext(LocaleCtx).locale;
    const pickText = (record, locale, key, fallbackKey) =>
      locale === 'zh' ? (record && (record[key] || record[fallbackKey])) || '' : (record && (record[fallbackKey] || record[key])) || '';

    const CSS = `
.ld-root {
  height: 100%; min-height: 0; width: 100%; max-width: calc(100vw - 510px); display: flex; flex-direction: column; overflow: hidden;
  background:
    radial-gradient(1200px 520px at 12% -12%, color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent), transparent 62%),
    var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: inherit; font-size: 13px; line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.ld-root *, .ld-root *::before, .ld-root *::after { box-sizing: border-box; }
.ld-root button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; }
.ld-root h1, .ld-root h2, .ld-root h3, .ld-root h4, .ld-root p, .ld-root ol, .ld-root ul { margin: 0; padding: 0; }
.ld-root :focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 58%, transparent); outline-offset: 2px; }
.ld-scroll { overflow: auto; scrollbar-width: thin; }

.ld-top { flex: 0 0 auto; padding: 16px 24px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-bg-base) 88%, transparent); backdrop-filter: blur(8px); }
.ld-brand { display: flex; align-items: center; gap: 14px; }
.ld-mark {
  width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center;
  border-radius: 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 32%, transparent);
  background: linear-gradient(150deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent), color-mix(in srgb, var(--dsw-alias-brand-primary) 4%, transparent));
  color: var(--dsw-alias-brand-primary); font-size: 21px; font-weight: 600; letter-spacing: 0;
}
.ld-heading { flex: 1 1 auto; min-width: 0; }
.ld-title { font-size: 18px; font-weight: 650; letter-spacing: 0.01em; line-height: 1.25; }
.ld-subtitle { margin-top: 2px; font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ld-stats { display: flex; gap: 16px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.ld-stat b { color: var(--dsw-alias-label-primary); font-size: 15px; font-weight: 650; font-variant-numeric: tabular-nums; margin-right: 3px; }
.ld-tabs { display: flex; gap: 2px; margin-top: 12px; }
.ld-tab {
  position: relative; padding: 8px 14px 10px; border-radius: 8px 8px 0 0; color: var(--dsw-alias-label-secondary);
  font-size: 13px; font-weight: 550; transition: color .15s ease, background .15s ease;
}
.ld-tab:hover { color: var(--dsw-alias-label-primary); background: color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent); }
.ld-tab[data-active="true"] { color: var(--dsw-alias-brand-primary); }
.ld-tab[data-active="true"]::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px; border-radius: 2px; background: var(--dsw-alias-brand-primary); }

.ld-searchrow { flex: 0 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 14px 24px; border-bottom: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); }
.ld-searchbox { position: relative; flex: 0 1 460px; min-width: 220px; max-width: 460px; }
.ld-searchbox .ld-searchglyph { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--dsw-alias-label-tertiary); pointer-events: none; }
.ld-search {
  width: 100%; height: 44px; padding: 0 86px 0 38px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 86%, var(--dsw-alias-label-primary) 6%);
  color: var(--dsw-alias-label-primary); font-size: 14.5px; outline: none;
  box-shadow: 0 1px 2px color-mix(in srgb, #000 5%, transparent);
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.ld-search::placeholder { color: var(--dsw-alias-label-tertiary); }
.ld-search:focus { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, var(--dsw-alias-border-l1)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 13%, transparent); background: var(--dsw-alias-bg-base); }
.ld-kbd { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; gap: 4px; pointer-events: none; }
.ld-kbd span { padding: 1px 5px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 5px; font-size: 10px; color: var(--dsw-alias-label-tertiary); background: color-mix(in srgb, var(--dsw-alias-bg-base) 80%, transparent); }
.ld-dir { display: inline-flex; padding: 3px; gap: 2px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent); }
.ld-dir button { padding: 5px 9px; border-radius: 7px; font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.ld-dir button[data-active="true"] { background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 3px color-mix(in srgb, #000 10%, transparent); }
.ld-ghost { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 11px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-size: 12px; background: var(--dsw-alias-bg-base); }
.ld-ghost:hover { color: var(--dsw-alias-label-primary); border-color: color-mix(in srgb, var(--dsw-alias-label-primary) 24%, var(--dsw-alias-border-l1)); }

.ld-page { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.ld-split { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(300px, 390px) minmax(0, 1fr); }
.ld-results { min-width: 0; min-height: 0; overflow: auto; border-right: 1px solid var(--dsw-alias-border-l1); padding: 8px 10px 22px; background: color-mix(in srgb, var(--dsw-alias-bg-base) 96%, var(--dsw-alias-label-primary) 4%); }
.ld-detail { min-width: 0; min-height: 0; overflow: auto; padding: 26px 34px 48px; }
.ld-detail > article { min-width: 0; max-width: 100%; }
.ld-result-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 8px 8px 6px; position: sticky; top: -8px; z-index: 2; background: inherit; backdrop-filter: blur(6px); }
.ld-result-title { font-size: 11px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); }
.ld-result-count { font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.ld-group { margin-top: 6px; }
.ld-group-label { padding: 6px 8px 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.ld-row {
  width: 100%; display: flex; align-items: flex-start; gap: 10px; text-align: left;
  padding: 9px 10px; border-radius: 9px; border: 1px solid transparent;
  transition: background .12s ease, border-color .12s ease;
}
.ld-row:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.ld-row[data-active="true"] { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent); }
.ld-row-main { flex: 1 1 auto; min-width: 0; }
.ld-row-word { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; }
.ld-row-word b { font-size: 16px; font-weight: 650; letter-spacing: .01em; }
.ld-row-word em { font-style: normal; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.ld-row-trad { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.ld-row-gloss { margin-top: 2px; font-size: 12px; color: var(--dsw-alias-label-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.ld-row-sub { margin-top: 2px; font-family: "Songti SC", "Noto Serif CJK SC", serif; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-tertiary); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.ld-row-count { flex: 0 0 auto; min-width: 22px; height: 20px; padding: 0 6px; display: grid; place-items: center; border-radius: 6px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent); font-variant-numeric: tabular-nums; }
.ld-pill { display: inline-flex; align-items: center; height: 17px; padding: 0 5px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: .02em; }
.ld-pill-zh { color: #2f7d5c; background: color-mix(in srgb, #46b37e 16%, transparent); }
.ld-pill-en { color: #9a641c; background: color-mix(in srgb, #e8a33d 18%, transparent); }

.ld-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; min-height: 280px; text-align: center; color: var(--dsw-alias-label-secondary); padding: 40px; }
.ld-empty-mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary) 25%, transparent); font-size: 20px; color: var(--dsw-alias-label-tertiary); }
.ld-empty-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.ld-empty-hint { max-width: 380px; font-size: 12px; color: var(--dsw-alias-label-tertiary); line-height: 1.6; }
.ld-examples { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 4px; }
.ld-chip { padding: 4px 9px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); font-size: 12px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-base); }
.ld-chip:hover { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent); }

.ld-home { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 26px 30px 50px; }
.ld-home-inner { max-width: 1040px; margin: 0 auto; }
.ld-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 8px 2px 20px; }
.ld-hero h2 { font-size: 25px; font-weight: 650; letter-spacing: -.01em; line-height: 1.2; white-space: nowrap; }
.ld-hero p { margin-top: 5px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.ld-hero-intro { margin-top: 3px; font-size: 12px; color: var(--dsw-alias-label-tertiary); max-width: 58ch; }
.ld-hero-badge { font-size: 11px; color: var(--dsw-alias-label-tertiary); text-align: right; white-space: nowrap; }
.ld-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.ld-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 13px; background: var(--dsw-alias-bg-base); padding: 14px 15px; min-width: 0; }
.ld-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.ld-card-title { font-size: 11px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); }
.ld-daily { grid-column: span 2; position: relative; overflow: hidden; background: linear-gradient(125deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, var(--dsw-alias-bg-base)), var(--dsw-alias-bg-base) 58%); }
.ld-daily::after { content: "文"; position: absolute; right: 18px; bottom: -24px; font-size: 116px; line-height: 1; color: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); pointer-events: none; font-family: "Songti SC", "Noto Serif CJK SC", serif; }
.ld-daily-word { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.ld-daily-word b { font-size: 32px; font-weight: 650; letter-spacing: .01em; line-height: 1.15; font-family: "Songti SC", "Noto Serif CJK SC", Georgia, serif; }
.ld-daily-word em { font-style: normal; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.ld-daily-gloss { margin-top: 5px; font-size: 13px; color: var(--dsw-alias-label-secondary); max-width: 74%; line-height: 1.65; }
.ld-daily-actions { margin-top: 12px; display: flex; gap: 8px; }
.ld-list { display: flex; flex-wrap: wrap; gap: 6px; }
.ld-list-empty { font-size: 12px; color: var(--dsw-alias-label-tertiary); padding: 3px 0; }
.ld-lettergrid { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 4px; }
.ld-letter { height: 28px; display: grid; place-items: center; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ld-letter:hover { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, transparent); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.ld-letter small { display: block; font-size: 8px; color: var(--dsw-alias-label-tertiary); line-height: 1; }

.ld-entry-head { border-bottom: 1px solid var(--dsw-alias-border-l1); padding-bottom: 18px; margin-bottom: 18px; }
.ld-entry-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ld-headword { font-size: 40px; line-height: 1.1; font-weight: 650; letter-spacing: -.01em; font-family: "Songti SC", "Noto Serif CJK SC", Georgia, serif; word-break: break-word; }
.ld-headword-en { font-family: Georgia, "Times New Roman", serif; font-size: 38px; }
.ld-trad { margin-top: 5px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.ld-readings { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.ld-reading { font-size: 12.5px; color: var(--dsw-alias-label-secondary); padding: 2px 8px; border-radius: 6px; background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent); }
.ld-entry-actions { display: flex; gap: 6px; flex-shrink: 0; }
.ld-iconbtn { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-base); }
.ld-iconbtn:hover { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent); }
.ld-iconbtn[data-on="true"] { color: #c48a1a; border-color: color-mix(in srgb, #e8a33d 50%, transparent); background: color-mix(in srgb, #e8a33d 10%, transparent); }
.ld-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ld-badge { display: inline-flex; align-items: center; gap: 4px; height: 21px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; letter-spacing: .01em; color: var(--dsw-alias-label-secondary); border: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent); }
.ld-badge b { color: var(--dsw-alias-label-primary); font-weight: 650; }
.ld-badge-gold { color: #9a641c; border-color: color-mix(in srgb, #e8a33d 40%, transparent); background: color-mix(in srgb, #e8a33d 9%, transparent); }
.ld-section { margin-top: 20px; }
.ld-section-title { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); margin-bottom: 8px; }
.ld-section-title::after { content: ""; flex: 1 1 auto; height: 1px; background: var(--dsw-alias-border-l1); }
.ld-readingblock { padding: 12px 0; border-bottom: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent); }
.ld-readingblock:last-child { border-bottom: 0; }
.ld-readinghead { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.ld-readinghead b { font-size: 15px; font-weight: 600; color: var(--dsw-alias-brand-primary); }
.ld-senses { list-style: none; display: flex; flex-direction: column; gap: 5px; }
.ld-sense { display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; line-height: 1.65; }
.ld-sense-num { flex: 0 0 auto; width: 19px; height: 19px; display: grid; place-items: center; border-radius: 50%; font-size: 10px; color: var(--dsw-alias-label-secondary); background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent); font-variant-numeric: tabular-nums; transform: translateY(2px); }
.ld-sense-text { flex: 1 1 auto; word-break: break-word; }
.ld-pos { display: inline-block; min-width: 32px; margin-right: 6px; font-size: 11px; font-style: italic; color: #8a5a14; }
.ld-defs { list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--dsw-alias-label-secondary); line-height: 1.6; }
.ld-mono { padding: 15px 18px; border-radius: 12px; border: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-bg-base) 78%, transparent); }
.ld-mono ol { list-style: none; margin: 0; padding: 0; counter-reset: mono; display: flex; flex-direction: column; gap: 9px; }
.ld-mono li { position: relative; counter-increment: mono; min-width: 0; max-width: 100%; padding-left: 27px; font-family: "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", serif; font-size: 14.5px; line-height: 1.95; color: var(--dsw-alias-label-primary); white-space: pre-line; overflow-wrap: anywhere; word-break: break-word; text-wrap: pretty; }
.ld-mono li::before { content: counter(mono); position: absolute; left: 0; top: 4px; width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; font-family: var(--dsw-font-sans, sans-serif); font-size: 9.5px; line-height: 1; color: var(--dsw-alias-label-tertiary); background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent); font-variant-numeric: tabular-nums; }
.ld-mono-en li { font-family: Georgia, "Times New Roman", serif; font-size: 14px; line-height: 1.85; letter-spacing: .012em; }
.ld-hint { font-size: 10.5px; font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--dsw-alias-label-tertiary); }
.ld-verse { position: relative; margin-top: 24px; padding: 20px 24px 17px; border-radius: 14px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, var(--dsw-alias-border-l1)); background: radial-gradient(120% 150% at 10% 0%, color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent), transparent 58%), color-mix(in srgb, var(--dsw-alias-bg-base) 90%, transparent); overflow: hidden; }
.ld-verse::before { content: "“"; position: absolute; right: 16px; top: -10px; font-family: Georgia, serif; font-size: 96px; line-height: 1; color: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent); pointer-events: none; }
.ld-verse-kicker { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 10.5px; font-weight: 650; letter-spacing: .16em; text-transform: uppercase; color: var(--dsw-alias-brand-primary); }
.ld-verse-kicker::after { content: ""; flex: 1 1 auto; height: 1px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); }
.ld-verse-item + .ld-verse-item { margin-top: 16px; padding-top: 14px; border-top: 1px dashed color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); }
.ld-verse-text { white-space: pre-line; font-family: "Kaiti SC", "STKaiti", "Noto Serif CJK SC", serif; font-size: 17.5px; line-height: 2.12; letter-spacing: .075em; color: var(--dsw-alias-label-primary); text-wrap: pretty; }
.ld-verse-text.en { font-family: Georgia, "Times New Roman", serif; font-size: 15.5px; line-height: 1.95; letter-spacing: .01em; }
.ld-verse-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-top: 12px; font-size: 11.5px; color: var(--dsw-alias-label-tertiary); }
.ld-verse-rhythm { flex: 0 0 auto; padding: 2px 7px; border-radius: 5px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); color: var(--dsw-alias-brand-primary); }
.ld-verse-source { margin-left: auto; text-align: right; letter-spacing: .02em; }
.ld-forms { display: flex; flex-wrap: wrap; gap: 6px; }
.ld-form { font-size: 12px; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
.ld-form b { color: var(--dsw-alias-label-primary); font-weight: 550; margin-left: 4px; }
.ld-related { display: flex; flex-wrap: wrap; gap: 6px; }
.ld-related-section { margin-top: 22px; min-width: 0; max-width: 100%; }
.ld-section-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.ld-shuffle { border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 12px; cursor: pointer; padding: 2px 0; }
.ld-shuffle:hover { color: var(--dsw-alias-label-primary); }
.ld-relgroup { margin-top: 12px; }
.ld-relhead { margin-bottom: 6px; font-size: 11.5px; letter-spacing: .04em; color: var(--dsw-alias-label-tertiary); }
.ld-rel-empty { margin-top: 10px; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
.ld-related button { padding: 5px 9px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1); font-size: 12.5px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); }
.ld-related button:hover { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 42%, transparent); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.ld-related small { margin-left: 5px; color: var(--dsw-alias-label-tertiary); }
.ld-atlas-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; padding: 7px 11px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent); color: var(--dsw-alias-brand-primary); font-size: 12px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.ld-atlas-link:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }

.ld-notice { margin: 22px 24px; padding: 14px 16px; border-radius: 11px; border: 1px solid color-mix(in srgb, #e46a6a 35%, transparent); background: color-mix(in srgb, #e46a6a 8%, transparent); color: var(--dsw-alias-label-primary); font-size: 12.5px; }
.ld-notice b { display: block; margin-bottom: 3px; }
.ld-notice code { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.ld-loading { display: flex; align-items: center; gap: 7px; color: var(--dsw-alias-label-tertiary); font-size: 12px; padding: 10px; }
.ld-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: ld-pulse 1s infinite ease-in-out; }
.ld-dot:nth-child(2) { animation-delay: .15s; } .ld-dot:nth-child(3) { animation-delay: .3s; }
@keyframes ld-pulse { 0%, 100% { opacity: .25; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }

.ld-atlas { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(260px, 320px) minmax(0, 1fr); }
.ld-atlas-rail { min-height: 0; overflow: auto; border-right: 1px solid var(--dsw-alias-border-l1); padding: 16px 12px 30px; }
.ld-atlas-main { min-height: 0; overflow: auto; padding: 24px 30px 50px; }
.ld-mini-search { width: 100%; height: 32px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); color: inherit; font-size: 12px; outline: none; margin-bottom: 10px; }
.ld-mini-search:focus { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, transparent); }
.ld-fields { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.ld-field { padding: 3px 7px; border-radius: 6px; font-size: 11px; color: var(--dsw-alias-label-secondary); border: 1px solid transparent; }
.ld-field[data-active="true"] { color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); }
.ld-concept-list { display: flex; flex-direction: column; gap: 2px; }
.ld-concept { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 8px; text-align: left; }
.ld-concept:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); }
.ld-concept[data-active="true"] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, transparent); }
.ld-concept-glyph { width: 26px; height: 26px; flex: 0 0 26px; display: grid; place-items: center; border-radius: 7px; background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent); font-size: 14px; font-family: "Songti SC", serif; }
.ld-concept b { display: block; font-size: 13px; font-weight: 550; }
.ld-concept small { display: block; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.ld-concept-title { font-size: 30px; font-weight: 650; font-family: "Songti SC", "Noto Serif CJK SC", Georgia, serif; line-height: 1.2; }
.ld-concept-sub { margin-top: 3px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.ld-gloss { margin-top: 12px; font-size: 14px; line-height: 1.75; color: var(--dsw-alias-label-primary); max-width: 760px; }
.ld-langtable { width: 100%; border-collapse: collapse; margin-top: 6px; }
.ld-langtable th { text-align: left; font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 550; padding: 6px 8px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.ld-langtable td { padding: 8px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1) 65%, transparent); vertical-align: top; font-size: 12.5px; }
.ld-langtable td:first-child { width: 84px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.ld-langword { font-size: 15px; font-weight: 550; }
.ld-langword small { margin-left: 6px; font-weight: 400; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.ld-langgloss { color: var(--dsw-alias-label-secondary); }
.ld-langnote { margin-top: 3px; font-size: 11px; color: var(--dsw-alias-label-tertiary); line-height: 1.55; }
.ld-svg { width: 100%; height: auto; margin-top: 6px; }
.ld-foot { margin-top: 26px; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l1); font-size: 11px; color: var(--dsw-alias-label-tertiary); }

.ld-about { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 30px; }
.ld-about-inner { max-width: 760px; margin: 0 auto; }
.ld-about h2 { font-size: 25px; font-weight: 650; margin-bottom: 8px; }
.ld-about p { font-size: 13.5px; line-height: 1.8; color: var(--dsw-alias-label-secondary); margin-bottom: 14px; }
.ld-source { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.ld-source b { font-size: 13px; }
.ld-source span { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); }
.ld-source a { color: var(--dsw-alias-brand-primary); text-decoration: none; font-size: 11.5px; }
.ld-kv { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 16px 0 6px; }
.ld-kv div { padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; }
.ld-kv b { display: block; font-size: 20px; font-weight: 650; font-variant-numeric: tabular-nums; }
.ld-kv span { font-size: 11px; color: var(--dsw-alias-label-tertiary); }

.ld-browse-head { display: flex; align-items: center; gap: 10px; padding: 14px 12px 8px; }
.ld-browse-head b { font-size: 18px; font-weight: 650; }
.ld-pager { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; font-size: 11.5px; color: var(--dsw-alias-label-tertiary); }
.ld-pager button { padding: 4px 9px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.ld-pager button:disabled { opacity: .4; cursor: default; }

.ld-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 12px; cursor: pointer; }
.ld-btn:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.ld-btn-solid { border-color: transparent; background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-button-primary-text); }
.ld-btn-solid:hover { opacity: .88; color: var(--dsw-alias-button-primary-text); }

.ld-corpus { width: min(1040px, 100%); max-width: 1040px; min-width: 0; margin: 0 auto; align-self: center; overflow: auto; padding: 22px 24px 48px; align-items: stretch; }
.ld-corpus-head { width: 100%; max-width: 100%; margin: 0 auto 12px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.ld-corpus-title { font-family: var(--dsw-alias-font-serif, Georgia, 'Songti SC', serif); font-size: 30px; line-height: 1.2; font-weight: 600; }
.ld-corpus-sub { margin-top: 5px; font-size: 12.5px; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-search { width: 100%; max-width: 100%; margin: 0 auto; display: flex; align-items: center; gap: 9px; height: 46px; padding: 0 11px 0 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.ld-corpus-search:focus-within { border-color: var(--dsw-alias-brand-primary); }
.ld-corpus-search svg { flex: none; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-search input { flex: 1 1 auto; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; }
.ld-corpus-search input::placeholder { color: var(--dsw-alias-label-tertiary); }
.ld-corpus-facets { width: 100%; max-width: 100%; margin: 12px auto 18px; padding: 10px 0; border-top: 1px solid var(--dsw-alias-border-l1); border-bottom: 1px solid var(--dsw-alias-border-l1); display: flex; flex-direction: column; gap: 7px; }
.ld-corpus-facets-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 2px; }
.ld-corpus-facets-head b { font-size: 11px; font-weight: 600; letter-spacing: .04em; color: var(--dsw-alias-label-tertiary); }
.ld-facet-row { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 8px; align-items: start; }
.ld-facet-label { padding-top: 4px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.ld-facet-values { display: flex; flex-wrap: wrap; gap: 4px; }
.ld-facet-values .ld-chip { height: 24px; padding: 0 8px; font-size: 11px; }
.ld-facet-values .ld-chip[data-on="true"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }
.ld-corpus-body { width: 100%; max-width: 100%; margin: 0 auto; display: grid; grid-template-columns: minmax(220px, 260px) minmax(0, 1fr); gap: 22px; align-items: start; }
.ld-corpus-list { min-width: 0; border-top: 1px solid var(--dsw-alias-border-l1); }
.ld-corpus-count { padding: 10px 2px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-row { display: block; width: 100%; text-align: left; padding: 14px 10px 14px 12px; border: 0; border-left: 2px solid transparent; border-bottom: 1px solid var(--dsw-alias-border-l1); background: transparent; cursor: pointer; }
.ld-corpus-row:hover { background: var(--dsw-alias-bg-layer-2); }
.ld-corpus-row[data-active="true"] { border-left-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-2); }
.ld-corpus-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.ld-corpus-row-top b { font-size: 14px; font-weight: 650; color: var(--dsw-alias-label-primary); }
.ld-corpus-row-top span { flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-excerpt { margin: 6px 0; display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 12px; line-height: 1.65; color: var(--dsw-alias-label-secondary); }
.ld-corpus-row-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.ld-corpus-row-tags span { padding: 1px 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-3); font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-taxonomy { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 14px; }
.ld-corpus-taxonomy span { padding: 2px 7px; border-radius: 5px; border: 1px solid var(--dsw-alias-border-l1); font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.ld-corpus-detail { min-width: 0; }
.ld-corpus-article { padding: 6px 4px 40px; }
.ld-corpus-article h2 { font-family: var(--dsw-alias-font-serif, Georgia, 'Songti SC', serif); font-size: 32px; line-height: 1.35; font-weight: 600; }
.ld-corpus-byline { margin: 6px 0 18px; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-text { white-space: pre-line; overflow-wrap: anywhere; font-family: var(--dsw-alias-font-serif, Georgia, 'Songti SC', serif); font-size: 18px; line-height: 2.05; color: var(--dsw-alias-label-primary); }
.ld-corpus-note { margin-top: 24px; padding: 14px 16px; border-left: 2px solid var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-2); }
.ld-corpus-note b { font-size: 12px; color: var(--dsw-alias-label-primary); }
.ld-corpus-note p { margin-top: 6px; font-size: 13px; line-height: 1.8; color: var(--dsw-alias-label-secondary); }
.ld-corpus-meta { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-related { margin-top: 22px; }
.ld-corpus-related > b { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.ld-corpus-related > div { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.ld-corpus-status { padding: 42px 12px; font-size: 13px; line-height: 1.9; color: var(--dsw-alias-label-tertiary); }
.ld-corpus-status .ld-hint { margin-top: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }

.ld-prosody-page { width: min(900px, 100%); max-width: 900px; min-width: 0; margin: 0 auto; align-self: center; overflow: auto; padding: 28px 30px 48px; align-items: stretch; }
.ld-prosody-heading h1 { font-family: var(--dsw-alias-font-serif, Georgia, 'Songti SC', serif); font-size: 30px; line-height: 1.2; font-weight: 600; }
.ld-prosody-heading p { margin-top: 6px; font-size: 12.5px; color: var(--dsw-alias-label-tertiary); }
.ld-prosody-form { margin-top: 20px; }
.ld-prosody-form textarea { display: block; width: 100%; min-height: 132px; resize: vertical; padding: 14px 15px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-family: var(--dsw-alias-font-serif, Georgia, 'Songti SC', serif); font-size: 16px; line-height: 1.95; }
.ld-prosody-form textarea:focus { border-color: var(--dsw-alias-brand-primary); }
.ld-prosody-form textarea::placeholder { color: var(--dsw-alias-label-tertiary); }
.ld-prosody-controls { margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ld-seg { display: inline-flex; padding: 2px; border-radius: 9px; background: var(--dsw-alias-bg-layer-3); }
.ld-seg-btn { padding: 5px 10px; border: 0; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; cursor: pointer; }
.ld-seg-btn[data-on="true"] { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.ld-prosody-output { margin-top: 22px; }
.ld-prosody { margin-top: 20px; padding: 16px 17px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); }
.ld-prosody-compact { margin-top: 24px; padding: 0; border: 0; border-top: 1px solid var(--dsw-alias-border-l1); border-radius: 0; background: transparent; }
.ld-prosody-compact .ld-prosody-head { padding-top: 14px; }
.ld-prosody-compact .ld-prosody-head span { display: none; }
.ld-prosody-compact .ld-prosody-lines { gap: 4px; }
.ld-prosody-compact .ld-prosody-line { padding: 5px 0 5px 9px; background: transparent; }
.ld-prosody-compact .ld-prosody-chars { font-size: 15px; line-height: 1.8; }
.ld-prosody-compact .ld-prosody-stress { font-size: 13px; letter-spacing: .18em; }
.ld-prosody-compact .ld-prosody-note { margin-top: 1px; }
.ld-prosody-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.ld-prosody-head b { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.ld-prosody-head span { font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.ld-prosody-lines { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.ld-prosody-line { padding: 8px 10px; border-left: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent); background: var(--dsw-alias-bg-layer-2); }
.ld-prosody-chars { display: flex; flex-wrap: wrap; gap: 2px; font-family: var(--dsw-alias-font-serif, Georgia, 'Songti SC', serif); font-size: 22px; line-height: 1.45; }
.ld-prosody-char { padding: 1px 2px; border-radius: 4px; }
.ld-prosody-ping { color: #2f6f5e; }
.ld-prosody-ze { color: #9b4c3f; }
.ld-prosody-unknown { color: var(--dsw-alias-label-tertiary); opacity: .45; }
.ld-prosody-note { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 4px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.ld-prosody-note code { letter-spacing: .14em; color: var(--dsw-alias-label-secondary); }
.ld-prosody-stress { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .24em; font-size: 18px; line-height: 1.6; }
.ld-prosody-row { display: flex; align-items: baseline; gap: 10px; margin-top: 8px; }
.ld-prosody-label { flex: none; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.ld-prosody-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.ld-prosody-tag { padding: 2px 6px; border-radius: 5px; background: var(--dsw-alias-bg-layer-3); font-size: 11px; color: var(--dsw-alias-label-secondary); }
.ld-prosody-warning { margin-top: 10px; font-size: 10.5px; line-height: 1.7; color: var(--dsw-alias-label-tertiary); }

.ld-crash { padding: 40px; }
.ld-crash pre { margin-top: 12px; white-space: pre-wrap; font-size: 12px; color: #b44646; }
.ld-panel-icon { display: inline-flex; align-items: center; justify-content: center; }

@media (max-width: 1600px) {
  .ld-split { grid-template-columns: minmax(240px, 300px) minmax(0, 1fr); }
  .ld-detail { padding: 20px 18px 36px; }
}

@media (max-width: 900px) {
  .ld-split { grid-template-columns: 1fr; }
  .ld-results { border-right: 0; border-bottom: 1px solid var(--dsw-alias-border-l1); max-height: 42vh; }
  .ld-detail { padding: 20px 18px 36px; }
  .ld-grid { grid-template-columns: 1fr; }
  .ld-daily { grid-column: span 1; }
  .ld-atlas { grid-template-columns: 1fr; }
  .ld-atlas-rail { border-right: 0; border-bottom: 1px solid var(--dsw-alias-border-l1); max-height: 38vh; }
  .ld-stats { display: none; }
  .ld-lettergrid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .ld-kv { grid-template-columns: 1fr; }
  .ld-corpus { padding: 18px 16px 32px; }
  .ld-corpus-body { grid-template-columns: 1fr; gap: 18px; }
  .ld-corpus-detail { padding-top: 18px; border-top: 1px solid var(--dsw-alias-border-l1); }
  .ld-corpus-title { font-size: 26px; }
  .ld-corpus-article h2 { font-size: 28px; }
  .ld-facet-row { grid-template-columns: 1fr; gap: 2px; }
  .ld-facet-label { padding-top: 0; }
  .ld-prosody-page { padding: 20px 16px 36px; }
  .ld-prosody-heading h1 { font-size: 26px; }
  .ld-prosody-controls { align-items: stretch; flex-direction: column; }
}
`;

    function useLocaleSnapshot(service) {
      const [snapshot, setSnapshot] = useState(() => service.getSnapshot());
      useEffect(() => {
        const unsubscribe = service.subscribe(() => setSnapshot(service.getSnapshot()));
        setSnapshot(service.getSnapshot());
        return unsubscribe;
      }, [service]);
      return snapshot;
    }

    function LocaleShell(props) {
      const snapshot = useLocaleSnapshot(props.localeService);
      const locale = snapshot.active && snapshot.active.indexOf('zh') === 0 ? 'zh' : 'en';
      const value = useMemo(() => ({ t: props.t, locale }), [props.t, locale]);
      return h(LocaleCtx.Provider, { value }, h(Boundary, { t: props.t }, h(App)));
    }

    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error) {
        if (typeof console !== 'undefined') console.error('[lingua-atlas]', error);
      }
      render() {
        if (!this.state.error) return this.props.children;
        return h(
          'div',
          { className: 'ld-root ld-crash' },
          h('style', null, CSS),
          h('h1', null, this.props.t('crash')),
          h('pre', null, String((this.state.error && this.state.error.message) || this.state.error)),
        );
      }
    }

    function SearchGlyph(props) {
      const size = props && props.size ? props.size : 16;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false', className: props && props.className },
        h('circle', { cx: 7, cy: 7, r: 4.5, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M10.5 10.5 13.6 13.6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      );
    }

    function StarGlyph(props) {
      return h(
        'svg',
        { width: 16, height: 16, viewBox: '0 0 24 24', fill: props && props.filled ? 'currentColor' : 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round',
        }),
      );
    }

    function RandomGlyph() {
      return h(
        'svg',
        { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M4 7h3.2c4.6 0 6.1 10 10.6 10H20M4 17h3.2c1.8 0 3-1.5 4-3.2M14 7c1 1.2 1.8 2.1 3 2.1H20', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        h('path', { d: 'm18 5 2 2-2 2M18 15l2 2-2 2', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function CopyGlyph() {
      return h(
        'svg',
        { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
        h('rect', { x: 9, y: 9, width: 10, height: 10, rx: 2, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', { d: 'M15 5H7a2 2 0 0 0-2 2v8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
      );
    }

    function AtlasGlyph(props) {
      const size = props && props.size ? props.size : 18;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        h('circle', { cx: 12, cy: 12, r: 8.2, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('ellipse', { cx: 12, cy: 12, rx: 3.4, ry: 8.2, stroke: 'currentColor', strokeWidth: 1.1, opacity: 0.7 }),
        h('path', { d: 'M4.4 9.2h15.2M4.4 14.8h15.2', stroke: 'currentColor', strokeWidth: 1, opacity: 0.5 }),
      );
    }

    function request(path, operation, payload) {
      return fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ op: operation, ...(payload || {}) }),
      })
        .then(async (response) => {
          let body = null;
          try { body = await response.json(); } catch { body = null; }
          if (!response.ok || !body || !body.ok) {
            const error = new Error((body && body.error && body.error.message) || `HTTP ${response.status}`);
            error.code = body && body.error && body.error.code;
            throw error;
          }
          return body.value;
        });
    }

    function api(operation, payload) {
      return request('api/lingua-dict/query', operation, payload);
    }

    function corpusApi(operation, payload) {
      return request('api/lingua-corpus/query', operation, payload);
    }

    function prosodyApi(payload) {
      return request('api/lingua-prosody/query', 'analyze', payload);
    }

    function classify(query) {
      return /[\u3400-\u9fff\uf900-\ufaff]/.test(query) ? 'zh' : 'en';
    }

    function todayKey() {
      const now = new Date();
      return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }

    function readStore(key, fallback) {
      try {
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    }

    function writeStore(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }

    const DAILY = [
      ['en', 'serendipity'],
      ['zh', '学习'],
      ['en', 'ephemeral'],
      ['zh', '朋友'],
      ['en', 'resilience'],
      ['zh', '世界'],
      ['en', 'language'],
      ['zh', '月亮'],
    ];

    function WordBadge(props) {
      const t = useT();
      const direction = props.direction;
      return h('span', { className: `ld-pill ${direction === 'zh' ? 'ld-pill-zh' : 'ld-pill-en'}` }, direction === 'zh' ? t('directionZh') : t('directionEn'));
    }

    const FACET_ROWS = [
      ['collection', 'facetCollection'],
      ['era', 'facetEra'],
      ['genre', 'facetGenre'],
      ['form', 'facetForm'],
      ['moods', 'facetMood'],
      ['images', 'facetImage'],
      ['seasons', 'facetSeason'],
      ['themes', 'facetTheme'],
    ];

    function corpusLabels(item, limit = 4) {
      const value = item && item.facets;
      if (!value) return (item && item.tags || []).slice(0, limit);
      return [
        value.collection,
        value.era,
        value.genre,
        value.form,
        ...(value.themes || []),
        ...(value.moods || []),
        ...(value.images || []),
        ...(value.seasons || []),
      ].filter(Boolean).slice(0, limit);
    }

    function CorpusPage() {
      const t = useT();
      const [query, setQuery] = useState('');
      const [facets, setFacets] = useState({});
      const [facetData, setFacetData] = useState(null);
      const [results, setResults] = useState(null);
      const [state, setState] = useState('idle');
      const [error, setError] = useState(null);
      const [selected, setSelected] = useState(null);
      const [passageState, setPassageState] = useState('idle');
      const [passageError, setPassageError] = useState(null);
      const sequence = useRef(0);

      const openPassage = useCallback((id) => {
        const ticket = ++sequence.current;
        setPassageState('loading');
        setPassageError(null);
        corpusApi('passage', { id })
          .then((value) => {
            if (ticket !== sequence.current) return;
            setSelected(value);
            setPassageState('ready');
          })
          .catch((issue) => {
            if (ticket !== sequence.current) return;
            setPassageError(issue);
            setPassageState('error');
          });
      }, []);

      const search = useCallback((nextQuery, nextFacets) => {
        const ticket = ++sequence.current;
        const activeFacets = nextFacets || {};
        setState('loading');
        setError(null);
        setSelected(null);
        setPassageState('idle');
        corpusApi('search', {
          query: String(nextQuery || '').trim(),
          tags: [],
          facets: activeFacets,
          limit: 24,
        })
          .then((value) => {
            if (ticket !== sequence.current) return;
            setResults(value);
            setState('ready');
            if (value.results && value.results[0]) openPassage(value.results[0].id);
          })
          .catch((issue) => {
            if (ticket !== sequence.current) return;
            setError(issue);
            setState('error');
          });
      }, [openPassage]);

      useEffect(() => {
        let cancelled = false;
        corpusApi('stats', {})
          .then((value) => { if (!cancelled) setFacetData((value && value.facets) || null); })
          .catch(() => {});
        search('月', {});
        return () => { cancelled = true; };
      }, [search]);

      const chooseFacet = (key, value) => {
        const next = { ...facets };
        if (!value || next[key] === value) delete next[key];
        else next[key] = value;
        setFacets(next);
        search(query, next);
      };

      const clearFacets = () => {
        setFacets({});
        search(query, {});
      };

      const random = () => {
        corpusApi('random', { facets })
          .then((value) => {
            if (value && value.id) openPassage(value.id);
          })
          .catch(() => {});
      };

      return h(
        'section',
        { className: 'ld-page ld-corpus' },
        h('div', { className: 'ld-corpus-head' },
          h('div', null,
            h('h1', { className: 'ld-corpus-title' }, t('corpusTitle')),
            h('p', { className: 'ld-corpus-sub' }, t('corpusSubtitle')),
          ),
          h('button', { type: 'button', className: 'ld-btn', onClick: random }, t('corpusRandom')),
        ),
        h('form', {
          className: 'ld-corpus-search',
          onSubmit: (event) => { event.preventDefault(); search(query, facets); },
        },
          h(SearchGlyph),
          h('input', {
            value: query,
            onChange: (event) => setQuery(event.target.value),
            placeholder: t('corpusPlaceholder'),
            'aria-label': t('corpusPlaceholder'),
          }),
          h('button', { type: 'submit', className: 'ld-btn ld-btn-solid' }, t('corpusSearch')),
        ),
        facetData
          ? h('div', { className: 'ld-corpus-facets' },
              h('div', { className: 'ld-corpus-facets-head' },
                h('b', null, t('corpusFacets')),
                Object.keys(facets).length
                  ? h('button', { type: 'button', className: 'ld-btn', onClick: clearFacets }, t('corpusClearFacets'))
                  : null,
              ),
              FACET_ROWS.map(([key, labelKey]) => {
                const values = facetData[key] || [];
                if (!values.length) return null;
                return h('div', { className: 'ld-facet-row', key },
                  h('span', { className: 'ld-facet-label' }, t(labelKey)),
                  h('div', { className: 'ld-facet-values' },
                    h('button', {
                      type: 'button', className: 'ld-chip', 'data-on': !facets[key],
                      onClick: () => chooseFacet(key, ''),
                    }, t('facetAny')),
                    values.map((item) => h('button', {
                      key: item.name, type: 'button', className: 'ld-chip',
                      'data-on': facets[key] === item.name,
                      title: `${item.count}`,
                      onClick: () => chooseFacet(key, item.name),
                    }, item.name)),
                  ),
                );
              }),
            )
          : null,
        h('div', { className: 'ld-corpus-body' },
          h('div', { className: 'ld-corpus-list' },
            state === 'loading' ? h('div', { className: 'ld-corpus-status' }, t('corpusLoading')) : null,
            state === 'error'
              ? h('div', { className: 'ld-corpus-status' },
                  h('p', null, t('corpusError')),
                  h('p', { className: 'ld-hint' }, String(error && error.message || '')),
                  h('button', { type: 'button', className: 'ld-btn', onClick: () => search(query, facets) }, t('corpusRetry')),
                )
              : null,
            state === 'ready' && results && results.total === 0
              ? h('div', { className: 'ld-corpus-status' },
                  h('p', null, t('corpusEmpty')),
                  h('p', { className: 'ld-hint' }, t('corpusEmptyHint')),
                )
              : null,
            state === 'ready' && results
              ? h('div', { className: 'ld-corpus-count' }, `${results.total} ${t('corpusResults')}`)
              : null,
            state === 'ready' && results
              ? results.results.map((item) => h('button', {
                  key: item.id,
                  type: 'button',
                  className: 'ld-corpus-row',
                  'data-active': selected && selected.id === item.id,
                  onClick: () => openPassage(item.id),
                },
                  h('div', { className: 'ld-corpus-row-top' },
                    h('b', null, item.title),
                    h('span', null, item.author),
                  ),
                  h('p', { className: 'ld-corpus-excerpt' }, item.excerpt),
                  h('div', { className: 'ld-corpus-row-tags' },
                    corpusLabels(item).map((value) => h('span', { key: value }, value)),
                  ),
                ))
              : null,
          ),
          h('div', { className: 'ld-corpus-detail' },
            passageState === 'loading'
              ? h('div', { className: 'ld-corpus-status' }, t('corpusLoading'))
              : passageState === 'error'
                ? h('div', { className: 'ld-corpus-status' },
                    h('p', null, t('corpusError')),
                    h('p', { className: 'ld-hint' }, String(passageError && passageError.message || '')),
                  )
                : selected
                  ? h('article', { className: 'ld-corpus-article' },
                      h('header', null,
                        h('h2', null, selected.title),
                        h('p', { className: 'ld-corpus-byline' },
                          selected.author,
                          selected.section ? ` · ${selected.section}` : '',
                        ),
                      ),
                      h('div', { className: 'ld-corpus-text' }, selected.text),
                      selected.note
                        ? h('div', { className: 'ld-corpus-note' },
                            h('b', null, t('corpusNote')),
                            h('p', null, selected.note),
                          )
                        : null,
                      h(ProsodyPanel, { value: selected.prosody, compact: true }),
                      selected.facets
                        ? h('div', { className: 'ld-corpus-taxonomy' },
                            corpusLabels(selected, 12).map((value) => h('span', { key: value }, value)),
                          )
                        : null,
                      h('div', { className: 'ld-corpus-meta' },
                        h('span', null, `${t('corpusSource')}：${selected.source}`),
                        h('span', null, `${t('corpusLicense')}：${selected.license}`),
                      ),
                      selected.related && selected.related.length
                        ? h('div', { className: 'ld-corpus-related' },
                            h('b', null, t('corpusRelated')),
                            h('div', null, selected.related.slice(0, 5).map((item) => h('button', {
                              key: item.id, type: 'button', className: 'ld-chip',
                              onClick: () => openPassage(item.id),
                            }, item.title))),
                          )
                        : null,
                    )
                  : h('div', { className: 'ld-corpus-status' }, t('corpusPrompt')),
          ),
        ),
      );
    }

    function ProsodyPanel(props) {
      const t = useT();
      const value = props.value;
      if (!value || !value.lines || !value.lines.length) return null;
      const alliterations = [...new Set(value.lines.flatMap((line) => line.alliterations || []))].slice(0, 3);
      const assonances = [...new Set(value.lines.flatMap((line) => line.assonances || []))].slice(0, 3);
      return h(
        'section',
        { className: `ld-prosody${props.compact ? ' ld-prosody-compact' : ''}` },
        h('div', { className: 'ld-prosody-head' },
          h('b', null, t('prosodyTitle')),
          h('span', null, value.summary || ''),
        ),
        h('div', { className: 'ld-prosody-lines' },
          value.lines.slice(0, props.compact ? 4 : 24).map((line, index) => h('div', { key: index, className: 'ld-prosody-line' },
            value.lang === 'zh'
              ? h('div', { className: 'ld-prosody-chars' },
                  line.chars.map((char, charIndex) => h('span', {
                    key: charIndex,
                    className: `ld-prosody-char ld-prosody-${char.ping === '平' ? 'ping' : char.ping === '仄' ? 'ze' : 'unknown'}`,
                    title: `${char.pinyin || '?'} · ${char.ping}`,
                  }, char.c)),
                )
              : h('div', { className: 'ld-prosody-stress' }, `${t('prosodyStress')}  ${line.stress || '—'}`),
            h('div', { className: 'ld-prosody-note' },
              value.lang === 'zh'
                ? `${line.pattern} · ${line.pause}`
                : `${line.syllables} ${t('prosodySyllables')} · ${t('prosodyMeter')} ${line.meter}`,
              value.lang === 'zh' && line.pingze ? h('span', null, t('prosodyPingze')) : null,
              value.lang === 'zh' && line.pingze ? h('code', null, line.pingze) : null,
            ),
          )),
        ),
        value.rhymes && value.rhymes.length
          ? h('div', { className: 'ld-prosody-row' },
              h('span', { className: 'ld-prosody-label' }, t('prosodyRhyme')),
              h('span', { className: 'ld-prosody-tags' }, value.rhymes.map((rhyme) => h('span', { key: rhyme.letter, className: 'ld-prosody-tag' },
                `${rhyme.letter}${rhyme.words && rhyme.words.length ? ` · ${rhyme.words.join(' ')}` : rhyme.key ? ` · ${rhyme.key}` : ''}`,
              ))),
            )
          : null,
        alliterations.length
          ? h('div', { className: 'ld-prosody-row' },
              h('span', { className: 'ld-prosody-label' }, t('prosodyAlliteration')),
              h('span', { className: 'ld-prosody-tags' }, alliterations.map((item) => h('span', { key: item, className: 'ld-prosody-tag' }, item))),
            )
          : null,
        assonances.length
          ? h('div', { className: 'ld-prosody-row' },
              h('span', { className: 'ld-prosody-label' }, t('prosodyAssonance')),
              h('span', { className: 'ld-prosody-tags' }, assonances.map((item) => h('span', { key: item, className: 'ld-prosody-tag' }, item))),
            )
          : null,
        value.warnings && value.warnings.length
          ? h('p', { className: 'ld-prosody-warning' }, value.warnings.join(' '))
          : null,
      );
    }

    function ProsodyPage() {
      const t = useT();
      const [text, setText] = useState('');
      const [mode, setMode] = useState('auto');
      const [state, setState] = useState('idle');
      const [error, setError] = useState(null);
      const [result, setResult] = useState(null);

      const analyze = () => {
        const value = text.trim();
        if (!value) {
          setState('empty');
          setResult(null);
          return;
        }
        setState('loading');
        setError(null);
        prosodyApi({ text: value, lang: mode === 'auto' ? undefined : mode })
          .then((data) => {
            setResult(data);
            setState('ready');
          })
          .catch((issue) => {
            setError(issue);
            setState('error');
          });
      };

      return h(
        'section',
        { className: 'ld-page ld-prosody-page' },
        h('div', { className: 'ld-prosody-heading' },
          h('h1', null, t('prosodyTitle')),
          h('p', null, t('prosodySubtitle')),
        ),
        h('div', { className: 'ld-prosody-form' },
          h('textarea', {
            value: text,
            rows: 5,
            placeholder: t('prosodyPlaceholder'),
            'aria-label': t('prosodyPlaceholder'),
            onChange: (event) => setText(event.target.value),
          }),
          h('div', { className: 'ld-prosody-controls' },
            h('div', { className: 'ld-seg' },
              [['auto', t('prosodyLangAuto')], ['zh', t('prosodyLangZh')], ['en', t('prosodyLangEn')]].map(([id, label]) =>
                h('button', {
                  key: id, type: 'button', className: 'ld-seg-btn', 'data-on': mode === id,
                  onClick: () => setMode(id),
                }, label),
              ),
            ),
            h('button', { type: 'button', className: 'ld-btn ld-btn-solid', onClick: analyze }, t('prosodyButton')),
          ),
        ),
        h('div', { className: 'ld-prosody-output' },
          state === 'loading' ? h('p', { className: 'ld-hint' }, t('loading')) : null,
          state === 'error'
            ? h('div', { className: 'ld-empty' },
                h('p', null, t('prosodyError')),
                h('p', { className: 'ld-hint' }, String(error && error.message || '')),
                h('button', { type: 'button', className: 'ld-btn', onClick: analyze }, t('retry')),
              )
            : null,
          state === 'empty' ? h('div', { className: 'ld-empty' }, h('p', null, t('prosodyEmpty'))) : null,
          state === 'idle' ? h('div', { className: 'ld-empty' }, h('p', null, t('prosodyPrompt'))) : null,
          state === 'ready' && result ? h(ProsodyPanel, { value: result }) : null,
        ),
      );
    }

    function App() {
      const [tab, setTab] = useState('dict');
      const [atlasFocus, setAtlasFocus] = useState(null);
      const [stats, setStats] = useState(null);
      const [statsError, setStatsError] = useState(null);

      useEffect(() => {
        let alive = true;
        api('stats')
          .then((value) => { if (alive) setStats(value); })
          .catch((error) => { if (alive) setStatsError(error); });
        return () => { alive = false; };
      }, []);

      return h(
        'div',
        { className: 'ld-root' },
        h('style', null, CSS),
        h(AppHeader, { tab, setTab, stats }),
        tab === 'dict'
          ? h(DictionaryPage, { stats, statsError, onOpenAtlas: (conceptId) => { setAtlasFocus(conceptId); setTab('atlas'); } })
          : tab === 'corpus'
            ? h(CorpusPage)
            : tab === 'prosody'
              ? h(ProsodyPage)
              : tab === 'atlas'
                ? h(AtlasPage, { focus: atlasFocus, onFocus: setAtlasFocus })
                : h(AboutPage, { stats, statsError }),
      );
    }

    function AppHeader(props) {
      const t = useT();
      const tabs = [
        ['dict', 'tabDict'],
        ['corpus', 'tabCorpus'],
        ['prosody', 'tabProsody'],
        ['atlas', 'tabAtlas'],
        ['about', 'tabAbout'],
      ];
      return h(
        'header',
        { className: 'ld-top' },
        h(
          'div',
          { className: 'ld-brand' },
          h('div', { className: 'ld-mark' }, '辞'),
          h(
            'div',
            { className: 'ld-heading' },
            h('div', { className: 'ld-title' }, t('title')),
            h('div', { className: 'ld-subtitle' }, t('subtitle')),
          ),
        ),
        h(
          'div',
          { className: 'ld-tabs' },
          tabs.map(([id, label]) =>
            h('button', {
              key: id, type: 'button', className: 'ld-tab', 'data-active': props.tab === id,
              onClick: () => props.setTab(id),
            }, t(label)),
          ),
        ),
      );
    }

    function formatNumber(value) {
      return Number(value || 0).toLocaleString('en-US');
    }

    function DictionaryPage(props) {
      const t = useT();
      const locale = useLocale();
      const [query, setQuery] = useState('');
      const [direction, setDirection] = useState('auto');
      const [result, setResult] = useState(null);
      const [lookupState, setLookupState] = useState('idle');
      const [lookupError, setLookupError] = useState(null);
      const [selected, setSelected] = useState(null);
      const [entryState, setEntryState] = useState('idle');
      const [entryError, setEntryError] = useState(null);
      const [relatedOffset, setRelatedOffset] = useState(0);
      const [browse, setBrowse] = useState(null);
      const [browseState, setBrowseState] = useState('idle');
      const [history, setHistory] = useState(() => readStore('lingua-atlas:history', []));
      const [favorites, setFavorites] = useState(() => readStore('lingua-atlas:favorites', []));
      const [daily, setDaily] = useState(null);
      const [dailyState, setDailyState] = useState('idle');
      const [retryKey, setRetryKey] = useState(0);
      const inputRef = useRef(null);
      const lookupSequence = useRef(0);
      const entrySequence = useRef(0);

      const remember = useCallback((item) => {
        setHistory((previous) => {
          const next = [item, ...previous.filter((entry) => !(entry.direction === item.direction && entry.word === item.word))].slice(0, 14);
          writeStore('lingua-atlas:history', next);
          return next;
        });
      }, []);

      const openEntry = useCallback((entryDirection, word, offset = 0) => {
        const ticket = ++entrySequence.current;
        setRelatedOffset(offset);
        setEntryState('loading');
        setEntryError(null);
        api('entry', { direction: entryDirection, word, relatedOffset: offset })
          .then((value) => {
            if (ticket !== entrySequence.current) return;
            setSelected(value);
            setEntryState('ready');
            remember({ direction: entryDirection, word: value.entry.w });
          })
          .catch((error) => {
            if (ticket !== entrySequence.current) return;
            setEntryError(error);
            setEntryState('error');
          });
      }, [remember]);

      const shuffleRelated = useCallback(() => {
        if (!selected) return;
        openEntry(selected.direction, selected.entry.w, relatedOffset + 1);
      }, [selected, relatedOffset, openEntry]);

      const openSmart = useCallback((word) => {
        const text = String(word || '').trim();
        if (!text) return;
        const direct = classify(text);
        api('lookup', { query: text, direction: 'auto', limit: 5 })
          .then((value) => {
            const hit = firstHit(value);
            if (hit) openEntry(hit.direction, hit.w);
            else {
              setSelected(null);
              setEntryState('idle');
              setEntryError(null);
            }
          })
          .catch(() => {
            setSelected(null);
            setEntryState('idle');
            setEntryError(null);
          });
      }, [openEntry]);

      useEffect(() => {
        const key = `lingua-atlas:daily:v2:${todayKey()}`;
        const cached = readStore(key, null);
        if (cached && cached.entry) {
          setDaily(cached);
          setDailyState('ready');
          return;
        }
        const [fallbackDirection, fallbackWord] = DAILY[new Date().getDate() % DAILY.length];
        setDailyState('loading');
        api('entry', { direction: fallbackDirection, word: fallbackWord })
          .then((value) => {
            setDaily(value);
            setDailyState('ready');
            writeStore(key, value);
          })
          .catch(() => {
            api('random', { direction: 'zh' })
              .then((value) => { setDaily(value); setDailyState('ready'); })
              .catch(() => setDailyState('error'));
          });
      }, []);

      useEffect(() => {
        const text = query.trim();
        if (!text) {
          setResult(null);
          setLookupState('idle');
          setLookupError(null);
          return undefined;
        }
        const ticket = ++lookupSequence.current;
        setLookupState('loading');
        const timer = window.setTimeout(() => {
          api('lookup', { query: text, direction, limit: 24 })
            .then((value) => {
              if (ticket !== lookupSequence.current) return;
              setResult(value);
              setLookupState('ready');
              setBrowse(null);
            })
            .catch((error) => {
              if (ticket !== lookupSequence.current) return;
              setLookupError(error);
              setLookupState('error');
            });
        }, 180);
        return () => window.clearTimeout(timer);
      }, [query, direction, retryKey]);

      useEffect(() => {
        function onKey(event) {
          if (event.key === '/' && document.activeElement !== inputRef.current) {
            event.preventDefault();
            inputRef.current && inputRef.current.focus();
          }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, []);

      const showBrowse = (browseDirection, letter, offset) => {
        setBrowseState('loading');
        api('browse', { direction: browseDirection, letter, offset, limit: 40 })
          .then((value) => {
            setBrowse(value);
            setBrowseState('ready');
            setQuery('');
          })
          .catch(() => setBrowseState('error'));
      };

      const openFavorite = (item) => {
        setQuery(item.word);
        setDirection(item.direction);
        openEntry(item.direction, item.word);
      };

      const toggleFavorite = (value) => {
        const key = `${value.direction}:${value.entry.w}`;
        setFavorites((previous) => {
          const exists = previous.some((item) => `${item.direction}:${item.word}` === key);
          const next = exists
            ? previous.filter((item) => `${item.direction}:${item.word}` !== key)
            : [{ direction: value.direction, word: value.entry.w, at: Date.now() }, ...previous];
          writeStore('lingua-atlas:favorites', next);
          return next;
        });
      };

      const isFavorite = selected && favorites.some((item) => item.direction === selected.direction && item.word === selected.entry.w);
      const hasQuery = query.trim().length > 0;

      return h(
        'div',
        { className: 'ld-page' },
        h(
          'div',
          { className: 'ld-searchrow' },
          h(
            'div',
            { className: 'ld-searchbox' },
            h(SearchGlyph, { className: 'ld-searchglyph' }),
            h('input', {
              ref: inputRef,
              className: 'ld-search',
              value: query,
              placeholder: t('searchPlaceholder'),
              spellCheck: false,
              autoComplete: 'off',
              title: t('searchHint'),
              onChange: (event) => { setQuery(event.target.value); setBrowse(null); },
              onKeyDown: (event) => {
                if (event.key === 'Escape') { setQuery(''); setResult(null); setSelected(null); }
                if (event.key === 'Enter') {
                  if (query.trim()) openSmart(query);
                }
              },
            }),
            h('div', { className: 'ld-kbd' }, h('span', null, 'Enter'), h('span', null, 'Esc')),
          ),
          h(
            'div',
            { className: 'ld-dir' },
            [['auto', 'directionAuto'], ['zh', 'directionZh'], ['en', 'directionEn']].map(([id, label]) =>
              h('button', {
                key: id, type: 'button', 'data-active': direction === id,
                onClick: () => setDirection(id),
              }, t(label)),
            ),
          ),
          h(
            'button',
            {
              type: 'button', className: 'ld-ghost',
              onClick: () => {
                api('random', { direction: direction === 'en' ? 'en' : 'zh' })
                  .then((value) => { setSelected(value); setEntryState('ready'); setQuery(value.entry.w); remember({ direction: value.direction, word: value.entry.w }); })
                  .catch(() => {});
              },
            },
            h(RandomGlyph), t('random'),
          ),
        ),
        h(
          'div',
          { className: 'ld-split' },
          h(
            'div',
            { className: 'ld-results' },
            hasQuery
              ? h(ResultsPane, { result, state: lookupState, error: lookupError, selected, onOpen: openEntry, onSmart: openSmart, direction, query, onRetry: () => setRetryKey((value) => value + 1) })
              : browse
                ? h(BrowsePane, { browse, state: browseState, selected, onOpen: openEntry, onPage: (offset) => showBrowse(browse.direction, browse.letter, offset), onExit: () => setBrowse(null) })
                : h(HomeRail, {
                    daily, dailyState, history, favorites, onOpen: openEntry, onSmart: openSmart, onFavorite: openFavorite, onBrowse: showBrowse,
                    letters: props.stats ? { zh: props.stats.zh.letters, en: props.stats.en.letters } : null,
                    locale, t,
                  }),
          ),
          h(
            'div',
            { className: 'ld-detail' },
            h(DetailPane, {
              value: selected,
              state: entryState,
              error: entryError,
              locale,
              isFavorite,
              onToggleFavorite: toggleFavorite,
              onOpen: openEntry,
              onShuffle: shuffleRelated,
              onSmart: openSmart,
              onAtlas: (conceptId) => props.onOpenAtlas(conceptId),
              onRetry: () => selected && openEntry(selected.direction, selected.entry.w),
            }),
          ),
        ),
      );
    }

    function firstHit(result) {
      if (!result) return null;
      const groups = [result.zh, result.en].filter(Boolean);
      for (const group of groups) {
        if (group.exact && group.exact.length) return { direction: group === result.zh ? 'zh' : 'en', w: group.exact[0].w };
      }
      for (const group of groups) {
        if (group.prefix && group.prefix.length) return { direction: group === result.zh ? 'zh' : 'en', w: group.prefix[0].w };
        if (group.pinyin && group.pinyin.length) return { direction: 'zh', w: group.pinyin[0].w };
      }
      return null;
    }

    function HomeRail(props) {
      const t = props.t;
      return h(
        'div',
        { className: 'ld-home' },
        h(
          'div',
          { className: 'ld-home-inner' },
          h(
            'div',
            { className: 'ld-hero' },
            h('div', null, h('h2', null, t('title')), h('p', null, t('subtitle')), h('p', { className: 'ld-hero-intro' }, t('intro'))),
            h('div', { className: 'ld-hero-badge' }, t('offline')),
          ),
          h(
            'div',
            { className: 'ld-grid' },
            h(
              'div',
              { className: 'ld-card ld-daily' },
              h(
                'div',
                { className: 'ld-card-head' },
                h('span', { className: 'ld-card-title' }, t('dailyWord')),
                props.daily ? h(WordBadge, { direction: props.daily.direction }) : null,
              ),
              props.dailyState === 'loading'
                ? h(Loading, { label: t('loading') })
                : props.daily
                  ? h(
                      'div',
                      null,
                      h(
                        'div',
                        { className: 'ld-daily-word' },
                        h('b', { className: 'ld-headword-en' }, props.daily.entry.w),
                        h('em', null, props.daily.direction === 'zh' ? (props.daily.entry.r[0] && props.daily.entry.r[0].p) : props.daily.entry.ph || ''),
                      ),
                      h('div', { className: 'ld-daily-gloss' }, previewGloss(props.daily.entry, props.daily.direction)),
                      h(
                        'div',
                        { className: 'ld-daily-actions' },
                        h('button', {
                          type: 'button', className: 'ld-chip',
                          onClick: () => props.onSmart(props.daily.entry.w),
                        }, t('openEntry'), ' →'),
                      ),
                    )
                  : h('div', { className: 'ld-list-empty' }, '—'),
            ),
            h(
              'div',
              { className: 'ld-card' },
              h('div', { className: 'ld-card-head' }, h('span', { className: 'ld-card-title' }, t('recent'))),
              props.history.length
                ? h('div', { className: 'ld-list' }, props.history.slice(0, 8).map((item) =>
                    h('button', { key: `${item.direction}:${item.word}`, type: 'button', className: 'ld-chip', onClick: () => props.onOpen(item.direction, item.word) }, item.word),
                  ))
                : h('div', { className: 'ld-list-empty' }, t('historyEmpty')),
            ),
            h(
              'div',
              { className: 'ld-card' },
              h(
                'div',
                { className: 'ld-card-head' },
                h('span', { className: 'ld-card-title' }, `${t('favorites')} · ${props.favorites.length}`),
                props.favorites.length
                  ? h('button', {
                      type: 'button', className: 'ld-result-count',
                      onClick: () => {},
                    }, t('favoritesCount'))
                  : null,
              ),
              props.favorites.length
                ? h('div', { className: 'ld-list' }, props.favorites.slice(0, 8).map((item) =>
                    h('button', { key: `${item.direction}:${item.word}`, type: 'button', className: 'ld-chip', onClick: () => props.onFavorite(item) }, item.word),
                  ))
                : h('div', { className: 'ld-list-empty' }, t('favoritesEmpty')),
            ),
            h(
              'div',
              { className: 'ld-card', style: { gridColumn: 'span 2' } },
              h('div', { className: 'ld-card-head' }, h('span', { className: 'ld-card-title' }, t('browseZh'))),
              h(LetterGrid, { letters: props.letters && props.letters.zh, onPick: (letter) => props.onBrowse('zh', letter, 0) }),
            ),
            h(
              'div',
              { className: 'ld-card', style: { gridColumn: 'span 2' } },
              h('div', { className: 'ld-card-head' }, h('span', { className: 'ld-card-title' }, t('browseEn'))),
              h(LetterGrid, { letters: props.letters && props.letters.en, onPick: (letter) => props.onBrowse('en', letter, 0) }),
            ),
          ),
        ),
      );
    }

    function LetterGrid(props) {
      const t = useT();
      const counts = props.letters || {};
      const letters = Object.keys(counts).length ? Object.keys(counts).sort() : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      return h(
        'div',
        { className: 'ld-lettergrid' },
        letters.map((letter) =>
          h('button', {
            key: letter, type: 'button', className: 'ld-letter',
            title: counts[letter] ? `${counts[letter]} ${t('entryCount')}` : undefined,
            onClick: () => props.onPick(letter),
          }, letter, counts[letter] ? h('small', null, formatNumber(counts[letter])) : null),
        ),
      );
    }

    function ResultsPane(props) {
      const t = useT();
      const result = props.result;
      const sections = [];
      if (result) {
        if (result.zh) {
          if (result.zh.exact.length) sections.push({ key: 'zh-exact', direction: 'zh', label: `${t('exact')} · ${t('directionZh')}`, items: result.zh.exact });
          if (result.zh.prefix.length) sections.push({ key: 'zh-prefix', direction: 'zh', label: `${t('prefix')} · ${t('directionZh')}`, items: result.zh.prefix });
          if (result.zh.pinyin.length) sections.push({ key: 'zh-pinyin', direction: 'zh', label: `${t('pinyinMatches')} · ${t('directionZh')}`, items: dedupe(result.zh.pinyin) });
        }
        if (result.en) {
          if (result.en.exact.length) sections.push({ key: 'en-exact', direction: 'en', label: `${t('exact')} · ${t('directionEn')}`, items: result.en.exact });
          if (result.en.prefix.length) sections.push({ key: 'en-prefix', direction: 'en', label: `${t('prefix')} · ${t('directionEn')}`, items: result.en.prefix });
        }
      }
      const total = sections.reduce((sum, section) => sum + section.items.length, 0);
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'ld-result-head' },
          h('span', { className: 'ld-result-title' }, props.query),
          h('span', { className: 'ld-result-count' }, props.state === 'loading' ? t('loading') : `${total} ${t('resultsCount')}`),
        ),
        props.state === 'loading' ? h(Loading, { label: t('loading') }) : null,
        props.state === 'error'
          ? h(ErrorNotice, { error: props.error, onRetry: props.onRetry, t })
          : null,
        props.state === 'ready' && total === 0
          ? h(Empty, { title: t('noResults'), hint: t('noResultsHint'), examples: props.direction === 'en' ? ['water', 'hello', '学习'] : ['水', '你好', 'shui'], onExample: (value) => props.onSmart(value) })
          : null,
        sections.map((section) =>
          h(
            'div',
            { key: section.key, className: 'ld-group' },
            h('div', { className: 'ld-group-label' }, section.label),
            section.items.map((item, index) =>
              h(ResultRow, {
                key: `${section.key}:${item.w}:${index}`,
                item,
                direction: section.direction,
                active: props.selected && props.selected.entry.w === item.w && props.selected.direction === section.direction,
                onOpen: () => props.onOpen(section.direction, item.w),
              }),
            ),
          ),
        ),
      );
    }

    function dedupe(items) {
      const seen = new Set();
      return items.filter((item) => {
        const key = item.w;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function ResultRow(props) {
      const item = props.item;
      return h(
        'button',
        { type: 'button', className: 'ld-row', 'data-active': props.active, onClick: props.onOpen },
        h(
          'div',
          { className: 'ld-row-main' },
          h(
            'div',
            { className: 'ld-row-word' },
            h('b', null, item.w),
            item.r ? h('em', null, item.r) : null,
            item.t ? h('span', { className: 'ld-row-trad' }, item.t) : null,
          ),
          item.c ? h('div', { className: 'ld-row-sub' }, item.c) : null,
          item.g ? h('div', { className: 'ld-row-gloss' }, item.g) : null,
        ),
        item.n ? h('span', { className: 'ld-row-count' }, item.n) : null,
      );
    }

    function BrowsePane(props) {
      const t = useT();
      const browse = props.browse;
      const offset = browse.offset || 0;
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'ld-browse-head' },
          h('b', null, browse.letter),
          h('span', { className: 'ld-result-count' }, `${formatNumber(browse.total)} ${t('entryCount')}`),
          h('button', { type: 'button', className: 'ld-chip', onClick: props.onExit, style: { marginLeft: 'auto' } }, t('backHome')),
        ),
        props.state === 'loading' ? h(Loading, { label: t('loading') }) : null,
        browse.items.map((item) =>
          h(ResultRow, {
            key: `${browse.direction}:${item.w}`,
            item,
            direction: browse.direction,
            active: props.selected && props.selected.entry.w === item.w && props.selected.direction === browse.direction,
            onOpen: () => props.onOpen(browse.direction, item.w),
          }),
        ),
        h(
          'div',
          { className: 'ld-pager' },
          h('button', { type: 'button', disabled: offset <= 0, onClick: () => props.onPage(Math.max(0, offset - 40)) }, t('prev')),
          h('span', null, `${Math.floor(offset / 40) + 1} / ${Math.max(1, Math.ceil(browse.total / 40))}`),
          h('button', { type: 'button', disabled: offset + 40 >= browse.total, onClick: () => props.onPage(offset + 40) }, t('next')),
        ),
      );
    }

    function DetailPane(props) {
      const t = useT();
      if (props.state === 'loading') return h(Loading, { label: t('loading') });
      if (props.state === 'error') {
        return h('div', null, h(ErrorNotice, { error: props.error, onRetry: props.onRetry, t }));
      }
      if (!props.value) {
        return h(Empty, {
          title: t('askTitle'),
          hint: t('askHint'),
          examples: ['水', 'shui', 'water', '学习', 'hello', '月亮'],
          onExample: (value) => props.onSmart(value),
        });
      }
      const value = props.value;
      return value.direction === 'zh'
        ? h(ZhEntry, { value, ...props })
        : h(EnEntry, { value, ...props });
    }

    function EntryActions(props) {
      const t = useT();
      const [copied, setCopied] = useState(false);
      const value = props.value;
      const copy = () => {
        const text = value.direction === 'zh'
          ? `${value.entry.w}\t${(value.entry.r[0] && value.entry.r[0].p) || ''}\t${previewGloss(value.entry, 'zh')}`
          : `${value.entry.w}\t${value.entry.ph || ''}\t${previewGloss(value.entry, 'en')}`;
        const done = () => { setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
        else done();
      };
      return h(
        'div',
        { className: 'ld-entry-actions' },
        h('button', {
          type: 'button', className: 'ld-iconbtn', 'data-on': props.isFavorite,
          title: props.isFavorite ? t('removeFavorite') : t('addFavorite'),
          onClick: () => props.onToggleFavorite(value),
        }, h(StarGlyph, { filled: props.isFavorite })),
        h('button', { type: 'button', className: 'ld-iconbtn', title: copied ? t('copied') : t('copy'), onClick: copy }, h(CopyGlyph)),
      );
    }

    function VerseBlock(props) {
      const t = useT();
      const verses = props.verses || [];
      if (!verses.length) return null;
      return h(
        'section',
        { className: 'ld-verse' },
        h(
          'div',
          { className: 'ld-verse-kicker' },
          t('verse'),
          h('span', { className: 'ld-hint' }, t('verseHint')),
        ),
        verses.slice(0, 2).map((verse, index) =>
          h(
            'div',
            { key: index, className: 'ld-verse-item' },
            h('p', { className: props.lang === 'en' ? 'ld-verse-text en' : 'ld-verse-text' }, verse.t),
            h(
              'div',
              { className: 'ld-verse-meta' },
              verse.r ? h('span', { className: 'ld-verse-rhythm' }, verse.r) : h('span'),
              h('span', { className: 'ld-verse-source' }, verse.s),
            ),
          ),
        ),
      );
    }

    function RelatedGroups(props) {
      const t = useT();
      const direction = props.direction;
      const groups = props.groups || {};
      const sections = [
        ['near', t('relatedNear')],
        ['same', t('relatedSame')],
        ['radical', t('relatedRadical')],
        ['form', t('relatedForm')],
      ].filter(([key]) => Array.isArray(groups[key]) && groups[key].length);
      return h(
        'section',
        { className: 'ld-related-section' },
        h(
          'div',
          { className: 'ld-section-head' },
          h('div', { className: 'ld-section-title' }, t('related')),
          h('button', { type: 'button', className: 'ld-shuffle', onClick: props.onShuffle }, t('shuffle')),
        ),
        sections.length
          ? sections.map(([key, label]) =>
              h(
                'div',
                { key, className: 'ld-relgroup' },
                h('div', { className: 'ld-relhead' }, label),
                h('div', { className: 'ld-related' }, groups[key].map((item) =>
                  h('button', {
                    key: item.w, type: 'button', onClick: () => props.onOpen(direction, item.w),
                  }, item.w, item.r ? h('small', null, item.r) : null),
                )),
              ),
            )
          : h('div', { className: 'ld-rel-empty' }, t('relatedEmpty')),
      );
    }

    function ZhEntry(props) {
      const t = useT();
      const locale = useLocale();
      const value = props.value;
      const entry = value.entry;
      const concept = findConcept(entry.w, 'zh');
      return h(
        'article',
        null,
        h(
          'div',
          { className: 'ld-entry-head' },
          h(
            'div',
            { className: 'ld-entry-top' },
            h(
              'div',
              null,
              h('h1', { className: 'ld-headword' }, entry.w),
              entry.t ? h('div', { className: 'ld-trad' }, `${t('traditional')} · ${entry.t.join(' / ')}`) : null,
              h('div', { className: 'ld-readings' }, entry.r.map((reading) =>
                h('span', { key: reading.p, className: 'ld-reading' }, reading.p),
              )),
              h('div', { className: 'ld-badges' },
                h('span', { className: 'ld-badge ld-pill-zh' }, t('directionZh')),
                h('span', { className: 'ld-badge' }, h('b', null, entry.r.length), t('readingCount')),
                h('span', { className: 'ld-badge' }, h('b', null, entry.r.reduce((sum, reading) => sum + reading.d.length, 0)), t('senseCount')),
              ),
            ),
            h(EntryActions, { ...props }),
          ),
        ),
        entry.cn && entry.cn.length
          ? h(
              'div',
              { className: 'ld-section' },
              h('div', { className: 'ld-section-title' }, t('zhToZh'), h('span', { className: 'ld-hint' }, t('zhToZhHint'))),
              h('div', { className: 'ld-mono' }, h('ol', null, entry.cn.map((definition, index) =>
                h('li', { key: index }, definition),
              ))),
            )
          : null,
        h(
          'div',
          { className: 'ld-section' },
          h('div', { className: 'ld-section-title' }, t('senses')),
          entry.r.map((reading, readingIndex) =>
            h(
              'div',
              { key: reading.p, className: 'ld-readingblock' },
              h('div', { className: 'ld-readinghead' }, h('b', null, reading.p), h('span', { className: 'ld-badge' }, `${t('readings')} ${readingIndex + 1}`)),
              h('ol', { className: 'ld-senses' }, reading.d.map((definition, index) =>
                h(
                  'li',
                  { key: index, className: 'ld-sense' },
                  h('span', { className: 'ld-sense-num' }, index + 1),
                  h('span', { className: 'ld-sense-text' }, formatSense(definition)),
                ),
              )),
            ),
          ),
        ),
        h(VerseBlock, { verses: entry.verse, lang: 'zh' }),
        concept
          ? h(
              'button',
              { type: 'button', className: 'ld-atlas-link', onClick: () => props.onAtlas(concept.id) },
              h(AtlasGlyph, { size: 14 }), `${t('inAtlas')} · ${localizedTitle(concept, locale)}`,
            )
          : null,
        h(RelatedGroups, { groups: value.related, direction: 'zh', onOpen: props.onOpen, onShuffle: props.onShuffle }),
        h('div', { className: 'ld-foot' }, `CC-CEDICT · ${t('offline')}`),
      );
    }

    function EnEntry(props) {
      const t = useT();
      const locale = useLocale();
      const value = props.value;
      const entry = value.entry;
      const concept = findConcept(entry.w, 'en');
      return h(
        'article',
        null,
        h(
          'div',
          { className: 'ld-entry-head' },
          h(
            'div',
            { className: 'ld-entry-top' },
            h(
              'div',
              null,
              h('h1', { className: 'ld-headword ld-headword-en' }, entry.w),
              entry.ph ? h('div', { className: 'ld-trad' }, `/${entry.ph.replace(/^\/|\/$/g, '')}/`) : null,
              h(
                'div',
                { className: 'ld-badges' },
                h('span', { className: 'ld-badge ld-pill-en' }, t('directionEn')),
                entry.ox ? h('span', { className: 'ld-badge ld-badge-gold' }, 'Oxford') : null,
                entry.co ? h('span', { className: 'ld-badge ld-badge-gold' }, `Collins ${'★'.repeat(Math.min(5, entry.co))}`) : null,
                entry.fr ? h('span', { className: 'ld-badge' }, t('frequency'), h('b', null, formatNumber(entry.fr))) : null,
                entry.tg && entry.tg.length ? h('span', { className: 'ld-badge' }, entry.tg.join(' · ')) : null,
              ),
            ),
            h(EntryActions, props),
          ),
        ),
        entry.d && entry.d.length
          ? h(
              'div',
              { className: 'ld-section' },
              h('div', { className: 'ld-section-title' }, t('enToEn'), h('span', { className: 'ld-hint' }, t('enToEnHint'))),
              h('div', { className: 'ld-mono ld-mono-en' }, h('ol', null, entry.d.map((line, index) =>
                h('li', { key: index }, line),
              ))),
            )
          : null,
        h(
          'div',
          { className: 'ld-section' },
          h('div', { className: 'ld-section-title' }, t('senses')),
          h('ol', { className: 'ld-senses' }, entry.s.map((sense, index) =>
            h(
              'li',
              { key: index, className: 'ld-sense' },
              h('span', { className: 'ld-sense-num' }, index + 1),
              h('span', { className: 'ld-sense-text' },
                sense.p ? h('span', { className: 'ld-pos' }, sense.p) : null,
                sense.d.join('；'),
              ),
            ),
          )),
        ),
        h(VerseBlock, { verses: entry.verse, lang: 'en' }),
        entry.f && entry.f.length
          ? h(
              'div',
              { className: 'ld-section' },
              h('div', { className: 'ld-section-title' }, t('wordForms')),
              h('div', { className: 'ld-forms' }, entry.f.map((form, index) =>
                h('span', { key: index, className: 'ld-form' }, form.k, h('b', null, form.v)),
              )),
            )
          : null,
        concept
          ? h(
              'button',
              { type: 'button', className: 'ld-atlas-link', onClick: () => props.onAtlas(concept.id) },
              h(AtlasGlyph, { size: 14 }), `${t('inAtlas')} · ${localizedTitle(concept, locale)}`,
            )
          : null,
        h(RelatedGroups, { groups: value.related, direction: 'en', onOpen: props.onOpen, onShuffle: props.onShuffle }),
        h('div', { className: 'ld-foot' }, `ECDICT · ${t('offline')}`),
      );
    }

    function formatSense(text) {
      return String(text || '');
    }

    function previewGloss(entry, direction) {
      if (!entry) return '';
      if (direction === 'zh') {
        const first = entry.r && entry.r[0];
        return first ? first.d.slice(0, 2).join('；') : '';
      }
      const first = entry.s && entry.s[0];
      return first ? first.d.slice(0, 3).join('；') : '';
    }

    function findConcept(word, direction) {
      const target = String(word || '').toLowerCase();
      return DATA.concepts.find((concept) =>
        concept.entries.some((entry) =>
          entry.lang === (direction === 'zh' ? 'zh' : 'en') && String(entry.word).toLowerCase() === target,
        ),
      );
    }

    function Loading(props) {
      return h(
        'div',
        { className: 'ld-loading' },
        h('span', { className: 'ld-dot' }),
        h('span', { className: 'ld-dot' }),
        h('span', { className: 'ld-dot' }),
        props.label ? h('span', { style: { marginLeft: 4 } }, props.label) : null,
      );
    }

    function ErrorNotice(props) {
      const t = props.t;
      const error = props.error;
      const notReady = error && (error.code === 'not_ready' || /503|not built/.test(error.message || ''));
      return h(
        'div',
        { className: 'ld-notice' },
        h('b', null, notReady ? t('notReady') : t('errorTitle')),
        h('div', null, notReady ? t('notReadyHint') : String((error && error.message) || error)),
        props.onRetry ? h('button', { type: 'button', className: 'ld-chip', style: { marginTop: 8 }, onClick: props.onRetry }, t('retry')) : null,
      );
    }

    function Empty(props) {
      return h(
        'div',
        { className: 'ld-empty' },
        h('div', { className: 'ld-empty-mark' }, '⌕'),
        h('div', { className: 'ld-empty-title' }, props.title),
        props.hint ? h('div', { className: 'ld-empty-hint' }, props.hint) : null,
        props.onExample
          ? h(
              'div',
              { className: 'ld-examples' },
              props.examples.map((example) =>
                h('button', { key: example, type: 'button', className: 'ld-chip', onClick: () => props.onExample(example) }, example),
              ),
            )
          : null,
      );
    }

    function AtlasPage(props) {
      const t = useT();
      const locale = useLocale();
      const [field, setField] = useState(null);
      const [query, setQuery] = useState('');
      const [selectedId, setSelectedId] = useState(() => props.focus || 'water');
      useEffect(() => {
        if (props.focus) setSelectedId(props.focus);
      }, [props.focus]);
      const selected = CONCEPTS[selectedId] || DATA.concepts[0];
      const list = useMemo(() => searchConcepts(DATA, query, { field }), [query, field]);
      const fields = DATA.fields;

      return h(
        'div',
        { className: 'ld-atlas' },
        h(
          'div',
          { className: 'ld-atlas-rail' },
          h('input', {
            className: 'ld-mini-search',
            value: query,
            placeholder: t('concepts'),
            onChange: (event) => setQuery(event.target.value),
          }),
          h(
            'div',
            { className: 'ld-fields' },
            h('button', {
              type: 'button', className: 'ld-field', 'data-active': field === null,
              onClick: () => setField(null),
            }, t('allFields')),
            fields.map((item) =>
              h('button', {
                key: item.id, type: 'button', className: 'ld-field', 'data-active': field === item.id,
                onClick: () => setField(item.id),
              }, pickText(item, locale, 'label', 'labelEn')),
            ),
          ),
          h(
            'div',
            { className: 'ld-concept-list' },
            list.map((concept) =>
              h(
                'button',
                {
                  key: concept.id, type: 'button', className: 'ld-concept', 'data-active': concept.id === selected.id,
                  onClick: () => setSelectedId(concept.id),
                },
                h('span', { className: 'ld-concept-glyph' }, pickText(concept.title, locale, 'zh', 'en')),
                h('span', null,
                  h('b', null, pickText(concept.title, locale, 'zh', 'en')),
                  h('small', null, pickText(concept.title, locale, 'en', 'zh')),
                ),
              ),
            ),
          ),
        ),
        h(ConceptPanel, { concept: selected, locale, t }),
      );
    }

    function ConceptPanel(props) {
      const concept = props.concept;
      const locale = props.locale;
      const t = props.t;
      const entries = visibleEntries(concept);
      const groups = groupOrigins(concept);
      const relations = relationsOf(DATA, concept);
      const field = FIELDS[concept.field];
      const siblings = sameField(DATA, concept);
      const constellation = groups.length ? buildConstellation(entries, groups) : null;
      return h(
        'div',
        { className: 'ld-atlas-main' },
        h('div', { className: 'ld-concept-title' }, pickText(concept.title, locale, 'zh', 'en')),
        h('div', { className: 'ld-concept-sub' }, `${pickText(concept.title, locale, 'en', 'zh')} · ${pickText(field, locale, 'label', 'labelEn')}`),
        h('div', { className: 'ld-gloss' }, pickText(concept.gloss, locale, 'zh', 'en')),
        h(
          'div',
          { className: 'ld-section' },
          h('div', { className: 'ld-section-title' }, `${t('coverage')} · ${entries.length} ${t('langCount')}`),
          h(
            'table',
            { className: 'ld-langtable' },
            h('thead', null, h('tr', null, h('th', null, ''), h('th', null, t('word')), h('th', null, t('gloss')))),
            h('tbody', null, entries.map((entry) => {
              const lang = LANGS[entry.lang] || {};
              return h(
                'tr',
                { key: entry.lang },
                h('td', null, lang.label || entry.lang),
                h('td', null,
                  h('span', { className: 'ld-langword', dir: entry.lang === 'ar' || entry.lang === 'fa' || entry.lang === 'he' ? 'rtl' : 'ltr' }, entry.word,
                    entry.roman ? h('small', null, entry.roman) : null,
                  ),
                ),
                h('td', null,
                  h('div', { className: 'ld-langgloss' }, localizedGloss(entry, locale)),
                  entry.note ? h('div', { className: 'ld-langnote' }, entry.note) : null,
                ),
              );
            })),
          ),
        ),
        constellation
          ? h(
              'div',
              { className: 'ld-section' },
              h('div', { className: 'ld-section-title' }, t('tabOrigin')),
              h(
                'svg',
                { className: 'ld-svg', viewBox: '0 0 720 400', role: 'img' },
                constellation.edges.map((edge) => h('path', { key: edge.key, d: edge.d, stroke: edge.color, strokeWidth: 1.2, opacity: 0.45, fill: 'none' })),
                constellation.nodes.map((node) =>
                  h(
                    'g',
                    { key: node.entry.lang },
                    h('circle', { cx: node.x, cy: node.y, r: 6.5, fill: node.color, opacity: 0.9 }),
                    h('text', {
                      x: node.labelX, y: node.labelY, textAnchor: node.anchor, fontSize: 13, fill: 'currentColor', opacity: 0.9,
                    }, node.entry.word),
                    h('text', {
                      x: node.labelX, y: node.labelY + 13, textAnchor: node.anchor, fontSize: 9, fill: 'currentColor', opacity: 0.55,
                    }, node.entry.lang),
                  ),
                ),
              ),
            )
          : null,
        relations.length
          ? h(
              'div',
              { className: 'ld-section' },
              h('div', { className: 'ld-section-title' }, t('relation')),
              h('div', { className: 'ld-related' }, relations.map((relation) =>
                h('button', {
                  key: relation.target, type: 'button',
                  onClick: () => {},
                  title: pickText(relation.concept.title, locale, 'zh', 'en'),
                }, pickText(relation.concept.title, locale, 'zh', 'en'), h('small', null, relation.type)),
              )),
            )
          : null,
        siblings.length
          ? h(
              'div',
              { className: 'ld-section' },
              h('div', { className: 'ld-section-title' }, t('sameField')),
              h('div', { className: 'ld-related' }, siblings.slice(0, 12).map((other) =>
                h('button', { key: other.id, type: 'button', title: pickText(other.title, locale, 'zh', 'en') }, pickText(other.title, locale, 'zh', 'en')),
              )),
            )
          : null,
        h('div', { className: 'ld-foot' }, `${STATS.concepts} ${t('concepts')} · ${STATS.languages} ${t('langCount')} · ${STATS.families} ${t('familyCount')}`),
      );
    }

    function AboutPage(props) {
      const t = useT();
      const stats = props.stats;
      return h(
        'div',
        { className: 'ld-about' },
        h(
          'div',
          { className: 'ld-about-inner' },
          h('h2', null, t('aboutTitle')),
          h('p', null, t('aboutBody')),
          stats
            ? h(
                'div',
                { className: 'ld-kv' },
                h('div', null, h('b', null, formatNumber(stats.zh.count)), h('span', null, t('sourceCedict'))),
                h('div', null, h('b', null, formatNumber(stats.en.count)), h('span', null, t('sourceEcdict'))),
                h('div', null, h('b', null, STATS.concepts), h('span', null, t('concepts'))),
              )
            : null,
          h('div', { className: 'ld-section-title' }, t('dataSources')),
          h(
            'div',
            null,
            h('div', { className: 'ld-source' },
              h('div', null, h('b', null, 'CC-CEDICT'), h('span', null, 'CC BY-SA 4.0 · 汉英 · mdbg.net')),
              h('a', { href: 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict', target: '_blank', rel: 'noreferrer' }, 'mdbg.net'),
            ),
            h('div', { className: 'ld-source' },
              h('div', null, h('b', null, 'ECDICT'), h('span', null, 'MIT · 英汉 · skywind3000')),
              h('a', { href: 'https://github.com/skywind3000/ECDICT', target: '_blank', rel: 'noreferrer' }, 'github.com'),
            ),
            h('div', { className: 'ld-source' },
              h('div', null, h('b', null, 'chinese-xinhua'), h('span', null, t('sourceXinhua') + ' · pwxcoo')),
              h('a', { href: 'https://github.com/pwxcoo/chinese-xinhua', target: '_blank', rel: 'noreferrer' }, 'github.com'),
            ),
            h('div', { className: 'ld-source' },
              h('div', null, h('b', null, 'chinese-poetry'), h('span', null, t('sourceCorpus'))),
              h('a', { href: 'https://github.com/chinese-poetry/chinese-poetry', target: '_blank', rel: 'noreferrer' }, 'github.com'),
            ),
            h('div', { className: 'ld-source' },
              h('div', null, h('b', null, 'Project Gutenberg'), h('span', null, t('sourceGutenberg'))),
              h('a', { href: 'https://www.gutenberg.org/ebooks/1041', target: '_blank', rel: 'noreferrer' }, 'gutenberg.org'),
            ),
            h('div', { className: 'ld-source' },
              h('div', null, h('b', null, t('verse')), h('span', null, t('sourceVerse'))),
              h('span', null, t('publicDomain')),
            ),
          ),
          h('p', { style: { marginTop: 16 } }, t('licenseNote')),
          stats ? h('p', { className: 'ld-foot' }, `${t('builtAt')}: ${String(stats.builtAt || '').slice(0, 10)}`) : null,
        ),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind('lingua-atlas');
        try {
          ctx.effect(() => {
            const disposeZh = ctx.locale.register('lingua-atlas', 'zh', DICT.zh);
            const disposeEn = ctx.locale.register('lingua-atlas', 'en', DICT.en);
            return () => {
              disposeZh();
              disposeEn();
            };
          });
        } catch (error) {
          if (typeof console !== 'undefined') console.warn('[lingua-atlas] locale registration failed', error);
        }

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'lingua-atlas',
              order: 20,
              label: () => t('navLabel'),
            },
            function PanelIcon(props) {
              const size = props && props.size ? props.size : 20;
              return h(
                'span',
                {
                  className: 'ld-panel-icon',
                  style: { width: size, height: size, opacity: props && props.active === false ? 0.82 : 1 },
                },
                h(AtlasGlyph, { size: Math.round(size * 0.88) }),
              );
            },
          ),
        );

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: 'lingua-atlas' },
            function Panel(props) {
              return h(LocaleShell, { ...props, t, localeService: ctx.locale });
            },
          ),
        );
      },
    };
  },
});
