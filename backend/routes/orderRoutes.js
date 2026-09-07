const express = require('express');
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middlewares/auth');
const { checkoutLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/checkout', requireAuth, checkoutLimiter, orderController.checkout);
router.get('/mine', requireAuth, orderController.myOrders);

module.exports = router;
