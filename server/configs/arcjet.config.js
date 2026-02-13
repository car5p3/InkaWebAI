import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";

// Configure rule modes depending on environment. In production use LIVE enforcement;
// in development use MONITOR to observe decisions without hard-blocking, unless
// explicitly configured otherwise via ARCJET_FORCE_LIVE=true.
const isProduction = process.env.NODE_ENV === "production";
const forceLive = process.env.ARCJET_FORCE_LIVE === "true";
// Arcjet accepts 'LIVE' or 'DRY_RUN' for enforcement modes. Use 'DRY_RUN' in non-production.
const ruleMode = isProduction || forceLive ? "LIVE" : "DRY_RUN";

const refillRate = parseInt(process.env.ARCJET_REFILL_RATE || "2", 10);
const interval = parseInt(process.env.ARCJET_INTERVAL || "10", 10);
const capacity = parseInt(process.env.ARCJET_CAPACITY || (isProduction ? "100" : "50"), 10);

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: ruleMode }),
    detectBot({
      mode: ruleMode,
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),
    tokenBucket({
      mode: ruleMode,
      refillRate,
      interval,
      capacity,
    }),
  ],
});

export default aj;