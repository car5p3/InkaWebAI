import Stripe from 'stripe';
import { User } from '../models/user.model.js';

// ensure secret key is provided; avoid throwing deep inside the Stripe lib
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error('Environment variable STRIPE_SECRET_KEY must be set');
}
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2022-11-15',
});

// create checkout session and return url
export const createCheckoutSession = async (req, res) => {
  try {
    const user = req.user; // set by protect middleware
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    // create or retrieve customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // amount comes from request body (in cents); fall back to default 5000 ($50) or premium price
    let amount = 5000;
    let description = 'Service Charge';
    if (req.body && typeof req.body.amount === 'number') {
      amount = req.body.amount;
    }
    if (req.body && typeof req.body.description === 'string') {
      description = req.body.description;
    }
    if (amount < 50) amount = 50; // at least 50 cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: description },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer: customerId,
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/stripe/cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// retrieve a checkout session (optional)
export const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await stripe.checkout.sessions.retrieve(id, { expand: ['customer'] });
    res.json({ session });
  } catch (err) {
    console.error('getSession error:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// webhook handler
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // mark user as premium and add order record
      if (session.customer) {
        try {
          const user = await User.findOne({ stripeCustomerId: session.customer });
          if (user) {
            user.isPremium = true;
            // record order info (amount is in session.amount_total)
            user.orders = user.orders || [];
            user.orders.push({
              sessionId: session.id,
              amount: session.amount_total || 0,
              description: session.amount_subtotal ? `Paid $${(session.amount_subtotal/100).toFixed(2)}` : 'Checkout',
            });
            await user.save();
            console.log(`User ${user.email} marked as premium via webhook and order recorded`);
          }
        } catch (e) {
          console.error('Error updating user to premium or recording order:', e);
        }
      }
      break;
    }
    // ... handle other event types as needed
    default:
      console.log(`Unhandled stripe event type ${event.type}`);
  }

  res.json({ received: true });
};