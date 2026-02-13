import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["user", "bot"], required: true },
    text: { type: String, required: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

const ChatInstanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "" },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

export const ChatInstance = mongoose.model("ChatInstance", ChatInstanceSchema);
