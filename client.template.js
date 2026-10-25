window.__ModuleLoader__.load({
  id: '@local/dsh-lingua-atlas',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useMemo, useEffect, useRef, useCallback } = React;

    /*__LOGIC__*/

    const DATA = /*__DATA__*/null;

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
