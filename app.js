// Логика приложения: инициализация SQLite в браузере, рендер уроков, выполнение
// запросов, проверка упражнений, прогресс в localStorage.

const SQLJS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/';
const PROGRESS_KEY = 'sql-tutorial-progress-v1';
const TRAINER_KEY = 'sql-tutorial-trainer-v1';

let db = null;
// Модуль sql.js и снимок чистой базы: нужны, чтобы (а) проверять упражнения,
// меняющие данные (INSERT/UPDATE/DELETE/DDL), в отдельной одноразовой копии базы,
// и (б) давать пользователю кнопку «сбросить базу» после своих экспериментов.
let SQLModule = null;
let pristineBytes = null;

const state = {
  currentLessonId: null,
  progress: loadProgress(),
  trainer: {
    solved: loadTrainerProgress(),
    filter: 'all', // all | easy | medium | hard | unsolved
    openTaskId: null,
  },
};

function loadTrainerProgress() {
  try {
    return JSON.parse(localStorage.getItem(TRAINER_KEY)) || {};
  } catch {
    return {};
  }
}

function saveTrainerProgress() {
  localStorage.setItem(TRAINER_KEY, JSON.stringify(state.trainer.solved));
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
}

function markExerciseDone(lessonId, exerciseId) {
  state.progress[lessonId] = state.progress[lessonId] || {};
  state.progress[lessonId][exerciseId] = true;
  saveProgress();
}

function isExerciseDone(lessonId, exerciseId) {
  return !!(state.progress[lessonId] && state.progress[lessonId][exerciseId]);
}

function lessonProgress(lesson) {
  const done = lesson.exercises.filter((ex) => isExerciseDone(lesson.id, ex.id)).length;
  return { done, total: lesson.exercises.length };
}

// ---------- SQL execution helpers ----------

function runSql(sql) {
  // Возвращает { columns, values } последнего результирующего набора, либо ошибку.
  const results = db.exec(sql);
  if (results.length === 0) {
    return { columns: [], values: [] };
  }
  return results[results.length - 1];
}

// Оборачивает имя таблицы/столбца в двойные кавычки для подстановки в SQL.
// Без этого таблица, созданная учеником и названная ключевым словом (`order`)
// или с пробелом, ломает все служебные запросы — вплоть до пустой модалки «Посмотреть БД».
function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function execIn(database, sql) {
  const res = database.exec(sql);
  return res.length ? res[res.length - 1] : { columns: [], values: [] };
}

// Выполняет fn на одноразовой копии ЧИСТОЙ базы. Основная база не затрагивается,
// поэтому проверка упражнений не зависит от того, что пользователь наделал раньше.
function withTempDb(fn) {
  const tdb = new SQLModule.Database(pristineBytes);
  try {
    return fn(tdb);
  } finally {
    tdb.close();
  }
}

function resetDatabase() {
  if (db) db.close();
  db = new SQLModule.Database(pristineBytes);
  renderSchemaReference();
  selectLesson(state.currentLessonId);
}

function normalizeValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Math.round(v * 1e6) / 1e6;
  return v;
}

function compareResults(userResult, expectedResult, orderMatters) {
  const userRows = userResult.values.map((r) => r.map(normalizeValue));
  const expectedRows = expectedResult.values.map((r) => r.map(normalizeValue));

  if (userRows.length !== expectedRows.length) {
    return { ok: false, reason: `Ожидалось строк: ${expectedRows.length}, получено: ${userRows.length}.` };
  }
  if (userRows.length > 0 && userRows[0].length !== expectedRows[0].length) {
    return { ok: false, reason: `Ожидалось столбцов: ${expectedRows[0].length}, получено: ${userRows[0].length}.` };
  }

  let ok;
  if (orderMatters) {
    ok = JSON.stringify(userRows) === JSON.stringify(expectedRows);
  } else {
    const su = userRows.map((r) => JSON.stringify(r)).sort();
    const se = expectedRows.map((r) => JSON.stringify(r)).sort();
    ok = JSON.stringify(su) === JSON.stringify(se);
  }
  return ok ? { ok: true } : { ok: false, reason: orderMatters ? 'Значения не совпадают (важен порядок строк).' : 'Значения не совпадают.' };
}

// ---------- Rendering helpers ----------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// Столбец считается числовым, если все его непустые значения — числа.
// Числовые столбцы выключаются вправо: так разряды выстраиваются друг под другом
// и колонку цен видно с одного взгляда.
function numericColumns(result) {
  return result.columns.map((_, idx) => {
    let sawValue = false;
    for (const row of result.values) {
      const v = row[idx];
      if (v === null || v === undefined) continue;
      if (typeof v !== 'number') return false;
      sawValue = true;
    }
    return sawValue;
  });
}

function renderCell(value, isNum) {
  if (value === null || value === undefined) return '<td class="null"><span>NULL</span></td>';
  return `<td${isNum ? ' class="num"' : ''}>${escapeHtml(value)}</td>`;
}

