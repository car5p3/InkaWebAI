import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 2,
      interval: 10,
      capacity: 5,
    }),
  ],
});

export default aj;