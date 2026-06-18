import ActivityItem from '../common/ActivityItem';

const RecentActivityCard = ({ activities }) => {
  return (
    <div className="rounded bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-base font-bold text-[#111827]">
        Recent Activity
      </h2>
      <div className="space-y-6">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <p className="text-sm text-[#6b7280]">No recent public activity.</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivityCard;
