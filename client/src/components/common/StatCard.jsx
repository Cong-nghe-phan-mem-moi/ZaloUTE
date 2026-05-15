import React from 'react';

const StatCard = ({ value, label, isHighlight = false }) => {
  return (
    <div className="text-center">
      <p className={`font-headline-md text-headline-md ${isHighlight ? 'text-primary' : 'text-on-surface'}`}>
        {value}
      </p>
      <p className="text-on-surface-variant font-label-sm text-label-sm">{label}</p>
    </div>
  );
};

export default StatCard;
