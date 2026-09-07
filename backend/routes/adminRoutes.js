const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth');

const router = express.Router();

// Every route here requires an authenticated admin or super_admin.
router.use(requireAuth, requireAdmin);

// Dashboard overview — KPI cards + charts
router.get('/dashboard', adminController.getDashboard);

// Product moderation
router.get('/products', adminController.listPendingProducts);
router.patch('/products/:id/approve', adminController.approveProduct);
router.patch('/products/:id/reject', adminController.rejectProduct);

// User management (regular users only — staff accounts are managed below)
router.get('/users', adminController.listUsers);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);

// Admin account management — super_admin only
router.get('/admins', requireSuperAdmin, adminController.listAdmins);
router.post('/admins', requireSuperAdmin, adminController.createAdmin);
router.delete('/admins/:id', requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;