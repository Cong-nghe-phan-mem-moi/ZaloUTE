import UserAvatar from "../common/UserAvatar";

const PostCard = () => (
  <article className="rounded bg-white p-7 shadow-sm">
    <div className="flex items-center gap-3">
      <UserAvatar name="Pentania Gloria" />
      <div>
        <h3 className="text-sm font-bold">Pentania Gloria</h3>
        <p className="text-xs text-[#6b7280]">5 minutes ago</p>
      </div>
    </div>

    <p className="mt-5 text-sm leading-6">
      Quickly design UI element under 15 mins in. Design tutorial for beginners.
    </p>

    <div className="mt-5 grid grid-cols-3 gap-4">
      <PostPreview color="from-indigo-200 to-blue-500" />
      <PostPreview color="from-lime-100 to-emerald-400" />
      <PostPreview color="from-slate-200 to-slate-500" />
    </div>

    <div className="mt-5 grid grid-cols-3 text-sm font-semibold text-[#334155]">
      <PostAction icon="thumb_up" label="450" />
      <PostAction icon="chat_bubble" label="500" />
      <PostAction icon="share" label="100 K" />
    </div>
  </article>
);

const PostPreview = ({ color }) => (
  <div className={`h-28 rounded bg-gradient-to-br ${color}`} />
);

const PostAction = ({ icon, label }) => (
  <button className="flex items-center gap-2 hover:text-[#1877f2]">
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    {label}
  </button>
);

export default PostCard;
