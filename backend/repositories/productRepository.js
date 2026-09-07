const { query } = require('../config/db');

/**
 * Deep-filtering list query. Supports category, price range, search text,
 * seller filter, moderation status, sorting, and pagination.
 *
 * `status` is passed explicitly by the service layer based on who's
 * asking (see productService.list) — this repository just applies
 * whatever filter it's given.
 */
async function listProducts({
  category,
  minPrice,
  maxPrice,
  search,
  sellerId,
  status,
  sortBy = 'created_at',
  sortDir = 'DESC',
  page = 1,
  pageSize = 24,
}) {
  const conditions = [];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (minPrice !== undefined) {
    params.push(minPrice);
    conditions.push(`price >= $${params.length}`);
  }
  if (maxPrice !== undefined) {
    params.push(maxPrice);
    conditions.push(`price <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }
  if (sellerId) {
    params.push(sellerId);
    conditions.push(`seller_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (!sellerId) {
    conditions.push(`NOT EXISTS (
      SELECT 1 FROM users seller
      WHERE seller.id = products.seller_id
        AND COALESCE((seller.preferences->>'vacationMode')::boolean, false) = true
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSort = new Set(['created_at', 'price', 'title']);
  const safeSortBy = allowedSort.has(sortBy) ? sortBy : 'created_at';
  const safeSortDir = sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (Math.max(1, page) - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await query(
    `SELECT * FROM products
     ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortDir}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM products ${whereClause}`,
    params.slice(0, params.length - 2)
  );

  return { items: rows, total: countRows[0].total, page, pageSize };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ sellerId, title, description, category, price, sku, stockCount, imageUrl, status }) {
  const { rows } = await query(
    `INSERT INTO products (seller_id, title, description, category, price, sku, stock_count, image_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [sellerId, title, description || null, category || null, price, sku, stockCount ?? 1, imageUrl || null, status || 'pending']
  );
  return rows[0];
}

/**
 * Owner-scoped update (seller editing their own listing). Editing a listing
 * resets it back to 'pending' review unless the seller is themself an
 * admin/super_admin — enforced in the service layer, not here.
 */
async function update(id, sellerId, fields) {
  const allowed = ['title', 'description', 'category', 'price', 'stock_count', 'image_url', 'status', 'rejection_feedback', 'reviewed_by', 'reviewed_at'];
  const sets = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      params.push(value);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (sets.length === 0) return findById(id);

  params.push(id, sellerId);
  const { rows } = await query(
    `UPDATE products SET ${sets.join(', ')}
     WHERE id = $${params.length - 1} AND seller_id = $${params.length}
     RETURNING *`,
    params
  );
  return rows[0] || null;
}

async function remove(id, sellerId) {
  const { rows } = await query('DELETE FROM products WHERE id = $1 AND seller_id = $2 RETURNING *', [id, sellerId]);
  return rows[0] || null;
}

/**
 * Admin moderation actions — not scoped to seller_id, since the admin
 * reviewing a listing is never its owner.
 */
async function setModerationStatus(id, { status, feedback, reviewedBy }) {
  const { rows } = await query(
    `UPDATE products
     SET status = $2, rejection_feedback = $3, reviewed_by = $4, reviewed_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, feedback || null, reviewedBy]
  );
  return rows[0] || null;
}

/**
 * Row-level locking read used inside the checkout transaction:
 * SELECT ... FOR UPDATE blocks concurrent checkouts on the same row
 * until this transaction commits or rolls back.
 */
async function lockForUpdate(client, productId) {
  const { rows } = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
  return rows[0] || null;
}

async function decrementStock(client, productId, quantity) {
  const { rows } = await client.query(
    `UPDATE products SET stock_count = stock_count - $2
     WHERE id = $1 AND stock_count >= $2
     RETURNING *`,
    [productId, quantity]
  );
  return rows[0] || null;
}

module.exports = {
  listProducts,
  findById,
  create,
  update,
  remove,
  setModerationStatus,
  lockForUpdate,
  decrementStock,
};
