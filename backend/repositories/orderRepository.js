const { query } = require('../config/db');

async function createOrder(client, { buyerId, totalAmount, paymentIntentId, status = 'pending' }) {
  const { rows } = await client.query(
    `INSERT INTO orders (buyer_id, total_amount, payment_intent_id, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [buyerId, totalAmount, paymentIntentId, status]
  );
  return rows[0];
}

async function addOrderItem(client, { orderId, productId, quantity, priceAtPurchase }) {
  const { rows } = await client.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orderId, productId, quantity, priceAtPurchase]
  );
  return rows[0];
}

async function findByPaymentIntent(paymentIntentId) {
  const { rows } = await query('SELECT * FROM orders WHERE payment_intent_id = $1', [paymentIntentId]);
  return rows[0] || null;
}

async function markPaidByPaymentIntent(paymentIntentId) {
  const { rows } = await query(
    `UPDATE orders SET status = 'paid' WHERE payment_intent_id = $1 RETURNING *`,
    [paymentIntentId]
  );
  return rows[0] || null;
}

async function listForBuyer(buyerId) {
  const { rows } = await query(
    `SELECT o.*,
            json_agg(json_build_object(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price_at_purchase', oi.price_at_purchase
            )) AS items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.buyer_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [buyerId]
  );
  return rows;
}

module.exports = { createOrder, addOrderItem, findByPaymentIntent, markPaidByPaymentIntent, listForBuyer };
