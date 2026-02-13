export function forgotPasswordEmail({ username, resetLink }) {
  const subject = "Reset your InkaWebAI password";

  const text = `Hello ${username || "User"},\n\n` +
    "We received a request to reset your password. Click the link below to create a new password:\n\n" +
    `${resetLink}\n\n` +
    "This link expires in 1 hour.\n\n" +
    "If you didn't request a password reset, please ignore this email.\n\n" +
    "Best regards,\n" +
    "The InkaWebAI Team";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f4f4f4;">
      <div style="max-width: 600px; margin:0 auto; padding:40px 20px;">
        <div style="background: white; border-radius: 12px; padding:40px; box-shadow:0 10px 40px rgba(0,0,0,0.1); text-align:center;">
          <div style="margin-bottom:30px;">
            <h1 style="margin:0; color:#667eea; font-size:28px; font-weight:700;">InkaWebAI</h1>
            <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">Password Reset</p>
          </div>
          <h2 style="margin:30px 0 15px 0; color:#333; font-size:22px; font-weight:600;">Password Reset Request</h2>
          <p style="margin:0 0 30px 0; color:#666; font-size:15px; line-height:1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="margin: 35px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); cursor: pointer;">
              🔐 Reset Password
            </a>
          </div>
          <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #eee;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">Or paste this link in your browser:</p>
            <p style="margin: 0; word-break: break-all;">
              <a href="${resetLink}" style="color: #667eea; text-decoration: none; font-size: 12px; font-family: 'Courier New', monospace;">
                ${resetLink}
              </a>
            </p>
          </div>
          <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #eee; background: #fff9e6; border-radius: 6px; padding: 15px;">
            <p style="margin: 0; color: #c66; font-size: 12px; font-weight: 600;">⏰ Link Expires in 1 hour</p>
          </div>
          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #eee; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
              <strong>Didn't request this?</strong> You can ignore this email.
            </p>
            <p style="margin: 0; color: #aaa; font-size: 11px;">
              © 2026 InkaWebAI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

export default forgotPasswordEmail;
