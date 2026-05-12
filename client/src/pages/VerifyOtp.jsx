import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AuthCard from "../components/AuthCard";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { verifyRegisterOtp } from "../services/auth.service";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpRegex = /^\d{6}$/;

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otp: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    if (message.text) {
      setMessage({ type: "", text: "" });
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = formData.email.trim();
    const normalizedOtp = formData.otp.trim();

    if (!normalizedEmail) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setMessage({ type: "error", text: "Invalid email format" });
      return;
    }

    if (!normalizedOtp) {
      setMessage({ type: "error", text: "OTP is required" });
      return;
    }

    if (!otpRegex.test(normalizedOtp)) {
      setMessage({ type: "error", text: "OTP must be exactly 6 digits" });
      return;
    }

    try {
      const response = await verifyRegisterOtp({
        email: normalizedEmail,
        otp: normalizedOtp,
      });

      setMessage({
        type: "success",
        text: response.data?.message || "OTP verified successfully",
      });

      setTimeout(() => {
        navigate("/home");
      }, 900);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "OTP verification failed",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <AuthCard title="Verify OTP">
        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
          />

          <InputField
            label="OTP"
            type="text"
            name="otp"
            placeholder="Enter 6-digit OTP"
            value={formData.otp}
            onChange={handleChange}
          />

          <Button type="submit">Verify OTP</Button>

          {message.text ? (
            <p
              className={`mt-4 text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          ) : null}
        </form>
      </AuthCard>
    </div>
  );
}
