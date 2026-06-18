import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../redux/hooks";
import { clearProfile } from "../redux/slices/userSlice";
import { userAPI } from "../services/user.service";

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await userAPI.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      dispatch(clearProfile());
      navigate("/login", { replace: true });
    }
  }, [dispatch, isLoggingOut, navigate]);

  return { isLoggingOut, logout };
};

