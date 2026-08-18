-- Учебная база данных: небольшой интернет-магазин.
-- Используется одновременно в браузере (sql.js) и в Node-скрипте валидации (test/validate.js).

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  signup_date TEXT NOT NULL
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  price REAL NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  paid_at TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE shipments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  shipped_at TEXT NOT NULL,
  delivered_at TEXT,
  carrier TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE product_reviews (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO customers (id, name, email, city, signup_date) VALUES
  (1, 'Alice Johnson', 'alice@example.com', 'New York', '2023-01-15'),
  (2, 'Bob Smith', 'bob@example.com', 'Los Angeles', '2023-02-20'),
  (3, 'Carol Davis', 'carol@example.com', 'Chicago', '2023-03-05'),
  (4, 'David Wilson', 'david@example.com', NULL, '2023-04-12'),
  (5, 'Emma Brown', 'emma@example.com', 'Houston', '2023-05-18'),
  (6, 'Frank Miller', 'frank@example.com', 'Chicago', '2023-06-25'),
  (7, 'Grace Lee', 'grace@example.com', 'New York', '2023-07-30'),
  (8, 'Henry Clark', 'henry@example.com', 'Seattle', '2023-08-14'),
  (9, 'Ivy Turner', 'ivy@example.com', NULL, '2023-09-22'),
  (10, 'Jack White', 'jack@example.com', 'Los Angeles', '2023-10-10'),
  (11, 'Kate Adams', 'kate@example.com', 'Boston', '2023-11-05'),
  (12, 'Leo Martinez', 'leo@example.com', 'Houston', '2024-01-08');

INSERT INTO categories (id, name) VALUES
  (1, 'Books'),
  (2, 'Electronics'),
  (3, 'Home'),
  (4, 'Toys'),
  (5, 'Sports'),
  (6, 'Beauty');

INSERT INTO products (id, name, category_id, price) VALUES
  (1, 'The Great Gatsby', 1, 10.99),
  (2, 'SQL for Beginners', 1, 24.50),
  (3, 'Atomic Habits', 1, 18.00),
  (4, 'Dune', 1, 15.75),
  (5, 'Wireless Mouse', 2, 19.99),
  (6, 'Bluetooth Speaker', 2, 45.00),
  (7, 'USB-C Cable', 2, 8.50),
  (8, 'Noise Cancelling Headphones', 2, 129.99),
  (9, 'Ceramic Mug', 3, 6.99),
  (10, 'Throw Blanket', 3, 29.99),
  (11, 'Desk Lamp', 3, 22.50),
  (12, 'Scented Candle', 3, 12.00),
  (13, 'Building Blocks Set', 4, 34.99),
  (14, 'Puzzle 1000pcs', 4, 14.99),
  (15, 'Remote Control Car', 4, 39.99),
  (16, 'Board Game', 4, 27.50),
  (17, 'Yoga Mat', 5, 21.99),
  (18, 'Water Bottle', 5, 9.99),
  (19, 'Resistance Bands', 5, 13.50),
  (20, 'Running Shoes', 5, 79.99),
  (21, 'Face Moisturizer', 6, 16.99),
  (22, 'Shampoo', 6, 8.99),
  (23, 'Lip Balm Set', 6, 5.50),
  (24, 'Perfume', 6, 55.00),
  (25, 'Yoga Block', 5, 11.99);

INSERT INTO orders (id, customer_id, order_date, status) VALUES
  (1, 1, '2023-02-01', 'completed'),
  (2, 1, '2023-05-10', 'completed'),
  (3, 2, '2023-03-15', 'completed'),
  (4, 2, '2023-08-22', 'cancelled'),
  (5, 3, '2023-04-01', 'completed'),
  (6, 3, '2023-09-12', 'pending'),
  (7, 4, '2023-05-20', 'completed'),
  (8, 5, '2023-06-18', 'completed'),
  (9, 5, '2023-11-02', 'completed'),
  (10, 6, '2023-07-25', 'completed'),
  (11, 6, '2024-01-15', 'pending'),
  (12, 7, '2023-08-05', 'completed'),
  (13, 7, '2023-12-20', 'cancelled'),
  (14, 8, '2023-09-14', 'completed'),
  (15, 9, '2023-10-01', 'completed'),
  (16, 9, '2024-02-10', 'completed'),
  (17, 10, '2023-11-11', 'completed'),
  (18, 10, '2024-01-05', 'pending'),
  (19, 11, '2023-12-01', 'completed'),
  (20, 3, '2024-02-20', 'completed');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 2, 1, 24.50),
  (2, 1, 9, 2, 6.99),
  (3, 2, 5, 1, 19.99),
  (4, 2, 7, 3, 8.50),
  (5, 3, 1, 2, 10.99),
  (6, 4, 13, 1, 34.99),
  (7, 5, 21, 1, 16.99),
  (8, 5, 22, 1, 8.99),
  (9, 5, 23, 2, 5.50),
  (10, 6, 17, 1, 21.99),
  (11, 7, 6, 1, 45.00),
  (12, 8, 3, 3, 18.00),
  (13, 9, 8, 1, 129.99),
  (14, 9, 5, 2, 19.99),
  (15, 10, 10, 1, 29.99),
  (16, 10, 12, 2, 12.00),
  (17, 11, 14, 1, 14.99),
  (18, 12, 4, 1, 15.75),
  (19, 12, 2, 1, 24.50),
  (20, 13, 16, 1, 27.50),
  (21, 14, 20, 1, 79.99),
  (22, 15, 9, 4, 6.99),
  (23, 16, 24, 1, 55.00),
  (24, 17, 18, 2, 9.99),
  (25, 17, 19, 1, 13.50),
  (26, 18, 15, 1, 39.99),
  (27, 19, 11, 1, 22.50),
  (28, 19, 1, 1, 10.99),
  (29, 20, 2, 2, 24.50),
  (30, 20, 6, 1, 45.00);

