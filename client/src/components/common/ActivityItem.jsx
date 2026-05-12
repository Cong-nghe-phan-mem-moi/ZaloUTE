import React from 'react';

const ActivityItem = ({ activity }) => {
  const { description, highlight, time, isRecent } = activity;

  return (
    <div className="flex gap-4">
      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isRecent ? 'bg-primary' : 'bg-outline'}`}></div>
      <div className="space-y-1">
        <p className="text-on-surface font-body-md text-body-md">
          {description}
          {highlight && <span className="font-semibold"> {highlight}</span>}
        </p>
        <p className="text-on-surface-variant font-label-sm text-label-sm">{time}</p>
      </div>
    </div>
  );
};

export default ActivityItem;