// headCells — готовая разметка <th> (нужна карточкам данных, где в шапку
// добавляются тип столбца и маркеры ключей). Без неё берутся простые имена.
function renderResultTable(result, opts = {}) {
  if (result.columns.length === 0) {
    return '<p class="muted">Запрос выполнен, но не вернул строк.</p>';
  }
  const nums = numericColumns(result);
  const head = opts.headCells || result.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
  const rows = result.values
    .map((row) => `<tr>${row.map((v, i) => renderCell(v, nums[i])).join('')}</tr>`)
    .join('');

  const tableClass = ['data-table', opts.stickyFirstColumn ? 'sticky-first' : '']
    .filter(Boolean)
    .join(' ');
  const table = `<table class="${tableClass}"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;

  if (opts.bare) return table;
  const rowCount = `<p class="muted">${result.values.length} строк(и)</p>`;
  return `<div class="table-wrap">${table}</div>${rowCount}`;
}

function renderError(err) {
  return `<p class="error">Ошибка: ${escapeHtml(err.message || String(err))}</p>`;
}

// ---------- Live query preview ----------
//
// Показывает в реальном времени, что происходит с ИСХОДНОЙ таблицей, пока
// пользователь печатает: какие строки проходят WHERE и какие столбцы попадают
// в результат. Работает только для одно-табличных SELECT (для JOIN/CTE честно
// сообщает, что разбор недоступен — подсветить "ту самую" таблицу там нельзя).
//
// Важно: живой предпросмотр НИКОГДА не выполняет ничего, кроме SELECT/WITH —
// иначе набранное в песочнице DROP TABLE выполнилось бы прямо во время набора.

const LIVE_ROW_CAP = 80;

// Ключевые слова, при которых построчная подсветка одной таблицы теряет смысл.
const MULTI_SOURCE_RE = /\b(JOIN|UNION|EXCEPT|INTERSECT)\b/i;
const CLAUSE_STOP_WORDS = new Set(['WHERE', 'GROUP', 'ORDER', 'LIMIT', 'HAVING', 'WINDOW', 'OFFSET']);

function stripSqlComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

// Разбирает SQL на слова, находящиеся на верхнем уровне вложенности скобок,
// пропуская строковые литералы. Благодаря этому FROM внутри подзапроса
// (он всегда в скобках) не путается с основным FROM запроса.
function scanTopLevelWords(sql) {
  const words = [];
  let depth = 0;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === '(') {
      depth++;
      i++;
      continue;
    }
    if (ch === ')') {
      depth--;
      i++;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < sql.length && /\w/.test(sql[j])) j++;
      if (depth === 0) words.push({ word: sql.slice(i, j).toUpperCase(), start: i, end: j });
      i = j;
      continue;
    }
    i++;
  }
  return words;
}

function isReadOnlyQuery(sql) {
  const first = stripSqlComments(sql).trim().split(/\s+/)[0] || '';
  const kw = first.toUpperCase();
  return kw === 'SELECT' || kw === 'WITH';
}

function tableColumnNames(table) {
  const info = db.exec(`PRAGMA table_info(${quoteIdent(table)});`);
  if (!info.length) return null;
  return info[0].values.map((row) => row[1]);
}

function mentionsColumn(text, column) {
  return new RegExp(`\\b${column}\\b`, 'i').test(text);
}

// Разбивает список на элементы по запятым верхнего уровня (запятые внутри
// вызовов функций — SUM(a, b) — не считаются разделителями).
function splitTopLevelCommas(text) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

// true только для настоящей "звёздочки всех столбцов" (`*` или `t.*`),
// но не для COUNT(*) и не для умножения вида quantity * unit_price.
function selectsAllColumns(selectList) {
  return splitTopLevelCommas(selectList).some((item) => /^\s*(?:\w+\s*\.\s*)?\*\s*$/.test(item));
}

// Возвращает либо { ok: true, ...данные для подсветки }, либо { ok: false, reason }.
function analyzeQuery(sql) {
  const clean = stripSqlComments(sql).trim().replace(/;+\s*$/, '');
  if (!clean) return { ok: false, reason: 'empty' };
  if (!isReadOnlyQuery(clean)) return { ok: false, reason: 'not-select' };
  if (MULTI_SOURCE_RE.test(clean)) return { ok: false, reason: 'multi-source' };

  const words = scanTopLevelWords(clean);
  if (!words.length || words[0].word !== 'SELECT') return { ok: false, reason: 'multi-source' };

  const fromWord = words.find((w) => w.word === 'FROM');
  if (!fromWord) return { ok: false, reason: 'no-from' };

  // Имя таблицы и необязательный алиас сразу после FROM.
  // Имя может быть в двойных кавычках — так пишут, когда оно совпадает с ключевым
  // словом (`"order"`) или содержит пробел.
  const tail = clean.slice(fromWord.end);
  const m = tail.match(/^\s+(?:"((?:[^"]|"")+)"|([A-Za-z_]\w*))(\s+(?:AS\s+)?([A-Za-z_]\w*))?/i);
  if (!m) return { ok: false, reason: 'multi-source' };
  const table = m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2];
  let alias = m[4] || null;
  if (alias && CLAUSE_STOP_WORDS.has(alias.toUpperCase())) alias = null;

  // FROM a, b — старый стиль соединения, подсветка одной таблицы соврала бы.
  const afterSource = tail.slice(m[0].length).trimStart();
  if (afterSource.startsWith(',')) return { ok: false, reason: 'multi-source' };

  let columns;
  try {
    columns = tableColumnNames(table);
  } catch {
    return { ok: false, reason: 'unknown-table' };
  }
  if (!columns) return { ok: false, reason: 'unknown-table' };

  const selectList = clean.slice(words[0].end, fromWord.start);
  const hasStar = selectsAllColumns(selectList);

  const whereWord = words.find((w) => w.word === 'WHERE');
  const groupWord = words.find((w) => w.word === 'GROUP');
  let whereClause = null;
  if (whereWord) {
    const stop = words.find((w) => w.start > whereWord.start && CLAUSE_STOP_WORDS.has(w.word));
    whereClause = clean.slice(whereWord.end, stop ? stop.start : undefined).trim();
  }

  // Хвост запроса (ORDER BY / LIMIT) применяем только если нет GROUP BY:
  // при группировке они действуют на группы, а не на исходные строки.
  const quotedTable = quoteIdent(table);
  const ref = alias || quotedTable;
  const source = `${quotedTable}${alias ? ' ' + alias : ''}`;
  const orderWord = words.find((w) => w.word === 'ORDER' || w.word === 'LIMIT');
  const tailClause = !groupWord && orderWord ? clean.slice(orderWord.start) : '';
  const wherePart = whereClause ? ` WHERE ${whereClause}` : '';

  let matched = null;
  const attempts = [
    `SELECT ${ref}.rowid FROM ${source}${wherePart} ${tailClause}`,
    `SELECT ${ref}.rowid FROM ${source}${wherePart}`,
  ];
  for (const attempt of attempts) {
    try {
      const res = db.exec(attempt);
      matched = new Set(res.length ? res[0].values.map((r) => r[0]) : []);
      break;
    } catch {
      /* пробуем следующий, более простой вариант */
    }
  }
  if (!matched) return { ok: false, reason: 'invalid' };

  const selectedColumns = new Set(
    columns.filter((c) => hasStar || mentionsColumn(selectList, c))
  );
  const filterColumns = new Set(
    whereClause ? columns.filter((c) => mentionsColumn(whereClause, c)) : []
  );

  const all = db.exec(`SELECT ${ref}.rowid AS __rid, ${ref}.* FROM ${source} LIMIT ${LIVE_ROW_CAP};`);
  const rows = all.length ? all[0].values : [];

  return {
    ok: true,
    table,
    columns,
    rows,
    matched,
    selectedColumns,
    filterColumns,
    hasWhere: !!whereClause,
    grouped: !!groupWord,
  };
}

const LIVE_REASON_TEXT = {
  empty: 'Начните печатать запрос — здесь будет видно, какие строки и столбцы он выбирает.',
  'not-select': 'Живой предпросмотр работает только для SELECT (чтобы ничего не изменить в базе случайно).',
  'multi-source': 'В запросе несколько источников (JOIN, CTE, UNION) — подсветить одну исходную таблицу нельзя. Результат можно посмотреть кнопкой ниже.',
  'no-from': 'В запросе нет FROM — подсвечивать нечего.',
  'unknown-table': 'Такой таблицы нет в базе. Список таблиц — в панели «Схема БД» справа.',
  invalid: 'Запрос пока не выполняется (возможно, он ещё не дописан).',
};

function renderLivePreview(sql, container) {
  const analysis = analyzeQuery(sql);

  if (!analysis.ok) {
    container.innerHTML = `<p class="live-hint">${escapeHtml(
      LIVE_REASON_TEXT[analysis.reason] || LIVE_REASON_TEXT.invalid
    )}</p>`;
    return;
  }

  const { table, columns, rows, matched, selectedColumns, filterColumns, hasWhere, grouped } = analysis;

  const head = columns
    .map((c) => {
      const cls = selectedColumns.has(c) ? ' class="col-sel"' : '';
      const badge = filterColumns.has(c) ? ' <span class="col-badge" title="участвует в WHERE">фильтр</span>' : '';
      return `<th${cls}>${escapeHtml(c)}${badge}</th>`;
    })
    .join('');

  const body = rows
    .map((row) => {
      const rid = row[0];
      const isMatch = matched.has(rid);
      const cells = columns
        .map((c, idx) => {
          const v = row[idx + 1];
          const classes = [];
          if (selectedColumns.has(c)) classes.push('col-sel');
          if (v === null) classes.push('null');
          const attr = classes.length ? ` class="${classes.join(' ')}"` : '';
          return `<td${attr}>${v === null ? 'NULL' : escapeHtml(v)}</td>`;
        })
        .join('');
      return `<tr class="${isMatch ? 'row-match' : 'row-dim'}">${cells}</tr>`;
    })
    .join('');

  const matchedShown = rows.filter((r) => matched.has(r[0])).length;
  const summary = hasWhere
    ? `Подходит строк: <strong>${matchedShown}</strong> из ${rows.length}`
    : `Условия WHERE нет — берутся все ${rows.length} строк`;
  const groupNote = grouped
    ? ' <span class="muted">(есть GROUP BY — подсвечены строки, которые попадут в группировку)</span>'
    : '';

  container.innerHTML = `
    <p class="live-summary">Таблица <code>${escapeHtml(table)}</code> · ${summary}${groupNote}</p>
    <div class="live-legend">
      <span><span class="swatch swatch-row"></span> строка проходит фильтр</span>
      <span><span class="swatch swatch-col"></span> столбец попадает в результат</span>
      <span><span class="swatch swatch-dim"></span> строка отброшена</span>
    </div>
    <div class="table-wrap"><table class="live-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
  `;
}

// Привязывает живой предпросмотр к textarea (с задержкой, чтобы не пересчитывать
// на каждое нажатие клавиши).
function attachLivePreview(textarea, container) {
  let timer = null;
  const update = () => renderLivePreview(textarea.value, container);
  textarea.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(update, 250);
  });
  update();
}

// ---------- Schema introspection ----------

// Собирает структуру базы: таблицы, столбцы, первичные и внешние ключи.
// Всё читается из самой базы (sqlite_master + PRAGMA), поэтому схема на экране
// всегда соответствует реальности — в том числе таблицам, созданным учеником.
function collectSchema() {
  const tableNames = runSql(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
  ).values.map((r) => r[0]);

  return tableNames.map((name) => {
    const info = execIn(db, `PRAGMA table_info(${quoteIdent(name)});`);
    const fkInfo = execIn(db, `PRAGMA foreign_key_list(${quoteIdent(name)});`);

    // PRAGMA foreign_key_list: [id, seq, table, from, to, on_update, on_delete, match]
    const fks = fkInfo.values.map((row) => ({
      from: row[3],
      table: row[2],
      to: row[4] || 'id',
    }));

    const columns = info.values.map((row) => {
      const [, colName, type, , , pk] = row;
      const fk = fks.find((f) => f.from === colName) || null;
      return { name: colName, type, pk: !!pk, fk };
    });

    return { name, columns, fks };
  });
}

function renderSchemaReference() {
  const schema = collectSchema();
  const blocks = schema.map((t) => {
    const cols = t.columns.map((c) => {
      const marks = [];
      if (c.pk) marks.push('<span class="key-mark" title="первичный ключ">🔑</span>');
      if (c.fk)
        marks.push(
          `<span class="fk-mark" title="ссылается на ${escapeHtml(c.fk.table)}.${escapeHtml(
            c.fk.to
          )}">→ ${escapeHtml(c.fk.table)}</span>`
        );
      return `<li><code>${escapeHtml(c.name)}</code> <span class="muted">${escapeHtml(
        c.type
      )}</span> ${marks.join(' ')}</li>`;
    });
    return `<div class="schema-table"><strong>${escapeHtml(t.name)}</strong><ul>${cols.join('')}</ul></div>`;
  });

  document.getElementById('schema-reference').innerHTML = blocks.join('');
}

