import React from 'react';

const TopAppBar = () => {
  return (
    <header className="sticky top-0 w-full z-50 bg-surface dark:bg-inverse-surface border-b border-outline-variant shadow-sm h-16 flex items-center justify-center">
      <div className="max-w-[1200px] w-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-bold text-primary">ZaloUTE</span>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink icon="home" label="Home" href="#" />
            <NavLink icon="group" label="Friends" href="#" />
            <NavLink icon="chat" label="Messages" href="#" />
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SearchBox />
          <IconButton icon="notifications" />
          <ProfileButton />
          <IconButton icon="more_vert" />
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ icon, label, href }) => (
  <a
    className="flex items-center gap-2 text-on-surface-variant hover:bg-surface-container-high rounded-full px-3 py-2 transition-colors"
    href={href}
  >
    <span className="material-symbols-outlined">{icon}</span>
    <span className="font-label-md text-label-md">{label}</span>
  </a>
);

const SearchBox = () => (
  <div className="relative flex items-center bg-secondary-container rounded-full px-4 py-2 w-64">
    <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
    <input
      className="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-full placeholder:text-on-surface-variant"
      placeholder="Search ZaloUTE..."
      type="text"
    />
  </div>
);

const IconButton = ({ icon }) => (
  <button className="hover:bg-surface-container-high rounded-full p-2 text-on-surface-variant transition-colors">
    <span className="material-symbols-outlined">{icon}</span>
  </button>
);

const ProfileButton = () => (
  <div className="bg-primary-container text-on-primary-container rounded-full px-4 py-1.5 flex items-center gap-2">
    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
      person
    </span>
    <span className="font-label-md text-label-md">Profile</span>
  </div>
);

export default TopAppBar;
