import { CreatePost, PostList } from '../components/Post';
import { useSelector } from 'react-redux';

export default function Home() {
  const currentUser = useSelector((state) => state.user?.profile);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
          <p className="text-gray-600">Vui lòng đăng nhập</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Sidebar + Main */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Profile (Optional) */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
            <div className="text-center mb-4 pb-4 border-b">
              <img
                src={currentUser.avatar || '/default-avatar.png'}
                alt={currentUser.fullName}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
              />
              <h3 className="font-semibold text-gray-900">{currentUser.fullName}</h3>
              <p className="text-sm text-gray-500">{currentUser.email}</p>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition">
                👤 Trang cá nhân
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition">
                ⚙️ Cài đặt
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition text-red-600">
                🚪 Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <CreatePost
              onPostCreated={() => {
                // Could refresh feed here if needed
              }}
            />
          </div>
          <div className="mt-4">
            <PostList />
          </div>
        </div>

        {/* Right Sidebar - Suggestions (Optional) */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Gợi ý kết bạn</h3>
            <div className="space-y-3">
              {/* Suggestion items would go here */}
              <p className="text-sm text-gray-500 text-center py-8">
                Hiện không có gợi ý
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
