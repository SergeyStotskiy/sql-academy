// Логика приложения: инициализация SQLite в браузере, рендер уроков, выполнение
// запросов, проверка упражнений, прогресс в localStorage.

const SQLJS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/';
const PROGRESS_KEY = 'sql-tutorial-progress-v1';

let db = null;

const state = {
  currentLessonId: null,
  progress: loadProgress(),
};

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

function renderResultTable(result) {
  if (result.columns.length === 0) {
    return '<p class="muted">Запрос выполнен, но не вернул строк.</p>';
  }
  const head = result.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
  const rows = result.values
    .map((row) => {
      const cells = row
        .map((v) => (v === null ? '<td class="null">NULL</td>' : `<td>${escapeHtml(v)}</td>`))
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  const rowCount = `<p class="muted">${result.values.length} строк(и)</p>`;
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>${rowCount}`;
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
  const info = db.exec(`PRAGMA table_info(${table});`);
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
  const tail = clean.slice(fromWord.end);
  const m = tail.match(/^\s+([A-Za-z_]\w*)(\s+(?:AS\s+)?([A-Za-z_]\w*))?/i);
  if (!m) return { ok: false, reason: 'multi-source' };
  const table = m[1];
  let alias = m[3] || null;
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
  const ref = alias || table;
  const source = `${table}${alias ? ' ' + alias : ''}`;
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

// ---------- Schema reference panel ----------

function renderSchemaReference() {
  const tables = runSql(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
  ).values.map((r) => r[0]);

  const blocks = tables.map((table) => {
    const info = db.exec(`PRAGMA table_info(${table});`)[0];
    const cols = info.values.map((row) => {
      const [, name, type] = row;
      return `<li><code>${escapeHtml(name)}</code> <span class="muted">${escapeHtml(type)}</span></li>`;
    });
    return `<div class="schema-table"><strong>${escapeHtml(table)}</strong><ul>${cols.join('')}</ul></div>`;
  });

  document.getElementById('schema-reference').innerHTML = blocks.join('');
}

// ---------- Lesson rendering ----------

function renderSidebar() {
  const nav = document.getElementById('lesson-nav');
  nav.innerHTML = '';
  LESSONS.forEach((lesson) => {
    const { done, total } = lessonProgress(lesson);
    const li = document.createElement('li');
    li.className = 'nav-item' + (lesson.id === state.currentLessonId ? ' active' : '');
    li.innerHTML = `
      <span class="nav-title">${done === total ? '✅ ' : ''}${escapeHtml(lesson.title)}</span>
      <span class="nav-progress">${done}/${total}</span>
    `;
    li.addEventListener('click', () => selectLesson(lesson.id));
    nav.appendChild(li);
  });

  const dataLi = document.createElement('li');
  dataLi.className = 'nav-item' + (state.currentLessonId === 'data' ? ' active' : '');
  dataLi.innerHTML = '<span class="nav-title">📋 Данные таблиц</span>';
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

      <section class="example-block">
        <h3>Пример</h3>
        <pre class="sql-code">${escapeHtml(lesson.example.query)}</pre>
        <p class="muted">${escapeHtml(lesson.example.note)}</p>
        <button class="btn run-example">Выполнить пример</button>
        <div class="result example-result"></div>
        <div class="live-body example-live"></div>
      </section>

      <section class="exercises">
        <h3>Упражнения</h3>
        <div class="exercise-list"></div>
      </section>
    </article>
  `;

  main.querySelector('.run-example').addEventListener('click', () => {
    runAndShow(lesson.example.query, main.querySelector('.example-result'));
    renderLivePreview(lesson.example.query, main.querySelector('.example-live'));
  });

  const list = main.querySelector('.exercise-list');
  lesson.exercises.forEach((ex, idx) => renderExercise(lesson, ex, idx, list));
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
    try {
      userResult = runSql(textarea.value);
      resultEl.innerHTML = renderResultTable(userResult);
    } catch (err) {
      resultEl.innerHTML = renderError(err);
      feedbackEl.innerHTML = '<p class="feedback fail">❌ Запрос не выполнился.</p>';
      return;
    }
    const expectedResult = runSql(ex.solutionQuery);
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

function renderDataBrowser() {
  const main = document.getElementById('main-content');
  const tables = runSql(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
  ).values.map((r) => r[0]);

  main.innerHTML = `
    <article class="lesson">
      <h2>📋 Данные таблиц</h2>
      <p>Все таблицы учебной базы целиком, как они есть — полезно перед тем, как писать запрос:
      посмотреть, какие значения реально встречаются в столбцах, прежде чем гадать.</p>
      <div class="data-tables"></div>
    </article>
  `;

  const container = main.querySelector('.data-tables');
  tables.forEach((table) => {
    const result = runSql(`SELECT * FROM ${table} LIMIT 500;`);
    const block = document.createElement('section');
    block.className = 'example-block';
    block.innerHTML = `<h3>${escapeHtml(table)}</h3>`;
    const resultDiv = document.createElement('div');
    resultDiv.innerHTML = renderResultTable(result);
    block.appendChild(resultDiv);
    container.appendChild(block);
  });
}

// ---------- Boot ----------

async function boot() {
  const statusEl = document.getElementById('boot-status');
  try {
    const initSqlJs = window.initSqlJs;
    const SQL = await initSqlJs({ locateFile: (file) => SQLJS_CDN + file });
    db = new SQL.Database();

    const schemaSql = await fetch('schema.sql').then((r) => r.text());
    db.run(schemaSql);

    statusEl.remove();
    document.getElementById('app').classList.remove('hidden');

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
