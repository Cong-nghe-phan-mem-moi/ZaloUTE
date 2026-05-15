import { Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;
