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
        <p><code>SELECT</code> — главная команда для чтения данных. После <code>SELECT</code> перечисляются
        столбцы, которые нужно получить, после <code>FROM</code> — таблица-источник.</p>
        <ul>
          <li><code>SELECT *</code> — вернуть все столбцы.</li>
          <li><code>SELECT col AS alias</code> — переименовать столбец в выводе.</li>
          <li><code>SELECT DISTINCT col</code> — убрать повторяющиеся значения.</li>
        </ul>`,
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
        <p><code>WHERE</code> отбирает строки по условию. Основные операторы:
        <code>=, !=, &lt;, &gt;, BETWEEN, IN, LIKE, IS NULL</code>, а также
        логические <code>AND</code>, <code>OR</code>, <code>NOT</code>.</p>
        <p><code>LIKE '%слово%'</code> ищет подстроку, <code>%</code> — любое количество символов.</p>`,
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
        <p><code>ORDER BY col ASC|DESC</code> сортирует результат. <code>LIMIT n</code> оставляет
        только первые n строк, <code>OFFSET k</code> пропускает первые k строк.</p>
        <p>В этом уроке порядок строк в ответе имеет значение — проверка сравнивает вывод построчно.</p>`,
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
        <p>Агрегатные функции сворачивают набор строк в одно значение:
        <code>COUNT(*)</code> — количество строк, <code>SUM</code> — сумма,
        <code>AVG</code> — среднее, <code>MIN</code>/<code>MAX</code> — минимум/максимум.</p>`,
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
        <p><code>GROUP BY col</code> объединяет строки с одинаковым значением col в группы, и агрегатные
        функции считаются отдельно для каждой группы. <code>HAVING</code> — это то же, что <code>WHERE</code>,
        но фильтрует уже посчитанные группы (а не исходные строки).</p>`,
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
        <p><code>JOIN</code> (он же <code>INNER JOIN</code>) соединяет строки двух таблиц по условию
        в <code>ON</code>. <code>LEFT JOIN</code> дополнительно сохраняет все строки левой таблицы,
        даже если для них не нашлось пары — недостающие столбцы правой таблицы будут NULL.
        Это удобно для вопросов вида «у кого нет...».</p>`,
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
        <p>Подзапрос — это <code>SELECT</code> внутри другого запроса. Он может стоять в <code>WHERE</code>
        (например, с <code>IN</code> или <code>NOT IN</code>), а может возвращать одно значение и стоять
        прямо в списке <code>SELECT</code> (скалярный подзапрос).</p>`,
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
        <p><code>WITH name AS (SELECT ...) SELECT ... FROM name</code> — CTE даёт временный запрос
        имя, на которое можно ссылаться дальше, как на обычную таблицу. Это делает сложные запросы
        читаемыми: сначала считаем промежуточный результат, потом работаем с ним.</p>`,
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
        <p>Оконные функции (<code>... OVER (...)</code>) считают значение для каждой строки, глядя на
        группу связанных строк ("окно"), но, в отличие от GROUP BY, не схлопывают строки в одну.
        <code>PARTITION BY</code> делит данные на группы, <code>ORDER BY</code> внутри <code>OVER</code>
        задаёт порядок внутри окна. <code>ROW_NUMBER()</code> — порядковый номер, <code>RANK()</code> — ранг
        с учётом повторов, <code>SUM(...) OVER (ORDER BY ...)</code> — накопительная сумма.</p>`,
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
        <p><code>CASE WHEN условие THEN значение ... ELSE значение END</code> — это if/else внутри SQL-запроса.
        Полезные функции SQLite: <code>strftime('%Y', date_col)</code> — часть даты, <code>ROUND(x)</code> —
        округление, <code>UPPER/LOWER</code>, <code>LENGTH</code>, <code>SUBSTR</code> — строки.</p>`,
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
