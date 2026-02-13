import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendEmail } from "../utils/email.js";
import { verificationEmail } from "../emails/verificationEmail.js";
import { welcomeEmail } from "../emails/welcomeEmail.js";
import { passwordResetConfirmationEmail } from "../emails/passwordResetConfirmationEmail.js";
import { forgotPasswordEmail } from "../emails/forgotPasswordEmail.js";

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Basic validation (you can expand this as needed)
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // if user already exists, return an error (this is just a placeholder, implement actual logic)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new user (this is just a placeholder, implement actual logic)

    // Hashing the password and saving the user to the database should be done here
    const hashedPassword = await bcrypt.hash(password, 10);
    const verficationToken = generateVerificationCode();
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      verificationToken: verficationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    await newUser.save();

    // Send verification email
    console.log("📧 Attempting to send verification email to:", newUser.email);
    try {
      const { subject, text, html } = verificationEmail({
        username: newUser.username,
        token: verficationToken,
      });
      await sendEmail({ to: newUser.email, subject, text, html });
      console.log("✅ Verification email queued successfully");
    } catch (emailErr) {
      console.error(
        "❌ Failed to send verification email:",
        emailErr && emailErr.message ? emailErr.message : emailErr,
      );
      console.error("Full error:", emailErr);
    }

    // JWT token generation and sending verification email should be done here
    generateTokenAndSetCookie(res, newUser._id);

    // If user creation is successful
    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      user: {
        ...newUser._doc,
        password: undefined,
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
      },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    if (user.verificationTokenExpiresAt < Date.now()) {
      return res.status(400).json({ error: "Verification token has expired" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    // send welcome email
    console.log("📧 Sending welcome email to:", user.email);
    try {
      const { subject, text, html } = welcomeEmail({ username: user.username });
      await sendEmail({ to: user.email, subject, text, html });
      console.log("✅ Welcome email queued successfully");
    } catch (emailErr) {
      console.error(
        "❌ Failed to send welcome email:",
        emailErr && emailErr.message ? emailErr.message : emailErr,
      );
      console.error("Full error:", emailErr);
    }

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // If no user found with the provided email, return an error
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if the provided password matches the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // If login is successful, generate a JWT token and set it in the cookie
    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = Date.now();
    await user.save();

    // Final response on successful login
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        ...user._doc,
        password: undefined,
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // If no user found with the provided email, return an error
    if (!user) {
      return res.status(400).json({ error: "No user found with that email" });
    }

    // Generate a password reset token and set it in the user's record
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpires;
    await user.save();

    // Send password reset email
    console.log("📧 Sending password reset email to:", user.email);
    try {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      const base = clientUrl.replace(/\/$/, "");
      const resetLink = `${base}/reset-password/${resetToken}`;

      const { subject, text, html } = forgotPasswordEmail({
        username: user.username,
        resetLink,
      });
      await sendEmail({ to: user.email, subject, text, html });
      console.log("✅ Password reset email queued successfully");
    } catch (emailErr) {
      console.error(
        "❌ Failed to send password reset email:",
        emailErr && emailErr.message ? emailErr.message : emailErr,
      );
      console.error("Full error:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Error during forgot password:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  try {
    // Validate input
    if (!password || !passwordConfirm) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    // send password reset confirmation email
    console.log("📧 Sending password reset confirmation email to:", user.email);
    try {
      const { subject, text, html } = passwordResetConfirmationEmail({ username: user.username });
      await sendEmail({ to: user.email, subject, text, html });
      console.log("✅ Password reset confirmation email queued successfully");
    } catch (emailErr) {
      console.error(
        "❌ Failed to send password reset confirmation email:",
        emailErr && emailErr.message ? emailErr.message : emailErr,
      );
      console.error("Full error:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error during reset password:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    // protect middleware attaches user to req
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    // avoid sending internal Stripe identifiers
    const { password, stripeCustomerId, resetPasswordToken, verificationToken, ...safe } = user._doc;
    return res.json({ user: safe });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Failed to get user' });
  }
};
