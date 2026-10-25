#!/usr/bin/env python3
"""Build English related-word groups from Princeton WordNet.

Run with the bundled Python:
  python scripts/build-related-en.py

Output: data/dict/related.en.json

Only the primary WordNet sense for the entry's main part of speech is used.
That keeps `water` on water-as-liquid instead of urine or the verb "to water".
Groups:
  near  - synonyms, similar-to adjectives, derivational forms
  same  - hypernyms and hyponyms of that sense
  form  - dictionary compounds that begin with the word and whose WordNet
          definition actually mentions it (water -> waterbird, not season)
  radical is always empty for English.
"""
from __future__ import annotations

import bisect
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from nltk.corpus import wordnet as wn

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "dict"
EN_FILE = DATA / "en.jsonl"
OUT_FILE = DATA / "related.en.json"
MANIFEST = DATA / "manifest.json"

STOP = set(
    "a an the and or but if then than so because as of at by for from in into is are was were be been being "
    "to on with without within about over under between among through during before after above below up down out off "
    "this that these those it its they them their he she his her you your we our i me my not no nor only also just "
    "can could may might must shall should will would do does did done have has had having more most much many few "
    "such same other another each every both either neither one two three first second new old good bad very "
    "which who whom whose what when where why how there here".split()
)
WORD_RE = re.compile(r"^[a-z][a-z' -]*$")
TOKEN_RE = re.compile(r"[a-z][a-z'-]+")


def clean(word: str) -> str:
    return word.replace("_", " ").strip().lower()


def rank_of(entry: dict) -> int:
    for key in ("fr", "bnc"):
        try:
            value = int(entry.get(key) or 0)
            if value > 0:
                return value
        except (TypeError, ValueError):
            pass
    return 10**9


def dominant_pos(entry: dict) -> str | None:
    senses = entry.get("s") or []
    if not senses:
        return None
    part = str(senses[0].get("p") or "").strip().lower()
    if part.startswith("n"):
        return "n"
    if part.startswith("v"):
        return "v"
    if part.startswith("a") or part.startswith("s"):
        return "a"
    if part.startswith("r"):
        return "r"
    return None


def primary_synset(base: str, pos: str | None):
    synsets = wn.synsets(base)
    if not synsets:
        morph = wn.morphy(base)
        if morph and morph != base:
            synsets = wn.synsets(morph)
    if pos:
        matching = [s for s in synsets if s.pos() == pos]
        if matching:
            synsets = matching
    # Prefer a sense where the headword itself is the first lemma; this
    # avoids slang/metonymy senses such as beauty -> "a beautiful woman".
    for synset in synsets:
        lemmas = synset.lemmas()
        if lemmas and clean(lemmas[0].name()) == base:
            return synset
    return synsets[0] if synsets else None


def word_mentioned(base: str, definition: str) -> bool:
    text = (definition or "").lower()
    if " " in base:
        return base in text
    return base in TOKEN_RE.findall(text)


DEF_CACHE: dict[str, list[str]] = {}


def definitions_for(word: str) -> list[str]:
    cached = DEF_CACHE.get(word)
    if cached is not None:
        return cached
    result = []
    for synset in wn.synsets(word)[:4]:
        result.append(synset.definition())
    DEF_CACHE[word] = result
    return result


def main() -> int:
    if not EN_FILE.exists():
        print(f"missing {EN_FILE}", file=sys.stderr)
        return 1
    entries: dict[str, dict] = {}
    with EN_FILE.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            entry = json.loads(line)
            word = str(entry.get("w") or "").strip()
            if word:
                entries[word] = entry

    words = set(entries)
    sorted_words = sorted(words)
    result: dict[str, dict] = {}
    total = len(entries)
    for index, (word, entry) in enumerate(entries.items(), 1):
        base = word.lower()
        pos = dominant_pos(entry)
        synset = primary_synset(base, pos)
        near: dict[str, float] = {}
        same: dict[str, float] = {}

        def add(bucket: dict[str, float], name: str, weight: float):
            name = clean(name)
            if not name or name == base or name in STOP or len(name) < 2 or not WORD_RE.match(name):
                return
            if len(name.split()) > 4:
                return
            if name not in words:
                return
            prev = bucket.get(name)
            if prev is None or weight > prev:
                bucket[name] = weight

        if synset is not None:
            for lemma in synset.lemmas():
                add(near, lemma.name(), 1.0)
                for deriv in lemma.derivationally_related_forms():
                    add(near, deriv.name(), 0.75)
            for similar in getattr(synset, "similar_tos", lambda: [])():
                for lemma in similar.lemmas():
                    add(near, lemma.name(), 0.8)
            for hyper in synset.hypernyms():
                for lemma in hyper.lemmas():
                    add(same, lemma.name(), 1.0)
            for hypo in synset.hyponyms():
                for lemma in hypo.lemmas():
                    add(same, lemma.name(), 0.9)

        def ordered(bucket: dict[str, float]):
            items = [(name, weight) for name, weight in bucket.items()]
            items.sort(key=lambda pair: (-pair[1], rank_of(entries[pair[0]]), len(pair[0]), pair[0]))
            return [name for name, _ in items[:8]]

        near_list = ordered(near)
        used = {word, *near_list}
        same_list = [name for name in ordered(same) if name not in used][:8]
        used.update(same_list)

        form: list[str] = []
        if len(base) >= 3:
            start = bisect.bisect_left(sorted_words, base)
            end = bisect.bisect_left(sorted_words, base + "\uffff")
            window = [w for w in sorted_words[start:end] if w != word and len(w) <= len(base) + 8]
            window.sort(key=lambda w: (rank_of(entries[w]), len(w), w))
            candidates = []
            for other in window[:80]:
                if not any(word_mentioned(base, d) for d in definitions_for(other)):
                    continue
                candidates.append(other)
            form = candidates[:8]

        result[word] = {"near": near_list, "same": same_list, "radical": [], "form": form}
        if index % 10000 == 0:
            print(f"  en {index}/{total}", file=sys.stderr)

    OUT_FILE.write_text(
        json.dumps({"version": 1, "generatedAt": datetime.now(timezone.utc).isoformat(), "words": result}, ensure_ascii=False),
        encoding="utf-8",
    )
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        manifest["relatedEn"] = "related.en.json"
        manifest["relatedEnBuiltAt"] = datetime.now(timezone.utc).isoformat()
        manifest["relatedEnSource"] = "Princeton WordNet 3.0 (NLTK), primary sense only"
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"related.en written: {len(result)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
