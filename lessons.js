// Единый источник контента учебника: модули, объяснения, примеры и упражнения.
// Работает и в браузере (window.LESSONS), и в Node (module.exports) —
// используется тестом test/validate.js, который прогоняет все SQL-запросы
// из этого файла против schema.sql и проверяет, что они вообще выполняются.
//
// Формат упражнения:
//   id            — уникальный id внутри урока
//   prompt        — текст задания
//   solutionQuery — эталонный запрос (выполняется на лету, задаёт "правильный" результат)
//   hint          — необязательная подсказка
//   orderMatters  — если true, порядок строк в ответе учитывается при проверке
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
  const LESSONS = [
    {
      id: 'select-basics',
      title: '1. Основы SELECT',
      intro: `
        <p>Реляционная база данных хранит информацию в <strong>таблицах</strong> — по сути это те же
        таблицы, что вы видите в Excel: строки (записи) и столбцы (поля). Например, таблица
        <code>customers</code> хранит по одной строке на каждого клиента, а столбцы — это его имя,
        email, город и т.д. Схему всех таблиц этой базы всегда можно посмотреть в панели «Схема БД»
        справа, а живые данные — на вкладке «📋 Данные таблиц» в списке слева.</p>

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
          (урок 6) в результате оказываются два столбца с одинаковым именем.</li>
          <li><code>SELECT DISTINCT col</code> — убрать повторяющиеся значения из результата.</li>
        </ul>

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
      id: 'where-filtering',
      title: '2. Фильтрация: WHERE',
      intro: `
        <p><code>WHERE</code> идёт сразу после <code>FROM</code> и отбирает только те строки, для
        которых условие истинно. Все остальные строки просто не попадают в результат — в исходной
        таблице ничего не меняется.</p>

        <pre class="sql-code">SELECT name, price
FROM products
WHERE price > 50;   -- оставить только строки, где price больше 50</pre>

        <p>Операторы сравнения: <code>= != &lt; &gt; &lt;= &gt;=</code> (обратите внимание: «не равно» —
        это <code>!=</code> или <code>&lt;&gt;</code>, а не <code>=!</code>). Строковые значения
        обязательно берутся в одинарные кавычки: <code>WHERE city = 'Chicago'</code> — без кавычек SQL
        решит, что <code>Chicago</code> это имя столбца или таблицы, и упадёт с ошибкой.</p>

        <ul>
          <li><code>AND</code> / <code>OR</code> / <code>NOT</code> — комбинируют условия. При
          смешивании AND и OR используйте скобки: <code>WHERE (city = 'A' OR city = 'B') AND price &gt; 10</code> —
          без скобок порядок вычисления может дать не тот результат, что вы ожидали.</li>
          <li><code>BETWEEN x AND y</code> — включает обе границы (<code>x &lt;= col AND col &lt;= y</code>).</li>
          <li><code>IN (a, b, c)</code> — короткая запись «равно одному из списка» вместо цепочки
          <code>OR</code>.</li>
          <li><code>LIKE '%слово%'</code> — поиск подстроки; <code>%</code> означает «любое количество
          любых символов» (в том числе ноль), <code>_</code> — ровно один любой символ.</li>
          <li><code>IS NULL</code> / <code>IS NOT NULL</code> — проверка на отсутствие значения.
          <strong>Частая ловушка новичков:</strong> <code>WHERE city = NULL</code> никогда не сработает
          — в SQL NULL означает «неизвестно», а «неизвестно = неизвестно» тоже неизвестно, а не true.
          Нужно именно <code>IS NULL</code>.</li>
        </ul>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> WHERE — то, чем вы будете
        пользоваться каждый день, чтобы найти «свои» тестовые данные среди тысяч чужих строк:
        конкретного пользователя по email, заказы за вчерашний день, записи с определённым статусом
        ошибки и т.п.</p>`,
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
          prompt: "Найдите товары (name), название которых содержит слово 'Set'.",
          solutionQuery: "SELECT name FROM products WHERE name LIKE '%Set%';",
        },
        {
          id: 'ex4',
          prompt: 'Найдите клиентов (name), у которых не указан город.',
          hint: 'city IS NULL, а не city = NULL.',
          solutionQuery: 'SELECT name FROM customers WHERE city IS NULL;',
        },
      ],
    },
    {
      id: 'order-limit',
      title: '3. Сортировка и ограничение: ORDER BY, LIMIT',
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
          <li><code>ORDER BY col1, col2</code> — можно сортировать сразу по нескольким столбцам:
          сначала по col1, а строки с одинаковым col1 — по col2.</li>
          <li><code>LIMIT n</code> — вернуть не больше n строк. Полезно и для «топ-5», и просто чтобы
          не вывалить миллион строк на экран, пока вы «прощупываете» незнакомую таблицу.</li>
          <li><code>OFFSET k</code> — пропустить первые k строк результата (обычно используется вместе
          с LIMIT для постраничной выдачи — «страница 2» это как раз <code>LIMIT 10 OFFSET 10</code>).</li>
        </ul>

        <p>В этом уроке порядок строк в ответе имеет значение — автопроверка сравнивает вывод
        построчно, а не как «набор» строк, как в остальных уроках.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Если вы проверяете сортировку
        на UI («список должен быть отсортирован по дате, сначала новые») — ORDER BY даёт вам
        «эталонный» порядок из базы, чтобы сравнить его с тем, что реально показывает интерфейс.</p>`,
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
      id: 'aggregates',
      title: '4. Агрегатные функции: COUNT, SUM, AVG, MIN, MAX',
      intro: `
        <p>До сих пор каждый запрос возвращал по одной строке результата на каждую строку таблицы.
        Агрегатные функции — это другое: они берут <strong>набор</strong> строк и «сворачивают» его в
        <strong>одно</strong> число.</p>

        <pre class="sql-code">SELECT COUNT(*) FROM products;   -- одно число: сколько всего строк в таблице</pre>

        <ul>
          <li><code>COUNT(*)</code> — количество строк. <code>COUNT(col)</code> — количество строк,
          где <code>col</code> не NULL (это не то же самое, что COUNT(*), если в столбце бывают
          пропуски).</li>
          <li><code>SUM(col)</code> — сумма значений.</li>
          <li><code>AVG(col)</code> — среднее арифметическое.</li>
          <li><code>MIN(col)</code> / <code>MAX(col)</code> — минимальное / максимальное значение.</li>
        </ul>

        <p><strong>Частая ловушка:</strong> нельзя в одном SELECT просто смешать агрегатную функцию с
        обычным столбцом без группировки — <code>SELECT name, COUNT(*) FROM products</code> без
        <code>GROUP BY</code> либо даст ошибку, либо (не во всех СУБД) выдаст бессмысленный
        результат. Как правильно считать агрегаты «по группам» — в следующем уроке.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Быстрая проверка на
        «здравый смысл» после теста: «в таблице заказов должно быть ровно 0 строк со статусом
        error» — <code>SELECT COUNT(*) FROM orders WHERE status = 'error'</code>, и сразу видно,
        прошёл тест или нет.</p>`,
      example: {
        query: 'SELECT COUNT(*) AS total_products, AVG(price) AS avg_price FROM products;',
        note: 'Количество товаров и средняя цена по всей таблице.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Посчитайте общее количество заказов в таблице orders.',
          solutionQuery: 'SELECT COUNT(*) FROM orders;',
        },
        {
          id: 'ex2',
          prompt: 'Найдите самую высокую и самую низкую цену товара.',
          solutionQuery: 'SELECT MAX(price) AS max_price, MIN(price) AS min_price FROM products;',
        },
        {
          id: 'ex3',
          prompt: 'Посчитайте суммарное количество проданных единиц товара (SUM по quantity в order_items).',
          solutionQuery: 'SELECT SUM(quantity) FROM order_items;',
        },
      ],
    },
    {
      id: 'group-by',
      title: '5. Группировка: GROUP BY и HAVING',
      intro: `
        <p><code>GROUP BY col</code> объединяет строки с одинаковым значением <code>col</code> в
        одну группу — и если рядом стоит агрегатная функция (<code>COUNT</code>, <code>SUM</code>,
        ...), она считается отдельно <strong>для каждой группы</strong>, а не по всей таблице сразу.</p>

        <pre class="sql-code">SELECT category_id, COUNT(*) AS cnt
FROM products
GROUP BY category_id;
-- результат: одна строка на каждую category_id, cnt = сколько товаров в этой категории</pre>

        <p><strong>Ключевое правило:</strong> в SELECT рядом с GROUP BY можно упоминать только те
        столбцы, которые либо перечислены в GROUP BY, либо обёрнуты в агрегатную функцию. Лишний
        «свободный» столбец в SELECT — источник тонких, трудноуловимых багов, если полагаться на то,
        какое случайное значение из группы возьмёт СУБД.</p>

        <p><code>HAVING условие</code> — фильтр, но, в отличие от <code>WHERE</code>, он применяется
        <strong>после</strong> группировки, к уже посчитанным агрегатам. Поэтому в HAVING можно писать
        <code>HAVING COUNT(*) &gt; 5</code>, а в WHERE — нельзя (агрегаты там ещё не посчитаны).
        Порядок выполнения запроса, если упрощённо: сначала <code>WHERE</code> (фильтр строк) →
        потом <code>GROUP BY</code> (группировка) → потом <code>HAVING</code> (фильтр групп).</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Отличный инструмент для поиска
        аномалий в тестовых данных: «показать все email, которые встречаются в таблице users больше
        одного раза» — это ровно <code>GROUP BY email HAVING COUNT(*) &gt; 1</code>, классический
        способ найти дубликаты.</p>`,
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
      ],
    },
    {
      id: 'joins',
      title: '6. Соединение таблиц: JOIN',
      intro: `
        <p>Реальные базы данных почти никогда не хранят всё в одной таблице — данные разбиты на
        связанные таблицы (это называется <strong>нормализация</strong>), чтобы не дублировать
        информацию. Например, имя клиента хранится один раз в <code>customers</code>, а не
        повторяется в каждой строке <code>orders</code>. Связь идёт через id: у каждого заказа есть
        <code>customer_id</code> — «внешний ключ», ссылка на <code>customers.id</code>.</p>

        <p><code>JOIN</code> (полное имя — <code>INNER JOIN</code>) склеивает строки двух таблиц там,
        где условие в <code>ON</code> совпадает:</p>

        <pre class="sql-code">SELECT o.id, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id;
-- o и c здесь — алиасы (короткие имена) таблиц orders и customers,
-- чтобы не писать полностью orders.customer_id = customers.id</pre>

        <p><strong>Важно:</strong> INNER JOIN покажет только те строки, для которых пара
        <strong>нашлась</strong> в обеих таблицах. Если у клиента нет ни одного заказа — такой
        клиент в результате <code>orders JOIN customers</code> просто не появится. Для вопросов вида
        «у кого <em>нет</em> ...» нужен <code>LEFT JOIN</code>: он сохраняет вообще все строки левой
        (первой) таблицы, а если пары справа не нашлось — столбцы правой таблицы заполняются NULL.
        Тогда «отсутствие заказов» ищется через <code>WHERE right_table.id IS NULL</code>.</p>

        <p>Ещё одна вещь, к которой стоит привыкнуть: если у одной строки слева находится
        <em>несколько</em> совпадений справа (например, у заказа несколько товаров), JOIN «размножит»
        строку — в результате будет несколько строк с одинаковым order_id, по одной на каждый товар.
        Это не баг, а ожидаемое поведение — но именно оно чаще всего приводит новичков к случайно
        задвоенным COUNT/SUM, если агрегировать после такого JOIN не подумав.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> JOIN — то, без чего почти
        невозможно проверить сложный сценарий в БД: «после оформления заказа должна появиться
        строка в orders, связанная с правильным клиентом и с правильными order_items» — это ровно
        JOIN нескольких таблиц и сверка результата с ожидаемым.</p>`,
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
          prompt: 'Найдите клиентов (name), у которых ещё нет ни одного заказа, с помощью LEFT JOIN.',
          hint: 'LEFT JOIN orders ... WHERE orders.id IS NULL.',
          solutionQuery: 'SELECT cu.name FROM customers cu LEFT JOIN orders o ON o.customer_id = cu.id WHERE o.id IS NULL;',
        },
        {
          id: 'ex3',
          prompt: 'Соединив order_items, orders, customers и products, выведите order_id, имя клиента и название товара для каждой позиции заказа.',
          solutionQuery: `SELECT oi.order_id, cu.name AS customer_name, p.name AS product_name
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN customers cu ON o.customer_id = cu.id
JOIN products p ON oi.product_id = p.id;`,
        },
      ],
    },
    {
      id: 'subqueries',
      title: '7. Подзапросы',
      intro: `
        <p>Подзапрос (subquery) — это обычный <code>SELECT</code>, вложенный внутрь другого запроса и
        взятый в скобки. СУБД сначала (концептуально) выполняет внутренний запрос, а потом использует
        его результат во внешнем.</p>

        <pre class="sql-code">SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);
-- внутренний SELECT вернёт одно число (среднюю цену),
-- внешний WHERE сравнит с ним каждую строку</pre>

        <p>Виды подзапросов, которые вам встретятся:</p>
        <ul>
          <li><strong>Скалярный</strong> — возвращает ровно одно значение (одна строка, один столбец).
          Его можно использовать везде, где ожидается одно значение: после <code>=</code>,
          <code>&gt;</code>, или прямо в списке <code>SELECT</code>.</li>
          <li><strong>В <code>IN (...)</code> / <code>NOT IN (...)</code></strong> — возвращает список
          значений (один столбец, много строк): <code>WHERE id IN (SELECT customer_id FROM orders)</code>
          значит «id из списка тех, кто хоть раз заказывал».</li>
        </ul>

        <p><strong>Осторожно с NOT IN:</strong> если подзапрос в <code>NOT IN (...)</code> может
        вернуть хотя бы одну строку с NULL — весь <code>NOT IN</code> перестаёт находить
        <em>что-либо</em> (из-за правил трёхзначной логики с NULL). Это известная ловушка; в таких
        случаях часто безопаснее переписать через <code>NOT EXISTS</code>.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Подзапросы отлично подходят для
        проверок вида «найти все заказы клиентов, у которых указан несуществующий city» или
        «убедиться, что не осталось orphan-записей» — сравнение одной таблицы относительно данных из
        другой, когда вам нужен только факт «есть/нет».</p>`,
      example: {
        query: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);',
        note: 'Товары дороже средней цены по всем товарам.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: 'Найдите клиентов (name), которые сделали хотя бы один заказ, с помощью подзапроса с IN.',
          solutionQuery: 'SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders);',
        },
        {
          id: 'ex2',
          prompt: 'Найдите товары (name), которые никогда не были куплены (ни разу не встречаются в order_items).',
          hint: 'NOT IN (SELECT product_id FROM order_items).',
          solutionQuery: 'SELECT name FROM products WHERE id NOT IN (SELECT product_id FROM order_items);',
        },
        {
          id: 'ex3',
          prompt: 'Для каждого заказа выведите его id и сумму заказа (SUM(quantity*unit_price) по его order_items), используя скалярный подзапрос в SELECT.',
          solutionQuery: `SELECT o.id,
  (SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id) AS order_total
FROM orders o;`,
        },
      ],
    },
    {
      id: 'cte',
      title: '8. Common Table Expressions: WITH',
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
SELECT * FROM order_totals WHERE total > 100;
-- сначала считаем "промежуточную таблицу" order_totals,
-- потом работаем с ней как с обычной таблицей</pre>

        <p>По сути CTE делает то же самое, что можно было бы сделать вложенным подзапросом в FROM
        (<code>FROM (SELECT ...) AS order_totals</code>) — но читается сверху вниз, как «сначала
        посчитай это, назови это так, теперь используй это», гораздо ближе к тому, как человек
        рассуждает о задаче, а не к тому, как СУБД её выполняет. В одном запросе можно объявить
        несколько CTE через запятую и ссылаться из одного на другой.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Когда проверка требует
        нескольких шагов расчёта («сначала посчитать сумму по каждому заказу, потом найти заказы
        дороже среднего») — CTE позволяет писать и отлаживать такой запрос по шагам, а не городить
        один нечитаемый подзапрос в подзапросе.</p>`,
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
      ],
    },
    {
      id: 'window-functions',
      title: '9. Оконные функции',
      intro: `
        <p>Главное отличие от GROUP BY: агрегат в GROUP BY <strong>схлопывает</strong> много строк в
        одну на группу — детали теряются. Оконная функция (<code>... OVER (...)</code>) считает
        значение, «глядя» на группу связанных строк («окно»), но при этом <strong>сохраняет каждую
        исходную строку</strong> в результате. Это позволяет, например, показать каждый товар и рядом
        — его ранг внутри категории, не теряя остальные столбцы товара.</p>

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
          <li><code>ROW_NUMBER()</code> — просто порядковый номер 1, 2, 3, ... без повторов, даже
          если значения одинаковые.</li>
          <li><code>RANK()</code> — тоже ранг, но одинаковые значения получают одинаковый ранг, а
          следующий ранг «перескакивает» (1, 1, 3, 4, ...).</li>
          <li><code>SUM(col) OVER (ORDER BY col2)</code> без PARTITION BY — накопительная (running)
          сумма: для каждой строки — сумма её и всех предыдущих по заданному порядку.</li>
        </ul>

        <p>Тема считается продвинутой — если что-то не укладывается в голове с первого раза, это
        нормально; лучший способ разобраться — менять пример по кусочкам (убрать PARTITION BY,
        поменять ASC на DESC) и смотреть, что меняется в результате.</p>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> Пригодится не так часто, как
        предыдущие темы, но выручает в задачах вида «найти самую последнюю запись по каждому
        пользователю» или «проверить, что порядковые номера в выгрузке не имеют дыр/дублей» — то,
        что через обычный GROUP BY выразить неудобно или вовсе невозможно.</p>`,
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
          prompt: 'Для каждого товара выведите name, category_id и его номер по возрастанию цены внутри категории (ROW_NUMBER, PARTITION BY category_id ORDER BY price ASC).',
          solutionQuery: 'SELECT name, category_id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price ASC) AS rn FROM products;',
        },
        {
          id: 'ex2',
          prompt: 'Посчитайте сумму каждого заказа, а затем выведите order_id, order_date и накопительную (running) сумму по всем заказам, упорядоченным по order_date.',
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
      id: 'case-functions',
      title: '10. CASE и функции: строки, даты, округление',
      intro: `
        <p><code>CASE</code> — это if/else прямо внутри SQL-запроса, для одного столбца результата:</p>

        <pre class="sql-code">SELECT name,
  CASE
    WHEN price &lt; 15 THEN 'дешёвый'
    WHEN price &lt; 40 THEN 'средний'
    ELSE 'дорогой'
  END AS price_tier
FROM products;
-- условия проверяются по порядку сверху вниз, срабатывает первое подходящее;
-- ELSE — что делать, если ни одно WHEN не подошло (можно опустить — тогда будет NULL)</pre>

        <p>Ещё несколько функций SQLite, которые часто пригождаются:</p>
        <ul>
          <li><code>strftime('%Y', date_col)</code> — достать часть даты (год); есть и другие
          форматы: <code>%m</code> — месяц, <code>%d</code> — день, <code>%Y-%m</code> — год и месяц
          вместе.</li>
          <li><code>ROUND(x)</code> / <code>ROUND(x, n)</code> — округление (до n знаков после
          запятой).</li>
          <li><code>UPPER(s)</code> / <code>LOWER(s)</code> — регистр строки.</li>
          <li><code>LENGTH(s)</code> — длина строки.</li>
          <li><code>SUBSTR(s, start, len)</code> — вырезать подстроку.</li>
          <li><code>col1 || col2</code> — оператор конкатенации строк (склеить два значения в
          одно).</li>
        </ul>

        <p class="qa-note">🔍 <strong>Зачем это тестировщику:</strong> CASE удобен, чтобы превратить
        сырые данные в человекочитаемый отчёт прямо в запросе — например, разметить тестовые записи
        как «ожидалось» / «не совпало» без выгрузки в Excel. Функции даты и строк — постоянный
        инструмент, когда нужно проверить формат данных (например, что дата создания записи
        попадает в нужный диапазон, или что значение в поле похоже на email).</p>`,
      example: {
        query: `SELECT name, price,
  CASE
    WHEN price < 15 THEN 'дешёвый'
    WHEN price < 40 THEN 'средний'
    ELSE 'дорогой'
  END AS price_tier
FROM products
ORDER BY price;`,
        note: 'Категория цены для каждого товара.',
      },
      exercises: [
        {
          id: 'ex1',
          prompt: "Для каждого клиента выведите name и год регистрации (используйте strftime('%Y', signup_date)).",
          solutionQuery: "SELECT name, strftime('%Y', signup_date) AS signup_year FROM customers;",
        },
        {
          id: 'ex2',
          prompt: 'Выведите name и price товара, округлив цену до целого числа.',
          solutionQuery: 'SELECT name, ROUND(price) AS rounded_price FROM products;',
        },
        {
          id: 'ex3',
          prompt: "С помощью CASE выведите name клиента и метку 'указан' или 'не указан' в зависимости от того, заполнено ли поле city.",
          solutionQuery: "SELECT name, CASE WHEN city IS NULL THEN 'не указан' ELSE 'указан' END AS city_status FROM customers;",
        },
      ],
    },
  ];

  return LESSONS;
});
