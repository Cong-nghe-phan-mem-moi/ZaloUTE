import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createPost } from "../../store/slices/postSlice";
import HomeAvatar from "./HomeAvatar";

const Composer = ({ profile }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.posts);
  const fileInputRef = useRef(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  const canSubmit = content.trim().length > 0 || files.length > 0;

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit || loading) {
      return;
    }

    const formData = new FormData();
    formData.append("content", content.trim());
    files.forEach((file) => formData.append("media", file));

    try {
      await dispatch(createPost(formData)).unwrap();
      setContent("");
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      // Error state is rendered from Redux.
    }
  };

  return (
    <section className="rounded bg-white p-7 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <HomeAvatar image={profile?.avatar} name={profile?.fullName} />
          <div>
            <p className="text-sm font-bold">
              {profile?.fullName || "Hexa Betania"}
            </p>
            <p className="flex items-center gap-1 text-xs text-[#6b7280]">
              <span className="material-symbols-outlined text-[14px]">
                public
              </span>
              Public
            </p>
          </div>
        </div>

        <textarea
          className="mt-7 min-h-20 w-full resize-none border-0 border-b border-[#d1d5db] bg-transparent pb-7 text-xl text-[#111827] outline-none placeholder:text-[#b0b4ba]"
          maxLength={5000}
          placeholder={`What's on your mind, ${
            profile?.fullName?.split(" ")?.slice(-1)?.[0] || "Hexania"
          } ?`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />

        <SelectedMediaPreview files={files} onRemove={handleRemoveFile} />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 grid grid-cols-4 items-center gap-2 text-sm font-semibold text-[#4b5563]">
          <ComposerAction
            icon="videocam"
            label="Live Video"
            color="text-rose-500"
            type="button"
          />
          <ComposerAction
            icon="photo_library"
            label="Photo / video"
            color="text-emerald-500"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          />
          <ComposerAction
            icon="mood"
            label="Feeling / Activity"
            color="text-yellow-500"
            type="button"
          />
          <div className="flex justify-end">
            {canSubmit ? (
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            ) : (
              <span className="material-symbols-outlined text-[#6b7280]">
                more_horiz
              </span>
            )}
          </div>
        </div>
      </form>
    </section>
  );
};

const SelectedMediaPreview = ({ files, onRemove }) => {
  if (files.length === 0) {
    return null;
  }

  const visibleFiles = files.slice(0, 4);
  const remainingCount = files.length - visibleFiles.length;
  const isSingleImage = files.length === 1 && files[0].type.startsWith("image/");

  if (isSingleImage) {
    const previewUrl = URL.createObjectURL(files[0]);

    return (
      <div className="mt-4 overflow-hidden rounded-lg bg-[#f2f3f5]">
        <div className="group relative">
          <img
            src={previewUrl}
            alt={files[0].name}
            className="max-h-[420px] w-full object-cover"
            onLoad={() => URL.revokeObjectURL(previewUrl)}
          />
          <RemovePreviewButton
            label={`Remove ${files[0].name}`}
            onClick={() => onRemove(0)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-1">
      {visibleFiles.map((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        const isImage = file.type.startsWith("image/");

        return (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className={`group relative overflow-hidden rounded-lg bg-[#f2f3f5] ${getPreviewTileClass(
              files.length,
              index,
            )}`}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={file.name}
                className="h-full w-full object-cover"
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="h-full w-full bg-black object-cover"
                onLoadedData={() => URL.revokeObjectURL(previewUrl)}
              />
            )}
            <RemovePreviewButton
              label={`Remove ${file.name}`}
              onClick={() => onRemove(index)}
            />
            {remainingCount > 0 && index === visibleFiles.length - 1 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-4xl font-bold text-white">
                +{remainingCount}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const getPreviewTileClass = (count, index) => {
  if (count === 3 && index === 0) {
    return "col-span-2 h-64";
  }

  return "h-48";
};

const RemovePreviewButton = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
    aria-label={label}
  >
    <span className="material-symbols-outlined text-[18px]">close</span>
  </button>
);

const ComposerAction = ({ icon, label, color, type = "button", onClick }) => (
  <button
    type={type}
    onClick={onClick}
    className="flex items-center justify-center gap-2 rounded-md py-2 hover:bg-[#f2f3f5]"
  >
    <span className={`material-symbols-outlined text-[20px] ${color}`}>
      {icon}
    </span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default Composer;
