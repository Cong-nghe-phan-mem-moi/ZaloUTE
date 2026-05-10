const nodemailer = require("nodemailer");

// Cấu hình email service (Gmail, SendGrid, v.v.)
// Thay thế bằng thông tin email của bạn
const transporter = nodemailer.createTransport({
  service: "gmail", // hoặc service khác
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password", // App Password cho Gmail
  },
});

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
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

module.exports = {
  sendOTPEmail,
  transporter,
};
