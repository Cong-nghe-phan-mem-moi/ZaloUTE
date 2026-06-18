const AboutItem = ({ item }) => {
  const { icon, title, value } = item;

  return (
    <li className="flex items-start gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f2f3f5]">
        <span className="material-symbols-outlined text-[22px] leading-none text-[#1877f2]">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#111827]">{value}</p>
        <p className="text-xs text-[#6b7280]">{title}</p>
      </div>
    </li>
  );
};

export default AboutItem;
