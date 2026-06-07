import HomeAvatar from "./HomeAvatar";
import { stories } from "./homeData";

const Stories = () => (
  <section className="rounded bg-white p-5 shadow-sm">
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stories.map((story) => (
        <div
          key={story.name}
          className="rounded-md bg-white p-3 shadow-sm ring-1 ring-[#eef0f2]"
        >
          <div
            className={`flex h-32 items-center justify-center rounded-md ${
              story.muted ? "bg-[#f0f2f5]" : `bg-gradient-to-br ${story.image}`
            }`}
          >
            {story.muted ? (
              <div className="text-center text-[#6b7280]">
                <span className="material-symbols-outlined text-4xl">
                  {story.icon}
                </span>
                <p className="mt-2 text-xs font-medium">Create a Story</p>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <HomeAvatar name={story.name} size="xs" />
            <p className="truncate text-xs font-semibold">{story.name}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Stories;
