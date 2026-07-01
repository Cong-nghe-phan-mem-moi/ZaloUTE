import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import StatusCard from "../../components/common/StatusCard";
import Toast from "../../components/common/Toast";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { clearProfile, fetchUserProfile } from "../../redux/slices/userSlice";
import { userAPI } from "../../services/user.service";

const sections = [
  { id: "security", icon: "lock", label: "Security" },
  { id: "contact", icon: "alternate_email", label: "Contact" },
  { id: "blocked", icon: "block", label: "Blocked users" },
  { id: "notifications", icon: "notifications", label: "Notifications" },
  { id: "sessions", icon: "devices", label: "Sessions" },
  { id: "privacy", icon: "shield", label: "Privacy" },
  { id: "danger", icon: "person_off", label: "Deactivate" },
];

const emptySettings = {
  contact: { email: "", phone: "" },
  notificationSettings: {
    posts: true,
    comments: true,
    friendRequests: true,
    messages: true,
    email: true,
  },
  privacySettings: {
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowFriendRequests: true,
    allowMessagesFrom: "friends",
    searchableByEmail: true,
    searchableByPhone: true,
  },
  sessions: [],
};

const getMessage = (response, fallback) =>
  response?.data?.message && response.data.message !== "Operation failed"
    ? response.data.message
    : fallback;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message && error.response.data.message !== "Operation failed"
    ? error.response.data.message
    : fallback;

