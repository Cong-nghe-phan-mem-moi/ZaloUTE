import ActivityItem from '../common/ActivityItem';

const RecentActivityCard = ({ activities }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#dddfe2]">

      <h2 className="font-headline-md text-headline-md text-[#050505] mb-6">Recent Activity</h2>
      <div className="space-y-6">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <p className="text-sm text-[#65676b]">No recent public activity.</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivityCard;