// ---------- ER diagram ----------

// Раскладывает таблицы по «уровням»: таблица без внешних ключей — уровень 0,
// остальные правее тех, на кого ссылаются. Так стрелки всегда идут справа налево
// и диаграмма читается как «от справочников к зависимым данным».
function computeLevels(schema) {
  const byName = new Map(schema.map((t) => [t.name, t]));
  const levels = new Map();

  const levelOf = (name, seen = new Set()) => {
    if (levels.has(name)) return levels.get(name);
    if (seen.has(name)) return 0; // защита от циклов в ссылках
    seen.add(name);
    const t = byName.get(name);
    const parents = t ? t.fks.filter((f) => f.table !== name && byName.has(f.table)) : [];
    const level = parents.length ? Math.max(...parents.map((f) => levelOf(f.table, seen) + 1)) : 0;
    levels.set(name, level);
    return level;
  };

  schema.forEach((t) => levelOf(t.name));
  return levels;
}

function buildErDiagram(schema) {
  if (!schema.length) return '<p class="muted">В базе нет таблиц.</p>';

  const BOX_W = 210;
  const HEAD_H = 30;
  const ROW_H = 20;
  const GAP_X = 130;
  const GAP_Y = 34;
  const PAD = 16;

  const levels = computeLevels(schema);
  const byLevel = new Map();
  schema.forEach((t) => {
    const l = levels.get(t.name) || 0;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l).push(t);
  });

  // Координаты каждой таблицы.
  const layout = new Map();
  [...byLevel.keys()]
    .sort((a, b) => a - b)
    .forEach((level) => {
      let y = PAD;
      byLevel.get(level).forEach((t) => {
        const h = HEAD_H + t.columns.length * ROW_H;
        layout.set(t.name, { x: PAD + level * (BOX_W + GAP_X), y, h });
        y += h + GAP_Y;
      });
    });

  const width =
    PAD * 2 + (Math.max(...levels.values()) + 1) * BOX_W + Math.max(...levels.values()) * GAP_X;
  const height =
    PAD * 2 +
    Math.max(
      ...[...byLevel.values()].map((ts) =>
        ts.reduce((sum, t) => sum + HEAD_H + t.columns.length * ROW_H + GAP_Y, 0)
      )
    );

  const columnY = (table, colName) => {
    const pos = layout.get(table.name);
    const idx = table.columns.findIndex((c) => c.name === colName);
    return pos.y + HEAD_H + (idx < 0 ? 0 : idx) * ROW_H + ROW_H / 2;
  };

  const byName = new Map(schema.map((t) => [t.name, t]));

  // Связи рисуем кривыми Безье от столбца-ссылки к столбцу-цели.
  const edges = [];
  schema.forEach((t) => {
    t.fks.forEach((fk) => {
      const target = byName.get(fk.table);
      if (!target) return;
      const src = layout.get(t.name);
      const tgt = layout.get(target.name);
      const sy = columnY(t, fk.from);
      const ty = columnY(target, fk.to);
      // Если источник правее цели — выходим влево; иначе вправо.
      const srcRight = src.x > tgt.x;
      const sx = srcRight ? src.x : src.x + BOX_W;
      const tx = srcRight ? tgt.x + BOX_W : tgt.x;
      const bend = srcRight ? -60 : 60;
      edges.push(
        `<path class="er-edge" d="M ${sx} ${sy} C ${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}" marker-end="url(#er-arrow)" />`
      );
    });
  });

  const boxes = schema.map((t) => {
    const pos = layout.get(t.name);
    const rows = t.columns.map((c, i) => {
      const y = pos.y + HEAD_H + i * ROW_H;
      const marks = `${c.pk ? '🔑 ' : ''}${c.fk ? '→ ' : ''}`;
      return `
        <text class="er-col${c.pk ? ' er-col-pk' : ''}${c.fk ? ' er-col-fk' : ''}" x="${pos.x + 10}" y="${y + 14}">${escapeHtml(
        marks + c.name
      )}</text>
        <text class="er-type" x="${pos.x + BOX_W - 10}" y="${y + 14}" text-anchor="end">${escapeHtml(c.type)}</text>`;
    });
    return `
      <g>
        <rect class="er-box" x="${pos.x}" y="${pos.y}" width="${BOX_W}" height="${pos.h}" rx="8" />
        <rect class="er-box-head" x="${pos.x}" y="${pos.y}" width="${BOX_W}" height="${HEAD_H}" rx="8" />
        <text class="er-title" x="${pos.x + 10}" y="${pos.y + 20}">${escapeHtml(t.name)}</text>
        ${rows.join('')}
      </g>`;
  });

  return `
    <div class="er-wrap">
      <svg class="er-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img"
           aria-label="Диаграмма связей таблиц базы данных">
        <defs>
          <marker id="er-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path class="er-arrow-head" d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        ${edges.join('')}
        ${boxes.join('')}
      </svg>
    </div>
    <p class="muted">🔑 — первичный ключ, → — внешний ключ (ссылка на другую таблицу).
    Стрелка идёт от столбца-ссылки к столбцу, на который он ссылается.</p>
  `;
}

