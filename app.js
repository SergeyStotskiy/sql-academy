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
      </section>

      <section class="exercises">
        <h3>Упражнения</h3>
        <div class="exercise-list"></div>
      </section>
    </article>
  `;

  main.querySelector('.run-example').addEventListener('click', () => {
    runAndShow(lesson.example.query, main.querySelector('.example-result'));
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
    <div class="result exercise-result"></div>
    <div class="check-feedback"></div>
  `;

  const textarea = wrap.querySelector('.sql-input');
  const resultEl = wrap.querySelector('.exercise-result');
  const feedbackEl = wrap.querySelector('.check-feedback');
  wrap.querySelector('.solution pre').textContent = ex.solutionQuery;

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
      <div class="result sandbox-result"></div>
    </article>
  `;
  const textarea = main.querySelector('.sql-input');
  const resultEl = main.querySelector('.sandbox-result');
  main.querySelector('.run-btn').addEventListener('click', () => {
    runAndShow(textarea.value, resultEl);
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
