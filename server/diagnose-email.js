import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import { verificationEmail } from "./emails/verificationEmail.js";

dotenv.config();

console.log("🧪 Email Setup Diagnostic\n");

// Check 1: API Key
console.log("1️⃣  Checking SENDGRID_API_KEY...");
if (process.env.SENDGRID_API_KEY) {
  console.log("   ✅ API Key found:", process.env.SENDGRID_API_KEY.substring(0, 10) + "...");
} else {
  console.log("   ❌ SENDGRID_API_KEY is EMPTY in .env");
  console.log("   📌 Go to https://sendgrid.com/ → get free key → add to .env");
  process.exit(1);
}

// Check 2: Email FROM
console.log("\n2️⃣  Checking EMAIL_FROM...");
if (process.env.EMAIL_FROM) {
  console.log("   ✅ EMAIL_FROM:", process.env.EMAIL_FROM);
} else {
  console.log("   ⚠️  EMAIL_FROM not set, using default");
}

// Check 3: Try sending test email
console.log("\n3️⃣  Attempting test email send...");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { subject, text, html } = verificationEmail({ 
  username: "TestUser", 
  token: "TEST_TOKEN_123" 
});

const msg = {
  to: "test.email.verify@gmail.com", // Change this to YOUR real email
  from: process.env.EMAIL_FROM || "noreply@inkawebai.com",
  subject,
  text,
  html,
};

sgMail
  .send(msg)
  .then(() => {
    console.log("   ✅ Test email sent successfully!");
    console.log("   📧 Check: test.email.verify@gmail.com");
    console.log("\n✨ Everything is working! Emails will send on signup now.");
  })
  .catch((err) => {
    console.log("   ❌ Failed to send test email:");
    console.log("   Error:", err.message);
    if (err.response) {
      console.log("   Details:", err.response.body);
    }
  });
