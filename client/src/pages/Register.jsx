import { useState } from "react";
import { useNavigate } from "react-router-dom";

import InputField from "../components/InputField";
import Button from "../components/Button";
import AuthCard from "../components/AuthCard";
import { registerUser } from "../services/auth.service";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedFullName = formData.fullName.trim();
    const normalizedEmail = formData.email.trim();

    if (!normalizedFullName) {
      alert("Full name is required");
      return;
    }

    if (normalizedFullName.length < 2 || normalizedFullName.length > 50) {
      alert("Full name must be between 2 and 50 characters");
      return;
    }

    if (!normalizedEmail) {
      alert("Email is required");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      alert("Invalid email format");
      return;
    }

    if (!formData.password) {
      alert("Password is required");
      return;
    }

    if (!strongPasswordRegex.test(formData.password)) {
      alert(
        "Password must be at least 8 chars and include uppercase, lowercase, number, and special character",
      );
      return;
    }

    if (!formData.confirmPassword) {
      alert("Confirm password is required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await registerUser({
        fullName: normalizedFullName,
        email: normalizedEmail,
        password: formData.password,
      });

      alert(response.data?.message || "Registration successful");
      navigate("/verify-otp", { state: { email: normalizedEmail } });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    }
  };

  return (
    <div
      className="
                min-h-screen
                flex
                items-center
                justify-center
                bg-gray-100
            "
    >
      <AuthCard title="Register">
        <form onSubmit={handleSubmit}>
          <InputField
            label="Full Name"
            type="text"
            name="fullName"
            placeholder="Enter full name"
            value={formData.fullName}
            onChange={handleChange}
          />

          <InputField
            label="Email"
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
          />

          <InputField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <Button type="submit">Register</Button>
        </form>
      </AuthCard>
    </div>
  );
}
