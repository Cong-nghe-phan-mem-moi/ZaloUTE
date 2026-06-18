import { Link } from "react-router-dom";

const sizeClasses = {
  sm: "h-10 w-10 text-xl",
  md: "h-12 w-12 text-2xl",
  lg: "h-36 w-36 text-7xl",
};

const AppLogo = ({ to = "/", size = "sm", className = "" }) => (
  <Link
    to={to}
    className={`flex items-center justify-center rounded-full bg-[#1877f2] font-bold text-white ${
      sizeClasses[size] || sizeClasses.sm
    } ${className}`}
    aria-label="ZaloUTE home"
  >
    z
  </Link>
);

export default AppLogo;

