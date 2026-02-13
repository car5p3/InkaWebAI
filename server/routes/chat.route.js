import express from "express";
import { protect } from "../middlewares/isLoggedIn.middleware.js";
import {
	chatHandler,
	createInstance,
	listInstances,
	getInstance,
	deleteInstance,
} from "../controllers/chat.controller.js";

const chatRouter = express.Router();

// conversation actions (requires authentication)
chatRouter.post("/", protect, chatHandler);

// manage chat instances
chatRouter.post("/instances", protect, createInstance);
chatRouter.get("/instances", protect, listInstances);
chatRouter.get("/instances/:id", protect, getInstance);
chatRouter.delete("/instances/:id", protect, deleteInstance);

export default chatRouter;
