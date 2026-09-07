const adminService = require('../services/adminService');

// --- Dashboard overview ---

async function getDashboard(req, res, next) {
  try {
    const { days, limit } = req.query;
    const overview = await adminService.getDashboardOverview({
      days: days ? Number(days) : 14,
      topLimit: limit ? Number(limit) : 5,
    });
    res.json(overview);
  } catch (err) {
    next(err);
  }
}

// --- Product moderation ---

async function listPendingProducts(req, res, next) {
  try {
    const { status, page, pageSize } = req.query;
    const result = await adminService.listProductsForReview({
      status: status || 'pending',
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function approveProduct(req, res, next) {
  try {
    const product = await adminService.approveProduct(req.params.id, req.user.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function rejectProduct(req, res, next) {
  try {
    const { feedback } = req.body;
    const product = await adminService.rejectProduct(req.params.id, req.user.id, feedback);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// --- User management ---

async function listUsers(req, res, next) {
  try {
    const { status, search, page, pageSize } = req.query;
    const result = await adminService.listUsers({
      status,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function banUser(req, res, next) {
  try {
    const user = await adminService.setUserBanStatus(req.params.id, true, req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function unbanUser(req, res, next) {
  try {
    const user = await adminService.setUserBanStatus(req.params.id, false, req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await adminService.deleteUserAccount(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// --- Admin account management (super_admin only) ---

async function listAdmins(req, res, next) {
  try {
    const admins = await adminService.listAdmins();
    res.json(admins);
  } catch (err) {
    next(err);
  }
}

async function createAdmin(req, res, next) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const admin = await adminService.createAdmin({ email, password, displayName });
    res.status(201).json(admin);
  } catch (err) {
    next(err);
  }
}

async function deleteAdmin(req, res, next) {
  try {
    await adminService.deleteAdmin(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  listPendingProducts,
  approveProduct,
  rejectProduct,
  listUsers,
  banUser,
  unbanUser,
  deleteUser,
  listAdmins,
  createAdmin,
  deleteAdmin,
};