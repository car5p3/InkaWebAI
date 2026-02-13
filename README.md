# InkaWebAI
A project for Bembex Lab.

## Stripe Payment Integration
This workspace includes a simple Stripe checkout flow for upgrading users to a "premium" tier.

### Server-side setup
1. Add the following environment variables to your `.env` in the `server` folder:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   CLIENT_URL=http://localhost:3000  # or your deployed client URL
   ```
2. Install the Stripe Node library:
   ```bash
   cd server
   npm install stripe --legacy-peer-deps
   ```
3. Restart the server so the new routes (`/api/stripe/create-checkout-session` and `/api/stripe/webhook`) are available.

### Client-side setup
1. Provide your publishable key in the root `.env` or via your build system:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_API_URL=http://localhost:1000
   ```
   The checkout page does not actually use the publishable key, but you may want it for future Stripe.js usage.
2. Install dependencies if needed:
   ```bash
   cd client
   npm install
   ```
3. Navigate to `/stripe` in the browser; the page will prompt you to login and then create a checkout session.

### Webhook
Stripe will send events to `/api/stripe/webhook` which the server verifies using the `STRIPE_WEBHOOK_SECRET`.
The webhook handler currently listens for `checkout.session.completed`, marks the corresponding user as `isPremium`, and **records an order object** on the user document (session ID, amount, timestamp).
Use the Stripe CLI or dashboard to forward test events locally:
```bash
stripe listen --forward-to localhost:1000/api/stripe/webhook
```

### Testing
- Sign up / login as a normal user.
- After you have finished your chat with the AI you can instruct the assistant to send you to the billing page by including the tag `[GO_STRIPE]` or `[GO_STRIPE 5000]` in its reply (amount is in cents).  This will redirect the client to `/stripe?amount=5000` automatically.
- Alternatively, hop directly to `/stripe?amount=5000` yourself.
- Click "Checkout" and complete the payment with Stripe's test card number `4242 4242 4242 4242`.
- After the webhook is delivered, refresh your user info (e.g. by calling `/api/auth/me` or visiting `/profile`) and you should see `isPremium: true` and a new entry in the `orders` list.

Feel free to modify the price, add subscriptions, or connect additional logic after successful payment.
