const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middlewares/auth');
const { query } = require('../config/db');

const router = express.Router();

// 1. Create or get an existing chat room
router.post('/rooms', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user.id;
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    const { rows: existingRooms } = await query(
      `SELECT id FROM chat_rooms WHERE product_id = $1 AND buyer_id = $2`,
      [productId, buyerId]
    );
    if (existingRooms.length > 0) return res.json({ id: existingRooms[0].id });

    const { rows: products } = await query(`SELECT seller_id FROM products WHERE id = $1`, [productId]);
    if (products.length === 0) return res.status(404).json({ error: 'Product not found' });

    const sellerId = products[0].seller_id;
    if (buyerId === sellerId) return res.status(400).json({ error: 'You cannot start a chat with yourself.' });

    const { rows: newRooms } = await query(
      `INSERT INTO chat_rooms (product_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING id`,
      [productId, buyerId, sellerId]
    );
    res.status(201).json({ id: newRooms[0].id });
  } catch (err) { next(err); }
});

// 2. Get all chat rooms for the current user
router.get('/rooms', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await query(
      `SELECT 
         cr.id, cr.product_id, cr.buyer_id, cr.seller_id,
         p.title AS product_title, p.image_url AS product_image,
         CASE WHEN cr.buyer_id = $1 THEN cr.seller_id ELSE cr.buyer_id END AS other_user_id,
         CASE WHEN cr.buyer_id = $1 THEN u_seller.display_name ELSE u_buyer.display_name END AS other_user_name,
         CASE WHEN cr.buyer_id = $1 THEN u_seller.avatar_url ELSE u_buyer.avatar_url END AS other_user_avatar,
         (SELECT message_text FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM chat_rooms cr
       JOIN products p ON cr.product_id = p.id
       LEFT JOIN users u_buyer ON cr.buyer_id = u_buyer.id
       LEFT JOIN users u_seller ON cr.seller_id = u_seller.id
       WHERE cr.buyer_id = $1 OR cr.seller_id = $1
       ORDER BY last_message_at DESC NULLS LAST`,
      [userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// 3. Get messages for a specific room
router.get('/rooms/:roomId/messages', requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { rows } = await query(
      `SELECT id, room_id, sender_id, message_text, created_at FROM messages WHERE room_id = $1 ORDER BY created_at ASC`,
      [roomId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// 4. Block user
router.post('/block-user', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.body;
    await query(
      `INSERT INTO blocked_users (user_id, blocked_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.id, userId]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// 5. Delete chat room
router.delete('/rooms/:roomId', requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    await query(`DELETE FROM chat_rooms WHERE id = $1`, [roomId]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// 6. Report a conversation (THIS WAS TRAPPED INSIDE THE DELETE ROUTE BEFORE!)
router.post('/report', requireAuth, async (req, res, next) => {
  try {
    const { roomId, reason, reportedUserId } = req.body;
    
    if (!roomId || !reason) {
      return res.status(400).json({ error: 'Room ID and reason are required' });
    }

    const { rows } = await query(
      `INSERT INTO chat_reports (room_id, reporter_id, reported_user_id, reason, status)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'pending')
       RETURNING id`,
      [roomId, req.user.id, reportedUserId || null, reason]
    );

    res.json({ success: true, reportId: rows[0].id });
  } catch (err) {
    console.error('Failed to create report:', err);
    next(err);
  }
});

// ==========================================
// IMAGE UPLOAD ROUTES
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Only image files are allowed!'));
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

router.post('/upload-image', requireAuth, upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) { next(err); }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File size too large. Max 5MB' });
  }
  next(err);
});

module.exports = router;