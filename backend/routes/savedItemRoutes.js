const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth'); // Adjust path to your auth middleware
const savedItemController = require('../controllers/savedItemController');

// All routes require authentication
router.use(requireAuth);

router.post('/toggle', savedItemController.toggleSavedItem);
router.get('/', savedItemController.getSavedItems);

module.exports = router;