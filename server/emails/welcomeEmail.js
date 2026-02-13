export function welcomeEmail({ username }) {
  const subject = "Welcome to InkaWebAI!";

  const text = `Hello ${username || "User"},\n\n` +
    "Thank you for verifying your email and joining InkaWebAI! We're excited to have you on board.\n\n" +
    "Feel free to explore the platform and let us know if you have any questions.\n\n" +
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
          </div>
          <h2 style="margin:30px 0 15px 0; color:#333; font-size:22px; font-weight:600;">Welcome, ${username || "User"}!</h2>
          <p style="margin:0 0 30px 0; color:#666; font-size:15px; line-height:1.6;">
            Thank you for verifying your email and becoming part of the InkaWebAI community.<br/>
            We're thrilled to have you here and look forward to helping you build amazing things with AI.
          </p>
          <p style="margin:0; color:#666; font-size:14px; line-height:1.6;">
            If you need any assistance, just reply to this email or reach out through our support channels.
          </p>
          <div style="margin-top:40px; padding-top:25px; border-top:1px solid #eee; text-align:center;">
            <p style="margin:0; color:#999; font-size:12px;">© 2026 InkaWebAI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

export default welcomeEmail;
