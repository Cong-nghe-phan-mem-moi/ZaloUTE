// Test file - chạy bằng: node test-auth.js

const testRegisterAndVerifyOTP = async () => {
  const testEmail = `test-${Date.now()}@example.com`;
  let otpCode = null;

  // ====== STEP 1: REGISTER ======
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║ STEP 1: REGISTER                          ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  const registerPayload = {
    fullName: "Võ An Thái",
    email: testEmail,
    password: "TestPass123!@",
  };

  console.log("POST http://localhost:5000/api/auth/register");
  console.log("Payload:", registerPayload);
  console.log("");

  try {
    const registerResponse = await fetch(
      "http://localhost:5000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerPayload),
      },
    );

    const registerData = await registerResponse.json();

    console.log(`Status: ${registerResponse.status}`);
    console.log("Response:", JSON.stringify(registerData, null, 2));
    console.log("");

    if (!registerData.success) {
      console.error("Register failed!");
      return;
    }

    // ====== STEP 2: VERIFY OTP ======
    console.log("╔═══════════════════════════════════════════╗");
    console.log("║ STEP 2: VERIFY OTP                        ║");
    console.log("╚═══════════════════════════════════════════╝\n");

    // Prompt user for OTP (Check server console or email)
    console.log("OTP được gửi tới email:", testEmail);
    console.log("Kiểm tra MongoDB hoặc console server để lấy OTP\n");

    // Simulate: In thực tế, bạn sẽ lấy OTP từ email hoặc server log
    // Ở đây ta dùng OTP mặc định để test (bạn cần thay đổi)
    otpCode = "123456"; // Thay bằng OTP thực tế từ database

    const verifyPayload = {
      email: testEmail,
      otp: otpCode,
    };

    console.log("POST http://localhost:5000/api/auth/verify-otp");
    console.log("Payload:", verifyPayload);
    console.log("");

    const verifyResponse = await fetch(
      "http://localhost:5000/api/auth/verify-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyPayload),
      },
    );

    const verifyData = await verifyResponse.json();

    console.log(`Status: ${verifyResponse.status}`);
    console.log("Response:", JSON.stringify(verifyData, null, 2));
    console.log("");

    if (verifyData.success) {
      console.log("XÁC THỰC THÀNH CÔNG!");
    } else {
      console.log("XÁC THỰC THẤT BẠI!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testRegisterAndVerifyOTP();
