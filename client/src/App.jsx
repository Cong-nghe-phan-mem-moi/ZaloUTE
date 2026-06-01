import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { setCurrentPage } from "./store/slices/uiSlice";

import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import ProfilePage from "./pages/ProfilePage";
import PostTestPage from "./pages/PostTestPage";
import FriendRequests from "./pages/FriendRequests";

function App() {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector(
    (state) => state.ui?.currentPage || "login",
  );
  const path = window.location.pathname;
  const otherProfileId = path.match(/^\/users\/profile\/([^/]+)$/)?.[1] || null;

  useEffect(() => {
    const otherProfileMatch = path.match(/^\/users\/profile\/([^/]+)$/);

    if (path === "/" || path === "/login") {
      dispatch(setCurrentPage("login"));
    } else if (path === "/register") {
      dispatch(setCurrentPage("register"));
    } else if (path === "/verify-otp") {
      dispatch(setCurrentPage("verify-otp"));
    } else if (path === "/forgot-password") {
      dispatch(setCurrentPage("forgot-password"));
    } else if (path === "/home") {
      dispatch(setCurrentPage("home"));
    } else if (path === "/friend-requests") {
      dispatch(setCurrentPage("friend-requests"));
    } else if (
      path === "/profile" ||
      path === "/user/profile" ||
      path === "/admin/profile" ||
      path === "/edit-profile"
    ) {
      dispatch(setCurrentPage("profile"));
    } else if (otherProfileMatch) {
      dispatch(setCurrentPage("other-profile"));
    } else if (path === "/edit-profile") {
      dispatch(setCurrentPage("edit-profile"));
    } else if (path === "/post-test") {
      dispatch(setCurrentPage("post-test"));
    }
  }, [dispatch, path]);

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
      case "friend-requests":
        return <FriendRequests />;
      case "profile":
        return <ProfilePage />;
      case "other-profile":
        return <ProfilePage userId={otherProfileId} />;
      case "post-test":
        return <PostTestPage />;
      case "register":
        return <Register />;
      default:
        return <LoginPage />;
    }
  };

  return <div className="w-full">{renderPage()}</div>;
}

export default App;
