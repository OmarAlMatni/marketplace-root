const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const productRepository = require('../repositories/productRepository');
const analyticsRepository = require('../repositories/analyticsRepository');
const { notifyUser } = require('./notificationService');

const SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Dashboard overview — KPI cards + charts (admin + super_admin)
// ---------------------------------------------------------------------------

async function getDashboardOverview({ days = 14, topLimit = 5 } = {}) {
  const [summary, salesOverTime, topProducts, topSellers] = await Promise.all([
    analyticsRepository.getSummaryCounts(),
    analyticsRepository.getSalesOverTime(days),
    analyticsRepository.getTopProducts(topLimit),
    analyticsRepository.getTopSellers(topLimit),
  ]);

  return { summary, salesOverTime, topProducts, topSellers };
}

// ---------------------------------------------------------------------------
// Product moderation (admin + super_admin)
// ---------------------------------------------------------------------------

async function listProductsForReview({ status = 'pending', page, pageSize }) {
  return productRepository.listProducts({ status, page, pageSize });
}

async function approveProduct(productId, reviewerId) {
  const updated = await productRepository.setModerationStatus(productId, {
    status: 'approved',
    feedback: null,
    reviewedBy: reviewerId,
  });
  if (!updated) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  await notifyUser({
    userId: updated.seller_id,
    type: 'listing_approved',
    title: 'Listing approved',
    body: `Your listing "${updated.title}" has been approved and is now visible in the marketplace.`,
    data: { product_id: updated.id, status: updated.status },
  });
  return updated;
}

async function rejectProduct(productId, reviewerId, feedback) {
  if (!feedback || !feedback.trim()) {
    const err = new Error('Feedback is required when rejecting a listing.');
    err.status = 400;
    throw err;
  }
  const updated = await productRepository.setModerationStatus(productId, {
    status: 'rejected',
    feedback: feedback.trim(),
    reviewedBy: reviewerId,
  });
  if (!updated) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  await notifyUser({
    userId: updated.seller_id,
    type: 'listing_rejected',
    title: 'Listing rejected',
    body: `Your listing "${updated.title}" was rejected. Reason: ${updated.rejection_feedback}`,
    data: { product_id: updated.id, status: updated.status },
  });
  return updated;
}

// ---------------------------------------------------------------------------
// User management (admin + super_admin) — view, ban/unban, delete
// ---------------------------------------------------------------------------

async function listUsers(filters) {
  // Admin panel only manages plain users — admin/super_admin accounts are
  // handled separately via listAdmins/createAdmin/deleteAdmin below.
  return userRepository.listUsers({ ...filters, role: filters.role || 'user' });
}

async function setUserBanStatus(userId, banned, actingAdminId) {
  if (userId === actingAdminId) {
    const err = new Error('You cannot ban your own account.');
    err.status = 400;
    throw err;
  }
  const target = await userRepository.findById(userId);
  if (!target) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  if (['admin', 'super_admin'].includes(target.role)) {
    const err = new Error('Use the admin accounts panel to manage staff accounts.');
    err.status = 400;
    throw err;
  }
  return userRepository.setStatus(userId, banned ? 'banned' : 'active');
}

async function deleteUserAccount(userId, actingAdminId) {
  if (userId === actingAdminId) {
    const err = new Error('You cannot delete your own account.');
    err.status = 400;
    throw err;
  }
  const target = await userRepository.findById(userId);
  if (!target) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  if (['admin', 'super_admin'].includes(target.role)) {
    const err = new Error('Use the admin accounts panel to manage staff accounts.');
    err.status = 400;
    throw err;
  }
  const ok = await userRepository.deleteUser(userId);
  if (!ok) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Admin account management (super_admin only)
// ---------------------------------------------------------------------------

async function listAdmins() {
  const { items } = await userRepository.listUsers({ role: 'admin', pageSize: 200 });
  return items;
}

async function createAdmin({ email, password, displayName }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error('An account with that email already exists.');
    err.status = 409;
    throw err;
  }
  if (!password || password.length < 8) {
    const err = new Error('Password must be at least 8 characters.');
    err.status = 400;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return userRepository.createUser({ email, passwordHash, displayName, role: 'admin' });
}

async function deleteAdmin(adminId, actingSuperAdminId) {
  if (adminId === actingSuperAdminId) {
    const err = new Error('You cannot delete your own account.');
    err.status = 400;
    throw err;
  }
  const target = await userRepository.findById(adminId);
  if (!target || target.role !== 'admin') {
    const err = new Error('Admin account not found.');
    err.status = 404;
    throw err;
  }
  const ok = await userRepository.deleteUser(adminId);
  if (!ok) {
    const err = new Error('Admin account not found.');
    err.status = 404;
    throw err;
  }
}

module.exports = {
  getDashboardOverview,
  listProductsForReview,
  approveProduct,
  rejectProduct,
  listUsers,
  setUserBanStatus,
  deleteUserAccount,
  listAdmins,
  createAdmin,
  deleteAdmin,
};