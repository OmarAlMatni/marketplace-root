const express = require('express');
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);
router.get('/', notificationController.list);
router.post('/read-all', notificationController.markAllRead);

module.exports = router;