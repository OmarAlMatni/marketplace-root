const { query } = require('../config/db');

async function createUser({ email, passwordHash, displayName, role = 'user', verified = true }) {
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, display_name, role, verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, display_name, role, status, verified, preferences, avatar_url, session_version, created_at`,
    [email, passwordHash, displayName || null, role, verified]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(
    'SELECT id, email, display_name, role, status, verified, preferences, avatar_url, session_version, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

async function saveVerificationCode(id, code, expiresAt) {
  await query(
    'UPDATE users SET verification_code = $2, verification_expires_at = $3 WHERE id = $1',
    [id, code, expiresAt]
  );
}

async function updateUnverifiedUser(id, { passwordHash, displayName }) {
  const { rows } = await query(
    `UPDATE users
     SET password_hash = $2, display_name = $3
     WHERE id = $1 AND verified = FALSE
    RETURNING id, email, display_name, role, status, verified, preferences, avatar_url, session_version, created_at`,
    [id, passwordHash, displayName || null]
  );
  return rows[0] || null;
}

async function verifyUser(id) {
  const { rows } = await query(
    `UPDATE users
     SET verified = TRUE, verification_code = NULL, verification_expires_at = NULL
     WHERE id = $1
     RETURNING id, email, display_name, role, status, verified, created_at`,
    [id]
  );
  return rows[0] || null;
}

async function updateProfile(id, { displayName, preferences }) {
  const { rows } = await query(
    `UPDATE users
     SET display_name = COALESCE($2, display_name), preferences = COALESCE($3, preferences)
     WHERE id = $1
    RETURNING id, email, display_name, role, status, verified, preferences, avatar_url, session_version, created_at`,
    [id, displayName ?? null, preferences ? JSON.stringify(preferences) : null]
  );
  return rows[0] || null;
}

async function updateAvatar(id, avatarUrl) {
  const { rows } = await query(
    `UPDATE users SET avatar_url = $2 WHERE id = $1
     RETURNING id, email, display_name, role, status, verified, preferences, avatar_url, session_version, created_at`,
    [id, avatarUrl]
  );
  return rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  const { rows } = await query(
    `UPDATE users SET password_hash = $2, session_version = session_version + 1
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, email, display_name, role, status, verified, preferences, avatar_url, session_version, created_at`,
    [id, passwordHash]
  );
  return rows[0] || null;
}

async function revokeOtherSessions(id) {
  const { rows } = await query(
    'UPDATE users SET session_version = session_version + 1 WHERE id = $1 AND deleted_at IS NULL RETURNING session_version',
    [id]
  );
  return rows[0] || null;
}

async function saveTaxDocument(id, documentUrl) {
  const { rows } = await query(
    `UPDATE users SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{taxDocumentUrl}', to_jsonb($2::text), true)
     WHERE id = $1
     RETURNING id, email, display_name, role, status, verified, preferences, avatar_url, session_version, created_at`,
    [id, documentUrl]
  );
  return rows[0] || null;
}

async function softDelete(id) {
  const { rows } = await query(
    `UPDATE users SET deleted_at = NOW(), status = 'banned', session_version = session_version + 1
     WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

async function exportData(id) {
  const [user, products, orders, messages, notifications] = await Promise.all([
    query('SELECT id, email, display_name, role, status, verified, preferences, avatar_url, created_at FROM users WHERE id = $1', [id]),
    query('SELECT id, title, description, category, price, stock_count, image_url, status, created_at FROM products WHERE seller_id = $1', [id]),
    query('SELECT id, total_amount, status, created_at FROM orders WHERE buyer_id = $1', [id]),
    query('SELECT id, room_id, message_text, created_at FROM messages WHERE sender_id = $1', [id]),
    query('SELECT id, type, title, body, read_at, created_at FROM notifications WHERE user_id = $1', [id]),
  ]);
  return { user: user.rows[0], products: products.rows, orders: orders.rows, messages: messages.rows, notifications: notifications.rows };
}

/**
 * Paginated user listing for the admin panel. Excludes password hashes.
 * Filters: role ('user' | 'admin' | 'super_admin'), status ('active' | 'banned'), search (email/display name).
 */
async function listUsers({ role, status, search, page = 1, pageSize = 25 } = {}) {
  const conditions = [];
  const params = [];

  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(email ILIKE $${params.length} OR display_name ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Math.max(1, page) - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await query(
    `SELECT id, email, display_name, role, status, verified, avatar_url, created_at FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
    params.slice(0, params.length - 2)
  );

  return { items: rows, total: countRows[0].total, page, pageSize };
}

async function setStatus(id, status) {
  const { rows } = await query(
    `UPDATE users SET status = $2 WHERE id = $1 RETURNING id, email, display_name, role, status`,
    [id, status]
  );
  return rows[0] || null;
}

async function deleteUser(id) {
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  saveVerificationCode,
  updateUnverifiedUser,
  verifyUser,
  updateProfile,
  updateAvatar,
  updatePassword,
  revokeOtherSessions,
  saveTaxDocument,
  softDelete,
  exportData,
  listUsers,
  setStatus,
  deleteUser,
};
