import express from "express";
import { forgotPassword, login, logout, resetPassword, signup, verifyEmail, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/isLoggedIn.middleware.js";

const authRouter = express.Router();

// Login
authRouter.post("/", login);

// Signup
authRouter.post("/signup", signup);

// Email verification
authRouter.post("/verify-email", verifyEmail);

// Forgot password
authRouter.post("/forgot-password", forgotPassword);

// Reset password
authRouter.post("/reset-password/:token", resetPassword);

// Logout
authRouter.post("/logout", logout);

// Current authenticated user
authRouter.get("/me", protect, getMe);

export default authRouter;