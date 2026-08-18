# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page, client-side interactive SQL tutorial. SQLite runs entirely in the browser via
sql.js (SQLite compiled to WASM) — there is no backend and no build step. Ten modules from
`SELECT`/`WHERE` through subqueries, CTEs, and window functions, each with an explanation, a
live-executable example, and auto-checked exercises, plus a free-form sandbox.

## Commands

```bash
npm install     # only needed for the validation script below (sql.js as a devDependency)
npm run serve   # serve the site locally at http://localhost:8000 (python3 -m http.server)
npm test        # node test/validate.js — runs every SQL query in lessons.js against schema.sql
```

Opening `index.html` directly via `file://` does not work — `app.js` does `fetch('schema.sql')`,
which browsers block for local files. Always serve it (`npm run serve`, or any static file server).

There is no linter and no bundler; `index.html`, `app.js`, `lessons.js`, `style.css` are loaded
as plain `<script>`/`<link>` tags.

### Running/checking a single lesson or exercise

There's no per-test CLI flag — `npm test` always validates every query in `lessons.js` in one
pass (it's cheap). To manually check one exercise's solution query, load the app (`npm run serve`)
and open that lesson in the browser, or run the query by hand against `schema.sql` with the
`sqlite3` CLI / any SQLite tool.

## Architecture

**Single source of truth is `lessons.js`.** It exports (UMD-style, works in both the browser and
Node) an array of lesson objects: `{ id, title, intro (HTML string), example: { query, note },
exercises: [{ id, prompt, solutionQuery, hint?, orderMatters? }] }`. There are no separately
stored "expected results" anywhere — `solutionQuery` is executed live against the in-memory
SQLite database both to display "the right answer" and to grade the learner's query. This means
lesson content can never drift out of sync with the seed data, but it also means a wrong
`solutionQuery` fails silently at runtime unless caught by `npm test` (which only checks that
every query *executes without error*, not that its output is sensible — read the query when
editing a lesson).

**`schema.sql`** defines and seeds the one shared learning database (a small e-commerce schema:
`customers`, `categories`, `products`, `orders`, `order_items`). It is loaded by both `app.js`
(via `fetch` in the browser) and `test/validate.js` (via `fs.readFileSync` in Node) against their
own sql.js instances — same schema, same seed data, two runtimes. When adding an exercise that
needs specific data shapes (e.g. an unpurchased product, a customer with no orders, a NULL
column), add the row to `schema.sql` rather than special-casing the query — see e.g. product id
25 ("Yoga Block"), which exists solely so the "products never purchased" exercise in module 7 has
a non-empty answer.

**`app.js`** does three things: boots sql.js from a CDN (`SQLJS_CDN` constant) and loads
`schema.sql` into an in-memory DB; renders lessons/exercises/sandbox from `LESSONS`; and grades
exercises via `compareResults()`. Grading compares only row *values*, not column names/aliases —
a learner's query with different column aliases than `solutionQuery` still passes as long as the
values line up positionally. By default row order doesn't matter (rows are sorted before
comparing); set `orderMatters: true` on an exercise (used in the ORDER BY/LIMIT module) to require
an exact positional match instead. Progress (which exercises have passed) is tracked per
`lessonId`/`exerciseId` in `localStorage`.

**`test/validate.js`** is not a unit test suite in the usual sense — there are no hardcoded
expected values to assert against (see above). It re-executes every `example.query` and
`exercise.solutionQuery` from `lessons.js` against `schema.sql` in Node and fails if any of them
error, warning (non-fatal) if any return zero rows. Run it after editing `lessons.js` or
`schema.sql`.
