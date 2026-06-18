const SuccessMessage = ({ message, onClose }) => (
  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-green-600">Success</span>
      <p className="text-green-800 font-medium">{message}</p>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="text-green-400 hover:text-green-600 text-2xl"
      >
        x
      </button>
    )}
  </div>
);

export default SuccessMessage;
