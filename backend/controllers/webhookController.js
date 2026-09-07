const stripe = require('../config/stripe');
const checkoutService = require('../services/checkoutService');

/**
 * Mounted with express.raw() upstream (see routes/webhookRoutes.js) so the
 * raw request body is available for Stripe's signature verification.
 */
async function stripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await checkoutService.handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('Error processing Stripe webhook event:', err);
    // Still 200 so Stripe doesn't hammer retries for a bug on our side while
    // we investigate — swap to 500 if you'd rather rely on Stripe's retry logic.
    res.status(200).json({ received: true, processed: false });
  }
}

module.exports = { stripeWebhook };
