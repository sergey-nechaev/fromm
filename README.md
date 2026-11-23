# Escape from Freedom — study app

A local study companion for Erich Fromm's *Escape from Freedom* (Russian translation):
a whole-book summary, per-chapter summaries, key ideas, terms, verbatim quotes,
self-check questions, interactive diagrams of the book's ideas, a "Pantheon" of every person
Fromm mentions (with a lifespan timeline), a "Chronicle" of the events he discusses
and an "Ideas" page of the concepts he takes up or argues with.

## Run

Open `app/index.html` in a browser. No server needed — the data is loaded from
`app/data.js` via a plain `<script>` tag, so `file://` works.
Reading progress and checked questions are stored in the browser's `localStorage`.

## Layout

- `data/` — the source books (FB2 in zip).
- `chapters/` — the book text split by chapter (`p0` prefaces, `c1`…`c7`, `c8` appendix).
- `summaries/<id>.json` — per-chapter summaries (the content to edit).
- `summaries/people.json` — people mentioned in the book (the Pantheon page).
- `summaries/events.json` — historical events and eras Fromm discusses (the Chronicle page).
- `summaries/concepts.json` — other thinkers' concepts Fromm engages with, and his stance (the Ideas page).
- `app/book.json` — the whole-book summary and the diagram.
- `app/index.html`, `app/style.css`, `app/app.js` — the app itself.
- `app/viz.js` — the interactive diagrams (their text lives in this file).
- `app/build.py` — regenerates `app/data.js` from `summaries/` (chapters and people) and `app/book.json`.

After editing any summary: `python3 app/build.py`, then reload the page.

## Deploy

Hosted on Netlify (https://fromm-g3vg.netlify.app/, team-only access): every push to `master`
publishes the `app/` folder, with no build command.
The book text (`data/`, `chapters/`) is gitignored and is never published.
