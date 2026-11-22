#!/usr/bin/env python3
"""Build app/data.js (the data the local study app reads) from summaries/*.json and app/book.json.

Usage: python3 app/build.py [--help]
"""
import json
import pathlib
import sys

if "--help" in sys.argv:
    print(__doc__)
    sys.exit(0)

root = pathlib.Path(__file__).resolve().parent.parent
order = [
    {"id": "preface", "num": "—", "short": "Предисловия"},
    {"id": "ch1", "num": "I", "short": "Свобода — психологическая проблема?"},
    {"id": "ch2", "num": "II", "short": "Индивидуальность и двойственность свободы"},
    {"id": "ch3", "num": "III", "short": "Свобода в век Реформации"},
    {"id": "ch4", "num": "IV", "short": "Два аспекта свободы"},
    {"id": "ch5", "num": "V", "short": "Механизмы бегства"},
    {"id": "ch6", "num": "VI", "short": "Психология нацизма"},
    {"id": "ch7", "num": "VII", "short": "Свобода и демократия"},
    {"id": "appendix", "num": "—", "short": "Приложение: характер и общество"},
]
chapters = []
for o in order:
    f = root / "summaries" / f"{o['id']}.json"
    if f.exists():
        chapters.append(json.loads(f.read_text(encoding="utf-8")))
    else:
        print(f"missing: {f.name}", file=sys.stderr)
book = json.loads((root / "app" / "book.json").read_text(encoding="utf-8"))
data = {"order": order, "chapters": chapters, "book": book}
payload = json.dumps(data, ensure_ascii=False, indent=1)
(root / "app" / "data.js").write_text("window.FROMM_DATA = " + payload + ";\n", encoding="utf-8")
print(f"built app/data.js with {len(chapters)} chapters")
