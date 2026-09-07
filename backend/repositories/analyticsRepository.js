const { query } = require('../config/db');

/**
 * All revenue figures here are calculated only from orders with
 * status = 'paid' — pending/cancelled orders never count as sales.
 */

async function getSummaryCounts() {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'user') AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'user' AND status = 'banned') AS banned_users,
      (SELECT COUNT(*)::int FROM products) AS total_products,
      (SELECT COUNT(*)::int FROM products WHERE status = 'pending') AS pending_products,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'paid') AS total_paid_orders,
      (SELECT COALESCE(SUM(total_amount), 0)::int FROM orders WHERE status = 'paid') AS total_revenue,
      (SELECT COALESCE(SUM(total_amount), 0)::int FROM orders
         WHERE status = 'paid' AND created_at >= CURRENT_DATE) AS today_sales,
      (SELECT COUNT(*)::int FROM orders
         WHERE status = 'paid' AND created_at >= CURRENT_DATE) AS today_order_count
  `);
  return rows[0];
}

/**
 * Daily paid-order totals for the last `days` days, zero-filled for days
 * with no sales so the chart doesn't skip gaps.
 */
async function getSalesOverTime(days = 14) {
  const { rows } = await query(
    `
    SELECT d::date AS date, COALESCE(SUM(o.total_amount), 0)::int AS total
    FROM generate_series((CURRENT_DATE - ($1::int - 1)), CURRENT_DATE, interval '1 day') AS d
    LEFT JOIN orders o ON DATE(o.created_at) = d AND o.status = 'paid'
    GROUP BY d
    ORDER BY d ASC
    `,
    [days]
  );
  return rows;
}

async function getTopProducts(limit = 5) {
  const { rows } = await query(
    `
    SELECT p.id, p.title, p.image_url,
           SUM(oi.quantity)::int AS units_sold,
           SUM(oi.quantity * oi.price_at_purchase)::int AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id AND o.status = 'paid'
    JOIN products p ON p.id = oi.product_id
    GROUP BY p.id
    ORDER BY units_sold DESC
    LIMIT $1
    `,
    [limit]
  );
  return rows;
}

async function getTopSellers(limit = 5) {
  const { rows } = await query(
    `
    SELECT u.id, u.display_name, u.email,
           SUM(oi.quantity)::int AS units_sold,
           SUM(oi.quantity * oi.price_at_purchase)::int AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id AND o.status = 'paid'
    JOIN products p ON p.id = oi.product_id
    JOIN users u ON u.id = p.seller_id
    GROUP BY u.id
    ORDER BY revenue DESC
    LIMIT $1
    `,
    [limit]
  );
  return rows;
}

module.exports = { getSummaryCounts, getSalesOverTime, getTopProducts, getTopSellers };
