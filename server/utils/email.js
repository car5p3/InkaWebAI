import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Generic SMTP transporter using nodemailer and environment variables.
// This allows you to plug in ANY SMTP server for any domain you control.
// Just set the appropriate variables in your .env file:
//
// EMAIL_HOST=smtp.yourdomain.com      # SMTP server for your custom domain
// EMAIL_PORT=465                      # usually 465 or 587
// EMAIL_SECURE=true                   # true if using TLS on port 465
// EMAIL_USER=sender@yourdomain.com    # account you're sending from
// EMAIL_PASS=your_smtp_password       # SMTP password (or app password)
//
// The `EMAIL_FROM` variable determines the From header; you can include
// a branded address such as "Support <support@yourdomain.com>" and the
// mail server/domain do not need to match the host, although many
// providers require authenticated identity to match or be allowed.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: process.env.EMAIL_USER
    ? {
        user: process.env.EMAIL_USER,
        // some setups use EMAIL_PASS, others use EMAIL_PASSWORD; prefer PASS but fall back
        pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
      }
    : undefined,
});

// verify connection
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP transporter verification failed:", err.message);
  } else if (success) {
    console.log("✅ SMTP transporter ready (nodemailer)");
  }
});

/**
 * sendEmail - sends an email using the configured SMTP transporter
 * @param {{to: string, subject: string, text?: string, html?: string, from?: string}} options
 */
export async function sendEmail({ to, subject, text, html, from }) {
  console.log("📧 sendEmail called with:", { to, subject });

  const mailOptions = {
    from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  try {
    console.log("📧 Sending via SMTP", { from: mailOptions.from, to: mailOptions.to });
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ SMTP email sent. Message ID:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ SMTP send failed:", err && err.message ? err.message : err);
    throw err;
  }
}

export default transporter;
