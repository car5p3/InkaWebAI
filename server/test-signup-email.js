import { sendEmail } from "./utils/email.js";
import { verificationEmail } from "./emails/verificationEmail.js";

async function testEmailSend() {
  console.log("🧪 Testing email send via Ethereal...");
  
  try {
    const token = "TEST_VERIFICATION_TOKEN_123456";
    const { subject, text, html } = verificationEmail({ username: "TestUser", token });
    
    console.log("📧 Generated email template:");
    console.log("   Subject:", subject);
    console.log("   To email: test.user@example.com");
    
    const result = await sendEmail({
      to: "test.user@example.com",
      subject,
      text,
      html,
    });
    
    console.log("✅ Email test completed successfully!");
    console.log("📧 Response:", result);
  } catch (err) {
    console.error("❌ Email test failed:", err);
    process.exit(1);
  }
}

testEmailSend();
