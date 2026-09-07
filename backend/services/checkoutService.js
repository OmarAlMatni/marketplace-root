const stripe = require('../config/stripe');
const { withTransaction } = require('../config/db');
const productRepository = require('../repositories/productRepository');
const orderRepository = require('../repositories/orderRepository');

/**
 * High-Concurrency Flash-Sale Engine.
 *
 * cartItems: [{ productId, quantity }, ...]
 *
 * The entire stock check + decrement + order write happens inside ONE
 * database transaction. Each product row is locked with
 * `SELECT ... FOR UPDATE` before its stock is evaluated, so if two buyers
 * race for the last unit of the same product, the second transaction
 * blocks on the row lock until the first COMMITs or ROLLBACKs — it never
 * sees stale stock and can never oversell.
 */
async function checkout({ buyerId, cartItems }) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    const err = new Error('Cart is empty.');
    err.status = 400;
    throw err;
  }

  return withTransaction(async (client) => {
    let totalAmount = 0;
    const lineItems = [];

    // Sort by productId so concurrent checkouts always acquire row locks
    // in the same order, preventing cross-transaction deadlocks.
    const sortedItems = [...cartItems].sort((a, b) => (a.productId > b.productId ? 1 : -1));

    for (const item of sortedItems) {
      const product = await productRepository.lockForUpdate(client, item.productId);
      if (!product) {
        const err = new Error(`Product ${item.productId} does not exist.`);
        err.status = 404;
        throw err;
      }
      if (product.stock_count < item.quantity) {
        const err = new Error(`"${product.title}" only has ${product.stock_count} unit(s) left.`);
        err.status = 409;
        throw err;
      }

      const updated = await productRepository.decrementStock(client, item.productId, item.quantity);
      if (!updated) {
        // Someone else grabbed stock between the lock read and this write —
        // should be impossible under FOR UPDATE, but guard anyway.
        const err = new Error(`"${product.title}" just sold out. Please try again.`);
        err.status = 409;
        throw err;
      }

      totalAmount += product.price * item.quantity;
      lineItems.push({ productId: product.id, quantity: item.quantity, priceAtPurchase: product.price });
    }

    // Create the Stripe PaymentIntent for the locked-in total.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: { buyerId },
    });

    const order = await orderRepository.createOrder(client, {
      buyerId,
      totalAmount,
      paymentIntentId: paymentIntent.id,
      status: 'pending',
    });

    for (const li of lineItems) {
      await orderRepository.addOrderItem(client, { orderId: order.id, ...li });
    }

    return {
      order,
      clientSecret: paymentIntent.client_secret,
    };
  });
}

/**
 * Asynchronous Stripe Webhook Pipeline.
 * Called from the raw-body webhook route after signature verification.
 */
async function handleStripeEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const order = await orderRepository.markPaidByPaymentIntent(intent.id);
      if (!order) {
        console.warn(`Received payment_intent.succeeded for unknown intent ${intent.id}`);
      }
      return order;
    }
    case 'payment_intent.payment_failed': {
      // In a fuller build this would restock inventory and mark the order 'cancelled'.
      console.warn(`Payment failed for intent ${event.data.object.id}`);
      return null;
    }
    default:
      // Unhandled event types are acknowledged but ignored.
      return null;
  }
}

module.exports = { checkout, handleStripeEvent };
