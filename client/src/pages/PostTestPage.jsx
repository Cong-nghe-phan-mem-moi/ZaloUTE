import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUserProfile } from '../store/slices/userSlice';
import { CreatePost, PostList } from '../components/Post';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function PostTestPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.profile);
  const userLoading = useSelector((state) => state.user?.loading);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Fetch user profile if token exists
    if (token && !currentUser) {
      dispatch(fetchUserProfile());
    }
  }, [token, currentUser, dispatch]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <p className="text-gray-600 mb-4">Please log in first</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (userLoading || !currentUser) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto">
        <CreatePost
          onPostCreated={() => {
            console.log('Post created!');
          }}
        />
        <PostList />
      </div>
    </div>
  );
}
