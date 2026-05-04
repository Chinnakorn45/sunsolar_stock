-- =============================================
-- Migration 002: เพิ่มตารางช่าง + เพิ่ม technician_id ใน stock_transactions
-- =============================================

-- ตารางช่าง (Technicians)
CREATE TABLE IF NOT EXISTS technicians (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,                -- ชื่อ-นามสกุล
    phone       VARCHAR(20)  DEFAULT '',              -- เบอร์โทร
    role        VARCHAR(100) DEFAULT '',              -- ตำแหน่ง/ทีม
    is_active   BOOLEAN      NOT NULL DEFAULT true,   -- ใช้งานอยู่
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- เพิ่มคอลัมน์ technician_id ใน stock_transactions (nullable — เฉพาะ OUT เท่านั้น)
ALTER TABLE stock_transactions
  ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_transactions_technician ON stock_transactions(technician_id);
