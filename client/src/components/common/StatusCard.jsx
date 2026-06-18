const toneClasses = {
  error: "text-red-600",
  neutral: "text-[#6b7280]",
  default: "text-[#111827]",
};

const StatusCard = ({
  icon,
  message,
  detail,
  tone = "neutral",
  loading = false,
  layout = "center",
}) => {
  if (layout === "inline") {
    return (
      <section
        className={`flex items-center gap-3 rounded bg-white p-4 text-sm font-semibold shadow-sm ${
          tone === "error" ? toneClasses.error : toneClasses.default
        }`}
      >
        <span
          className={`material-symbols-outlined text-[20px] ${
            tone === "error" ? "" : "text-[#1877f2]"
          } ${loading ? "animate-spin" : ""}`}
        >
          {icon}
        </span>
        <span>{message}</span>
      </section>
    );
  }

  return (
    <section
      className={`rounded bg-white p-7 text-center shadow-sm ${
        tone === "error" ? toneClasses.error : toneClasses.neutral
      }`}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f3f5]">
        <span
          className={`material-symbols-outlined text-[24px] ${
            loading ? "animate-spin" : ""
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="text-sm font-semibold">{message}</p>
      {detail ? <p className="mt-1 text-xs text-[#9ca3af]">{detail}</p> : null}
    </section>
  );
};

export default StatusCard;

