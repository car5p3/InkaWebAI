import express from "express";
import { login, logout, signup } from "../controllers/auth.controller.js";

const authRouter = express.Router();

// Login
authRouter.post("/", login);

// Signup
authRouter.post("/signup", signup);

// Logout
authRouter.post("/logout", logout);

export default authRouter;