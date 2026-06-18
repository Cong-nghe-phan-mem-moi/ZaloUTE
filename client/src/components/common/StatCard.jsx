const StatCard = ({ value, label, isHighlight = false }) => {
  return (
    <div className="text-center">
      <p
        className={`text-xl font-bold ${
          isHighlight ? "text-[#1877f2]" : "text-[#111827]"
        }`}
      >
        {value}
      </p>
      <p className="text-xs font-semibold text-[#6b7280]">{label}</p>
    </div>
  );
};

export default StatCard;
