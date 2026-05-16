import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPost, clearMessage, clearError } from '../../store/slices/postSlice';
import Toast from '../common/Toast';

const CreatePost = ({ onPostCreated }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.profile);
  const { loading, message, error } = useSelector((state) => state.posts);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  // Reset form when message is set (indicates successful post)
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setContent('');
        setMedia([]);
        setPreviewUrls([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onPostCreated?.();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [message, onPostCreated]);

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

      // Determine type
      const type = file.type.startsWith('image/') ? 'image' : 'video';

      newMedia.push({
        file,
        type,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviewUrls.push(event.target.result);
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
      };
      reader.readAsDataURL(file);
    });

    setMedia([...media, ...newMedia]);
  };

  const handleRemoveMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết');
      return;
    }

    if (content.length > 5000) {
      alert('Bài viết không được vượt quá 5000 ký tự');
      return;
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('content', content);

    // Add media files
    media.forEach((item) => {
      formData.append('media', item.file);
    });

    dispatch(createPost(formData));
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 text-center text-gray-500">
        <p>Vui lòng đăng nhập để tạo bài viết</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
        <img
          src={currentUser?.avatar || '/default-avatar.png'}
          alt={currentUser?.fullName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <input
          type="text"
          placeholder={`${currentUser?.fullName}, bạn đang nghĩ gì thế?`}
          onClick={() => document.getElementById('content-input').focus()}
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
          readOnly
        />
      </div>

      {/* Messages */}
      {error && <Toast message={error} type="error" onClose={() => dispatch(clearError())} />}
      {message && <Toast message={message} type="success" onClose={() => dispatch(clearMessage())} />}

      {/* Content Area */}
      <textarea
        id="content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Bạn đang nghĩ gì thế?"
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
        rows={3}
        maxLength={5000}
      />

      {/* Character count */}
      <div className="text-right text-xs text-gray-500 mb-4">
        {content.length}/5000
      </div>

      {/* Media Preview */}
      {previewUrls.length > 0 && (
        <div className="mb-4 grid gap-2 grid-cols-2 md:grid-cols-3">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden bg-gray-200 group"
            >
              {media[index]?.type === 'image' ? (
                <img
                  src={url}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <video
                  src={url}
                  className="w-full h-32 object-cover"
                />
              )}
              <button
                onClick={() => handleRemoveMedia(index)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Thêm ảnh/video"
          >
            <span className="text-lg">🖼️</span>
            <span className="hidden sm:inline">Ảnh/Video</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Cảm xúc">
            <span className="text-lg">😊</span>
            <span className="hidden sm:inline">Cảm xúc</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Vị trí">
            <span className="text-lg">📍</span>
            <span className="hidden sm:inline">Vị trí</span>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="px-8 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đăng...' : 'Đăng'}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
