import React from 'react';

const AboutItem = ({ item }) => {
  const { icon, title, value } = item;

  return (
    <li className="flex items-start gap-4">
      <div className="bg-surface-container rounded-full p-2.5 flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-on-surface font-body-md text-body-md">{value}</p>
        <p className="text-on-surface-variant font-label-sm text-label-sm">{title}</p>
      </div>
    </li>
  );
};

export default AboutItem;