// Карточка одной таблицы: плотная шапка с именем и счётчиками, а внутри —
// прокручиваемое тело с залипающим заголовком столбцов. Одинаковая высота карточек
// нужна, чтобы сетка не «рвалась» при разном количестве строк в таблицах.
function buildTableCard(table) {
  const result = runSql(`SELECT * FROM ${quoteIdent(table.name)} LIMIT 500;`);

  const headCells = table.columns
    .map((c) => {
      const marks = [];
      if (c.pk) marks.push('<span class="th-key" title="первичный ключ">🔑</span>');
      if (c.fk)
        marks.push(
          `<span class="th-fk" title="ссылается на ${escapeHtml(c.fk.table)}.${escapeHtml(
            c.fk.to
          )}">→ ${escapeHtml(c.fk.table)}</span>`
        );
      return `<th>
        <span class="th-name">${escapeHtml(c.name)} ${marks.join(' ')}</span>
        <span class="th-type">${escapeHtml(c.type)}</span>
      </th>`;
    })
    .join('');

  const body =
    result.columns.length === 0
      ? '<p class="muted table-empty">Таблица пуста.</p>'
      : renderResultTable(result, { headCells, bare: true, stickyFirstColumn: true });

  return `
    <section class="table-card" id="table-${escapeHtml(table.name)}">
      <header class="table-card-head">
        <h4>${escapeHtml(table.name)}</h4>
        <span class="table-badges">
          <span class="badge">${result.values.length} строк</span>
          <span class="badge">${table.columns.length} столб.</span>
        </span>
      </header>
      <div class="table-card-body">${body}</div>
    </section>
  `;
}

