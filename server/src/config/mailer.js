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
      subject: "Xác thực OTP đăng ký tài khoản",
      html: `
        <h2>Xác thực OTP</h2>
        <p>Mã OTP của bạn là:</p>
        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>Mã OTP này sẽ hết hạn trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua.</p>
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
    if (process.env.NODE_ENV !== "production") {
      console.log(`[MOCK EMAIL] Password reset OTP for ${email}: ${otp}`);
      return { success: true };
    }

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER,
      to: email,
      subject: "OTP đặt lại mật khẩu",
      html: `
        <h2>Đặt lại mật khẩu</h2>
        <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
        <h1 style="color: #dc3545; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>Mã OTP này sẽ hết hạn trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
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
