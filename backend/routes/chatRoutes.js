const express = require('express');
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.post('/rooms', requireAuth, chatController.openRoom);
router.get('/rooms', requireAuth, chatController.listRooms);
router.get('/rooms/:roomId/messages', requireAuth, chatController.getHistory);

module.exports = router;
