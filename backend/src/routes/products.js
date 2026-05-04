/**
 * products.js — API Routes สำหรับจัดการอุปกรณ์ (CRUD + Image Upload)
 *
 * GET    /api/products             — ดึงรายการอุปกรณ์ทั้งหมด
 * POST   /api/products             — เพิ่มอุปกรณ์ใหม่ (multipart/form-data)
 * PUT    /api/products/:id         — แก้ไขอุปกรณ์ (multipart/form-data)
 * DELETE /api/products/:id         — ลบอุปกรณ์
 * POST   /api/products/:id/image   — อัปโหลดรูปอุปกรณ์แยก
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const router = express.Router();
const pool = require('../db');

// ตั้งค่า Cloudinary (ถ้ามีใน .env)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ใช้ Memory Storage เพื่อจัดการรูปบน Serverless ได้ง่าย
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัด 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
    }
  },
});

// Helper Function: อัปโหลดรูปภาพ
async function uploadImage(file) {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const b64 = Buffer.from(file.buffer).toString('base64');
    let dataURI = "data:" + file.mimetype + ";base64," + b64;
    const res = await cloudinary.uploader.upload(dataURI, { folder: "solar_stock" });
    return res.secure_url;
  } else {
    const ext = path.extname(file.originalname);
    const filename = `product_${Date.now()}${ext}`;
    const dir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    return `/uploads/${filename}`;
  }
}

// Helper Function: ลบรูปภาพ
async function deleteImage(imageUrl) {
  if (!imageUrl) return;
  if (imageUrl.includes('res.cloudinary.com')) {
    try {
      const parts = imageUrl.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      await cloudinary.uploader.destroy(`solar_stock/${filename}`);
    } catch (err) {
      console.error('Failed to delete from Cloudinary:', err.message);
    }
  } else if (imageUrl.startsWith('/uploads/')) {
    try {
      const oldPath = path.join(__dirname, '..', '..', imageUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (err) {
      console.error('Failed to delete local file:', err.message);
    }
  }
}

/**
 * GET /api/products
 * ดึงรายการอุปกรณ์ทั้งหมด เรียงตามชื่อ
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, unit, reorder_point, image_url, created_at FROM products ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * POST /api/products
 * เพิ่มอุปกรณ์ใหม่ (รองรับ multipart/form-data สำหรับ upload รูป)
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, unit, reorder_point = 0 } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: 'name and unit are required' });
    }

    // ถ้ามีไฟล์รูป → อัปโหลดรูปใหม่
    const imageUrl = req.file ? await uploadImage(req.file) : '';

    const result = await pool.query(
      `INSERT INTO products (name, unit, reorder_point, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, unit, reorder_point, image_url, created_at`,
      [name.trim(), unit.trim(), parseInt(reorder_point, 10) || 0, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Product name already exists' });
    }
    console.error('Error creating product:', err.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PUT /api/products/:id
 * แก้ไขอุปกรณ์ (รองรับ multipart/form-data สำหรับเปลี่ยนรูป)
 */
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, reorder_point } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: 'name and unit are required' });
    }

    // ถ้ามีรูปใหม่ → อัปเดต image_url, ถ้าไม่มี → เก็บรูปเดิม
    let imageClause = '';
    let params = [name.trim(), unit.trim(), parseInt(reorder_point, 10) || 0, id];

    if (req.file) {
      imageClause = ', image_url = $5';
      const newImageUrl = await uploadImage(req.file);
      params.push(newImageUrl);

      // ลบรูปเก่า
      const old = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
      await deleteImage(old.rows[0]?.image_url);
    }

    const result = await pool.query(
      `UPDATE products
       SET name = $1, unit = $2, reorder_point = $3${imageClause}
       WHERE id = $4
       RETURNING id, name, unit, reorder_point, image_url, created_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Product name already exists' });
    }
    console.error('Error updating product:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * POST /api/products/:id/image
 * อัปโหลดรูปอุปกรณ์แยก (สำหรับอุปกรณ์ที่มีอยู่แล้ว)
 */
router.post('/:id/image', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // ลบรูปเก่า
    const old = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
    if (old.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    await deleteImage(old.rows[0].image_url);

    const imageUrl = await uploadImage(req.file);
    const result = await pool.query(
      `UPDATE products SET image_url = $1 WHERE id = $2 RETURNING *`,
      [imageUrl, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error uploading image:', err.message);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * DELETE /api/products/:id
 * ลบอุปกรณ์ + ลบรูป + ลบธุรกรรม (CASCADE)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ลบรูป
    const old = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
    await deleteImage(old.rows[0]?.image_url);

    const txnCheck = await pool.query(
      'SELECT COUNT(*) AS count FROM stock_transactions WHERE product_id = $1', [id]
    );
    const txnCount = parseInt(txnCheck.rows[0].count, 10);

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id, name', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product deleted successfully',
      deleted: result.rows[0],
      transactions_deleted: txnCount,
    });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
