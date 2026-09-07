const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

/**
 * Verifies the Bearer JWT AND re-checks the user's current status in the
 * database on every request. This is what makes a ban or account deletion
 * take effect immediately, instead of only once the JWT naturally expires.
 * The extra lookup is a deliberate tradeoff of one indexed query per
 * request for immediate revocation.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await userRepository.findById(payload.id);

    if (!currentUser) {
      return res.status(401).json({ error: 'This account no longer exists.' });
    }
    if (currentUser.status === 'banned' || currentUser.session_version !== payload.sessionVersion) {
      return res.status(403).json({ error: 'This account has been banned.' });
    }

    // Always trust the DB's current role/status over whatever was baked
    // into the token at login time.
    req.user = { id: currentUser.id, email: currentUser.email, role: currentUser.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Gate a route to admin or super_admin roles. Must run after requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }
  next();
}

/**
 * Gate a route to super_admin only (creating/deleting admin accounts).
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin privileges required.' });
  }
  next();
}

/**
 * Attaches req.user if a valid, active token is present, but never blocks
 * the request. Used on public routes (like the product catalog) that
 * behave slightly differently for logged-in vs anonymous vs admin callers.
 */
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await userRepository.findById(payload.id);
      if (currentUser && currentUser.status !== 'banned') {
        req.user = { id: currentUser.id, email: currentUser.email, role: currentUser.role };
      }
    } catch (err) {
      // Ignore invalid token for optional auth — treat as anonymous.
    }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireSuperAdmin, optionalAuth };
