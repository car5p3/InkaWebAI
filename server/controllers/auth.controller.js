import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendEmail } from "../utils/email.js";
import { verificationEmail } from "../emails/verificationEmail.js";

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
      const { subject, text, html } = verificationEmail({ username: newUser.username, token: verficationToken });
      await sendEmail({ to: newUser.email, subject, text, html });
      console.log("✅ Verification email queued successfully");
    } catch (emailErr) {
      console.error("❌ Failed to send verification email:", emailErr && emailErr.message ? emailErr.message : emailErr);
      console.error("Full error:", emailErr);
    }

    // JWT token generation and sending verification email should be done here
    generateTokenAndSetCookie(res, newUser._id);

    // If user creation is successful
    res
      .status(201)
      .json({ success: true, message: "User signed up successfully", user: {
        ...newUser._doc,
        password: undefined,
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
      } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = (req, res) => {
  res.send("Login route is working");
};

export const logout = (req, res) => {
  res.send("Logout route is working");
};
