import { useEffect, useState } from "react";

const formatErrorMessage = (error) => {
  if (!error) return "Failed to update profile. Please try again.";

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.join(" ");
  }

  return error.message || "Failed to update profile. Please try again.";
};

const getInitialFormData = (initialData) => ({
  fullName: initialData?.fullName || "",
  bio: initialData?.bio || "",
  phone: initialData?.phone || "",
  gender: initialData?.gender || "male",
  address: initialData?.address || "",
  dateOfBirth: initialData?.dateOfBirth
    ? initialData.dateOfBirth.split("T")[0]
    : "",
  socialLinks: {
    facebook: initialData?.socialLinks?.facebook || "",
    instagram: initialData?.socialLinks?.instagram || "",
    tiktok: initialData?.socialLinks?.tiktok || "",
    youtube: initialData?.socialLinks?.youtube || "",
    website: initialData?.socialLinks?.website || "",
  },
});

const EditProfileModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = window.setTimeout(() => {
      setFormData(getInitialFormData(initialData));
      setError(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-[29rem] overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
          <h2 className="text-[17px] font-bold text-[#111827]">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-[#6b7280] transition-colors hover:bg-[#f2f3f5] disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 p-2 text-[13px] text-rose-600">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#6b7280]">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#1877f2]"
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#6b7280]">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full resize-none rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#1877f2]"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#6b7280]">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#1877f2]"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#6b7280]">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#1877f2]"
                disabled={isSaving}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 rounded-lg border border-[#e5e7eb] p-3">
            <h3 className="text-sm font-bold text-[#111827]">Social Links</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["tiktok", "TikTok"],
                ["youtube", "YouTube"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-semibold text-[#6b7280]">
                    {label}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={formData.socialLinks[key]}
                    onChange={handleSocialChange}
                    className="w-full rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#1877f2]"
                    disabled={isSaving}
                    placeholder={`Enter ${label} link`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#6b7280]">
                Birthday
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#1877f2]"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#6b7280]">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#1877f2]"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-md border border-[#d1d5db] px-3 py-1.5 text-[13px] font-semibold text-[#111827] transition-colors hover:bg-[#f2f3f5] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#1877f2] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#166fe5] disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
