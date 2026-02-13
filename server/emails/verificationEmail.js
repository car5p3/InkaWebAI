export function verificationEmail({ username, token }) {
  const callbackUrl = process.env.CALLBACK_URL || "http://localhost:3000";
  const base = callbackUrl.replace(/\/$/, "");
  const verifyLink = `${base}/verify?token=${encodeURIComponent(token)}`;

  const subject = "Verify your email — InkaWebAI";

  const text = `Hello ${username || "User"},\n\nWelcome to InkaWebAI! Please verify your email to activate your account.\n\nVerification Token: ${token}\n\nOr click this link: ${verifyLink}\n\nIf you did not sign up, please ignore this message.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); text-align: center;">
          
          <!-- Logo/Header -->
          <div style="margin-bottom: 30px;">
            <h1 style="margin: 0; color: #667eea; font-size: 28px; font-weight: 700;">InkaWebAI</h1>
            <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">Email Verification</p>
          </div>

          <!-- Welcome Message -->
          <h2 style="margin: 30px 0 15px 0; color: #333; font-size: 22px; font-weight: 600;">Welcome, ${username || "User"}!</h2>
          <p style="margin: 0 0 30px 0; color: #666; font-size: 15px; line-height: 1.6;">
            Thanks for signing up with InkaWebAI. We're excited to have you on board!<br/>
            Please verify your email address to activate your account and get started.
          </p>

          <!-- Verification Token Card -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Your Verification Code</p>
            <div style="background: rgba(255,255,255,0.15); border: 2px dashed rgba(255,255,255,0.3); border-radius: 6px; padding: 15px; margin: 10px 0;">
              <code style="color: white; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">${token}</code>
            </div>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">Code expires in 24 hours</p>
          </div>

          <!-- CTA Button -->
          <div style="margin: 35px 0;">
            <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); cursor: pointer;">
              ✓ Verify Email Address
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #eee;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">Or paste this link in your browser:</p>
            <p style="margin: 0; word-break: break-all;">
              <a href="${verifyLink}" style="color: #667eea; text-decoration: none; font-size: 12px; font-family: 'Courier New', monospace;">
                ${verifyLink}
              </a>
            </p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #eee; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
              <strong>Didn't sign up?</strong> No worries! Just ignore this email.
            </p>
            <p style="margin: 0; color: #aaa; font-size: 11px;">
              © 2026 InkaWebAI. All rights reserved.
            </p>
          </div>
        </div>

        <!-- Security Notice -->
        <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.7); font-size: 12px;">
          <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

export default verificationEmail;
