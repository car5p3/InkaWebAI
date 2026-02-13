import Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

// Mailtrap MailtrapTransport Configuration
const transporter = Nodemailer.createTransport(
  MailtrapTransport({
    token: process.env.MAILTRAP_API_KEY,
  })
);

// Verify connection
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Mailtrap connection failed:", err.message);
  } else if (success) {
    console.log("✅ Mailtrap transporter ready - emails will send on signup");
  }
});

/**
 * sendEmail - sends an email via Mailtrap
 * @param {{to: string, subject: string, text?: string, html?: string, from?: string}} options
 */
export async function sendEmail({ to, subject, text, html, from }) {
  console.log("📧 sendEmail called with:", { to, subject });
  
  if (!process.env.MAILTRAP_API_KEY) {
    console.error("❌ MAILTRAP_API_KEY not configured in .env");
    throw new Error("Mailtrap API key missing");
  }

  const sender = {
    address: "hello@demomailtrap.co",
    name: "InkaWebAI",
  };

  try {
    console.log("📧 Sending email via Mailtrap...", { from: sender.address, to });
    const info = await transporter.sendMail({
      from: sender,
      to: [to],
      subject,
      text,
      html,
      category: "Verification",
    });
    console.log("✅ Email sent successfully via Mailtrap!");
    console.log("📧 Response:", info);
    return info;
  } catch (err) {
    console.error("❌ Failed to send email:", err && err.message ? err.message : err);
    throw err;
  }
}

export default transporter;
