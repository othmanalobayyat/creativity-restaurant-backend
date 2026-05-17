-- ================================================================
-- Creativity Restaurant — PostgreSQL Schema
-- Provider: Supabase
-- ================================================================
-- Safe to run multiple times: all statements use IF NOT EXISTS.
-- Run order matters — parent tables first, then children.
-- ================================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL       PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(254) NOT NULL UNIQUE,
  phone         VARCHAR(30)  DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL       PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- 3. Items (menu)
CREATE TABLE IF NOT EXISTS items (
  id          SERIAL         PRIMARY KEY,
  name        VARCHAR(255)   NOT NULL,
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity    INT            NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  image_url   VARCHAR(500)   DEFAULT NULL,
  description TEXT           DEFAULT NULL,
  category_id INT            NOT NULL
              REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 4. Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id         SERIAL       PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city       VARCHAR(255) NOT NULL,
  street     VARCHAR(500) NOT NULL,
  is_default BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL         PRIMARY KEY,
  user_id    INT            NOT NULL REFERENCES users(id),
  status     VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
             CHECK (status IN (
               'PENDING', 'PROCESSING', 'DELIVERY',
               'DELIVERED', 'COMPLETED', 'REJECTED'
             )),
  total      DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  city       VARCHAR(255)   NOT NULL,
  street     VARCHAR(500)   NOT NULL,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 6. Order items
CREATE TABLE IF NOT EXISTS order_items (
  id       SERIAL         PRIMARY KEY,
  order_id INT            NOT NULL REFERENCES orders(id)  ON DELETE CASCADE,
  item_id  INT            NOT NULL REFERENCES items(id),
  quantity INT            NOT NULL CHECK (quantity > 0),
  price    DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

-- ================================================================
-- Indexes (performance)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_items_active     ON items(is_active);
CREATE INDEX IF NOT EXISTS idx_items_category   ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_ord  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_addr_user_id     ON addresses(user_id);