// Чипсы для быстрого перехода к нужной таблице — с восемью таблицами скроллить вслепую неудобно.
function buildTableNav(schema) {
  const chips = schema
    .map((t) => {
      const cnt = runSql(`SELECT COUNT(*) FROM ${quoteIdent(t.name)};`).values[0][0];
      return `<button class="chip" data-table="${escapeHtml(t.name)}">${escapeHtml(
        t.name
      )} <span class="chip-count">${cnt}</span></button>`;
    })
    .join('');
  return `<div class="table-nav">${chips}</div>`;
}

function buildAllTablesHtml(schema) {
  return `<div class="data-grid">${schema.map(buildTableCard).join('')}</div>`;
}

// Клик по чипсу подсвечивает и прокручивает к карточке таблицы.
function wireTableNav(root) {
  root.querySelectorAll('.chip[data-table]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const card = root.querySelector(`#table-${CSS.escape(chip.dataset.table)}`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.classList.add('table-card-flash');
      setTimeout(() => card.classList.remove('table-card-flash'), 1200);
    });
  });
}

// ---------- "Посмотреть БД" modal ----------

function openDbModal() {
  const overlay = document.getElementById('db-modal');
  const schema = collectSchema();
  const body = overlay.querySelector('.db-modal-body');
  body.innerHTML = `
    <section>
      <h3>Связи между таблицами</h3>
      ${buildErDiagram(schema)}
    </section>
    <section>
      <h3>Данные</h3>
      ${buildTableNav(schema)}
      ${buildAllTablesHtml(schema)}
    </section>
  `;
  wireTableNav(body);
  overlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeDbModal() {
  document.getElementById('db-modal').classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function initDbModal() {
  const overlay = document.getElementById('db-modal');
  document.getElementById('open-db-btn').addEventListener('click', openDbModal);
  overlay.querySelector('.db-modal-close').addEventListener('click', closeDbModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDbModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeDbModal();
  });

  document.getElementById('reset-db-btn').addEventListener('click', () => {
    resetDatabase();
    if (!overlay.classList.contains('hidden')) openDbModal();
  });
}

// ---------- Lesson rendering ----------

function renderSidebar() {
  const nav = document.getElementById('lesson-nav');
  nav.innerHTML = '';
  let currentModule = null;
  LESSONS.forEach((lesson) => {
    // Заголовок модуля печатается один раз перед первым уроком этого модуля.
    if (lesson.module && lesson.module !== currentModule) {
      currentModule = lesson.module;
      const head = document.createElement('li');
      head.className = 'nav-module';
      head.textContent = lesson.module;
      nav.appendChild(head);
    }

    const { done, total } = lessonProgress(lesson);
    const li = document.createElement('li');
    li.className = 'nav-item' + (lesson.id === state.currentLessonId ? ' active' : '');
    // У справочных уроков упражнений нет — им не нужен ни счётчик, ни галочка «всё сделано».
    const mark = total > 0 && done === total ? '✅ ' : '';
    const counter = total > 0 ? `${done}/${total}` : '📖';
    li.innerHTML = `
      <span class="nav-title">${mark}${escapeHtml(lesson.title)}</span>
      <span class="nav-progress">${counter}</span>
    `;
    li.addEventListener('click', () => selectLesson(lesson.id));
    nav.appendChild(li);
  });

  const trainerHead = document.createElement('li');
  trainerHead.className = 'nav-module';
  trainerHead.textContent = 'Практика';
  nav.appendChild(trainerHead);

  const { solved, total } = trainerStats();
  const trainerLi = document.createElement('li');
  trainerLi.className = 'nav-item' + (state.currentLessonId === 'trainer' ? ' active' : '');
  trainerLi.innerHTML = `<span class="nav-title">🏋️ Тренажёр</span><span class="nav-progress">${solved}/${total}</span>`;
  trainerLi.addEventListener('click', () => selectLesson('trainer'));
  nav.appendChild(trainerLi);

  const dataLi = document.createElement('li');
  dataLi.className = 'nav-item' + (state.currentLessonId === 'data' ? ' active' : '');
  dataLi.innerHTML = '<span class="nav-title">📋 Схема и данные</span>';
  dataLi.addEventListener('click', () => selectLesson('data'));
  nav.appendChild(dataLi);

  const sandboxLi = document.createElement('li');
  sandboxLi.className = 'nav-item' + (state.currentLessonId === 'sandbox' ? ' active' : '');
  sandboxLi.innerHTML = '<span class="nav-title">🧪 Песочница</span>';
  sandboxLi.addEventListener('click', () => selectLesson('sandbox'));
  nav.appendChild(sandboxLi);
}

function selectLesson(lessonId) {
  state.currentLessonId = lessonId;
  renderSidebar();
  if (lessonId === 'sandbox') {
    renderSandbox();
  } else if (lessonId === 'data') {
    renderDataBrowser();
  } else if (lessonId === 'trainer') {
    renderTrainer();
  } else {
    renderLesson(LESSONS.find((l) => l.id === lessonId));
  }
}

function runAndShow(sql, outputEl) {
  try {
    const result = runSql(sql);
    outputEl.innerHTML = renderResultTable(result);
    return result;
  } catch (err) {
    outputEl.innerHTML = renderError(err);
    return null;
  }
}

function renderLesson(lesson) {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <article class="lesson">
      <h2>${escapeHtml(lesson.title)}</h2>
      <div class="lesson-intro">${lesson.intro}</div>

      ${lesson.note ? `<p class="lesson-note">${lesson.note}</p>` : ''}

      ${
        lesson.example
          ? `<section class="example-block">
        <h3>Пример</h3>
        <pre class="sql-code">${escapeHtml(lesson.example.query)}</pre>
        <p class="muted">${escapeHtml(lesson.example.note)}</p>
        <button class="btn run-example">Выполнить пример</button>
        <div class="result example-result"></div>
        <div class="live-body example-live"></div>
      </section>`
          : ''
      }

      ${
        lesson.samples
          ? `<section class="samples">
        <h3>Как это выглядит в коде</h3>
        ${lesson.samples
          .map(
            (s) => `<div class="sample">
              <h4>${escapeHtml(s.title)}</h4>
              <pre class="sql-code">${escapeHtml(s.code)}</pre>
              ${s.note ? `<p class="muted">${escapeHtml(s.note)}</p>` : ''}
            </div>`
          )
          .join('')}
      </section>`
          : ''
      }

      ${
        lesson.exercises.length
          ? `<section class="exercises">
        <h3>Упражнения</h3>
        <div class="exercise-list"></div>
      </section>`
          : ''
      }
    </article>
  `;

  if (lesson.example) {
    main.querySelector('.run-example').addEventListener('click', () => {
      runAndShow(lesson.example.query, main.querySelector('.example-result'));
      renderLivePreview(lesson.example.query, main.querySelector('.example-live'));
    });
  }

  const list = main.querySelector('.exercise-list');
  if (list) lesson.exercises.forEach((ex, idx) => renderExercise(lesson, ex, idx, list));
}

function renderExercise(lesson, ex, idx, container) {
  const wrap = document.createElement('div');
  wrap.className = 'exercise';
  const done = isExerciseDone(lesson.id, ex.id);
  wrap.innerHTML = `
    <h4>${done ? '✅' : '▫️'} Упражнение ${idx + 1}</h4>
    <p>${escapeHtml(ex.prompt)}</p>
    ${ex.hint ? `<details class="hint"><summary>Подсказка</summary><p>${escapeHtml(ex.hint)}</p></details>` : ''}
    <textarea class="sql-input" rows="4" spellcheck="false" placeholder="-- напишите запрос здесь"></textarea>
    <div class="exercise-actions">
      <button class="btn run-btn">Выполнить</button>
      <button class="btn check-btn">Проверить</button>
      <details class="solution"><summary>Показать решение</summary><pre class="sql-code"></pre></details>
    </div>
    <section class="live-preview">
      <h5>Что выбирается прямо сейчас</h5>
      <div class="live-body"></div>
    </section>
    <div class="result exercise-result"></div>
    <div class="check-feedback"></div>
  `;

  const textarea = wrap.querySelector('.sql-input');
  const resultEl = wrap.querySelector('.exercise-result');
  const feedbackEl = wrap.querySelector('.check-feedback');
  wrap.querySelector('.solution pre').textContent = ex.solutionQuery;
  attachLivePreview(textarea, wrap.querySelector('.live-body'));

  wrap.querySelector('.run-btn').addEventListener('click', () => {
    feedbackEl.innerHTML = '';
    runAndShow(textarea.value, resultEl);
  });

  wrap.querySelector('.check-btn').addEventListener('click', () => {
    let userResult;
    let expectedResult;
    try {
      if (ex.mutating) {
        // Запрос меняет данные: выполняем его и эталон в отдельных копиях чистой базы,
        // а сравниваем не вывод самого запроса (у INSERT его нет), а состояние
        // таблиц после него — через verifyQuery.
        userResult = withTempDb((tdb) => {
          tdb.run(textarea.value);
          return execIn(tdb, ex.verifyQuery);
        });
        expectedResult = withTempDb((tdb) => {
          tdb.run(ex.solutionQuery);
          return execIn(tdb, ex.verifyQuery);
        });
        resultEl.innerHTML =
          '<p class="muted">Состояние таблицы после вашего запроса:</p>' + renderResultTable(userResult);
      } else {
        userResult = runSql(textarea.value);
        expectedResult = withTempDb((tdb) => execIn(tdb, ex.solutionQuery));
        resultEl.innerHTML = renderResultTable(userResult);
      }
    } catch (err) {
      resultEl.innerHTML = renderError(err);
      feedbackEl.innerHTML = '<p class="feedback fail">❌ Запрос не выполнился.</p>';
      return;
    }
    const verdict = compareResults(userResult, expectedResult, !!ex.orderMatters);
    if (verdict.ok) {
      feedbackEl.innerHTML = '<p class="feedback ok">✅ Верно!</p>';
      markExerciseDone(lesson.id, ex.id);
      wrap.querySelector('h4').textContent = `✅ Упражнение ${idx + 1}`;
      renderSidebar();
    } else {
      feedbackEl.innerHTML = `<p class="feedback fail">❌ Пока не то. ${escapeHtml(verdict.reason)}</p>`;
    }
  });

  container.appendChild(wrap);
}

function renderSandbox() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <article class="lesson">
      <h2>🧪 Песочница</h2>
      <p>Пишите любые SQL-запросы к учебной базе и сразу смотрите результат. Список таблиц и столбцов — в боковой панели справа.</p>
      <textarea class="sql-input" rows="8" spellcheck="false" placeholder="SELECT * FROM customers;"></textarea>
      <div class="exercise-actions">
        <button class="btn run-btn">Выполнить</button>
      </div>
      <section class="live-preview">
        <h3>Что выбирается прямо сейчас</h3>
        <div class="live-body"></div>
      </section>
      <div class="result sandbox-result"></div>
    </article>
  `;
  const textarea = main.querySelector('.sql-input');
  const resultEl = main.querySelector('.sandbox-result');
  main.querySelector('.run-btn').addEventListener('click', () => {
    runAndShow(textarea.value, resultEl);
  });
  attachLivePreview(textarea, main.querySelector('.live-body'));
}

// ---------- Тренажёр ----------

const LEVEL_LABEL = { easy: 'Лёгкое', medium: 'Среднее', hard: 'Сложное' };

function trainerStats() {
  const byLevel = { easy: [0, 0], medium: [0, 0], hard: [0, 0] };
  TASKS.forEach((t) => {
    byLevel[t.level][1] += 1;
    if (state.trainer.solved[t.id]) byLevel[t.level][0] += 1;
  });
  const solved = TASKS.filter((t) => state.trainer.solved[t.id]).length;
  return { byLevel, solved, total: TASKS.length };
}

// Обновляет счётчики решённых заданий, не перерисовывая список — иначе у
// открытого задания пропали бы набранный запрос и результат.
function updateTrainerCounters() {
  const { byLevel, solved, total } = trainerStats();

  const progressEl = document.querySelector('.trainer-progress');
  if (progressEl) progressEl.innerHTML = `Решено: <strong>${solved}</strong> из ${total}`;

  const labels = {
    all: `Все (${total})`,
    easy: `Лёгкие (${byLevel.easy[0]}/${byLevel.easy[1]})`,
    medium: `Средние (${byLevel.medium[0]}/${byLevel.medium[1]})`,
    hard: `Сложные (${byLevel.hard[0]}/${byLevel.hard[1]})`,
    unsolved: 'Нерешённые',
  };
  document.querySelectorAll('.btn-filter').forEach((btn) => {
    const label = labels[btn.dataset.filter];
    if (label) btn.textContent = label;
  });

  renderSidebar();
}

function visibleTasks() {
  const f = state.trainer.filter;
  if (f === 'all') return TASKS;
  if (f === 'unsolved') return TASKS.filter((t) => !state.trainer.solved[t.id]);
  return TASKS.filter((t) => t.level === f);
}

function renderTrainer() {
  const main = document.getElementById('main-content');
  const { byLevel, solved, total } = trainerStats();

  const filters = [
    ['all', `Все (${total})`],
    ['easy', `Лёгкие (${byLevel.easy[0]}/${byLevel.easy[1]})`],
    ['medium', `Средние (${byLevel.medium[0]}/${byLevel.medium[1]})`],
    ['hard', `Сложные (${byLevel.hard[0]}/${byLevel.hard[1]})`],
    ['unsolved', 'Нерешённые'],
  ];

  main.innerHTML = `
    <article class="lesson">
      <h2>🏋️ Тренажёр</h2>
      <p>Задания на той же учебной базе — от простых выборок до сверки данных между таблицами.
      К каждому есть подсказки (открываются по клику, если застряли) и разбор решения.
      Схема и содержимое таблиц всегда под рукой — кнопка «Посмотреть БД» вверху.</p>

      <p class="trainer-progress">Решено: <strong>${solved}</strong> из ${total}</p>

      <div class="trainer-filters">
        ${filters
          .map(
            ([key, label]) =>
              `<button class="btn btn-filter${state.trainer.filter === key ? ' active' : ''}" data-filter="${key}">${escapeHtml(
                label
              )}</button>`
          )
          .join('')}
      </div>

      <div class="task-list"></div>
    </article>
  `;

  main.querySelectorAll('.btn-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.trainer.filter = btn.dataset.filter;
      renderTrainer();
    });
  });

  const list = main.querySelector('.task-list');
  const tasks = visibleTasks();
  if (!tasks.length) {
    list.innerHTML = '<p class="muted">Нет заданий под этот фильтр — все решены 🎉</p>';
    return;
  }
  tasks.forEach((task, idx) => renderTask(task, idx, list));
}

