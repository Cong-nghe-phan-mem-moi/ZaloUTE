import HomeAvatar from "./HomeAvatar";
import { newsItems } from "./homeData";

const RightSidebar = ({ contacts, profile }) => (
  <aside className="hidden bg-white px-6 py-6 lg:block">
    <PanelTitle title="News Update" action="See All" />
    <div className="space-y-4">
      {newsItems.map((item) => (
        <div key={item.title} className="flex gap-3">
          <div
            className={`h-14 w-16 rounded bg-gradient-to-br ${item.color}`}
          />
          <div>
            <h3 className="text-sm font-bold">{item.title}</h3>
            <p className="text-xs leading-4 text-[#6b7280]">See more</p>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-8">
      <PanelTitle
        title="Friend Requests"
        action="See All"
        href="/friend-requests"
      />
      <div className="rounded bg-[#f2f3f5] p-4">
        <div className="mb-3 flex items-center gap-3">
          <HomeAvatar name="Hexa Pentania" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {profile?.fullName || "Hexa Pentania"}
            </p>
            <p className="text-xs text-[#6b7280]">1 mutual friend</p>
          </div>
          <span className="ml-auto text-xs text-[#6b7280]">2 week</span>
        </div>
        <div className="flex gap-3 pl-12">
          <button className="rounded bg-[#1877f2] px-5 py-2 text-xs font-semibold text-white">
            Confirm
          </button>
          <button className="rounded bg-[#e5e7eb] px-5 py-2 text-xs font-semibold">
            Delete
          </button>
        </div>
      </div>
    </div>

    <div className="mt-8">
      <PanelTitle title="Contacts" />
      <div className="space-y-4">
        {contacts.map((contact) => (
          <Contact key={contact.name} contact={contact} />
        ))}
      </div>
    </div>
  </aside>
);

const PanelTitle = ({ title, action, href = "/home" }) => (
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-base font-bold">{title}</h2>
    {action ? (
      <a className="text-xs font-semibold text-[#1877f2]" href={href}>
        {action}
      </a>
    ) : null}
  </div>
);

const Contact = ({ contact }) => (
  <div className="flex items-center gap-3">
    <HomeAvatar image={contact.avatar} name={contact.name} />
    <div>
      <p className="text-sm font-bold">{contact.name}</p>
      <p className="flex items-center gap-2 text-xs text-[#6b7280]">
        <span
          className={`h-2 w-2 rounded-full ${
            contact.online ? "bg-emerald-500" : "bg-[#9ca3af]"
          }`}
        />
        {contact.status}
      </p>
    </div>
  </div>
);

export default RightSidebar;
