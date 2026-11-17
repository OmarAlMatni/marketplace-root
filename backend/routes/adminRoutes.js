const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth');
const { query } = require('../config/db');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// ... (Keep your existing dashboard, products, and users routes here) ...
router.get('/dashboard', adminController.getDashboard);
router.get('/products', adminController.listPendingProducts);
router.patch('/products/:id/approve', adminController.approveProduct);
router.patch('/products/:id/reject', adminController.rejectProduct);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);

// ==========================================
// REPORTS MANAGEMENT
// ==========================================

// GET /api/admin/reports
router.get('/reports', async (req, res, next) => {
  try {
    const { status } = req.query;
    const queryText = `
      SELECT 
        r.id, r.reason, r.status, r.created_at,
        json_build_object('id', reporter.id, 'name', reporter.display_name, 'email', reporter.email) as reporter,
        json_build_object('id', reported_user.id, 'name', reported_user.display_name, 'email', reported_user.email) as reported_user
      FROM chat_reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
      WHERE $1 = 'all' OR r.status = $1
      ORDER BY r.created_at DESC
    `;
    const { rows } = await query(queryText, [status || 'all']);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/admin/reports/:id/action (Handle Warning, Message, Ban, Resolve, Dismiss)
router.post('/reports/:id/action', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, customMessage } = req.body; // action: 'warning', 'message', 'ban', 'resolve', 'dismiss'

    // 1. Get report details
    const { rows: reportRows } = await query(`SELECT reporter_id, reported_user_id, status FROM chat_reports WHERE id = $1`, [id]);
    if (!reportRows.length) return res.status(404).json({ error: 'Report not found' });
    const report = reportRows[0];

    // 2. Perform Action
    if (action === 'ban' && report.reported_user_id) {
      await query(`UPDATE users SET status = 'banned' WHERE id = $1`, [report.reported_user_id]);
    }

    // 3. Notify Reported User (if warning or message)
    if ((action === 'warning' || action === 'message') && report.reported_user_id && customMessage) {
      const title = action === 'warning' ? '⚠️ Admin Warning' : '💬 Message from Admin';
      await query(
        `INSERT INTO notifications (user_id, type, title, body) VALUES ($1, 'system', $2, $3)`,
        [report.reported_user_id, title, customMessage]
      );
    }

    // 4. Update Report Status
    const newStatus = action === 'dismiss' ? 'dismissed' : 'resolved';
    await query(`UPDATE chat_reports SET status = $1, resolved_at = NOW() WHERE id = $2`, [newStatus, id]);

    // 5. Notify the Reporter
    if (report.reporter_id) {
      let reporterMsg = "We have reviewed your report and took action.";
      if (action === 'dismiss') reporterMsg = "We reviewed your report but found no violation to act upon.";
      await query(
        `INSERT INTO notifications (user_id, type, title, body) VALUES ($1, 'system', 'Report Update', $2)`,
        [report.reporter_id, reporterMsg]
      );
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ... (Keep your admin accounts routes at the bottom) ...
router.get('/admins', requireSuperAdmin, adminController.listAdmins);
router.post('/admins', requireSuperAdmin, adminController.createAdmin);
router.delete('/admins/:id', requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;