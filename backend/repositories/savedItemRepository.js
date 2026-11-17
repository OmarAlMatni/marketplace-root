const { query } = require('../config/db');

async function toggleSavedItem(userId, productId) {
  // Check if already saved
  const { rows } = await query(
    'SELECT id FROM saved_items WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );

  if (rows.length > 0) {
    // Remove it
    await query('DELETE FROM saved_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    return { isSaved: false };  // ✅ Must return this
  } else {
    // Add it
    await query(
      'INSERT INTO saved_items (user_id, product_id) VALUES ($1, $2)',
      [userId, productId]
    );
    return { isSaved: true };   // ✅ Must return this
  }
}

async function getSavedItems(userId) {
  const { rows } = await query(
    `SELECT p.id, p.title, p.price, p.image_url, p.stock_count, s.created_at AS saved_at
     FROM saved_items s
     JOIN products p ON s.product_id = p.id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows;
}

async function isProductSaved(userId, productId) {
  const { rows } = await query(
    'SELECT 1 FROM saved_items WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return rows.length > 0;
}

module.exports = { toggleSavedItem, getSavedItems, isProductSaved };