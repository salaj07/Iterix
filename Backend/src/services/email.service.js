const nodemailer = require("nodemailer");

// Create transporter with connection pooling for faster email delivery
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT, 10) || 465,
  secure: process.env.EMAIL_SECURE !== "false", // defaults to true (SSL) for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true, // Use connection pool
  maxConnections: 5,
  maxMessages: 100,
});

/**
 * Send OTP Email
 * @param {string} email
 * @param {string} otp
 */
const sendOTPEmail = async (email, otp) => {
  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mailOptions = {
    from: `"Iterix" <${senderEmail}>`,
    to: email,

    subject: "Your Iterix Login OTP",

    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px;">
        
        <h2 style="color:#FF6044;">
          Iterix Authentication
        </h2>

        <p>Your One-Time Password (OTP) is:</p>

        <div
          style="
            font-size:32px;
            font-weight:bold;
            letter-spacing:6px;
            background:#FFF2E1;
            padding:16px;
            text-align:center;
            border-radius:8px;
          "
        >
          ${otp}
        </div>

        <p style="margin-top:20px;">
          This OTP will expire in <strong>5 minutes</strong>.
        </p>

        <p>
          If you didn't request this code, you can safely ignore this email.
        </p>

        <hr />

        <small>
          © Iterix
        </small>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendInvitationEmail = async (email, workspaceName) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mailOptions = {
    from: `"Iterix" <${senderEmail}>`,
    to: email,
    subject: `Invitation to join ${workspaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Workspace Invitation</h2>
        <p>You have been invited to join the workspace <strong>${workspaceName}</strong> on Iterix.</p>
        <p style="margin-bottom: 24px;">Please click the button below to log in and accept your invitation from the dashboard:</p>
        <a href="${clientUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Workspace</a>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
        <small style="color: #666;">If the button above does not work, copy and paste this URL into your browser: <br/>${clientUrl}</small>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


module.exports = {
  sendOTPEmail,
  sendInvitationEmail,
};