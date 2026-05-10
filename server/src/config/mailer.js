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

const sendOTPEmail = async (email, otp) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
      return { success: true };
    }

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER ||
        "your-email@gmail.com",
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
