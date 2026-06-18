const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
};

const IconButton = ({
  icon,
  label,
  onClick,
  disabled = false,
  badge = 0,
  size = "sm",
  className = "bg-[#f1f3f5] text-[#111827] hover:bg-[#e5e7eb]",
  iconClassName = "text-[20px]",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={`relative flex items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60 ${
      sizeClasses[size] || sizeClasses.sm
    } ${className}`}
  >
    <span className={`material-symbols-outlined ${iconClassName}`}>{icon}</span>
    {badge > 0 ? (
      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">
        {badge > 9 ? "9+" : badge}
      </span>
    ) : null}
  </button>
);

export default IconButton;

