-- =============================================
-- Migration 003: เพิ่มคอลัมน์รูปภาพอุปกรณ์
-- =============================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT '';