function renderTask(task, idx, container) {
  const done = !!state.trainer.solved[task.id];
  const open = state.trainer.openTaskId === task.id;

  const wrap = document.createElement('div');
  wrap.className = 'task' + (done ? ' task-done' : '');
  wrap.innerHTML = `
    <div class="task-head">
      <span class="task-mark">${done ? '✅' : '▫️'}</span>
      <span class="task-title">${escapeHtml(task.title)}</span>
      <span class="task-level task-level-${task.level}">${LEVEL_LABEL[task.level]}</span>
    </div>
    <div class="task-body${open ? '' : ' hidden'}">
      <p class="task-prompt">${task.prompt}</p>
      <p class="muted">Ожидаемый результат: ${escapeHtml(task.columns)}</p>

      <details class="hint"><summary>💡 Подсказка 1 — с чего начать</summary><p>${escapeHtml(
        task.hints[0]
      )}</p></details>
      ${
        task.hints[1]
          ? `<details class="hint"><summary>💡 Подсказка 2 — конкретная конструкция</summary><p>${escapeHtml(
              task.hints[1]
            )}</p></details>`
          : ''
      }

      <textarea class="sql-input" rows="5" spellcheck="false" placeholder="-- напишите запрос здесь"></textarea>
      <div class="exercise-actions">
        <button class="btn run-btn">Выполнить</button>
        <button class="btn check-btn">Проверить</button>
        <details class="solution">
          <summary>Показать разбор и ответ</summary>
          <div class="task-explanation">${task.explanation}</div>
          <pre class="sql-code"></pre>
        </details>
      </div>
      <section class="live-preview">
        <h5>Что выбирается прямо сейчас</h5>
        <div class="live-body"></div>
      </section>
      <div class="result task-result"></div>
      <div class="check-feedback"></div>
    </div>
  `;

  // Клик по заголовку сворачивает/разворачивает задание.
  wrap.querySelector('.task-head').addEventListener('click', () => {
    state.trainer.openTaskId = open ? null : task.id;
    renderTrainer();
  });

  if (open) {
    const textarea = wrap.querySelector('.sql-input');
    const resultEl = wrap.querySelector('.task-result');
    const feedbackEl = wrap.querySelector('.check-feedback');
    wrap.querySelector('.solution pre').textContent = task.solutionQuery;

    wrap.querySelector('.run-btn').addEventListener('click', () => {
      feedbackEl.innerHTML = '';
      runAndShow(textarea.value, resultEl);
    });

    wrap.querySelector('.check-btn').addEventListener('click', () => {
      let userResult;
      try {
        userResult = runSql(textarea.value);
        resultEl.innerHTML = renderResultTable(userResult);
      } catch (err) {
        resultEl.innerHTML = renderError(err);
        feedbackEl.innerHTML = '<p class="feedback fail">❌ Запрос не выполнился.</p>';
        return;
      }
      // Эталон считаем на чистой копии базы: если пользователь успел что-то
      // изменить в песочнице, задание всё равно проверится корректно.
      const expected = withTempDb((tdb) => execIn(tdb, task.solutionQuery));
      const verdict = compareResults(userResult, expected, !!task.orderMatters);
      if (verdict.ok) {
        feedbackEl.innerHTML = '<p class="feedback ok">✅ Верно!</p>';
        if (!state.trainer.solved[task.id]) {
          state.trainer.solved[task.id] = true;
          saveTrainerProgress();
          wrap.classList.add('task-done');
          wrap.querySelector('.task-mark').textContent = '✅';
          updateTrainerCounters();
        }
      } else {
        feedbackEl.innerHTML = `<p class="feedback fail">❌ Пока не то. ${escapeHtml(verdict.reason)}</p>`;
      }
    });

    attachLivePreview(textarea, wrap.querySelector('.live-body'));
  }

  container.appendChild(wrap);
}

