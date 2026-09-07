/**
 * Centralized error handler. Controllers should call next(err) on failure
 * rather than building their own res.status(...) blocks for unexpected errors.
 */
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.status) {
    return res.status(err.status).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
  }

  // Multer upload errors (bad file type, too large, etc).
  if (err.name === 'MulterError' || /image/i.test(err.message || '')) {
    return res.status(400).json({ error: err.message });
  }

  // Postgres unique_violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with that value already exists.' });
  }

  // Postgres foreign_key_violation — e.g. deleting a user who still has orders.
  if (err.code === '23503') {
    return res.status(409).json({
      error: 'This record is referenced by other data (e.g. existing orders) and cannot be deleted. Try banning instead.',
    });
  }

  return res.status(500).json({ error: 'Internal server error.' });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

module.exports = { errorHandler, notFound };
