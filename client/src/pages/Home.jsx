import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserProfile } from '../store/slices/userSlice';
import TopAppBar from '../components/layout/TopAppBar';

const feedItems = [
  {
    id: 1,
    author: 'UTE Student Hub',
    meta: '12 min',
    text: 'Welcome back to ZaloUTE. Search classmates, open their profile, and send a friend request right from the top bar.',
  },
  {
    id: 2,
    author: 'Computer Science Club',
    meta: '1 hr',
    text: 'Frontend is ready for user search, profile preview, and friend request flow.',
  },
];

export default function Home() {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <TopAppBar profile={profile} />

      <main className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,680px)_280px] gap-5 px-4 py-5 max-w-[1280px] mx-auto">
        <aside className="hidden lg:block space-y-2 sticky top-20 self-start">
          <SidebarLink icon="person" label={profile?.fullName || 'Profile'} href="/user/profile" />
          <SidebarLink icon="group" label="Friends" href="/home" />
          <SidebarLink icon="history" label="Memories" href="/home" />
          <SidebarLink icon="bookmark" label="Saved" href="/home" />
          <SidebarLink icon="groups" label="Groups" href="/home" />
        </aside>

        <section className="space-y-4">
          <Composer profile={profile} />
          {feedItems.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </section>

        <aside className="hidden lg:block sticky top-20 self-start">
          <div className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#65676b]">Contacts</h2>
              <span className="material-symbols-outlined text-[#65676b] text-[20px]">search</span>
            </div>
            <Contact name="Nguyen Van A" />
            <Contact name="Tran Thi B" />
            <Contact name="Le Minh C" />
          </div>
        </aside>
      </main>
    </div>
  );
}

const SidebarLink = ({ icon, label, href }) => (
  <a href={href} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#e4e6eb] font-semibold">
    <span className="material-symbols-outlined text-[#1877f2]">{icon}</span>
    <span className="truncate">{label}</span>
  </a>
);

const Composer = ({ profile }) => (
  <div className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-4">
    <div className="flex items-center gap-3">
      <Avatar image={profile?.avatar} />
      <button className="flex-1 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-left px-4 text-[#65676b]">
        What's on your mind, {profile?.fullName?.split(' ')?.slice(-1)?.[0] || 'UTE'}?
      </button>
    </div>
    <div className="border-t border-[#dddfe2] mt-4 pt-2 grid grid-cols-3 gap-2">
      <ComposerAction icon="videocam" label="Live video" color="text-red-500" />
      <ComposerAction icon="photo_library" label="Photo/video" color="text-green-600" />
      <ComposerAction icon="mood" label="Feeling" color="text-yellow-500" />
    </div>
  </div>
);

const FeedCard = ({ item }) => (
  <article className="bg-white rounded-lg shadow-sm border border-[#dddfe2]">
    <div className="p-4">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <h3 className="font-semibold">{item.author}</h3>
          <p className="text-xs text-[#65676b]">{item.meta} · Public</p>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-6">{item.text}</p>
    </div>
    <div className="h-64 bg-gradient-to-br from-[#1877f2] via-[#42b72a] to-[#f7b928] flex items-center justify-center text-white text-4xl font-bold">
      ZaloUTE
    </div>
    <div className="p-3 border-t border-[#dddfe2] grid grid-cols-3 gap-1 text-[#65676b] font-semibold text-sm">
      <PostAction icon="thumb_up" label="Like" />
      <PostAction icon="chat_bubble" label="Comment" />
      <PostAction icon="share" label="Share" />
    </div>
  </article>
);

const Contact = ({ name }) => (
  <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#f0f2f5]">
    <Avatar />
    <span className="font-semibold text-sm">{name}</span>
  </div>
);

const Avatar = ({ image }) => (
  <div className="w-10 h-10 rounded-full bg-[#dbe7ff] overflow-hidden flex items-center justify-center text-[#1877f2] shrink-0">
    {image ? (
      <img src={image} alt="Profile" className="w-full h-full object-cover" />
    ) : (
      <span className="material-symbols-outlined">person</span>
    )}
  </div>
);

const ComposerAction = ({ icon, label, color }) => (
  <button className="h-10 rounded-lg hover:bg-[#f0f2f5] flex items-center justify-center gap-2 font-semibold text-sm text-[#65676b]">
    <span className={`material-symbols-outlined text-[22px] ${color}`}>{icon}</span>
    {label}
  </button>
);

const PostAction = ({ icon, label }) => (
  <button className="h-9 rounded-md hover:bg-[#f0f2f5] flex items-center justify-center gap-2">
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    {label}
  </button>
);