function renderDataBrowser() {
  const main = document.getElementById('main-content');
  const schema = collectSchema();
  main.innerHTML = `
    <article class="lesson">
      <h2>📋 Схема и данные</h2>
      <p>Связи между таблицами и всё их содержимое. То же самое доступно с любой страницы —
      кнопкой «Посмотреть БД» вверху.</p>
      <section>
        <h3>Связи между таблицами</h3>
        ${buildErDiagram(schema)}
      </section>
      <section>
        <h3>Данные</h3>
        ${buildTableNav(schema)}
        ${buildAllTablesHtml(schema)}
      </section>
    </article>
  `;
  wireTableNav(main);
}

// ---------- Boot ----------

async function boot() {
  const statusEl = document.getElementById('boot-status');
  try {
    const initSqlJs = window.initSqlJs;
    SQLModule = await initSqlJs({ locateFile: (file) => SQLJS_CDN + file });
    db = new SQLModule.Database();

    const schemaSql = await fetch('schema.sql').then((r) => r.text());
    db.run(schemaSql);
    // Снимок чистой базы: из него создаются одноразовые копии для проверки
    // упражнений, меняющих данные, и к нему возвращает кнопка «Сбросить базу».
    pristineBytes = db.export();

    statusEl.remove();
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('db-toolbar').classList.remove('hidden');

    initDbModal();
    renderSchemaReference();
    renderSidebar();
    selectLesson(LESSONS[0].id);
  } catch (err) {
    statusEl.innerHTML = `<p class="error">Не удалось загрузить SQLite (sql.js): ${escapeHtml(
      err.message || String(err)
    )}. Нужен доступ в интернет (CDN) при первом открытии.</p>`;
  }
}

boot();
