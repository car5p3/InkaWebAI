import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      minLength: [8, "Password cannot be less than 8 characters in length."],
      maxLength: [64, "Password cannot be more than 64 characters in length."],
    }, // Password is optional for OAuth users

    phone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
    },

    isVerified: { type: Boolean, default: false },

    resetPasswordToken: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
    verificationToken: { type: String, default: null },
    verificationExpiresAt: { type: Date, default: null },

    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    lastLogin: { type: Date, default: Date.now },

    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", UserSchema);