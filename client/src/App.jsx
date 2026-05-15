import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { setCurrentPage } from './store/slices/uiSlice'

import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const dispatch = useAppDispatch()
  const currentPage = useAppSelector((state) => state.ui?.currentPage || "register");

  useEffect(() => {
    const path = window.location.pathname
    
    if (path === '/' || path === '/register') {
      dispatch(setCurrentPage('register'))
    } else if (path === '/login') {
      dispatch(setCurrentPage('login'))
    } else if (path === '/verify-otp') {
      dispatch(setCurrentPage('verify-otp'))
    } else if (path === '/forgot-password') {
      dispatch(setCurrentPage('forgot-password'))
    } else if (path === '/home') {
      dispatch(setCurrentPage('home'))
    } else if (path === '/edit-profile') {
      dispatch(setCurrentPage('edit-profile'))
    }
  }, [dispatch])

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage />;
      case "verify-otp":
        return <VerifyOtp />;
      case "forgot-password":
        return <ForgotPassword />;
      case "home":
        return <Home />;
      case "edit-profile":
        return <ProfilePage />;
      case "register":
      default:
        return <Register />;
    }
  };

  return <div className="w-full">{renderPage()}</div>;
}

export default App;
