const ActivityItem = ({ activity }) => {
  const { description, highlight, time, isRecent } = activity;

  return (
    <div className="flex gap-4">
      <div
        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
          isRecent ? "bg-[#1877f2]" : "bg-[#d1d5db]"
        }`}
      />
      <div className="space-y-1">
        <p className="text-sm text-[#111827]">
          {description}
          {highlight && <span className="font-semibold"> {highlight}</span>}
        </p>
        <p className="text-xs text-[#6b7280]">{time}</p>
      </div>
    </div>
  );
};

export default ActivityItem;
