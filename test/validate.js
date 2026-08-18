// Прогоняет каждый example.query и exercise.solutionQuery из lessons.js
// против schema.sql на настоящей SQLite (sql.js в Node). Это не "юнит-тесты" в обычном
// смысле — ожидаемые результаты упражнений вычисляются на лету в браузере (см. app.js),
// а не хранятся здесь. Задача этого скрипта — ловить опечатки/поломки в самом учебном
// контенте (несуществующий столбец, синтаксическая ошибка и т.п.) до того, как их
// увидит ученик, плюс предупреждать, если решение неожиданно возвращает 0 строк.

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const ROOT = path.join(__dirname, '..');

async function main() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(ROOT, 'node_modules', 'sql.js', 'dist', file),
  });

  const db = new SQL.Database();
  const schemaSql = fs.readFileSync(path.join(ROOT, 'schema.sql'), 'utf8');
  db.run(schemaSql);

  const LESSONS = require(path.join(ROOT, 'lessons.js'));

  let failures = 0;
  let warnings = 0;
  let checked = 0;

  function tryRun(label, sql) {
    checked++;
    try {
      const res = db.exec(sql);
      const rowCount = res.length ? res[res.length - 1].values.length : 0;
      if (rowCount === 0) {
        warnings++;
        console.warn(`  ⚠️  ${label}: выполнился, но вернул 0 строк`);
      }
    } catch (err) {
      failures++;
      console.error(`  ❌ ${label}: ${err.message}`);
    }
  }

  for (const lesson of LESSONS) {
    console.log(`\n${lesson.title}`);
    tryRun('example', lesson.example.query);
    for (const ex of lesson.exercises) {
      tryRun(`exercise ${ex.id}`, ex.solutionQuery);
      if (ex.orderMatters === undefined) {
        // orderMatters по умолчанию false — это ожидаемо для большинства уроков,
        // явное предупреждение не нужно.
      }
    }
  }

  console.log(`\nПроверено запросов: ${checked}. Ошибок: ${failures}. Предупреждений: ${warnings}.`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
