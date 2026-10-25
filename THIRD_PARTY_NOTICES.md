# Third-party data and notices

This repository's own code is MIT-licensed (see `LICENSE`). The data files
carry the licenses of their upstream sources. This notice is informational;
the upstream license text controls where it differs.

## CC-CEDICT

- Files: `data/dict/zh.jsonl`, `data/dict/zh.*.json` (derived)
- Source: https://www.mdbg.net/chinese/dictionary?page=cc-cedict
- License: Creative Commons Attribution-ShareAlike 4.0 International
- Attribution: CC-CEDICT, compiled by MDBG.

## ECDICT

- Files: `data/dict/en.jsonl`, `data/dict/en.*.json` (derived), `data/dict/related.en.json` (derived)
- Source: https://github.com/skywind3000/ECDICT
- License: MIT

## chinese-xinhua

- Files: Chinese monolingual glosses in `data/dict/zh.jsonl` (`cn` field)
- Source: https://github.com/pwxcoo/chinese-xinhua
- License: MIT

## chinese-poetry

- Files: `data/corpus/corpus.jsonl` (Tang poems, Song ci, Shijing, Chuci)
- Source: https://github.com/chinese-poetry/chinese-poetry
- License: MIT (dataset); the poems themselves are public domain.

## Project Gutenberg

- Files: Shakespeare's sonnets in `data/corpus/corpus.jsonl`
- Source: https://www.gutenberg.org/ebooks/1041
- License: Public domain in the United States. The Gutenberg trademark and
  header are not included in the extracted text.

## Princeton WordNet 3.0

- Files: `data/dict/related.en.json` (derived relations)
- Source: https://wordnet.princeton.edu/
- License: WordNet 3.0 license
- Citation: George A. Miller, "WordNet: A Lexical Database for English",
  Communications of the ACM 38(11), 1995.

## CMU Pronouncing Dictionary

- Files: `data/dict/cmudict.dict`
- Source: http://www.speech.cs.cmu.edu/cgi-bin/cmudict
- License: BSD-style (Carnegie Mellon University)

## Public-domain verse

- Files: `data/verse.json`
- Texts: Shijing, Chuci, Tang poems, Song ci, and English poems by
  Shakespeare, Wordsworth, Keats, Dickinson, Frost, and others.
- These works are in the public domain. Short excerpts are included with
  author and source attribution.

## Build-time tools

`scripts/build-related-en.py` uses NLTK (Apache-2.0) to read WordNet at build
time. NLTK is not vendored or required at runtime.
