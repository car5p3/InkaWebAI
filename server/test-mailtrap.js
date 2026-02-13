import Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import dotenv from "dotenv";
import { verificationEmail } from "./emails/verificationEmail.js";

dotenv.config();

console.log("🧪 Testing Mailtrap Email Setup\n");

// Check 1: API Key
console.log("1️⃣  Checking MAILTRAP_API_KEY...");
if (process.env.MAILTRAP_API_KEY) {
  console.log("   ✅ API Key found:", process.env.MAILTRAP_API_KEY.substring(0, 10) + "...");
} else {
  console.log("   ❌ MAILTRAP_API_KEY is EMPTY in .env");
  process.exit(1);
}

// Check 2: Email FROM
console.log("\n2️⃣  Checking EMAIL_FROM...");
if (process.env.EMAIL_FROM) {
  console.log("   ✅ EMAIL_FROM:", process.env.EMAIL_FROM);
} else {
  console.log("   ⚠️  EMAIL_FROM not set, using default");
}

// Check 3: Create transporter
console.log("\n3️⃣  Creating Mailtrap transporter...");
const transporter = Nodemailer.createTransport(
  MailtrapTransport({
    token: process.env.MAILTRAP_API_KEY,
  })
);

// Check 4: Try sending test email
console.log("\n4️⃣  Attempting test email send...");
const { subject, text, html } = verificationEmail({ 
  username: "TestUser", 
  token: "TEST_TOKEN_123" 
});

const sender = {
  address: "hello@demomailtrap.co",
  name: "InkaWebAI",
};

transporter
  .sendMail({
    from: sender,
    to: ["abdul.rehman.bembexlab@gmail.com"],
    subject,
    text,
    html,
    category: "Test Verification",
  })
  .then(() => {
    console.log("   ✅ Test email sent successfully!");
    console.log("   📧 Check your Mailtrap inbox at https://mailtrap.io/");
    console.log("\n✨ Everything is working! Signup emails will send now.");
  })
  .catch((err) => {
    console.log("   ❌ Failed to send test email:");
    console.log("   Error:", err.message);
  });
