// Test file - chạy bằng: node test-register.js

const testRegister = async () => {
  const payload = {
    fullName: "Võ An Thái",
    email: `test-${Date.now()}@example.com`, // Email unique mỗi lần test
    password: "TestPass123!@",
  };

  console.log("📤 Gửi request đến: http://localhost:5000/api/auth/register");
  console.log("Payload:", payload);
  console.log("");

  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log(`✅ Status: ${response.status}`);
    console.log("📥 Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

testRegister();
