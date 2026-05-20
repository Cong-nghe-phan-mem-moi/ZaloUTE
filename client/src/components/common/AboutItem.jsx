const AboutItem = ({ item }) => {
  const { icon, title, value } = item;

  return (
    <li className="flex items-start gap-4">
      <div className="bg-[#f0f2f5] rounded-full p-2.5 flex-shrink-0">
        <span className="material-symbols-outlined text-[#1877f2] text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-[#050505] font-body-md text-body-md">{value}</p>
        <p className="text-[#65676b] font-label-sm text-label-sm">{title}</p>
      </div>
    </li>
  );
};

export default AboutItem;
