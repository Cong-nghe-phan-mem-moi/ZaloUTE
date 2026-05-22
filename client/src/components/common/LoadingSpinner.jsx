const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin"></div>
      <div className="absolute inset-1 bg-white rounded-full"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;
