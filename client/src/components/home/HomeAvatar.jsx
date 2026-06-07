const HomeAvatar = ({ image, name = "User", size = "md" }) => {
  const sizeClass =
    size === "xs"
      ? "h-7 w-7 text-[10px]"
      : size === "sm"
        ? "h-9 w-9 text-xs"
        : "h-11 w-11 text-sm";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#facc15] font-bold text-[#7c2d12]`}
    >
      {image ? (
        <img className="h-full w-full object-cover" src={image} alt={name} />
      ) : (
        initials
      )}
    </div>
  );
};

export default HomeAvatar;
