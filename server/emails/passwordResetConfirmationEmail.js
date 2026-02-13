export function passwordResetConfirmationEmail({ username }) {
  const subject = "Your password has been reset — InkaWebAI";

  const text = `Hello ${username || "User"},\n\n` +
    "Your password has been successfully reset.\n\n" +
    "If you did not perform this action, please contact our support team immediately at support@inkawebai.com\n\n" +
    "For security purposes, you may want to:\n" +
    "- Review your account activity\n" +
    "- Update your security settings\n" +
    "- Enable two-factor authentication\n\n" +
    "Best regards,\n" +
    "The InkaWebAI Security Team";

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
            <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">Security Alert</p>
          </div>
          <h2 style="margin:30px 0 15px 0; color:#333; font-size:22px; font-weight:600;">Password Reset Confirmation</h2>
          <p style="margin:0 0 30px 0; color:#666; font-size:15px; line-height:1.6;">
            Your password has been successfully reset. If you did not perform this action, please <strong>contact our support team immediately</strong>.
          </p>
          
          <!-- Warning Box -->
          <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; text-align: left;">
            <p style="margin: 0; color: #856404; font-weight: 600;">⚠️ Suspicious Activity?</p>
            <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
              If you didn't reset your password, please contact support immediately. Your account security is our priority.
            </p>
          </div>

          <!-- Security Tips -->
          <div style="margin: 30px 0; padding: 20px; background: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px; text-align: left;">
            <p style="margin: 0; color: #0c5aa0; font-weight: 600;">🔐 Security Recommendations</p>
            <ul style="margin: 10px 0 0 0; color: #0c5aa0; font-size: 14px; padding-left: 20px;">
              <li>Review your recent account activity</li>
              <li>Check your connected devices and sessions</li>
              <li>Consider enabling two-factor authentication</li>
            </ul>
          </div>

          <!-- Support Info -->
          <div style="margin-top: 40px; padding: 25px; background: #f5f5f5; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Need Help?</strong><br/>
              Contact our support team: <a href="mailto:support@inkawebai.com" style="color: #667eea; text-decoration: none;">support@inkawebai.com</a>
            </p>
          </div>

          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #eee; text-align: center;">
            <p style="margin: 0; color: #999; font-size: 12px;">
              © 2026 InkaWebAI. All rights reserved.
            </p>
            <p style="margin: 5px 0 0 0; color: #aaa; font-size: 11px;">
              This is an automated security notification. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

export default passwordResetConfirmationEmail;
