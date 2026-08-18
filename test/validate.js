// Прогоняет каждый example.query и exercise.solutionQuery (плюс verifyQuery) из
// lessons.js против schema.sql на настоящей SQLite (sql.js в Node). Это не
// "юнит-тесты" в обычном смысле — ожидаемые результаты упражнений вычисляются на лету
// в браузере (см. app.js), а не хранятся здесь. Задача этого скрипта — ловить
// опечатки/поломки в самом учебном контенте (несуществующий столбец, синтаксическая
// ошибка и т.п.) до того, как их увидит ученик.
//
// Каждый запрос выполняется в СВОЕЙ копии чистой базы: уроки модулей 4–6 меняют данные
// и структуру (INSERT/UPDATE/DELETE/CREATE/DROP), поэтому общая база быстро разъехалась
// бы и давала каскад ложных ошибок.

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const ROOT = path.join(__dirname, '..');

async function main() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(ROOT, 'node_modules', 'sql.js', 'dist', file),
  });

  const schemaSql = fs.readFileSync(path.join(ROOT, 'schema.sql'), 'utf8');

  // Снимок чистой базы, из которого делаются одноразовые копии.
  const seed = new SQL.Database();
  seed.run(schemaSql);
  const pristine = seed.export();
  seed.close();

  const LESSONS = require(path.join(ROOT, 'lessons.js'));

  const LEVELS = ['easy', 'medium', 'hard'];

  let failures = 0;
  let warnings = 0;
  let checked = 0;

  // Выполняет набор запросов в свежей копии базы. Возвращает результат последнего.
  function runIsolated(statements) {
    const db = new SQL.Database(pristine);
    try {
      let last = null;
      for (const sql of statements) {
        const res = db.exec(sql);
        last = res.length ? res[res.length - 1] : { columns: [], values: [] };
      }
      return { ok: true, last };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      db.close();
    }
  }

  function check(label, statements, { expectRows = true } = {}) {
    checked++;
    const res = runIsolated(statements);
    if (!res.ok) {
      failures++;
      console.error(`  ❌ ${label}: ${res.error.message}`);
      return;
    }
    if (expectRows && res.last.values.length === 0) {
      warnings++;
      console.warn(`  ⚠️  ${label}: выполнился, но вернул 0 строк`);
    }
  }

  for (const lesson of LESSONS) {
    console.log(`\n${lesson.title}`);

    if (!lesson.exercises) {
      failures++;
      console.error('  ❌ у урока отсутствует поле exercises');
      continue;
    }

    if (lesson.example) {
      // У DDL/DML-примеров последний оператор может ничего не возвращать — это нормально.
      check('example', [lesson.example.query], { expectRows: false });
    }

    for (const ex of lesson.exercises) {
      if (ex.mutating) {
        if (!ex.verifyQuery) {
          failures++;
          console.error(`  ❌ exercise ${ex.id}: mutating без verifyQuery`);
          continue;
        }
        // Эталон + проверочный запрос в одной изолированной базе, как это делает app.js.
        check(`exercise ${ex.id}`, [ex.solutionQuery, ex.verifyQuery]);
      } else {
        check(`exercise ${ex.id}`, [ex.solutionQuery]);
      }
    }
  }

  // ---- Задания тренажёра ----
  const TASKS = require(path.join(ROOT, 'tasks.js'));
  const seenIds = new Set();
  const counts = { easy: 0, medium: 0, hard: 0 };

  console.log('\n🏋️ Тренажёр');
  for (const task of TASKS) {
    if (seenIds.has(task.id)) {
      failures++;
      console.error(`  ❌ дублирующийся id задания: ${task.id}`);
    }
    seenIds.add(task.id);

    if (!LEVELS.includes(task.level)) {
      failures++;
      console.error(`  ❌ ${task.id}: неизвестный уровень «${task.level}»`);
    } else {
      counts[task.level]++;
    }

    if (!task.hints || !task.hints.length) {
      failures++;
      console.error(`  ❌ ${task.id}: нет подсказок`);
    }
    if (!task.explanation) {
      failures++;
      console.error(`  ❌ ${task.id}: нет разбора решения`);
    }

    // Задание, у которого ответ — пустая таблица, невозможно отличить от
    // «ученик ничего не написал», поэтому пустой результат здесь считается ошибкой.
    const res = runIsolated([task.solutionQuery]);
    checked++;
    if (!res.ok) {
      failures++;
      console.error(`  ❌ ${task.id} (${task.title}): ${res.error.message}`);
    } else if (res.last.values.length === 0) {
      failures++;
      console.error(`  ❌ ${task.id} (${task.title}): решение возвращает 0 строк`);
    }
  }
  console.log(
    `  заданий: ${TASKS.length} (лёгких ${counts.easy}, средних ${counts.medium}, сложных ${counts.hard})`
  );

  console.log(`\nПроверено запросов: ${checked}. Ошибок: ${failures}. Предупреждений: ${warnings}.`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
