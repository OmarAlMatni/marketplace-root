const { query } = require('../config/db');

async function create({ userId, type, title, body }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, title, body)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, type, title, body]
  );
  return rows[0];
}

async function listForUser(userId) {
  const { rows } = await query(
    `SELECT id, type, title, body, read_at, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [userId]
  );
  return rows;
}

async function unreadCount(userId) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return rows[0].count;
}

async function markAllRead(userId) {
  await query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL', [userId]);
}

module.exports = { create, listForUser, unreadCount, markAllRead };