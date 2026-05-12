import React, { useState, useEffect } from 'react';

const EditProfileModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    phone: '',
    gender: 'male',
    address: '',
    dateOfBirth: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        bio: initialData.bio || '',
        phone: initialData.phone || '',
        gender: initialData.gender || 'male',
        address: initialData.address || '',
        dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : ''
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Edit Profile</h2>
          <button onClick={onClose} disabled={isSaving} className="text-on-surface-variant hover:bg-surface-variant rounded-full p-2 transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface-variant">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-surface-container rounded-xl px-4 py-2 border border-outline focus:border-primary outline-none transition-colors"
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface-variant">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full bg-surface-container rounded-xl px-4 py-2 border border-outline focus:border-primary outline-none transition-colors resize-none"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-on-surface-variant">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-surface-container rounded-xl px-4 py-2 border border-outline focus:border-primary outline-none transition-colors"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-on-surface-variant">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-surface-container rounded-xl px-4 py-2 border border-outline focus:border-primary outline-none transition-colors"
                disabled={isSaving}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-on-surface-variant">Birthday</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full bg-surface-container rounded-xl px-4 py-2 border border-outline focus:border-primary outline-none transition-colors"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-on-surface-variant">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-surface-container rounded-xl px-4 py-2 border border-outline focus:border-primary outline-none transition-colors"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 rounded-xl border border-outline text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 rounded-xl bg-primary text-on-primary font-medium hover:bg-on-primary-fixed-variant transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default EditProfileModal;
