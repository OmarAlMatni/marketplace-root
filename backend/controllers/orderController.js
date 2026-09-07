const checkoutService = require('../services/checkoutService');
const orderRepository = require('../repositories/orderRepository');

async function checkout(req, res, next) {
  try {
    const { cartItems } = req.body;
    const result = await checkoutService.checkout({ buyerId: req.user.id, cartItems });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function myOrders(req, res, next) {
  try {
    const orders = await orderRepository.listForBuyer(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, myOrders };
