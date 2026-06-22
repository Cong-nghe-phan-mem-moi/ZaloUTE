import { useEffect } from "react";

const toastStyles = {
  success: {
    bg: "bg-green-500",
    icon: "check_circle",
  },
  error: {
    bg: "bg-red-500",
    icon: "error",
  },
  info: {
    bg: "bg-blue-500",
    icon: "info",
  },
};

const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  useEffect(() => {
    if (!message) return undefined;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const style = toastStyles[type] || toastStyles.info;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-lg ${style.bg} px-4 py-3 text-white shadow-lg animate-fade-in-up`}
    >
      <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;
