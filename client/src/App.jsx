import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { setCurrentPage } from "./store/slices/uiSlice";
import { clearError, clearMessage } from "./store/slices/postSlice";
import Toast from "./components/common/Toast";

import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import ProfilePage from "./pages/ProfilePage";
import PostTestPage from "./pages/PostTestPage";
import FriendRequests from "./pages/FriendRequests";
import Friends from "./pages/Friends";
import AdminDashboard from "./pages/AdminDashboard";
import ChatPage from "./pages/ChatPage";

function App() {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector(
    (state) => state.ui?.currentPage || "login",
  );
  const path = window.location.pathname;
  const token = localStorage.getItem("token");
  const otherProfileId = path.match(/^\/users\/profile\/([^/]+)$/)?.[1] || null;

  useEffect(() => {
    const otherProfileMatch = path.match(/^\/users\/profile\/([^/]+)$/);

    if (path === "/home") {
      window.history.replaceState(null, "", "/");
      dispatch(setCurrentPage(token ? "home" : "login"));
    } else if (path === "/") {
      dispatch(setCurrentPage(token ? "home" : "login"));
    } else if (path === "/login") {
      if (token) {
        window.history.replaceState(null, "", "/");
        dispatch(setCurrentPage("home"));
      } else {
        dispatch(setCurrentPage("login"));
      }
    } else if (path === "/register") {
      dispatch(setCurrentPage("register"));
    } else if (path === "/verify-otp") {
      dispatch(setCurrentPage("verify-otp"));
    } else if (path === "/forgot-password") {
      dispatch(setCurrentPage("forgot-password"));
    } else if (!token) {
      dispatch(setCurrentPage("login"));
    } else if (path === "/friends") {
      dispatch(setCurrentPage("friends"));
    } else if (path === "/friend-requests") {
      dispatch(setCurrentPage("friend-requests"));
    } else if (path === "/messages") {
      dispatch(setCurrentPage("messages"));
    } else if (path === "/admin/dashboard" || path === "/admin-dashboard") {
      dispatch(setCurrentPage("admin-dashboard"));
    } else if (
      path === "/profile" ||
      path === "/user/profile" ||
      path === "/admin/profile" ||
      path === "/edit-profile"
    ) {
      dispatch(setCurrentPage("profile"));
    } else if (otherProfileMatch) {
      dispatch(setCurrentPage("other-profile"));
    } else if (path === "/post-test") {
      dispatch(setCurrentPage("post-test"));
    }
  }, [dispatch, path, token]);

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
      case "friends":
        return <Friends />;
      case "friend-requests":
        return <FriendRequests />;
      case "messages":
        return <ChatPage />;
      case "admin-dashboard":
        return <AdminDashboard />;
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

  return (
    <div className="w-full">
      {renderPage()}
      <PostFeedbackToast />
    </div>
  );
}

const PostFeedbackToast = () => {
  const dispatch = useAppDispatch();
  const { error, message } = useAppSelector((state) => state.posts);

  if (error) {
    return (
      <Toast
        message={error}
        type="error"
        onClose={() => dispatch(clearError())}
      />
    );
  }

  if (message) {
    return (
      <Toast
        message={message}
        type="success"
        onClose={() => dispatch(clearMessage())}
      />
    );
  }

  return null;
};

export default App;
