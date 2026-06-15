const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP Email
 * @param {string} email
 * @param {string} otp
 */
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"SprintOS" <${process.env.EMAIL_USER}>`,
    to: email,

    subject: "Your SprintOS Login OTP",

    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px;">
        
        <h2 style="color:#FF6044;">
          SprintOS Authentication
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
          © SprintOS
        </small>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendInvitationEmail = async (email, workspaceName) => {
  const mailOptions = {
    from: `"SprintOS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Invitation to join ${workspaceName}`,
    html: `
      <h2>Workspace Invitation</h2>
      <p>You have been invited to join <b>${workspaceName}</b>.</p>
      <p>Log in to SprintOS and accept the invitation from your dashboard.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};


module.exports = {
  sendOTPEmail,
  sendInvitationEmail,
};