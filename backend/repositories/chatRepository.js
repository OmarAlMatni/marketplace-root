const { query } = require('../config/db');

async function findOrCreateRoom({ productId, buyerId, sellerId }) {
  const existing = await query(
    'SELECT * FROM chat_rooms WHERE product_id = $1 AND buyer_id = $2',
    [productId, buyerId]
  );
  if (existing.rows[0]) return existing.rows[0];

  const { rows } = await query(
    `INSERT INTO chat_rooms (product_id, buyer_id, seller_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [productId, buyerId, sellerId]
  );
  return rows[0];
}

async function listRoomsForUser(userId) {
  const { rows } = await query(
    `SELECT cr.*, p.title AS product_title, p.image_url AS product_image
     FROM chat_rooms cr
     JOIN products p ON p.id = cr.product_id
     WHERE cr.buyer_id = $1 OR cr.seller_id = $1
     ORDER BY cr.created_at DESC`,
    [userId]
  );
  return rows;
}

async function isParticipant(roomId, userId) {
  const { rows } = await query(
    'SELECT 1 FROM chat_rooms WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
    [roomId, userId]
  );
  return rows.length > 0;
}

async function getParticipants(roomId) {
  const { rows } = await query('SELECT buyer_id, seller_id FROM chat_rooms WHERE id = $1', [roomId]);
  return rows[0] || null;
}

async function saveMessage({ roomId, senderId, text }) {
  const { rows } = await query(
    `INSERT INTO messages (room_id, sender_id, message_text)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [roomId, senderId, text]
  );
  return rows[0];
}

async function listMessages(roomId, limit = 100) {
  const { rows } = await query(
    `SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [roomId, limit]
  );
  return rows;
}

module.exports = { findOrCreateRoom, listRoomsForUser, isParticipant, getParticipants, saveMessage, listMessages };
