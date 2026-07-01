const nodemailer = require("nodemailer");

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
  auth: {
    user:
      process.env.SMTP_USER || process.env.EMAIL_USER || "your-email@gmail.com",
    pass:
      process.env.SMTP_PASS ||
      process.env.EMAIL_PASSWORD ||
      "your-app-password",
  },
});

const useMockEmail =
  String(process.env.EMAIL_USE_MOCK || "")
    .trim()
    .toLowerCase() === "true";

const sendOTPEmail = async (email, otp) => {
  try {
    if (useMockEmail) {
      console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
      return { success: true };
    }

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER,
      to: email,
      subject: "ZaloUTE notification",
      html: `
        <h2>Notification</h2>
        <p>Please review this notification.</p>
        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>Please review this notification.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetOTP = async (email, otp) => {
  try {
    // if (process.env.NODE_ENV !== "production") {
    //   console.log(`[MOCK EMAIL] Password reset OTP for ${email}: ${otp}`);
    //   return { success: true };
    // }

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER,
      to: email,
      subject: "ZaloUTE notification",
      html: `
        <h2>Notification</h2>
        <p>Please review this notification.</p>
        <h1 style="color: #dc3545; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>Please review this notification.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Password reset email send error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetOTP,
  transporter,
};
