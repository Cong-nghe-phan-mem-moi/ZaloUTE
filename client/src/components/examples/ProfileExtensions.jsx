import { useState } from 'react';

/**
 * EXTENSION EXAMPLES FOR PROFILE PAGE
 * 
 * This file shows how to extend the Profile Page components
 * with additional features and functionality.
 */

// ============================================
// EXAMPLE 1: Add Edit Profile Modal
// ============================================

export const EditProfileModal = ({ isOpen, onClose, onSave, currentData }) => {
  const [formData, setFormData] = useState(currentData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 max-w-md w-full">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-on-surface font-body-md text-body-md mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline rounded-lg text-on-surface"
            />
          </div>

          <div>
            <label className="block text-on-surface font-body-md text-body-md mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-outline rounded-lg text-on-surface"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 2: Add Loading Skeleton
// ============================================

export const ProfileSkeleton = () => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 animate-pulse">
      <div className="h-64 bg-surface-container rounded-lg mb-4"></div>
      <div className="h-12 bg-surface-container rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-surface-container rounded w-1/2 mb-8"></div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-container rounded"></div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 3: Add Search & Filter Friends
// ============================================

export const useFriendsFilter = (friends) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return { searchTerm, setSearchTerm, filteredFriends };
};

export const FriendsList = ({ friends, onSelectFriend }) => {
  const { searchTerm, setSearchTerm, filteredFriends } = useFriendsFilter(friends);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search friends..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-outline rounded-lg"
      />
      <div className="grid grid-cols-3 gap-4">
        {filteredFriends.map(friend => (
          <div
            key={friend.id}
            onClick={() => onSelectFriend(friend)}
            className="cursor-pointer hover:opacity-80 transition"
          >
            <img
              src={friend.image}
              alt={friend.name}
              className="w-full rounded-lg"
            />
            <p className="font-label-md text-label-md text-on-surface mt-2">{friend.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 4: Add Toast Notification
// ============================================

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  return { toasts, addToast };
};

export const ToastContainer = ({ toasts }) => {
  return (
    <div className="fixed bottom-8 left-8 space-y-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-white font-body-md text-body-md ${
            toast.type === 'success' ? 'bg-primary' : 'bg-error'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

// ============================================
// EXAMPLE 5: Add API Integration Hook
// ============================================

export const useProfileData = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async (userId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/profile/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userId, updates) => {
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Update failed');
      const data = await response.json();
      setProfileData(data);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return { profileData, isLoading, error, fetchProfile, updateProfile };
};

// ============================================
// EXAMPLE 6: Enhanced Profile Page with Features
// ============================================

export const EnhancedProfilePage = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const { toasts, addToast } = useToast();
  const { profileData, isLoading, error, updateProfile } = useProfileData();

  const handleSaveProfile = async (updatedData) => {
    const result = await updateProfile('userId', updatedData);
    if (result.success) {
      addToast('Profile updated successfully!', 'success');
    } else {
      addToast('Failed to update profile', 'error');
    }
  };

  const handleAddFriend = () => {
    addToast('Friend request sent!', 'success');
  };

  return (
    <div className="bg-surface-container-low min-h-screen">
      {/* Include existing components */}
      {isLoading ? (
        <ProfileSkeleton />
      ) : error ? (
        <div className="text-error font-body-md text-body-md">{error}</div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-outline-variant">
            {['posts', 'photos', 'videos'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-on-surface-variant'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === 'posts' && <PostsTab />}
            {activeTab === 'photos' && <PhotosTab />}
            {activeTab === 'videos' && <VideosTab />}
          </div>
        </>
      )}

      {/* Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        currentData={profileData}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  );
};

// Placeholder components for tabs
const PostsTab = () => <div>Posts content here</div>;
const PhotosTab = () => <div>Photos content here</div>;
const VideosTab = () => <div>Videos content here</div>;

// ============================================
// EXAMPLE 7: Custom Hooks for Profile State
// ============================================

export const useProfileState = (initialData) => {
  const [profile, setProfile] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const updateProfile = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } finally {
      setIsSaving(false);
    }
  };

  const resetProfile = (newData) => {
    setProfile(newData);
  };

  return { profile, updateProfile, saveChanges, isSaving, resetProfile };
};

// ============================================
// Usage Examples
// ============================================

/*
// In ProfilePage.jsx, add these:

import { useToast, ToastContainer } from './extensions';

const ProfilePage = () => {
  const { toasts, addToast } = useToast();

  const handleEditClick = () => {
    addToast('Opening edit mode...', 'success');
    // Open edit modal
  };

  return (
    <>
      <YourExistingComponents />
      <ToastContainer toasts={toasts} />
    </>
  );
};
*/
