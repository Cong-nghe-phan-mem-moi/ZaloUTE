import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "./redux/hooks";
import { setCurrentPage } from "./redux/slices/uiSlice";
import { clearError, clearMessage } from "./redux/slices/postSlice";
import Toast from "./components/common/Toast";

import {
  AdminDashboard,
  ChatPage,
  ForgotPassword,
  FriendRequests,
  Friends,
  Home,
  LoginPage,
  ProfilePage,
  Register,
  VerifyOtp,
} from "./pages";

const ProtectedPage = ({ token, children }) => {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const OtherProfilePage = () => {
  const { userId } = useParams();
  return <ProfilePage userId={userId} />;
};

function App() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const path = location.pathname;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (path === "/" || path === "/home") {
      dispatch(setCurrentPage(token ? "home" : "login"));
    } else if (path === "/login") {
      dispatch(setCurrentPage(token ? "home" : "login"));
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
    } else if (path.startsWith("/users/profile/")) {
      dispatch(setCurrentPage("other-profile"));
    } else if (path === "/post-test") {
      dispatch(setCurrentPage("post-test"));
    }
  }, [dispatch, path, token]);

  return (
    <div className="w-full">
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<ProtectedPage token={token}><Home /></ProtectedPage>} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/friends" element={<ProtectedPage token={token}><Friends /></ProtectedPage>} />
        <Route path="/friend-requests" element={<ProtectedPage token={token}><FriendRequests /></ProtectedPage>} />
        <Route path="/messages" element={<ProtectedPage token={token}><ChatPage /></ProtectedPage>} />
        <Route path="/admin/dashboard" element={<ProtectedPage token={token}><AdminDashboard /></ProtectedPage>} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/profile" element={<ProtectedPage token={token}><ProfilePage /></ProtectedPage>} />
        <Route path="/user/profile" element={<ProtectedPage token={token}><ProfilePage /></ProtectedPage>} />
        <Route path="/admin/profile" element={<ProtectedPage token={token}><ProfilePage /></ProtectedPage>} />
        <Route path="/edit-profile" element={<ProtectedPage token={token}><ProfilePage /></ProtectedPage>} />
        <Route path="/users/profile/:userId" element={<ProtectedPage token={token}><OtherProfilePage /></ProtectedPage>} />
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
      </Routes>
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
