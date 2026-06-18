export default function ProfileImagePreviewModal({
  isOpen,
  image,
  title,
  onClose,
}) {
  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="max-h-full max-w-6xl overflow-hidden rounded-xl bg-[#111827] shadow-2xl">
        <div className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-white">
          {title}
        </div>
        <div className="flex items-center justify-center bg-black p-3">
          <img
            src={image}
            alt={title}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}