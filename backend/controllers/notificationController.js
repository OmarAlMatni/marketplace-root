const notificationRepository = require('../repositories/notificationRepository');

async function list(req, res, next) {
  try {
    const [items, unreadCount] = await Promise.all([
      notificationRepository.listForUser(req.user.id),
      notificationRepository.unreadCount(req.user.id),
    ]);
    res.json({ items, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationRepository.markAllRead(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markAllRead };