-- Платежи. Заказы 4, 6, 11, 18 намеренно оставлены без оплаты (отменённые и в обработке).
-- В данных есть несколько «зацепок» для учебных задач на сверку:
--   payment 3  — сумма меньше суммы заказа (недоплата);
--   payments 7 и 8 — неудачная попытка и повторная успешная оплата одного заказа;
--   payment 11 — возврат по отменённому заказу;
--   payment 15 — оплата ПОЗЖЕ отгрузки этого же заказа (см. shipments 14).
INSERT INTO payments (id, order_id, paid_at, amount, method, status) VALUES
  (1, 1, '2023-02-01', 38.48, 'card', 'success'),
  (2, 2, '2023-05-10', 45.49, 'card', 'success'),
  (3, 3, '2023-03-15', 20.00, 'transfer', 'success'),
  (4, 5, '2023-04-01', 36.98, 'paypal', 'success'),
  (5, 7, '2023-05-20', 45.00, 'card', 'success'),
  (6, 8, '2023-06-18', 54.00, 'card', 'success'),
  (7, 9, '2023-11-02', 169.97, 'card', 'failed'),
  (8, 9, '2023-11-03', 169.97, 'card', 'success'),
  (9, 10, '2023-07-25', 53.99, 'paypal', 'success'),
  (10, 12, '2023-08-05', 40.25, 'card', 'success'),
  (11, 13, '2023-12-20', 27.50, 'card', 'refunded'),
  (12, 14, '2023-09-14', 79.99, 'transfer', 'success'),
  (13, 15, '2023-10-01', 27.96, 'card', 'success'),
  (14, 16, '2024-02-10', 55.00, 'paypal', 'success'),
  (15, 17, '2023-11-13', 33.48, 'card', 'success'),
  (16, 19, '2023-12-01', 33.49, 'card', 'success'),
  (17, 20, '2024-02-20', 94.00, 'card', 'success');

-- Отгрузки. Зацепки для учебных задач:
--   shipment 9  — посылка потеряна (delivered_at пустой);
--   shipment 10 — отгрузка по ОТМЕНЁННОМУ заказу 13;
--   shipment 14 — отгружено раньше, чем оплачено (см. payment 15).
INSERT INTO shipments (id, order_id, shipped_at, delivered_at, carrier, status) VALUES
  (1, 1, '2023-02-03', '2023-02-07', 'DHL', 'delivered'),
  (2, 2, '2023-05-12', '2023-05-15', 'UPS', 'delivered'),
  (3, 3, '2023-03-17', '2023-03-22', 'DHL', 'delivered'),
  (4, 5, '2023-04-03', '2023-04-08', 'FedEx', 'delivered'),
  (5, 7, '2023-05-22', '2023-05-27', 'UPS', 'delivered'),
  (6, 8, '2023-06-20', '2023-06-24', 'DHL', 'delivered'),
  (7, 9, '2023-11-05', '2023-11-09', 'FedEx', 'delivered'),
  (8, 10, '2023-07-27', '2023-08-01', 'UPS', 'delivered'),
  (9, 12, '2023-08-07', NULL, 'DHL', 'lost'),
  (10, 13, '2023-12-21', '2023-12-26', 'UPS', 'delivered'),
  (11, 14, '2023-09-16', '2023-09-20', 'FedEx', 'delivered'),
  (12, 15, '2023-10-03', '2023-10-08', 'DHL', 'delivered'),
  (13, 16, '2024-02-12', NULL, 'UPS', 'in_transit'),
  (14, 17, '2023-11-11', '2023-11-16', 'DHL', 'delivered'),
  (15, 19, '2023-12-03', '2023-12-07', 'FedEx', 'delivered'),
  (16, 20, '2024-02-22', NULL, 'UPS', 'in_transit');

-- Отзывы. Зацепка: отзыв 12 оставлен клиентом 11 на товар 8, которого он никогда не покупал.
INSERT INTO product_reviews (id, product_id, customer_id, rating, comment, created_at) VALUES
  (1, 2, 1, 5, 'Отличная книга для старта', '2023-02-10'),
  (2, 9, 1, 4, 'Хорошая кружка', '2023-02-12'),
  (3, 5, 1, 3, 'Мышь средняя', '2023-05-20'),
  (4, 1, 2, 5, 'Классика', '2023-03-20'),
  (5, 21, 3, 2, 'Крем не подошёл', '2023-04-10'),
  (6, 23, 3, 1, 'Бальзам пересушивает', '2023-04-11'),
  (7, 6, 4, 4, 'Звук приличный', '2023-05-25'),
  (8, 3, 5, 5, 'Мотивирует', '2023-06-25'),
  (9, 8, 5, 5, 'Лучшие наушники', '2023-11-10'),
  (10, 10, 6, 3, 'Плед тонкий', '2023-08-01'),
  (11, 20, 8, 4, 'Удобные кроссовки', '2023-09-20'),
  (12, 8, 11, 5, 'Прекрасный звук', '2023-12-05'),
  (13, 24, 9, 2, 'Аромат слабый', '2024-02-15'),
  (14, 11, 11, 4, 'Лампа яркая', '2023-12-06');
