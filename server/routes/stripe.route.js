import express from 'express';
import { protect } from '../middlewares/isLoggedIn.middleware.js';
import { createCheckoutSession, stripeWebhook, getSession } from '../controllers/stripe.controller.js';

const router = express.Router();

// create checkout session for logged-in user
router.post('/create-checkout-session', protect, createCheckoutSession);

// retrieve a session (protected so only logged-in can inspect their own session)
router.get('/session/:id', protect, getSession);

// webhook route: handled separately in server.js with raw body
// export handler for direct use
export { stripeWebhook };

export default router;