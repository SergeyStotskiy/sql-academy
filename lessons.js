// Единый источник контента учебника: модули, объяснения, примеры и упражнения.
// Работает и в браузере (window.LESSONS), и в Node (module.exports) —
// используется тестом test/validate.js, который прогоняет все SQL-запросы
// из этого файла против schema.sql и проверяет, что они вообще выполняются.
//
// Поля урока:
//   module        — заголовок модуля для группировки в боковом меню
//   id, title     — идентификатор и заголовок урока
//   intro         — объяснение (HTML)
//   note          — необязательная плашка-предупреждение (например, «в SQLite не поддерживается»)
//   example       — { query, note }: пример, который можно выполнить кнопкой
//   samples       — [{ title, code, note }]: код только для чтения (синтаксис других СУБД)
//   exercises     — список упражнений (может быть пустым у справочных уроков)
//
// Поля упражнения:
//   id            — уникальный id внутри урока
//   prompt        — текст задания
//   solutionQuery — эталонный запрос (выполняется на лету, задаёт "правильный" результат)
//   hint          — необязательная подсказка
//   orderMatters  — если true, порядок строк в ответе учитывается при проверке
//   mutating      — true, если запрос меняет данные (INSERT/UPDATE/DELETE/DDL).
//                   Такие упражнения проверяются в одноразовой копии чистой базы,
//                   и сравнивается не вывод запроса, а состояние таблиц после него.
//   verifyQuery   — обязателен при mutating: SELECT, показывающий итоговое состояние.
//
// Проверка результата (см. app.js) сравнивает только ЗНАЧЕНИЯ строк (не имена столбцов),
// поэтому алиасы столбцов у ученика могут отличаться от solutionQuery.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LESSONS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const M1 = 'Модуль 1. Фундаментальные основы';
  const M2 = 'Модуль 2. Основы выборки I';
  const M3 = 'Модуль 3. Основы выборки II';
  const M4 = 'Модуль 4. Манипулирование данными';
  const M5 = 'Модуль 5. Продвинутый SQL';
  const M6 = 'Модуль 6. Базы данных и таблицы';

  const LESSONS = [
    // ==================== МОДУЛЬ 1 ====================
    {
      module: M1,
      id: 'db-basics',
      title: '1. Базы данных, СУБД и SQL',
      intro: `
        <p><strong>База данных</strong> — это organized набор данных. <strong>СУБД</strong> (система
        управления базами данных, англ. DBMS) — программа, которая эти данные хранит, защищает и
        отдаёт по запросу: PostgreSQL, MySQL, SQLite, Oracle, MS SQL Server. Когда говорят «база
        упала» — почти всегда имеют в виду именно СУБД.</p>

        <p><strong>Типы баз данных.</strong> Их много, но на практике чаще всего встречаются три:</p>
        <ul>
          <li><strong>Реляционные</strong> (SQL): данные лежат в таблицах, связанных между собой.
          Сильная сторона — строгая структура, связи и гарантии целостности. Примеры: PostgreSQL,
          MySQL, SQLite. Именно им посвящён весь этот учебник.</li>
          <li><strong>Key-value</strong> («ключ-значение»): огромный словарь, где по ключу мгновенно
          достаётся значение. Ни таблиц, ни связей, зато очень быстро. Примеры: Redis, Memcached.
          Типичное применение — кеш, сессии пользователей.</li>
          <li><strong>Документоориентированные</strong>: хранят документы (обычно JSON), у каждого
          может быть своя структура. Гибко, но за целостность отвечает приложение, а не база.
          Примеры: MongoDB, CouchDB.</li>
        </ul>

        <p><strong>Структура реляционной базы.</strong> Термины, которые нужно знать, чтобы понимать
        коллег:</p>
        <ul>
          <li><strong>Таблица</strong> (table) — набор данных об одном виде сущностей: клиенты,
          заказы, товары.</li>
          <li><strong>Строка</strong> (row, запись) — один конкретный объект: один клиент.</li>
          <li><strong>Столбец</strong> (column, поле) — одна характеристика: имя, email.</li>
          <li><strong>Первичный ключ</strong> (PRIMARY KEY, PK) — столбец, однозначно определяющий
          строку. Обычно <code>id</code>. Двух строк с одинаковым PK быть не может.</li>
          <li><strong>Внешний ключ</strong> (FOREIGN KEY, FK) — столбец, который ссылается на
          первичный ключ другой таблицы. Так строится связь: <code>orders.customer_id</code>
          указывает, какому клиенту принадлежит заказ.</li>
          <li><strong>Схема</strong> (schema) — описание всех таблиц, столбцов, типов и связей.
          Нажмите «🗄️ Посмотреть БД» вверху — там нарисована схема нашей учебной базы со стрелками
          связей.</li>
        </ul>

        <p><strong>SQL</strong> (Structured Query Language) — язык запросов к реляционным базам.
        Его команды принято делить на группы:</p>
        <ul>
          <li><strong>DQL</strong> — чтение данных: <code>SELECT</code>. Ему посвящены модули 2–3.</li>
          <li><strong>DML</strong> — изменение данных: <code>INSERT</code>, <code>UPDATE</code>,
          <code>DELETE</code> (модуль 4).</li>
          <li><strong>DDL</strong> — изменение структуры: <code>CREATE</code>, <code>ALTER</code>,
          <code>DROP</code> (модуль 6).</li>
          <li><strong>TCL</strong> — транзакции: <code>BEGIN</code>, <code>COMMIT</code>,
          <code>ROLLBACK</code> (модуль 5).</li>
          <li><strong>DCL</strong> — права доступа: <code>GRANT</code>, <code>REVOKE</code>.</li>
        </ul>

        <p>Есть стандарт SQL, но каждая СУБД реализует его чуть по-своему — это называется
        <strong>диалект</strong>. Базовый <code>SELECT</code> одинаков везде, а вот работа с датами,
        строками и хранимыми процедурами отличается. В этом учебнике внутри страницы работает
        <strong>SQLite</strong>; там, где её поведение расходится с MySQL или PostgreSQL, я это
        отдельно отмечаю.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Умение самому посмотреть в базу
        отделяет «на экране ничего не появилось» от «запись не создалась вообще» или «запись
        создалась, но с пустым полем» — то есть превращает расплывчатый баг-репорт в точный. Плюс
        терминология: разработчик скажет «нарушение FK» или «дубль по уникальному индексу», и это
        нужно понимать без переспрашивания.</p>`,
      example: {
        query: 'SELECT * FROM customers LIMIT 5;',
        note: 'Вот так выглядит таблица: строки — клиенты, столбцы — их характеристики.',
      },
      samples: [
        {
          title: 'Так те же данные выглядели бы в key-value базе (Redis)',
          code: `SET customer:1:name "Alice Johnson"
SET customer:1:email "alice@example.com"
GET customer:1:name`,
          note: 'Никаких таблиц и связей — только ключ и значение. Быстро, но «найти всех клиентов из Chicago» так уже не спросишь.',
        },
        {
          title: 'А так — в документоориентированной (MongoDB)',
          code: `{
  "_id": 1,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "orders": [ { "id": 1, "date": "2023-02-01" } ]
}

db.customers.find({ city: "Chicago" })`,
          note: 'Заказы вложены прямо в документ клиента. Структуру каждый документ может иметь свою — база это не проверяет.',
        },
      ],
      exercises: [],
    },

    // ==================== МОДУЛЬ 2 ====================
    {
      module: M2,
      id: 'select-basics',
      title: '2. Базовый синтаксис SELECT',
      intro: `
        <p><code>SELECT</code> — команда «прочитать данные». Она ничего не меняет в базе, а только
        возвращает результат — как если бы вы открыли отчёт и посмотрели на него, не редактируя.
        Минимальный запрос состоит из двух частей:</p>

        <pre class="sql-code">SELECT столбец1, столбец2   -- ЧТО показать
FROM   таблица;             -- ОТКУДА взять</pre>

        <p>Точка с запятой <code>;</code> в конце — конец инструкции. В этом учебнике она не строго
        обязательна, но это общепринятый стандарт: во многих инструментах (DBeaver, консоли psql/mysql)
        без неё запрос либо не выполнится, либо «зависнет», ожидая продолжения ввода.</p>

        <ul>
          <li><code>SELECT *</code> — «звёздочка» значит «все столбцы». Удобно для быстрого просмотра,
          но в реальных задачах и в тестах лучше явно перечислять нужные столбцы — так понятнее, что
          именно вы проверяете, и запрос не «сломается» молча, если в таблицу добавят новый столбец.</li>
          <li><code>SELECT col AS alias</code> — переименовать столбец только в выводе (в самой таблице
          ничего не меняется). Пригодится, когда исходное имя неудобное, или когда после JOIN
          в результате оказываются два столбца с одинаковым именем.</li>
          <li><code>SELECT DISTINCT col</code> — убрать повторяющиеся значения из результата.
          <code>DISTINCT</code> действует на всю строку результата целиком, а не на один столбец.</li>
        </ul>

        <p><strong>Полный порядок частей запроса</strong> — его стоит запомнить сразу, потому что
        менять его нельзя, иначе будет синтаксическая ошибка:</p>

        <pre class="sql-code">SELECT   ...   -- какие столбцы
FROM     ...   -- из каких таблиц
WHERE    ...   -- фильтр строк           (урок 4)
GROUP BY ...   -- группировка            (урок 8)
HAVING   ...   -- фильтр групп           (урок 8)
ORDER BY ...   -- сортировка             (урок 6)
LIMIT    ...   -- сколько строк вернуть  (урок 6)</pre>

        <p>А вот <em>выполняется</em> запрос в другом порядке: сначала <code>FROM</code>, потом
        <code>WHERE</code>, потом <code>GROUP BY</code> и <code>HAVING</code>, потом <code>SELECT</code>,
        и только в конце <code>ORDER BY</code> и <code>LIMIT</code>. Именно поэтому в
        <code>WHERE</code> нельзя пользоваться алиасом из <code>SELECT</code> (его ещё «не
        придумали»), а в <code>ORDER BY</code> — можно.</p>

        <p>Комментарии: <code>-- до конца строки</code> и <code>/* блок */</code>. В комментарий удобно
        временно «выключать» часть условия при отладке запроса.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> SELECT — основной инструмент
        для проверки данных «из-под капота». Например, вы протестировали регистрацию нового
        пользователя через UI и хотите убедиться, что запись реально появилась в базе и с
        правильными полями — вместо того чтобы гадать по интерфейсу, вы выполняете
        <code>SELECT * FROM users WHERE email = '...'</code> и видите факты напрямую.</p>`,
      example: {
        query: 'SELECT name, price FROM products WHERE category_id = 2;',
        note: 'Выводит название и цену товаров из категории с id = 2 (Electronics).',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Выведите столбцы name и email всех клиентов из таблицы customers.',
          solutionQuery: 'SELECT name, email FROM customers;',
        },
        {
          id: 'ex2',
          prompt: 'Выведите список различных (без повторов) городов клиентов, не включая NULL.',
          hint: 'Понадобятся DISTINCT и WHERE city IS NOT NULL.',
          solutionQuery: 'SELECT DISTINCT city FROM customers WHERE city IS NOT NULL;',
        },
        {
          id: 'ex3',
          prompt: 'Выведите name и price каждого товара, переименовав столбец price в cost.',
          hint: 'Используйте price AS cost.',
          solutionQuery: 'SELECT name, price AS cost FROM products;',
        },
      ],
    },
    {
      module: M2,
      id: 'literals-functions',
      title: '3. Литералы и функции',
      intro: `
        <p><strong>Литерал</strong> — это значение, записанное в запросе напрямую, а не взятое из
        таблицы. Звучит абстрактно, но вы уже ими пользовались: <code>50</code> в
        <code>WHERE price &gt; 50</code> — числовой литерал, <code>'Chicago'</code> — строковый.</p>

        <ul>
          <li><strong>Числа:</strong> <code>42</code>, <code>-7</code>, <code>3.14</code>. Без кавычек.</li>
          <li><strong>Строки:</strong> всегда в <em>одинарных</em> кавычках: <code>'Chicago'</code>.
          <strong>Важно:</strong> двойные кавычки в SQL — это не строка, а <em>идентификатор</em>
          (имя столбца или таблицы). Поэтому <code>WHERE city = "Chicago"</code> в одних СУБД
          упадёт с ошибкой, а в других (включая SQLite) поведёт себя непредсказуемо. Всегда
          одинарные.</li>
          <li><strong>Кавычка внутри строки</strong> удваивается: <code>'O''Brien'</code> — это
          строка <code>O'Brien</code>.</li>
          <li><strong>NULL</strong> — особый литерал «значения нет». Не ноль и не пустая строка!
          Подробнее в уроке 4.</li>
          <li><strong>Логические:</strong> <code>TRUE</code> / <code>FALSE</code>. В SQLite они
          хранятся как <code>1</code> и <code>0</code> — отдельного типа boolean нет.</li>
          <li><strong>Даты</strong> в SQLite — это обычные строки формата <code>'2024-01-15'</code>
          (отдельного типа DATE нет, подробнее в уроке 18). Есть готовые
          <code>CURRENT_DATE</code> и <code>CURRENT_TIMESTAMP</code>.</li>
        </ul>

        <p><strong>Функции</strong> преобразуют значения. Их можно вызывать и в <code>SELECT</code>,
        и в <code>WHERE</code>, и подставлять одну в другую. Полезные скалярные функции (работают со
        значением каждой строки по отдельности):</p>
        <ul>
          <li><code>UPPER(s)</code>, <code>LOWER(s)</code> — регистр; <code>LENGTH(s)</code> — длина;
          <code>TRIM(s)</code> — убрать пробелы по краям; <code>SUBSTR(s, откуда, сколько)</code> —
          вырезать подстроку; <code>REPLACE(s, что, на_что)</code> — замена.</li>
          <li><code>ROUND(x, знаков)</code>, <code>ABS(x)</code> — числа.</li>
          <li><code>COALESCE(a, b, ...)</code> — вернуть первое не-NULL значение. Главный способ
          подставить «заглушку» вместо пустого поля.</li>
          <li><code>a || b</code> — склеить строки (в MySQL для этого используют
          <code>CONCAT(a, b)</code>; в SQLite работают оба варианта).</li>
        </ul>

        <p>Отдельно стоит запомнить: функции бывают <strong>скалярные</strong> (одна строка на входе →
        одно значение на выходе, как <code>UPPER</code>) и <strong>агрегатные</strong> (много строк →
        одно значение, как <code>COUNT</code>) — про вторые весь урок 7.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Строковые функции — рабочая
        лошадка при проверке данных: сравнить email без учёта регистра
        (<code>WHERE LOWER(email) = '...'</code>), найти записи с лишними пробелами
        (<code>WHERE name != TRIM(name)</code> — классический источник багов «пользователь не
        находится поиском»), проверить длину поля на соответствие требованиям.</p>`,
      example: {
        query: `SELECT
  name,
  UPPER(name) AS upper_name,
  LENGTH(name) AS name_length,
  COALESCE(city, 'город не указан') AS city_or_default,
  'клиент: ' || name AS greeting
FROM customers
LIMIT 5;`,
        note: 'Литералы и функции в действии: строковый литерал склеивается с полем, а COALESCE подставляет заглушку вместо NULL.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Выведите name каждого клиента и его город, но вместо NULL покажите строку «не указан» (два столбца).',
          hint: 'COALESCE(city, "не указан") — только с одинарными кавычками.',
          solutionQuery: "SELECT name, COALESCE(city, 'не указан') AS city FROM customers;",
        },
        {
          id: 'ex2',
          prompt: 'Выведите название каждого товара в верхнем регистре и его длину в символах (два столбца).',
          solutionQuery: 'SELECT UPPER(name) AS name_upper, LENGTH(name) AS name_length FROM products;',
        },
        {
          id: 'ex3',
          prompt: 'Для каждого товара выведите одну строку вида «название — цена», склеив название, литерал \' — \' и цену.',
          hint: "Оператор склейки — ||, например name || ' — ' || price.",
          solutionQuery: "SELECT name || ' — ' || price AS label FROM products;",
        },
      ],
    },
    {
      module: M2,
      id: 'where-filtering',
      title: '4. Фильтрация: WHERE, IS NULL, BETWEEN, IN',
      intro: `
        <p><code>WHERE</code> идёт сразу после <code>FROM</code> и отбирает только те строки, для
        которых условие истинно. Все остальные строки просто не попадают в результат — в исходной
        таблице ничего не меняется.</p>

        <pre class="sql-code">SELECT name, price
FROM products
WHERE price > 50;   -- оставить только строки, где price больше 50</pre>

        <p>Операторы сравнения: <code>= != &lt; &gt; &lt;= &gt;=</code> (обратите внимание: «не равно» —
        это <code>!=</code> или <code>&lt;&gt;</code>, а не <code>=!</code>).</p>

        <ul>
          <li><code>AND</code> / <code>OR</code> / <code>NOT</code> — комбинируют условия. При
          смешивании AND и OR используйте скобки: <code>WHERE (city = 'A' OR city = 'B') AND price &gt; 10</code> —
          без скобок <code>AND</code> «сильнее» <code>OR</code>, и смысл условия изменится.</li>
          <li><code>BETWEEN x AND y</code> — включает обе границы (то же, что
          <code>col &gt;= x AND col &lt;= y</code>). Частая ошибка в тестировании — забыть, что границы
          входят, и неверно посчитать ожидаемый результат.</li>
          <li><code>IN (a, b, c)</code> — короткая запись «равно одному из списка» вместо цепочки
          <code>OR</code>. Есть и <code>NOT IN</code>.</li>
          <li><code>IS NULL</code> / <code>IS NOT NULL</code> — проверка на отсутствие значения.</li>
        </ul>

        <p><strong>Главная ловушка новичков — NULL.</strong> <code>NULL</code> означает не «ноль» и не
        «пустая строка», а «значение неизвестно». Поэтому <code>WHERE city = NULL</code>
        <em>никогда</em> ничего не найдёт: сравнение с неизвестным даёт не «истину» и не «ложь», а
        «неизвестно», и строка в результат не попадает. Нужно именно <code>IS NULL</code>.</p>

        <p>Это же правило бьёт и в неожиданных местах: <code>WHERE city != 'Chicago'</code> не вернёт
        клиентов с <code>NULL</code> в городе, хотя «не Chicago» — вроде бы про них тоже правда.
        Если такие строки нужны, условие пишут явно:
        <code>WHERE city != 'Chicago' OR city IS NULL</code>.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> WHERE — то, чем вы будете
        пользоваться каждый день, чтобы найти «свои» тестовые данные среди тысяч чужих строк:
        конкретного пользователя по email, заказы за вчерашний день, записи с определённым статусом.
        А поведение NULL — источник целого класса реальных багов: «в отчёт не попали клиенты без
        города», «фильтр “не отменённые” потерял заказы без статуса».</p>`,
      example: {
        query: 'SELECT name, price FROM products WHERE price BETWEEN 10 AND 30 ORDER BY price;',
        note: 'Товары с ценой от 10 до 30 включительно.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Найдите все товары дороже 50 (name, price).',
          solutionQuery: 'SELECT name, price FROM products WHERE price > 50;',
        },
        {
          id: 'ex2',
          prompt: "Найдите клиентов (name, city) из городов 'Chicago' или 'Houston'.",
          hint: 'Можно через OR или через IN.',
          solutionQuery: "SELECT name, city FROM customers WHERE city IN ('Chicago', 'Houston');",
        },
        {
          id: 'ex3',
          prompt: 'Найдите клиентов (name), у которых не указан город.',
          hint: 'city IS NULL, а не city = NULL.',
          solutionQuery: 'SELECT name FROM customers WHERE city IS NULL;',
        },
        {
          id: 'ex4',
          prompt: 'Найдите заказы (id, status), у которых статус не completed. Заказы без статуса в базе отсутствуют, так что достаточно одного условия.',
          solutionQuery: "SELECT id, status FROM orders WHERE status != 'completed';",
        },
      ],
    },
    {
      module: M2,
      id: 'like-regexp',
      title: '5. Поиск по шаблону: LIKE, GLOB, регулярные выражения',
      intro: `
        <p><code>LIKE</code> ищет по шаблону, когда точного значения вы не знаете:</p>
        <ul>
          <li><code>%</code> — любое количество любых символов (в том числе ноль).</li>
          <li><code>_</code> — ровно один любой символ.</li>
        </ul>

        <pre class="sql-code">WHERE name LIKE 'S%'      -- начинается на S
WHERE name LIKE '%set'     -- заканчивается на set
WHERE name LIKE '%Cable%'  -- содержит Cable
WHERE name LIKE '_at%'     -- второй и третий символы — 'at'</pre>

        <p><strong>Регистр.</strong> В SQLite <code>LIKE</code> не различает регистр для латиницы
        (<code>'s%'</code> найдёт и «SQL for Beginners»), но <em>различает</em> для кириллицы. В MySQL
        чувствительность зависит от настройки сравнения (collation), в PostgreSQL <code>LIKE</code>
        регистрозависим, а для игнорирования регистра есть <code>ILIKE</code>. Вывод для
        тестировщика: не полагайтесь на регистр «по умолчанию» — если он важен, приводите обе
        стороны к одному виду: <code>WHERE LOWER(name) LIKE '%cable%'</code>.</p>

        <p><strong>Как искать сам символ %?</strong> Через <code>ESCAPE</code>:
        <code>WHERE code LIKE '100!%' ESCAPE '!'</code> найдёт строку «100%». Без этого <code>%</code>
        будет понят как шаблон — классический баг в поиске по каталогу.</p>

        <p><code>GLOB</code> — второй оператор SQLite, работает как маски файлов и <strong>всегда</strong>
        учитывает регистр: <code>*</code> — любое количество символов, <code>?</code> — один символ,
        <code>[abc]</code> — один символ из набора, <code>[0-9]</code> — из диапазона.</p>

        <pre class="sql-code">WHERE name GLOB 'S*'        -- начинается ровно на большую S
WHERE name GLOB '*[0-9]*'   -- где-то внутри есть цифра</pre>

        <p><strong>Регулярные выражения</strong> — самый мощный вариант поиска по шаблону, но
        встроенного оператора <code>REGEXP</code> в SQLite <em>нет</em> (его добавляет приложение).
        В MySQL и PostgreSQL он есть — синтаксис показан ниже в блоке «Как это выглядит в коде».
        Здесь же для сложных шаблонов используйте <code>GLOB</code>.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Поиск по шаблону нужен, чтобы
        находить свои тестовые данные (<code>WHERE email LIKE 'test%@example.com'</code>) и чтобы
        проверять формат данных: найти телефоны с буквами, имена с цифрами, адреса с двойными
        пробелами. Заодно это проверка того, как поиск в приложении обрабатывает
        служебные символы <code>%</code> и <code>_</code>, введённые пользователем.</p>`,
      example: {
        query: `SELECT name FROM products WHERE name LIKE '%Set%';`,
        note: 'Товары, в названии которых встречается «Set».',
      },
      samples: [
        {
          title: 'Регулярные выражения в MySQL и PostgreSQL (в SQLite не работают)',
          code: `-- MySQL
SELECT name FROM products WHERE name REGEXP '^[A-Z][a-z]+$';
SELECT name FROM products WHERE name RLIKE 'Cable|Mouse';

-- PostgreSQL: ~ учитывает регистр, ~* игнорирует
SELECT name FROM products WHERE name ~ '^S';
SELECT email FROM customers WHERE email !~* '@example\\.com$';`,
          note: 'В SQLite оператора REGEXP нет — вместо него в этом учебнике используйте GLOB.',
        },
      ],
      exercises: [
        {
          id: 'ex1',
          prompt: "Найдите товары (name), название которых начинается на 'B'.",
          hint: "LIKE 'B%'",
          solutionQuery: "SELECT name FROM products WHERE name LIKE 'B%';",
        },
        {
          id: 'ex2',
          prompt: "Найдите клиентов (name, email), у которых в email встречается 'example'.",
          solutionQuery: "SELECT name, email FROM customers WHERE email LIKE '%example%';",
        },
        {
          id: 'ex3',
          prompt: 'С помощью GLOB найдите товары (name), в названии которых есть хотя бы одна цифра.',
          hint: "Шаблон '*[0-9]*'",
          solutionQuery: "SELECT name FROM products WHERE name GLOB '*[0-9]*';",
        },
      ],
    },
    {
      module: M2,
      id: 'order-limit',
      title: '6. Сортировка и ограничение: ORDER BY, LIMIT',
      intro: `
        <p>Важно понимать: без <code>ORDER BY</code> база данных <strong>не гарантирует</strong>
        никакого конкретного порядка строк — она может вернуть их в любом порядке, даже если сегодня
        они выглядят «по порядку id». Если порядок важен (а для отчётов, топ-N списков и UI почти
        всегда важен) — его нужно задавать явно.</p>

        <pre class="sql-code">SELECT name, price
FROM products
ORDER BY price DESC   -- от большего к меньшему; ASC (по умолчанию) — от меньшего к большему
LIMIT 5;               -- оставить только первые 5 строк результата</pre>

        <ul>
          <li><code>ORDER BY col1, col2</code> — сортировка по нескольким столбцам: сначала по col1, а
          строки с одинаковым col1 — по col2. Направление задаётся каждому отдельно:
          <code>ORDER BY category_id ASC, price DESC</code>.</li>
          <li>В <code>ORDER BY</code> можно ссылаться на алиас из <code>SELECT</code>
          (<code>ORDER BY total DESC</code>) — в отличие от <code>WHERE</code>.</li>
          <li><code>LIMIT n</code> — вернуть не больше n строк. Полезно и для «топ-5», и просто чтобы
          не вывалить миллион строк на экран, пока вы «прощупываете» незнакомую таблицу.</li>
          <li><code>OFFSET k</code> — пропустить первые k строк. Вместе с LIMIT это постраничная
          выдача: «страница 2 по 10 записей» — это <code>LIMIT 10 OFFSET 10</code>.</li>
        </ul>

        <p><strong>Тонкость про NULL:</strong> при сортировке NULL-значения собираются вместе — в
        SQLite и PostgreSQL по возрастанию они идут первыми, в MySQL тоже первыми, но при
        <code>DESC</code> — последними. Если порядок NULL важен, в SQLite/PostgreSQL есть
        <code>NULLS FIRST</code> / <code>NULLS LAST</code>.</p>

        <p>В этом уроке порядок строк в ответе имеет значение — автопроверка сравнивает вывод
        построчно, а не как «набор» строк, как в остальных уроках.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Если вы проверяете сортировку
        на UI («список должен быть отсортирован по дате, сначала новые») — ORDER BY даёт вам
        «эталонный» порядок из базы, чтобы сравнить его с тем, что реально показывает интерфейс.
        А LIMIT/OFFSET — это ровно то, что делает пагинация, и её любимый баг — запись, которая
        пропадает или дублируется между страницами из-за неустойчивой сортировки.</p>`,
      example: {
        query: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;',
        note: '5 самых дорогих товаров, от дорогого к дешёвому.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Выведите 3 самых дешёвых товара (name, price) — от дешёвого к дорогому.',
          orderMatters: true,
          solutionQuery: 'SELECT name, price FROM products ORDER BY price ASC LIMIT 3;',
        },
        {
          id: 'ex2',
          prompt: 'Выведите всех клиентов (name, signup_date), отсортированных по дате регистрации от самой поздней к самой ранней.',
          orderMatters: true,
          solutionQuery: 'SELECT name, signup_date FROM customers ORDER BY signup_date DESC;',
        },
        {
          id: 'ex3',
          prompt: 'Пропустив самый дорогой товар, выведите следующие 2 по цене (name, price), от дорогого к дешёвому.',
          hint: 'ORDER BY price DESC LIMIT 2 OFFSET 1.',
          orderMatters: true,
          solutionQuery: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 2 OFFSET 1;',
        },
      ],
    },
    {
      module: M2,
      id: 'aggregates',
      title: '7. Агрегатные функции: COUNT, SUM, AVG, MIN, MAX',
      intro: `
        <p>До сих пор каждый запрос возвращал по одной строке результата на каждую строку таблицы.
        Агрегатные функции — это другое: они берут <strong>набор</strong> строк и «сворачивают» его в
        <strong>одно</strong> значение.</p>

        <pre class="sql-code">SELECT COUNT(*) FROM products;   -- одно число: сколько всего строк в таблице</pre>

        <ul>
          <li><code>COUNT(*)</code> — количество строк.</li>
          <li><code>COUNT(col)</code> — количество строк, где <code>col</code> <strong>не NULL</strong>.
          Это не то же самое, что <code>COUNT(*)</code>! В нашей таблице
          <code>COUNT(*)</code> по customers даст 12, а <code>COUNT(city)</code> — 10, потому что у
          двух клиентов город не заполнен. Разница между этими двумя числами — быстрый способ
          посчитать пропуски в столбце.</li>
          <li><code>COUNT(DISTINCT col)</code> — количество различных значений.</li>
          <li><code>SUM(col)</code> — сумма, <code>AVG(col)</code> — среднее. Обе игнорируют NULL
          (важно: <code>AVG</code> делит на количество <em>не-NULL</em> значений, а не на все строки).</li>
          <li><code>MIN(col)</code> / <code>MAX(col)</code> — минимум и максимум. Работают не только
          с числами, но и со строками и датами.</li>
          <li><code>GROUP_CONCAT(col, ', ')</code> — склеить значения всех строк в одну строку через
          разделитель (в MySQL — то же имя, в PostgreSQL — <code>STRING_AGG</code>).</li>
        </ul>

        <p><strong>Частая ловушка:</strong> нельзя в одном SELECT просто смешать агрегатную функцию с
        обычным столбцом без группировки — <code>SELECT name, COUNT(*) FROM products</code> либо даст
        ошибку, либо (в SQLite и старом MySQL) выдаст случайное имя из таблицы рядом с общим
        количеством, что почти всегда не то, что вы имели в виду. Как правильно считать агрегаты
        «по группам» — в следующем уроке.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Быстрая проверка на
        «здравый смысл» после теста: «в таблице заказов должно быть ровно 0 строк со статусом
        error» — <code>SELECT COUNT(*) FROM orders WHERE status = 'error'</code>, и сразу видно,
        прошёл тест или нет. Пара <code>COUNT(*)</code> vs <code>COUNT(col)</code> — готовый тест на
        полноту данных после миграции или импорта.</p>`,
      example: {
        query: `SELECT
  COUNT(*) AS всего_клиентов,
  COUNT(city) AS с_городом,
  COUNT(DISTINCT city) AS разных_городов
FROM customers;`,
        note: 'COUNT(*) считает все строки, COUNT(city) — только с заполненным городом. Разница = число пропусков.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Посчитайте общее количество заказов в таблице orders.',
          solutionQuery: 'SELECT COUNT(*) FROM orders;',
        },
        {
          id: 'ex2',
          prompt: 'Найдите самую высокую и самую низкую цену товара (два столбца).',
          solutionQuery: 'SELECT MAX(price) AS max_price, MIN(price) AS min_price FROM products;',
        },
        {
          id: 'ex3',
          prompt: 'Посчитайте суммарное количество проданных единиц товара (SUM по quantity в order_items).',
          solutionQuery: 'SELECT SUM(quantity) FROM order_items;',
        },
        {
          id: 'ex4',
          prompt: 'Посчитайте среднюю цену товара по таблице products.',
          solutionQuery: 'SELECT AVG(price) FROM products;',
        },
      ],
    },
    {
      module: M2,
      id: 'group-by',
      title: '8. Группировка: GROUP BY и HAVING',
      intro: `
        <p><code>GROUP BY col</code> объединяет строки с одинаковым значением <code>col</code> в
        одну группу — и если рядом стоит агрегатная функция (<code>COUNT</code>, <code>SUM</code>,
        ...), она считается отдельно <strong>для каждой группы</strong>, а не по всей таблице сразу.</p>

        <pre class="sql-code">SELECT category_id, COUNT(*) AS cnt
FROM products
GROUP BY category_id;
-- результат: одна строка на каждую category_id, cnt = сколько товаров в этой категории</pre>

        <p><strong>Ключевое правило:</strong> в <code>SELECT</code> рядом с <code>GROUP BY</code>
        можно упоминать только те столбцы, которые либо перечислены в <code>GROUP BY</code>, либо
        обёрнуты в агрегатную функцию. PostgreSQL и современный MySQL за нарушение выдают ошибку,
        SQLite — молча берёт произвольное значение из группы. Второе опаснее: запрос «работает», но
        данные в отчёте недостоверные.</p>

        <p>Группировать можно и по нескольким столбцам: <code>GROUP BY category_id, status</code> —
        тогда группа это каждая уникальная <em>пара</em> значений.</p>

        <p><code>HAVING условие</code> — фильтр, но, в отличие от <code>WHERE</code>, он применяется
        <strong>после</strong> группировки, к уже посчитанным агрегатам. Поэтому в HAVING можно писать
        <code>HAVING COUNT(*) &gt; 5</code>, а в WHERE — нельзя (агрегаты там ещё не посчитаны).</p>

        <pre class="sql-code">SELECT status, COUNT(*) AS cnt
FROM orders
WHERE order_date >= '2023-06-01'   -- 1) сначала отбираем строки
GROUP BY status                     -- 2) потом группируем
HAVING COUNT(*) > 2                 -- 3) потом фильтруем группы
ORDER BY cnt DESC;                  -- 4) и сортируем результат</pre>

        <p>Практическое следствие: если условие можно поставить в <code>WHERE</code> — ставьте туда, а
        не в <code>HAVING</code>. Так база отбросит лишние строки <em>до</em> группировки, и запрос
        будет быстрее.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Отличный инструмент для поиска
        аномалий в данных: «показать все email, которые встречаются в таблице users больше одного
        раза» — это ровно <code>GROUP BY email HAVING COUNT(*) &gt; 1</code>, классический способ
        найти дубликаты после импорта или проверить, что уникальность реально работает.</p>`,
      example: {
        query: 'SELECT category_id, COUNT(*) AS cnt, AVG(price) AS avg_price FROM products GROUP BY category_id;',
        note: 'Количество товаров и средняя цена в каждой категории.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Для каждого customer_id посчитайте количество его заказов (customer_id, orders_count).',
          solutionQuery: 'SELECT customer_id, COUNT(*) AS orders_count FROM orders GROUP BY customer_id;',
        },
        {
          id: 'ex2',
          prompt: 'Для каждой категории найдите среднюю цену товара, но оставьте только категории со средней ценой больше 20 (category_id, avg_price).',
          hint: 'Фильтр по агрегату — это HAVING, не WHERE.',
          solutionQuery: 'SELECT category_id, AVG(price) AS avg_price FROM products GROUP BY category_id HAVING AVG(price) > 20;',
        },
        {
          id: 'ex3',
          prompt: 'Для каждого статуса заказа (status) посчитайте количество заказов.',
          solutionQuery: 'SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status;',
        },
        {
          id: 'ex4',
          prompt: 'Найдите customer_id клиентов, у которых больше одного заказа, вместе с количеством заказов.',
          solutionQuery: 'SELECT customer_id, COUNT(*) AS cnt FROM orders GROUP BY customer_id HAVING COUNT(*) > 1;',
        },
      ],
    },

    // ==================== МОДУЛЬ 3 ====================
    {
      module: M3,
      id: 'joins-inner',
      title: '9. Многотабличные запросы: INNER JOIN',
      intro: `
        <p>Реальные базы почти никогда не хранят всё в одной таблице — данные разбиты на связанные
        таблицы (это называется <strong>нормализация</strong>), чтобы не дублировать информацию.
        Имя клиента хранится один раз в <code>customers</code>, а не повторяется в каждой строке
        <code>orders</code>. Связь идёт через id: у каждого заказа есть <code>customer_id</code> —
        внешний ключ, ссылка на <code>customers.id</code>.</p>

        <p><code>JOIN</code> (полное имя — <code>INNER JOIN</code>) склеивает строки двух таблиц там,
        где условие в <code>ON</code> совпадает:</p>

        <pre class="sql-code">SELECT o.id, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id;
-- o и c — алиасы таблиц, чтобы не писать orders.customer_id = customers.id полностью</pre>

        <p>Алиасы таблиц не обязательны, но с ними запрос читается заметно легче, а при одинаковых
        именах столбцов в разных таблицах (у нас <code>name</code> есть и в <code>products</code>, и в
        <code>categories</code>) они просто необходимы, чтобы указать, чей столбец имеется в виду.</p>

        <p><strong>Главное свойство INNER JOIN:</strong> в результат попадают только строки, для
        которых пара <strong>нашлась</strong> в обеих таблицах. Клиент без заказов в
        <code>orders JOIN customers</code> не появится вообще. Как искать именно таких — в следующем
        уроке про OUTER JOIN.</p>

        <p><strong>Вторая важная вещь:</strong> если одной строке слева соответствует
        <em>несколько</em> строк справа (у заказа несколько товаров), JOIN «размножит» строку — в
        результате будет несколько строк с одинаковым order_id, по одной на каждый товар. Это не баг,
        а ожидаемое поведение, но именно оно приводит к случайно задвоенным
        <code>SUM</code>/<code>COUNT</code>, если агрегировать после JOIN не подумав.</p>

        <p>Соединять можно сколько угодно таблиц подряд — каждый следующий <code>JOIN</code> со своим
        <code>ON</code>. Ещё пара форм записи, которые вам встретятся:</p>
        <ul>
          <li><code>JOIN ... USING (id)</code> — сокращение, когда столбцы связи называются одинаково.</li>
          <li><code>CROSS JOIN</code> — соединение «каждый с каждым», без условия. Обычно появляется
          случайно (забыли <code>ON</code>) и даёт лавину строк.</li>
          <li>Старый стиль <code>FROM orders, customers WHERE orders.customer_id = customers.id</code>
          делает то же, что INNER JOIN, но условие связи смешано с фильтрами — так писать не стоит,
          хотя в старом коде вы это встретите.</li>
        </ul>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> JOIN — то, без чего почти
        невозможно проверить сквозной сценарий: «после оформления заказа должна появиться строка в
        orders, привязанная к правильному клиенту, и правильные строки в order_items». Плюс
        JOIN мгновенно вскрывает битые связи в данных.</p>`,
      example: {
        query: 'SELECT o.id, c.name, o.order_date FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.id LIMIT 5;',
        note: 'Первые 5 заказов вместе с именем клиента.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Выведите название товара и название его категории для каждого товара (JOIN products и categories).',
          solutionQuery: 'SELECT p.name AS product_name, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id;',
        },
        {
          id: 'ex2',
          prompt: 'Соединив order_items, orders, customers и products, выведите order_id, имя клиента и название товара для каждой позиции заказа.',
          solutionQuery: `SELECT oi.order_id, cu.name AS customer_name, p.name AS product_name
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN customers cu ON o.customer_id = cu.id
JOIN products p ON oi.product_id = p.id;`,
        },
        {
          id: 'ex3',
          prompt: 'Выведите название товара и количество (quantity), соединив order_items и products, только для позиций с quantity больше 2.',
          solutionQuery: 'SELECT p.name, oi.quantity FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.quantity > 2;',
        },
      ],
    },
    {
      module: M3,
      id: 'joins-outer',
      title: '10. OUTER JOIN: LEFT, RIGHT, FULL',
      intro: `
        <p><code>INNER JOIN</code> выбрасывает строки без пары. <code>OUTER JOIN</code> их сохраняет,
        подставляя <code>NULL</code> вместо отсутствующих значений другой таблицы. Именно поэтому
        OUTER JOIN — главный инструмент для вопросов «а у кого <em>нет</em>...».</p>

        <ul>
          <li><code>LEFT JOIN</code> (полностью <code>LEFT OUTER JOIN</code>) — берём <strong>все</strong>
          строки левой таблицы; если пары справа нет, столбцы правой таблицы будут NULL.</li>
          <li><code>RIGHT JOIN</code> — то же наоборот: все строки правой таблицы.
          <code>A RIGHT JOIN B</code> — это то же самое, что <code>B LEFT JOIN A</code>, поэтому на
          практике почти всегда пишут LEFT.</li>
          <li><code>FULL OUTER JOIN</code> — все строки обеих таблиц: и без пары слева, и без пары
          справа.</li>
        </ul>

        <pre class="sql-code">SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
-- клиент без заказов тоже попадёт в результат, но order_id у него будет NULL</pre>

        <p><strong>Приём «найти тех, у кого ничего нет»:</strong> сделать LEFT JOIN и оставить строки,
        где ключ правой таблицы оказался NULL — раз пары не нашлось, значит записей нет:</p>

        <pre class="sql-code">SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;   -- пары не нашлось = заказов нет</pre>

        <p><strong>Ловушка:</strong> условие для правой таблицы в LEFT JOIN нужно ставить в
        <code>ON</code>, а не в <code>WHERE</code>. Если написать
        <code>LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'completed'</code>, то
        строки клиентов без заказов (где <code>o.status</code> равен NULL) отфильтруются, и LEFT JOIN
        по факту превратится в INNER JOIN. Правильно: <code>ON o.customer_id = c.id AND o.status = 'completed'</code>.</p>

        <p>Поддержка: <code>LEFT JOIN</code> есть везде. <code>RIGHT</code> и
        <code>FULL OUTER JOIN</code> работают в PostgreSQL, MS SQL, Oracle, MySQL 8 (FULL — через
        обходной путь) и в SQLite начиная с версии 3.39 — то есть и здесь тоже.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Это способ находить «висящие»
        данные, которые чаще всего и есть баг: заказы без позиций, платежи без заказа, пользователи
        без профиля, товары без категории. Такие запросы отлично живут в регрессионном чек-листе:
        результат всегда должен быть пустым.</p>`,
      example: {
        query: `SELECT c.name, COUNT(o.id) AS orders_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY orders_count, c.name;`,
        note: 'Все клиенты с числом заказов. У клиента без заказов COUNT(o.id) даст 0 — COUNT не считает NULL.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Найдите клиентов (name), у которых ещё нет ни одного заказа, с помощью LEFT JOIN.',
          hint: 'LEFT JOIN orders ... WHERE orders.id IS NULL.',
          solutionQuery: 'SELECT cu.name FROM customers cu LEFT JOIN orders o ON o.customer_id = cu.id WHERE o.id IS NULL;',
        },
        {
          id: 'ex2',
          prompt: 'С помощью LEFT JOIN найдите товары (name), которые ни разу не встречаются в order_items.',
          hint: 'LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL.',
          solutionQuery: 'SELECT p.name FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL;',
        },
        {
          id: 'ex3',
          prompt: 'Выведите название каждого товара и количество раз, сколько он встречается в order_items (name, cnt) — товары без продаж тоже должны быть, с нулём.',
          hint: 'LEFT JOIN + COUNT(oi.id) + GROUP BY.',
          solutionQuery: `SELECT p.name, COUNT(oi.id) AS cnt
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY p.id, p.name;`,
        },
      ],
    },
    {
      module: M3,
      id: 'subqueries',
      title: '11. Подзапросы и их виды',
      intro: `
        <p>Подзапрос (subquery) — это обычный <code>SELECT</code>, вложенный внутрь другого запроса и
        взятый в скобки. Сначала выполняется внутренний запрос, а его результат использует внешний.
        Виды подзапросов различают по тому, что именно они возвращают.</p>

        <p><strong>1. Одна строка, один столбец (скалярный).</strong> Возвращает единственное
        значение, поэтому его можно поставить туда, где ожидается значение: после <code>=</code>,
        <code>&gt;</code>, или прямо в список <code>SELECT</code>.</p>
        <pre class="sql-code">SELECT name, price FROM products
WHERE price > (SELECT AVG(price) FROM products);</pre>
        <p>Если такой подзапрос неожиданно вернёт несколько строк, запрос упадёт с ошибкой — в
        PostgreSQL и MySQL явно, а SQLite молча возьмёт первую строку.</p>

        <p><strong>2. Несколько строк, один столбец.</strong> Это список значений — используется с
        <code>IN</code> / <code>NOT IN</code>:</p>
        <pre class="sql-code">SELECT name FROM customers
WHERE id IN (SELECT customer_id FROM orders);   -- те, кто хоть раз заказывал</pre>
        <p><strong>Важная ловушка:</strong> если подзапрос в <code>NOT IN</code> вернёт хотя бы один
        <code>NULL</code>, всё условие перестанет находить <em>что-либо</em> — из-за той же логики
        «сравнение с неизвестным даёт неизвестно». Поэтому для «нет среди» надёжнее
        <code>NOT EXISTS</code> или <code>LEFT JOIN ... IS NULL</code>.</p>

        <p><strong>3. Многостолбцовый.</strong> Сравнивается сразу набор столбцов — удобно, когда
        «совпадение» определяется парой значений:</p>
        <pre class="sql-code">SELECT * FROM order_items
WHERE (order_id, product_id) IN (
  SELECT order_id, product_id FROM order_items WHERE quantity > 2
);</pre>

        <p><strong>4. Коррелированный.</strong> Подзапрос ссылается на столбец внешнего запроса,
        поэтому вычисляется заново для каждой строки. Обычно используется с
        <code>EXISTS</code> — оператором, который отвечает только «нашлось хоть что-то или нет»:</p>
        <pre class="sql-code">SELECT c.name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id   -- ссылка на c из внешнего запроса
);</pre>
        <p><code>EXISTS</code> не важно, что именно выбирает подзапрос (пишут <code>SELECT 1</code>) —
        важен лишь факт наличия строк. И он не боится NULL, в отличие от <code>NOT IN</code>.
        Обратная форма — <code>NOT EXISTS</code>, то есть «ни одной такой строки нет».</p>

        <p>Ещё подзапрос может стоять в <code>FROM</code> — тогда он работает как временная таблица и
        ему нужен алиас: <code>FROM (SELECT ...) AS t</code>. Читаемее то же самое пишется через
        <code>WITH</code> — следующий урок.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Подзапросы отвечают на вопросы
        «есть ли в таблице A записи, которых не должно быть по данным таблицы B»: заказы на
        удалённые товары, платежи без заказа, ссылки на несуществующих пользователей. Это готовые
        проверки целостности данных, которые полезно прогонять после миграций.</p>`,
      example: {
        query: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);',
        note: 'Товары дороже средней цены. Скалярный подзапрос считает среднее один раз.',
      },
      samples: [
        {
          title: 'ANY / ALL — есть в MySQL и PostgreSQL, но не в SQLite',
          code: `-- дороже КАЖДОГО товара из категории 1
SELECT name FROM products
WHERE price > ALL (SELECT price FROM products WHERE category_id = 1);

-- дороже ХОТЯ БЫ ОДНОГО товара из категории 1
SELECT name FROM products
WHERE price > ANY (SELECT price FROM products WHERE category_id = 1);`,
          note: 'В SQLite это же выражается через агрегаты: > ALL (...) — то же, что > (SELECT MAX(...)), а > ANY (...) — что > (SELECT MIN(...)).',
        },
      ],
      exercises: [
        {
          id: 'ex1',
          prompt: 'Найдите клиентов (name), которые сделали хотя бы один заказ, с помощью подзапроса с IN.',
          solutionQuery: 'SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders);',
        },
        {
          id: 'ex2',
          prompt: 'Найдите товары (name), которые никогда не были куплены (ни разу не встречаются в order_items).',
          hint: 'NOT IN (SELECT product_id FROM order_items) — или, надёжнее, NOT EXISTS.',
          solutionQuery: 'SELECT name FROM products WHERE id NOT IN (SELECT product_id FROM order_items);',
        },
        {
          id: 'ex3',
          prompt: 'Для каждого заказа выведите его id и сумму заказа (SUM(quantity*unit_price) по его order_items), используя скалярный подзапрос в SELECT.',
          solutionQuery: `SELECT o.id,
  (SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id) AS order_total
FROM orders o;`,
        },
        {
          id: 'ex4',
          prompt: 'С помощью коррелированного NOT EXISTS найдите клиентов (name) без заказов.',
          hint: 'WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)',
          solutionQuery: 'SELECT c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);',
        },
      ],
    },
    {
      module: M3,
      id: 'cte',
      title: '12. Обобщённое табличное выражение: WITH (CTE)',
      intro: `
        <p>Когда запрос усложняется — несколько уровней подзапросов, повторяющиеся куски логики —
        читать его становится тяжело. <code>WITH ... AS (...)</code> (Common Table Expression, CTE)
        решает это: даёт временному запросу имя, и дальше в основном запросе можно ссылаться на это
        имя как на обычную таблицу.</p>

        <pre class="sql-code">WITH order_totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
)
SELECT * FROM order_totals WHERE total > 100;</pre>

        <p>По сути CTE делает то же, что подзапрос в <code>FROM</code>, но читается сверху вниз, как
        «сначала посчитай это, назови это так, теперь используй» — гораздо ближе к тому, как человек
        рассуждает о задаче. Дополнительные плюсы:</p>
        <ul>
          <li>Несколько CTE перечисляются через запятую, и следующий может ссылаться на предыдущий:
          <code>WITH a AS (...), b AS (SELECT ... FROM a) SELECT ... FROM b;</code></li>
          <li>На один CTE можно сослаться дважды в одном запросе (например, чтобы соединить набор с
          самим собой) — с подзапросом пришлось бы дублировать код.</li>
          <li>Запрос удобно отлаживать по шагам: выполнить только внутренний SELECT и посмотреть, что
          он даёт, прежде чем строить остальное.</li>
        </ul>

        <p><strong>Рекурсивные CTE</strong> (<code>WITH RECURSIVE</code>) умеют обходить иерархии —
        дерево категорий, структуру подчинённых, цепочку «ответ на ответ» — и генерировать
        последовательности. Механика такая: первая часть до <code>UNION ALL</code> — стартовая
        строка, вторая — правило получения следующей из уже полученных, и так пока она возвращает
        строки:</p>

        <pre class="sql-code">WITH RECURSIVE numbers(n) AS (
  SELECT 1                                  -- старт
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 10    -- шаг, пока условие верно
)
SELECT n FROM numbers;</pre>

        <p>Обязательно следите за условием остановки: без него рекурсия будет бесконечной.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Когда проверка требует
        нескольких шагов расчёта («сначала сумма по каждому заказу, потом заказы дороже среднего»),
        CTE позволяет писать и отлаживать запрос по частям, а не городить подзапрос в подзапросе.
        А рекурсивный CTE — способ быстро сгенерировать тестовые данные или проверить, что в
        иерархии не появилось циклов.</p>`,
      example: {
        query: `WITH order_totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
)
SELECT * FROM order_totals ORDER BY total DESC LIMIT 5;`,
        note: '5 заказов с самой большой суммой.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'С помощью CTE посчитайте сумму каждого заказа (order_id, total) и выведите только заказы с суммой больше 50.',
          solutionQuery: `WITH totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
)
SELECT order_id, total FROM totals WHERE total > 50;`,
        },
        {
          id: 'ex2',
          prompt: 'С помощью CTE посчитайте количество заказов каждого клиента (customer_id, orders_count) и выведите только клиентов с более чем 1 заказом.',
          solutionQuery: `WITH cust_orders AS (
  SELECT customer_id, COUNT(*) AS orders_count
  FROM orders
  GROUP BY customer_id
)
SELECT customer_id, orders_count FROM cust_orders WHERE orders_count > 1;`,
        },
        {
          id: 'ex3',
          prompt: 'С помощью WITH RECURSIVE сгенерируйте числа от 1 до 5 (один столбец, 5 строк).',
          hint: 'Старт SELECT 1, шаг SELECT n+1 ... WHERE n < 5.',
          orderMatters: true,
          solutionQuery: `WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 5
)
SELECT n FROM numbers;`,
        },
      ],
    },
    {
      module: M3,
      id: 'union',
      title: '13. Объединение запросов: UNION, INTERSECT, EXCEPT',
      intro: `
        <p><code>JOIN</code> склеивает таблицы <em>по горизонтали</em> — добавляет столбцы.
        <code>UNION</code> склеивает результаты <em>по вертикали</em> — ставит строки одного запроса
        под строки другого.</p>

        <pre class="sql-code">SELECT name FROM products WHERE price < 10
UNION
SELECT name FROM categories;</pre>

        <p><strong>Обязательные условия:</strong> у объединяемых запросов должно быть одинаковое
        количество столбцов и совместимые типы, а имена столбцов результата берутся из первого
        запроса.</p>

        <ul>
          <li><code>UNION</code> — объединение с удалением дубликатов. Требует дополнительной работы
          на сортировку/сравнение, поэтому медленнее.</li>
          <li><code>UNION ALL</code> — просто склеить всё подряд, дубликаты остаются. Быстрее, и если
          вы уверены, что пересечений нет, использовать нужно именно его.</li>
          <li><code>INTERSECT</code> — только строки, которые есть <strong>в обоих</strong> запросах.</li>
          <li><code>EXCEPT</code> — строки первого запроса, которых <strong>нет</strong> во втором
          (в Oracle этот оператор называется <code>MINUS</code>).</li>
        </ul>

        <p><code>ORDER BY</code> и <code>LIMIT</code> относятся ко <em>всему</em> объединению и
        пишутся один раз в самом конце. Попытка поставить <code>LIMIT</code> перед
        <code>UNION</code> — синтаксическая ошибка; если ограничение нужно именно одной части, её
        оборачивают в подзапрос.</p>

        <pre class="sql-code">SELECT id, name FROM products WHERE category_id = 1
UNION ALL
SELECT id, name FROM products WHERE category_id = 2
ORDER BY name;   -- сортирует уже объединённый результат</pre>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> <code>EXCEPT</code> — это
        готовый «диff» двух наборов данных, то есть идеальный инструмент сверки. Сравнить выгрузку
        до и после миграции: <code>SELECT ... FROM old EXCEPT SELECT ... FROM new</code> покажет, что
        потерялось, а запрос в обратную сторону — что появилось лишнего. Оба результата пустые —
        наборы совпадают.</p>`,
      example: {
        query: `SELECT id FROM products
EXCEPT
SELECT product_id FROM order_items;`,
        note: 'id товаров, которых нет ни в одной позиции заказа — тот же вопрос «что не продавалось», но через разность множеств.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Объедините через UNION ALL названия товаров из категории 1 и названия товаров из категории 6 (один столбец).',
          solutionQuery: `SELECT name FROM products WHERE category_id = 1
UNION ALL
SELECT name FROM products WHERE category_id = 6;`,
        },
        {
          id: 'ex2',
          prompt: 'С помощью INTERSECT найдите города, которые встречаются и у клиентов с регистрацией в 2023 году, и у клиентов с регистрацией в 2024 году (один столбец).',
          hint: "Условия: signup_date LIKE '2023%' и signup_date LIKE '2024%'.",
          solutionQuery: `SELECT city FROM customers WHERE signup_date LIKE '2023%'
INTERSECT
SELECT city FROM customers WHERE signup_date LIKE '2024%';`,
        },
        {
          id: 'ex3',
          prompt: 'С помощью EXCEPT найдите id клиентов, которые ни разу не делали заказ (один столбец).',
          solutionQuery: `SELECT id FROM customers
EXCEPT
SELECT customer_id FROM orders;`,
        },
      ],
    },
    {
      module: M3,
      id: 'case-if',
      title: '14. Условная логика: CASE и IIF',
      intro: `
        <p><code>CASE</code> — это if/else внутри запроса, для одного столбца результата. Условия
        проверяются по порядку сверху вниз, срабатывает первое подходящее:</p>

        <pre class="sql-code">SELECT name,
  CASE
    WHEN price < 15 THEN 'дешёвый'
    WHEN price < 40 THEN 'средний'
    ELSE 'дорогой'
  END AS price_tier
FROM products;</pre>

        <p><code>ELSE</code> необязателен, но если его нет и ни одно условие не подошло, получится
        <code>NULL</code> — частая причина неожиданных пустых значений в отчётах.</p>

        <p>Есть и вторая форма — «сравнение с вариантами», короче, когда проверяется одно и то же
        поле на равенство:</p>
        <pre class="sql-code">SELECT id,
  CASE status
    WHEN 'completed' THEN 'выполнен'
    WHEN 'pending'   THEN 'в обработке'
    WHEN 'cancelled' THEN 'отменён'
    ELSE 'неизвестный статус'
  END AS status_ru
FROM orders;</pre>

        <p>Для простого «если-то-иначе» с одним условием есть краткая функция:
        <code>IIF(условие, если_да, если_нет)</code> — она работает в SQLite, MS SQL и (как
        <code>IF()</code>) в MySQL. Это ровно то же, что <code>CASE WHEN условие THEN ... ELSE ... END</code>.</p>

        <p>Родственники, которые стоит знать: <code>COALESCE(a, b)</code> — «взять первое не-NULL»
        (то же, что <code>CASE WHEN a IS NOT NULL THEN a ELSE b END</code>), и
        <code>NULLIF(a, b)</code> — вернуть NULL, если <code>a = b</code> (удобно, чтобы избежать
        деления на ноль: <code>x / NULLIF(y, 0)</code> вместо ошибки даст NULL).</p>

        <p><strong>Сильный приём:</strong> <code>CASE</code> внутри агрегатной функции даёт «условный
        подсчёт» — сколько строк удовлетворяют условию, в разрезе групп, одним запросом:</p>
        <pre class="sql-code">SELECT
  COUNT(*) AS всего,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS выполнено,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS отменено
FROM orders;</pre>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> CASE позволяет прямо в запросе
        разметить строки на «ожидаемо / подозрительно» и сразу получить читаемый отчёт вместо
        выгрузки в Excel. А <code>SUM(CASE ...)</code> — компактный способ собрать сводку по статусам
        в одну строку результата, удобную для сравнения с ожидаемыми числами.</p>`,
      example: {
        query: `SELECT name, price,
  CASE
    WHEN price < 15 THEN 'дешёвый'
    WHEN price < 40 THEN 'средний'
    ELSE 'дорогой'
  END AS price_tier,
  IIF(price > 50, 'да', 'нет') AS премиум
FROM products
ORDER BY price;`,
        note: 'CASE с несколькими условиями и краткая форма IIF рядом.',
      },
      samples: [
        {
          title: 'IF() — вариант MySQL',
          code: `-- MySQL
SELECT name, IF(price > 50, 'дорого', 'дешево') AS tier FROM products;

-- То же в SQLite / MS SQL
SELECT name, IIF(price > 50, 'дорого', 'дешево') AS tier FROM products;

-- Универсальный вариант, работает везде
SELECT name, CASE WHEN price > 50 THEN 'дорого' ELSE 'дешево' END AS tier FROM products;`,
          note: 'В PostgreSQL функции IF/IIF нет вообще — только CASE. Поэтому CASE — самый переносимый выбор.',
        },
      ],
      exercises: [
        {
          id: 'ex1',
          prompt: "С помощью CASE выведите name клиента и метку 'указан' или 'не указан' в зависимости от того, заполнено ли поле city.",
          solutionQuery: "SELECT name, CASE WHEN city IS NULL THEN 'не указан' ELSE 'указан' END AS city_status FROM customers;",
        },
        {
          id: 'ex2',
          prompt: "Выведите id заказа и его статус по-русски: completed → 'выполнен', pending → 'в обработке', cancelled → 'отменён'.",
          hint: "Можно использовать форму CASE status WHEN 'completed' THEN ...",
          solutionQuery: `SELECT id,
  CASE status
    WHEN 'completed' THEN 'выполнен'
    WHEN 'pending' THEN 'в обработке'
    WHEN 'cancelled' THEN 'отменён'
  END AS status_ru
FROM orders;`,
        },
        {
          id: 'ex3',
          prompt: 'Одним запросом посчитайте общее число заказов и, отдельными столбцами, число выполненных (completed) и отменённых (cancelled) — через SUM(CASE ...).',
          solutionQuery: `SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
FROM orders;`,
        },
      ],
    },
    // ==================== МОДУЛЬ 4 ====================
    {
      module: M4,
      id: 'insert',
      title: '15. Добавление данных: INSERT',
      intro: `
        <p>Начинается «шалить посерьёзнее»: команды этого модуля <strong>меняют</strong> данные.
        Хорошая новость — здесь это безопасно: проверка упражнений выполняется в одноразовой копии
        чистой базы, а кнопка <strong>«↺ Сбросить базу»</strong> вверху в любой момент вернёт всё в
        исходное состояние.</p>

        <pre class="sql-code">INSERT INTO categories (id, name)
VALUES (7, 'Garden');</pre>

        <p>Порядок значений в <code>VALUES</code> должен соответствовать порядку столбцов в скобках
        после имени таблицы. Столбцы можно и не перечислять
        (<code>INSERT INTO categories VALUES (7, 'Garden')</code>), но так делать не стоит: запрос
        сломается, как только в таблицу добавят или переставят столбец. Явный список — привычка,
        которая экономит часы отладки.</p>

        <ul>
          <li><strong>Несколько строк за раз</strong> — просто перечислите наборы через запятую:
          <code>VALUES (1, 'a'), (2, 'b'), (3, 'c')</code>. Это и короче, и заметно быстрее, чем
          отдельные INSERT.</li>
          <li><strong>Пропущенные столбцы</strong> получают значение по умолчанию
          (<code>DEFAULT</code>), а если его нет — <code>NULL</code>. Если у столбца стоит
          <code>NOT NULL</code> и нет DEFAULT, пропуск приведёт к ошибке.</li>
          <li><strong>Автоматический id.</strong> В SQLite столбец
          <code>INTEGER PRIMARY KEY</code> сам получает следующее число, если его не указать (в
          MySQL для этого есть <code>AUTO_INCREMENT</code>, в PostgreSQL —
          <code>SERIAL</code>/<code>IDENTITY</code>). Поэтому <code>id</code> обычно не передают
          вручную — база сама следит за уникальностью.</li>
          <li><strong><code>INSERT ... SELECT</code></strong> — вставить результат запроса, без
          <code>VALUES</code>. Так копируют данные между таблицами:
          <code>INSERT INTO archive (id, name) SELECT id, name FROM products WHERE price &gt; 50;</code></li>
          <li><strong><code>RETURNING</code></strong> — сразу вернуть вставленные строки
          (<code>INSERT ... RETURNING id</code>). Есть в SQLite и PostgreSQL, удобно, чтобы узнать
          сгенерированный id.</li>
        </ul>

        <p>Что может пойти не так: нарушение <code>UNIQUE</code> или <code>PRIMARY KEY</code> (такой
        id уже есть), <code>NOT NULL</code> (не передали обязательное поле), <code>CHECK</code>
        (значение не проходит проверку) или <code>FOREIGN KEY</code> (ссылка на несуществующую
        строку). Все эти ограничения разбираются в уроке 26 — и это <em>хорошо</em>, что база
        ругается: она защищает данные от мусора.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> INSERT — это способ готовить
        тестовые данные напрямую, минуя UI: создать 50 заказов для проверки пагинации за секунду
        вместо получаса кликов. Плюс негативные тесты: попробовать вставить дубликат email или
        отрицательную цену и убедиться, что база (а не только форма на фронтенде) это не пропускает.</p>`,
      example: {
        query: `INSERT INTO categories (id, name) VALUES (7, 'Garden');
SELECT * FROM categories ORDER BY id;`,
        note: 'Добавляем категорию и сразу смотрим результат. Изменение попадёт в основную базу — сбросить можно кнопкой «↺ Сбросить базу».',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: "Добавьте в таблицу categories категорию с id = 7 и названием 'Garden'.",
          mutating: true,
          verifyQuery: 'SELECT id, name FROM categories ORDER BY id;',
          solutionQuery: "INSERT INTO categories (id, name) VALUES (7, 'Garden');",
        },
        {
          id: 'ex2',
          prompt:
            "Одним запросом добавьте две категории: (8, 'Music') и (9, 'Garage'). Используйте один INSERT с двумя наборами значений.",
          hint: "VALUES (8, 'Music'), (9, 'Garage')",
          mutating: true,
          verifyQuery: 'SELECT id, name FROM categories WHERE id >= 8 ORDER BY id;',
          solutionQuery: "INSERT INTO categories (id, name) VALUES (8, 'Music'), (9, 'Garage');",
        },
        {
          id: 'ex3',
          prompt:
            "Добавьте клиента с id = 13, именем 'Nina Petrova', email 'nina@example.com' и датой регистрации '2024-03-01', не указывая город (столбец city нужно пропустить).",
          hint: 'Перечислите в INSERT только те столбцы, которые заполняете — city останется NULL.',
          mutating: true,
          verifyQuery: 'SELECT id, name, email, city, signup_date FROM customers WHERE id = 13;',
          solutionQuery:
            "INSERT INTO customers (id, name, email, signup_date) VALUES (13, 'Nina Petrova', 'nina@example.com', '2024-03-01');",
        },
      ],
    },
    {
      module: M4,
      id: 'update',
      title: '16. Обновление данных: UPDATE',
      intro: `
        <p><code>UPDATE</code> меняет значения в <em>существующих</em> строках:</p>

        <pre class="sql-code">UPDATE products
SET price = 12.99          -- что меняем
WHERE id = 1;               -- у каких строк</pre>

        <p><strong>Главное правило работы с UPDATE:</strong> <code>WHERE</code> здесь не
        «необязательная часть», а предохранитель. <code>UPDATE products SET price = 0;</code> без
        WHERE обновит <strong>все</strong> строки таблицы — молча и без подтверждения. Профессиональная
        привычка: сначала написать <code>SELECT</code> с тем же <code>WHERE</code>, посмотреть, какие
        именно строки попадут под изменение, и только потом заменить <code>SELECT ...</code> на
        <code>UPDATE ... SET ...</code>. Живой предпросмотр под полем ввода как раз для этого и
        нужен.</p>

        <ul>
          <li><strong>Несколько столбцов</strong> — через запятую:
          <code>SET city = 'Berlin', name = 'Nina'</code>.</li>
          <li><strong>Значение может быть выражением</strong>, в том числе от самого столбца:
          <code>SET price = price * 1.1</code> поднимет цену на 10%. Все строки считаются от своих
          текущих значений.</li>
          <li><strong>Значение из подзапроса:</strong>
          <code>SET price = (SELECT AVG(price) FROM products)</code>.</li>
          <li><strong><code>CASE</code> внутри SET</strong> позволяет обновить строки по-разному одним
          запросом: <code>SET status = CASE WHEN ... THEN 'a' ELSE 'b' END</code>.</li>
        </ul>

        <p>Полезно знать: UPDATE, который «ничего не нашёл», не является ошибкой — он просто обновит
        0 строк и молча завершится успешно. Поэтому после UPDATE всегда стоит проверять число
        затронутых строк (клиенты БД его показывают) или делать контрольный SELECT: «успешно
        выполнено» ещё не значит «данные изменились».</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> UPDATE — быстрый способ
        привести тестовые данные в нужное состояние: «сделать подписку истёкшей вчера», «перевести
        заказ в статус, который через UI получить долго». Так проверяются ветки логики, до которых
        иначе не добраться. И осторожность здесь не паранойя: <code>UPDATE</code> без
        <code>WHERE</code> на тестовом стенде — это испорченные данные всей команды.</p>`,
      example: {
        query: `UPDATE products SET price = price * 1.1 WHERE category_id = 1;
SELECT id, name, ROUND(price, 2) AS price FROM products WHERE category_id = 1;`,
        note: 'Поднимаем цену книг на 10%. Обратите внимание: каждая строка пересчитана от своей цены.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Измените цену товара с id = 1 на 12.99.',
          mutating: true,
          verifyQuery: 'SELECT id, price FROM products WHERE id = 1;',
          solutionQuery: 'UPDATE products SET price = 12.99 WHERE id = 1;',
        },
        {
          id: 'ex2',
          prompt: "Всем клиентам, у которых город не указан (NULL), поставьте city = 'Unknown'.",
          hint: 'WHERE city IS NULL',
          mutating: true,
          verifyQuery: 'SELECT id, city FROM customers ORDER BY id;',
          solutionQuery: "UPDATE customers SET city = 'Unknown' WHERE city IS NULL;",
        },
        {
          id: 'ex3',
          prompt:
            "Заказу с id = 6 одним запросом поставьте статус 'completed' и дату order_date = '2024-03-15' (два столбца в одном SET).",
          mutating: true,
          verifyQuery: 'SELECT id, order_date, status FROM orders WHERE id = 6;',
          solutionQuery: "UPDATE orders SET status = 'completed', order_date = '2024-03-15' WHERE id = 6;",
        },
      ],
    },
    {
      module: M4,
      id: 'delete',
      title: '17. Удаление данных: DELETE',
      intro: `
        <p><code>DELETE</code> удаляет строки целиком:</p>

        <pre class="sql-code">DELETE FROM orders
WHERE status = 'cancelled';</pre>

        <p>Всё сказанное про <code>WHERE</code> в предыдущем уроке здесь важно вдвойне:
        <code>DELETE FROM orders;</code> без WHERE очистит таблицу полностью. Отменить это нельзя —
        разве что вы находитесь внутри транзакции (урок 21) или у вас есть бэкап. Порядок действий
        всегда один: сначала <code>SELECT</code> с тем же условием, убедиться, что под удаление
        попадают именно нужные строки, и только потом <code>DELETE</code>.</p>

        <p><strong>Три похожие команды, которые легко спутать:</strong></p>
        <ul>
          <li><code>DELETE FROM t WHERE ...</code> — удаляет строки по условию. Таблица остаётся.
          Работает построчно, поддаётся откату в транзакции.</li>
          <li><code>TRUNCATE TABLE t</code> — быстро очищает таблицу целиком (в MySQL/PostgreSQL;
          в SQLite такой команды нет, эквивалент — <code>DELETE FROM t</code> без WHERE). Быстрее, но
          обычно не откатывается и сбрасывает счётчик автоинкремента.</li>
          <li><code>DROP TABLE t</code> — удаляет саму таблицу вместе со структурой (урок 23).</li>
        </ul>

        <p><strong>Связанные данные.</strong> Если удалить заказ, его позиции в
        <code>order_items</code> останутся «висеть» и ссылаться на несуществующий заказ — это и есть
        те самые orphan-записи. Правильно настроенный внешний ключ такого не допустит: он либо
        запретит удаление (<code>ON DELETE RESTRICT</code>), либо удалит связанные строки
        автоматически (<code>ON DELETE CASCADE</code>) — подробности в уроке 26. Важная особенность
        SQLite: проверка внешних ключей по умолчанию <strong>выключена</strong>, и включается через
        <code>PRAGMA foreign_keys = ON;</code>. То есть в этом учебнике «осиротить» позиции заказа
        технически можно — и это хорошая иллюстрация того, зачем FK вообще нужны.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> DELETE нужен для уборки за
        собой: удалить созданные тестом данные, чтобы следующий прогон стартовал с чистого листа.
        А проверка того, что происходит со связанными записями при удалении, — обязательный пункт
        тест-плана: удаление пользователя не должно ломать его заказы (или, наоборот, должно их
        каскадно удалить — смотря что написано в требованиях).</p>`,
      example: {
        query: `DELETE FROM orders WHERE status = 'cancelled';
SELECT id, status FROM orders ORDER BY id;`,
        note: 'Удаляем отменённые заказы (их было 2). Позиции этих заказов в order_items при этом остались — те самые orphan-записи.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: "Удалите из таблицы orders все заказы со статусом 'cancelled'.",
          mutating: true,
          verifyQuery: 'SELECT id, status FROM orders ORDER BY id;',
          solutionQuery: "DELETE FROM orders WHERE status = 'cancelled';",
        },
        {
          id: 'ex2',
          prompt: 'Удалите клиента с id = 12 (у него нет заказов).',
          mutating: true,
          verifyQuery: 'SELECT id, name FROM customers ORDER BY id;',
          solutionQuery: 'DELETE FROM customers WHERE id = 12;',
        },
        {
          id: 'ex3',
          prompt: 'Удалите из products все товары, которые ни разу не встречаются в order_items.',
          hint: 'DELETE FROM products WHERE id NOT IN (SELECT product_id FROM order_items);',
          mutating: true,
          verifyQuery: 'SELECT id, name FROM products ORDER BY id;',
          solutionQuery: 'DELETE FROM products WHERE id NOT IN (SELECT product_id FROM order_items);',
        },
      ],
    },

    // ==================== МОДУЛЬ 5 ====================
    {
      module: M5,
      id: 'data-types',
      title: '18. Типы данных, числа, дата и время, CAST',
      intro: `
        <p>В большинстве СУБД тип столбца — это строгий контракт: положить текст в
        <code>INTEGER</code> просто не получится. <strong>SQLite устроен иначе</strong> — у него
        динамическая типизация: тип привязан не к столбцу, а к самому значению, и столбец лишь имеет
        «предпочтение» (type affinity). Поэтому здесь можно записать строку в числовой столбец, и
        база не возразит. Проверить, что реально лежит в значении, помогает функция
        <code>typeof()</code>.</p>

        <p>Классов хранения в SQLite всего пять: <code>NULL</code>, <code>INTEGER</code> (целое),
        <code>REAL</code> (дробное), <code>TEXT</code> (строка), <code>BLOB</code> (двоичные данные).
        В MySQL и PostgreSQL типов десятки, но по смыслу они группируются так же.</p>

        <p><strong>Числа.</strong> Главная ловушка — <strong>целочисленное деление</strong>: если оба
        операнда целые, результат тоже целый, дробная часть отбрасывается. <code>7 / 2</code> даст
        <code>3</code>, а не 3.5. Чтобы получить дробь, достаточно сделать один операнд дробным:
        <code>7.0 / 2</code> или <code>CAST(7 AS REAL) / 2</code>. Полезные функции:
        <code>ROUND(x, знаков)</code>, <code>ABS</code>, <code>CEIL</code>, <code>FLOOR</code>,
        <code>x % y</code> (остаток).</p>

        <p>Отдельно про деньги: хранить их в <code>REAL</code> (число с плавающей точкой) —
        известный источник багов вида «итог 19.999999999998». В «больших» СУБД для денег берут
        <code>DECIMAL</code>/<code>NUMERIC</code> с фиксированной точностью, либо хранят копейки
        целым числом. В нашей учебной базе цены лежат в REAL — как раз чтобы вы увидели, откуда
        берутся такие хвосты.</p>

        <p><strong>Дата и время.</strong> В SQLite <strong>нет</strong> отдельного типа даты — их
        хранят строками в формате ISO-8601 (<code>'2024-01-15'</code>,
        <code>'2024-01-15 10:30:00'</code>). Это удобно: такие строки правильно сортируются и
        сравниваются как обычный текст. Работать с ними помогают функции:</p>
        <ul>
          <li><code>date('now')</code>, <code>datetime('now')</code> — текущая дата/время.</li>
          <li><code>strftime('%Y', col)</code> — вытащить часть: <code>%Y</code> год,
          <code>%m</code> месяц, <code>%d</code> день, <code>%H:%M</code> время, <code>%w</code> день
          недели.</li>
          <li><strong>Модификаторы</strong> — арифметика дат:
          <code>date('2024-01-15', '+1 month', '-3 days')</code>. Умеет корректно обрабатывать
          концы месяцев: <code>date('2024-03-01', '-1 day')</code> вернёт 29 февраля.</li>
          <li><code>julianday(a) - julianday(b)</code> — разница в днях (в MySQL для этого
          <code>DATEDIFF</code>, в PostgreSQL просто вычитание дат).</li>
        </ul>

        <p><strong><code>CAST(значение AS ТИП)</code></strong> — явное преобразование типа. Тут есть
        коварная особенность: если строку не удаётся разобрать как число, ошибки не будет —
        SQLite вернёт <code>0</code>. <code>CAST('abc' AS INTEGER)</code> → <code>0</code>, а
        <code>CAST('12abc' AS INTEGER)</code> → <code>12</code>. Молчаливое превращение мусора в
        нули — ровно тот случай, когда данные «портятся тихо», и заметить это можно только
        специально проверив.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Типы данных — источник целого
        класса багов, которые ловятся только через базу: числа, сохранённые как строки (и поэтому
        сортирующиеся «1, 10, 2»), даты в разных форматах в одном столбце, копейки, потерянные при
        округлении. <code>typeof()</code> и <code>CAST</code> — ваши инструменты для таких проверок,
        а знание про целочисленное деление избавит от неверных ожиданий в тестах на расчёты.</p>`,
      example: {
        query: `SELECT
  typeof(price) AS тип_цены,
  typeof(name) AS тип_имени,
  7 / 2 AS целочисленное_деление,
  7.0 / 2 AS обычное_деление,
  CAST('12abc' AS INTEGER) AS из_мусора,
  strftime('%Y', '2024-03-15') AS год,
  date('2024-03-01', '-1 day') AS вчера_от_1_марта
FROM products LIMIT 1;`,
        note: 'Все ловушки типов в одном запросе: 7/2 = 3, а не 3.5, и CAST мусора не падает, а даёт число.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Выведите для любого одного товара тип значения в столбце price и тип значения в столбце name (два столбца, одна строка). Используйте typeof и LIMIT 1.',
          solutionQuery: 'SELECT typeof(price), typeof(name) FROM products LIMIT 1;',
        },
        {
          id: 'ex2',
          prompt: "Для каждого клиента выведите name и год регистрации (используйте strftime('%Y', signup_date)).",
          solutionQuery: "SELECT name, strftime('%Y', signup_date) AS signup_year FROM customers;",
        },
        {
          id: 'ex3',
          prompt: 'Для каждого заказа выведите order_id и сумму его позиций, округлённую до 2 знаков (ROUND).',
          hint: 'ROUND(SUM(quantity * unit_price), 2) с группировкой по order_id.',
          solutionQuery:
            'SELECT order_id, ROUND(SUM(quantity * unit_price), 2) AS total FROM order_items GROUP BY order_id;',
        },
        {
          id: 'ex4',
          prompt:
            "Посчитайте для клиента с id = 1, сколько целых дней прошло от его signup_date до '2024-01-01' (одно число). Используйте julianday и CAST в INTEGER.",
          hint: "CAST(julianday('2024-01-01') - julianday(signup_date) AS INTEGER)",
          solutionQuery:
            "SELECT CAST(julianday('2024-01-01') - julianday(signup_date) AS INTEGER) AS days FROM customers WHERE id = 1;",
        },
      ],
    },
    {
      module: M5,
      id: 'window-functions',
      title: '19. Оконные функции: основы',
      intro: `
        <p>Главное отличие от GROUP BY: агрегат в GROUP BY <strong>схлопывает</strong> много строк в
        одну на группу — детали теряются. Оконная функция (<code>... OVER (...)</code>) считает
        значение, «глядя» на группу связанных строк («окно»), но при этом <strong>сохраняет каждую
        исходную строку</strong> в результате. Это позволяет показать каждый товар и рядом — его ранг
        внутри категории, не теряя остальные столбцы.</p>

        <pre class="sql-code">SELECT name, category_id, price,
  RANK() OVER (PARTITION BY category_id ORDER BY price DESC) AS price_rank
FROM products;
-- для каждой строки: её ранг по цене СРЕДИ строк с той же category_id</pre>

        <ul>
          <li><code>PARTITION BY col</code> — делит строки на независимые группы («окна»), как
          GROUP BY, но без схлопывания. Можно опустить — тогда окно одно, на всю таблицу.</li>
          <li><code>ORDER BY</code> внутри <code>OVER(...)</code> — задаёт порядок строк внутри окна;
          нужен функциям, которым важен порядок (ранги, накопительные суммы). Это отдельный
          ORDER BY, не связанный с ORDER BY всего запроса.</li>
          <li><code>ROW_NUMBER()</code> — порядковый номер 1, 2, 3, ... без повторов, даже если
          значения одинаковые.</li>
          <li><code>RANK()</code> — ранг, где одинаковые значения получают одинаковый номер, а
          следующий «перескакивает» (1, 1, 3, 4, ...).</li>
          <li><code>SUM(col) OVER (ORDER BY col2)</code> — накопительная (running) сумма: для каждой
          строки сумма её и всех предыдущих по заданному порядку.</li>
        </ul>

        <p>Ещё одно важное ограничение: оконные функции нельзя использовать в <code>WHERE</code> —
        они вычисляются уже <em>после</em> фильтрации. Если нужно отфильтровать по результату
        оконной функции (например, «оставить только строки с rank = 1»), запрос оборачивают в CTE и
        фильтруют снаружи.</p>

        <p>Тема считается продвинутой — если что-то не укладывается с первого раза, это нормально;
        лучший способ разобраться — менять пример по кусочкам (убрать PARTITION BY, поменять ASC на
        DESC) и смотреть, что меняется в результате.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Оконные функции решают задачи
        вида «найти самую последнюю запись по каждому пользователю» или «проверить, что порядковые
        номера в выгрузке идут без дыр и дублей» — то, что через обычный GROUP BY выразить неудобно
        или невозможно.</p>`,
      example: {
        query: `SELECT name, category_id, price,
  RANK() OVER (PARTITION BY category_id ORDER BY price DESC) AS price_rank
FROM products
ORDER BY category_id, price_rank;`,
        note: 'Ранг каждого товара по цене внутри своей категории.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt:
            'Для каждого товара выведите name, category_id и его номер по возрастанию цены внутри категории (ROW_NUMBER, PARTITION BY category_id ORDER BY price ASC).',
          solutionQuery:
            'SELECT name, category_id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price ASC) AS rn FROM products;',
        },
        {
          id: 'ex2',
          prompt:
            'Посчитайте сумму каждого заказа, а затем выведите order_id, order_date и накопительную (running) сумму по всем заказам, упорядоченным по order_date.',
          hint: 'Сначала CTE с order_id, order_date, total. Затем SUM(total) OVER (ORDER BY order_date, order_id).',
          solutionQuery: `WITH totals AS (
  SELECT o.id AS order_id, o.order_date, SUM(oi.quantity * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id, o.order_date
)
SELECT order_id, order_date, SUM(total) OVER (ORDER BY order_date, order_id) AS running_total
FROM totals;`,
        },
      ],
    },
    {
      module: M5,
      id: 'window-advanced',
      title: '20. Оконные функции: партиции, рамки, типы',
      intro: `
        <p>Разберём устройство окна по частям. Полный синтаксис такой:</p>

        <pre class="sql-code">функция() OVER (
  PARTITION BY ...   -- на какие группы делим
  ORDER BY ...       -- в каком порядке идут строки внутри группы
  ROWS BETWEEN ... AND ...   -- рамка: какие строки участвуют в расчёте
)</pre>

        <p><strong>Партиции.</strong> <code>PARTITION BY</code> делит строки на независимые части:
        нумерация и суммы начинаются заново в каждой. Партиций может быть несколько
        (<code>PARTITION BY category_id, status</code>). Без <code>PARTITION BY</code> вся выборка —
        одно окно.</p>

        <p><strong>Сортировка внутри окна.</strong> <code>ORDER BY</code> в <code>OVER</code> — это не
        сортировка результата, а определение «предыдущих» и «следующих» строк внутри окна. От неё
        зависят и ранги, и накопительные суммы, и функции смещения.</p>

        <p><strong>Рамка окна (frame)</strong> — самая недооценённая часть. Она отвечает на вопрос:
        какие именно строки окна участвуют в расчёте <em>для текущей строки</em>?</p>
        <ul>
          <li><code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> — от начала окна до
          текущей строки. Это накопительная сумма.</li>
          <li><code>ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</code> — текущая строка и две
          предыдущие. Это скользящее окно, основа «скользящего среднего».</li>
          <li><code>ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING</code> — от текущей строки до
          конца окна.</li>
          <li><code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code> — всё окно
          целиком, вне зависимости от текущей строки.</li>
        </ul>

        <p><strong>Важно про рамку по умолчанию:</strong> если <code>ORDER BY</code> в окне есть, а
        рамка не указана, она равна «от начала окна до текущей строки» — поэтому
        <code>SUM(x) OVER (ORDER BY y)</code> даёт накопительную сумму, а не общую. А если
        <code>ORDER BY</code> нет вовсе, рамка — всё окно, и <code>SUM(x) OVER ()</code> даст общий
        итог в каждой строке. Это объясняет, почему «одна и та же» функция ведёт себя по-разному:
        <code>ROWS</code> считает строки, а <code>RANGE</code> — диапазон значений (строки с
        одинаковым значением ORDER BY попадают в рамку вместе).</p>

        <p><strong>Типы оконных функций.</strong> Их удобно держать в голове тремя группами:</p>
        <ul>
          <li><strong>Ранжирующие:</strong> <code>ROW_NUMBER()</code> (1,2,3 без повторов),
          <code>RANK()</code> (с пропусками: 1,1,3), <code>DENSE_RANK()</code> (без пропусков:
          1,1,2), <code>NTILE(n)</code> (разбить на n примерно равных частей — квартили, децили),
          <code>PERCENT_RANK()</code> (относительная позиция от 0 до 1).</li>
          <li><strong>Агрегатные в окне:</strong> обычные <code>SUM</code>, <code>AVG</code>,
          <code>COUNT</code>, <code>MIN</code>, <code>MAX</code> с <code>OVER</code>.</li>
          <li><strong>Функции смещения (значения):</strong> <code>LAG(col, n)</code> — значение из
          строки на n позиций назад, <code>LEAD(col, n)</code> — вперёд,
          <code>FIRST_VALUE(col)</code> / <code>LAST_VALUE(col)</code> — первое/последнее значение в
          рамке. <code>LAG</code>/<code>LEAD</code> — самый удобный способ сравнить строку с
          предыдущей: «на сколько выросла сумма относительно прошлого заказа».</li>
        </ul>

        <p>Если одно и то же окно используется несколько раз, его можно назвать через
        <code>WINDOW</code> и не повторять:</p>
        <pre class="sql-code">SELECT id,
  SUM(price) OVER w AS сумма,
  AVG(price) OVER w AS среднее
FROM products
WINDOW w AS (ORDER BY id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW);</pre>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> <code>LAG</code> — готовый
        инструмент для проверки последовательностей: нет ли в журнале событий записи «оплачено»
        раньше «создано», не идут ли даты вспять, нет ли дублей подряд. А <code>NTILE</code> и
        <code>PERCENT_RANK</code> помогают быстро увидеть распределение значений вместо среднего,
        которое легко скрывает выбросы.</p>`,
      example: {
        query: `SELECT
  id,
  price,
  LAG(price) OVER (ORDER BY id) AS предыдущая_цена,
  price - LAG(price) OVER (ORDER BY id) AS разница,
  ROUND(AVG(price) OVER (ORDER BY id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS скользящее_среднее_3,
  NTILE(4) OVER (ORDER BY price) AS квартиль
FROM products
ORDER BY id;`,
        note: 'LAG сравнивает строку с предыдущей, рамка ROWS BETWEEN 2 PRECEDING даёт скользящее среднее по 3 строкам, NTILE делит товары на 4 группы по цене.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt:
            'Для каждого заказа выведите id, order_date и дату предыдущего заказа (по возрастанию order_date, затем id) с помощью LAG.',
          hint: 'LAG(order_date) OVER (ORDER BY order_date, id)',
          solutionQuery:
            'SELECT id, order_date, LAG(order_date) OVER (ORDER BY order_date, id) AS prev_date FROM orders;',
        },
        {
          id: 'ex2',
          prompt:
            'Для каждого товара выведите name, category_id, price и DENSE_RANK по убыванию цены внутри категории.',
          solutionQuery:
            'SELECT name, category_id, price, DENSE_RANK() OVER (PARTITION BY category_id ORDER BY price DESC) AS dr FROM products;',
        },
        {
          id: 'ex3',
          prompt:
            'Для каждого товара выведите id, price и сумму цен текущей и одной предыдущей строки (по порядку id) — используйте рамку ROWS BETWEEN 1 PRECEDING AND CURRENT ROW.',
          solutionQuery:
            'SELECT id, price, SUM(price) OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS moving_sum FROM products;',
        },
        {
          id: 'ex4',
          prompt: 'Разбейте товары на 4 группы по возрастанию цены: выведите name, price и номер группы (NTILE).',
          solutionQuery: 'SELECT name, price, NTILE(4) OVER (ORDER BY price) AS quartile FROM products;',
        },
      ],
    },
    {
      module: M5,
      id: 'transactions',
      title: '21. Транзакции и блокировки',
      intro: `
        <p><strong>Транзакция</strong> — это группа команд, которая выполняется по принципу «всё или
        ничего». Классический пример — перевод денег: списать со счёта A и зачислить на счёт B. Если
        после списания что-то упадёт, а зачисление не произойдёт, деньги исчезнут. Транзакция
        гарантирует, что либо выполнятся оба действия, либо ни одно.</p>

        <pre class="sql-code">BEGIN;                                    -- начали транзакцию
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;                                   -- зафиксировали оба изменения</pre>

        <p>Вместо <code>COMMIT</code> можно сказать <code>ROLLBACK</code> — тогда все изменения
        внутри транзакции отменяются, как будто их не было. Именно поэтому транзакция — лучший друг
        того, кто собирается выполнить страшный <code>UPDATE</code> или <code>DELETE</code>: начните
        с <code>BEGIN</code>, выполните команду, проверьте <code>SELECT</code>-ом результат, и если
        что-то не так — <code>ROLLBACK</code>.</p>

        <p><strong>Свойства ACID</strong> — то, что транзакции гарантируют:</p>
        <ul>
          <li><strong>A</strong>tomicity (атомарность) — всё или ничего.</li>
          <li><strong>C</strong>onsistency (согласованность) — данные не нарушают ограничений
          (FK, CHECK) ни до, ни после.</li>
          <li><strong>I</strong>solation (изолированность) — параллельные транзакции не видят
          промежуточных, незафиксированных изменений друг друга.</li>
          <li><strong>D</strong>urability (долговечность) — после COMMIT данные не потеряются даже
          при выключении питания.</li>
        </ul>

        <p>По умолчанию СУБД работает в режиме <strong>autocommit</strong>: каждая отдельная команда
        сама себе транзакция. Явные <code>BEGIN ... COMMIT</code> нужны, когда неделимой должна быть
        группа команд.</p>

        <p><strong><code>SAVEPOINT</code></strong> — «точка сохранения» внутри транзакции: можно
        откатиться не к началу, а к ней (<code>ROLLBACK TO имя</code>), сохранив всё, что было
        сделано до неё.</p>

        <p><strong>Блокировки.</strong> Чтобы изоляция работала, СУБД блокирует изменяемые данные:
        пока одна транзакция меняет строку, другая её не тронет. Здесь СУБД сильно различаются:
        SQLite блокирует <em>всю базу</em> на время записи (простая модель — либо пишет кто-то один,
        либо читают многие), а MySQL/PostgreSQL умеют блокировать <em>отдельные строки</em>, что
        позволяет писать в одну таблицу параллельно. Отсюда два явления, о которых стоит знать:</p>
        <ul>
          <li><strong>Deadlock</strong> (взаимоблокировка) — две транзакции ждут ресурсы друг друга и
          не могут продолжить. СУБД обнаруживает это и убивает одну из транзакций с ошибкой.</li>
          <li><strong>Уровни изоляции</strong> — компромисс между строгостью и скоростью:
          <code>READ UNCOMMITTED</code>, <code>READ COMMITTED</code>,
          <code>REPEATABLE READ</code>, <code>SERIALIZABLE</code>. Чем строже, тем меньше аномалий
          (грязное чтение, неповторяющееся чтение, фантомы), но тем больше ожиданий.</li>
        </ul>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Во-первых, транзакции — это
        безопасная песочница: обернули опасный UPDATE в BEGIN, проверили, откатили. Во-вторых, это
        целый класс тест-кейсов: что будет, если два пользователя одновременно купят последний товар;
        что произойдёт с заказом, если платёж упадёт на середине; не «залипнет» ли приложение на
        deadlock. Такие баги почти невозможно найти, не понимая транзакций.</p>`,
      example: {
        query: `BEGIN;
UPDATE products SET price = 0 WHERE id = 1;
SELECT price AS цена_внутри_транзакции FROM products WHERE id = 1;
ROLLBACK;
SELECT price AS цена_после_откатa FROM products WHERE id = 1;`,
        note: 'Внутри транзакции цена уже 0, но после ROLLBACK возвращается исходная. Показан только последний SELECT — выполните пример и убедитесь, что цена не изменилась.',
      },
      samples: [
        {
          title: 'Блокировки строк и уровни изоляции (MySQL / PostgreSQL)',
          code: `-- Заблокировать выбранные строки до конца транзакции:
BEGIN;
SELECT * FROM products WHERE id = 1 FOR UPDATE;   -- в SQLite не поддерживается
UPDATE products SET price = price - 10 WHERE id = 1;
COMMIT;

-- Не ждать, если строка уже заблокирована другим:
SELECT * FROM products WHERE id = 1 FOR UPDATE NOWAIT;

-- Уровень изоляции для текущей транзакции:
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;`,
          note: 'SELECT ... FOR UPDATE — основной инструмент против «двойной покупки последнего товара». В SQLite его нет: там запись блокирует базу целиком.',
        },
      ],
      exercises: [
        {
          id: 'ex1',
          prompt:
            "Начните транзакцию, удалите все строки из order_items, откатите транзакцию (ROLLBACK), а затем — уже вне транзакции — установите заказу с id = 1 статус 'checked'.",
          hint: 'BEGIN; DELETE ...; ROLLBACK; UPDATE ...;',
          mutating: true,
          verifyQuery:
            "SELECT (SELECT COUNT(*) FROM order_items) AS items_left, (SELECT status FROM orders WHERE id = 1) AS status_1;",
          solutionQuery: `BEGIN;
DELETE FROM order_items;
ROLLBACK;
UPDATE orders SET status = 'checked' WHERE id = 1;`,
        },
        {
          id: 'ex2',
          prompt: 'В транзакции измените цену товара с id = 1 на 99.99 и зафиксируйте изменение (COMMIT).',
          mutating: true,
          verifyQuery: 'SELECT price FROM products WHERE id = 1;',
          solutionQuery: `BEGIN;
UPDATE products SET price = 99.99 WHERE id = 1;
COMMIT;`,
        },
        {
          id: 'ex3',
          prompt:
            "Начните транзакцию, поставьте клиенту id = 1 город 'Berlin', создайте SAVEPOINT с именем sp, затем поставьте город 'Paris', откатитесь к sp и зафиксируйте транзакцию. В итоге должен остаться 'Berlin'.",
          hint: 'BEGIN; UPDATE ...Berlin; SAVEPOINT sp; UPDATE ...Paris; ROLLBACK TO sp; COMMIT;',
          mutating: true,
          verifyQuery: 'SELECT city FROM customers WHERE id = 1;',
          solutionQuery: `BEGIN;
UPDATE customers SET city = 'Berlin' WHERE id = 1;
SAVEPOINT sp;
UPDATE customers SET city = 'Paris' WHERE id = 1;
ROLLBACK TO sp;
COMMIT;`,
        },
      ],
    },
    {
      module: M5,
      id: 'stored-procedures',
      title: '22. Хранимые процедуры, функции и планировщик',
      note: `<strong>Этот урок — справочный.</strong> SQLite, которая работает внутри этой страницы,
        <em>не поддерживает</em> хранимые процедуры, функции и планировщик событий: у неё нет
        собственного процедурного языка, и логика живёт в приложении. Поэтому упражнений здесь нет —
        только объяснение и синтаксис MySQL, чтобы вы узнали такой код, когда встретите его в
        проекте.`,
      intro: `
        <p><strong>Хранимая процедура</strong> — это код на процедурном языке СУБД, сохранённый
        <em>внутри</em> базы под именем и вызываемый командой <code>CALL</code>. В отличие от
        обычного запроса, внутри неё есть переменные, условия, циклы — то есть настоящая
        программа, работающая рядом с данными.</p>

        <p><strong>Хранимая функция</strong> отличается тем, что <em>возвращает значение</em> и
        поэтому вызывается прямо внутри запроса, как встроенная:
        <code>SELECT order_total(5);</code>. Процедура же вызывается отдельной командой и может
        возвращать несколько результатов через OUT-параметры.</p>

        <p><strong>Зачем они нужны:</strong> вынести сложную логику к данным (меньше пересылки по
        сети), дать приложению простой интерфейс вместо десятка запросов, ограничить права
        (пользователь может вызвать процедуру, но не читать таблицы напрямую). <strong>Почему их
        часто избегают:</strong> код внутри базы труднее версионировать, тестировать и отлаживать, а
        логика оказывается размазанной между приложением и СУБД.</p>

        <p><strong>Операторы внутри процедур.</strong> Это уже не SQL-выражения, а именно
        процедурный код: <code>IF ... THEN ... ELSEIF ... ELSE ... END IF</code>,
        <code>CASE</code> (в форме оператора, а не выражения), циклы <code>WHILE ... DO ... END WHILE</code>,
        <code>REPEAT</code>, <code>LOOP</code> с <code>LEAVE</code> для выхода. Не путайте оператор
        <code>CASE</code> внутри процедуры с выражением <code>CASE</code> из урока 14 — пишутся
        похоже, но первое управляет выполнением, а второе просто вычисляет значение.</p>

        <p><strong>Планировщик событий</strong> (<code>EVENT</code> в MySQL, расширение
        <code>pg_cron</code> в PostgreSQL) выполняет SQL по расписанию, как cron: раз в сутки
        удалить старые логи, каждый час пересчитать агрегаты. Здесь важна оговорка: планировщик в
        MySQL по умолчанию выключен (<code>event_scheduler = ON</code>), и «событие не сработало»
        чаще всего означает именно это.</p>

        <p>В SQLite аналогов нет. Ближайшая замена циклу для генерации данных — рекурсивный CTE из
        урока 12, а «реакция на изменение данных» решается триггерами
        (<code>CREATE TRIGGER</code>), которые SQLite как раз поддерживает.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Если часть бизнес-логики живёт
        в процедурах, то тестировать её через UI бессмысленно — нужно вызывать процедуру напрямую с
        разными параметрами, включая граничные. А запланированные события (<code>EVENT</code>) — это
        отложенные во времени эффекты: данные «сами» меняются ночью, и внезапно упавший утром тест
        объясняется не кодом, а расписанием.</p>`,
      samples: [
        {
          title: 'Хранимая функция (MySQL)',
          code: `DELIMITER //

CREATE FUNCTION order_total(p_order_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(10,2);
  SELECT COALESCE(SUM(quantity * unit_price), 0)
    INTO v_total
    FROM order_items
   WHERE order_id = p_order_id;
  RETURN v_total;
END //

DELIMITER ;

-- вызов прямо в запросе:
SELECT id, order_total(id) AS total FROM orders;`,
          note: 'DELIMITER нужен, чтобы точки с запятой внутри тела не завершили команду CREATE раньше времени.',
        },
        {
          title: 'Хранимая процедура с IF, CASE и WHILE (MySQL)',
          code: `DELIMITER //

CREATE PROCEDURE apply_discount(IN p_category_id INT, OUT p_updated INT)
BEGIN
  DECLARE v_avg DECIMAL(10,2);
  DECLARE i INT DEFAULT 0;

  SELECT AVG(price) INTO v_avg FROM products WHERE category_id = p_category_id;

  -- IF / ELSEIF / ELSE
  IF v_avg IS NULL THEN
    SET p_updated = 0;
  ELSEIF v_avg > 50 THEN
    UPDATE products SET price = price * 0.9 WHERE category_id = p_category_id;
    SET p_updated = ROW_COUNT();
  ELSE
    SET p_updated = 0;
  END IF;

  -- CASE как оператор
  CASE
    WHEN p_updated > 10 THEN INSERT INTO audit_log (msg) VALUES ('массовая скидка');
    WHEN p_updated > 0  THEN INSERT INTO audit_log (msg) VALUES ('скидка применена');
    ELSE INSERT INTO audit_log (msg) VALUES ('без изменений');
  END CASE;

  -- WHILE: цикл
  WHILE i < 3 DO
    INSERT INTO audit_log (msg) VALUES (CONCAT('шаг ', i));
    SET i = i + 1;
  END WHILE;
END //

DELIMITER ;

CALL apply_discount(2, @updated);
SELECT @updated;`,
          note: 'IN-параметр передаётся внутрь, OUT-параметр возвращает результат наружу. ROW_COUNT() — сколько строк затронул последний запрос.',
        },
        {
          title: 'Планировщик событий (MySQL)',
          code: `-- Планировщик по умолчанию выключен, включаем:
SET GLOBAL event_scheduler = ON;

-- Каждую ночь удалять записи старше 90 дней:
CREATE EVENT purge_old_logs
ON SCHEDULE EVERY 1 DAY STARTS '2024-01-01 03:00:00'
DO
  DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL 90 DAY;

-- Разово, один раз через час:
CREATE EVENT recalc_once
ON SCHEDULE AT NOW() + INTERVAL 1 HOUR
DO CALL apply_discount(2, @dummy);

SHOW EVENTS;
DROP EVENT purge_old_logs;`,
          note: 'В PostgreSQL встроенного планировщика нет — используют расширение pg_cron или обычный системный cron.',
        },
      ],
      exercises: [],
    },

    // ==================== МОДУЛЬ 6 ====================
    {
      module: M6,
      id: 'create-table',
      title: '23. Создание и удаление таблиц и баз данных',
      intro: `
        <p>До сих пор мы работали с готовой базой. Теперь научимся создавать свою — это команды
        группы DDL (Data Definition Language).</p>

        <pre class="sql-code">CREATE TABLE suppliers (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  country TEXT,
  rating  REAL DEFAULT 0
);</pre>

        <p>Каждая строка описания — это <code>имя_столбца ТИП [ограничения]</code>. Ограничения
        (<code>PRIMARY KEY</code>, <code>NOT NULL</code>, <code>DEFAULT</code>, ...) подробно
        разбираются в уроке 26.</p>

        <p><strong>Типы данных для столбцов.</strong> Названия зависят от СУБД, но смысл общий:</p>
        <ul>
          <li><strong>Строковые:</strong> <code>TEXT</code> — строка произвольной длины;
          <code>VARCHAR(n)</code> — строка до n символов; <code>CHAR(n)</code> — строка ровно n
          символов (дополняется пробелами). В SQLite все они — одно и то же
          <code>TEXT</code>: ограничение длины <code>VARCHAR(10)</code> здесь <em>не проверяется</em>,
          что само по себе полезно знать, если тестируете на SQLite, а в прод идёт MySQL.</li>
          <li><strong>Числовые:</strong> <code>INTEGER</code> — целое;
          <code>REAL</code>/<code>DOUBLE</code>/<code>FLOAT</code> — с плавающей точкой;
          <code>DECIMAL(p, s)</code>/<code>NUMERIC(p, s)</code> — точное число с фиксированным
          количеством знаков (p всего цифр, s после запятой) — правильный выбор для денег.
          В MySQL есть ещё <code>TINYINT</code>, <code>BIGINT</code> и т.п. — разного размера.</li>
          <li><strong>Дата и время:</strong> <code>DATE</code> (только дата),
          <code>TIME</code>, <code>DATETIME</code>/<code>TIMESTAMP</code> (дата со временем; TIMESTAMP
          обычно ещё и учитывает часовой пояс). В SQLite таких типов нет — даты хранят как
          <code>TEXT</code> в формате ISO-8601 (см. урок 18).</li>
          <li><strong>Прочее:</strong> <code>BOOLEAN</code> (в SQLite — 0/1), <code>BLOB</code>
          (двоичные данные), <code>JSON</code> (в MySQL/PostgreSQL — отдельный тип с функциями
          поиска внутри).</li>
        </ul>

        <p><strong>Удаление и изменение:</strong></p>
        <ul>
          <li><code>DROP TABLE suppliers;</code> — удалить таблицу вместе со всеми данными и
          структурой. Отменить нельзя (только откатом транзакции).</li>
          <li><code>IF NOT EXISTS</code> / <code>IF EXISTS</code> —
          <code>CREATE TABLE IF NOT EXISTS ...</code> и <code>DROP TABLE IF EXISTS ...</code> не
          падают, если таблица уже есть (или уже нет). Стандартный приём в скриптах, которые могут
          запускаться повторно.</li>
          <li><code>ALTER TABLE</code> — менять структуру существующей таблицы:
          <code>ADD COLUMN note TEXT</code>, <code>RENAME COLUMN a TO b</code>,
          <code>DROP COLUMN note</code>, <code>RENAME TO new_name</code>. Возможности SQLite здесь
          скромнее, чем у MySQL/PostgreSQL: например, изменить тип существующего столбца нельзя —
          таблицу пересоздают и переливают данные.</li>
        </ul>

        <p><strong>А базы данных?</strong> В MySQL и PostgreSQL есть
        <code>CREATE DATABASE</code> / <code>DROP DATABASE</code> — синтаксис в блоке ниже. В SQLite
        таких команд <em>нет вообще</em>: одна база — это один файл на диске, и «создать базу»
        значит просто открыть новый файл. Подключить второй файл к текущему соединению можно
        командой <code>ATTACH DATABASE 'other.db' AS other;</code> — после этого к его таблицам
        обращаются как <code>other.имя_таблицы</code>.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Уметь создать себе временную
        таблицу — это возможность разложить сложную проверку на шаги, не мешая никому: сложить туда
        выгрузку «до», потом «после», и сравнить через <code>EXCEPT</code>. Плюс понимание типов —
        готовый источник тест-кейсов: что будет при 300 символах в <code>VARCHAR(255)</code>, при
        отрицательном числе в поле «количество», при <code>29.02</code> невисокосного года.</p>`,
      example: {
        query: `CREATE TABLE IF NOT EXISTS suppliers (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  country TEXT,
  rating  REAL DEFAULT 0
);
INSERT INTO suppliers (name, country) VALUES ('Acme', 'USA'), ('Globex', 'Germany');
SELECT * FROM suppliers;`,
        note: 'Создаём таблицу и добавляем две строки. id не указывали — он присвоился автоматически, rating взялся из DEFAULT.',
      },
      samples: [
        {
          title: 'Создание и удаление базы данных (MySQL / PostgreSQL)',
          code: `-- MySQL
CREATE DATABASE shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shop;
DROP DATABASE IF EXISTS shop;

-- PostgreSQL
CREATE DATABASE shop ENCODING 'UTF8';
DROP DATABASE IF EXISTS shop;

-- SQLite: таких команд нет, база = файл.
-- Подключить ещё один файл к текущему соединению:
ATTACH DATABASE 'archive.db' AS archive;
SELECT * FROM archive.orders;
DETACH DATABASE archive;`,
          note: 'Указание кодировки при создании базы — не формальность: именно из-за неверной collation появляются баги с сортировкой и регистром у не-латиницы.',
        },
      ],
      exercises: [
        {
          id: 'ex1',
          prompt:
            'Создайте таблицу suppliers со столбцами: id (INTEGER PRIMARY KEY), name (TEXT NOT NULL), country (TEXT).',
          mutating: true,
          verifyQuery: "SELECT name FROM pragma_table_info('suppliers') ORDER BY cid;",
          solutionQuery: 'CREATE TABLE suppliers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);',
        },
        {
          id: 'ex2',
          prompt:
            'Добавьте в существующую таблицу products новый столбец sku типа TEXT (используйте ALTER TABLE).',
          hint: 'ALTER TABLE products ADD COLUMN sku TEXT;',
          mutating: true,
          verifyQuery: "SELECT name FROM pragma_table_info('products') ORDER BY cid;",
          solutionQuery: 'ALTER TABLE products ADD COLUMN sku TEXT;',
        },
        {
          id: 'ex3',
          prompt: 'Удалите таблицу categories вместе с её данными.',
          mutating: true,
          verifyQuery:
            "SELECT COUNT(*) AS categories_exists FROM sqlite_master WHERE type = 'table' AND name = 'categories';",
          solutionQuery: 'DROP TABLE categories;',
        },
      ],
    },
    {
      module: M6,
      id: 'views',
      title: '24. Представления: VIEW',
      intro: `
        <p><strong>Представление (VIEW)</strong> — это сохранённый под именем запрос. Обращаетесь к
        нему как к таблице, но данных внутри нет: при каждом обращении СУБД выполняет запрос,
        лежащий в основе. Поэтому представление всегда показывает актуальные данные.</p>

        <pre class="sql-code">CREATE VIEW order_totals AS
SELECT o.id AS order_id, o.order_date, SUM(oi.quantity * oi.unit_price) AS total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_date;

-- дальше пользуемся как обычной таблицей:
SELECT * FROM order_totals WHERE total > 100;</pre>

        <p><strong>Зачем это нужно:</strong></p>
        <ul>
          <li><strong>Спрятать сложность.</strong> Запрос с четырьмя JOIN пишется один раз, а дальше
          все (включая вас через месяц) используют простое <code>SELECT * FROM order_totals</code>.</li>
          <li><strong>Единая версия правды.</strong> Если «сумма заказа» считается в пяти отчётах,
          рано или поздно в одном из них формула разойдётся. Во view она одна.</li>
          <li><strong>Ограничение доступа.</strong> Можно дать права на представление, которое
          скрывает часть столбцов (например, паспортные данные), не давая доступа к самой таблице.</li>
        </ul>

        <p><code>DROP VIEW имя;</code> удаляет представление — сами данные при этом не страдают, ведь
        во view их и не было.</p>

        <p><strong>Можно ли писать в представление?</strong> В SQLite — нет, представления
        только для чтения (<code>INSERT</code> в view вернёт ошибку «cannot modify … because it is a
        view»); изменения проводят через триггеры <code>INSTEAD OF</code>. В MySQL и PostgreSQL
        простые представления (без группировок и агрегатов) бывают обновляемыми — в них можно и
        вставлять.</p>

        <p><strong>Важно про производительность:</strong> обычное представление ничего не ускоряет —
        это просто подстановка запроса. Если тяжёлый расчёт нужно закешировать, в PostgreSQL есть
        <strong>материализованные</strong> представления (<code>CREATE MATERIALIZED VIEW</code>),
        которые physically хранят результат и обновляются командой <code>REFRESH</code>. В MySQL и
        SQLite их нет — вместо этого делают обычную таблицу и наполняют её по расписанию.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Представления — удобное место
        для собственных проверок: один раз опишите view «подозрительные заказы» (без позиций, с
        отрицательной суммой, со ссылкой на удалённого клиента), и потом каждый регресс — это просто
        <code>SELECT COUNT(*) FROM suspicious_orders</code>, который должен быть равен нулю. Ещё
        полезно знать: если баг в отчёте, причина может быть не в приложении, а в устаревшей логике
        внутри view.</p>`,
      example: {
        query: `CREATE VIEW IF NOT EXISTS expensive_products AS
SELECT id, name, price FROM products WHERE price > 40;
SELECT * FROM expensive_products ORDER BY price DESC;`,
        note: 'Создаём представление с дорогими товарами и сразу читаем из него, как из таблицы.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt:
            "Создайте представление cheap_products, которое выбирает id, name и price товаров дешевле 10.",
          mutating: true,
          verifyQuery: 'SELECT id, name, price FROM cheap_products ORDER BY id;',
          solutionQuery:
            'CREATE VIEW cheap_products AS SELECT id, name, price FROM products WHERE price < 10;',
        },
        {
          id: 'ex2',
          prompt:
            'Создайте представление customer_orders, которое для каждого клиента показывает его name и количество заказов (столбцы: name, orders_count).',
          hint: 'Внутри — LEFT JOIN orders и GROUP BY, чтобы клиенты без заказов тоже попали.',
          mutating: true,
          verifyQuery: 'SELECT name, orders_count FROM customer_orders ORDER BY name;',
          solutionQuery: `CREATE VIEW customer_orders AS
SELECT c.name AS name, COUNT(o.id) AS orders_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;`,
        },
        {
          id: 'ex3',
          prompt:
            'Сначала создайте представление tmp_view (любой SELECT из products), а затем удалите его командой DROP VIEW.',
          mutating: true,
          verifyQuery:
            "SELECT COUNT(*) AS view_exists FROM sqlite_master WHERE type = 'view' AND name = 'tmp_view';",
          solutionQuery: `CREATE VIEW tmp_view AS SELECT id FROM products;
DROP VIEW tmp_view;`,
        },
      ],
    },
    {
      module: M6,
      id: 'indexes',
      title: '25. Индексы',
      intro: `
        <p>Без индекса, чтобы найти строки по условию, СУБД читает таблицу целиком — это называется
        <strong>полное сканирование</strong> (full scan). На 25 товарах незаметно, на 25 миллионах —
        катастрофа. <strong>Индекс</strong> — отдельная структура данных (обычно B-дерево), в которой
        значения столбца хранятся упорядоченно вместе со ссылками на строки. Работает точно как
        алфавитный указатель в конце книги: вместо чтения всех страниц вы находите нужное место
        сразу.</p>

        <pre class="sql-code">CREATE INDEX idx_products_price ON products(price);
DROP INDEX idx_products_price;</pre>

        <p><strong>Что индекс ускоряет:</strong> поиск в <code>WHERE</code>, соединения по
        <code>ON</code>, сортировку <code>ORDER BY</code> и поиск минимума/максимума.</p>

        <p><strong>Чем за это платим</strong> — и это главное, что нужно понимать: индексы
        <em>замедляют запись</em>. При каждом <code>INSERT</code>, <code>UPDATE</code>,
        <code>DELETE</code> базе нужно обновить не только таблицу, но и все её индексы. Плюс они
        занимают место на диске. Поэтому «повесить индексы на все столбцы» — плохая идея: индексы
        создают под конкретные, реально частые запросы.</p>

        <p><strong>Виды и тонкости:</strong></p>
        <ul>
          <li><strong>Автоматические индексы.</strong> Под <code>PRIMARY KEY</code> и
          <code>UNIQUE</code> индекс создаётся сам — отдельно делать не нужно.</li>
          <li><strong><code>UNIQUE INDEX</code></strong> не только ускоряет, но и запрещает
          дубликаты — то есть работает как ограничение.</li>
          <li><strong>Составной индекс</strong> по нескольким столбцам:
          <code>CREATE INDEX idx ON orders(customer_id, order_date);</code>. Порядок столбцов важен!
          Такой индекс поможет запросу с условием по <code>customer_id</code> (первый столбец) или по
          обоим, но <em>не</em> запросу только по <code>order_date</code>. Правило «левого
          префикса».</li>
          <li><strong>Когда индекс не сработает,</strong> даже если он есть: если столбец обёрнут в
          функцию (<code>WHERE LOWER(email) = '...'</code> — нужен индекс по выражению), или если
          шаблон начинается с <code>%</code> (<code>LIKE '%cable'</code> — искать не от начала строки
          индекс не умеет).</li>
        </ul>

        <p><strong>Как проверить, что индекс используется?</strong> Спросить у СУБД план выполнения
        запроса. В SQLite — <code>EXPLAIN QUERY PLAN</code>, в MySQL и PostgreSQL —
        <code>EXPLAIN</code> (и <code>EXPLAIN ANALYZE</code>, который ещё и выполняет запрос,
        показывая реальное время). В плане вы увидите либо <code>SCAN products</code> (полное
        сканирование — плохо для больших таблиц), либо <code>SEARCH products USING INDEX ...</code>
        (индекс задействован). Попробуйте выполнить пример ниже: он показывает план до и после
        создания индекса.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Это основа нагрузочного и
        performance-тестирования. Когда «страница открывается 8 секунд», ответ почти всегда находится
        в плане запроса: полное сканирование большой таблицы из-за отсутствующего индекса. Умея
        прочитать <code>EXPLAIN</code>, вы приносите разработчику не жалобу, а диагноз. Обратная
        сторона тоже ваша: после добавления индексов стоит перепроверить скорость массовых
        вставок.</p>`,
      example: {
        query: `EXPLAIN QUERY PLAN SELECT * FROM products WHERE price > 50;`,
        note: 'План до создания индекса: SCAN — полное сканирование таблицы. Создайте индекс в упражнении 1 и выполните этот пример снова: появится SEARCH ... USING INDEX.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Создайте индекс с именем idx_products_price по столбцу price таблицы products.',
          mutating: true,
          verifyQuery:
            "SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
          solutionQuery: 'CREATE INDEX idx_products_price ON products(price);',
        },
        {
          id: 'ex2',
          prompt:
            'Создайте составной индекс idx_orders_cust_date по двум столбцам таблицы orders: customer_id и order_date (в этом порядке).',
          mutating: true,
          verifyQuery:
            "SELECT name FROM pragma_index_info('idx_orders_cust_date') ORDER BY seqno;",
          solutionQuery: 'CREATE INDEX idx_orders_cust_date ON orders(customer_id, order_date);',
        },
        {
          id: 'ex3',
          prompt:
            'Создайте уникальный индекс idx_customers_email по столбцу email таблицы customers (он же запретит дубликаты email).',
          hint: 'CREATE UNIQUE INDEX ...',
          mutating: true,
          verifyQuery:
            "SELECT name, \"unique\" FROM pragma_index_list('customers') WHERE name = 'idx_customers_email';",
          solutionQuery: 'CREATE UNIQUE INDEX idx_customers_email ON customers(email);',
        },
      ],
    },
    {
      module: M6,
      id: 'constraints',
      title: '26. Ограничения столбцов: Constraints',
      intro: `
        <p><strong>Ограничения</strong> — это правила, которые база проверяет сама при каждой записи.
        Их стоит воспринимать как встроенные тесты, работающие всегда: даже если в приложении есть
        баг или кто-то правит данные вручную, ограничение не даст записать мусор.</p>

        <ul>
          <li><strong><code>PRIMARY KEY</code></strong> — уникальный идентификатор строки. Не
          допускает дубликатов и NULL. Может быть составным:
          <code>PRIMARY KEY (order_id, product_id)</code>.</li>
          <li><strong><code>NOT NULL</code></strong> — поле обязательно к заполнению.</li>
          <li><strong><code>UNIQUE</code></strong> — значения не повторяются (но NULL, как «неизвестно»,
          обычно допускается многократно — распространённый сюрприз).</li>
          <li><strong><code>DEFAULT значение</code></strong> — что подставить, если при
          <code>INSERT</code> столбец не указан.</li>
          <li><strong><code>CHECK (условие)</code></strong> — произвольная проверка:
          <code>CHECK (price &gt;= 0)</code>, <code>CHECK (status IN ('new', 'paid'))</code>.
          Мощнейшая и при этом самая недоиспользуемая вещь.</li>
          <li><strong><code>FOREIGN KEY</code></strong> — значение должно существовать в другой
          таблице. Именно это ограничение не даёт появиться заказу «ничьего» клиента.</li>
        </ul>

        <pre class="sql-code">CREATE TABLE employees (
  id      INTEGER PRIMARY KEY,
  email   TEXT NOT NULL UNIQUE,
  age     INTEGER CHECK (age >= 18),
  city    TEXT DEFAULT 'не указан',
  dept_id INTEGER REFERENCES departments(id) ON DELETE RESTRICT
);</pre>

        <p><strong>Что делать при удалении родительской строки</strong> — задаётся у внешнего ключа:</p>
        <ul>
          <li><code>ON DELETE RESTRICT</code> (или <code>NO ACTION</code>) — запретить удаление, пока
          есть ссылающиеся строки. Поведение по умолчанию.</li>
          <li><code>ON DELETE CASCADE</code> — удалить и связанные строки. Удобно (удалили заказ —
          ушли его позиции), но опасно: каскад может уйти дальше, чем вы ожидали.</li>
          <li><code>ON DELETE SET NULL</code> — обнулить ссылку, оставив саму строку.</li>
        </ul>

        <p><strong>Важнейшая особенность SQLite:</strong> проверка внешних ключей по умолчанию
        <strong>выключена</strong>! Объявить <code>REFERENCES</code> можно, но пока не выполнено
        <code>PRAGMA foreign_keys = ON;</code> (для каждого соединения!), база спокойно позволит
        сослаться на несуществующую строку. Это классический источник недоумения «а почему FK не
        работает». В MySQL (движок InnoDB) и PostgreSQL проверка включена всегда.</p>

        <p>Нарушение ограничения — это не «падение», а нормальная защитная реакция: запрос
        отклоняется с внятной ошибкой (<code>UNIQUE constraint failed: ...</code>), а данные
        остаются целыми.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Ограничения — это ваш союзник и
        одновременно объект тестирования. Проверять нужно оба слоя: что форма не даёт ввести
        отрицательную цену <em>и</em> что база не примет её, даже если запрос прислать напрямую (мимо
        UI). Отсутствие ограничений в схеме — само по себе находка для баг-репорта: рано или поздно
        в такой таблице появятся дубли и «висячие» ссылки. А знание про выключенные по умолчанию FK в
        SQLite объясняет, почему целостность «ломается только на тестовом стенде».</p>`,
      example: {
        query: `CREATE TABLE IF NOT EXISTS employees (
  id    INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  age   INTEGER CHECK (age >= 18),
  city  TEXT DEFAULT 'не указан'
);
INSERT INTO employees (email, age) VALUES ('ivan@example.com', 30);
SELECT * FROM employees;`,
        note: 'city не указывали — подставилось значение из DEFAULT. Попробуйте в песочнице вставить возраст 10 или второй раз тот же email: база отклонит запрос с ошибкой CHECK / UNIQUE.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt:
            "Создайте таблицу employees со столбцами: id (INTEGER PRIMARY KEY), email (TEXT NOT NULL UNIQUE), age (INTEGER с проверкой CHECK, что age >= 18), city (TEXT со значением по умолчанию 'не указан').",
          mutating: true,
          verifyQuery:
            "SELECT name, type, \"notnull\", dflt_value FROM pragma_table_info('employees') ORDER BY cid;",
          solutionQuery: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  age INTEGER CHECK (age >= 18),
  city TEXT DEFAULT 'не указан'
);`,
        },
        {
          id: 'ex2',
          prompt:
            "Создайте таблицу tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT DEFAULT 'new') и вставьте в неё одну задачу с title = 'Проверить оплату', не указывая status — он должен подставиться из DEFAULT.",
          mutating: true,
          verifyQuery: 'SELECT id, title, status FROM tasks ORDER BY id;',
          solutionQuery: `CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT DEFAULT 'new');
INSERT INTO tasks (title) VALUES ('Проверить оплату');`,
        },
        {
          id: 'ex3',
          prompt:
            'Включите проверку внешних ключей (PRAGMA foreign_keys = ON), затем создайте таблицу reviews (id INTEGER PRIMARY KEY, product_id INTEGER, ссылающийся на products(id), text TEXT) и вставьте отзыв на существующий товар с id = 1.',
          hint: 'product_id INTEGER REFERENCES products(id)',
          mutating: true,
          verifyQuery: 'SELECT id, product_id, text FROM reviews ORDER BY id;',
          solutionQuery: `PRAGMA foreign_keys = ON;
CREATE TABLE reviews (id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id), text TEXT);
INSERT INTO reviews (id, product_id, text) VALUES (1, 1, 'Отличная книга');`,
        },
      ],
    },
  ];

  return LESSONS;
});
