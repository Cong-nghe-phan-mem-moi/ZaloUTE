const sizeClasses = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-32 w-32 text-4xl",
};

const variantClasses = {
  warm: "bg-[#facc15] text-[#7c2d12]",
  blue: "bg-[#dbe7ff] text-[#1877f2]",
  neutral: "bg-[#f2f3f5] text-[#6b7280]",
};

const DEFAULT_AVATAR = "/default-avatar.svg";

const UserAvatar = ({
  image,
  name = "User",
  size = "md",
  variant = "warm",
  className = "",
}) => (
  <div
    className={`${sizeClasses[size] || sizeClasses.md} ${
      variantClasses[variant] || variantClasses.warm
    } flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${className}`}
  >
    <img
      className="h-full w-full object-cover"
      src={image || DEFAULT_AVATAR}
      alt={name}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = DEFAULT_AVATAR;
      }}
    />
  </div>
);

export default UserAvatar;
