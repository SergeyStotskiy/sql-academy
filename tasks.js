// Задания тренажёра: 15 лёгких, 20 средних, 10 сложных.
// Работает и в браузере (window.TASKS), и в Node (module.exports) — test/validate.js
// прогоняет каждое solutionQuery против schema.sql.
//
// Поля задания:
//   id            — уникальный идентификатор (e*, m*, h*)
//   level         — 'easy' | 'medium' | 'hard'
//   title         — короткое название
//   prompt        — формулировка задания (HTML)
//   columns       — что должно быть в результате
//   hints         — подсказки: от направления мысли к конкретной конструкции
//   explanation   — разбор решения (HTML), показывается вместе с ответом
//   solutionQuery — эталонный запрос
//   orderMatters  — если true, порядок строк важен при проверке

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TASKS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const TASKS = [
    // ==================== ЛЁГКИЕ (15) ====================
    {
      id: 'e1',
      level: 'easy',
      title: 'Список клиентов',
      prompt: 'Выведите имя и email всех клиентов магазина.',
      columns: 'name, email',
      hints: [
        'Нужна одна таблица — customers. Фильтрация не требуется.',
        'Перечислите нужные столбцы после SELECT: SELECT name, email FROM ...',
      ],
      explanation:
        'Простейший запрос: столбцы после <code>SELECT</code>, таблица после <code>FROM</code>. Перечислять столбцы явно лучше, чем писать <code>SELECT *</code>: сразу видно, что именно вы проверяете, и запрос не изменится молча, если в таблицу добавят поле.',
      solutionQuery: 'SELECT name, email FROM customers;',
    },
    {
      id: 'e2',
      level: 'easy',
      title: 'Города без повторов',
      prompt:
        'Выведите список городов, в которых живут клиенты. Каждый город должен встретиться один раз, клиентов без указанного города учитывать не нужно.',
      columns: 'city',
      hints: [
        'Повторы убирает DISTINCT. Отсутствие города — это NULL.',
        'Проверка на NULL пишется как city IS NOT NULL (а не city != NULL).',
      ],
      explanation:
        '<code>DISTINCT</code> убирает дубликаты, а <code>IS NOT NULL</code> отбрасывает клиентов без города. Сравнение <code>city != NULL</code> здесь не сработало бы: любое сравнение с NULL даёт «неизвестно», а не «истину».',
      solutionQuery: 'SELECT DISTINCT city FROM customers WHERE city IS NOT NULL;',
    },
    {
      id: 'e3',
      level: 'easy',
      title: 'Товары дороже 30',
      prompt: 'Найдите все товары дороже 30. Выведите название и цену.',
      columns: 'name, price',
      hints: ['Понадобится WHERE с оператором сравнения.', 'WHERE price > 30'],
      explanation:
        '<code>WHERE</code> оставляет только строки, для которых условие истинно. Обратите внимание на строгое «больше»: товар ровно за 30 в результат не попадёт.',
      solutionQuery: 'SELECT name, price FROM products WHERE price > 30;',
    },
    {
      id: 'e4',
      level: 'easy',
      title: 'Клиенты из Нью-Йорка',
      prompt: "Найдите всех клиентов из города 'New York'. Выведите их имена.",
      columns: 'name',
      hints: [
        'Строковое значение в условии берётся в одинарные кавычки.',
        "WHERE city = 'New York'",
      ],
      explanation:
        'Строки в SQL пишутся в <em>одинарных</em> кавычках. Двойные означают имя столбца или таблицы, поэтому <code>city = "New York"</code> — типичная ошибка новичка.',
      solutionQuery: "SELECT name FROM customers WHERE city = 'New York';",
    },
    {
      id: 'e5',
      level: 'easy',
      title: 'Клиенты без города',
      prompt: 'Найдите клиентов, у которых не заполнено поле города. Выведите имя и email.',
      columns: 'name, email',
      hints: ['Незаполненное поле — это NULL.', 'WHERE city IS NULL'],
      explanation:
        'Готовая проверка полноты данных. Если по требованиям город обязателен, результат такого запроса должен быть пустым — а если нет, у вас на руках баг-репорт с конкретными записями.',
      solutionQuery: 'SELECT name, email FROM customers WHERE city IS NULL;',
    },
    {
      id: 'e6',
      level: 'easy',
      title: 'Топ-5 дорогих товаров',
      prompt: 'Выведите 5 самых дорогих товаров: название и цену, начиная с самого дорогого.',
      columns: 'name, price (порядок строк важен)',
      orderMatters: true,
      hints: ['Сортировка по убыванию плюс ограничение количества строк.', 'ORDER BY price DESC LIMIT 5'],
      explanation:
        'Классический «топ-N»: сначала сортируем по убыванию (<code>DESC</code>), потом обрезаем <code>LIMIT</code>. Порядок важен — <code>LIMIT</code> применяется уже к отсортированному набору.',
      solutionQuery: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;',
    },
    {
      id: 'e7',
      level: 'easy',
      title: 'Сколько всего заказов',
      prompt: 'Посчитайте общее количество заказов в базе (одно число).',
      columns: 'одно число',
      hints: ['Нужна агрегатная функция подсчёта строк.', 'SELECT COUNT(*) FROM orders'],
      explanation:
        'Агрегатная функция «сворачивает» все строки в одно значение. <code>COUNT(*)</code> считает строки независимо от того, есть ли в них NULL.',
      solutionQuery: 'SELECT COUNT(*) FROM orders;',
    },
    {
      id: 'e8',
      level: 'easy',
      title: 'У скольких клиентов заполнен город',
      prompt: 'Посчитайте, у скольких клиентов заполнено поле city (одно число).',
      columns: 'одно число',
      hints: [
        'COUNT(*) считает все строки, а COUNT(столбец) ведёт себя иначе.',
        'COUNT(city) не учитывает строки, где city равен NULL.',
      ],
      explanation:
        'Разница между <code>COUNT(*)</code> и <code>COUNT(city)</code> — это ровно количество пропусков в столбце. Однострочный тест на полноту данных после импорта или миграции.',
      solutionQuery: 'SELECT COUNT(city) FROM customers;',
    },
    {
      id: 'e9',
      level: 'easy',
      title: 'Средняя цена товара',
      prompt: 'Посчитайте среднюю цену товара, округлив результат до 2 знаков после запятой.',
      columns: 'одно число',
      hints: ['Среднее — это AVG, округление — ROUND.', 'ROUND(AVG(price), 2)'],
      explanation:
        'Функции вкладываются друг в друга: сначала считается <code>AVG</code>, потом результат округляется. Округление здесь не косметика — без него вы увидите «хвост» вроде 27.6396, типичный для дробных чисел.',
      solutionQuery: 'SELECT ROUND(AVG(price), 2) FROM products;',
    },
    {
      id: 'e10',
      level: 'easy',
      title: 'Заказы в обработке',
      prompt: "Найдите заказы со статусом 'pending'. Выведите id и дату заказа.",
      columns: 'id, order_date',
      hints: ['Обычный фильтр по текстовому столбцу.', "WHERE status = 'pending'"],
      explanation:
        'Проверка «зависших» заказов — типичная задача тестировщика: заказы, застрявшие в статусе «в обработке» дольше положенного, почти всегда означают проблему в обработчике.',
      solutionQuery: "SELECT id, order_date FROM orders WHERE status = 'pending';",
    },
    {
      id: 'e11',
      level: 'easy',
      title: 'Неуспешные платежи',
      prompt: "Найдите платежи, которые не прошли (статус 'failed'). Выведите id платежа, id заказа и сумму.",
      columns: 'id, order_id, amount',
      hints: ['Работаем с таблицей payments.', "WHERE status = 'failed'"],
      explanation:
        'Неуспешные платежи — первое, что смотрят при разборе жалоб «деньги списались, а заказ не оформился». Полезно сверять их количество с логами платёжного шлюза.',
      solutionQuery: "SELECT id, order_id, amount FROM payments WHERE status = 'failed';",
    },
    {
      id: 'e12',
      level: 'easy',
      title: 'Заказы 2024 года',
      prompt: 'Найдите все заказы, сделанные в 2024 году. Выведите id и дату заказа.',
      columns: 'id, order_date',
      hints: [
        "Даты хранятся строками формата '2024-01-15', поэтому год можно отфильтровать как текст.",
        "WHERE order_date LIKE '2024%' — или strftime('%Y', order_date) = '2024'.",
      ],
      explanation:
        'В SQLite нет отдельного типа даты — даты лежат строками в формате ISO. Это удобно: такие строки правильно сортируются и легко фильтруются по префиксу через <code>LIKE</code>.',
      solutionQuery: "SELECT id, order_date FROM orders WHERE order_date LIKE '2024%';",
    },
    {
      id: 'e13',
      level: 'easy',
      title: 'Поиск по названию',
      prompt: "Найдите товары, в названии которых встречается сочетание 'Bo'. Выведите название.",
      columns: 'name',
      hints: [
        'Поиск подстроки — оператор LIKE и символ %.',
        "WHERE name LIKE '%Bo%' — знаки % с обеих сторон означают «где угодно внутри».",
      ],
      explanation:
        '<code>%</code> заменяет любое количество любых символов. Если бы <code>%</code> стоял только справа (<code>\'Bo%\'</code>), нашлись бы только названия, <em>начинающиеся</em> с «Bo».',
      solutionQuery: "SELECT name FROM products WHERE name LIKE '%Bo%';",
    },
    {
      id: 'e14',
      level: 'easy',
      title: 'Товары в диапазоне цен',
      prompt: 'Выведите название и цену товаров, которые стоят от 10 до 20 включительно.',
      columns: 'name, price',
      hints: ['Для диапазона есть отдельный оператор.', 'BETWEEN 10 AND 20 — обе границы входят.'],
      explanation:
        '<code>BETWEEN</code> включает обе границы — это то же самое, что <code>price >= 10 AND price <= 20</code>. Забыть про включение границ — классическая ошибка при расчёте ожидаемого результата в тест-кейсе.',
      solutionQuery: 'SELECT name, price FROM products WHERE price BETWEEN 10 AND 20;',
    },
    {
      id: 'e15',
      level: 'easy',
      title: 'Клиенты из двух городов',
      prompt: "Найдите клиентов из городов 'Chicago' и 'Houston'. Выведите имя и город.",
      columns: 'name, city',
      hints: [
        'Можно перечислить условия через OR, но есть более короткий способ.',
        "WHERE city IN ('Chicago', 'Houston')",
      ],
      explanation:
        '<code>IN</code> — короткая запись для цепочки <code>OR</code>. Читается легче, а при длинном списке значений разница становится принципиальной.',
      solutionQuery: "SELECT name, city FROM customers WHERE city IN ('Chicago', 'Houston');",
    },

    // ==================== СРЕДНИЕ (20) ====================
    {
      id: 'm1',
      level: 'medium',
      title: 'Товар и его категория',
      prompt: 'Для каждого товара выведите его название и название категории, к которой он относится.',
      columns: 'product_name, category_name',
      hints: [
        'Названия лежат в разных таблицах: products и categories. Связывает их products.category_id.',
        'JOIN categories c ON p.category_id = c.id — и обязательно алиасы, ведь столбец name есть в обеих таблицах.',
      ],
      explanation:
        'Базовое соединение двух таблиц. Алиасы (<code>p</code>, <code>c</code>) здесь обязательны: столбец <code>name</code> есть и там, и там, и без уточнения база не поймёт, какой из них имеется в виду.',
      solutionQuery:
        'SELECT p.name AS product_name, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id;',
    },
    {
      id: 'm2',
      level: 'medium',
      title: 'Заказы с именем клиента',
      prompt: 'Для каждого заказа выведите его id, дату и имя клиента, который его сделал.',
      columns: 'id, order_date, name',
      hints: [
        'Связь идёт через orders.customer_id → customers.id.',
        'FROM orders o JOIN customers c ON o.customer_id = c.id',
      ],
      explanation:
        'Внешний ключ <code>customer_id</code> хранит только номер клиента — имя приходится «дотягивать» из customers. Ради этого данные и разносят по таблицам: имя хранится один раз, а не повторяется в каждом заказе.',
      solutionQuery:
        'SELECT o.id, o.order_date, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;',
    },
    {
      id: 'm3',
      level: 'medium',
      title: 'Сколько заказов у каждого клиента',
      prompt:
        'Посчитайте количество заказов у каждого клиента. Выведите id клиента и число заказов. Клиентов без заказов выводить не нужно.',
      columns: 'customer_id, orders_count',
      hints: ['Считать «в разрезе» чего-то — это GROUP BY.', 'GROUP BY customer_id, рядом COUNT(*).'],
      explanation:
        '<code>GROUP BY</code> объединяет строки с одинаковым <code>customer_id</code> в группу, и <code>COUNT(*)</code> считается для каждой группы отдельно. Клиенты без заказов сюда не попадут: в таблице orders их строк нет.',
      solutionQuery: 'SELECT customer_id, COUNT(*) AS orders_count FROM orders GROUP BY customer_id;',
    },
    {
      id: 'm4',
      level: 'medium',
      title: 'Дорогие категории',
      prompt:
        'Найдите категории, в которых средняя цена товара больше 20. Выведите название категории и среднюю цену, округлённую до 2 знаков.',
      columns: 'category_name, avg_price',
      hints: [
        'Фильтровать нужно уже посчитанное среднее, а WHERE для этого не подходит.',
        'Условие по агрегату ставится в HAVING: HAVING AVG(p.price) > 20',
      ],
      explanation:
        '<code>WHERE</code> отбирает строки <em>до</em> группировки, когда среднее ещё не посчитано, поэтому агрегат там писать нельзя. Для фильтрации готовых групп существует <code>HAVING</code>.',
      solutionQuery: `SELECT c.name AS category_name, ROUND(AVG(p.price), 2) AS avg_price
FROM categories c
JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
HAVING AVG(p.price) > 20;`,
    },
    {
      id: 'm5',
      level: 'medium',
      title: 'Клиенты без заказов',
      prompt: 'Найдите клиентов, которые ещё ни разу ничего не заказывали. Выведите их имена.',
      columns: 'name',
      hints: [
        'Обычный JOIN такие строки выбрасывает — нужен LEFT JOIN, который сохраняет всех клиентов.',
        'После LEFT JOIN у клиентов без заказов поля заказа будут NULL: WHERE o.id IS NULL',
      ],
      explanation:
        'Приём «LEFT JOIN + IS NULL» — стандартный способ найти записи без пары. <code>LEFT JOIN</code> оставляет всех клиентов, а условие <code>o.id IS NULL</code> отбирает тех, кому пары не нашлось.',
      solutionQuery: `SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
    },
    {
      id: 'm6',
      level: 'medium',
      title: 'Товары, которые не покупали',
      prompt: 'Найдите товары, которые ни разу не встречаются ни в одном заказе. Выведите их названия.',
      columns: 'name',
      hints: [
        'Можно через LEFT JOIN + IS NULL, а можно через подзапрос с NOT IN.',
        'WHERE id NOT IN (SELECT product_id FROM order_items)',
      ],
      explanation:
        'Оба способа верны. Осторожность с <code>NOT IN</code>: если подзапрос вернёт хотя бы один NULL, оператор перестанет находить что-либо. Здесь <code>product_id</code> обязателен, так что вариант безопасен, но в реальных данных надёжнее <code>NOT EXISTS</code>.',
      solutionQuery: 'SELECT name FROM products WHERE id NOT IN (SELECT product_id FROM order_items);',
    },
    {
      id: 'm7',
      level: 'medium',
      title: 'Сумма каждого заказа',
      prompt:
        'Посчитайте сумму каждого заказа (количество × цену по всем его позициям), округлив до 2 знаков. Выведите id заказа и сумму.',
      columns: 'order_id, total',
      hints: [
        'Сумма позиции — это quantity * unit_price. Суммировать нужно в разрезе заказа.',
        'SUM(quantity * unit_price) с GROUP BY order_id',
      ],
      explanation:
        'Умножение выполняется для каждой строки, а <code>SUM</code> складывает результаты внутри группы. Базовый расчёт, который стоит уметь воспроизводить: именно с ним сверяют итоговую сумму заказа в интерфейсе.',
      solutionQuery:
        'SELECT order_id, ROUND(SUM(quantity * unit_price), 2) AS total FROM order_items GROUP BY order_id;',
    },
    {
      id: 'm8',
      level: 'medium',
      title: 'Постоянные клиенты',
      prompt: 'Найдите клиентов, сделавших больше одного заказа. Выведите имя клиента и количество его заказов.',
      columns: 'name, orders_count',
      hints: [
        'Соединяем клиентов с заказами, группируем и фильтруем по количеству.',
        'HAVING COUNT(o.id) > 1',
      ],
      explanation:
        'Полная связка «JOIN → GROUP BY → HAVING». Такой же запрос, но по email вместо заказов, — стандартный способ искать дубликаты в таблице пользователей.',
      solutionQuery: `SELECT c.name, COUNT(o.id) AS orders_count
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 1;`,
    },
    {
      id: 'm9',
      level: 'medium',
      title: 'Выручка по выполненным заказам',
      prompt:
        "Посчитайте общую выручку по заказам со статусом 'completed' (одно число, округлите до 2 знаков).",
      columns: 'одно число',
      hints: [
        'Соедините позиции с заказами, чтобы узнать статус, и просуммируйте всё вместе.',
        "JOIN orders + WHERE o.status = 'completed', затем SUM(...) без GROUP BY.",
      ],
      explanation:
        'Без <code>GROUP BY</code> агрегат считается по всему отфильтрованному набору сразу. Фильтр по статусу стоит в <code>WHERE</code> — он применяется до суммирования, что и правильно, и быстрее.',
      solutionQuery: `SELECT ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed';`,
    },
    {
      id: 'm10',
      level: 'medium',
      title: 'Дороже среднего',
      prompt: 'Найдите товары, которые стоят дороже средней цены по всем товарам. Выведите название и цену.',
      columns: 'name, price',
      hints: [
        'Среднюю цену нужно посчитать отдельным запросом и сравнить с ней каждую строку.',
        'WHERE price > (SELECT AVG(price) FROM products)',
      ],
      explanation:
        'Это скалярный подзапрос — он возвращает ровно одно значение, поэтому его можно поставить прямо в условие сравнения. Написать <code>WHERE price > AVG(price)</code> нельзя: агрегат в <code>WHERE</code> недоступен.',
      solutionQuery: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);',
    },
    {
      id: 'm11',
      level: 'medium',
      title: 'Кто покупал книги',
      prompt:
        "Найдите имена клиентов, которые хоть раз покупали товар из категории 'Books'. Каждое имя должно встретиться один раз.",
      columns: 'name',
      hints: [
        'Придётся пройти цепочку: customers → orders → order_items → products → categories.',
        'Соедините все пять таблиц и не забудьте DISTINCT — иначе клиент повторится за каждую покупку.',
      ],
      explanation:
        'Цепочка из нескольких <code>JOIN</code> — обычное дело в реальных базах. <code>DISTINCT</code> обязателен: если клиент купил три книги, без него он попадёт в результат трижды.',
      solutionQuery: `SELECT DISTINCT cu.name
FROM customers cu
JOIN orders o ON o.customer_id = cu.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Books';`,
    },
    {
      id: 'm12',
      level: 'medium',
      title: 'Топ-3 товара по выручке',
      prompt:
        'Найдите 3 товара, принёсших больше всего денег (количество × цену по всем продажам). Выведите название и выручку, округлённую до 2 знаков, начиная с самого прибыльного.',
      columns: 'name, revenue (порядок строк важен)',
      orderMatters: true,
      hints: [
        'Сначала посчитайте выручку по каждому товару, потом отсортируйте и обрежьте.',
        'GROUP BY товара, ORDER BY revenue DESC, LIMIT 3. В ORDER BY можно ссылаться на алиас.',
      ],
      explanation:
        'Порядок вычисления: сначала группировка и агрегат, потом сортировка, потом <code>LIMIT</code>. Поэтому в <code>ORDER BY</code> уже можно использовать алиас <code>revenue</code>, придуманный в <code>SELECT</code>.',
      solutionQuery: `SELECT p.name, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM products p
JOIN order_items oi ON oi.product_id = p.id
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 3;`,
    },
    {
      id: 'm13',
      level: 'medium',
      title: 'Дата последнего заказа клиента',
      prompt:
        'Для каждого клиента выведите его имя и дату последнего заказа. Клиенты без заказов тоже должны попасть в результат — с пустой датой.',
      columns: 'name, last_order_date',
      hints: [
        'Чтобы сохранить клиентов без заказов, нужен LEFT JOIN.',
        'MAX(o.order_date) с GROUP BY по клиенту — для клиентов без заказов MAX вернёт NULL.',
      ],
      explanation:
        '<code>MAX</code> отлично работает с датами-строками формата ISO. Для клиента без заказов группа состоит из строки со сплошными NULL, поэтому <code>MAX</code> честно возвращает NULL — как и требовалось.',
      solutionQuery: `SELECT c.name, MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;`,
    },
    {
      id: 'm14',
      level: 'medium',
      title: 'Средний чек',
      prompt:
        'Посчитайте средний чек: сначала сумму каждого заказа, потом среднее по этим суммам. Округлите до 2 знаков (одно число).',
      columns: 'одно число',
      hints: [
        'Двухшаговый расчёт удобно оформить через WITH: сначала суммы заказов, потом среднее по ним.',
        'WITH totals AS (SELECT order_id, SUM(...) AS total ... GROUP BY order_id) SELECT AVG(total) FROM totals',
      ],
      explanation:
        'Важно понимать разницу: <code>AVG(quantity * unit_price)</code> дал бы среднюю стоимость <em>позиции</em>, а не заказа. Правильный средний чек — это всегда два шага, и CTE делает их явными.',
      solutionQuery: `WITH totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
)
SELECT ROUND(AVG(total), 2) AS avg_check FROM totals;`,
    },
    {
      id: 'm15',
      level: 'medium',
      title: 'Ценовые категории товаров',
      prompt:
        "Для каждого товара выведите название, цену и метку: 'дешёвый' если цена меньше 15, 'средний' если меньше 40, иначе 'дорогой'.",
      columns: 'name, price, tier',
      hints: [
        'Это условная логика внутри SELECT.',
        'CASE WHEN price < 15 THEN ... WHEN price < 40 THEN ... ELSE ... END',
      ],
      explanation:
        'Условия в <code>CASE</code> проверяются сверху вниз, срабатывает первое подходящее — поэтому второе условие можно писать просто <code>price &lt; 40</code>, не повторяя «и при этом больше 15».',
      solutionQuery: `SELECT name, price,
  CASE
    WHEN price < 15 THEN 'дешёвый'
    WHEN price < 40 THEN 'средний'
    ELSE 'дорогой'
  END AS tier
FROM products;`,
    },
    {
      id: 'm16',
      level: 'medium',
      title: 'Заказы по месяцам',
      prompt:
        'Посчитайте количество заказов по месяцам. Выведите месяц в формате «ГГГГ-ММ» и количество заказов, отсортировав по месяцу.',
      columns: 'month, cnt (порядок строк важен)',
      orderMatters: true,
      hints: [
        'Из даты нужно вырезать год и месяц, а потом сгруппировать по этому значению.',
        "strftime('%Y-%m', order_date) — используйте и в SELECT, и в GROUP BY.",
      ],
      explanation:
        'Отчёт по месяцам — типовая проверка динамики: резкий провал в одном месяце часто означает не спад продаж, а сбой в записи данных.',
      solutionQuery: `SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) AS cnt
FROM orders
GROUP BY strftime('%Y-%m', order_date)
ORDER BY month;`,
    },
    {
      id: 'm17',
      level: 'medium',
      title: 'Продажи по категориям, включая нулевые',
      prompt:
        'Для каждой категории посчитайте, сколько единиц товара из неё было продано. Категории без продаж должны попасть в результат с нулём.',
      columns: 'category_name, total_qty',
      hints: [
        'Идти нужно от categories и сохранять их все — значит, LEFT JOIN на всю цепочку.',
        'COALESCE(SUM(oi.quantity), 0) превратит NULL в 0 для категорий без продаж.',
      ],
      explanation:
        'Если в цепочке соединений хоть где-то поставить обычный <code>JOIN</code>, категории без продаж отвалятся — <code>LEFT JOIN</code> должен идти до конца цепочки. <code>SUM</code> по пустой группе возвращает NULL, поэтому его оборачивают в <code>COALESCE</code>.',
      solutionQuery: `SELECT c.name AS category_name, COALESCE(SUM(oi.quantity), 0) AS total_qty
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY c.id, c.name;`,
    },
    {
      id: 'm18',
      level: 'medium',
      title: 'Заказы без успешной оплаты',
      prompt:
        "Найдите заказы, по которым нет ни одного успешного платежа (статус 'success'). Выведите id заказа и его статус.",
      columns: 'id, status',
      hints: [
        'Снова приём «LEFT JOIN + IS NULL», но условие по статусу платежа должно попасть в ON, а не в WHERE.',
        "LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'success' ... WHERE p.id IS NULL",
      ],
      explanation:
        'Ключевая деталь: условие <code>p.status = \'success\'</code> стоит в <code>ON</code>. Если перенести его в <code>WHERE</code>, строки без платежа (где статус равен NULL) отфильтруются, и <code>LEFT JOIN</code> превратится в обычный <code>JOIN</code> — запрос вернёт пустой результат. Это одна из самых частых ошибок с LEFT JOIN.',
      solutionQuery: `SELECT o.id, o.status
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'success'
WHERE p.id IS NULL;`,
    },
    {
      id: 'm19',
      level: 'medium',
      title: 'Средний рейтинг товаров',
      prompt:
        'Для каждого товара, на который есть отзывы, посчитайте средний рейтинг и количество отзывов. Выведите название товара, средний рейтинг (округлите до 2 знаков) и число отзывов.',
      columns: 'name, avg_rating, reviews_count',
      hints: [
        'Соедините product_reviews с products и сгруппируйте по товару.',
        'AVG(r.rating) и COUNT(*) в одном SELECT.',
      ],
      explanation:
        'Средний рейтинг сам по себе обманчив: 5.0 по одному отзыву и 4.6 по сотне — совсем разные вещи. Поэтому рядом со средним почти всегда выводят количество отзывов — и это же стоит проверять в интерфейсе.',
      solutionQuery: `SELECT p.name, ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(*) AS reviews_count
FROM product_reviews r
JOIN products p ON p.id = r.product_id
GROUP BY p.id, p.name;`,
    },
    {
      id: 'm20',
      level: 'medium',
      title: 'Недовольные клиенты',
      prompt:
        'Найдите все отзывы с оценкой 2 и ниже. Выведите название товара, имя клиента, оценку и текст отзыва.',
      columns: 'product_name, customer_name, rating, comment',
      hints: [
        'Отзыв ссылается сразу на две таблицы: products и customers.',
        'Два JOIN от product_reviews + WHERE r.rating <= 2',
      ],
      explanation:
        'Соединение «звёздочкой»: от одной таблицы отходят связи к нескольким справочникам. Такой запрос — готовый отчёт для разбора негатива, а заодно проверка, что рейтинги вообще лежат в допустимом диапазоне 1–5.',
      solutionQuery: `SELECT p.name AS product_name, c.name AS customer_name, r.rating, r.comment
FROM product_reviews r
JOIN products p ON p.id = r.product_id
JOIN customers c ON c.id = r.customer_id
WHERE r.rating <= 2;`,
    },

    // ==================== СЛОЖНЫЕ (10) ====================
    {
      id: 'h1',
      level: 'hard',
      title: 'Самый дорогой товар в каждой категории',
      prompt:
        'Для каждой категории найдите самый дорогой товар. Выведите название категории, название товара и его цену.',
      columns: 'category_name, product_name, price',
      hints: [
        'Обычный MAX(price) даст цену, но не название товара. Нужна оконная функция.',
        'ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) в CTE, снаружи оставить строки с номером 1.',
      ],
      explanation:
        'Классическая задача «top-1 в каждой группе». Оконная функция нумерует товары внутри каждой категории по убыванию цены, а внешний запрос оставляет только первые. Фильтровать по оконной функции прямо в <code>WHERE</code> нельзя — она вычисляется уже после фильтрации, поэтому и нужен CTE.',
      solutionQuery: `WITH ranked AS (
  SELECT c.name AS category_name, p.name AS product_name, p.price,
         ROW_NUMBER() OVER (PARTITION BY p.category_id ORDER BY p.price DESC) AS rn
  FROM products p
  JOIN categories c ON c.id = p.category_id
)
SELECT category_name, product_name, price FROM ranked WHERE rn = 1;`,
    },
    {
      id: 'h2',
      level: 'hard',
      title: 'Накопительная выручка',
      prompt:
        'Посчитайте сумму каждого заказа, а затем выведите id заказа, дату и накопительную сумму выручки по всем заказам, упорядоченным по дате (при равных датах — по id). Округлите накопительную сумму до 2 знаков.',
      columns: 'order_id, order_date, running_total (порядок строк важен)',
      orderMatters: true,
      hints: [
        'Сначала CTE с суммой каждого заказа, потом оконная функция поверх него.',
        'SUM(total) OVER (ORDER BY order_date, order_id) — рамка по умолчанию как раз «от начала до текущей строки».',
      ],
      explanation:
        'Накопительный итог получается из-за рамки окна по умолчанию: если в <code>OVER</code> указан <code>ORDER BY</code>, рамка равна «от начала окна до текущей строки». Без <code>ORDER BY</code> внутри <code>OVER</code> та же функция вернула бы общую сумму в каждой строке.',
      solutionQuery: `WITH totals AS (
  SELECT o.id AS order_id, o.order_date, SUM(oi.quantity * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id, o.order_date
)
SELECT order_id, order_date,
       ROUND(SUM(total) OVER (ORDER BY order_date, order_id), 2) AS running_total
FROM totals;`,
    },
    {
      id: 'h3',
      level: 'hard',
      title: 'Доля категории в выручке',
      prompt:
        'Для каждой категории посчитайте её выручку и долю в общей выручке магазина в процентах (округлите до 2 знаков).',
      columns: 'category_name, revenue, share_percent',
      hints: [
        'Выручку по категориям посчитайте в CTE, а общую сумму получите оконной функцией без PARTITION BY.',
        'SUM(revenue) OVER () — окно без ORDER BY и PARTITION BY охватывает все строки, то есть даёт общий итог.',
      ],
      explanation:
        'Приём «значение строки / итог по всем строкам» решается окном <code>OVER ()</code> — пустые скобки означают «всё окно целиком». Альтернатива — скалярный подзапрос с общей суммой, но окно короче и считается за один проход.',
      solutionQuery: `WITH cat_rev AS (
  SELECT c.name AS category_name, SUM(oi.quantity * oi.unit_price) AS revenue
  FROM categories c
  JOIN products p ON p.category_id = c.id
  JOIN order_items oi ON oi.product_id = p.id
  GROUP BY c.id, c.name
)
SELECT category_name,
       ROUND(revenue, 2) AS revenue,
       ROUND(revenue * 100.0 / SUM(revenue) OVER (), 2) AS share_percent
FROM cat_rev;`,
    },
    {
      id: 'h4',
      level: 'hard',
      title: 'Изменение суммы заказа',
      prompt:
        'Для каждого заказа выведите id, дату, его сумму и сумму предыдущего заказа (по дате, при равных датах — по id). Все суммы округлите до 2 знаков.',
      columns: 'order_id, order_date, total, prev_total (порядок строк важен)',
      orderMatters: true,
      hints: [
        'Значение из предыдущей строки достаёт функция смещения.',
        'LAG(total) OVER (ORDER BY order_date, order_id)',
      ],
      explanation:
        '<code>LAG</code> заглядывает на строку назад в пределах окна (у самой первой строки предыдущей нет, поэтому там NULL). Для тестировщика это готовый инструмент проверки последовательностей: не идут ли даты вспять, нет ли одинаковых записей подряд.',
      solutionQuery: `WITH totals AS (
  SELECT o.id AS order_id, o.order_date, SUM(oi.quantity * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id, o.order_date
)
SELECT order_id, order_date, ROUND(total, 2) AS total,
       ROUND(LAG(total) OVER (ORDER BY order_date, order_id), 2) AS prev_total
FROM totals;`,
    },
    {
      id: 'h5',
      level: 'hard',
      title: 'Топ-2 товара в каждой категории',
      prompt:
        'В каждой категории найдите 2 товара с наибольшей выручкой. Выведите название категории, название товара и выручку (округлите до 2 знаков).',
      columns: 'category_name, product_name, revenue',
      hints: [
        'Сначала выручка по каждому товару, потом нумерация внутри категории, потом отбор.',
        'ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY revenue DESC), снаружи WHERE rn <= 2.',
      ],
      explanation:
        'Задача «top-N в группе» — расширение предыдущей: меняется только условие на номер строки. Обратите внимание на порядок шагов: сначала агрегируем выручку, и лишь потом нумеруем — нумеровать «сырые» строки было бы бессмысленно.',
      solutionQuery: `WITH prod_rev AS (
  SELECT p.category_id, p.name AS product_name, SUM(oi.quantity * oi.unit_price) AS revenue
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  GROUP BY p.id, p.category_id, p.name
), ranked AS (
  SELECT c.name AS category_name, pr.product_name, pr.revenue,
         ROW_NUMBER() OVER (PARTITION BY pr.category_id ORDER BY pr.revenue DESC) AS rn
  FROM prod_rev pr
  JOIN categories c ON c.id = pr.category_id
)
SELECT category_name, product_name, ROUND(revenue, 2) AS revenue
FROM ranked WHERE rn <= 2;`,
    },
    {
      id: 'h6',
      level: 'hard',
      title: 'Клиенты с покупками выше среднего',
      prompt:
        'Посчитайте, на какую сумму купил каждый клиент, и выведите тех, чья сумма покупок больше средней суммы покупок по всем покупавшим клиентам. Выведите имя и сумму (округлите до 2 знаков).',
      columns: 'name, total_spent',
      hints: [
        'Сначала CTE с суммой по каждому клиенту, потом сравнение со средним по этому же CTE.',
        'WHERE total_spent > (SELECT AVG(total_spent) FROM spend) — на CTE можно ссылаться дважды.',
      ],
      explanation:
        'Здесь CTE используется дважды: как источник строк и как источник среднего значения в подзапросе. С обычным подзапросом пришлось бы дублировать весь расчёт — это и медленнее, и опаснее (легко изменить одну копию и забыть про вторую).',
      solutionQuery: `WITH spend AS (
  SELECT c.id, c.name, SUM(oi.quantity * oi.unit_price) AS total_spent
  FROM customers c
  JOIN orders o ON o.customer_id = c.id
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY c.id, c.name
)
SELECT name, ROUND(total_spent, 2) AS total_spent
FROM spend
WHERE total_spent > (SELECT AVG(total_spent) FROM spend);`,
    },
    {
      id: 'h7',
      level: 'hard',
      title: 'Сверка: оплата не совпадает с суммой заказа',
      prompt:
        'Найдите успешные платежи (статус \'success\'), сумма которых не совпадает с суммой заказа. Выведите id заказа, сумму платежа и сумму заказа (округлите до 2 знаков).',
      columns: 'order_id, paid_amount, order_total',
      hints: [
        'Сумму заказа посчитайте в CTE, потом соедините с платежами и сравните.',
        'Сравнивайте округлённые значения: ROUND(p.amount, 2) <> ROUND(t.total, 2) — иначе дробные «хвосты» дадут ложные срабатывания.',
      ],
      explanation:
        'Это настоящая проверка целостности данных, каких много в работе тестировщика. Отдельно обратите внимание на округление перед сравнением: числа с плавающей точкой почти никогда не равны «в лоб», и сравнение без <code>ROUND</code> выдало бы кучу ложных расхождений. В идеале суммы денег вообще хранят в целых копейках или в типе DECIMAL.',
      solutionQuery: `WITH totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
)
SELECT p.order_id, ROUND(p.amount, 2) AS paid_amount, ROUND(t.total, 2) AS order_total
FROM payments p
JOIN totals t ON t.order_id = p.order_id
WHERE p.status = 'success'
  AND ROUND(p.amount, 2) <> ROUND(t.total, 2);`,
    },
    {
      id: 'h8',
      level: 'hard',
      title: 'Сверка: отгрузили раньше, чем оплатили',
      prompt:
        "Найдите заказы, которые были отгружены раньше, чем по ним прошёл успешный платёж. Выведите id заказа, дату отгрузки и дату оплаты.",
      columns: 'order_id, shipped_at, paid_at',
      hints: [
        'Соедините shipments и payments по order_id, взяв только успешные платежи.',
        'Даты в формате ISO сравниваются как обычные строки: WHERE s.shipped_at < p.paid_at',
      ],
      explanation:
        'Нарушение ожидаемого порядка событий — типичный баг, который не видно ни в одном интерфейсе, зато прекрасно видно в базе. Такой запрос отлично живёт в регрессионном чек-листе: его результат всегда должен быть пустым. Сравнение дат-строк работает благодаря формату ISO-8601, где лексикографический порядок совпадает с хронологическим.',
      solutionQuery: `SELECT s.order_id, s.shipped_at, p.paid_at
FROM shipments s
JOIN payments p ON p.order_id = s.order_id AND p.status = 'success'
WHERE s.shipped_at < p.paid_at;`,
    },
    {
      id: 'h9',
      level: 'hard',
      title: 'Сверка: отзыв без покупки',
      prompt:
        'Найдите отзывы, оставленные на товары, которые этот клиент никогда не покупал. Выведите id отзыва, имя клиента и название товара.',
      columns: 'review_id, customer_name, product_name',
      hints: [
        'Для каждого отзыва нужно проверить, есть ли у этого клиента заказ с этим товаром.',
        'Коррелированный подзапрос: WHERE NOT EXISTS (SELECT 1 FROM orders o JOIN order_items oi ... WHERE o.customer_id = r.customer_id AND oi.product_id = r.product_id)',
      ],
      explanation:
        'Коррелированный подзапрос ссылается на строку внешнего запроса (<code>r.customer_id</code>) и потому вычисляется для каждого отзыва отдельно. <code>NOT EXISTS</code> здесь надёжнее, чем <code>NOT IN</code>: он корректно работает даже при наличии NULL и не требует сравнивать пары значений. Проверка «оставил отзыв, не купив» — стандартный тест-кейс для маркетплейсов.',
      solutionQuery: `SELECT r.id AS review_id, c.name AS customer_name, p.name AS product_name
FROM product_reviews r
JOIN customers c ON c.id = r.customer_id
JOIN products p ON p.id = r.product_id
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.customer_id = r.customer_id
    AND oi.product_id = r.product_id
);`,
    },
    {
      id: 'h10',
      level: 'hard',
      title: 'Динамика выручки по месяцам',
      prompt:
        'Посчитайте выручку по месяцам и покажите, на сколько она изменилась по сравнению с предыдущим месяцем. Выведите месяц («ГГГГ-ММ»), выручку и разницу с предыдущим месяцем (обе суммы округлите до 2 знаков), отсортировав по месяцу.',
      columns: 'month, revenue, diff (порядок строк важен)',
      orderMatters: true,
      hints: [
        'Сначала CTE с выручкой по месяцам, потом LAG поверх него.',
        'revenue - LAG(revenue) OVER (ORDER BY month) — у первого месяца разница будет NULL.',
      ],
      explanation:
        'Связка «CTE + LAG» — основа почти любого отчёта о динамике. У первого месяца разница равна NULL, и это правильно: сравнивать не с чем. Если бизнесу нужен ноль вместо пустоты, его подставляют через <code>COALESCE</code> — но осознанно, потому что ноль и «нет данных» это разные вещи.',
      solutionQuery: `WITH monthly AS (
  SELECT strftime('%Y-%m', o.order_date) AS month,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY strftime('%Y-%m', o.order_date)
)
SELECT month,
       ROUND(revenue, 2) AS revenue,
       ROUND(revenue - LAG(revenue) OVER (ORDER BY month), 2) AS diff
FROM monthly
ORDER BY month;`,
    },
  ];

  return TASKS;
});
