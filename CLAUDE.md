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
Node) an array of 26 lesson objects grouped into six modules via a `module` string (the sidebar
prints a header whenever that value changes). Shape: `{ module, id, title, intro (HTML string),
example?: { query, note }, samples?: [{ title, code, note }], note?, exercises: [...] }`. There are
no separately stored "expected results" anywhere — `solutionQuery` is executed live against SQLite
both to display "the right answer" and to grade the learner's query. This means lesson content can
never drift out of sync with the seed data, but it also means a wrong `solutionQuery` fails silently
at runtime unless caught by `npm test` (which only checks that every query *executes without error*,
not that its output is sensible — read the query when editing a lesson).

Three lesson/exercise kinds exist, and they change how rendering and grading work:

- **Read-only exercises** (`{ id, prompt, solutionQuery, hint?, orderMatters? }`) — graded by
  comparing the learner's result set against `solutionQuery`'s.
- **Mutating exercises** (`mutating: true` + a required `verifyQuery`) — used by modules 4–6
  (INSERT/UPDATE/DELETE and DDL). The learner's statement produces no result set to compare, so
  grading instead runs their SQL and then `verifyQuery` inside a throwaway copy of the pristine
  database (`withTempDb()`), does the same for `solutionQuery`, and compares the two resulting
  *table states*. Consequence: grading never depends on, and never touches, the main database — so
  a learner who already ran `DELETE FROM ...` in the sandbox still gets correct grading. When
  writing one of these, make sure a do-nothing answer cannot pass: the expected state must differ
  from the untouched seed state (see the transaction exercises, which deliberately combine a
  rolled-back change with a committed one).
- **Reference lessons** (`exercises: []`, usually with `note` and `samples`) — topics SQLite cannot
  execute at all: stored procedures/functions, the event scheduler, `CREATE DATABASE`, row locks
  (`SELECT ... FOR UPDATE`), and `REGEXP`. These show MySQL/PostgreSQL syntax as read-only samples
  behind a warning banner rather than pretending to run. Do not add graded exercises to them, and do
  not "fix" them by inventing SQLite equivalents that behave differently — verify against SQLite
  first (a quick throwaway script using the Node `sql.js` in `node_modules` is the fastest way).

**`schema.sql`** defines and seeds the one shared learning database (a small e-commerce schema:
`customers`, `categories`, `products`, `orders`, `order_items`). It is loaded by both `app.js`
(via `fetch` in the browser) and `test/validate.js` (via `fs.readFileSync` in Node) against their
own sql.js instances — same schema, same seed data, two runtimes. When adding an exercise that
needs specific data shapes (e.g. an unpurchased product, a customer with no orders, a NULL
column), add the row to `schema.sql` rather than special-casing the query — see e.g. product id
25 ("Yoga Block"), which exists solely so the "products never purchased" exercise in module 7 has
a non-empty answer.

**`app.js`** boots sql.js from a CDN (`SQLJS_CDN` constant), loads `schema.sql` into an in-memory DB
and keeps `pristineBytes = db.export()` as the snapshot behind both `withTempDb()` grading and the
"↺ Сбросить базу" button; renders lessons/exercises/sandbox/data-browser from `LESSONS`; introspects
the schema (`collectSchema()` reads `sqlite_master` + `PRAGMA table_info` + `PRAGMA
foreign_key_list`) to draw the side panel and the SVG ER diagram; drives the live query preview
(below); and grades exercises via `compareResults()`. Grading compares only row *values*, not column
names/aliases —
a learner's query with different column aliases than `solutionQuery` still passes as long as the
values line up positionally. By default row order doesn't matter (rows are sorted before
comparing); set `orderMatters: true` on an exercise (used in the ORDER BY/LIMIT module) to require
an exact positional match instead. Progress (which exercises have passed) is tracked per
`lessonId`/`exerciseId` in `localStorage`.

**Live query preview** (`analyzeQuery()` + `renderLivePreview()` in `app.js`) is the one piece with
real complexity. As the learner types, it shows the *source* table with rows that pass `WHERE`
highlighted and result columns tinted. Since it must map a result back onto one source table, it
does a deliberately shallow parse: `scanTopLevelWords()` walks the SQL tracking paren depth and
string literals, so only depth-0 keywords count — which is what lets a scalar subquery
(`WHERE price > (SELECT AVG(price) FROM products)`) still resolve its outer `FROM` correctly.
Matched rows are found by *rebuilding* a `SELECT <ref>.rowid FROM <table> WHERE ...` query rather
than by interpreting the condition in JS, so SQLite remains the only thing evaluating SQL
semantics. Two invariants to preserve when touching this code:

- It only ever executes `SELECT`/`WITH` (`isReadOnlyQuery()`). The preview runs on every keystroke,
  so without that guard a half-typed `DROP TABLE customers` in the sandbox would execute for real.
- Anything it cannot honestly map to a single source table (`JOIN`, `UNION`, CTEs, comma joins)
  must bail out with a `reason` from `LIVE_REASON_TEXT`, not guess. Highlighting the wrong table is
  worse than showing nothing.

`ORDER BY`/`LIMIT` are folded into the rowid query (so highlighting matches a top-N result exactly)
but skipped when `GROUP BY` is present, where they apply to groups rather than source rows.

**ER diagram** (`buildErDiagram()`): tables are laid out in columns by FK depth
(`computeLevels()` — referenced tables sit left of the tables referencing them), so arrows read
"from the referencing column to the referenced key". It is generated from live introspection, which
means a table the learner creates in module 6 shows up in it too. Colors come from CSS variables so
both themes work; there is no diagramming library.

**`test/validate.js`** is not a unit test suite in the usual sense — there are no hardcoded
expected values to assert against (see above). It re-executes every `example.query` and
`exercise.solutionQuery` (plus `verifyQuery` for mutating ones) from `lessons.js` against
`schema.sql` in Node and fails if any of them error, warning (non-fatal) if any return zero rows.
Each query runs in its *own* fresh copy of the seeded database — modules 4–6 mutate data and schema,
so a shared connection would produce a cascade of false failures. Run it after editing `lessons.js`
or `schema.sql`.
