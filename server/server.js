import 'dotenv/config';
import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import process from "node:process";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
// import passport from "passport";

import { connectDB } from "./database/db.js";

// import "./configs/passport.config.js";

import errorMiddleware from "./middlewares/error.middleware.js";
import arcjetMiddleware from "./middlewares/arcjet.middleware.js";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";
import stripeRouter, { stripeWebhook } from "./routes/stripe.route.js";

const numCPUs = availableParallelism();

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

if (cluster.isPrimary) {
  log(`Primary process ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    log(`Forked worker ${worker.process.pid}`);
  }

  cluster.on("exit", (worker, code, signal) => {
    log(
      `Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`
    );
    cluster.fork();
  });
} else {
  (async () => {
    try {
      await connectDB();
      log("Database connected successfully");

      const app = express();
      app.set("trust proxy", true);
      const PORT = process.env.PORT || 1000;

      // Middleware
      // In development allow the client origin dynamically to avoid CORS issues (Turbopack/dev server)
      const corsOptions = {};
      if (process.env.NODE_ENV === 'production') {
        corsOptions.origin = process.env.CLIENT_URL || "http://localhost:3000";
      } else {
        // reflect request origin back (allow all origins in dev)
        corsOptions.origin = true;
      }
      corsOptions.credentials = true;

      app.use(cors(corsOptions));
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());
      app.use(
        session({
          secret: process.env.SESSION_SECRET,
          resave: false,
          saveUninitialized: false,
        })
      );
      // app.use(passport.initialize());
      // app.use(passport.session());

      // Pre-Custom Middleware (Arcjet) - enable when ARCJET_KEY is configured
      if (process.env.ARCJET_KEY) {
        app.use(arcjetMiddleware);
        console.log('Arcjet middleware enabled');
      } else {
        console.warn('ARCJET_KEY not set; Arcjet middleware not initialized.');
      }

      // Custom Routes Middlewares
      app.use("/api/auth", authRouter);
      app.use("/api/chat", chatRouter);
      app.use("/api/stripe", stripeRouter);

      // stripe webhook must receive raw body for signature verification
      app.post(
        "/api/stripe/webhook",
        express.raw({ type: "application/json" }),
        stripeWebhook
      );


      // Post-Custom Middleware
      app.use(errorMiddleware);

      app.get("/api/", (req, res) => res.send("API is up and running"));
      app.get("/api/google", (req, res) =>
        res.send(
          "<a href='http://localhost:1000/api/auth/google'>Google auth</a>"
        )
      );
      app.get("/api/github", (req, res) =>
        res.send(
          "<a href=`http://localhost:1000/api/auth/github`>Github auth</a>"
        )
      );

      app.listen(PORT, () => {
        log(
          `Server running at http://localhost:${PORT}/api/ (PID: ${process.pid})`
        );
      });
    } catch (error) {
      log("Database connection error: " + error);
      process.exit(1);
    }
  })();
}