import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePost } from '../../store/slices/postSlice';
import ErrorMessage from '../common/ErrorMessage';

const EditPost = ({ post, isOpen, onClose, onPostUpdated }) => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.posts);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Initialize form with post data
  useEffect(() => {
    if (post && isOpen) {
      const timer = setTimeout(() => {
        setContent(post.content || '');
        setMedia(post.media || []);
        setPreviewUrls((post.media || []).map((m) => m.url));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [post, isOpen]);

  // Close modal and callback when update is successful
  useEffect(() => {
    if (message && message.includes('Chỉnh sửa')) {
      onPostUpdated?.();
      onClose();
    }
  }, [message, onPostUpdated, onClose]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = [];
    const newPreviewUrls = [];

    files.forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn (tối đa 10MB)');
        return;
      }

      const type = file.type.startsWith('image/') ? 'image' : 'video';

      newMedia.push({
        file,
        type,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviewUrls.push(event.target.result);
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
      };
      reader.readAsDataURL(file);
    });

    setMedia((prev) => [...prev, ...newMedia]);
  };

  const handleRemoveMedia = (index) => {
    // If it's an existing media (from server), just mark it
    const updatedMedia = media.filter((_, i) => i !== index);
    setMedia(updatedMedia);
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết');
      return;
    }

    if (content.length > 5000) {
      alert('Bài viết không được vượt quá 5000 ký tự');
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('content', content);

    // Append existing media info (for media to keep)
    const existingMedia = media.filter((item) => !item.file);
    if (existingMedia.length > 0) {
      formData.append('existingMedia', JSON.stringify(existingMedia));
    }

    // Only append new file objects (with 'file' property)
    media.forEach((item) => {
      if (item.file) {
        formData.append('media', item.file);
      }
    });

    dispatch(updatePost({ postId: post._id, formData }));
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa bài viết</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && <ErrorMessage message={error} />}

          {/* Content textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung bài viết..."
            maxLength={5000}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={6}
          />

          <div className="text-sm text-gray-500 mt-2">
            {content.length}/5000 ký tự
          </div>

          {/* Media preview */}
          {previewUrls.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Ảnh/Video</p>
              <div className="grid grid-cols-2 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {media[index]?.type === 'image' || url.startsWith('data:image') ? (
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={url}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add media button */}
          <div className="mt-4">
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
              <span>📎 Thêm ảnh/video</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật bài viết'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;
