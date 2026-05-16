const ErrorMessage = ({ message, onClose }) => (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-2xl">❌</span>
      <p className="text-red-800 font-medium">{message}</p>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="text-red-400 hover:text-red-600 text-2xl"
      >
        ×
      </button>
    )}
  </div>
);

export default ErrorMessage;