export default function AccountSettings() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const [activeSection, setActiveSection] = useState("security");
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [contactForm, setContactForm] = useState({
    email: "",
    phone: "",
    currentPassword: "",
  });
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([]);

  const loadSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await userAPI.getAccountSettings();
      const data = response.data?.data || emptySettings;
      setSettings({ ...emptySettings, ...data });
      setBlockedUsers(profile?.blockedUsers || []);
      setContactForm({
        email: data.contact?.email || "",
        phone: data.contact?.phone || "",
        currentPassword: "",
      });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load account settings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchUserProfile());

    const timer = window.setTimeout(() => {
      loadSettings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dispatch]);

  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        const response = await userAPI.getBlockedUsers();
        setBlockedUsers(response.data?.data || []);
      } catch {
        setBlockedUsers([]);
      }
    };

    loadBlockedUsers();
  }, []);

  const activeSessions = useMemo(
    () => settings.sessions.filter((session) => !session.revokedAt),
    [settings.sessions],
  );

  const runAction = async (key, action, successMessage) => {
    setSaving(key);
    setNotice("");
    setError("");

    try {
      const response = await action();
      if (response?.data?.data) {
        setSettings({ ...emptySettings, ...response.data.data });
      }
      setNotice(getMessage(response, successMessage));
      return response;
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save settings."));
      return null;
    } finally {
      setSaving("");
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    const response = await runAction(
      "password",
      () =>
        userAPI.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      "Password changed successfully.",
    );

    if (response) {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  const handleUpdateContact = async (event) => {
    event.preventDefault();
    const emailChanged = contactForm.email !== settings.contact.email;

    if (emailChanged && !contactForm.currentPassword) {
      setError("Current password is required to change email.");
      return;
    }

    const response = await runAction(
      "contact",
      () => userAPI.updateContactInfo(contactForm),
      "Contact information updated successfully.",
    );

    if (response) {
      dispatch(fetchUserProfile());
      setContactForm((current) => ({ ...current, currentPassword: "" }));
    }
  };

  const updateNotifications = (key, value) => {
    const nextSettings = {
      ...settings.notificationSettings,
      [key]: value,
    };

    setSettings((current) => ({
      ...current,
      notificationSettings: nextSettings,
    }));

    runAction(
      `notification-${key}`,
      () => userAPI.updateNotificationSettings(nextSettings),
      "Notification settings updated.",
    );
  };

  const updatePrivacy = (key, value) => {
    const nextSettings = {
      ...settings.privacySettings,
      [key]: value,
    };

    setSettings((current) => ({
      ...current,
      privacySettings: nextSettings,
    }));

    runAction(
      `privacy-${key}`,
      () => userAPI.updatePrivacySettings(nextSettings),
      "Privacy settings updated.",
    );
  };

  const handleRevokeSession = (sessionId) => {
    runAction(
      `session-${sessionId}`,
      () => userAPI.revokeSession(sessionId),
      "Session revoked.",
    );
  };

  const handleRevokeOtherSessions = () => {
    runAction(
      "sessions",
      () => userAPI.revokeOtherSessions(),
      "Other sessions revoked.",
    );
  };

  const handleDeactivate = async (event) => {
    event.preventDefault();
    const confirmed = window.confirm(
      "Deactivate this account? You will be logged out immediately.",
    );

    if (!confirmed) return;

    const response = await runAction(
      "deactivate",
      () => userAPI.deactivateAccount({ currentPassword: deactivatePassword }),
      "Account deactivated.",
    );

    if (response) {
      localStorage.removeItem("token");
      dispatch(clearProfile());
      navigate("/login", { replace: true });
    }
  };

  const handleUnblockUser = async (userId) => {
    const response = await runAction(
      `unblock-${userId}`,
      () => userAPI.unblockUser(userId),
      "User unblocked successfully.",
    );

    if (response) {
      const blockedResponse = await userAPI.getBlockedUsers();
      setBlockedUsers(blockedResponse.data?.data || []);
      dispatch(fetchUserProfile());
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
        <HomeHeader profile={profile} activePage={null} />

      <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 justify-center bg-[#f2f3f5] lg:grid-cols-[240px_minmax(0,960px)] xl:grid-cols-[260px_minmax(0,1040px)] 2xl:grid-cols-[280px_minmax(0,1120px)]">
        <LeftSidebar profile={profile} />

        <section className="min-w-0 px-3 py-3 sm:px-4 sm:py-5 lg:px-5">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-lg border border-[#dddfe2] bg-white p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${
                    activeSection === section.id
                      ? "bg-[#e7f3ff] text-[#1877f2]"
                      : "text-[#050505] hover:bg-[#f2f3f5]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px]">
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              ))}
            </aside>

            <div className="space-y-4">
              {error ? <StatusCard icon="error" tone="error" message={error} layout="inline" /> : null}

              <div className="rounded-lg border border-[#dddfe2] bg-white p-5">
                {loading ? (
                  <div className="flex min-h-72 items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1877f2] border-t-transparent" />
                  </div>
                ) : (
                  <>
                {activeSection === "security" ? (
                  <SettingsPanel title="Change password" icon="lock_reset">
                    <form className="grid gap-4" onSubmit={handleChangePassword}>
                      <PasswordField
                        label="Current password"
                        value={passwordForm.currentPassword}
                        onChange={(value) =>
                          setPasswordForm((current) => ({ ...current, currentPassword: value }))
                        }
                      />
                      <PasswordField
                        label="New password"
                        value={passwordForm.newPassword}
                        onChange={(value) =>
                          setPasswordForm((current) => ({ ...current, newPassword: value }))
                        }
                      />
                      <PasswordField
                        label="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={(value) =>
                          setPasswordForm((current) => ({ ...current, confirmPassword: value }))
                        }
                      />
                      <PrimaryButton loading={saving === "password"}>Save password</PrimaryButton>
                    </form>
                  </SettingsPanel>
                ) : null}

                {activeSection === "contact" ? (
                  <SettingsPanel title="Email and phone" icon="contact_mail">
                    <form className="grid gap-4" onSubmit={handleUpdateContact}>
                      <TextField
                        label="Email"
                        type="email"
                        value={contactForm.email}
                        onChange={(value) =>
                          setContactForm((current) => ({ ...current, email: value }))
                        }
                      />
                      <TextField
                        label="Phone number"
                        value={contactForm.phone}
                        onChange={(value) =>
                          setContactForm((current) => ({ ...current, phone: value }))
                        }
                      />
                      <PasswordField
                        label="Current password for email changes"
                        value={contactForm.currentPassword}
                        onChange={(value) =>
                          setContactForm((current) => ({ ...current, currentPassword: value }))
                        }
                      />
                      <PrimaryButton loading={saving === "contact"}>Save contact</PrimaryButton>
                    </form>
                  </SettingsPanel>
                ) : null}

                {activeSection === "blocked" ? (
                  <SettingsPanel title="Blocked users" icon="block">
                    <div className="space-y-3">
                      {blockedUsers.length === 0 ? (
                        <p className="text-sm text-[#65676b]">
                          You have not blocked any users.
                        </p>
                      ) : (
                        blockedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between rounded-md border border-[#dddfe2] p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-full bg-[#f2f3f5]">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <p className="text-sm font-semibold text-[#050505]">
                                {user.fullName}
                              </p>
                            </div>
                            <SecondaryButton
                              onClick={() => handleUnblockUser(user.id)}
                              loading={saving === `unblock-${user.id}`}
                            >
                              Unblock
                            </SecondaryButton>
                          </div>
                        ))
                      )}
                    </div>
                  </SettingsPanel>
                ) : null}

                {activeSection === "notifications" ? (
                  <SettingsPanel title="Notification preferences" icon="notifications_active">
                    <div className="divide-y divide-[#e5e7eb]">
                      <ToggleRow label="Posts" checked={settings.notificationSettings.posts} onChange={(value) => updateNotifications("posts", value)} />
                      <ToggleRow label="Comments" checked={settings.notificationSettings.comments} onChange={(value) => updateNotifications("comments", value)} />
                      <ToggleRow label="Friend requests" checked={settings.notificationSettings.friendRequests} onChange={(value) => updateNotifications("friendRequests", value)} />
                      <ToggleRow label="Messages" checked={settings.notificationSettings.messages} onChange={(value) => updateNotifications("messages", value)} />
                      <ToggleRow label="Email notifications" checked={settings.notificationSettings.email} onChange={(value) => updateNotifications("email", value)} />
                    </div>
                  </SettingsPanel>
                ) : null}

                {activeSection === "sessions" ? (
                  <SettingsPanel title="Login sessions" icon="devices">
                    <div className="mb-4 flex justify-end">
                      <SecondaryButton onClick={handleRevokeOtherSessions} loading={saving === "sessions"}>
                        Log out other sessions
                      </SecondaryButton>
                    </div>
                    <div className="space-y-3">
                      {activeSessions.length === 0 ? (
                        <p className="text-sm text-[#65676b]">No active sessions found.</p>
                      ) : (
                        activeSessions.map((session) => (
                          <div key={session.sessionId} className="rounded-md border border-[#dddfe2] p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {session.userAgent || "Unknown device"}
                                </p>
                                <p className="mt-1 text-xs text-[#65676b]">
                                  {session.ipAddress || "Unknown IP"} - Last active {formatDate(session.lastActiveAt)}
                                </p>
                              </div>
                              {session.isCurrent ? (
                                <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-xs font-semibold text-[#1877f2]">
                                  Current
                                </span>
                              ) : (
                                <SecondaryButton
                                  onClick={() => handleRevokeSession(session.sessionId)}
                                  loading={saving === `session-${session.sessionId}`}
                                >
                                  Log out
                                </SecondaryButton>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </SettingsPanel>
                ) : null}

                {activeSection === "privacy" ? (
                  <SettingsPanel title="Privacy settings" icon="shield">
                    <div className="grid gap-4">
                      <SelectField
                        label="Profile visibility"
                        value={settings.privacySettings.profileVisibility}
                        options={[
                          ["public", "Public"],
                          ["friends", "Friends"],
                          ["private", "Only me"],
                        ]}
                        onChange={(value) => updatePrivacy("profileVisibility", value)}
                      />
                      <SelectField
                        label="Who can message you"
                        value={settings.privacySettings.allowMessagesFrom}
                        options={[
                          ["everyone", "Everyone"],
                          ["friends", "Friends"],
                          ["none", "No one"],
                        ]}
                        onChange={(value) => updatePrivacy("allowMessagesFrom", value)}
                      />
                      <div className="divide-y divide-[#e5e7eb]">
                        <ToggleRow label="Show email on profile" checked={settings.privacySettings.showEmail} onChange={(value) => updatePrivacy("showEmail", value)} />
                        <ToggleRow label="Show phone on profile" checked={settings.privacySettings.showPhone} onChange={(value) => updatePrivacy("showPhone", value)} />
                        <ToggleRow label="Allow friend requests" checked={settings.privacySettings.allowFriendRequests} onChange={(value) => updatePrivacy("allowFriendRequests", value)} />
                        <ToggleRow label="Searchable by email" checked={settings.privacySettings.searchableByEmail} onChange={(value) => updatePrivacy("searchableByEmail", value)} />
                        <ToggleRow label="Searchable by phone" checked={settings.privacySettings.searchableByPhone} onChange={(value) => updatePrivacy("searchableByPhone", value)} />
                      </div>
                    </div>
                  </SettingsPanel>
                ) : null}

                {activeSection === "danger" ? (
                  <SettingsPanel title="Deactivate account" icon="warning">
                    <form className="grid gap-4" onSubmit={handleDeactivate}>
                      <p className="text-sm text-[#65676b]">
                        Deactivating your account prevents new logins and ends active sessions.
                      </p>
                      <PasswordField
                        label="Current password"
                        value={deactivatePassword}
                        onChange={setDeactivatePassword}
                      />
                      <button
                        type="submit"
                        disabled={saving === "deactivate"}
                        className="h-10 w-fit rounded-md bg-[#dc2626] px-4 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving === "deactivate" ? "Deactivating..." : "Deactivate account"}
                      </button>
                    </form>
                  </SettingsPanel>
                ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        </main>
      </div>
      <Toast message={notice} type="success" onClose={() => setNotice("")} />
    </>
  );
}

const SettingsPanel = ({ title, icon, children }) => (
  <div>
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </span>
      <h1 className="text-xl font-bold text-[#050505]">{title}</h1>
    </div>
    {children}
  </div>
);

const TextField = ({ label, type = "text", value, onChange }) => (
  <label className="grid gap-2 text-sm font-semibold text-[#050505]">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-md border border-[#ccd0d5] px-3 text-sm font-normal outline-none focus:border-[#1877f2]"
    />
  </label>
);

const PasswordField = (props) => <TextField {...props} type="password" />;

const ToggleRow = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-4 text-sm font-semibold text-[#050505]">
    <span>{label}</span>
    <input
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onChange(event.target.checked)}
      className="h-5 w-5 accent-[#1877f2]"
    />
  </label>
);

const SelectField = ({ label, value, options, onChange }) => (
  <label className="grid gap-2 text-sm font-semibold text-[#050505]">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-md border border-[#ccd0d5] bg-white px-3 text-sm font-normal outline-none focus:border-[#1877f2]"
    >
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  </label>
);

const PrimaryButton = ({ children, loading }) => (
  <button
    type="submit"
    disabled={loading}
    className="h-10 w-fit rounded-md bg-[#1877f2] px-4 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading ? "Saving..." : children}
  </button>
);

const SecondaryButton = ({ children, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="h-9 rounded-md border border-[#ccd0d5] px-3 text-sm font-semibold text-[#050505] hover:bg-[#f2f3f5] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading ? "Working..." : children}
  </button>
);

const formatDate = (value) => {
  if (!value) return "unknown";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};
