const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// NOTE: express.raw() must run here (not express.json() globally) so Stripe
// can verify the signature against the exact raw request bytes.
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.stripeWebhook);

module.exports = router;
