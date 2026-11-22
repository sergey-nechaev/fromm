# Escape from Freedom — study app

A local study companion for Erich Fromm's *Escape from Freedom* (Russian translation):
a whole-book summary, per-chapter summaries, key ideas, terms, verbatim quotes and
self-check questions.

## Run

Open `app/index.html` in a browser. No server needed — the data is loaded from
`app/data.js` via a plain `<script>` tag, so `file://` works.
Reading progress and checked questions are stored in the browser's `localStorage`.

## Layout

- `data/` — the source books (FB2 in zip).
- `chapters/` — the book text split by chapter (`p0` prefaces, `c1`…`c7`, `c8` appendix).
- `summaries/<id>.json` — per-chapter summaries (the content to edit).
- `app/book.json` — the whole-book summary and the diagram.
- `app/index.html`, `app/style.css`, `app/app.js` — the app itself.
- `app/build.py` — regenerates `app/data.js` from `summaries/` and `app/book.json`.

After editing any summary: `python3 app/build.py`, then reload the page.

## Deploy

Pushing to `master` publishes `app/` to GitHub Pages (`.github/workflows/pages.yml`).
The book text (`data/`, `chapters/`) is gitignored and is never published.
