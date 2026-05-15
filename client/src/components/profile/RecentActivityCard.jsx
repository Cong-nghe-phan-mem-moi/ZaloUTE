import React from 'react';
import ActivityItem from '../common/ActivityItem';

const RecentActivityCard = ({ activities }) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-premium p-8 border border-outline-variant/30">

      <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Recent Activity</h2>
      <div className="space-y-6">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};

export default RecentActivityCard;
