-- =============================================
-- Migration 001: สร้างตารางหลักสำหรับระบบสต๊อก
-- =============================================

-- ตารางอุปกรณ์ (Products)
-- เก็บข้อมูลอุปกรณ์โซลาร์เซลล์ทั้งหมด
CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,      -- ชื่ออุปกรณ์
    unit        VARCHAR(50)  NOT NULL,              -- หน่วยนับ (แผ่น, เส้น, ตัว, ฯลฯ)
    reorder_point INTEGER    NOT NULL DEFAULT 0,    -- จุดสั่งซื้อซ้ำ (Reorder Point)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ตารางธุรกรรมสต๊อก (Stock Transactions)
-- เก็บการเคลื่อนไหวเข้า/ออกของอุปกรณ์แต่ละรายการ
CREATE TABLE IF NOT EXISTS stock_transactions (
    id               SERIAL PRIMARY KEY,
    product_id       INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type             VARCHAR(3)   NOT NULL CHECK (type IN ('IN', 'OUT')),  -- ประเภท: เข้า / ออก
    quantity         INTEGER      NOT NULL CHECK (quantity > 0),            -- จำนวน (ต้องมากกว่า 0)
    job_name         VARCHAR(255) DEFAULT '',                               -- ชื่อหน้างาน/โปรเจกต์
    note             TEXT         DEFAULT '',                               -- หมายเหตุ
    transaction_date DATE         NOT NULL DEFAULT CURRENT_DATE,            -- วันที่บันทึก
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index สำหรับ query ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON stock_transactions(type);
