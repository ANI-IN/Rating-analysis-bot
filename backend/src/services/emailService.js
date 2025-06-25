//backend/src/services/emailService.js
const transporter = require('../config/email');

// Send verification email
exports.sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Interview Kickstart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Email Verification</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Interview Kickstart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset</h1>
      <p>Your password reset code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};