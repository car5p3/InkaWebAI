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
      const PORT = process.env.PORT || 3000;

      // Middleware
      app.use(cors());
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

      // Pre-Custom Middleware
      app.use(arcjetMiddleware);

      // Custom Routes Middlewares
      app.use("/api/auth", authRouter);
      // app.use("/api/chat",);


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